from __future__ import annotations

import hashlib
import re

from ..schemas import (
    AuditReadySummary,
    DefectTemplate,
    DomainType,
    GenerateQAPackageRequest,
    GenerateQAPackageResponse,
    GenerateRequest,
    ManualTestCase,
    QADefectTemplate,
    QARegressionChecklistItem,
    QARiskNote,
    QAScenario,
    QATestCase,
    QATraceabilityItem,
    RegressionChecklistItem,
    RiskLevel,
    RiskNote,
    RequirementOutputBundle,
    ScenarioItem,
    TraceabilityItem,
)

STOPWORDS = {
    "shall",
    "must",
    "should",
    "system",
    "platform",
    "project",
    "application",
    "workflow",
    "automation",
    "assistant",
    "review",
    "quality",
    "using",
    "within",
    "across",
    "between",
    "where",
    "while",
    "after",
    "before",
    "allow",
    "allows",
    "record",
    "records",
    "generate",
    "generated",
    "store",
    "stores",
}

DOMAIN_LABELS = {
    DomainType.workflow_automation: "workflow automation",
    DomainType.qa_operations: "QA and release operations",
}

RISK_ORDER = {
    "low": 0,
    "medium": 1,
    "high": 2,
    "Low": 0,
    "Medium": 1,
    "High": 2,
    "Critical": 3,
}

RISK_LABELS = {
    RiskLevel.low: "Low",
    RiskLevel.medium: "Medium",
    RiskLevel.high: "High",
}


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _requirement_reference(text: str) -> str:
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:6].upper()
    return f"REQ-{digest}"


def _focus_terms(text: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z-]{3,}", text.lower())
    focus: list[str] = []
    for token in tokens:
        if token in STOPWORDS or token in focus:
            continue
        focus.append(token)
    return focus[:8]


def _focus_label(terms: list[str]) -> str:
    if not terms:
        return "workflow package"

    if len(terms) == 1:
        return terms[0].replace("-", " ")

    return f"{terms[0].replace('-', ' ')} {terms[1].replace('-', ' ')}"


def _sentence_snapshot(text: str, word_limit: int = 28) -> str:
    words = text.split()
    if len(words) <= word_limit:
        return text
    return f"{' '.join(words[:word_limit]).rstrip(',.;:')}..."


def _domain_label(request: GenerateRequest, normalized_text: str) -> str:
    if request.domain_context:
        return request.domain_context.strip()

    lowered = normalized_text.lower()
    if any(keyword in lowered for keyword in {"qa", "test", "release", "regression"}):
        return DOMAIN_LABELS[DomainType.qa_operations]
    return DOMAIN_LABELS[DomainType.workflow_automation]


def _max_risk_level(base_level: str, requested_level: RiskLevel) -> str:
    requested_label = RISK_LABELS[requested_level]
    if RISK_ORDER[requested_label] > RISK_ORDER.get(base_level, 0):
        return requested_label
    return base_level


def _priority_for_requested_risk(base_priority: str, requested_level: RiskLevel, case_index: int) -> str:
    if requested_level is RiskLevel.high:
        return "Critical" if case_index < 2 else "High"
    if requested_level is RiskLevel.medium:
        return "High" if case_index < 3 else base_priority
    return base_priority


def _defect_severity(requested_level: RiskLevel) -> str:
    if requested_level is RiskLevel.high:
        return "Critical"
    if requested_level is RiskLevel.medium:
        return "High"
    return "Medium"


def _audit_summary(
    summary: AuditReadySummary,
    requirement_reference: str,
    domain: DomainType,
    risk_level: RiskLevel,
) -> str:
    domain_label = DOMAIN_LABELS[domain]
    risk_label = RISK_LABELS[risk_level].lower()
    return (
        f"{requirement_reference} was assessed as a {risk_label}-risk {domain_label} requirement. "
        f"{summary.test_approach} Release view: {summary.release_recommendation}"
    )


