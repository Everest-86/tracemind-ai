import { startTransition, useEffect, useState } from 'react'

import RecentRuns from '../components/RecentRuns.jsx'
import RequirementForm from '../components/RequirementForm.jsx'
import ResultsDashboard from '../components/ResultsDashboard.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import { createAnalysis, fetchAnalysis, fetchRecentAnalyses, generateQAPackage } from '../api.js'
import { analysisToDashboardData } from '../historyAdapter.js'
import { createSampleQAPackage, sampleGeneratorRequest } from '../mockData.js'

const outputs = [
  {
    label: 'Workflow',
    title: 'Primary workflow paths',
    text: 'Normal flow coverage, exception handling, and human-review checkpoints in one clear package.',
  },
  {
    label: 'Risk',
    title: 'Automation guardrails',
    text: 'Shows where confidence should stop, where humans should review, and what evidence should be captured.',
  },
  {
    label: 'Audit',
    title: 'Traceability and auditability',
    text: 'Connects one requirement to outputs, risk notes, and export-ready documentation for review.',
  },
  {
    label: 'Demo',
    title: 'Recruiter-friendly summary',
    text: 'Explains the project story quickly during a screen recording, GitHub review, or portfolio walkthrough.',
  },
]

const DOMAIN_CONTEXTS = {
  workflow_automation: 'workflow automation',
  qa_operations: 'QA and release operations',
}

