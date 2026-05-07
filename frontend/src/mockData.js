const SAMPLE_REQUIREMENT =
  'The AI workflow assistant shall review inbound project requests, identify missing acceptance criteria, classify priority, route high-risk items to human review, generate a QA checklist, and save an audit trail with request reference, confidence score, final status, and reviewer handoff notes.'

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function referenceFromRequirement(requirement) {
  const normalized = normalize(requirement)
  let hash = 0

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0
  }

  return `REQ-${hash.toString(16).toUpperCase().padStart(6, '0').slice(0, 6)}`
}

function riskLabel(riskLevel) {
  if (riskLevel === 'high') {
    return 'High'
  }
  if (riskLevel === 'medium') {
    return 'Medium'
  }
  return 'Low'
}

function severityLabel(riskLevel) {
  if (riskLevel === 'high') {
    return 'Critical'
  }
  if (riskLevel === 'medium') {
    return 'High'
  }
  return 'Medium'
}

export const sampleGeneratorRequest = {
  requirement: SAMPLE_REQUIREMENT,
  domain: 'workflow_automation',
  risk_level: 'high',
}

export function createSampleQAPackage(request = sampleGeneratorRequest) {
  const requirement = normalize(request.requirement || SAMPLE_REQUIREMENT)
  const reference = referenceFromRequirement(requirement)
  const risk = riskLabel(request.risk_level)
  const severity = severityLabel(request.risk_level)

  return {
    test_cases: [
      {
        id: 'TC-01',
        title: 'Validate the primary workflow path',
        objective:
          'Confirm a complete requirement produces a structured package with clear next steps, test coverage, and presentable documentation.',
        preconditions: [
          'The local demo environment is available.',
          'A complete sample requirement is ready to submit.',
          'The result dashboard can render all output sections.',
        ],
        steps: [
          'Submit the sample requirement through the generator.',
          'Review the generated workflow package.',
          'Confirm the final output looks polished and internally consistent.',
        ],
        expected_result:
          'The workflow completes successfully, all core sections render, and the package is suitable for demo and portfolio presentation.',
        priority: risk === 'High' ? 'Critical' : 'High',
      },
      {
        id: 'TC-02',
        title: 'Route incomplete input to reviewable follow-up',
        objective:
          'Ensure the workflow does not overstate certainty when requirement details are missing or ambiguous.',
        preconditions: [
          'An incomplete or low-detail requirement variant is available.',
          'Risk notes and issue template sections are visible in the UI.',
        ],
        steps: [
          'Submit a requirement missing acceptance criteria or routing detail.',
          'Inspect the generated risk notes and negative scenarios.',
          'Confirm the workflow recommends review rather than pretending confidence.',
        ],
        expected_result:
          'The package highlights missing context and suggests a human review path instead of presenting incomplete automation as final.',
        priority: 'High',
      },
      {
        id: 'TC-03',
        title: 'Verify exception and escalation handling',
        objective:
          'Check that risky automation steps, override attempts, and exception paths remain visible in the generated artifact set.',
        preconditions: [
          'A high-risk requirement variant is available.',
          'The dashboard can display negative scenarios and risk notes.',
        ],
        steps: [
          'Submit a requirement with exception handling or manual approval needs.',
          'Open the negative scenario and guardrail sections.',
          'Confirm the workflow highlights review checkpoints and escalation logic.',
        ],
        expected_result:
          'High-risk conditions are called out clearly, and the output recommends appropriate human review or follow-up.',
        priority: risk === 'High' ? 'Critical' : 'High',
      },
      {
        id: 'TC-04',
        title: 'Confirm export quality and naming consistency',
        objective:
          'Ensure TXT and CSV exports preserve readable formatting and requirement traceability.',
        preconditions: [
          'A package has already been generated.',
          'The export controls are enabled in the results dashboard.',
        ],
        steps: [
          'Export the summary TXT file.',
          'Export the workflow paths and traceability CSV files.',
          'Inspect filenames, formatting, and requirement reference consistency.',
        ],
        expected_result:
          'All exported artifacts download successfully and match the structure shown in the dashboard.',
        priority: 'Medium',
      },
      {
        id: 'TC-05',
        title: 'Verify repeat-run presentation stability',
        objective:
          'Check that repeated runs stay consistent enough for a polished portfolio walkthrough.',
        preconditions: [
          'The same sample requirement can be submitted more than once.',
          'The tester can compare outputs between runs.',
        ],
        steps: [
          'Generate the package twice using the same sample requirement.',
          'Compare section ordering, requirement reference, and overall presentation quality.',
          'Review any unexpected drift or missing content.',
        ],
        expected_result:
          'Repeat runs remain stable and presentation-ready, with no broken formatting or missing sections.',
        priority: 'Medium',
      },
    ],
    edge_cases: [
      {
        id: 'EC-01',
        title: 'Duplicate submission while waiting for results',
        description:
          'Submit the same requirement twice in quick succession and confirm the workflow remains understandable and does not imply conflicting status.',
        rationale: 'Real users often retry actions when they are unsure whether the first request completed.',
      },
      {
        id: 'EC-02',
        title: 'Partially complete workflow requirement',
        description:
          'Provide a requirement with strong intent but missing acceptance criteria, ownership, or handoff detail.',
        rationale: 'A recruiter-friendly workflow tool should make gaps visible without collapsing the whole output.',
      },
      {
        id: 'EC-03',
        title: 'Context change during review',
        description:
          'Simulate a rule or ownership change between runs and confirm the updated context still produces a clean package.',
        rationale: 'Automation quality often breaks during changing operational context, not just on the happy path.',
      },
      {
        id: 'EC-04',
        title: 'Export after a follow-up edit',
        description:
          'Edit the requirement, regenerate the package, and verify the exported files reflect the latest version cleanly.',
        rationale: 'Export consistency matters when the project is being shown in demos or portfolio reviews.',
      },
    ],
    negative_tests: [
      {
        id: 'NEG-01',
        title: 'Bypass-review instruction attempt',
        description:
          'Submit a requirement that asks the workflow to skip review or auto-approve a high-risk path.',
        rationale: 'Guardrails should stay visible even when the input tries to override them.',
      },
      {
        id: 'NEG-02',
        title: 'Unsupported instruction or override language',
        description:
          'Add extra instructions intended to force a result even when the requirement is incomplete or contradictory.',
        rationale: 'AI-assisted tools should surface uncertainty instead of blindly following override text.',
      },
      {
        id: 'NEG-03',
        title: 'Stale workflow package reused after requirement changes',
        description:
          'Compare a saved output against an updated requirement and verify the workflow makes version drift obvious.',
        rationale: 'Stale artifacts can create misleading handoffs and false confidence.',
      },
      {
        id: 'NEG-04',
        title: 'Formatting stress case for exports',
        description:
          'Use a very long or unusually formatted requirement and confirm TXT and CSV exports stay readable.',
        rationale: 'Presentation quality is part of the product story in a portfolio repo.',
      },
    ],
    traceability_matrix: [
      {
        requirement_id: reference,
        test_artifact: 'TC-01',
        coverage_type: 'Primary workflow validation',
        verification_method: 'Manual execution with a representative requirement',
        risk_level: risk,
      },
      {
        requirement_id: reference,
        test_artifact: 'TC-02 / EC-02',
        coverage_type: 'Ambiguity and missing-context handling',
        verification_method: 'Manual run with incomplete requirement data',
        risk_level: risk,
      },
      {
        requirement_id: reference,
        test_artifact: 'TC-03 / NEG-01 / NEG-02',
        coverage_type: 'Guardrails and exception handling',
        verification_method: 'Override-attempt and escalation review',
        risk_level: 'High',
      },
      {
        requirement_id: reference,
        test_artifact: 'TC-04 / EC-04 / NEG-04',
        coverage_type: 'Export and presentation quality',
        verification_method: 'TXT and CSV export verification',
        risk_level: risk,
      },
      {
        requirement_id: reference,
        test_artifact: 'TC-05 / EC-01 / NEG-03',
        coverage_type: 'Repeat-run and stale-state stability',
        verification_method: 'Duplicate submission and version consistency checks',
        risk_level: risk,
      },
    ],
    defect_template: {
      title: `[${reference}] Workflow package differs from expected behavior`,
      summary:
        'Observed a mismatch in generated workflow guidance, risk framing, traceability, export content, or presentation quality.',
      environment: 'Local TraceMind AI demo environment using mock sample data',
      steps_to_reproduce: [
        'Open the workflow generator.',
        'Submit the sample requirement or triggering input.',
        'Capture the visible output, exported artifacts, and missing or incorrect sections.',
      ],
      expected_result:
        'The workflow should produce a clean, reviewable package with clear guardrails, readable exports, and consistent traceability.',
      actual_result:
        'Document the exact mismatch in routing guidance, risk notes, export behavior, or formatting.',
      severity,
      regulatory_impact:
        'Assess impact to workflow accuracy, reviewer visibility, release confidence, and stakeholder trust.',
      attachments: [
        'Requirement text',
        'Dashboard screenshot',
        'TXT or CSV export sample',
        'Requirement reference',
      ],
    },
    risk_notes: [
      {
        area: 'Automation guardrails',
        level: 'High',
        note: 'The workflow should recommend human review whenever the requirement is ambiguous, incomplete, or high impact.',
        testing_focus: 'Use low-detail and override-style prompts to confirm the package still surfaces review checkpoints.',
        evidence_expected: 'Risk notes, issue-template wording, and negative scenarios that clearly call out manual review needs.',
      },
      {
        area: 'Auditability and traceability',
        level: 'High',
        note: 'The output should make it obvious how one requirement became a structured set of QA and workflow artifacts.',
        testing_focus: 'Check requirement references, traceability rows, and export consistency across runs.',
        evidence_expected: 'Readable requirement IDs, trace rows, and export samples that match the UI.',
      },
      {
        area: 'Data quality and missing context',
        level: risk,
        note: 'Weak requirement quality should remain visible in the output instead of being hidden by overly confident language.',
        testing_focus: 'Submit vague or partial requirements and confirm the package communicates assumptions and gaps.',
        evidence_expected: 'Explicit missing-context notes or human-review guidance.',
      },
      {
        area: 'Presentation stability',
        level: risk,
        note: 'A portfolio project should stay polished in repeat runs, exports, and responsive layouts.',
        testing_focus: 'Re-run the sample, export artifacts, and inspect the results on narrow layouts.',
        evidence_expected: 'Repeat-run comparisons and clean export samples.',
      },
    ],
    regression_checklist: [
      {
        id: 'REG-01',
        area: 'Core generation flow',
        check: 'Run the sample requirement and confirm all sections render in the expected order.',
        owner_hint: 'Demo owner',
        evidence: 'Completed dashboard screenshot',
      },
      {
        id: 'REG-02',
        area: 'Ambiguity handling',
        check: 'Use an incomplete requirement and verify the output recommends reviewable next steps.',
        owner_hint: 'QA reviewer',
        evidence: 'Risk-note capture',
      },
      {
        id: 'REG-03',
        area: 'Exports',
        check: 'Download TXT and CSV artifacts and confirm readable formatting and requirement reference consistency.',
        owner_hint: 'Demo owner',
        evidence: 'Exported sample files',
      },
      {
        id: 'REG-04',
        area: 'Repeat-run stability',
        check: 'Regenerate the same requirement and compare structure, labels, and presentation quality.',
        owner_hint: 'QA reviewer',
        evidence: 'Comparison notes between runs',
      },
      {
        id: 'REG-05',
        area: 'Responsive presentation',
        check: 'Open the page in desktop and mobile widths and confirm the layout remains legible.',
        owner_hint: 'Frontend reviewer',
        evidence: 'Responsive screenshots',
      },
    ],
    audit_summary: `${reference} was assessed as a ${request.risk_level} risk workflow-automation requirement. The generated package demonstrates structured QA thinking, clear guardrails, auditability, and polished presentation using safe mock data only.`,
  }
}
