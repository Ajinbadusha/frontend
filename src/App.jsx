import { useEffect, useState } from 'react'
import URLPanel from './components/URLPanel'
import StatusPanel from './components/StatusPanel'
import SearchPanel from './components/SearchPanel'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

function App() {
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState({ status: 'idle', counters: {} })
  const [results, setResults] = useState([])
  const [wsError, setWsError] = useState(null)

  // WebSocket live status
  useEffect(() => {
    if (!jobId) return

    const wsBase = API_BASE_URL.replace('http', 'ws')
    const wsUrl = `${wsBase}/ws?job_id=${encodeURIComponent(jobId)}`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setStatus(data)
      } catch (e) {
        console.error('WS message parse error', e)
      }
    }

    ws.onerror = () => {
      setWsError('Live status connection lost')
    }

    ws.onclose = () => {}

    return () => ws.close()
  }, [jobId])

  // Start crawl from URL panel
  const startCrawl = async (url, options) => {
    setWsError(null)
    setStatus({ status: 'queued', counters: {} })

    const resp = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      alert(`Failed to start crawl: ${resp.status} ${text}`)
      return
    }

    const data = await resp.json()
    setJobId(data.job_id)
    setResults([])
  }

  // Cancel job (best-effort)
  const cancelJob = async () => {
    if (!jobId) return
    try {
      await fetch(`${API_BASE_URL}/jobs/${encodeURIComponent(jobId)}/cancel`, {
        method: 'POST',
      })
    } catch (e) {
      console.error('Cancel failed', e)
    }
  }

  // Semantic search
  const handleSearch = async (query, filters) => {
    if (!jobId) {
      alert('Start a crawl first, then search.')
      return
    }

    const params = new URLSearchParams({
      job_id: jobId,
      q: query,
      limit: '12',
    })

    // optional future: attach filters to query params

    const searchResp = await fetch(`${API_BASE_URL}/search?${params.toString()}`)

    if (!searchResp.ok) {
      const text = await searchResp.text()
      alert(`Search failed: ${searchResp.status} ${text}`)
      return
    }

    const data = await searchResp.json()
    setResults(data)
  }

  const searchEnabled =
    status.status === 'indexing' ||
    status.status === 'completed' ||
    status.status === 'failed'

  return (
    <div className="app-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-dot" />
          <div>
            <div className="logo-title">SemanticCrawler</div>
            <div className="logo-sub">Universal Extract &amp; Search</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item nav-item-active">＋ New Crawl Job</button>
          <button className="nav-item">▤ Live Monitor</button>
          <button className="nav-item">🔍 Semantic Search</button>
        </nav>

        <div className="sidebar-footer">
          <span className="footer-label">Architecture Guide</span>
          <span className="footer-tag">Student Mode</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-area">
        <header className="main-header">
          <div>
            <h1>Start Your Extraction Engine</h1>
            <p>
              Enter an ecommerce URL. The system will crawl, enrich with AI, and index for
              semantic search.
            </p>
          </div>
          <div className="status-chip">
            <span className="status-dot" />
            System operational
          </div>
        </header>

        <section className="main-content">
          {/* URL ingestion card */}
          <div className="primary-card">
            <URLPanel onStartCrawl={startCrawl} />
          </div>

          {/* Status + Search row */}
          <div className="secondary-row">
            <div className="secondary-card">
              <StatusPanel
                jobId={jobId}
                status={status}
                wsError={wsError}
                onCancelJob={cancelJob}
              />
            </div>
            <div className="secondary-card">
              <SearchPanel
                jobId={jobId}
                status={status}
                enabled={searchEnabled}
                onSearch={handleSearch}
                results={results}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
