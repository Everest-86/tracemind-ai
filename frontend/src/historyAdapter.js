export function analysisToDashboardData(analysis) {
  const { outputs } = analysis
  const summary = outputs.audit_ready_test_summary

  return {
    test_cases: outputs.manual_test_cases.map((item) => ({
      id: item.case_id,
      title: item.title,
      objective: item.objective,
      preconditions: item.preconditions,
      steps: item.steps,
      expected_result: item.expected_result,
      priority: item.priority,
    })),
    edge_cases: outputs.edge_cases.map((item) => ({
      id: item.scenario_id,
      title: item.title,
      description: item.description,
      rationale: item.rationale,
    })),
    negative_tests: outputs.negative_test_scenarios.map((item) => ({
      id: item.scenario_id,
      title: item.title,
      description: item.description,
      rationale: item.rationale,
    })),
    traceability_matrix: outputs.traceability_matrix.map((item) => ({
      requirement_id: item.requirement_reference,
      test_artifact: item.artifact_reference,
      coverage_type: item.coverage_type,
      verification_method: item.verification_method,
      risk_level: item.risk_level,
    })),
    defect_template: {
      title: outputs.defect_report_template.title,
      summary: outputs.defect_report_template.summary,
      environment: outputs.defect_report_template.environment,
      steps_to_reproduce: outputs.defect_report_template.steps_to_reproduce,
      expected_result: outputs.defect_report_template.expected_result,
      actual_result: outputs.defect_report_template.actual_result,
      severity: outputs.defect_report_template.severity,
      regulatory_impact: outputs.defect_report_template.regulatory_impact,
      attachments: outputs.defect_report_template.attachments_to_collect,
    },
    risk_notes: outputs.risk_based_testing_notes.map((item) => ({
      area: item.risk_area,
      level: item.risk_level,
      note: item.rationale,
      testing_focus: item.testing_focus,
      evidence_expected: item.evidence_expected,
    })),
    regression_checklist: outputs.regression_checklist.map((item) => ({
      id: item.check_id,
      area: item.area,
      check: item.verification,
      owner_hint: item.owner_hint,
      evidence: item.evidence,
    })),
    audit_summary: `${summary.scope}. ${summary.test_approach} Release view: ${summary.release_recommendation}`,
  }
}
