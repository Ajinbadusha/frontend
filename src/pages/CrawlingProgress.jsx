import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import "./CrawlingProgress.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function CrawlingProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId, url } = location.state || {};

  const [status, setStatus] = useState({ status: "queued", counters: {} });
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing crawl...");
  const [isCancelling, setIsCancelling] = useState(false);

  const steps = [
    { key: "queued", label: "Queued", description: "Job added to queue" },
    {
      key: "crawling",
      label: "Crawling",
      description: "Visiting pages and discovering products",
    },
    {
      key: "parsing",
      label: "Parsing",
      description: "Extracting product information",
    },
    {
      key: "downloading",
      label: "Downloading",
      description: "Downloading product images",
    },
    {
      key: "enriching",
      label: "Enriching",
      description: "AI-powered product enrichment",
    },
    {
      key: "indexing",
      label: "Indexing",
      description: "Preparing for semantic search",
    },
    {
      key: "completed",
      label: "Completed",
      description: "Crawl finished successfully",
    },
  ];

  useEffect(() => {
    if (!jobId) {
      navigate("/");
      return;
    }

    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    const connect = () => {
      const wsBase = API_BASE_URL.replace(/^http/, "ws");
      ws = new WebSocket(`${wsBase}/ws?job_id=${encodeURIComponent(jobId)}`);

      ws.onopen = () => {
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStatus(data);

          const stepIndex = steps.findIndex((s) => s.key === data.status);
          if (stepIndex >= 0) {
            setCurrentStep(steps[stepIndex].description);
            setProgress(((stepIndex + 1) / steps.length) * 100);
          }
        } catch (err) {
          console.error("WS parse error", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setCurrentStep("Connection error. Retrying...");
      };

      ws.onclose = () => {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          setTimeout(connect, delay);
        } else {
          setCurrentStep("Connection lost. Please refresh the page.");
        }
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [jobId, navigate]);

  const handleCancel = async () => {
    if (!jobId) return;
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to cancel this crawl?")) return;

    setIsCancelling(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
        method: "POST",
      });
      if (!resp.ok) {
        alert("Failed to cancel job");
      } else {
        setCurrentStep("Cancellation requested...");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel job");
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.key === status.status);

  const counters = status.counters || {};
  const pagesVisited = counters.pages_visited ?? 0;
  const productsFound = counters.products_discovered ?? 0;
  const productsEnriched = counters.products_enriched ?? 0;

  return (
    <div className="crawl-page">
      <header className="crawl-header">
        <Logo />
        <button
          className="crawl-header-button"
          type="button"
          onClick={() => navigate("/jobs")}
        >
          View Jobs
        </button>
      </header>

      <main className="crawl-main">
        <section className="crawl-card">
          <div className="crawl-card-header">
            <h1>Crawling in Progress</h1>
            {url && (
              <p className="crawl-target-url">
                <span>Target:</span> {url}
              </p>
            )}
          </div>

          <div className="crawl-steps">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={[
                  "crawl-step",
                  index < currentStepIndex ? "crawl-step-completed" : "",
                  index === currentStepIndex ? "crawl-step-current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="crawl-step-index">{index + 1}</div>
                <div className="crawl-step-body">
                  <div className="crawl-step-title">{step.label}</div>
                  <div className="crawl-step-description">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="crawl-progress">
            <div className="crawl-progress-label">
              {currentStep} ({Math.round(progress)}%)
            </div>
            <div className="crawl-progress-bar">
              <div
                className="crawl-progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Real-time counters in your existing section */}
          <div className="crawl-metrics">
            <div className="crawl-metric">
              <div className="crawl-metric-label">PAGES VISITED</div>
              <div className="crawl-metric-value">{pagesVisited}</div>
            </div>
            <div className="crawl-metric">
              <div className="crawl-metric-label">PRODUCTS FOUND</div>
              <div className="crawl-metric-value">{productsFound}</div>
            </div>
            <div className="crawl-metric">
              <div className="crawl-metric-label">PRODUCTS ENRICHED</div>
              <div className="crawl-metric-value">{productsEnriched}</div>
            </div>
          </div>

          <div className="crawl-actions">
            <button
              className="crawl-secondary-button"
              type="button"
              onClick={() => navigate("/jobs")}
            >
              View Jobs
            </button>

            <button
              className="crawl-danger-button"
              type="button"
              onClick={handleCancel}
              disabled={isCancelling || status.status === "completed"}
            >
              {isCancelling ? "Cancelling..." : "Cancel Job"}
            </button>

            {status.status === "completed" && (
              <button
                className="crawl-primary-button"
                type="button"
                onClick={() =>
                  navigate("/results", {
                    state: { jobId, url },
                  })
                }
              >
                View Results
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
