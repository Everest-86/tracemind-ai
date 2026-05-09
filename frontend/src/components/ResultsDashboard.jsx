import { exportQASummaryTxt, exportTestCasesCsv, exportTraceabilityCsv } from '../exportUtils.js'

function ResultCard({ title, eyebrow, children, className = '' }) {
  return (
    <article className={`result-card ${className}`.trim()}>
      <span className="result-card__eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      {children}
    </article>
  )
}

function LoadingRows({ count = 4 }) {
  return (
    <div className="loading-rows" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span className="loading-line" key={index}></span>
      ))}
    </div>
  )
}

function EmptyMessage({ children }) {
  return <p className="empty-copy">{children}</p>
}

function RiskBadge({ level }) {
  const normalized = level.toLowerCase()
  const className = normalized.includes('high')
    ? 'risk-label risk-high'
    : normalized.includes('medium')
      ? 'risk-label risk-medium'
      : 'risk-label risk-low'

  return <span className={className}>{level}</span>
}

function ResultsDashboard({ data, isLoading, resultSource }) {
  const canExport = Boolean(data) && !isLoading

  return (
    <section className="results-wrap" id="results">
      <div className="results-head">
        <div>
          <div className="eyebrow section-eyebrow">Results Dashboard</div>
          <h2>Audit-ready workflow review artifacts in eight focused cards.</h2>
          <p>
            Each section mirrors a deliverable you can show while explaining workflow automation, QA thinking,
            documentation quality, and presentation readiness.
          </p>
        </div>

        <div className="results-meta">
          <span className={`source-badge ${resultSource === 'sample' ? 'source-sample' : 'source-live'}`}>
            {resultSource === 'sample'
              ? 'Showing local sample output'
              : resultSource === 'saved'
                ? 'Showing saved backend analysis'
              : resultSource === 'live'
                ? 'Connected to backend output'
                : 'Ready to generate'}
          </span>
          <div className="results-actions">
            <button
              className="button secondary export-button"
              disabled={!canExport}
              onClick={() => exportQASummaryTxt(data)}
              type="button"
            >
              Export Summary TXT
            </button>
            <button
              className="button secondary export-button"
              disabled={!canExport}
              onClick={() => exportTestCasesCsv(data)}
              type="button"
            >
              Export Flows CSV
            </button>
            <button
              className="button secondary export-button"
              disabled={!canExport}
              onClick={() => exportTraceabilityCsv(data)}
              type="button"
            >
              Export Audit Matrix CSV
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <ResultCard className="span-2" eyebrow="1" title="Primary Workflow Paths">
          {isLoading ? (
            <LoadingRows count={5} />
          ) : data ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Expected result</th>
                  </tr>
                </thead>
                <tbody>
                  {data.test_cases.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <div className="stacked-text">
                          <strong>{item.title}</strong>
                          <span>{item.objective}</span>
                        </div>
                      </td>
                      <td>{item.priority}</td>
                      <td>{item.expected_result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyMessage>Generate a package to preview primary workflow paths, guardrails, and documentation outputs.</EmptyMessage>
          )}
        </ResultCard>

        <ResultCard eyebrow="2" title="Operational Edge Cases">
          {isLoading ? (
            <LoadingRows />
          ) : data ? (
            <div className="detail-list">
              {data.edge_cases.map((item) => (
                <div className="detail-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <span>{item.rationale}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMessage>Edge cases covering retries, partial inputs, and context changes will appear here.</EmptyMessage>
          )}
        </ResultCard>

        <ResultCard eyebrow="3" title="Failure Modes and Guardrails">
          {isLoading ? (
            <LoadingRows />
          ) : data ? (
            <div className="detail-list">
              {data.negative_tests.map((item) => (
                <div className="detail-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <span>{item.rationale}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMessage>Negative scenarios will show how the workflow behaves under unsupported or risky conditions.</EmptyMessage>
          )}
        </ResultCard>

        <ResultCard className="span-2" eyebrow="4" title="Audit and Traceability Matrix">
          {isLoading ? (
            <LoadingRows count={4} />
          ) : data ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Artifact</th>
                    <th>Coverage</th>
                    <th>Verification</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.traceability_matrix.map((item, index) => (
                    <tr key={`${item.requirement_id}-${item.test_artifact}-${index}`}>
                      <td>{item.requirement_id}</td>
                      <td>{item.test_artifact}</td>
                      <td>{item.coverage_type}</td>
                      <td>{item.verification_method}</td>
                      <td>{item.risk_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyMessage>The requirement-to-outcome mapping will render here after generation.</EmptyMessage>
          )}
        </ResultCard>

        <ResultCard eyebrow="5" title="Escalation or Issue Template">
          {isLoading ? (
            <LoadingRows count={5} />
          ) : data ? (
            <dl className="kv-list">
              <div>
                <dt>Title</dt>
                <dd>{data.defect_template.title}</dd>
              </div>
              <div>
                <dt>Summary</dt>
                <dd>{data.defect_template.summary}</dd>
              </div>
              <div>
                <dt>Severity</dt>
                <dd>{data.defect_template.severity}</dd>
              </div>
              <div>
                <dt>Workflow impact</dt>
                <dd>{data.defect_template.regulatory_impact}</dd>
              </div>
              <div>
                <dt>Attachments</dt>
                <dd>{data.defect_template.attachments.join(', ')}</dd>
              </div>
            </dl>
          ) : (
            <EmptyMessage>A reusable escalation or incident starter will appear here.</EmptyMessage>
          )}
        </ResultCard>

        <ResultCard eyebrow="6" title="Risk Notes and Guardrails">
          {isLoading ? (
            <LoadingRows count={4} />
          ) : data ? (
            <div className="detail-list">
              {data.risk_notes.map((item) => (
                <div className="detail-item" key={`${item.area}-${item.level}`}>
                  <div className="detail-item__top">
                    <strong>{item.area}</strong>
                    <RiskBadge level={item.level} />
                  </div>
                  <p>{item.note}</p>
                  <span>Focus: {item.testing_focus}</span>
                  <span>Evidence: {item.evidence_expected}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMessage>Risk notes and evidence expectations will show here.</EmptyMessage>
          )}
        </ResultCard>

        <ResultCard eyebrow="7" title="Pilot Readiness Checklist">
          {isLoading ? (
            <LoadingRows count={4} />
          ) : data ? (
            <div className="detail-list">
              {data.regression_checklist.map((item) => (
                <div className="detail-item" key={item.id}>
                  <strong>
                    {item.id} | {item.area}
                  </strong>
                  <p>{item.check}</p>
                  <span>Owner: {item.owner_hint}</span>
                  <span>Evidence: {item.evidence}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMessage>Pilot-readiness checks will appear here to support a polished portfolio story.</EmptyMessage>
          )}
        </ResultCard>

        <ResultCard eyebrow="8" title="Audit Summary">
          {isLoading ? (
            <LoadingRows count={3} />
          ) : data ? (
            <div className="summary-block">
              <p>{data.audit_summary}</p>
            </div>
          ) : (
            <EmptyMessage>The summary card will distill the generated package into a clear product narrative.</EmptyMessage>
          )}
        </ResultCard>
      </div>
    </section>
  )
}

export default ResultsDashboard
