import React from 'react'

const STATUS_LABELS = {
  idle: 'Idle',
  queued: 'Queued',
  crawling: 'Crawling – visiting pages',
  parsing: 'Parsing – extracting products',
  downloading: 'Downloading images',
  enriching: 'Enriching – AI analysis',
  indexing: 'Indexing – preparing for search',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

function StatusPanel({ jobId, status, wsError, onCancelJob }) {
  const counters = status.counters || {}

  const canCancel =
    jobId &&
    ['queued', 'crawling', 'parsing', 'downloading', 'enriching', 'indexing'].includes(
      status.status,
    )

  return (
    <div className="status-panel">
      <div className="status-header">
        <h3>📊 Job Status &amp; Progress</h3>
        <span className={`status-pill status-${status.status || 'idle'}`}>
          {STATUS_LABELS[status.status] || 'Idle'}
        </span>
      </div>

      {wsError && <div className="status-error">{wsError}</div>}

      <div className="status-counters">
        <div>Pages Visited: {counters.pages_visited ?? 0}</div>
        <div>Products Discovered: {counters.products_discovered ?? 0}</div>
        <div>Products Extracted: {counters.products_extracted ?? 0}</div>
        <div>Images Downloaded: {counters.images_downloaded ?? 0}</div>
        <div>Products Enriched: {counters.products_enriched ?? 0}</div>
        <div>Products Indexed: {counters.products_indexed ?? 0}</div>
      </div>

      <div className="status-actions">
        {canCancel && (
          <button className="btn-secondary" onClick={onCancelJob}>
            Pause / Cancel Job
          </button>
        )}
        {!canCancel && <small>No active job to cancel.</small>}
      </div>

      <div className="status-logs">
        <div className="status-logs-header">
          <span>Live Log Stream</span>
          <small>(tail view placeholder)</small>
        </div>
        <div className="status-logs-body">
          <p>Real-time logs will appear here in a future iteration.</p>
        </div>
      </div>
    </div>
  )
}

export default StatusPanel
