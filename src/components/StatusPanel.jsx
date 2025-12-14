export default function StatusPanel({ status }) {
  const counters = status.counters || {}
  
  const statusColors = {
    'queued': '#808080',
    'crawling': '#FFA500',
    'parsing': '#FF6347',
    'downloading': '#4169E1',
    'enriching': '#9370DB',
    'indexing': '#20B2AA',
    'completed': '#32CD32',
    'failed': '#DC143C'
  }

  return (
    <div className="panel status-panel">
      <h2>📊 Job Status & Progress</h2>
      
      <div className="status-badge" style={{ backgroundColor: statusColors[status.status] }}>
        {status.status?.toUpperCase() || 'IDLE'}
      </div>

      <div className="counters-grid">
        <div className="counter">
          <span className="counter-value">{counters.pages_visited || 0}</span>
          <span className="counter-label">Pages Visited</span>
        </div>
        <div className="counter">
          <span className="counter-value">{counters.products_discovered || 0}</span>
          <span className="counter-label">Products Discovered</span>
        </div>
        <div className="counter">
          <span className="counter-value">{counters.products_extracted || 0}</span>
          <span className="counter-label">Products Extracted</span>
        </div>
        <div className="counter">
          <span className="counter-value">{counters.images_downloaded || 0}</span>
          <span className="counter-label">Images Downloaded</span>
        </div>
        <div className="counter">
          <span className="counter-value">{counters.products_enriched || 0}</span>
          <span className="counter-label">Products Enriched</span>
        </div>
        <div className="counter">
          <span className="counter-value">{counters.products_indexed || 0}</span>
          <span className="counter-label">Products Indexed</span>
        </div>
      </div>

      {status.error && (
        <div className="error-box">
          <strong>Error:</strong> {status.error}
        </div>
      )}
    </div>
  )
}

