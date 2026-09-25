import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  function redirectByRole(user) {
    const routes = {
      admin: "/dashboard/admin",
      driver: "/dashboard/driver",
      customer: "/dashboard/customer",
    };
    navigate(routes[user?.role] ?? "/dashboard/customer", { replace: true });
  }

  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      redirectByRole(user);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      redirectByRole(user);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleFillDemo(demoType = "customer") {
    setEmail(`${demoType}@demo.com`);
    setPassword("demo123");
    setError("");
  }

  function openForgot() {
    setResetEmail(email); // pre-fill if email already entered
    setResetError("");
    setResetSuccess(false);
    setShowForgot(true);
  }

  function closeForgot() {
    setShowForgot(false);
    setResetEmail("");
    setResetError("");
    setResetSuccess(false);
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError("Please enter a valid email address.");
      return;
    }

    // Demo accounts don't have real emails
    if (resetEmail.endsWith("@demo.com")) {
      setResetError("Demo accounts cannot reset passwords. Please use a real email address.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSuccess(true);
    } catch (err) {
      setResetError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-up">
        {/* Brand Logo */}
        <div className="auth-logo">
          <span style={{ fontSize: "1.4rem" }}>📦</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
            Logistics Platform
          </span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in with your credentials to access your dashboard.</p>

        {/* Error banner */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }} role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          id="login-form"
          className="auth-form"
          onSubmit={handleEmailLogin}
          noValidate
        >
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <div className="input-with-icon">
              <span className="input-icon">✉️</span>
              <input
                id="login-email"
                className="form-control"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-with-icon" style={{ position: "relative" }}>
              <span className="input-icon">🔒</span>
              <input
                id="login-password"
                className="form-control"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "-0.25rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-faint)" }}>Demo fill:</span>
              <button
                type="button"
                onClick={() => handleFillDemo("customer")}
                style={{ background: "none", border: "none", color: "var(--clr-text-muted)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Customer
              </button>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-faint)" }}>·</span>
              <button
                type="button"
                onClick={() => handleFillDemo("driver")}
                style={{ background: "none", border: "none", color: "var(--clr-text-muted)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Driver
              </button>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-faint)" }}>·</span>
              <button
                type="button"
                onClick={() => handleFillDemo("admin")}
                style={{ background: "none", border: "none", color: "var(--clr-text-muted)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Admin
              </button>
            </div>
            <button
              id="forgot-password-btn"
              type="button"
              onClick={openForgot}
              style={{ background: "none", border: "none", color: "var(--clr-primary)", fontSize: "0.8rem", cursor: "pointer", textDecoration: "none", fontFamily: "inherit" }}
            >
              Forgot password?
            </button>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className={`btn btn-primary btn-lg${loading ? " btn-loading" : ""}`}
            disabled={loading}
            style={{ width: "100%", marginTop: "0.75rem" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Google OAuth */}
        <div className="divider" style={{ margin: "1.25rem 0" }}>or</div>

        <button
          id="google-login-btn"
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>
        <p className="auth-switch" style={{ marginTop: "0.5rem", fontSize: "0.78rem" }}>
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "/login";
            }}
            style={{ background: "none", border: "none", color: "var(--clr-text-faint)", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: "inherit" }}
          >
            🧹 Reset saved browser session
          </button>
        </p>
      </div>

      {/* ── Forgot Password Modal ──────────────────────────────────── */}
      {showForgot && (
        <div
          className="modal-overlay"
          onClick={closeForgot}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="forgot-modal-title" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>
                  Reset your password
                </h2>
                <p className="text-muted text-sm" style={{ marginTop: "0.2rem" }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>
              <button className="modal-close" onClick={closeForgot} aria-label="Close">✕</button>
            </div>

            {resetSuccess ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📧</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Check your inbox
                </h3>
                <p className="text-muted text-sm">
                  If an account exists for <strong>{resetEmail}</strong>, a password reset link has been sent. Check your spam folder if you don't see it.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: "1.25rem", width: "100%" }}
                  onClick={closeForgot}
                >
                  Back to Sign in
                </button>
              </div>
            ) : (
              <form id="forgot-password-form" onSubmit={handlePasswordReset} noValidate>
                {resetError && (
                  <div className="alert alert-error" style={{ marginBottom: "1rem" }} role="alert">
                    {resetError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-email">Email address</label>
                  <div className="input-with-icon">
                    <span className="input-icon">✉️</span>
                    <input
                      id="reset-email"
                      className="form-control"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    id="send-reset-btn"
                    type="submit"
                    className={`btn btn-primary${resetLoading ? " btn-loading" : ""}`}
                    disabled={resetLoading}
                    style={{ flex: 1 }}
                  >
                    {!resetLoading && "Send Reset Link"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={closeForgot}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Google SVG icon ──────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function friendlyError(err) {
  const code = typeof err === "string" ? err : err?.code;
  const messages = {
    "auth/user-not-found": "No account found with that email address.",
    "auth/wrong-password": "Incorrect password. Please check your credentials.",
    "auth/invalid-credential": "Invalid email address or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many failed attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/popup-closed-by-user": "Google sign-in popup was closed.",
    "auth/unauthorized-domain": "This domain is not authorized in Firebase Console.",
    "auth/operation-not-allowed": "Google sign-in is not enabled in Firebase Console.",
  };
  return messages[code] ?? err?.message ?? "Invalid email or password.";
}
