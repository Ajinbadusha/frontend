import { useState, useEffect } from 'react'
import './App.css'
import URLPanel from './components/URLPanel'
import StatusPanel from './components/StatusPanel'
import SearchPanel from './components/SearchPanel'

function App() {
  const [jobId, setJobId] = useState(null)
  const [status, setStatus] = useState({ status: 'idle', counters: {} })
  const [results, setResults] = useState([])
  const [ws, setWs] = useState(null)

  useEffect(() => {
    if (jobId) {
      const wsUrl = `ws://localhost:8000/ws/${jobId}`
      const websocket = new WebSocket(wsUrl)
      
      websocket.onmessage = (event) => {
        setStatus(JSON.parse(event.data))
      }
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      setWs(websocket)
      
      return () => {
        websocket.close()
      }
    }
  }, [jobId])

  const handleStartCrawl = async (url, options) => {
    try {
      const response = await fetch('http://localhost:8000/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options })
      })
      const data = await response.json()
      setJobId(data.job_id)
      setResults([])
    } catch (error) {
      console.error('Error starting crawl:', error)
      alert('Failed to start crawl. Is the backend running?')
    }
  }

  const handleSearch = async (query) => {
    if (!jobId) return
    try {
      const response = await fetch(`http://localhost:8000/search?job_id=${jobId}&q=${query}&limit=10`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🛒 Universal Ecommerce Crawler</h1>
        <p>AI-powered semantic search with real-time crawling</p>
      </header>

      <div className="panels">
        {!jobId ? (
          <URLPanel onStartCrawl={handleStartCrawl} />
        ) : (
          <>
            <StatusPanel status={status} />
            <SearchPanel onSearch={handleSearch} results={results} />
          </>
        )}
      </div>
    </div>
  )
}

export default App

