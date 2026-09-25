import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          padding: "2rem",
          textAlign: "center"
        }}>
          <div className="card" style={{ maxWidth: 540, width: "100%", padding: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>
              Something went wrong
            </h2>
            <p className="text-muted text-sm" style={{ marginBottom: "1.25rem" }}>
              An unexpected error occurred while displaying this section.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid var(--clr-danger)",
                color: "var(--clr-danger)",
                padding: "0.75rem",
                borderRadius: "var(--r-md)",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
                textAlign: "left",
                fontFamily: "monospace",
                wordBreak: "break-word"
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={this.handleReset}>
                🔄 Refresh Page
              </button>
              <a href="/dashboard/admin" className="btn btn-ghost">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
