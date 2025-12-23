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
    <div className="res-page">
      <header className="res-header">
        <Logo />
        <button
          type="button"
          className="res-back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>
      </header>

      <main className="res-main">
        <section className="res-card">
          <div className="res-card-header">
            <h1 className="res-title">Product Search Results</h1>
            {url && (
              <p className="res-source">
                Source: <span>{url}</span>
              </p>
            )}
          </div>

          {/* filter row like screenshot */}
          <form className="res-filters" onSubmit={handleSearch}>
            <div className="res-filters-row">
              <input
                className="res-input res-input-query"
                type="text"
                placeholder="Search query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <select
                className="res-input res-input-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                className="res-input res-input-price"
                type="number"
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />

              <input
                className="res-input res-input-price"
                type="number"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />

              <input
                className="res-input res-input-availability"
                type="text"
                placeholder="Any stock"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              />

              <button
                type="submit"
                className="res-search-button"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {error && <div className="res-error">{error}</div>}

          {results.length > 0 && (
            <p className="res-count">
              Found {results.length} product{results.length !== 1 ? "s" : ""}
            </p>
          )}

          <div className="res-grid">
            {results.length === 0 && !loading && (
              <div className="res-empty">
                No results yet. Enter a search query above to find products.
              </div>
            )}

            {results.map((product) => (
              <article key={product.id} className="res-product-card">
                <div className="res-product-image-wrap">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="res-product-image"
                    />
                  ) : (
                    <div className="res-product-image-placeholder">
                      No image
                    </div>
                  )}
                </div>

                <div className="res-product-body">
                  <h3 className="res-product-title">{product.title}</h3>

                  {product.price != null && (
                    <div className="res-product-price">
                      ₹{product.price}
                    </div>
                  )}

                  {product.match_reason && (
                    <p className="res-product-match">
                      Match:{" "}
                      {product.match_reason.length > 120
                        ? `${product.match_reason.substring(0, 120)}...`
                        : product.match_reason}
                    </p>
                  )}

                  <div className="res-product-links">
                    <a
                      className="res-product-link"
                      href={product.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Original →
                    </a>

                    {product.images && product.images.length > 0 && (
                      <button
                        type="button"
                        className="res-product-download"
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
