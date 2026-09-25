# Technical Changes Reference - Driver Registration Fix

## Summary of Changes

This document provides a technical reference for all code changes made to fix the driver registration data flow.

---

## 1. Frontend: RegisterPage.jsx

### File Path
`client/src/pages/RegisterPage.jsx`

### Change 1: Form State - Added Address Fields
**Line:** ~27
```javascript
// OLD
const [form, setForm] = useState({
  name: "", email: "", phone: "", password: "", confirmPassword: "", role: "customer",
  licenseNumber: "", vehicleType: "", vehicleNumber: "", digitalAddress: "", ghanaCard: null
});

// NEW
const [form, setForm] = useState({
  name: "", email: "", phone: "", password: "", confirmPassword: "", role: "customer",
  // Address fields (for all users)
  street: "", city: "", region: "",
  // Driver-specific fields
  licenseNumber: "", vehicleType: "", vehicleNumber: "", digitalAddress: "", ghanaCard: null
});
```

### Change 2: Validation - Added Address Validation
**Line:** ~60-62
```javascript
// ADD after password validation (inside validate function)
// Address fields required for all users
if (!form.street.trim()) errs.street = "Street address is required.";
if (!form.city.trim()) errs.city = "City is required.";
if (!form.region.trim()) errs.region = "Region is required.";
```

### Change 3: Customer Registration - Added Address
**Line:** ~118-124
```javascript
// OLD
const user = await registerWithEmail({
  name:     form.name,
  email:    form.email,
  phone:    form.phone || undefined,
  password: form.password,
  role:     form.role,
});

// NEW
const user = await registerWithEmail({
  name:     form.name,
  email:    form.email,
  phone:    form.phone || undefined,
  password: form.password,
  role:     form.role,
  address: {
    street: form.street,
    city: form.city,
    region: form.region,
  }
});
```

### Change 4: Driver Registration - Added Address to FormData
**Line:** ~131-138
```javascript
// OLD
const formData = new FormData();
formData.append("name", form.name);
formData.append("email", form.email);
formData.append("phone", form.phone);
formData.append("role", form.role);
formData.append("licenseNumber", form.licenseNumber);
formData.append("vehicleType", form.vehicleType);
formData.append("vehicleNumber", form.vehicleNumber);
formData.append("digitalAddress", form.digitalAddress);
formData.append("ghanaCard", form.ghanaCard);

// NEW
const formData = new FormData();
formData.append("name", form.name);
formData.append("email", form.email);
formData.append("phone", form.phone);
formData.append("role", form.role);
formData.append("address[street]", form.street);       // NEW
formData.append("address[city]", form.city);           // NEW
formData.append("address[region]", form.region);       // NEW
formData.append("licenseNumber", form.licenseNumber);
formData.append("vehicleType", form.vehicleType);
formData.append("vehicleNumber", form.vehicleNumber);
formData.append("digitalAddress", form.digitalAddress);
formData.append("ghanaCard", form.ghanaCard);
```

### Change 5: JSX - Added Address Form Section
**Line:** ~336-383 (NEW SECTION)
```javascript
// NEW SECTION - Insert after phone input and before password section
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
```

---

## 2. Backend: auth.js

### File Path
`server/src/routes/auth.js`

### Change 1: Customer Schema - Added Optional Address
**Line:** ~8-14
```javascript
// OLD
const customerRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  role: z.literal("customer"),
  avatar: z.string().url().optional()
});

// NEW
const customerRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).optional(),
  role: z.literal("customer"),
  avatar: z.string().url().optional(),
  "address[street]": z.string().min(2).optional(),
  "address[city]": z.string().min(2).optional(),
  "address[region]": z.string().min(2).optional(),
});
```

