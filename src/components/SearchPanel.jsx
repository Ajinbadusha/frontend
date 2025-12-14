import { useState } from 'react'

export default function SearchPanel({ onSearch, results }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    await onSearch(query)
    setLoading(false)
  }

  return (
    <div className="panel search-panel">
      <h2>🔍 Semantic Search</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder='Search: "red winter dress", "leather shoes", "wireless headphones"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="input"
          disabled={loading}
        />
        <button
          onClick={handleSearch}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="results-grid">
        {results.length === 0 ? (
          <p className="no-results">No results yet. Enter your search query above.</p>
        ) : (
          results.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.title} />
                ) : (
                  <div className="image-placeholder">No Image</div>
                )}
              </div>
              <div className="product-info">
                <h3>{product.title}</h3>
                <p className="price">${product.price?.toFixed(2) || 'N/A'}</p>
                <a href={product.source_url} target="_blank" rel="noreferrer" className="source-link">
                  View Original →
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

