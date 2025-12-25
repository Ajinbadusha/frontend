import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import './CrawlingProgress.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function CrawlingProgress() {
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId, url } = location.state || {}
  
  const [status, setStatus] = useState({ status: 'queued', counters: {}, error: null })
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Initializing crawl...')
  const [isCancelling, setIsCancelling] = useState(false)

  const steps = [
    { key: 'queued',      label: 'Queued',      description: 'Job added to queue' },
    { key: 'crawling',    label: 'Crawling',    description: 'Visiting pages and discovering products' },
    { key: 'parsing',     label: 'Parsing',     description: 'Extracting product information' },
    { key: 'downloading', label: 'Downloading', description: 'Downloading product images' },
    { key: 'enriching',   label: 'Enriching',   description: 'AI-powered product enrichment' },
    { key: 'indexing',    label: 'Indexing',    description: 'Preparing for semantic search' },
    { key: 'completed',   label: 'Completed',   description: 'Crawl finished successfully' },
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
      // Handle absolute vs relative URLs and production WSS
      let wsUrl;
      if (API_BASE_URL.startsWith('http')) {
        wsUrl = API_BASE_URL.replace(/^http/, 'ws');
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}${API_BASE_URL}`;
      }
      
      ws = new WebSocket(`${wsUrl}/ws?job_id=${encodeURIComponent(jobId)}`)

      ws.onopen = () => {
        reconnectAttempts = 0
        console.log('WebSocket connected');
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setStatus(data)

          const stepIndex = steps.findIndex((s) => s.key === data.status)
          if (stepIndex >= 0) {
            setCurrentStep(steps[stepIndex].description)

            if (data.status === 'completed' || data.status === 'failed') {
              setProgress(100)
            } else {
              setProgress(((stepIndex + 1) / steps.length) * 100)
            }
          }

          if (data.status === 'failed' && data.error) {
            setCurrentStep(`Crawl failed: ${data.error}`)
          }
        } catch (err) {
          console.error('WS parse error', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setCurrentStep('Connection error. Retrying...')
      }

      ws.onclose = (e) => {
        console.log('WebSocket closed', e.code, e.reason);
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          setTimeout(connect, delay)
        } else {
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
    if (!confirm('Are you sure you want to cancel this crawl?')) return

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

  const currentStepIndex = steps.findIndex(s => s.key === status.status)
  const counters = status.counters || {}
  const pagesVisited = counters.pages_visited ?? 0
  const productsFound = counters.products_discovered ?? 0
  const productsExtracted = counters.products_extracted ?? 0

  return (
    <div className="crawling-progress-page">
      <div className="crawling-container">
        <div className="crawling-logo">
          <Logo variant="default" size="xl" />
        </div>

        <div className="crawling-content">
          <div className="crawling-header-row">
            <div className="crawling-header-text">
              <h1 className="crawling-title">Crawling in Progress</h1>
              <p className="crawling-subtitle">{currentStep}</p>
            </div>
            <div className="crawling-status-box">
              <div className="status-box-label">Job status</div>
              <div className="status-box-value">{status.status || 'idle'}</div>
              <div className="status-box-progress">{Math.round(progress)}%</div>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="progress-steps">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex
              
              return (
                <div
                  key={step.key}
                  className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="step-indicator">
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="step-content">
                    <div className="step-label">{step.label}</div>
                    {isActive && <div className="step-description">{step.description}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="crawling-stats">
            <div className="stat-item">
              <span className="stat-label">Pages Visited</span>
              <span className="stat-value">{pagesVisited}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Products Found</span>
              <span className="stat-value">{productsFound}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Products Extracted</span>
              <span className="stat-value">{productsExtracted}</span>
            </div>
          </div>

          {url && (
            <div className="crawling-url">
              <small>Crawling: {url}</small>
            </div>
          )}

          {status.status !== 'completed' &&
            status.status !== 'failed' &&
            status.status !== 'cancelled' && (
              <div className="crawling-actions">
                <button
                  type="button"
                  className="crawling-cancel-button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Crawl'}
                </button>
              </div>
            )}

          {(status.status === 'completed' ||
            status.status === 'failed' ||
            status.status === 'cancelled') && (
            <div className="crawling-actions">
              <button
                type="button"
                className="crawling-next-button"
                onClick={() => navigate('/results', { state: { jobId, url, status } })}
              >
                View search results →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
Manus