import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import './CrawlingProgress.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function CrawlingProgress() {
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId, url } = location.state || {}
  
  const [status, setStatus] = useState({ status: 'queued', counters: {} })
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Initializing crawl...')

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

    const wsBase = API_BASE_URL.replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsBase}/ws?job_id=${encodeURIComponent(jobId)}`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus(data)
        
        const stepIndex = steps.findIndex(s => s.key === data.status)
        if (stepIndex >= 0) {
          setCurrentStep(steps[stepIndex].description)
          setProgress(((stepIndex + 1) / steps.length) * 100)
        }

        // Redirect to results page when completed
        if (data.status === 'completed' || data.status === 'failed') {
          setTimeout(() => {
            navigate('/results', { state: { jobId, url, status: data } })
          }, 2000)
        }
      } catch (err) {
        console.error('WS parse error', err)
      }
    }

    ws.onerror = () => {
      setCurrentStep('Connection error. Retrying...')
    }

    return () => ws.close()
  }, [jobId, navigate])

  const currentStepIndex = steps.findIndex(s => s.key === status.status)

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
              <span className="stat-value">{status.counters?.pages_visited || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Products Found</span>
              <span className="stat-value">{status.counters?.products_discovered || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Products Extracted</span>
              <span className="stat-value">{status.counters?.products_extracted || 0}</span>
            </div>
          </div>

          {url && (
            <div className="crawling-url">
              <small>Crawling: {url}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

