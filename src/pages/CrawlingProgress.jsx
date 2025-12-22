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
    { key: "queued",      label: "Queued",      description: "Job added to queue" },
    { key: "crawling",    label: "Crawling",    description: "Visiting pages and discovering products" },
    { key: "parsing",     label: "Parsing",     description: "Extracting product information" },
    { key: "downloading", label: "Downloading", description: "Downloading product images" },
    { key: "enriching",   label: "Enriching",   description: "AI-powered product enrichment" },
    { key: "indexing",    label: "Indexing",    description: "Preparing for semantic search" },
    { key: "completed",   label: "Completed",   description: "Crawl finished successfully" },
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
        ws.onclose = null; // Prevent reconnection on unmount
        ws.close();
      }
    };
  }, [jobId, navigate]);

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

  const counters = status.counters || {};
  const pagesVisited = counters.pages_visited ?? 0;
  const productsDiscovered = counters.products_discovered ?? 0;
  const productsEnriched = counters.products_enriched ?? 0;

  return (
    <div className="crawl-page">
      <header className="crawl-header">
        <Logo />
        <div className="crawl-header-right">
          <button
            className="header-button"
            onClick={() => navigate("/jobs")}
            type="button"
          >
            View Jobs
          </button>
        </div>
      </header>

      <main className="crawl-main">
        <section className="crawl-card">
          <h1>Crawling in Progress</h1>
          {url && (
            <p className="crawl-url">
              <span>Target:</span> {url}
            </p>
          )}

          {/* Step indicator */}
          <div className="steps-container">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={[
                  "step",
                  index < currentStepIndex ? "step-completed" : "",
                  index === currentStepIndex ? "step-current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="step-index">{index + 1}</div>
                <div className="step-content">
                  <div className="step-label">{step.label}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="progress-wrapper">
            <div className="progress-label">
              {currentStep} ({Math.round(progress)}%)
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* REAL-TIME COUNTERS */}
          <div className="crawl-stats">
            <div className="crawl-stat">
              <span className="stat-label">Pages visited</span>
              <span className="stat-value">{pagesVisited}</span>
            </div>
            <div className="crawl-stat">
              <span className="stat-label">Products found</span>
              <span className="stat-value">{productsDiscovered}</span>
            </div>
            <div className="crawl-stat">
              <span className="stat-label">Products enriched</span>
              <span className="stat-value">{productsEnriched}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="crawl-actions">
            <button
              className="secondary-button"
              onClick={() => navigate("/jobs")}
              type="button"
            >
              View Jobs
            </button>

            <button
              className="danger-button"
              onClick={handleCancel}
              disabled={isCancelling || status.status === "completed"}
              type="button"
            >
              {isCancelling ? "Cancelling..." : "Cancel Job"}
            </button>

            {status.status === "completed" && (
              <button
                className="primary-button"
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
