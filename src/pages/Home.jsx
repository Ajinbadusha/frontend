import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import URLPanel from '../components/URLPanel'
import Logo from '../components/Logo'
import LoadingScreen from '../components/LoadingScreen'
import '../App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function Home() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  /* ---------------- Start crawl ---------------- */
  const startCrawl = async (url, options) => {
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

    // Navigate to crawling progress page
    navigate('/crawling', { state: { jobId: data.job_id, url } })
  }

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
          <button
            type="button"
            className="nav-item nav-item-active full-width" // reuse one of your existing button classes
            onClick={() => navigate("/jobs")}
          >
            View previous jobs
          </button>

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
          <div className="primary-card">
            <URLPanel onStartCrawl={startCrawl} />
          </div>
        </section>
      </main>
    </div>
  )
}

