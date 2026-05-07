function escapeCsvValue(value) {
  const stringValue = Array.isArray(value) ? value.join(' | ') : String(value ?? '')
  const normalized = stringValue.replace(/\r?\n/g, ' ').trim()

  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
}

function buildCsv(headers, rows) {
  const headerLine = headers.map(escapeCsvValue).join(',')
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(','))
  return [headerLine, ...dataLines].join('\n')
}

function downloadContent(content, filename, mimeType, prependBom = false) {
  const blob = new Blob(prependBom ? ['\uFEFF', content] : [content], {
    type: mimeType,
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export function exportTestCasesCsv(data) {
  const headers = ['ID', 'Title', 'Objective', 'Preconditions', 'Steps', 'Expected Result', 'Priority']
  const rows = data.test_cases.map((item) => [
    item.id,
    item.title,
    item.objective,
    item.preconditions,
    item.steps,
    item.expected_result,
    item.priority,
  ])

  downloadContent(buildCsv(headers, rows), 'TraceMind_Workflow_Paths.csv', 'text/csv;charset=utf-8', true)
}

export function exportTraceabilityCsv(data) {
  const headers = ['Requirement ID', 'Test Artifact', 'Coverage Type', 'Verification Method', 'Risk Level']
  const rows = data.traceability_matrix.map((item) => [
    item.requirement_id,
    item.test_artifact,
    item.coverage_type,
    item.verification_method,
    item.risk_level,
  ])

  downloadContent(
    buildCsv(headers, rows),
    'TraceMind_Traceability_Matrix.csv',
    'text/csv;charset=utf-8',
    true,
  )
}

export function exportQASummaryTxt(data) {
  const sections = [
    'TraceMind AI',
    'Workflow Automation Demo Summary',
    '',
    'Audit Summary',
    '-------------',
    data.audit_summary,
    '',
    'Primary Workflow Paths',
    '----------------------',
    ...data.test_cases.flatMap((item) => [
      `${item.id} | ${item.title} | Priority: ${item.priority}`,
      `Objective: ${item.objective}`,
      `Preconditions: ${item.preconditions.join('; ')}`,
      `Steps: ${item.steps.join('; ')}`,
      `Expected Result: ${item.expected_result}`,
      '',
    ]),
    'Edge Cases',
    '----------',
    ...data.edge_cases.flatMap((item) => [
      `${item.id} | ${item.title}`,
      item.description,
      `Rationale: ${item.rationale}`,
      '',
    ]),
    'Failure Modes and Guardrails',
    '---------------------------',
    ...data.negative_tests.flatMap((item) => [
      `${item.id} | ${item.title}`,
      item.description,
      `Rationale: ${item.rationale}`,
      '',
    ]),
    'Audit and Traceability Matrix',
    '-----------------------------',
    ...data.traceability_matrix.flatMap((item) => [
      `${item.requirement_id} -> ${item.test_artifact}`,
      `Coverage: ${item.coverage_type}`,
      `Verification: ${item.verification_method}`,
      `Risk Level: ${item.risk_level}`,
      '',
    ]),
    'Escalation or Issue Template',
    '----------------------------',
    `Title: ${data.defect_template.title}`,
    `Summary: ${data.defect_template.summary}`,
    `Environment: ${data.defect_template.environment}`,
    `Expected Result: ${data.defect_template.expected_result}`,
    `Actual Result: ${data.defect_template.actual_result}`,
    `Severity: ${data.defect_template.severity}`,
    `Regulatory Impact: ${data.defect_template.regulatory_impact}`,
    `Attachments: ${data.defect_template.attachments.join('; ')}`,
    '',
    'Risk Notes and Guardrails',
    '-------------------------',
    ...data.risk_notes.flatMap((item) => [
      `${item.area} | ${item.level}`,
      item.note,
      `Testing Focus: ${item.testing_focus}`,
      `Evidence Expected: ${item.evidence_expected}`,
      '',
    ]),
    'Pilot Readiness Checklist',
    '-------------------------',
    ...data.regression_checklist.flatMap((item) => [
      `${item.id} | ${item.area}`,
      `Check: ${item.check}`,
      `Owner Hint: ${item.owner_hint}`,
      `Evidence: ${item.evidence}`,
      '',
    ]),
  ]

  downloadContent(sections.join('\n'), 'TraceMind_Portfolio_Summary.txt', 'text/plain;charset=utf-8')
}
