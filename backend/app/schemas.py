from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class GenerateRequest(BaseModel):
    product_name: str | None = Field(default=None, max_length=120)
    domain_context: str | None = Field(default=None, max_length=120)
    requirement_text: str = Field(min_length=25, max_length=6000)


class ManualTestCase(BaseModel):
    case_id: str
    title: str
    objective: str
    preconditions: list[str]
    steps: list[str]
    expected_result: str
    priority: str
    trace_reference: str


class ScenarioItem(BaseModel):
    scenario_id: str
    title: str
    description: str
    rationale: str


class RiskNote(BaseModel):
    note_id: str
    risk_area: str
    risk_level: str
    rationale: str
    testing_focus: str
    evidence_expected: str


class TraceabilityItem(BaseModel):
    mapping_id: str
    requirement_reference: str
    artifact_reference: str
    coverage_type: str
    verification_method: str
    risk_level: str


class DefectTemplate(BaseModel):
    title: str
    summary: str
    environment: str
    steps_to_reproduce: list[str]
    expected_result: str
    actual_result: str
    severity: str
    regulatory_impact: str
    attachments_to_collect: list[str]


class RegressionChecklistItem(BaseModel):
    check_id: str
    area: str
    verification: str
    owner_hint: str
    evidence: str


class AuditReadySummary(BaseModel):
    scope: str
    test_approach: str
    evidence_package: list[str]
    residual_risk_statement: str
    release_recommendation: str


class RequirementOutputBundle(BaseModel):
    requirement_reference: str
    requirement_snapshot: str
    manual_test_cases: list[ManualTestCase]
    edge_cases: list[ScenarioItem]
    negative_test_scenarios: list[ScenarioItem]
    risk_based_testing_notes: list[RiskNote]
    traceability_matrix: list[TraceabilityItem]
    defect_report_template: DefectTemplate
    regression_checklist: list[RegressionChecklistItem]
    audit_ready_test_summary: AuditReadySummary


class RequirementAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: str
    product_name: str | None = None
    domain_context: str | None = None
    requirement_text: str
    outputs: RequirementOutputBundle


class AnalysisListItem(BaseModel):
    id: int
    created_at: str
    product_name: str | None = None
    requirement_excerpt: str
    requirement_reference: str


class DomainType(str, Enum):
    workflow_automation = "workflow_automation"
    qa_operations = "qa_operations"


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class GenerateQAPackageRequest(BaseModel):
    requirement: str = Field(min_length=20, max_length=6000)
    domain: DomainType
    risk_level: RiskLevel


class QATestCase(BaseModel):
    id: str
    title: str
    objective: str
    preconditions: list[str]
    steps: list[str]
    expected_result: str
    priority: str


class QAScenario(BaseModel):
    id: str
    title: str
    description: str
    rationale: str


class QATraceabilityItem(BaseModel):
    requirement_id: str
    test_artifact: str
    coverage_type: str
    verification_method: str
    risk_level: str


class QADefectTemplate(BaseModel):
    title: str
    summary: str
    environment: str
    steps_to_reproduce: list[str]
    expected_result: str
    actual_result: str
    severity: str
    regulatory_impact: str
    attachments: list[str]


class QARiskNote(BaseModel):
    area: str
    level: str
    note: str
    testing_focus: str
    evidence_expected: str


class QARegressionChecklistItem(BaseModel):
    id: str
    area: str
    check: str
    owner_hint: str
    evidence: str


class GenerateQAPackageResponse(BaseModel):
    test_cases: list[QATestCase]
    edge_cases: list[QAScenario]
    negative_tests: list[QAScenario]
    traceability_matrix: list[QATraceabilityItem]
    defect_template: QADefectTemplate
    risk_notes: list[QARiskNote]
    regression_checklist: list[QARegressionChecklistItem]
    audit_summary: str
