import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import './CrawlingProgress.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function CrawlingProgress() {
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId, url } = location.state || {}

  const [status, setStatus] = useState({ status: 'queued', counters: {}, error: null })
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Initializing crawl...')
  const [isCancelling, setIsCancelling] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  const steps = [
    { key: 'queued', label: 'Queued', description: 'Job added to queue' },
    { key: 'crawling', label: 'Crawling', description: 'Visiting pages and discovering products' },
    { key: 'parsing', label: 'Parsing', description: 'Extracting product information' },
    { key: 'downloading', label: 'Downloading', description: 'Downloading product images' },
    { key: 'enriching', label: 'Enriching', description: 'AI-powered product enrichment' },
    { key: 'indexing', label: 'Indexing', description: 'Preparing for semantic search' },
    { key: 'completed', label: 'Completed', description: 'Crawl finished successfully' },
  ]

  useEffect(() => {
    if (!jobId) {
      navigate('/')
      return
    }

    let ws = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 10

    const connect = () => {
      const wsBase = API_BASE_URL.replace(/^http/, 'ws')
      ws = new WebSocket(`${wsBase}/ws?job_id=${encodeURIComponent(jobId)}`)

      ws.onopen = () => {
        reconnectAttempts = 0
        setConnectionError(null)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setStatus(data)

          const stepIndex = steps.findIndex((s) => s.key === data.status)
          if (stepIndex >= 0) {
            setCurrentStep(steps[stepIndex].description)

            // If job is completed or failed, force progress to 100
            if (data.status === 'completed' || data.status === 'failed') {
              setProgress(100)
            } else {
              setProgress(((stepIndex + 1) / steps.length) * 100)
            }
          }

          // If backend reports failure, reflect that immediately
          if (data.status === 'failed') {
            setCurrentStep(data.error || 'Crawl failed. Please review job logs.')
          }
        } catch (err) {
          console.error('WS parse error', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionError('WebSocket connection error.')
        setCurrentStep('Connection error. Retrying...')
      }

      ws.onclose = () => {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          setTimeout(connect, delay)
        } else {
          setConnectionError('Connection lost. Please refresh the page.')
          setCurrentStep('Connection lost. Please refresh the page.')
        }
      }
    }

    connect()

    return () => {
      if (ws) {
        ws.onclose = null
        ws.close()
      }
    }
  }, [jobId, navigate])

  const handleCancel = async () => {
    if (!jobId) return
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to cancel this crawl?')) {
      return
    }
    setIsCancelling(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
        method: 'POST',
      })
      if (resp.ok) {
        setCurrentStep('Cancellation requested...')
      } else {
        alert('Failed to cancel job')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert('Failed to cancel job')
    } finally {
      setIsCancelling(false)
    }
  }

  const currentStepIndex = steps.findIndex((s) => s.key === status.status)
  const counters = status.counters || {}
  const pagesVisited = counters.pages_visited ?? 0
  const productsFound = counters.products_discovered ?? 0
  const productsExtracted = counters.products_extracted ?? 0

  return (
    <div className="crawl-layout">
      <header className="crawl-header">
        <Logo />
      </header>

      <main className="crawl-main">
        <section className="crawl-card">
          <div className="crawl-card-header">
            <div>
              <h1>Crawling in Progress</h1>
              <p>Visiting pages and discovering products</p>
              {url && (
                <p className="crawl-url">
                  Source:{' '}
                  <a href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </p>
              )}
            </div>
            <div className="crawl-status-pill">
              <span className="label">Job Status</span>
              <span className="value">
                {status.status === 'failed' ? 'failed' : status.status}
              </span>
              <span className="percent">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="crawl-progress-bar">
            <div
              className="crawl-progress-bar-inner"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="crawl-current-step">{currentStep}</p>

          {connectionError && (
            <p className="crawl-error-text">{connectionError}</p>
          )}

          <ol className="crawl-steps">
            {steps.map((step, idx) => {
              const isComplete = idx < currentStepIndex
              const isActive = idx === currentStepIndex
              return (
                <li
                  key={step.key}
                  className={[
                    'crawl-step',
                    isComplete ? 'complete' : '',
                    isActive ? 'active' : '',
                  ]
                    .join(' ')
                    .trim()}
                >
                  <span className="step-index">{idx + 1}</span>
                  <div className="step-content">
                    <div className="step-title">{step.label}</div>
                    <div className="step-desc">{step.description}</div>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="crawl-metrics">
            <div className="metric">
              <span className="metric-label">Pages visited</span>
              <span className="metric-value">{pagesVisited}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Products found</span>
              <span className="metric-value">{productsFound}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Products extracted</span>
              <span className="metric-value">{productsExtracted}</span>
            </div>
          </div>

          <div className="crawl-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleCancel}
              disabled={isCancelling || status.status === 'completed'}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Crawl'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
