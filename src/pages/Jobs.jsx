import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import './Jobs.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function Jobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        if (!API_BASE_URL) {
          throw new Error('API base URL is not configured')
        }
        const resp = await fetch(`${API_BASE_URL}/jobs`)
        if (!resp.ok) {
          throw new Error(`Failed to load jobs (status ${resp.status})`)
        }
        const data = await resp.json()
        setJobs(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        setError(err.message || 'Failed to load jobs')
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

  const openJob = (job) => {
    // Always navigate with the correct jobId and URL in state
    navigate('/crawling', {
      state: {
        jobId: job.id,
        url: job.input_url,
      },
    })
  }

  return (
    <div className="jobs-layout">
      <header className="jobs-header">
        <Logo />
      </header>

      <main className="jobs-main">
        <section className="jobs-card">
          <div className="jobs-card-header">
            <h1>Recent Crawl Jobs</h1>
            <p>Monitor progress and reopen results for previous crawls.</p>
          </div>

          {loading && <p className="jobs-loading">Loading jobs...</p>}

          {error && !loading && (
            <p className="jobs-error">Error loading jobs: {error}</p>
          )}

          {!loading && !error && jobs.length === 0 && (
            <p className="jobs-empty">No jobs found yet.</p>
          )}

          {!loading && !error && jobs.length > 0 && (
            <div className="jobs-table-wrapper">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Finished</th>
                    <th>Products</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="jobs-row"
                      onClick={() => openJob(job)}
                    >
                      <td className="jobs-url">{job.input_url}</td>
                      <td>
                        <span
                          className={`jobs-status-pill ${primaryStatusColor(
                            job.status,
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td>{formatDate(job.created_at)}</td>
                      <td>{formatDate(job.finished_at)}</td>
                      <td>{job.counters?.products_extracted ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
