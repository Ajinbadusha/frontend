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

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        setCurrentStep("Connection error. Retrying...");
      };

      ws.onclose = () => {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts += 1;
          const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
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
      console.error("Cancel error", err);
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
    <div className="crawling-page">
      <header className="crawling-header">
        <Logo />
        <button
          type="button"
          className="crawling-header-button"
          onClick={() => navigate("/jobs")}
        >
          View Jobs
        </button>
      </header>

      <main className="crawling-main">
        <section className="crawling-card">
          <div className="crawling-card-header">
            <h1>Crawling in Progress</h1>
            {url && (
              <p className="crawling-target">
                <span>Target:</span> {url}
              </p>
            )}
          </div>

          <div className="crawling-steps">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={[
                  "crawling-step",
                  index < currentStepIndex ? "crawling-step-completed" : "",
                  index === currentStepIndex ? "crawling-step-current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="crawling-step-index">{index + 1}</div>
                <div className="crawling-step-body">
                  <div className="crawling-step-title">{step.label}</div>
                  <div className="crawling-step-description">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="crawling-progress">
            <div className="crawling-progress-label">
              {currentStep} ({Math.round(progress)}%)
            </div>
            <div className="crawling-progress-bar">
              <div
                className="crawling-progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* metrics section – only numbers are dynamic */}
          <div className="crawling-metrics">
            <div className="crawling-metric">
              <div className="crawling-metric-label">Pages visited</div>
              <div className="crawling-metric-value">{pagesVisited}</div>
            </div>
            <div className="crawling-metric">
              <div className="crawling-metric-label">Products found</div>
              <div className="crawling-metric-value">{productsFound}</div>
            </div>
            <div className="crawling-metric">
              <div className="crawling-metric-label">Products enriched</div>
              <div className="crawling-metric-value">{productsEnriched}</div>
            </div>
          </div>

          <div className="crawling-actions">
            <button
              type="button"
              className="crawling-secondary-button"
              onClick={() => navigate("/jobs")}
            >
              View Jobs
            </button>
            <button
              type="button"
              className="crawling-danger-button"
              onClick={handleCancel}
              disabled={isCancelling || status.status === "completed"}
            >
              {isCancelling ? "Cancelling..." : "Cancel Job"}
            </button>
            {status.status === "completed" && (
              <button
                type="button"
                className="crawling-primary-button"
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
