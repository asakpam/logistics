import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/* ── Data ─────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "🗺️",
    iconClass: "feature-icon-blue",
    title: "Real-Time GPS Tracking",
    desc: "Watch your delivery move on a live map. Driver location updates every 15 seconds via Socket.IO — no page refresh needed.",
  },
  {
    icon: "⏱️",
    iconClass: "feature-icon-green",
    title: "Predictive ETA",
    desc: "Our algorithm factors in distance, historical speed, and traffic patterns to give you an accurate estimated arrival time.",
  },
  {
    icon: "🔔",
    iconClass: "feature-icon-amber",
    title: "Instant Notifications",
    desc: "Get SMS and push alerts the moment your shipment is dispatched, in transit, or delivered — no guessing required.",
  },
  {
    icon: "🔐",
    iconClass: "feature-icon-purple",
    title: "Secure & Reliable",
    desc: "End-to-end Firebase authentication, role-based access, and encrypted connections keep your data safe at every step.",
  },
];

const STEPS = [
  { n: "01", title: "Create Shipment",     desc: "Enter sender & receiver details, package info, and pick-up date." },
  { n: "02", title: "Admin Assigns Driver", desc: "An admin reviews the shipment and assigns the best available driver." },
  { n: "03", title: "Driver Dispatches",   desc: "The driver picks up the package and enables live GPS sharing." },
  { n: "04", title: "You Track Live",      desc: "Watch your package on the map in real time until it reaches your door." },
];

const SAMPLE_SHIPMENTS = [
  { id: "TRK-002847", from: "Accra, GH", to: "Kumasi, GH", status: "In Transit",       color: "badge-primary" },
  { id: "TRK-001593", from: "Takoradi, GH", to: "Accra, GH", status: "Out For Delivery", color: "badge-warning" },
  { id: "TRK-003211", from: "Kumasi, GH", to: "Tamale, GH", status: "Delivered",         color: "badge-success" },
];

/* ── Component ────────────────────────────────────────────────── */
export function LandingPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [trackingInput, setTrackingInput] = useState("");

  function handleTrack(e) {
    e.preventDefault();
    const id = trackingInput.trim();
    if (id) navigate(`/track/${id}`);
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-bg" />
        <div className="hero-grid-pattern" />

        <div className="hero-content">
          {/* Left Column */}
          <div>
            <div className="hero-eyebrow animate-fade-up">
              <span>🚀</span>
              <span>Logistics reimagined for Ghana</span>
            </div>

            <h1 className="hero-title animate-fade-up-2">
              Delivering{" "}
              <span className="gradient-text">Trust,</span>
              <br />
              Every Step of
              <br />
              the Way.
            </h1>

            <p className="hero-subtitle animate-fade-up-3">
              Create shipments, assign drivers, share live GPS, and notify
              customers — all from one sleek platform built for modern logistics.
            </p>

            <div className="hero-ctas animate-fade-up-4">
              {user ? (
                <Link
                  to={`/dashboard/${user.role}`}
                  className="btn btn-primary btn-lg"
                  id="hero-dashboard-btn"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-lg"
                    id="hero-register-btn"
                  >
                    Get started — it's free
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-outline btn-lg"
                    id="hero-login-btn"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            {/* Stats row */}
            <div className="hero-stats animate-fade-up-4">
              <div className="hero-stat-item">
                <span className="hero-stat-value">2,400+</span>
                <span className="hero-stat-label">Deliveries made</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-value">98%</span>
                <span className="hero-stat-label">On-time rate</span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-value">350+</span>
                <span className="hero-stat-label">Active drivers</span>
              </div>
            </div>
          </div>

          {/* Right Column — Track card */}
          <div className="animate-float" aria-hidden="false">
            <div className="track-card animate-glow">
              <p className="track-card-title">
                <span className="dot" />
                Live Tracking
              </p>

              {/* Track form */}
              <form className="track-form" onSubmit={handleTrack} id="hero-track-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="hero-tracking-input">
                    Enter tracking number
                  </label>
                  <div className="input-with-btn">
                    <input
                      id="hero-tracking-input"
                      className="form-control"
                      placeholder="e.g. TRK123456GH"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      aria-label="Tracking number"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      id="hero-track-btn"
                      disabled={!trackingInput.trim()}
                    >
                      Track
                    </button>
                  </div>
                </div>
              </form>

              {/* Sample live shipments */}
              <p
                className="text-xs text-faint"
                style={{ margin: "1rem 0 0.5rem", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}
              >
                Live shipments
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {SAMPLE_SHIPMENTS.map((s) => (
                  <div key={s.id} className="track-shipment-row">
                    <div className="shipment-icon">📦</div>
                    <div className="shipment-meta">
                      <strong>{s.id}</strong>
                      <span>{s.from} → {s.to}</span>
                    </div>
                    <span className={`badge ${s.color}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="features-section section" aria-labelledby="features-title">
        <div className="container">
          <header className="section-header">
            <span className="section-label">Why Choose Us?</span>
            <h2 id="features-title" className="section-title">
              Everything you need for{" "}
              <span className="gradient-text">modern logistics</span>
            </h2>
            <p className="section-desc">
              Built from the ground up to solve the real challenges of last-mile
              delivery in West Africa.
            </p>
          </header>

          <div className="grid-auto">
            {FEATURES.map((f) => (
              <article key={f.title} className="feature-card">
                <div className={`feature-icon-wrap ${f.iconClass}`}>
                  <span role="img" aria-label={f.title}>{f.icon}</span>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section className="how-section" aria-labelledby="how-title">
        <div className="container">
          <header className="section-header">
            <span className="section-label">The Process</span>
            <h2 id="how-title" className="section-title">
              From order to{" "}
              <span className="gradient-text-accent">delivery</span>{" "}
              in 4 steps
            </h2>
          </header>

          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-number">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════ */}
      <section className="cta-section section-sm" aria-label="Call to action">
        <div className="container">
          <div className="cta-card">
            <span className="section-label">Ready to ship?</span>
            <h2 className="cta-title">
              Start your first shipment today
              <br />
              <span className="gradient-text">completely free.</span>
            </h2>
            <p className="text-muted" style={{ maxWidth: 480, margin: "0 auto" }}>
              No credit card required. Set up your account in under 2 minutes
              and experience real-time logistics management.
            </p>
            <div className="cta-actions">
              <Link
                to="/register"
                className="btn btn-primary btn-lg"
                id="cta-register-btn"
              >
                Create free account →
              </Link>
              <Link
                to="/track/TRK-DEMO"
                className="btn btn-outline btn-lg"
                id="cta-track-demo-btn"
              >
                See live demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div className="brand" style={{ fontSize: "1.1rem" }}>
                <span className="brand-icon">📦</span>
                Logistics <span className="accent">Platform</span>
              </div>
              <p className="footer-brand-desc">
                A final-year project building modern logistics infrastructure
                for Ghana. Real-time tracking, predictive ETA, and instant
                notifications — all in one platform.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="footer-col-title">Platform</p>
              <ul className="footer-links">
                <li><Link to="/register">Get started</Link></li>
                <li><Link to="/login">Sign in</Link></li>
                <li><Link to="/marketplace">Marketplace</Link></li>
                <li><Link to="/track/TRK-DEMO">Track shipment</Link></li>
              </ul>
            </div>

            {/* Dashboards */}
            <div>
              <p className="footer-col-title">Dashboards</p>
              <ul className="footer-links">
                <li><Link to="/dashboard/customer">Customer</Link></li>
                <li><Link to="/dashboard/driver">Driver</Link></li>
                <li><Link to="/dashboard/admin">Admin</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="footer-col-title">Contact</p>
              <ul className="footer-links">
                <li><a href="mailto:asakpamblessing@gmail.com">Email us</a></li>
                <li><a href="tel:+233200000000">+233 20 000 0000</a></li>
                <li><a href="#">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Logistics Platform · Asakpam Blessing (11167338)</span>
            <span>Final Year Project · University Submission</span>
          </div>
        </div>
      </footer>
    </>
  );
}
