import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "./Results.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId, url } = location.state || {};

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("");

  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

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

  const handleReset = () => {
    setQuery("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("");
    setResults([]);
    setError("");
  };

  const handleDownloadImage = (imageUrl) => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = imageUrl.split("/").pop() || "product-image";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="results-page">
      <header className="results-header">
        <Logo />
        <button
          type="button"
          className="results-header-button"
          onClick={() => navigate("/jobs")}
        >
          View Jobs
        </button>
      </header>

      <main className="results-main">
        <section className="results-card">
          <div className="results-card-header">
            <h1>Product Search Results</h1>
            {url && (
              <p className="results-source">
                <span>Source:</span> {url}
              </p>
            )}
          </div>

          <form className="results-filters" onSubmit={handleSearch}>
            <div className="results-filter-row">
              <div className="results-filter-group results-filter-query">
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

            <div className="results-filter-row">
              <div className="results-filter-group">
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

              <div className="results-filter-group">
                <label htmlFor="minPrice">Min price</label>
                <input
                  id="minPrice"
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              <div className="results-filter-group">
                <label htmlFor="maxPrice">Max price</label>
                <input
                  id="maxPrice"
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="results-filter-group">
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

            <div className="results-filter-actions">
              <button
                type="submit"
                className="results-primary-button"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                className="results-secondary-button"
                onClick={handleReset}
              >
                Reset filters
              </button>
            </div>
          </form>

          {error && <div className="results-error">{error}</div>}

          <div className="results-grid">
            {results.length === 0 && !loading && (
              <div className="results-empty">
                <p>No results yet. Enter a search query above to find products.</p>
              </div>
            )}

            {results.map((product) => (
              <article key={product.id} className="results-product-card">
                <div className="results-product-image-wrapper">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="results-product-image"
                    />
                  ) : (
                    <div className="results-product-image-placeholder">
                      No image
                    </div>
                  )}
                </div>

                <div className="results-product-body">
                  <h3 className="results-product-title">{product.title}</h3>

                  {product.price != null && (
                    <div className="results-product-price">
                      ₹{product.price}
                    </div>
                  )}

                  {product.match_reason && (
                    <p className="results-product-match">
                      <strong>Match:</strong>{" "}
                      {product.match_reason.length > 120
                        ? `${product.match_reason.substring(0, 120)}...`
                        : product.match_reason}
                    </p>
                  )}

                  {product.description && !product.match_reason && (
                    <p className="results-product-description">
                      {product.description.length > 140
                        ? `${product.description.substring(0, 140)}...`
                        : product.description}
                    </p>
                  )}

                  <div className="results-product-actions">
                    <a
                      className="results-link-button"
                      href={product.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on site
                    </a>

                    {product.images && product.images.length > 0 && (
                      <button
                        type="button"
                        className="results-secondary-button"
                        onClick={() =>
                          handleDownloadImage(product.images[0])
                        }
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
