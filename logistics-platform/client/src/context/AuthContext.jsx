import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { api, setAuthToken } from "../lib/api.js";

const AuthContext = createContext(null);

/* ── Demo users (only active in development mode) ───────────────────────────── */
const IS_DEV = import.meta.env.DEV; // Vite sets this to true during `vite dev`, false in builds

const DEMO_USERS = {
  customer: { _id: "demo-c", name: "Demo Customer", email: "customer@demo.com", role: "customer", phone: "+233200000001", isActive: true },
  driver: { _id: "demo-d", name: "Demo Driver", email: "driver@demo.com", role: "driver", phone: "+233200000002", isActive: true },
  admin: { _id: "demo-a", name: "Demo Admin", email: "admin@demo.com", role: "admin", phone: "+233200000003", isActive: true },
};

function getRoleFromEmail(email = "") {
  const e = (email || "").toLowerCase().trim();
  if (e.startsWith("admin") || e.includes("admin@") || e === "blessingasakpam10@gmail.com") return "admin";
  if (e.startsWith("driver") || e.includes("driver@")) return "driver";
  return "customer";
}

/* ── Build a local user object from a Supabase user ────────────────────────── */
function buildLocalUser(supabaseUser, extra = {}) {
  const role = extra.role || supabaseUser.user_metadata?.role || getRoleFromEmail(supabaseUser.email);
  return {
    _id: supabaseUser.id,
    id: supabaseUser.id,
    authId: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || extra.name || supabaseUser.email?.split("@")[0] || "User",
    email: supabaseUser.email,
    phone: supabaseUser.user_metadata?.phone || extra.phone || "",
    role: role,
    status: extra.status || (role === "driver" ? "pending" : "active"),
    avatar: supabaseUser.user_metadata?.avatar || null,
    isActive: true,
    _localOnly: true,
  };
}

/* ── Try to sync user profile to backend ───────────────────────────── */
async function syncToBackend(supabaseUser, registrationData = null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.warn("No session token available for backend sync");
      return null;
    }
    
    setAuthToken(token);

    if (registrationData) {
      const { data } = await api.post("/auth/register", registrationData);
      return { ...data, _localOnly: false };
    } else {
      const { data } = await api.get("/auth/me");
      return { ...data, _localOnly: false };
    }
  } catch (err) {
    console.warn("syncToBackend error:", err?.response?.status, err?.response?.data || err?.message);
    return null;
  }
}

