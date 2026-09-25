# 🧪 Driver Registration Test Instructions

## ✅ Pre-Test Checklist

**All services are running:**
- ✅ MongoDB: Running on port 27017
- ✅ Backend: Running on http://localhost:5001
- ✅ Frontend: Running on http://localhost:3000

**Fix Applied:**
- ✅ RegisterPage now calls `registerWithEmail()` which sets `activeLoginRef` flag
- ✅ Backend `/auth/register` can handle existing users (update to driver role)
- ✅ Debug logging added to backend to trace registration flow

---

## 📋 Test Steps

### 1. Open Registration Page
```
http://localhost:3000/register
```

### 2. Select Driver Role
- Click on "🚚 Delivery Driver" option
- Form should expand to show driver-specific fields

### 3. Fill Basic Information
- **Full Name:** `Test Driver ${Date.now()}`
- **Email:** `testdriver${Date.now()}@example.com` (use actual timestamp)
- **Phone:** `+233555123456`
- **Password:** `Test123456`
- **Confirm Password:** `Test123456`

### 4. Fill Address Information
- **Street Address:** `123 Test Avenue`
- **City:** `Accra`
- **Region:** `Greater Accra`

### 5. Fill Driver-Specific Information
- **Driver's License Number:** `DL-2024-56789`
- **Vehicle Type:** Select "Van" from dropdown
- **Vehicle Number Plate:** `GH-1234-20`
- **Digital Address:** `GA-001-1234`
- **Ghana Card Image:** Upload any JPG/PNG image file

### 6. Submit Registration
- Click "Create Account" button
- Watch for loading state
- Should redirect to `/driver/pending` page

---

## 🔍 What to Watch For

### Backend Console (Terminal)
You should see these debug logs in order:

```
🔍 DEBUG - Registration: {
  role: 'driver',
  isDriver: true,
  isCustomer: false,
  firebaseUid: 'xxx...',
  email: 'testdriver...@example.com',
  hasFile: true,
  existingUserRole: 'driver' or undefined
}

✅ User registered/updated: {
  _id: 'xxx...',
  email: 'testdriver...@example.com',
  role: 'driver',    ← MUST BE 'driver', NOT 'customer'
  status: 'pending'
}
```

### Frontend
- ✅ No error messages
- ✅ Redirects to `/driver/pending` page showing "Pending Approval" message
- ✅ No console errors in browser DevTools

---

## ✅ Success Criteria

1. **Registration completes without errors**
2. **Backend logs show `role: 'driver'` in the debug output**
3. **User redirects to `/driver/pending` page**
4. **No customer dashboard or other redirect happens**

---

## 🐛 If Registration Fails

### Check Backend Logs For:
- Validation errors (check field formats)
- File upload errors (Ghana Card image)
- Firebase authentication errors
- Database connection errors

### Common Issues:
1. **Digital Address format error:** Must be format `XX-###-####` (e.g., GA-001-1234)
2. **Ghana Card image:** Must be JPG/PNG and under 5MB
3. **Phone format:** Should start with + and country code
4. **Email already exists:** Use a unique email each test

---

## 🔄 After Testing

### To Verify in MongoDB:
```javascript
// If you have mongo shell access:
db.users.find({ email: "testdriver...@example.com" }, { role: 1, status: 1, email: 1 })

// Should return:
{
  _id: ObjectId("..."),
  email: "testdriver...@example.com",
  role: "driver",    ← MUST be "driver"
  status: "pending"
}
```

### To View in Admin Dashboard:
1. Login as admin
2. Navigate to Driver Management
3. Should see your test driver in "Pending Approval" list
4. Click "Review" - should show:
   - License Number
   - Vehicle Type & Number
   - Digital Address
   - Physical Address (street, city, region)
   - Ghana Card image

---

## 📝 Test Result Template

```
✅/❌ Registration completed
✅/❌ User role is "driver" (not "customer")
✅/❌ Redirected to /driver/pending
✅/❌ Backend logs show correct role
✅/❌ Driver profile created in database
✅/❌ Ghana Card image saved
✅/❌ All fields display in admin review
```

---

## 🚀 Ready to Test!

**Frontend URL:** http://localhost:3000/register

**Watch backend logs in your terminal for debug output!**
