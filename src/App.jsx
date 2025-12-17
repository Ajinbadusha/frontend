import { useEffect, useState } from 'react'
import URLPanel from './components/URLPanel'
import StatusPanel from './components/StatusPanel'
import SearchPanel from './components/SearchPanel'
import Logo from './components/Logo'
import LoadingScreen from './components/LoadingScreen'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

function App() {
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState({ status: 'idle', counters: {} })
  const [results, setResults] = useState([])
  const [wsError, setWsError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  /* ---------------- WebSocket live updates ---------------- */
  useEffect(() => {
    if (!jobId) return

    const wsBase = API_BASE_URL.replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsBase}/ws?job_id=${encodeURIComponent(jobId)}`)

    ws.onmessage = (event) => {
      try {
        setStatus(JSON.parse(event.data))
      } catch (err) {
        console.error('WS parse error', err)
      }
    }

    ws.onerror = () => setWsError('Live connection lost')

    return () => ws.close()
  }, [jobId])

  /* ---------------- Start crawl ---------------- */
  const startCrawl = async (url, options) => {
    setWsError(null)
    setStatus({ status: 'queued', counters: {} })

    const resp = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options }),
    })

    if (!resp.ok) {
      alert('Failed to start crawl')
      return
    }

    const data = await resp.json()
    setJobId(data.job_id)
    setResults([])
  }

  /* ---------------- Cancel crawl ---------------- */
  const cancelJob = async () => {
    if (!jobId) return
    try {
      await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, { method: 'POST' })
    } catch (err) {
      console.error(err)
    }
  }

  /* ---------------- Semantic search ---------------- */
  const handleSearch = async (query) => {
    if (!jobId) return alert('Start a crawl first')

    const params = new URLSearchParams({
      job_id: jobId,
      q: query,
      limit: '12',
    })

    const resp = await fetch(`${API_BASE_URL}/search?${params}`)
    if (!resp.ok) return alert('Search failed')

    setResults(await resp.json())
  }

  const searchEnabled =
    status.status === 'indexing' ||
    status.status === 'completed' ||
    status.status === 'failed'

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="app-root">
      {/* ================= Sidebar ================= */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Logo variant="icon-only" size="medium" />
          <div>
            <div className="logo-title">INNOCRAWL</div>
            <div className="logo-sub">Ecommerce Crawler</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item nav-item-active">＋ New Crawl</button>
          <button className="nav-item">▤ Live Monitor</button>
          <button className="nav-item">🔍 Semantic Search</button>
        </nav>

        <div className="sidebar-footer">
          <span>Architecture Guide</span>
          <span className="footer-tag">Student Mode</span>
        </div>
      </aside>

      {/* ================= Main ================= */}
      <main className="main-area">
        <header className="main-header">
          <div className="header-left">
            <Logo variant="icon-only" size="small" />
            <div>
              <h1>Ecommerce Crawler</h1>
              <p>
                Extract products from any ecommerce site. AI-powered crawling, enrichment,
                and semantic search.
              </p>
            </div>
          </div>

          <div className="status-chip">
            <span className="status-dot" />
            System operational
          </div>
        </header>

        <section className="main-content">
          <div className="primary-card panel">
            <URLPanel onStartCrawl={startCrawl} />
          </div>

          <div className="secondary-row">
            <div className="panel">
              <StatusPanel
                jobId={jobId}
                status={status}
                wsError={wsError}
                onCancelJob={cancelJob}
              />
            </div>

            <div className="panel">
              <SearchPanel
                enabled={searchEnabled}
                status={status}
                results={results}
                onSearch={handleSearch}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
