import React, { useState, useEffect } from 'react'

function SearchPanel({ jobId, status, enabled, onSearch, results }) {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!enabled) return
    
    const filters = {
      category: selectedCategory || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
      // Note: Availability filter is not implemented in the backend search endpoint yet, so we omit it.
    }
    
    onSearch(query, filters)
  }

  const handleDownload = () => {
    if (!enabled) return

    const downloadUrl = new URL(`${import.meta.env.VITE_API_URL}/search/download`)
    downloadUrl.searchParams.append('job_id', jobId)
    downloadUrl.searchParams.append('q', query)

    // Add filters to the URL
    if (selectedCategory) {
      downloadUrl.searchParams.append('category', selectedCategory)
    }
    if (minPrice) {
      downloadUrl.searchParams.append('min_price', minPrice)
    }
    if (maxPrice) {
      downloadUrl.searchParams.append('max_price', maxPrice)
    }

    // Trigger the download (this will open the "Save As" dialog)
    window.open(downloadUrl.toString(), '_blank')
  }

  const handleOpenDetail = async (product) => {
    setSelected(product)
    setLoadingDetail(true)
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_URL}/products/${encodeURIComponent(product.id)}`,
      )
      if (resp.ok) {
        const data = await resp.json()
        setDetail(data)
      } else {
        setDetail(null)
      }
    } catch {
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeDetail = () => {
    setSelected(null)
    setDetail(null)
  }

  // Effect to fetch categories when the job status changes to completed
  useEffect(() => {
    if (jobId && status === 'completed') {
      const fetchCategories = async () => {
        try {
          const resp = await fetch(
            `${import.meta.env.VITE_API_URL}/jobs/${encodeURIComponent(jobId)}/categories`,
          )
          if (resp.ok) {
            const data = await resp.json()
            setCategories(data)
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error)
        }
      }
      fetchCategories()
    }
  }, [jobId, status])

  const statusText = enabled
    ? 'Search is ready'
    : 'Search will be enabled after indexing is available.'

  return (
    <div className="search-panel">
      <h3>🔍 Semantic Search</h3>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search: “red winter dress”, “leather shoes”, “vitamin c serum”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!enabled}
        />
        
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={!enabled || categories.length === 0}
        >
          <option value="">Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Min Price Filter */}
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          disabled={!enabled}
        />

        {/* Max Price Filter */}
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          disabled={!enabled}
        />

        <button type="submit" className="btn-primary" disabled={!enabled || !query.trim()}>
          Search
        </button>

        <button
          type="button"
          className="btn-secondary"
          disabled={!enabled}
          onClick={handleDownload}
        >
          Download Overview
        </button>
      </form>

      <small className="search-status-hint">{statusText}</small>

      {/* Results list */}
      <div className="search-results">
        {results.length === 0 && <div>No results yet. Enter your search query above.</div>}
        {results.map((prod) => (
          <div
            key={prod.id}
            className="search-result-card"
            onClick={() => handleOpenDetail(prod)}
          >
            <div className="result-main">
              <div className="result-thumb">
                {prod.images && prod.images.length > 0 ? (
                  <img src={prod.images[0]} alt={prod.title} />
                ) : (
                  <span className="no-image">No Image</span>
                )}
              </div>
              <div className="result-text">
                <div className="result-title">{prod.title}</div>
                {prod.price != null && <div className="result-price">${prod.price}</div>}
                <a
                  href={prod.source_url}
                  className="result-link"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Original →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer / modal */}
      {selected && (
        <div className="product-detail-backdrop" onClick={closeDetail}>
          <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={closeDetail}>
              ✕
            </button>
            {loadingDetail && <div>Loading...</div>}
            {!loadingDetail && detail && (
              <>
                <h4>{detail.title}</h4>
                {detail.price != null && <p className="detail-price">${detail.price}</p>}

                <div className="detail-images">
                  {detail.images?.map((img) => (
                    <div key={img.url} className="detail-image-item">
                      <img src={img.url} alt={detail.title} />
                    </div>
                  ))}
                </div>

                <div className="detail-section">
                  <h5>Enriched Description</h5>
                  <p>{detail.enrichment?.visual_summary || detail.description}</p>
                </div>

                <div className="detail-section">
                  <h5>Attributes</h5>
                  {detail.enrichment?.attributes ? (
                    <ul className="detail-attributes">
                      {Object.entries(detail.enrichment.attributes).map(([k, v]) => (
                        <li key={k}>
                          <strong>{k}:</strong> {String(v)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No structured attributes available.</p>
                  )}
                </div>

                <div className="detail-section">
                  <a href={detail.source_url} target="_blank" rel="noreferrer">
                    Open original product page →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPanel
