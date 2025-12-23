import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import './Jobs.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function Jobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/jobs`)
        if (!resp.ok) {
          throw new Error('Failed to load jobs')
        }
        const data = await resp.json()
        setJobs(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const formatDate = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    return d.toLocaleString()
  }

  const primaryStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'job-status-completed'
      case 'failed':
        return 'job-status-failed'
      case 'crawling':
      case 'parsing':
      case 'downloading':
      case 'enriching':
      case 'indexing':
        return 'job-status-active'
      default:
        return 'job-status-idle'
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job and all its products?')) return
    setDeletingId(jobId)
    try {
      const resp = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE',
      })
      if (!resp.ok && resp.status !== 204) {
        throw new Error('Failed to delete job')
      }
      setJobs((prev) => prev.filter((j) => j.id !== jobId))
    } catch (err) {
      console.error(err)
      alert('Failed to delete job')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="jobs-page">
      <header className="jobs-header">
        <div className="jobs-header-content">
          <div className="jobs-logo">
            <Logo variant="icon-only" size="medium" />
            <h1>INNOCRAWL Jobs</h1>
          </div>
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </header>

      <main className="jobs-main">
        <div className="jobs-container">
          <div className="jobs-header-row">
            <h2>Recent Crawl Jobs</h2>
            <p>Monitor progress and reopen results for previous crawls.</p>
          </div>

          {loading ? (
            <div className="jobs-empty">Loading jobs…</div>
          ) : jobs.length === 0 ? (
            <div className="jobs-empty">No jobs yet. Start a crawl from the home page.</div>
          ) : (
            <div className="jobs-table">
              <div className="jobs-row jobs-row-head">
                <div>Job ID</div>
                <div>URL</div>
                <div>Status</div>
                <div>Products</div>
                <div>Created</div>
                <div>Finished</div>
                <div /> {/* Open Results */}
                <div /> {/* Delete */}
              </div>
              {jobs.map((job) => (
                <div key={job.id} className="jobs-row">
                  <div className="jobs-cell-mono">{job.id.slice(0, 8)}…</div>
                  <div className="jobs-cell-url" title={job.input_url}>
                    {job.input_url}
                  </div>
                  <div>
                    <span className={`job-status-pill ${primaryStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div>
                    {job.counters?.products_indexed ??
                      job.counters?.products_enriched ??
                      job.counters?.products_discovered ??
                      0}
                  </div>
                  <div>{formatDate(job.created_at)}</div>
                  <div>{formatDate(job.finished_at)}</div>
                  <div>
                    <button
                      className="jobs-open-button"
                      onClick={() =>
                        navigate('/results', {
                          state: { jobId: job.id, url: job.input_url, status: job.status },
                        })
                      }
                    >
                      Open Results
                    </button>
                  </div>
                  <div>
                    <button
                      className="jobs-delete-button"
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={deletingId === job.id}
                    >
                      {deletingId === job.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
