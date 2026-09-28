/**
 * DataContext.jsx
 *
 * Shared data layer for shipments, customers, drivers, and user management.
 * - Talks to the backend REST API when available
 * - Persists data in localStorage fallback when offline
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "./AuthContext.jsx";

const DataContext = createContext(null);

const LS_KEY = "logistics_platform_data";

/* ─── Persist helpers ──────────────────────────────────────────── */
function loadStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { shipments: [], users: [], drivers: [] };
}

function saveStore(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

/* ─── Generate tracking number ─────────────────────────────────── */
function genTrackingNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRK${yy}${mm}${dd}${rnd}`;
}

/* ─── Format date ──────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── ETA (simple: pickup date + 2 days) ───────────────────────── */
function estimateEta(pickupDate) {
  const d = new Date(pickupDate || Date.now());
  d.setDate(d.getDate() + 2);
  return fmtDate(d.toISOString());
}

/* ─── Normalize shipment for UI consistency ────────────────────── */
function normalizeShipment(s) {
  if (!s) return null;
  const cust = typeof s.customerId === "object" ? s.customerId : null;
  const drv = typeof s.driverId === "object" ? s.driverId : null;

  return {
    ...s,
    id: s.id,
    _id: s.id,
    trackingNumber: s.trackingNumber || s.id,
    customer: cust?.name || s.customer || s.customerName || "Customer",
    customerName: cust?.name || s.customerName || s.customer || "Customer",
    customerEmail: cust?.email || s.customerEmail || "",
    customerPhone: cust?.phone || s.customerPhone || s.receiverPhone || "",
    receiverName: s.receiverName || "",
    receiverPhone: s.receiverPhone || "",
    pickupAddress: s.pickupAddress || s.from || "",
    destinationAddress: s.destinationAddress || s.to || "",
    from: s.pickupAddress || s.from || "",
    to: s.destinationAddress || s.to || "",
    packageType: s.packageType || s.type || "Standard",
    type: s.packageType || s.type || "Standard",
    weight: s.weight ? (typeof s.weight === "number" ? `${s.weight} kg` : s.weight) : "—",
    weightNum: Number(s.weight) || 0,
    deliveryFee: s.deliveryFee ? `GHS ${Number(s.deliveryFee).toFixed(2)}` : "GHS 0.00",
    deliveryFeeNum: Number(s.deliveryFee) || 0,
    status: s.status || "Pending",
    eta: s.estimatedArrival ? fmtDate(s.estimatedArrival) : (s.eta || "TBD"),
    date: fmtDate(s.createdAt) || s.date || "Today",
    pickupDate: s.pickupDate ? fmtDate(s.pickupDate) : (s.date || "N/A"),
    driver: drv?.user?.name || s.driver || s.driverName || "—",
    driverName: drv?.user?.name || s.driverName || s.driver || "—",
    driverPhone: drv?.user?.phone || s.driverPhone || "",
    driverVehicle: drv?.vehicleNumber ? `${drv.vehicleType || "Van"} · ${drv.vehicleNumber}` : (s.driverVehicle || ""),
    rawCustomer: cust,
    rawDriver: drv,
  };
}

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [shipments, setShipments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const backendRef = useRef(false); // true if API is reachable

  /* ── Load data ──────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (user.role === "admin") {
        const [sRes, uRes, dRes] = await Promise.all([
          api.get("/shipments"),
          api.get("/users"),
          api.get("/drivers"),
        ]);
        backendRef.current = true;
        setIsBackendOnline(true);
        setShipments((sRes.data || []).map(normalizeShipment));

        const rawUsers = uRes.data || [];
        setAllUsers(rawUsers);
        setCustomers(rawUsers.filter(u => u.role === "customer"));
        setAdminUsers(rawUsers.filter(u => u.role === "admin"));

        // Merge drivers with user profile data
        const rawDrivers = dRes.data || [];
        console.log("🔍 DEBUG - Raw drivers from API:", rawDrivers);
        const mergedDrivers = rawDrivers.map(d => {
          console.log("🔍 DEBUG - Processing driver:", { id: d._id, licenseNumber: d.licenseNumber, userId: d.userId });
          return {
            _id: d._id,
            userId: d.userId?._id || d.userId,
            name: d.userId?.name || "Driver",
            email: d.userId?.email || "",
            phone: d.userId?.phone || "N/A",
            // Address fields from User document
            street: d.userId?.address?.street || "N/A",
            city: d.userId?.address?.city || "N/A",
            region: d.userId?.address?.region || "N/A",
            address: d.userId?.address ? `${d.userId.address.street}, ${d.userId.address.city}, ${d.userId.address.region}` : "N/A",
            // Driver-specific fields
            licenseNumber: d.licenseNumber || "N/A",
            vehicleNumber: d.vehicleNumber || "N/A",
            vehicleType: d.vehicleType || "Van",
            digitalAddress: d.digitalAddress || "N/A",
            ghanaCardImage: d.ghanaCardImage || null,
            vehicle: `${d.vehicleType || "Van"} · ${d.vehicleNumber || "N/A"}`,
            plate: d.vehicleNumber || "N/A",
            status: d.status || d.userId?.status || "pending",
            available: d.isAvailable ?? true,
            rating: 4.8,
            deliveries: 0,
            joined: fmtDate(d.createdAt || d.userId?.createdAt),
          };
        });

        // Also add any user with role="driver" not in drivers collection yet
        rawUsers.filter(u => u.role === "driver").forEach(u => {
          if (!mergedDrivers.find(md => md.userId === u._id || md.email === u.email)) {
            mergedDrivers.push({
              _id: u._id,
              userId: u._id,
              name: u.name,
              email: u.email,
              phone: u.phone || "N/A",
              street: u.address?.street || "N/A",
              city: u.address?.city || "N/A",
              region: u.address?.region || "N/A",
              address: u.address ? `${u.address.street}, ${u.address.city}, ${u.address.region}` : "N/A",
              licenseNumber: "N/A",
              vehicleNumber: "N/A",
              vehicleType: "Van",
              digitalAddress: "N/A",
              ghanaCardImage: null,
              vehicle: "Van · N/A",
              plate: "N/A",
              status: u.status || "pending",
              available: false,
              rating: 0,
              deliveries: 0,
              joined: fmtDate(u.createdAt),
            });
          }
        });

        setDrivers(mergedDrivers);
      } else {
        const sRes = await api.get("/shipments");
        backendRef.current = true;
        setIsBackendOnline(true);
        setShipments((sRes.data || []).map(normalizeShipment));
      }
    } catch {
      // Backend offline — use localStorage
      backendRef.current = false;
      setIsBackendOnline(false);
      const store = loadStore();

      if (user.role === "admin") {
        setShipments((store.shipments || []).map(normalizeShipment));
        const storeUsers = store.users || [];
        setAllUsers(storeUsers);
        setCustomers(storeUsers.filter(u => u.role === "customer"));
        setAdminUsers(storeUsers.filter(u => u.role === "admin"));
        setDrivers(storeUsers.filter(u => u.role === "driver"));
      } else if (user.role === "driver") {
        setShipments((store.shipments || []).map(normalizeShipment));
        setDrivers([]);
        setCustomers([]);
        setAdminUsers([]);
        setAllUsers([]);
      } else {
        setShipments((store.shipments || []).filter(s => s.customerId === user._id).map(normalizeShipment));
        setDrivers([]);
        setCustomers([]);
        setAdminUsers([]);
        setAllUsers([]);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /* ── Approve driver ─────────────────────────────────────────── */
  const approveDriver = useCallback(async (driverId) => {
    if (backendRef.current) {
      try {
        await api.patch(`/drivers/${driverId}/approve`);
      } catch {
        await api.patch(`/users/${driverId}/status`, { status: "approved" });
      }
      await load();
      return;
    }

    // Local fallback
    const store = loadStore();
    store.users = (store.users || []).map(u =>
      u._id === driverId || u.id === driverId ? { ...u, status: "approved" } : u
    );
    saveStore(store);
    await load();
  }, [load]);

  /* ── Reject driver ──────────────────────────────────────────── */
  const rejectDriver = useCallback(async (driverId) => {
    if (backendRef.current) {
      try {
        await api.patch(`/drivers/${driverId}/reject`);
      } catch {
        await api.patch(`/users/${driverId}/status`, { status: "rejected" });
      }
      await load();
      return;
    }

    // Local fallback
    const store = loadStore();
    store.users = (store.users || []).map(u =>
      u._id === driverId || u.id === driverId ? { ...u, status: "rejected" } : u
    );
    saveStore(store);
    await load();
  }, [load]);

  /* ── Update user/driver status (suspend, reinstate, etc) ────── */
  const updateUserStatus = useCallback(async (userId, status) => {
    if (backendRef.current) {
      await api.patch(`/users/${userId}/status`, { status });
      await load();
      return;
    }

    const store = loadStore();
    store.users = (store.users || []).map(u =>
      u._id === userId || u.id === userId ? { ...u, status } : u
    );
    saveStore(store);
    await load();
  }, [load]);

  /* ── Create shipment ────────────────────────────────────────── */
  const createShipment = useCallback(async (form) => {
    if (!user) throw new Error("Not authenticated");

    const pickupAddress = form.pickupCity && !form.pickupAddress.includes(form.pickupCity)
      ? `${form.pickupAddress}, ${form.pickupCity}`
      : form.pickupAddress;
    const destinationAddress = form.destinationCity && !form.destinationAddress.includes(form.destinationCity)
      ? `${form.destinationAddress}, ${form.destinationCity}`
      : form.destinationAddress;

    const payload = {
      ...form,
      pickupAddress,
      destinationAddress,
    };

    if (backendRef.current) {
      const res = await api.post("/shipments", payload);
      await load();
      return normalizeShipment(res.data);
    }

    // Offline — persist locally
    const newShipment = {
      _id: `local-${Date.now()}`,
      id: genTrackingNumber(),
      trackingNumber: genTrackingNumber(),
      customerId: user._id,
      customerName: user.name,
      customerEmail: user.email,
      pickupAddress: `${form.pickupAddress}, ${form.pickupCity}`,
      destinationAddress: `${form.destinationAddress}, ${form.destinationCity}`,
      from: form.pickupCity || form.pickupAddress,
      to: form.destinationCity || form.destinationAddress,
      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone,
      packageType: form.packageType,
      weight: Number(form.weight) || 0,
      deliveryFee: Number(form.deliveryFee) || 0,
      status: "Pending",
      eta: estimateEta(form.pickupDate),
      date: fmtDate(new Date().toISOString()),
      createdAt: new Date().toISOString(),
      driver: "—",
      driverName: "—",
      progress: 5,
      notes: form.notes || "",
    };

    const store = loadStore();
    store.shipments = [newShipment, ...(store.shipments || [])];

    // Register user in store if not already there
    if (!store.users?.find(u => u._id === user._id)) {
      store.users = [
        ...(store.users || []),
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          joined: fmtDate(new Date().toISOString()),
          status: user.role === "driver" ? "pending" : "active",
        }
      ];
    }

    saveStore(store);

    setShipments(prev =>
      user.role === "admin"
        ? [newShipment, ...prev]
        : [newShipment, ...prev.filter(s => s.customerId === user._id)]
    );

    return newShipment;
  }, [user, load]);

  /* ── Update shipment status ─────────────────────────────────── */
  const updateStatus = useCallback(async (shipmentId, status, note = "") => {
    if (backendRef.current) {
      await api.put(`/shipments/${shipmentId}/status`, { status, note });
      await load();
      return;
    }

    const progressMap = {
      "Pending": 5,
      "Assigned": 20,
      "Dispatched": 35,
      "In Transit": 60,
      "Out For Delivery": 85,
      "Delivered": 100,
      "Cancelled": 0,
    };

    const store = loadStore();
    store.shipments = (store.shipments || []).map(s =>
      s._id === shipmentId || s.id === shipmentId
        ? { ...s, status, progress: progressMap[status] ?? s.progress }
        : s
    );
    saveStore(store);
    setShipments(prev =>
      prev.map(s =>
        s._id === shipmentId || s.id === shipmentId
          ? { ...s, status, progress: progressMap[status] ?? s.progress }
          : s
      )
    );
  }, [load]);

  /* ── Assign driver ──────────────────────────────────────────── */
  const assignDriver = useCallback(async (shipmentId, driverId, driverName) => {
    if (backendRef.current) {
      await api.put(`/shipments/${shipmentId}/assign`, { driverId });
      await load();
      return;
    }

    const store = loadStore();
    store.shipments = (store.shipments || []).map(s =>
      s._id === shipmentId || s.id === shipmentId
        ? { ...s, driverId, driverName, driver: driverName, status: "Assigned", progress: 20 }
        : s
    );
    saveStore(store);
    setShipments(prev =>
      prev.map(s =>
        s._id === shipmentId || s.id === shipmentId
          ? { ...s, driverId, driverName, driver: driverName, status: "Assigned", progress: 20 }
          : s
      )
    );
  }, [load]);

  /* ── Accept / Claim shipment (Driver) ────────────────────────── */
  const acceptShipment = useCallback(async (shipmentId) => {
    if (backendRef.current) {
      await api.put(`/shipments/${shipmentId}/accept`);
      await load();
      return;
    }

    // Local fallback
    const store = loadStore();
    store.shipments = (store.shipments || []).map(s =>
      s._id === shipmentId || s.id === shipmentId
        ? { ...s, driverId: user._id, driverName: user.name, driver: user.name, status: "Assigned", progress: 20 }
        : s
    );
    saveStore(store);
    await load();
  }, [user, load]);

  /* ── Update user profile (Admin) ─────────────────────────────── */
  const updateUser = useCallback(async (userId, data) => {
    if (backendRef.current) {
      await api.put(`/users/${userId}`, data);
      await load();
      return;
    }

    // Local fallback
    const store = loadStore();
    store.users = (store.users || []).map(u =>
      u._id === userId || u.id === userId ? { ...u, ...data } : u
    );
    saveStore(store);
    await load();
  }, [load]);

  /* ── Delete user safely (Admin) ──────────────────────────────── */
  const deleteUser = useCallback(async (userId) => {
    if (backendRef.current) {
      const res = await api.delete(`/users/${userId}`);
      await load();
      return res.data;
    }

    // Local fallback
    const store = loadStore();
    store.users = (store.users || []).filter(u => u._id !== userId && u.id !== userId);
    saveStore(store);
    await load();
  }, [load]);

  /* ── Register user to local store (called after sign-up) ───── */
  const registerUserLocally = useCallback((userData) => {
    const store = loadStore();
    if (!store.users) store.users = [];
    if (!store.users.find(u => u._id === userData._id || u.email === userData.email)) {
      store.users.push({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || "",
        role: userData.role,
        joined: fmtDate(new Date().toISOString()),
        status: userData.role === "driver" ? "pending" : "active",
      });
      saveStore(store);
    }
  }, []);

  const value = {
    shipments,
    customers,
    adminUsers,
    drivers,
    allUsers,
    pendingDrivers: drivers.filter(d => (d.status || "").toLowerCase() === "pending"),
    approvedDrivers: drivers.filter(d => (d.status || "").toLowerCase() === "approved" || (d.status || "").toLowerCase() === "active"),
    loading,
    createShipment,
    updateStatus,
    assignDriver,
    acceptShipment,
    approveDriver,
    rejectDriver,
    updateUserStatus,
    updateUser,
    deleteUser,
    registerUserLocally,
    reload: load,
    isBackendLive: isBackendOnline,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
