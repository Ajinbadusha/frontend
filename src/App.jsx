import { useState, useEffect } from 'react'
import URLPanel from './components/URLPanel'
import StatusPanel from './components/StatusPanel'
import SearchPanel from './components/SearchPanel'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

function App() {
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState({ status: 'idle', counters: {} })
  const [results, setResults] = useState([])

  useEffect(() => {
    if (!jobId) return
    const ws = new WebSocket(API_BASE_URL.replace('http', 'ws') + `/ws/${jobId}`)
    ws.onmessage = (e) => setStatus(JSON.parse(e.data))
    return () => ws.close()
  }, [jobId])

  const startCrawl = async (url, options) => {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options }),
    })
    const data = await res.json()
    setJobId(data.job_id)
    setResults([])
  }

  const search = async (query) => {
    const res = await fetch(
      `${API_BASE_URL}/search?job_id=${jobId}&q=${encodeURIComponent(query)}&limit=10`,
    )
    const data = await res.json()
    setResults(data)
  }

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
            <p>Enter an ecommerce URL. The system will crawl, enrich with AI, and index for search.</p>
          </div>
          <div className="status-chip">
            <span className="status-dot" />
            System operational
          </div>
        </header>

        <section className="main-content">
          <div className="primary-card">
            <URLPanel onStartCrawl={startCrawl} />
          </div>

          {jobId && (
            <div className="secondary-row">
              <div className="secondary-card">
                <StatusPanel status={status} />
              </div>
              <div className="secondary-card">
                <SearchPanel onSearch={search} results={results} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
