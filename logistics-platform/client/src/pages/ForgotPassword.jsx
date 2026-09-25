import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export function ForgotPassword() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }

    setLoading(true);
    try {
      if (!email.trim().endsWith("@demo.com")) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }
      // Always show success (prevents email enumeration, and works in demo mode)
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>🔑</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem" }}>
            Forgot Password?
          </h1>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="card">
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  className={`form-control${error ? " error" : ""}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  autoFocus
                  required
                />
                {error && (
                  <p style={{ color: "var(--clr-danger)", fontSize: "0.83rem", marginTop: "0.4rem" }}>{error}</p>
                )}
              </div>

              <button
                id="forgot-submit-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "0.25rem" }}
                disabled={loading}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          ) : (
            /* Success state */
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📧</div>
              <h2 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Check Your Email</h2>
              <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
                We've sent a password reset link to <strong style={{ color: "var(--clr-text)" }}>{email}</strong>.
                The link expires in 1 hour.
              </p>
              <p className="text-xs text-faint" style={{ marginBottom: "1.5rem" }}>
                Didn't receive it? Check your spam folder or{" "}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ display: "inline", padding: 0, textDecoration: "underline" }}
                  onClick={() => { setSent(false); setError(""); }}
                >
                  try again
                </button>.
              </p>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--clr-border)" }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