export function AuthProvider({ children }) {
  // Rehydrate demo session synchronously before first render
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("demo_user");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  });
  const [supabaseUser, setSupabaseUser] = useState(null);
  // If we already restored a demo user, don't show a loading spinner
  const [loading, setLoading] = useState(() => {
    try { return !localStorage.getItem("demo_user"); } catch { return true; }
  });

  // Prevent onAuthStateChanged from overwriting the user while an explicit
  // login or register call is in progress (race-condition guard).
  const activeLoginRef = useRef(false);

  /* ── Supabase auth state listener ──────────────────────────────────────── */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange(session);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth event:', event);
      
      if (session) {
        await handleAuthChange(session);
      } else {
        setAuthToken(null);
        setUser(null);
        setSupabaseUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleAuthChange(session) {
    const sbUser = session.user;
    setSupabaseUser(sbUser);

    // If an explicit login/register is running, let it handle setUser itself.
    if (activeLoginRef.current) {
      return;
    }

    const token = session.access_token;
    setAuthToken(token);

    const backendUser = await syncToBackend(sbUser);
    if (backendUser) {
      setUser(backendUser);
      localStorage.setItem("auth_role", backendUser.role);
    } else {
      // Prefer the stored auth_role hint (written before Supabase account
      // creation during registration) over guessing from the email address.
      const storedRole = localStorage.getItem("auth_role");
      const role = storedRole || sbUser.user_metadata?.role || getRoleFromEmail(sbUser.email);
      setUser(buildLocalUser(sbUser, { role }));
      localStorage.setItem("auth_role", role);
    }
  }

  /* ── DEMO mode login (development only) ───────────────────────────────────── */
  function demoLogin(role = "customer", customUser = null) {
    if (!IS_DEV) {
      throw new Error("Demo login is not available in production.");
    }
    const base = customUser || DEMO_USERS[role] || DEMO_USERS.customer;
    const u = {
      ...base,
      role: base.role || role,
    };
    if (u.isActive === false) {
      throw new Error("Your account has been deactivated or suspended. Please contact an administrator.");
    }
    localStorage.setItem("auth_role", u.role);
    localStorage.setItem("demo_user", JSON.stringify(u));
    setAuthToken("demo-token");
    setUser(u);
    return u;
  }

  /* ── Register (email + password) ───────────────────────────────────────── */
  async function registerWithEmail({ name, email, password, phone, role = "customer", address = {} }) {
    // Sanitize role: normal registration cannot self-assign admin/staff privileges
    const safeRole = (role === "driver") ? "driver" : "customer";

    if (email.endsWith("@demo.com") && IS_DEV) {
      return demoLogin(safeRole, {
        _id: `user-${Date.now()}`,
        id: `user-${Date.now()}`,
        name,
        email,
        phone: phone || "",
        role: safeRole,
        status: safeRole === "driver" ? "pending" : "active",
        isActive: true,
      });
    }

    localStorage.setItem("auth_role", safeRole);
    activeLoginRef.current = true;

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone ? phone.trim() : "",
            role: safeRole
          }
        }
      });

      if (error) {
        console.error("Supabase auth signUp error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("Registration failed - no user returned from Supabase Auth.");
      }

      if (!data.session) {
        console.error("No session returned from signUp. Email confirmation may still be enabled in Supabase.");
        throw new Error(
          "Registration did not provide an active session. " +
          "Email confirmation is enabled in your Supabase project. " +
          "Please disable 'Confirm email' under Authentication -> Providers -> Email in your Supabase Dashboard."
        );
      }

      // Set auth token immediately from session
      setAuthToken(data.session.access_token);

      // Sync to backend (creates or updates profile in public.users)
      const backendUser = await syncToBackend(data.user, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : "",
        role: safeRole,
        street: address.street || "",
        city: address.city || "",
        region: address.region || "",
        address
      });
      const finalUser = backendUser ?? buildLocalUser(data.user, { name, phone, role: safeRole });

      localStorage.setItem("auth_role", finalUser.role);
      setSupabaseUser(data.user);
      setUser(finalUser);
      return finalUser;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      activeLoginRef.current = false;
    }
  }

  /* ── Login (email + password) ──────────────────────────────────────────── */
  async function loginWithEmail(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    // Demo accounts (dev only)
    if (cleanEmail.endsWith("@demo.com") && IS_DEV) {
      // Determine role from account identity
      let detectedRole = "customer";
      if (cleanEmail.startsWith("admin") || cleanEmail === "admin@demo.com") {
        detectedRole = "admin";
      } else if (cleanEmail.startsWith("driver") || cleanEmail === "driver@demo.com") {
        detectedRole = "driver";
      } else {
        // Check local storage for registered users
        try {
          const raw = localStorage.getItem("logistics_platform_data");
          if (raw) {
            const data = JSON.parse(raw);
            const found = data.users?.find(u => u.email?.toLowerCase() === cleanEmail);
            if (found) {
              if (found.status === "Inactive" || found.status === "Suspended" || found.isActive === false) {
                throw new Error("Your account has been deactivated or suspended. Please contact an administrator.");
              }
              return demoLogin(found.role || "customer", found);
            }
          }
        } catch (err) {
          if (err.message.includes("deactivated")) throw err;
        }
      }

      return demoLogin(detectedRole);
    }

    activeLoginRef.current = true;

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("Login failed - no session returned");
      }

      setAuthToken(data.session.access_token);

      // Sync with backend
      const backendUser = await syncToBackend(data.user);

      if (backendUser) {
        if (backendUser.isActive === false) {
          await supabase.auth.signOut();
          throw new Error("Your account has been deactivated or suspended. Please contact an administrator.");
        }
        localStorage.setItem("auth_role", backendUser.role);
        setSupabaseUser(data.user);
        setUser(backendUser);
        return backendUser;
      }

      // If backend offline / not synced yet, detect role from email or metadata
      const inferredRole = data.user.user_metadata?.role || getRoleFromEmail(cleanEmail);
      const finalUser = buildLocalUser(data.user, { role: inferredRole });

      localStorage.setItem("auth_role", finalUser.role);
      setSupabaseUser(data.user);
      setUser(finalUser);
      return finalUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      activeLoginRef.current = false;
    }
  }

  /* ── Login (Google OAuth) ──────────────────────────────────────────────── */
  async function loginWithGoogle() {
    if (IS_DEV) return demoLogin("customer");

    activeLoginRef.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;

      // Note: OAuth redirects, so this code won't execute immediately
      // The auth state listener will handle the callback
      return data;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      activeLoginRef.current = false;
    }
  }

  /* ── Logout ────────────────────────────────────────────────────────────── */
  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    localStorage.removeItem("demo_user");
    localStorage.removeItem("auth_role");
    setAuthToken(null);
    setUser(null);
    setSupabaseUser(null);
  }

  /* ── Refresh from backend ──────────────────────────────────────────────── */
  async function refreshUser() {
    if (!supabaseUser) return;
    const backendUser = await syncToBackend(supabaseUser);
    if (backendUser) setUser(backendUser);
  }

  /* ── Control active login flag (for custom registration flows) ─────────── */
  function setActiveLoginFlag(value) {
    activeLoginRef.current = value;
  }

  const value = useMemo(
    () => ({
      user,
      supabaseUser,
      loading,
      supabaseConfigured: true,
      isDemoMode: IS_DEV,
      registerWithEmail,
      loginWithEmail,
      loginWithGoogle,
      logout,
      refreshUser,
      setActiveLoginFlag,
    }),
    [user, supabaseUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
