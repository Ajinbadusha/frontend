import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "./Results.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobId, url } = location.state || {};

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    // Fetch categories for this job
    const fetchCategories = async () => {
      try {
        const resp = await fetch(
          `${API_BASE_URL}/jobs/${encodeURIComponent(jobId)}/categories`
        );
        if (!resp.ok) return;
        const data = await resp.json();
        setCategories(data || []);
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };

    fetchCategories();
  }, [jobId, navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!jobId) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    params.set("job_id", jobId);
    params.set("q", query || "");

    if (selectedCategory) params.set("category", selectedCategory);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (availability) params.set("availability", availability);

    try {
      const resp = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
      if (!resp.ok) {
        setError("Search failed. Please try again.");
        setResults([]);
        return;
      }
      const data = await resp.json();
      setResults(data || []);
    } catch (err) {
      console.error("Search error", err);
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = (product) => {
    if (!product.images || product.images.length === 0) return;
    const url = product.images[0];
    // simplest: open in new tab (browser download from there)
    const link = document.createElement("a");
    link.href = url;
    link.download = ""; // let browser pick filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="results-page">
      <header className="results-header">
        <Logo />
        <div className="results-header-right">
          <button
            className="header-button"
            onClick={() => navigate("/jobs")}
            type="button"
          >
            View Jobs
          </button>
        </div>
      </header>

      <main className="results-main">
        <section className="results-card">
          <h1>Product Search Results</h1>
          {url && (
            <p className="results-url">
              <span>Source:</span> {url}
            </p>
          )}

          {/* Search + filters */}
          <form className="results-form" onSubmit={handleSearch}>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="query">Search query</label>
                <input
                  id="query"
                  type="text"
                  placeholder="e.g. red running shoes"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="minPrice">Min price</label>
                <input
                  id="minPrice"
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxPrice">Max price</label>
                <input
                  id="maxPrice"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability">Availability</label>
                <input
                  id="availability"
                  type="text"
                  placeholder="e.g. in stock"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  navigate("/results", {
                    replace: true,
                    state: { jobId, url },
                  })
                }
              >
                Reset filters
              </button>
            </div>
          </form>

          {error && <div className="error-banner">{error}</div>}

          {/* Results grid */}
          <div className="results-grid">
            {results.length === 0 && !loading && (
              <div className="empty-state">
                <p>No results yet. Enter a search query above to find products.</p>
              </div>
            )}

            {results.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-image-wrapper">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">No image</div>
                  )}
                </div>

                <div className="product-content">
                  <h3 className="product-title">{product.title}</h3>

                  {product.price != null && (
                    <div className="product-price">₹{product.price}</div>
                  )}

                  {/* Match reason / description */}
                  {product.match_reason && (
                    <p className="product-match">
                      <strong>Match:</strong>{" "}
                      {product.match_reason.length > 120
                        ? `${product.match_reason.substring(0, 120)}...`
                        : product.match_reason}
                    </p>
                  )}

                  {product.description && !product.match_reason && (
                    <p className="product-description">
                      {product.description.length > 140
                        ? `${product.description.substring(0, 140)}...`
                        : product.description}
                    </p>
                  )}

                  <div className="product-actions">
                    <a
                      href={product.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="link-button"
                    >
                      View on site
                    </a>

                    {product.images && product.images.length > 0 && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleDownloadImage(product)}
                      >
                        Download image
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
