import assert from 'node:assert/strict'
import test from 'node:test'

import { createSampleQAPackage, sampleGeneratorRequest } from '../src/mockData.js'
import { analysisToDashboardData } from '../src/historyAdapter.js'

test('sample generator request uses supported workflow domains', () => {
  assert.equal(sampleGeneratorRequest.domain, 'workflow_automation')
  assert.equal(sampleGeneratorRequest.risk_level, 'high')
  assert.ok(sampleGeneratorRequest.requirement.length >= 20)
})

test('sample package includes core recruiter-facing sections', () => {
  const result = createSampleQAPackage()

  assert.ok(result.test_cases.length >= 5)
  assert.ok(result.edge_cases.length >= 4)
  assert.ok(result.negative_tests.length >= 4)
  assert.ok(result.traceability_matrix.length >= 5)
  assert.equal(typeof result.audit_summary, 'string')
  assert.ok(result.audit_summary.toLowerCase().includes('workflow'))
})

test('saved analysis adapter maps backend analysis payloads into dashboard data', () => {
  const samplePackage = createSampleQAPackage()
  const backendAnalysis = {
    id: 1,
    created_at: '2026-05-08T12:00:00Z',
    product_name: 'TraceMind AI',
    domain_context: 'workflow automation',
    requirement_text: sampleGeneratorRequest.requirement,
    outputs: {
      requirement_reference: 'REQ-TEST01',
      requirement_snapshot: sampleGeneratorRequest.requirement,
      manual_test_cases: samplePackage.test_cases.map((item) => ({
        case_id: item.id,
        title: item.title,
        objective: item.objective,
        preconditions: item.preconditions,
        steps: item.steps,
        expected_result: item.expected_result,
        priority: item.priority,
        trace_reference: 'REQ-TEST01',
      })),
      edge_cases: samplePackage.edge_cases.map((item) => ({
        scenario_id: item.id,
        title: item.title,
        description: item.description,
        rationale: item.rationale,
      })),
      negative_test_scenarios: samplePackage.negative_tests.map((item) => ({
        scenario_id: item.id,
        title: item.title,
        description: item.description,
        rationale: item.rationale,
      })),
      risk_based_testing_notes: samplePackage.risk_notes.map((item, index) => ({
        note_id: `RISK-0${index + 1}`,
        risk_area: item.area,
        risk_level: item.level,
        rationale: item.note,
        testing_focus: item.testing_focus,
        evidence_expected: item.evidence_expected,
      })),
      traceability_matrix: samplePackage.traceability_matrix.map((item, index) => ({
        mapping_id: `TM-0${index + 1}`,
        requirement_reference: item.requirement_id,
        artifact_reference: item.test_artifact,
        coverage_type: item.coverage_type,
        verification_method: item.verification_method,
        risk_level: item.risk_level,
      })),
      defect_report_template: {
        title: samplePackage.defect_template.title,
        summary: samplePackage.defect_template.summary,
        environment: samplePackage.defect_template.environment,
        steps_to_reproduce: samplePackage.defect_template.steps_to_reproduce,
        expected_result: samplePackage.defect_template.expected_result,
        actual_result: samplePackage.defect_template.actual_result,
        severity: samplePackage.defect_template.severity,
        regulatory_impact: samplePackage.defect_template.regulatory_impact,
        attachments_to_collect: samplePackage.defect_template.attachments,
      },
      regression_checklist: samplePackage.regression_checklist.map((item) => ({
        check_id: item.id,
        area: item.area,
        verification: item.check,
        owner_hint: item.owner_hint,
        evidence: item.evidence,
      })),
      audit_ready_test_summary: {
        scope: 'Validation scope',
        test_approach: 'Risk-based review',
        evidence_package: ['Executed checks'],
        residual_risk_statement: 'Residual risk remains visible.',
        release_recommendation: 'Ready for portfolio presentation.',
      },
    },
  }

  const mapped = analysisToDashboardData(backendAnalysis)

  assert.equal(mapped.test_cases[0].id, samplePackage.test_cases[0].id)
  assert.equal(mapped.defect_template.attachments.length, samplePackage.defect_template.attachments.length)
  assert.ok(mapped.audit_summary.includes('Validation scope'))
})
