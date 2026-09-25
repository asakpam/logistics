# Quick Start Guide - Driver Verification System

## 🚀 30 Second Setup

**Already Running?**
```
✅ Client: http://localhost:3001
✅ Server: http://localhost:5001
✅ MongoDB: Connected
```

## 🧪 Quick Test (5 Minutes)

### 1️⃣ Test Customer Registration
```
1. Open http://localhost:3001/register
2. Select "Customer" role
3. Fill: Name, Email, Phone, Password
4. Click "Create account"
→ Should see Customer Dashboard
```

### 2️⃣ Test Driver Registration
```
1. Open http://localhost:3001/register
2. Select "Driver" role
3. Fill ALL fields:
   - Personal: Name, Email, Phone, Password
   - Driver: License Number
   - Vehicle: Type, Number Plate
   - Identity: Upload a test image (JPG/PNG)
4. Click "Create account"
→ Should see "Pending Administrator Approval"
```

### 3️⃣ Test Admin Approval
```
1. Open http://localhost:3001/login
2. Login as admin (demo@demo.com or real admin account)
3. Go to Admin Dashboard
4. Find "Pending Driver Approvals" section
5. Click "Review" on the pending driver
6. Modal opens showing:
   - Driver details
   - Vehicle info
   - Ghana Card image
7. Click "Approve Driver"
→ Driver status changes to approved
```

### 4️⃣ Test Approved Driver Login
```
1. Logout
2. Login with driver email (from step 2️⃣)
3. Use password from registration
→ Should see Driver Dashboard
```

---

## 📁 Files Changed

**Backend**:
- `server/src/models/Driver.js` - Enhanced fields
- `server/src/middleware/upload.js` - NEW
- `server/src/routes/auth.js` - Updated
- `server/src/routes/drivers.js` - Updated
- `server/src/app.js` - Updated

**Frontend**:
- `client/src/pages/RegisterPage.jsx` - Enhanced
- `client/src/pages/AdminDashboard.jsx` - Updated
- `client/src/styles.css` - Added styles

**Docs** (NEW):
- `TESTING_GUIDE.md` - Full test procedures
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `CHANGES_DOCUMENTATION.md` - Change log
- `PROJECT_STATUS.md` - Status overview

---

## 🔍 What to Check

### ✅ Customer Registration Works
- [ ] Form shows only basic fields
- [ ] No driver-specific fields visible
- [ ] Can register and login immediately

### ✅ Driver Registration Works
- [ ] Form expands with all 4 sections
- [ ] Ghana Card file upload visible
- [ ] File validation works (reject non-JPG)
- [ ] Redirects to pending page after submit

### ✅ Admin Features Work
- [ ] Pending drivers shown in dashboard
- [ ] Modal displays driver details
- [ ] Ghana Card image shows in modal
- [ ] Approve/Reject buttons work

### ✅ Security Works
- [ ] Pending drivers can't access driver features
- [ ] Ghana Card not accessible without admin role
- [ ] Only approved drivers appear in assignment list

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Ghana Card not uploading | Max 5MB? JPG/PNG only? |
| Pending driver shows after approval | Refresh page |
| Admin can't see Ghana Card | Login as admin, check file exists |
| File upload directory error | Create `server/uploads/ghana-cards/` |

More help: See **TESTING_GUIDE.md** Troubleshooting section

---

## 📊 Database Check

**MongoDB - View Drivers**:
```javascript
// In mongo shell
db.drivers.findOne()

// Should show:
{
  userId: ObjectId,
  licenseNumber: "...",
  vehicleNumber: "...",
  vehicleType: "...",
  ghanaCardImage: "filename.jpg",
  status: "pending" // or "approved"/"rejected"
}
```

**MongoDB - View Users**:
```javascript
// In mongo shell
db.users.findOne({ role: "driver" })

// Should show:
{
  firebaseUid: "...",
  name: "...",
  email: "...",
  role: "driver",
  status: "pending" // or "active"/"approved"/"rejected"
}
```

---

## 🎯 Key Flows

### Customer Flow
```
Register (basic) → Active → Login → Customer Dashboard
```

### Driver Flow
```
Register (extended) → Pending → Admin Reviews → Approve → Can Login → Driver Dashboard
                                                    ↓
                                                  Reject → Cannot Access
```

### Admin Flow
```
Dashboard → Pending Drivers → Review Modal (with Ghana Card) → Approve/Reject
```

---

## 📞 Quick Links

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5001
- **MongoDB**: localhost:27017

---

## 🚀 Full Testing

For comprehensive testing, see: **TESTING_GUIDE.md**

For technical details, see: **IMPLEMENTATION_SUMMARY.md**

For deployment, see: **CHANGES_DOCUMENTATION.md**

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Customer registration test | 2 min |
| Driver registration test | 3 min |
| Admin approval test | 2 min |
| Full test cycle | 10 min |
| Database verification | 5 min |
| **Total** | **~20 min** |

---

## ✅ Success Criteria

After testing, you should see:
- ✅ Customers register instantly
- ✅ Drivers register with Ghana Card
- ✅ Admin sees pending drivers
- ✅ Admin can approve/reject
- ✅ Approved drivers can login
- ✅ Pending drivers blocked
- ✅ Files secured

**Status**: Ready for deployment ✨

---

**Version**: 1.1.0  
**Date**: September 2, 2026  
**Status**: Complete & Ready

