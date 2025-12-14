import { useState } from 'react'

export default function URLPanel({ onStartCrawl }) {
  const [url, setUrl] = useState('')
  const [maxProducts, setMaxProducts] = useState(5)
  const [crawlSpeed, setCrawlSpeed] = useState('normal')
  const [followPagination, setFollowPagination] = useState(true)
  const [downloadImages, setDownloadImages] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!url.trim()) {
      alert('Please enter a valid ecommerce listing URL')
      return
    }
    setLoading(true)
    const options = {
      max_pages: 5,
      max_products: maxProducts,
      follow_pagination: followPagination,
      follow_links: true,
      download_images: downloadImages,
      crawl_speed: crawlSpeed,
    }
    await onStartCrawl(url, options)
    setLoading(false)
  }

  return (
    <div className="panel url-panel">
      <div className="panel-header">
        <h2>🔗 URL Ingestion</h2>
        <p>Paste an ecommerce listing, collection, or search results URL to start a crawl.</p>
      </div>

      <div className="form-group">
        <label htmlFor="url">Ecommerce Listing URL</label>
        <input
          id="url"
          type="text"
          className="input"
          placeholder="https://example.com/category/shirts"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <small>Enter a product category, search results, or collection page.</small>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="maxProducts">Max products to crawl</label>
          <input
            id="maxProducts"
            type="number"
            min="1"
            max="100"
            className="input"
            value={maxProducts}
            onChange={(e) => setMaxProducts(Number(e.target.value) || 1)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="crawlSpeed">Crawl speed</label>
          <select
            id="crawlSpeed"
            className="input"
            value={crawlSpeed}
            onChange={(e) => setCrawlSpeed(e.target.value)}
            disabled={loading}
          >
            <option value="slow">Slow (safer)</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast (demo)</option>
          </select>
        </div>
      </div>

      <div className="toggles-row">
        <label className="toggle">
          <input
            type="checkbox"
            checked={followPagination}
            onChange={(e) => setFollowPagination(e.target.checked)}
            disabled={loading}
          />
          <span>Follow pagination</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={downloadImages}
            onChange={(e) => setDownloadImages(e.target.checked)}
            disabled={loading}
          />
          <span>Download images</span>
        </label>
      </div>

      <button
        className="btn btn-primary full-width"
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? 'Starting…' : '🚀 Start crawling'}
      </button>
    </div>
  )
}
