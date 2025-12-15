// src/App.jsx
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

    const wsUrl = API_BASE_URL.replace('http', 'ws') + `/ws/${jobId}`
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

  // Semantic search
  const handleSearch = async (query) => {
    if (!jobId) {
      alert('Start a crawl first, then search.')
      return
    }

    const searchResp = await fetch(
      `${API_BASE_URL}/search?job_id=${encodeURIComponent(
        jobId,
      )}&q=${encodeURIComponent(query)}&limit=12`,
    )

    if (!searchResp.ok) {
      const text = await searchResp.text()
      alert(`Search failed: ${searchResp.status} ${text}`)
      return
    }

    const data = await searchResp.json()
    setResults(data)
  }

  return (
    <div className="app-root app-root--purple-bg">
      {/* Shell */}
      <div className="shell">
        {/* Sidebar */}
        <aside className="sidebar sidebar--light">
          <div className="sidebar-logo">
            <div className="logo-mark" />
            <div className="logo-text-block">
              <div className="logo-title">SemanticCrawler</div>
              <div className="logo-sub">Universal Extract &amp; Search</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item nav-item-primary">＋ New Crawl Job</button>
            <button className="nav-item">Live Monitor</button>
            <button className="nav-item">Semantic Search</button>
          </nav>

          <div className="sidebar-footer">
            <span className="footer-label">Architecture Guide</span>
            <span className="footer-tag">Student Mode</span>
          </div>
        </aside>

        {/* Main content */}
        <main className="main main--card-surface">
          <header className="main-header main-header--compact">
            <div>
              <h1 className="main-title">New Crawl Job</h1>
              <p className="main-subtitle">
                Enter an ecommerce URL. We&apos;ll crawl, extract, enrich with AI, and index for search.
              </p>
            </div>
            <div className="status-chip status-chip--green">
              <span className="status-dot" />
              System Operational
            </div>
          </header>

          <section className="content-vertical">
            {/* URL ingestion card */}
            <section className="card card--primary">
              <URLPanel onStartCrawl={startCrawl} />
            </section>

            {/* Status + Search row */}
            <section className="card-row">
              <div className="card card--secondary">
                <StatusPanel status={status} wsError={wsError} />
              </div>
              <div className="card card--secondary">
                <SearchPanel onSearch={handleSearch} results={results} />
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