### Change 2: Driver Schema - Added Required Address
**Line:** ~16-27
```javascript
// OLD
const driverRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  role: z.literal("driver"),
  avatar: z.string().url().optional(),
  licenseNumber: z.string().min(2),
  vehicleType: z.string().min(2),
  vehicleNumber: z.string().min(2),
  digitalAddress: z.string().min(7).regex(/^[A-Z]{2}-\d{3}-\d{4}$/, "Digital address must be in format: GA-001-1234")
});

// NEW
const driverRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  role: z.literal("driver"),
  avatar: z.string().url().optional(),
  "address[street]": z.string().min(2),
  "address[city]": z.string().min(2),
  "address[region]": z.string().min(2),
  licenseNumber: z.string().min(2),
  vehicleType: z.string().min(2),
  vehicleNumber: z.string().min(2),
  digitalAddress: z.string().min(7).regex(/^[A-Z]{2}-\d{3}-\d{4}$/, "Digital address must be in format: GA-001-1234")
});
```

### Change 3: handleRegistration - Save Address
**Line:** ~74-85
```javascript
// OLD
const user = await User.create({
  firebaseUid: req.auth.uid,
  name: req.body.name,
  email: req.body.email,
  phone: req.body.phone,
  avatar: req.body.avatar,
  role: req.body.role,
  status: isDriver ? "pending" : "active",
  isActive: true
});

// NEW
const user = await User.create({
  firebaseUid: req.auth.uid,
  name: req.body.name,
  email: req.body.email,
  phone: req.body.phone,
  avatar: req.body.avatar,
  role: req.body.role,
  status: isDriver ? "pending" : "active",
  isActive: true,
  address: {
    street: req.body["address[street]"] || "",
    city: req.body["address[city]"] || "",
    region: req.body["address[region]"] || "",
    country: "Ghana"
  }
});
```

---

## 3. Backend: drivers.js

### File Path
`server/src/routes/drivers.js`

### Change: GET /api/drivers - Include Address in Populate
**Line:** ~24-29
```javascript
// OLD
router.get("/", requireRole("admin"), async (req, res) => {
  try {
    const drivers = await Driver.find().populate("userId", "name email phone status isActive createdAt");
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});

// NEW
router.get("/", requireRole("admin"), async (req, res) => {
  try {
    const drivers = await Driver.find().populate("userId", "name email phone status isActive createdAt address");
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch drivers" });
  }
});
```

**Key Change:** Added `address` to the populate select string

---

## 4. Frontend: DataContext.jsx

### File Path
`client/src/context/DataContext.jsx`

### Change 1: Driver Mapping - Extract Address Fields
**Line:** ~84-106
```javascript
// OLD
const mergedDrivers = rawDrivers.map(d => ({
  _id: d._id,
  userId: d.userId?._id || d.userId,
  name: d.userId?.name || "Driver",
  email: d.userId?.email || "",
  phone: d.userId?.phone || "N/A",
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
}));

// NEW
const mergedDrivers = rawDrivers.map(d => ({
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
}));
```

### Change 2: Fallback Driver - Add Address Fields
**Line:** ~108-120
```javascript
// OLD
rawUsers.filter(u => u.role === "driver").forEach(u => {
  if (!mergedDrivers.find(md => md.userId === u._id || md.email === u.email)) {
    mergedDrivers.push({
      _id: u._id,
      userId: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || "N/A",
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

// NEW
rawUsers.filter(u => u.role === "driver").forEach(u => {
  if (!mergedDrivers.find(md => md.userId === u._id || md.email === u.email)) {
    mergedDrivers.push({
      _id: u._id,
      userId: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || "N/A",
      // Address fields from User document
      street: u.address?.street || "N/A",
      city: u.address?.city || "N/A",
      region: u.address?.region || "N/A",
      address: u.address ? `${u.address.street}, ${u.address.city}, ${u.address.region}` : "N/A",
      // Driver-specific fields (defaults for users without Driver doc)
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
```

---

## 5. Frontend: AdminDashboard.jsx

### File Path
`client/src/pages/AdminDashboard.jsx`