def generate_outputs(request: GenerateRequest) -> RequirementOutputBundle:
    normalized = _normalize_text(request.requirement_text)
    requirement_reference = _requirement_reference(normalized)
    focus_terms = _focus_terms(normalized)
    focus_label = _focus_label(focus_terms)
    snapshot = _sentence_snapshot(normalized)
    domain_label = _domain_label(request, normalized)
    product_label = request.product_name or "TraceMind AI"

    manual_test_cases = [
        ManualTestCase(
            case_id="TC-01",
            title=f"Validate the primary {focus_label} workflow",
            objective="Confirm the expected happy path completes successfully and produces a structured, reviewable result.",
            preconditions=[
                "The local demo environment is running with mock data.",
                "A representative input matching the requirement is available.",
                "The workflow can save or display the generated output package.",
            ],
            steps=[
                "Submit a complete requirement through the workflow form or API endpoint.",
                "Review the generated package for classification, routing, and summary content.",
                "Confirm the final result matches the intended requirement outcome.",
            ],
            expected_result="The workflow completes without errors, produces the expected structured package, and clearly communicates the final status.",
            priority="High",
            trace_reference=requirement_reference,
        ),
        ManualTestCase(
            case_id="TC-02",
            title="Route incomplete or ambiguous input to human review",
            objective="Ensure the workflow avoids overconfident automation when the requirement is missing detail or contains conflicting intent.",
            preconditions=[
                "The tester has an intentionally incomplete or ambiguous sample requirement.",
                "Fallback or human-review behavior is visible in the UI or response payload.",
            ],
            steps=[
                "Submit a requirement with missing acceptance criteria or vague routing language.",
                "Observe the generated risk notes, issue template, and workflow guidance.",
                "Verify the package recommends review instead of pretending certainty.",
            ],
            expected_result="Low-confidence or incomplete input is surfaced clearly, and the generated artifacts bias toward reviewable follow-up rather than silent assumptions.",
            priority="High",
            trace_reference=requirement_reference,
        ),
        ManualTestCase(
            case_id="TC-03",
            title="Verify high-risk exception handling",
            objective="Check that escalations, blockers, and exception paths are visible in the artifact set for stakeholder review.",
            preconditions=[
                "A requirement variant that includes high-risk routing, approvals, or exception handling is available.",
                "The tester can inspect negative scenarios and risk notes.",
            ],
            steps=[
                "Submit a requirement that includes exception states, approval gates, or risky automation steps.",
                "Open the negative scenarios and risk sections of the generated package.",
                "Confirm the workflow highlights guardrails, human checkpoints, and failure visibility.",
            ],
            expected_result="The output package shows where automation should stop, when humans should review, and what evidence should be collected.",
            priority="High",
            trace_reference=requirement_reference,
        ),
        ManualTestCase(
            case_id="TC-04",
            title="Confirm auditability and export readiness",
            objective="Ensure the generated package is easy to review, export, and present during a demo or recruiter walkthrough.",
            preconditions=[
                "The frontend export controls or backend export endpoints are available.",
                "At least one successful package has been generated.",
            ],
            steps=[
                "Generate a workflow package from the sample requirement.",
                "Use the available TXT and CSV export actions.",
                "Review the exported content for readability, completeness, and consistent naming.",
            ],
            expected_result="Exported artifacts are generated successfully and preserve the same requirement reference, workflow framing, and QA structure shown in the UI.",
            priority="Medium",
            trace_reference=requirement_reference,
        ),
        ManualTestCase(
            case_id="TC-05",
            title="Verify repeat-run stability",
            objective="Check that repeated runs with similar inputs remain consistent enough for demo, QA, and documentation workflows.",
            preconditions=[
                "The same requirement can be submitted multiple times.",
                "A tester can compare outputs between runs.",
            ],
            steps=[
                "Run the same requirement more than once.",
                "Compare requirement references, section ordering, and overall content structure.",
                "Review differences for unnecessary drift or broken formatting.",
            ],
            expected_result="The workflow remains stable across repeat runs and keeps its artifacts presentation-ready.",
            priority="Medium",
            trace_reference=requirement_reference,
        ),
    ]

    edge_cases = [
        ScenarioItem(
            scenario_id="EC-01",
            title="Duplicate submission during review",
            description="Submit the same requirement twice in close succession and confirm the workflow stays readable and does not imply contradictory status.",
            rationale="Duplicate actions are common in live demos and real operations, especially when a user is unsure whether the first request finished.",
        ),
        ScenarioItem(
            scenario_id="EC-02",
            title="Partially complete requirement input",
            description="Provide a requirement with clear intent but missing acceptance criteria, ownership notes, or edge-case detail.",
            rationale="A professional workflow tool should still produce useful review artifacts when requirements are messy, while making gaps explicit.",
        ),
        ScenarioItem(
            scenario_id="EC-03",
            title="Concurrent reviewer context changes",
            description="Simulate a run where workflow context changes mid-review, such as a renamed handoff queue, updated priority rule, or shifted owner.",
            rationale="Operational automation often fails around state changes rather than the normal happy path.",
        ),
        ScenarioItem(
            scenario_id="EC-04",
            title="Export after a follow-up edit",
            description="Change the requirement, regenerate the package, and verify the exported artifacts reflect the latest version cleanly.",
            rationale="Export drift can confuse stakeholders if the UI and exported package do not stay aligned.",
        ),
    ]

    negative_scenarios = [
        ScenarioItem(
            scenario_id="NEG-01",
            title="Attempt to bypass human review guidance",
            description="Submit a requirement that asks the workflow to auto-approve or skip review for high-risk cases.",
            rationale="Guardrails should remain visible even when the input tries to overrule them.",
        ),
        ScenarioItem(
            scenario_id="NEG-02",
            title="Unsupported instruction or prompt-style override",
            description="Include extra instructions intended to force a specific outcome regardless of missing data or risk context.",
            rationale="AI-assisted tools should surface uncertainty and keep review structure intact instead of blindly following override language.",
        ),
        ScenarioItem(
            scenario_id="NEG-03",
            title="Unauthorized or stale status update",
            description="Simulate a case where a downstream system or user tries to rely on an outdated package after the requirement changed.",
            rationale="Stale workflow artifacts can create bad handoffs and false release confidence.",
        ),
        ScenarioItem(
            scenario_id="NEG-04",
            title="Broken export or downstream formatting",
            description="Force a long or oddly formatted requirement through the flow and inspect whether exports remain readable.",
            rationale="Presentation quality matters in portfolio demos, and formatting failures can make otherwise good logic look unreliable.",
        ),
    ]

    risk_notes = [
        RiskNote(
            note_id="RISK-01",
            risk_area="Automation guardrails",
            risk_level="High",
            rationale="The workflow should surface human checkpoints whenever the requirement is ambiguous, high-impact, or missing critical acceptance detail.",
            testing_focus="Probe incomplete, conflicting, and override-style inputs to confirm the generated package still recommends review where appropriate.",
            evidence_expected="Risk notes, negative scenarios, and issue-template language that explicitly calls out manual review needs.",
        ),
        RiskNote(
            note_id="RISK-02",
            risk_area="Auditability and traceability",
            risk_level="High",
            rationale="Recruiters and stakeholders should be able to understand how one requirement turned into test coverage, risk notes, and presentation-ready outputs.",
            testing_focus="Verify requirement references, traceability rows, export names, and section ordering across multiple runs.",
            evidence_expected="Consistent requirement IDs, readable exports, and traceability entries mapped to test artifacts.",
        ),
        RiskNote(
            note_id="RISK-03",
            risk_area="Data quality and missing context",
            risk_level="Medium",
            rationale="Weak input quality can make automation look stronger than it really is unless the workflow highlights uncertainty clearly.",
            testing_focus="Use vague or partially complete inputs and confirm the package communicates assumptions, gaps, and follow-up actions.",
            evidence_expected="Explicit notes about missing acceptance criteria, fallback guidance, or reviewer handoff suggestions.",
        ),
        RiskNote(
            note_id="RISK-04",
            risk_area="Presentation and regression stability",
            risk_level="Medium",
            rationale="A strong portfolio project should stay stable under repeat runs and preserve polished formatting in UI and exports.",
            testing_focus="Re-run the same requirement, compare outputs, and inspect formatting in TXT and CSV artifacts.",
            evidence_expected="Repeat-run comparisons, export samples, and confirmation that no sections regress or disappear.",
        ),
    ]

    traceability_matrix = [
        TraceabilityItem(
            mapping_id="TM-01",
            requirement_reference=requirement_reference,
            artifact_reference="TC-01",
            coverage_type="Primary workflow validation",
            verification_method="Manual execution with a representative requirement",
            risk_level="High",
        ),
        TraceabilityItem(
            mapping_id="TM-02",
            requirement_reference=requirement_reference,
            artifact_reference="TC-02 / EC-02",
            coverage_type="Ambiguity and incomplete-input handling",
            verification_method="Manual run with missing or low-confidence requirement details",
            risk_level="High",
        ),
        TraceabilityItem(
            mapping_id="TM-03",
            requirement_reference=requirement_reference,
            artifact_reference="TC-03 / NEG-01 / NEG-02",
            coverage_type="Guardrails and exception handling",
            verification_method="Risk-focused review of override attempts and human-review triggers",
            risk_level="High",
        ),
        TraceabilityItem(
            mapping_id="TM-04",
            requirement_reference=requirement_reference,
            artifact_reference="TC-04 / EC-04 / NEG-04",
            coverage_type="Export and presentation quality",
            verification_method="TXT and CSV export verification",
            risk_level="Medium",
        ),
        TraceabilityItem(
            mapping_id="TM-05",
            requirement_reference=requirement_reference,
            artifact_reference="TC-05 / EC-01 / NEG-03",
            coverage_type="Repeat-run and stale-state stability",
            verification_method="Duplicate submission and version consistency checks",
            risk_level="Medium",
        ),
    ]

    defect_report_template = DefectTemplate(
        title=f"[{requirement_reference}] {focus_label.title()} workflow output differs from expected behavior",
        summary=f"Observed a mismatch in generated workflow guidance, risk framing, traceability, or export content for {snapshot}",
        environment=f"Local TraceMind AI demo environment using mock data for {product_label} in a {domain_label} context",
        steps_to_reproduce=[
            "Open the TraceMind AI workflow generator.",
            "Submit the requirement or sample payload that triggers the issue.",
            "Capture the visible output, export result, and any missing or incorrect sections.",
        ],
        expected_result="The workflow produces a structured package, applies sensible guardrails, keeps output readable, and supports clean demo presentation.",
        actual_result="Document the exact mismatch in routing, risk notes, traceability, export output, or UI presentation.",
        severity="High until workflow accuracy and reviewer impact are clarified",
        regulatory_impact="Assess impact to workflow accuracy, reviewer visibility, release confidence, and stakeholder trust.",
        attachments_to_collect=[
            "Requirement text or sample payload",
            "Screenshot of the visible UI state",
            "TXT or CSV export sample",
            "Requirement reference",
            "Notes describing expected versus actual output",
        ],
    )

    regression_checklist = [
        RegressionChecklistItem(
            check_id="REG-01",
            area="Core generation flow",
            verification="Run the sample requirement and confirm all sections render with clean formatting and expected ordering.",
            owner_hint="Demo owner",
            evidence="Screenshot of the completed dashboard or saved output",
        ),
        RegressionChecklistItem(
            check_id="REG-02",
            area="Ambiguity handling",
            verification="Use an incomplete requirement and confirm the package still recommends reviewable next steps instead of overstating certainty.",
            owner_hint="QA reviewer",
            evidence="Risk-note and negative-scenario capture",
        ),
        RegressionChecklistItem(
            check_id="REG-03",
            area="Exports",
            verification="Export TXT and CSV artifacts and confirm naming, content order, and readability stay consistent.",
            owner_hint="Demo owner",
            evidence="Saved export files or screenshots",
        ),
        RegressionChecklistItem(
            check_id="REG-04",
            area="Repeat-run stability",
            verification="Re-run the same requirement and compare output consistency across the visible sections.",
            owner_hint="QA reviewer",
            evidence="Comparison notes between runs",
        ),
        RegressionChecklistItem(
            check_id="REG-05",
            area="Presentation polish",
            verification="Review the page in desktop and mobile layouts to confirm the output remains legible and demo-ready.",
            owner_hint="Frontend reviewer",
            evidence="Responsive screenshots or screen recording",
        ),
    ]

    audit_ready_test_summary = AuditReadySummary(
        scope=f"Validation of {requirement_reference} for {snapshot}",
        test_approach="Risk-based review covering primary workflow behavior, ambiguity handling, manual-review guardrails, export quality, and repeat-run stability.",
        evidence_package=[
            "Executed manual test cases with notes",
            "Requirement-to-test traceability matrix",
            "Negative and edge scenario observations",
            "Export samples used for portfolio presentation",
            "Open issues and regression checklist results",
        ],
        residual_risk_statement="Residual risk is acceptable only when ambiguous inputs remain clearly visible and no export or presentation gaps reduce reviewer confidence.",
        release_recommendation="Recommend portfolio-ready use once the local run path, export flow, and responsive presentation checks pass.",
    )

    return RequirementOutputBundle(
        requirement_reference=requirement_reference,
        requirement_snapshot=snapshot,
        manual_test_cases=manual_test_cases,
        edge_cases=edge_cases,
        negative_test_scenarios=negative_scenarios,
        risk_based_testing_notes=risk_notes,
        traceability_matrix=traceability_matrix,
        defect_report_template=defect_report_template,
        regression_checklist=regression_checklist,
        audit_ready_test_summary=audit_ready_test_summary,
    )


