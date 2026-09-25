import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ password: "", confirm: "" });
  const [show, setShow]     = useState({ pw: false, confirm: false });
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function getStrength(pw) {
    if (!pw) return { level: 0, label: "", color: "transparent" };
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: score, label: "Weak",   color: "var(--clr-danger)" };
    if (score <= 3) return { level: score, label: "Fair",   color: "var(--clr-warning)" };
    return              { level: score, label: "Strong", color: "var(--clr-success)" };
  }

  const strength = getStrength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>{success ? "🎉" : "🔒"}</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem" }}>
            {success ? "Password Reset!" : "Reset Your Password"}
          </h1>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            {success
              ? "Your password has been updated. Redirecting to login…"
              : "Enter your new password below."}
          </p>
        </div>

        <div className="card">
          {success ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✅</div>
              <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
                You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-password">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="reset-password"
                    type={show.pw ? "text" : "password"}
                    className={`form-control${error ? " error" : ""}`}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(""); }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, pw: !s.pw }))}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-muted)", fontSize: "1rem" }}
                  >
                    {show.pw ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Strength meter */}
                {form.password && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "0.3rem" }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength.level ? strength.color : "var(--clr-surface-2)", transition: "background 0.3s" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: "0.78rem", color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm">Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="reset-confirm"
                    type={show.confirm ? "text" : "password"}
                    className="form-control"
                    placeholder="Re-enter your new password"
                    value={form.confirm}
                    onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setError(""); }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-muted)", fontSize: "1rem" }}
                  >
                    {show.confirm ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <p style={{ color: "var(--clr-danger)", fontSize: "0.83rem", marginBottom: "0.75rem" }}>{error}</p>
              )}

              <button
                id="reset-submit-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "Updating…" : "Reset Password"}
              </button>
            </form>
          )}

          {!success && (
            <div style={{ textAlign: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--clr-border)" }}>
              <Link to="/forgot-password" className="btn btn-ghost btn-sm">
                ← Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
