const DOMAIN_OPTIONS = [
  { value: 'workflow_automation', label: 'Workflow automation' },
  { value: 'qa_operations', label: 'QA and release operations' },
]

const RISK_OPTIONS = [
  { value: 'low', label: 'Low risk' },
  { value: 'medium', label: 'Medium risk' },
  { value: 'high', label: 'High risk' },
]

function RequirementForm({
  form,
  onFieldChange,
  onLoadSample,
  onSubmit,
  isLoading,
  errorMessage,
  noticeMessage,
  resultSource,
}) {
  return (
    <section className="generator-panel" id="generator">
      <div className="panel-header">
        <div>
          <div className="eyebrow section-eyebrow">Workflow Generator</div>
          <h3>Generate a workflow review package from one requirement.</h3>
        </div>
        <span className={`source-badge ${resultSource === 'sample' ? 'source-sample' : 'source-live'}`}>
          {resultSource === 'sample'
            ? 'Sample fallback ready'
            : resultSource === 'saved'
              ? 'Saved analysis loaded'
              : 'FastAPI-ready demo'}
        </span>
      </div>

      <p className="panel-copy">
        Paste a workflow requirement, choose the project context and risk level, then generate a clean demo package
        covering QA paths, guardrails, traceability, and export-ready notes.
      </p>

      <form className="generator-form" onSubmit={onSubmit}>
        <div className="field-group">
          <label htmlFor="requirement">Requirement</label>
          <textarea
            className="text-area"
            id="requirement"
            name="requirement"
            onChange={onFieldChange('requirement')}
            placeholder="Paste a workflow automation or QA operations requirement..."
            value={form.requirement}
          />
          <div className="field-meta">
            <span>Minimum 20 characters</span>
            <button className="text-link" onClick={onLoadSample} type="button">
              Use Sample Requirement
            </button>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label htmlFor="domain">Domain</label>
            <select className="text-input" id="domain" name="domain" onChange={onFieldChange('domain')} value={form.domain}>
              {DOMAIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="risk_level">Risk level</label>
            <select
              className="text-input"
              id="risk_level"
              name="risk_level"
              onChange={onFieldChange('risk_level')}
              value={form.risk_level}
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage ? <div className="status-banner status-error">{errorMessage}</div> : null}
        {noticeMessage ? <div className="status-banner status-info">{noticeMessage}</div> : null}

        <div className="form-actions">
          <button className="button primary" disabled={isLoading} type="submit">
            {isLoading ? 'Generating review package...' : 'Generate Demo Package'}
          </button>
          <p className="helper-copy">
            If the backend is offline, TraceMind AI will automatically show polished sample output so your recording and
            review flow still works.
          </p>
        </div>
      </form>
    </section>
  )
}

export default RequirementForm
