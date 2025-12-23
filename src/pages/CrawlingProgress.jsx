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
        console.log("WebSocket connected");
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
        console.log("WebSocket closed");

        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`
          );
          setTimeout(connect, delay);
        } else {
          setCurrentStep("Connection lost. Please refresh the page.");
        }
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null; // prevent reconnect-on-unmount
        ws.close();
      }
    };
  }, [jobId, navigate, steps]);

  const handleCancel = async () => {
    if (!jobId) return;
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to cancel this crawl?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, {
        method: "POST",
      });
      if (resp.ok) {
        setCurrentStep("Cancellation requested...");
      } else {
        alert("Failed to cancel job");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel job");
    } finally {
      setIsCancelling(false);
    }
  };

  const currentStepIndex = steps.findIndex((s) => s.key === status.status);

  // LIVE COUNTERS (used in your existing metric boxes)
  const counters = status.counters || {};
  const pagesVisited = counters.pages_visited ?? 0;
  const productsFound = counters.products_discovered ?? 0;
  const productsExtracted =
    counters.products_extracted ?? counters.products_enriched ?? 0;

  return (
    <div className="crawling-page">
      <header className="crawling-header">
        <Logo />
      </header>

      <main className="crawling-main">
        <section className="crawling-card">
          <div className="crawling-card-header">
            <div>
              <h1 className="crawling-title">Crawling in Progress</h1>
              <p className="crawling-subtitle">
                {status.status === "completed"
                  ? "Crawl finished successfully"
                  : "Crawl in progress"}
              </p>
            </div>

            <div className="crawling-status-pill">
              <div className="crawling-status-label">JOB STATUS</div>
              <div className="crawling-status-value">{status.status}</div>
              <div className="crawling-status-percent">
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          <div className="crawling-progress-bar">
            <div
              className="crawling-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="crawling-steps">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={[
                    "crawling-step",
                    isCompleted ? "crawling-step-completed" : "",
                    isCurrent ? "crawling-step-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="crawling-step-icon">
                    {isCompleted || isCurrent ? "✓" : index + 1}
                  </div>
                  <div className="crawling-step-text">
                    <div className="crawling-step-title">{step.label}</div>
                    {isCurrent && (
                      <div className="crawling-step-description">
                        {currentStep}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metrics row – values are now dynamic */}
          <div className="crawling-metrics">
            <div className="crawling-metric">
              <div className="crawling-metric-label">PAGES VISITED</div>
              <div className="crawling-metric-value">{pagesVisited}</div>
            </div>
            <div className="crawling-metric">
              <div className="crawling-metric-label">PRODUCTS FOUND</div>
              <div className="crawling-metric-value">{productsFound}</div>
            </div>
            <div className="crawling-metric">
              <div className="crawling-metric-label">PRODUCTS EXTRACTED</div>
              <div className="crawling-metric-value">{productsExtracted}</div>
            </div>
          </div>

          {url && (
            <p className="crawling-footer-url">
              Crawling: <span>{url}</span>
            </p>
          )}

          {/* Actions – keep your original buttons / classes */}
          <div className="crawling-actions">
            {status.status !== "completed" &&
              status.status !== "failed" &&
              status.status !== "cancelled" && (
                <button
                  type="button"
                  className="crawling-cancel-button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Cancel job"}
                </button>
              )}

            {(status.status === "completed" ||
              status.status === "failed" ||
              status.status === "cancelled") && (
              <>
                <button
                  type="button"
                  className="crawling-secondary-button"
                  onClick={() => navigate("/jobs")}
                >
                  View jobs
                </button>
                <button
                  type="button"
                  className="crawling-primary-button"
                  onClick={() =>
                    navigate("/results", {
                      state: { jobId, url },
                    })
                  }
                >
                  View search results →
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
