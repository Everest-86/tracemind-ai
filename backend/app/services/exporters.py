from __future__ import annotations

import csv
from io import StringIO

from ..schemas import RequirementAnalysis


def build_csv_report(analysis: RequirementAnalysis) -> str:
    outputs = analysis.outputs
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["section", "reference", "title", "details", "priority_or_risk", "trace_reference"])

    for test_case in outputs.manual_test_cases:
        writer.writerow(
            [
                "manual_test_case",
                test_case.case_id,
                test_case.title,
                f"Objective: {test_case.objective} | Expected: {test_case.expected_result}",
                test_case.priority,
                test_case.trace_reference,
            ]
        )

    for item in outputs.edge_cases:
        writer.writerow(
            [
                "edge_case",
                item.scenario_id,
                item.title,
                f"{item.description} | Rationale: {item.rationale}",
                "Medium",
                outputs.requirement_reference,
            ]
        )

    for item in outputs.negative_test_scenarios:
        writer.writerow(
            [
                "negative_test_scenario",
                item.scenario_id,
                item.title,
                f"{item.description} | Rationale: {item.rationale}",
                "High",
                outputs.requirement_reference,
            ]
        )

    for note in outputs.risk_based_testing_notes:
        writer.writerow(
            [
                "risk_note",
                note.note_id,
                note.risk_area,
                f"{note.rationale} | Focus: {note.testing_focus} | Evidence: {note.evidence_expected}",
                note.risk_level,
                outputs.requirement_reference,
            ]
        )

    for item in outputs.traceability_matrix:
        writer.writerow(
            [
                "traceability_matrix",
                item.mapping_id,
                item.artifact_reference,
                f"{item.coverage_type} | {item.verification_method}",
                item.risk_level,
                item.requirement_reference,
            ]
        )

    for item in outputs.regression_checklist:
        writer.writerow(
            [
                "regression_checklist",
                item.check_id,
                item.area,
                f"{item.verification} | Evidence: {item.evidence}",
                item.owner_hint,
                outputs.requirement_reference,
            ]
        )

    defect = outputs.defect_report_template
    writer.writerow(
        [
            "defect_report_template",
            outputs.requirement_reference,
            defect.title,
            f"{defect.summary} | Expected: {defect.expected_result} | Actual: {defect.actual_result}",
            defect.severity,
            outputs.requirement_reference,
        ]
    )

    summary = outputs.audit_ready_test_summary
    writer.writerow(
        [
            "audit_ready_summary",
            outputs.requirement_reference,
            "Audit-ready test summary",
            f"{summary.scope} | Approach: {summary.test_approach} | Release: {summary.release_recommendation}",
            "Review",
            outputs.requirement_reference,
        ]
    )

    return buffer.getvalue()


def build_txt_report(analysis: RequirementAnalysis) -> str:
    outputs = analysis.outputs
    defect = outputs.defect_report_template
    summary = outputs.audit_ready_test_summary

    lines = [
        "TraceMind AI",
        "QA Output Package",
        "",
        f"Analysis ID: {analysis.id}",
        f"Created At: {analysis.created_at}",
        f"Product Name: {analysis.product_name or 'Not specified'}",
        f"Domain Context: {analysis.domain_context or 'Not specified'}",
        f"Requirement Reference: {outputs.requirement_reference}",
        f"Requirement Snapshot: {outputs.requirement_snapshot}",
        "",
        "Manual Test Cases",
        "-----------------",
    ]

    for test_case in outputs.manual_test_cases:
        lines.extend(
            [
                f"{test_case.case_id} | {test_case.title} | Priority: {test_case.priority}",
                f"Objective: {test_case.objective}",
                f"Expected Result: {test_case.expected_result}",
                "Steps:",
                *[f"  - {step}" for step in test_case.steps],
                "",
            ]
        )

    lines.extend(["Edge Cases", "----------"])
    for item in outputs.edge_cases:
        lines.extend([f"{item.scenario_id} | {item.title}", item.description, f"Rationale: {item.rationale}", ""])

    lines.extend(["Negative Test Scenarios", "-----------------------"])
    for item in outputs.negative_test_scenarios:
        lines.extend([f"{item.scenario_id} | {item.title}", item.description, f"Rationale: {item.rationale}", ""])

    lines.extend(["Risk-Based Testing Notes", "------------------------"])
    for note in outputs.risk_based_testing_notes:
        lines.extend(
            [
                f"{note.note_id} | {note.risk_area} | {note.risk_level}",
                f"Rationale: {note.rationale}",
                f"Testing Focus: {note.testing_focus}",
                f"Evidence Expected: {note.evidence_expected}",
                "",
            ]
        )

    lines.extend(["Traceability Matrix", "-------------------"])
    for item in outputs.traceability_matrix:
        lines.extend(
            [
                f"{item.mapping_id} | {item.requirement_reference} -> {item.artifact_reference}",
                f"Coverage: {item.coverage_type}",
                f"Verification: {item.verification_method}",
                f"Risk Level: {item.risk_level}",
                "",
            ]
        )

    lines.extend(
        [
            "Defect Report Template",
            "----------------------",
            f"Title: {defect.title}",
            f"Summary: {defect.summary}",
            f"Environment: {defect.environment}",
            f"Expected Result: {defect.expected_result}",
            f"Actual Result: {defect.actual_result}",
            f"Severity: {defect.severity}",
            f"Regulatory Impact: {defect.regulatory_impact}",
            "Attachments to Collect:",
            *[f"  - {attachment}" for attachment in defect.attachments_to_collect],
            "",
            "Regression Checklist",
            "--------------------",
        ]
    )

    for item in outputs.regression_checklist:
        lines.extend(
            [
                f"{item.check_id} | {item.area}",
                f"Verification: {item.verification}",
                f"Owner Hint: {item.owner_hint}",
                f"Evidence: {item.evidence}",
                "",
            ]
        )

    lines.extend(
        [
            "Audit-Ready Test Summary",
            "------------------------",
            f"Scope: {summary.scope}",
            f"Approach: {summary.test_approach}",
            "Evidence Package:",
            *[f"  - {entry}" for entry in summary.evidence_package],
            f"Residual Risk Statement: {summary.residual_risk_statement}",
            f"Release Recommendation: {summary.release_recommendation}",
        ]
    )

    return "\n".join(lines)