### Change: Review Modal - Add Physical Address Section
**Line:** ~754-768 (NEW SECTION - Insert before Ghana Card section)
```javascript
// NEW SECTION - Add after the driver details section and before Ghana Card Identity Verification
{/* Physical Address Section */}
<div style={{ marginBottom: "1.25rem" }}>
  <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--clr-text)" }}>Physical Address</h4>
  <div style={{ background: "var(--clr-surface-2)", borderRadius: "var(--r-md)", padding: "1rem", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
    <div><span className="text-muted">Street:</span> <span style={{ fontWeight: 600 }}>{reviewDriverModal.street || "N/A"}</span></div>
    <div><span className="text-muted">City:</span> <span style={{ fontWeight: 600 }}>{reviewDriverModal.city || "N/A"}</span></div>
    <div><span className="text-muted">Region:</span> <span style={{ fontWeight: 600 }}>{reviewDriverModal.region || "N/A"}</span></div>
  </div>
</div>
```

---

## Data Flow Summary

### Before Changes
```
Registration Form (no address)
    ↓
Backend (ignores address)
    ↓
MongoDB User (no address field)
    ↓
Admin API (no address returned)
    ↓
Admin Modal (address shows "N/A")
```

### After Changes
```
Registration Form (collects street, city, region)
    ↓
Backend (saves address to User document)
    ↓
MongoDB User (address subdocument)
    ↓
Admin API (returns address from userId populate)
    ↓
DataContext (maps address to driver object)
    ↓
Admin Modal (displays actual address values)
```

---

## Database Schema Changes

### User Document
```javascript
// NEW FIELDS
address: {
  street: String,
  city: String,
  region: String,
  country: String  // Default: "Ghana"
}
```

### Driver Document
```javascript
// EXISTING FIELDS (no changes)
{
  userId: ObjectId,
  licenseNumber: String,
  vehicleNumber: String,
  vehicleType: String,
  digitalAddress: String,
  ghanaCardImage: String,
  status: String,
  isAvailable: Boolean,
  currentLatitude: Number,
  currentLongitude: Number,
  lastLocationAt: Date
}
```

---

## API Changes

### POST /auth/register
**New Accepted Fields:**
- `address[street]` - String (required for drivers)
- `address[city]` - String (required for drivers)
- `address[region]` - String (required for drivers)

### GET /api/drivers
**Change:** Populate query now includes `address` field
```javascript
// OLD
populate("userId", "name email phone status isActive createdAt")

// NEW
populate("userId", "name email phone status isActive createdAt address")
```

---

## Validation Rules

### Address Fields (All Users)
- Required: Yes
- Min Length: 2 characters
- Max Length: Unlimited

### Digital Address (Drivers Only)
- Required: Yes
- Format: `^[A-Z]{2}-\d{3}-\d{4}$`
- Example: GA-001-1234

---

## Files Modified Summary

| File | Changes | Lines |
|------|---------|-------|
| client/src/pages/RegisterPage.jsx | 5 changes | +90 |
| server/src/routes/auth.js | 3 changes | +15 |
| server/src/routes/drivers.js | 1 change | +1 |
| client/src/context/DataContext.jsx | 2 changes | +18 |
| client/src/pages/AdminDashboard.jsx | 1 change | +15 |

**Total Changes:** 12 modifications  
**Total Lines Added:** ~139  
**Total Lines Removed:** 0  
**No Files Deleted:** ✓

---

## Backward Compatibility

✅ All changes are backward compatible:
- Existing drivers without address will show "N/A"
- Existing customers registration still works
- Admin API gracefully handles missing address
- No breaking changes to existing data structures

---

## Testing Checklist

- [ ] Form validation works for address fields
- [ ] Registration saves address to MongoDB
- [ ] API returns address in response
- [ ] DataContext maps address correctly
- [ ] Admin modal displays address
- [ ] All vehicle fields display (not "N/A")
- [ ] Ghana Card image displays
- [ ] Approve/Reject functionality works