function LandingPage() {
  const [form, setForm] = useState({
    ...sampleGeneratorRequest,
    requirement: '',
  })
  const [qaPackage, setQaPackage] = useState(null)
  const [resultSource, setResultSource] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null)

  useEffect(() => {
    let isActive = true

    async function loadRecentAnalyses() {
      try {
        const items = await fetchRecentAnalyses()
        if (isActive) {
          setRecentAnalyses(items)
        }
      } catch {
        if (isActive) {
          setRecentAnalyses([])
        }
      } finally {
        if (isActive) {
          setIsHistoryLoading(false)
        }
      }
    }

    loadRecentAnalyses()

    return () => {
      isActive = false
    }
  }, [])

  function updateField(field) {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }
  }

  function loadSample() {
    setForm(sampleGeneratorRequest)
    setErrorMessage('')
    setNoticeMessage('Sample workflow-automation requirement loaded. Generate to preview QA outputs, guardrails, and export artifacts.')
  }

  function revealResults() {
    requestAnimationFrame(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function applyResult(payload, source, notice) {
    startTransition(() => {
      setQaPackage(payload)
      setResultSource(source)
      setNoticeMessage(notice)
      setErrorMessage('')
    })
    revealResults()
  }

  function analysisPayloadFromForm(currentForm) {
    return {
      product_name: 'TraceMind AI',
      domain_context: DOMAIN_CONTEXTS[currentForm.domain] || 'workflow automation',
      requirement_text: currentForm.requirement.trim(),
    }
  }

  async function refreshRecentAnalyses() {
    try {
      const items = await fetchRecentAnalyses()
      setRecentAnalyses(items)
    } catch {
      setRecentAnalyses((current) => current)
    }
  }

  async function handleLoadSavedAnalysis(analysisId) {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const analysis = await fetchAnalysis(analysisId)
      setSelectedAnalysisId(analysis.id)
      setForm((current) => ({
        ...current,
        requirement: analysis.requirement_text,
      }))
      applyResult(
        analysisToDashboardData(analysis),
        'saved',
        `Loaded saved analysis ${analysis.outputs.requirement_reference} from activity history.`,
      )
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load the selected saved analysis.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (form.requirement.trim().length < 20) {
      setErrorMessage('Please provide a requirement with at least 20 characters.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setNoticeMessage('')
    setSelectedAnalysisId(null)

    try {
      const payload = await generateQAPackage(form)
      let saveResult = null

      try {
        saveResult = await createAnalysis(analysisPayloadFromForm(form))
      } catch {
        saveResult = null
      }

      if (saveResult?.id) {
        setSelectedAnalysisId(saveResult.id)
        await refreshRecentAnalyses()
      }

      applyResult(
        payload,
        'live',
        saveResult?.id
          ? `Live backend response received and saved to activity history as ${saveResult.outputs.requirement_reference}.`
          : 'Live backend response received.',
      )
    } catch (error) {
      if (error.status === 422) {
        setErrorMessage(error.message)
      } else {
        applyResult(
          createSampleQAPackage(form),
          'sample',
          'Backend unavailable. Showing local sample data so the demo flow still works.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main id="overview">
      <section className="hero hero--studio">
        <div className="page-shell hero-grid">
          <div>
            <div className="eyebrow">AI-assisted workflow automation portfolio</div>
            <h1>Turn messy requirements into structured QA and workflow outputs</h1>
            <h2>
              Generate demo-ready test plans, risk notes, traceability, and review artifacts without exposing any real
              private data or credentials.
            </h2>
            <p>
              TraceMind AI is a polished portfolio project designed to demonstrate practical AI-assisted workflow
              automation, thoughtful QA structure, and clean software presentation. It turns one requirement into a
              review package that is easy for recruiters, hiring managers, and potential clients to understand quickly.
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#generator">
                Start generating
              </a>
              <a className="button secondary" href="#coverage">
                See the output set
              </a>
            </div>

            <ul className="hero-metrics">
              <li>
                <strong>8 output cards</strong>
                <span>Test coverage, edge cases, risk notes, traceability, exports, and demo-ready summaries</span>
              </li>
              <li>
                <strong>Local-first</strong>
                <span>FastAPI + React demo flow with safe mock data and graceful sample fallback</span>
              </li>
              <li>
                <strong>Public-safe</strong>
                <span>No real credentials, no private client data, and no sensitive production records</span>
              </li>
            </ul>
          </div>

          <div className="signal-board" aria-label="TraceMind AI workflow snapshot">
            <div className="signal-board__meta">
              <span>TraceMind AI portfolio flow</span>
              <span>Modern React + FastAPI demo application</span>
            </div>

            <div className="signal-board__columns">
              <div className="signal-column">
                <h3>1. Define the workflow</h3>
                <p>Paste a requirement, choose the demo context, and set the risk lens for the run.</p>
              </div>
              <div className="signal-column">
                <h3>2. Generate the review package</h3>
                <p>Produce QA artifacts, guardrail notes, traceability mapping, and issue-ready outputs.</p>
              </div>
              <div className="signal-column">
                <h3>3. Present it cleanly</h3>
                <p>Use the results dashboard and exports to explain the project in a GitHub review or short screen demo.</p>
              </div>
            </div>

            <div className="signal-board__outputs">
              <span className="signal-chip">Workflow Paths</span>
              <span className="signal-chip">Edge Cases</span>
              <span className="signal-chip">Failure Modes</span>
              <span className="signal-chip">Traceability</span>
              <span className="signal-chip">Issue Template</span>
              <span className="signal-chip">Risk Notes</span>
              <span className="signal-chip">QA Checklist</span>
              <span className="signal-chip">Audit Summary</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section" id="coverage">
        <SectionHeading
          eyebrow="Output coverage"
          title="One requirement, eight demo-ready review artifacts."
          copy="The interface is organized around the deliverables a recruiter, client, or stakeholder can scan quickly to understand the workflow, QA thinking, and documentation quality."
        />

        <div className="output-grid">
          {outputs.map((item) => (
            <article className="output-card" key={item.title}>
              <span>{item.label}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="studio-layout">
          <RequirementForm
            errorMessage={errorMessage}
            form={form}
            isLoading={isLoading}
            noticeMessage={noticeMessage}
            onFieldChange={updateField}
            onLoadSample={loadSample}
            onSubmit={handleSubmit}
            resultSource={resultSource}
          />

          <aside className="insight-panel">
            <div className="badge">What this demo shows</div>
            <h3>A portfolio-ready workflow automation demo with strong QA structure.</h3>
            <p>
              The experience stays intentionally focused: one requirement in, eight clear review artifacts out, with
              live backend integration when available and graceful sample output when it is not.
            </p>

            <div className="insight-stack">
              <div className="insight-item">
                <strong>Backend-first contract</strong>
                <span>The dashboard runs on a local FastAPI endpoint and mock workflow generation logic.</span>
              </div>
              <div className="insight-item">
                <strong>Fallback-safe experience</strong>
                <span>Network issues swap to local sample data instead of breaking the recording flow.</span>
              </div>
              <div className="insight-item">
                <strong>Made for portfolio review</strong>
                <span>Documentation quality, QA framing, and public-safe sample data stay visible beside the workflow detail.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="page-section">
        <div className="studio-layout">
          <RecentRuns
            isLoading={isHistoryLoading}
            items={recentAnalyses}
            onSelect={handleLoadSavedAnalysis}
            selectedId={selectedAnalysisId}
          />

          <aside className="insight-panel">
            <div className="badge">Upgrade impact</div>
            <h3>Recent run history now reinforces the product story.</h3>
            <p>
              This addition shows persistence, traceability, and repeatable review flow. It helps the project feel more
              like a real internal tool rather than a one-time generator demo.
            </p>

            <div className="insight-stack">
              <div className="insight-item">
                <strong>Persistent review trail</strong>
                <span>Live runs can be saved, listed, and reloaded directly from the backend history endpoints.</span>
              </div>
              <div className="insight-item">
                <strong>Better demo credibility</strong>
                <span>Recruiters and managers can see that the app supports more than a single throwaway interaction.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="page-section">
        <ResultsDashboard data={qaPackage} isLoading={isLoading} resultSource={resultSource} />
      </section>
    </main>
  )
}

export default LandingPage
