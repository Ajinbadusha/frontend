import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import './Results.css'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function Results() {
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId, url, status } = location.state || {}
  
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productDetail, setProductDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!jobId) {
      navigate('/')
    }
  }, [jobId, navigate])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim() || !jobId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        job_id: jobId,
        q: searchQuery,
        limit: '20',
      })

      const resp = await fetch(`${API_BASE_URL}/search?${params}`)
      if (resp.ok) {
        const data = await resp.json()
        setResults(data)
      } else {
        alert('Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = async (product) => {
    setSelectedProduct(product)
    setLoadingDetail(true)
    try {
      const resp = await fetch(
        `${API_BASE_URL}/products/${encodeURIComponent(product.id)}`
      )
      if (resp.ok) {
        const data = await resp.json()
        setProductDetail(data)
      } else {
        setProductDetail(null)
      }
    } catch (error) {
      console.error('Detail fetch error:', error)
      setProductDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeDetail = () => {
    setSelectedProduct(null)
    setProductDetail(null)
  }

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="results-header-content">
          <div className="results-logo">
            <Logo variant="icon-only" size="medium" />
            <h1>INNOCRAWL</h1>
          </div>
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </header>

      <main className="results-main">
        <div className="results-container">
          <div className="results-header-section">
            <h2>Product Search Results</h2>
            {url && <p className="results-source">Source: {url}</p>}
          </div>

          <form className="results-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products: e.g., 'red winter dress', 'leather shoes', 'vitamin c serum'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="results-search-input"
            />
            <button type="submit" className="results-search-button" disabled={loading || !searchQuery.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {results.length > 0 && (
            <div className="results-count">
              Found {results.length} product{results.length !== 1 ? 's' : ''}
            </div>
          )}

          <div className="results-grid">
            {results.length === 0 ? (
              <div className="results-empty">
                <p>No results yet. Enter a search query above to find products.</p>
              </div>
            ) : (
              results.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="product-image-container">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="product-image"
                      />
                    ) : (
                      <div className="product-image-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>
                    {product.price != null && (
                      <div className="product-price">${product.price}</div>
                    )}
                    {product.description && (
                      <p className="product-description">
                        {product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description}
                      </p>
                    )}
                    <div className="product-footer">
                      <a
                        href={product.source_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="product-link"
                      >
                        View Original →
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {selectedProduct && (
        <div className="product-detail-overlay" onClick={closeDetail}>
          <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close-button" onClick={closeDetail}>
              ×
            </button>
            {loadingDetail ? (
              <div className="detail-loading">Loading product details...</div>
            ) : productDetail ? (
              <div className="product-detail-content">
                <h2 className="detail-title">{productDetail.title}</h2>
                {productDetail.price != null && (
                  <div className="detail-price">${productDetail.price}</div>
                )}

                {productDetail.images && productDetail.images.length > 0 && (
                  <div className="detail-images">
                    {productDetail.images.map((img, idx) => (
                      <div key={idx} className="detail-image-item">
                        <img src={img.url || img} alt={productDetail.title} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="detail-section">
                  <h3>Description</h3>
                  <p>
                    {productDetail.enrichment?.visual_summary ||
                      productDetail.description ||
                      'No description available.'}
                  </p>
                </div>

                {productDetail.enrichment?.attributes && (
                  <div className="detail-section">
                    <h3>Attributes</h3>
                    <div className="detail-attributes">
                      {Object.entries(productDetail.enrichment.attributes).map(
                        ([key, value]) => (
                          <div key={key} className="attribute-item">
                            <span className="attribute-key">{key}:</span>
                            <span className="attribute-value">{String(value)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <a
                    href={productDetail.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="detail-source-link"
                  >
                    View Original Product Page →
                  </a>
                </div>
              </div>
            ) : (
              <div className="detail-error">Failed to load product details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