def generate_qa_package(request: GenerateQAPackageRequest) -> GenerateQAPackageResponse:
    base_outputs = generate_outputs(
        GenerateRequest(
            domain_context=DOMAIN_LABELS[request.domain],
            requirement_text=request.requirement,
        )
    )

    test_cases = [
        QATestCase(
            id=item.case_id,
            title=item.title,
            objective=item.objective,
            preconditions=item.preconditions,
            steps=item.steps,
            expected_result=item.expected_result,
            priority=_priority_for_requested_risk(item.priority, request.risk_level, index),
        )
        for index, item in enumerate(base_outputs.manual_test_cases)
    ]

    edge_cases = [
        QAScenario(
            id=item.scenario_id,
            title=item.title,
            description=item.description,
            rationale=item.rationale,
        )
        for item in base_outputs.edge_cases
    ]

    negative_tests = [
        QAScenario(
            id=item.scenario_id,
            title=item.title,
            description=item.description,
            rationale=item.rationale,
        )
        for item in base_outputs.negative_test_scenarios
    ]

    traceability_matrix = [
        QATraceabilityItem(
            requirement_id=item.requirement_reference,
            test_artifact=item.artifact_reference,
            coverage_type=item.coverage_type,
            verification_method=item.verification_method,
            risk_level=_max_risk_level(item.risk_level, request.risk_level),
        )
        for item in base_outputs.traceability_matrix
    ]

    defect_template = QADefectTemplate(
        title=base_outputs.defect_report_template.title,
        summary=base_outputs.defect_report_template.summary,
        environment=base_outputs.defect_report_template.environment,
        steps_to_reproduce=base_outputs.defect_report_template.steps_to_reproduce,
        expected_result=base_outputs.defect_report_template.expected_result,
        actual_result=base_outputs.defect_report_template.actual_result,
        severity=_defect_severity(request.risk_level),
        regulatory_impact=base_outputs.defect_report_template.regulatory_impact,
        attachments=base_outputs.defect_report_template.attachments_to_collect,
    )

    risk_notes = [
        QARiskNote(
            area=item.risk_area,
            level=_max_risk_level(item.risk_level, request.risk_level),
            note=item.rationale,
            testing_focus=item.testing_focus,
            evidence_expected=item.evidence_expected,
        )
        for item in base_outputs.risk_based_testing_notes
    ]

    regression_checklist = [
        QARegressionChecklistItem(
            id=item.check_id,
            area=item.area,
            check=item.verification,
            owner_hint=item.owner_hint,
            evidence=item.evidence,
        )
        for item in base_outputs.regression_checklist
    ]

    return GenerateQAPackageResponse(
        test_cases=test_cases,
        edge_cases=edge_cases,
        negative_tests=negative_tests,
        traceability_matrix=traceability_matrix,
        defect_template=defect_template,
        risk_notes=risk_notes,
        regression_checklist=regression_checklist,
        audit_summary=_audit_summary(
            base_outputs.audit_ready_test_summary,
            base_outputs.requirement_reference,
            request.domain,
            request.risk_level,
        ),
    )
