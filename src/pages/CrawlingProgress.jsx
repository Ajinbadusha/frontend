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
  const [currentStep, setCurrentStep] = useState("Crawl started...");
  const [isCancelling, setIsCancelling] = useState(false);

  const steps = [
    { key: "queued", label: "Queued" },
    { key: "crawling", label: "Crawling" },
    { key: "parsing", label: "Parsing" },
    { key: "downloading", label: "Downloading" },
    { key: "enriching", label: "Enriching" },
    { key: "indexing", label: "Indexing" },
    { key: "completed", label: "Completed" },
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
            setCurrentStep(steps[stepIndex].label);
            setProgress(((stepIndex + 1) / steps.length) * 100);
          }
        } catch (err) {
          console.error("WS parse error", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
      };

      ws.onclose = () => {
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts += 1;
          const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
          setTimeout(connect, delay);
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
  const productsExtracted =
    counters.products_extracted ?? counters.products_enriched ?? 0;

  return (
    <div className="cp-page">
      <header className="cp-header">
        <Logo />
      </header>

      <main className="cp-main">
        <section className="cp-card">
          <div className="cp-card-top">
            <div className="cp-title-block">
              <h1 className="cp-title">Crawling in Progress</h1>
              <p className="cp-subtitle">
                {status.status === "completed"
                  ? "Crawl finished successfully"
                  : "Crawl in progress"}
              </p>
            </div>

            <div className="cp-status-pill">
              <div className="cp-status-label">JOB STATUS</div>
              <div className="cp-status-value">{status.status}</div>
              <div className="cp-status-percent">
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          <div className="cp-progress-bar">
            <div
              className="cp-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="cp-steps">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={[
                    "cp-step",
                    isCompleted ? "cp-step-completed" : "",
                    isCurrent ? "cp-step-current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="cp-step-icon">
                    {isCompleted || isCurrent ? "✓" : index + 1}
                  </div>
                  <div className="cp-step-text">
                    <div className="cp-step-label">{step.label}</div>
                    {isCurrent && (
                      <div className="cp-step-caption">
                        {currentStep} in progress
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cp-metrics-row">
            <div className="cp-metric">
              <div className="cp-metric-label">PAGES VISITED</div>
              <div className="cp-metric-value">{pagesVisited}</div>
            </div>
            <div className="cp-metric">
              <div className="cp-metric-label">PRODUCTS FOUND</div>
              <div className="cp-metric-value">{productsFound}</div>
            </div>
            <div className="cp-metric">
              <div className="cp-metric-label">PRODUCTS EXTRACTED</div>
              <div className="cp-metric-value">{productsExtracted}</div>
            </div>
          </div>

          <div className="cp-footer">
            {url && (
              <p className="cp-footer-url">
                Crawling: <span>{url}</span>
              </p>
            )}

            <div className="cp-footer-actions">
              <button
                type="button"
                className="cp-secondary-button"
                onClick={() => navigate("/jobs")}
              >
                View jobs
              </button>

              <button
                type="button"
                className="cp-danger-button"
                onClick={handleCancel}
                disabled={isCancelling || status.status === "completed"}
              >
                {isCancelling ? "Cancelling..." : "Cancel job"}
              </button>

              {status.status === "completed" && (
                <button
                  type="button"
                  className="cp-primary-button"
                  onClick={() =>
                    navigate("/results", {
                      state: { jobId, url },
                    })
                  }
                >
                  View search results →
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
