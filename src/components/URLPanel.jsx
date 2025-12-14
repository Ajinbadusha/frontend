import { useState } from 'react'

export default function URLPanel({ onStartCrawl }) {
  const [url, setUrl] = useState('')
  const [maxProducts, setMaxProducts] = useState(5)
  const [followPagination, setFollowPagination] = useState(true)
  const [downloadImages, setDownloadImages] = useState(true)
  const [crawlSpeed, setCrawlSpeed] = useState('normal')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!url.trim()) {
      alert('Please enter a URL')
      return
    }
    
    setLoading(true)
    
    const options = {
      max_pages: 5,
      max_products: maxProducts,
      follow_pagination: followPagination,
      follow_links: true,
      download_images: downloadImages,
      crawl_speed: crawlSpeed
    }
    
    await onStartCrawl(url, options)
    setLoading(false)
  }

  return (
    <div className="panel url-panel">
      <h2>🔗 URL Ingestion</h2>
      
      <div className="form-group">
        <label>Ecommerce Listing URL</label>
        <input
          type="text"
          placeholder="https://example.com/category/shirts"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input"
          disabled={loading}
        />
        <small>Enter a product category, search results, or collection page</small>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Max Products to Crawl</label>
          <input
            type="number"
            min="1"
            max="100"
            value={maxProducts}
            onChange={(e) => setMaxProducts(parseInt(e.target.value))}
            className="input"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Crawl Speed</label>
          <select
            value={crawlSpeed}
            onChange={(e) => setCrawlSpeed(e.target.value)}
            className="input"
            disabled={loading}
          >
            <option value="slow">Slow (respectful)</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
      </div>

      <div className="form-row checkbox">
        <label>
          <input
            type="checkbox"
            checked={followPagination}
            onChange={(e) => setFollowPagination(e.target.checked)}
            disabled={loading}
          />
          Follow Pagination
        </label>
        <label>
          <input
            type="checkbox"
            checked={downloadImages}
            onChange={(e) => setDownloadImages(e.target.checked)}
            disabled={loading}
          />
          Download Images
        </label>
      </div>

      <button
        onClick={handleStart}
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Starting...' : '🚀 Start Crawling'}
      </button>
    </div>
  )
}

