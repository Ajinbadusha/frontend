import { useState } from 'react'

export default function URLPanel({ onStartCrawl }) {
  const [url, setUrl] = useState('')
  const [options, setOptions] = useState({
    max_pages: 5,
    max_products: 50,
    follow_pagination: true,
    follow_links: true,
    download_images: true,
    crawl_speed: 'normal',
    force_rerun: false,
  })
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!url.trim()) {
      alert('Please enter a valid ecommerce listing URL')
      return
    }
    setLoading(true)
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
            value={options.max_products}
            onChange={(e) =>
              setOptions({
                ...options,
                max_products: Number(e.target.value) || 1,
              })
            }
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="crawlSpeed">Crawl speed</label>
          <select
            id="crawlSpeed"
            className="input"
            value={options.crawl_speed}
            onChange={(e) =>
              setOptions({
                ...options,
                crawl_speed: e.target.value,
              })
            }
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
            checked={options.follow_pagination}
            onChange={(e) =>
              setOptions({
                ...options,
                follow_pagination: e.target.checked,
              })
            }
            disabled={loading}
          />
          <span>Follow pagination</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={options.follow_links}
            onChange={(e) =>
              setOptions({
                ...options,
                follow_links: e.target.checked,
              })
            }
            disabled={loading}
          />
          <span>Follow product links</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={options.download_images}
            onChange={(e) =>
              setOptions({
                ...options,
                download_images: e.target.checked,
              })
            }
            disabled={loading}
          />
          <span>Download images</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={options.force_rerun}
            onChange={(e) =>
              setOptions({
                ...options,
                force_rerun: e.target.checked,
              })
            }
            disabled={loading}
          />
          <span>Force re-crawl</span>
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
