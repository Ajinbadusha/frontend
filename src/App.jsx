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
    const wsUrl = API_BASE_URL.replace('http', 'ws') + `/ws/${jobId}`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = e => setStatus(JSON.parse(e.data))
    return () => ws.close()
  }, [jobId])

  const startCrawl = async (url, options) => {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options })
    })
    const data = await res.json()
    setJobId(data.job_id)
    setResults([])
  }

  const search = async (query) => {
    const res = await fetch(`${API_BASE_URL}/search?job_id=${jobId}&q=${encodeURIComponent(query)}&limit=10`)
    const data = await res.json()
    setResults(data)
  }

  return (
    <div className="container">
      {/* header + URLPanel + StatusPanel + SearchPanel as per your UI */}
      {!jobId ? (
        <URLPanel onStartCrawl={startCrawl} />
      ) : (
        <>
          <StatusPanel status={status} />
          <SearchPanel onSearch={search} results={results} />
        </>
      )}
    </div>
  )
}

export default App
