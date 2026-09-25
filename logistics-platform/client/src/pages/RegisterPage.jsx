import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { api, setAuthToken } from "../lib/api.js";

const ROLES = [
  { value: "customer", label: "Customer", icon: "🛍️", desc: "Create & track shipments" },
  { value: "driver", label: "Delivery Driver", icon: "🚚", desc: "View assigned deliveries" },
];

const VEHICLE_TYPES = [
  "Motorcycle",
  "Car",
  "Van",
  "Pickup Truck",
  "Truck",
  "Other"
];

export function RegisterPage() {
  const { registerWithEmail, loginWithGoogle, setActiveLoginFlag } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "", role: "customer",
    // Address fields (for all users)
    street: "", city: "", region: "",
    // Driver-specific fields
    licenseNumber: "", vehicleType: "", vehicleNumber: "", digitalAddress: "", ghanaCard: null
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, ghanaCard: file }));
    setFieldErrors((prev) => ({ ...prev, ghanaCard: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email.";

    // Phone is required for drivers, optional for customers
    if (form.role === "driver" && (!form.phone || !/^\+?[\d\s\-()]{7,15}$/.test(form.phone))) {
      errs.phone = "Phone number is required for drivers.";
    } else if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) {
      errs.phone = "Enter a valid phone number.";
    }

    if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";

    // Address fields required for all users
    if (!form.street.trim()) errs.street = "Street address is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.region.trim()) errs.region = "Region is required.";

    // Driver-specific validation
    if (form.role === "driver") {
      if (!form.licenseNumber.trim()) errs.licenseNumber = "Driver's license number is required.";
      if (!form.vehicleType.trim()) errs.vehicleType = "Vehicle type is required.";
      if (!form.vehicleNumber.trim()) errs.vehicleNumber = "Vehicle number plate is required.";
      if (!form.digitalAddress.trim()) {
        errs.digitalAddress = "Digital address is required.";
      } else if (!/^[A-Z]{2}-\d{3}-\d{4}$/.test(form.digitalAddress)) {
        errs.digitalAddress = "Digital address must be in format: GA-001-1234";
      }
      if (!form.ghanaCard) {
        errs.ghanaCard = "Ghana Card image is required for driver registration.";
      } else if (form.ghanaCard) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(form.ghanaCard.type)) {
          errs.ghanaCard = "Only JPG, JPEG, and PNG images are allowed.";
        } else if (form.ghanaCard.size > 5 * 1024 * 1024) { // 5MB
          errs.ghanaCard = "Ghana Card image must be smaller than 5MB.";
        }
      }
    }

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      if (form.role === "driver") {
        // Driver registration: must use the special endpoint with file upload.
        // The activeLoginFlag stays TRUE until after navigate() so that
        // onAuthStateChanged cannot fire mid-flight and overwrite the role.
        const user = await registerDriverWithUpload();
        navigate("/driver/pending", { replace: true });
        // Only reset the flag once we are done navigating
        setActiveLoginFlag(false);
      } else {
        // Customer registration (existing flow)
        const user = await registerWithEmail({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
          address: {
            street: form.street,
            city: form.city,
            region: form.region,
          }
        });
        navigate(`/dashboard/${user.role}`, { replace: true });
      }
    } catch (err) {
      // If driver registration failed, make sure the flag is cleared
      if (form.role === "driver") setActiveLoginFlag(false);
      setError(friendlyError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function registerDriverWithUpload() {
    try {
      // Step 1: Set the active login flag to prevent onAuthStateChanged from auto-syncing
      setActiveLoginFlag(true);

      // Step 2: Create Supabase account
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            role: "driver",
          },
        },
      });

      if (error) throw error;
      if (!data.user) {
        throw new Error("Registration failed - no user returned");
      }

      // Step 3: Get token
      const token = data.session?.access_token;
      if (token) {
        setAuthToken(token);
      }

      // Step 4: Register on backend with ALL driver data + Ghana Card file
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("phone", form.phone.trim());
      formData.append("role", "driver"); // Explicitly set role
      formData.append("street", form.street.trim());
      formData.append("city", form.city.trim());
      formData.append("region", form.region.trim());
      formData.append("address[street]", form.street.trim());
      formData.append("address[city]", form.city.trim());
      formData.append("address[region]", form.region.trim());
      formData.append("licenseNumber", form.licenseNumber.trim());
      formData.append("vehicleType", form.vehicleType.trim());
      formData.append("vehicleNumber", form.vehicleNumber.trim());
      formData.append("digitalAddress", form.digitalAddress.trim().toUpperCase());
      formData.append("ghanaCard", form.ghanaCard);

      const response = await api.post("/auth/register", formData);

      // Step 5: Return the backend user (with role = "driver" and all driver fields)
      const backendUser = response.data;
      localStorage.setItem("auth_role", backendUser.role);

      return backendUser;
    } catch (err) {
      if (err.response) {
        const errorDetails = Array.isArray(err.response.data?.errors)
          ? err.response.data.errors.map(e => e.message).join("; ")
          : null;
        throw new Error(errorDetails || err.response.data?.message || "Driver registration failed");
      }
      throw err;
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle(form.role);
      navigate(`/dashboard/${user.role}`, { replace: true });
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  const isDriver = form.role === "driver";

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-up" style={{ maxWidth: isDriver ? 600 : 500 }}>
        {/* Logo */}
        <div className="auth-logo">
          <span style={{ fontSize: "1.4rem" }}>📦</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
            Logistics Platform
          </span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands of customers and drivers.</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }} role="alert">
            {error}
          </div>
        )}

        {/* Role selector */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p className="form-label" style={{ marginBottom: "0.5rem" }}>I am a…</p>
          <div className="grid-2" style={{ gap: "0.6rem" }}>
            {ROLES.map((r) => (
              <label
                key={r.value}
                htmlFor={`role-${r.value}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: form.role === r.value ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${form.role === r.value ? "rgba(14,165,233,0.45)" : "var(--clr-border)"}`,
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <input
                  id={`role-${r.value}`}
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: "1.3rem" }}>{r.icon}</span>
                <span>
                  <strong style={{ fontSize: "0.875rem", display: "block" }}>{r.label}</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--clr-text-muted)" }}>{r.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Google */}
        {!isDriver && (
          <>
            <button
              id="google-register-btn"
              className="google-btn"
              onClick={handleGoogle}
              disabled={loading}
              type="button"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="divider" style={{ margin: "1.25rem 0" }}>or fill in your details</div>
          </>
        )}

        {/* Form */}
        <form id="register-form" className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Personal Information Section */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
              color: "var(--clr-text)",
              borderBottom: "1px solid var(--clr-border)",
              paddingBottom: "0.25rem"
            }}>
              Personal Information
            </h3>
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full name</label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  id="reg-name"
                  className="form-control"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email address</label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  id="reg-email"
                  className="form-control"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                Phone number {!isDriver && <span style={{ fontWeight: 400, textTransform: "none", color: "var(--clr-text-faint)" }}>(optional)</span>}
              </label>
              <div className="input-with-icon">
                <span className="input-icon">📞</span>
                <input
                  id="reg-phone"
                  className="form-control"
                  name="phone"
                  type="tel"
                  placeholder="+233 20 000 0000"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              {fieldErrors.phone && <span className="form-error">{fieldErrors.phone}</span>}
            </div>

            {/* Address Section */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                color: "var(--clr-text)",
                borderBottom: "1px solid var(--clr-border)",
                paddingBottom: "0.25rem"
              }}>
                Address
              </h3>

              {/* Street Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-street">Street Address</label>
                <div className="input-with-icon">
                  <span className="input-icon">🏠</span>
                  <input
                    id="reg-street"
                    className="form-control"
                    name="street"
                    type="text"
                    placeholder="123 Main Street"
                    value={form.street}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.street && <span className="form-error">{fieldErrors.street}</span>}
              </div>

              {/* City & Region */}
              <div className="grid-2" style={{ gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-city">City</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🏙️</span>
                    <input
                      id="reg-city"
                      className="form-control"
                      name="city"
                      type="text"
                      placeholder="Accra"
                      value={form.city}
                      onChange={handleChange}
                    />
                  </div>
                  {fieldErrors.city && <span className="form-error">{fieldErrors.city}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-region">Region</label>
                  <div className="input-with-icon">
                    <span className="input-icon">📍</span>
                    <input
                      id="reg-region"
                      className="form-control"
                      name="region"
                      type="text"
                      placeholder="Greater Accra"
                      value={form.region}
                      onChange={handleChange}
                    />
                  </div>
                  {fieldErrors.region && <span className="form-error">{fieldErrors.region}</span>}
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid-2" style={{ gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className="input-with-icon" style={{ position: "relative" }}>
                  <span className="input-icon">🔒</span>
                  <input
                    id="reg-password"
                    className="form-control"
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPw(!showPw)}
                    aria-label="Toggle password"
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
                {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">Confirm</label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    id="reg-confirm"
                    className="form-control"
                    name="confirmPassword"
                    type={showPw ? "text" : "password"}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          {/* Driver-specific fields */}
          {isDriver && (
            <>
              {/* Driver Information */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "0.75rem",
                  color: "var(--clr-text)",
                  borderBottom: "1px solid var(--clr-border)",
                  paddingBottom: "0.25rem"
                }}>
                  Driver Information
                </h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="license-number">Driver's Licence Number</label>
                  <div className="input-with-icon">
                    <span className="input-icon">🪪</span>
                    <input
                      id="license-number"
                      className="form-control"
                      name="licenseNumber"
                      type="text"
                      placeholder="e.g. DL123456789"
                      value={form.licenseNumber}
                      onChange={handleChange}
                    />
                  </div>
                  {fieldErrors.licenseNumber && <span className="form-error">{fieldErrors.licenseNumber}</span>}
                </div>
              </div>

              {/* Vehicle Information */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "0.75rem",
                  color: "var(--clr-text)",
                  borderBottom: "1px solid var(--clr-border)",
                  paddingBottom: "0.25rem"
                }}>
                  Vehicle Information
                </h3>

                <div className="grid-2" style={{ gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vehicle-type">Vehicle Type</label>
                    <div className="input-with-icon">
                      <span className="input-icon">🚗</span>
                      <select
                        id="vehicle-type"
                        className="form-control"
                        name="vehicleType"
                        value={form.vehicleType}
                        onChange={handleChange}
                      >
                        <option value="">Select vehicle type</option>
                        {VEHICLE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    {fieldErrors.vehicleType && <span className="form-error">{fieldErrors.vehicleType}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vehicle-number">Vehicle Number Plate</label>
                    <div className="input-with-icon">
                      <span className="input-icon">🔢</span>
                      <input
                        id="vehicle-number"
                        className="form-control"
                        name="vehicleNumber"
                        type="text"
                        placeholder="e.g. GR-0001-24"
                        value={form.vehicleNumber}
                        onChange={handleChange}
                      />
                    </div>
                    {fieldErrors.vehicleNumber && <span className="form-error">{fieldErrors.vehicleNumber}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="digital-address">Digital Address</label>
                  <div className="input-with-icon">
                    <span className="input-icon">📍</span>
                    <input
                      id="digital-address"
                      className="form-control"
                      name="digitalAddress"
                      type="text"
                      placeholder="e.g. GA-001-1234"
                      value={form.digitalAddress}
                      onChange={handleChange}
                    />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)", marginTop: "0.25rem" }}>
                    Format: XX-###-#### (Your Ghana Digital Address)
                  </p>
                  {fieldErrors.digitalAddress && <span className="form-error">{fieldErrors.digitalAddress}</span>}
                </div>
              </div>

              {/* Identity Verification */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "0.75rem",
                  color: "var(--clr-text)",
                  borderBottom: "1px solid var(--clr-border)",
                  paddingBottom: "0.25rem"
                }}>
                  Identity Verification
                </h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="ghana-card">Ghana Card</label>
                  <p style={{ fontSize: "0.85rem", color: "var(--clr-text-muted)", marginBottom: "0.5rem" }}>
                    Upload a clear image of your Ghana Card for identity verification.
                  </p>
                  <div className="file-upload-area">
                    <input
                      id="ghana-card"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <label htmlFor="ghana-card" className="file-upload-label">
                      <span style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "block" }}>📄</span>
                      <span style={{ fontWeight: 600, display: "block" }}>
                        {form.ghanaCard ? form.ghanaCard.name : "Choose Ghana Card Image"}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--clr-text-muted)" }}>
                        JPG, JPEG, or PNG (max 5MB)
                      </span>
                    </label>
                  </div>
                  {fieldErrors.ghanaCard && <span className="form-error">{fieldErrors.ghanaCard}</span>}
                </div>
              </div>
            </>
          )}

          <button
            id="register-submit-btn"
            type="submit"
            className={`btn btn-primary btn-lg${loading ? " btn-loading" : ""}`}
            disabled={loading}
            style={{ width: "100%", marginTop: "0.25rem" }}
          >
            {loading ? (isDriver ? "Submitting Application..." : "Creating Account...") : "Create account"}
          </button>

          {isDriver && (
            <div style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "var(--r-md)",
              fontSize: "0.85rem",
              color: "var(--clr-text-muted)"
            }}>
              <strong style={{ color: "var(--clr-warning)", display: "block", marginBottom: "0.25rem" }}>
                ⚠️ Driver Application Notice
              </strong>
              Your driver account will be submitted for administrator approval.
              You will not be able to access operational features until your application is approved.
            </div>
          )}
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Inline Google SVG icon ───────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function friendlyError(code) {
  if (typeof code !== "string") {
    code = code?.message || code?.error_description || "Unknown error";
  }
  const messages = {
    "auth/email-already-in-use": "This email is already registered. Try signing in.",
    "User already registered": "This email is already registered. Try signing in.",
    "auth/invalid-email": "That doesn't look like a valid email.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "Password should be at least 6 characters.": "Password is too weak. Use at least 6 characters.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
  };
  return messages[code] ?? code ?? "Something went wrong. Please try again.";
}
