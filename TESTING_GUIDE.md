# Driver Verification System - Testing Guide

## System Status
✅ Backend Server: http://localhost:5001
✅ Frontend Client: http://localhost:3001
✅ MongoDB: localhost:27017 (Connected)

---

## Test Flow 1: Customer Registration

### Steps:
1. Open http://localhost:3001/register
2. Select "Customer" role (🛍️ icon)
3. Fill in the form:
   - **Full Name**: John Customer
   - **Email**: customer@example.com
   - **Phone**: +233 20 123 4567 (optional)
   - **Password**: Password123
   - **Confirm Password**: Password123
4. Click "Create account"

### Expected Result:
- ✅ Registration succeeds
- ✅ Redirect to Customer Dashboard
- ✅ User saved in MongoDB with:
  - `role: "customer"`
  - `status: "active"`
  - `isActive: true`

### Verification:
- Customer can login immediately
- Customer appears in Admin Dashboard → Customers tab
- Customer status shows as "Active"

---

## Test Flow 2: Driver Registration

### Steps:
1. Open http://localhost:3001/register
2. Select "Driver" role (🚚 icon)
3. Form automatically expands to show sections:

#### Personal Information
- **Full Name**: Jane Driver
- **Email**: driver@example.com
- **Phone**: +233 24 987 6543 (required for drivers)
- **Password**: Password123
- **Confirm Password**: Password123

#### Driver Information
- **Driver's Licence Number**: DL123456789

#### Vehicle Information
- **Vehicle Type**: Van (dropdown)
- **Vehicle Number Plate**: GR-0001-24

#### Identity Verification
- **Ghana Card**: Upload a test image (JPG/PNG, max 5MB)

4. Click "Create account"

### Expected Result:
- ✅ Registration succeeds with file upload
- ✅ Redirect to Driver Pending Approval page
- ✅ Driver saved in MongoDB with:
  - `role: "driver"`
  - `status: "pending"`
  - `isActive: true`
- ✅ Driver profile created with:
  - `licenseNumber: "DL123456789"`
  - `vehicleType: "Van"`
  - `vehicleNumber: "GR-0001-24"`
  - `ghanaCardImage: "[filename]"`
  - `status: "pending"`

### Verification:
- Pending driver sees "⏳ Pending Administrator Approval" message
- Driver cannot access operational features
- Driver appears in Admin Dashboard → Pending Driver Approvals section

---

## Test Flow 3: Admin Driver Review & Approval

### Steps:
1. Login as Admin (use demo account: admin@demo.com)
2. Go to Admin Dashboard
3. Locate "Pending Driver Approvals" section
4. Find the pending driver "Jane Driver"
5. Click "Review" button

### Expected Modal Shows:
- ✅ Driver name and avatar
- ✅ Email: driver@example.com
- ✅ Phone: +233 24 987 6543
- ✅ License Number: DL123456789
- ✅ Vehicle Type: Van
- ✅ Vehicle Number: GR-0001-24
- ✅ Registration Date
- ✅ **Ghana Card Image** (displays uploaded image)
- ✅ Two buttons: "✓ Approve Driver" and "✕ Reject Driver"

### Approve Driver:
1. Click "✓ Approve Driver"
2. Modal closes
3. Pending count decreases

### Expected Result After Approval:
- ✅ Driver status changed to "approved"
- ✅ Driver now appears in "Approved Drivers" list
- ✅ Driver removed from "Pending Driver Approvals"

---

## Test Flow 4: Approved Driver Login

### Steps:
1. Go to http://localhost:3001/login
2. Enter credentials:
   - **Email**: driver@example.com
   - **Password**: Password123
3. Click "Sign in"

### Expected Result:
- ✅ Authentication succeeds
- ✅ Backend checks `role: "driver"` and `status: "approved"`
- ✅ Redirect to Driver Dashboard
- ✅ Driver can access:
  - Assigned Deliveries
  - Delivery Details & Updates
  - GPS Tracking (if enabled)
  - Status Updates

---

## Test Flow 5: Rejected Driver

### Steps:
1. Create another driver for testing
2. In Admin Dashboard, click "Review" on pending driver
3. Click "✕ Reject Driver"
4. Confirm rejection

### Expected Result After Rejection:
- ✅ Driver status changed to "rejected"
- ✅ Driver cannot login
- ✅ Or if logged in, sees "Account Rejected / Status" page
- ✅ Driver cannot access Driver Dashboard or operational features

### Test Rejection Login:
1. Try to login with rejected driver credentials
2. Should either:
   - Reject authentication, OR
   - Allow login but show rejection status page

---

## Test Flow 6: Driver Assignment (Admin Feature)

### Steps:
1. Login as Admin
2. Go to Admin Dashboard → Shipments tab
3. Click "Assign" on a pending shipment
4. Driver dropdown should show:
   - ✅ Only approved drivers
   - ✅ NOT pending drivers
   - ✅ NOT rejected drivers

### Expected Result:
- "Jane Driver" (approved) appears in list
- Any pending or rejected drivers do NOT appear
- Only drivers with `role: "driver"` AND `status: "approved"` shown

---

## Test Flow 7: Admin Dashboard Counters

### Expected Metrics (after tests):
- **Total Users**: 2+ (customer + driver + admin)
- **Total Customers**: 1+ (John Customer)
- **Total Drivers**: 1+ (Jane Driver)
- **Pending Driver Approvals**: 0 (after approval)
- **Approved Drivers**: 1+ (Jane Driver after approval)

---

## Test Flow 8: Data Validation

### Customer Registration Validation:
- ✅ Name: Min 2 chars
- ✅ Email: Valid format required
- ✅ Password: Min 6 chars
- ✅ Confirm Password: Must match password

### Driver Registration Validation:
- ✅ All customer fields required
- ✅ Phone: Required for drivers
- ✅ License Number: Required
- ✅ Vehicle Type: Required (dropdown)
- ✅ Vehicle Number Plate: Required
- ✅ Ghana Card Image: Required
  - File types: JPG, JPEG, PNG only
  - Max size: 5MB
  - Error messages for invalid files

---

## Test Flow 9: Security Checks

### Backend Enforcement:
- ✅ Only admins can approve/reject drivers
- ✅ Pending drivers blocked from `/driver` endpoints
- ✅ Rejected drivers blocked from `/driver` endpoints
- ✅ Ghana Card endpoint (`/api/drivers/:id/ghana-card`) admin-only
- ✅ Files not publicly accessible without authentication

### Frontend Enforcement:
- ✅ ProtectedRoute blocks unapproved drivers
- ✅ Pending drivers redirected to approval page
- ✅ Rejected drivers redirected to rejection page

---

## Test Flow 10: File Upload Security

### Ghana Card Upload Testing:
1. Try uploading:
   - ✅ Valid JPG (should succeed)
   - ✅ Valid PNG (should succeed)
   - ❌ PDF (should reject)
   - ❌ .txt (should reject)
   - ❌ File > 5MB (should reject)

### Expected Validation Messages:
- Invalid type: "Only JPG, JPEG, and PNG images are allowed."
- Too large: "Ghana Card image must be smaller than 5MB."

---

## Database Verification

### Check MongoDB Collections:

#### Users Collection:
```javascript
{
  _id: ObjectId,
  firebaseUid: "...",
  name: "Jane Driver",
  email: "driver@example.com",
  phone: "+233 24 987 6543",
  role: "driver",
  status: "approved", // or "pending"/"rejected"
  isActive: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Drivers Collection:
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref to User
  licenseNumber: "DL123456789",
  vehicleNumber: "GR-0001-24",
  vehicleType: "Van",
  ghanaCardImage: "filename.jpg",
  status: "approved", // or "pending"/"rejected"
  isAvailable: false, // true only if approved
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Uploads Directory:
- Files stored at: `server/uploads/ghana-cards/`
- Naming: `{userId}_{timestamp}_{random}.{ext}`
- Secured: Not publicly accessible

---

## Troubleshooting

### Issue: Ghana Card image not uploading
- Check: Max file size is 5MB
- Check: Only JPG/PNG allowed
- Check: `uploads/ghana-cards/` directory exists
- Check: Server has write permissions

### Issue: Driver shows in pending but not after approval
- Refresh the page
- Check MongoDB for updated status
- Check network tab for approval API response

### Issue: Admin cannot see Ghana Card
- Verify admin is logged in
- Check `/api/drivers/:id/ghana-card` endpoint
- File must exist at `server/uploads/ghana-cards/`

### Issue: File size validation not working
- Check: multer config has `limits.fileSize` set to 5MB
- Validation happens in two places: client-side + server-side

---

## Success Criteria Checklist

- [ ] Customer can register and login immediately
- [ ] Driver can register with Ghana Card upload
- [ ] Pending driver cannot access operational features
- [ ] Admin can see pending drivers in dashboard
- [ ] Admin can approve drivers with Ghana Card verification
- [ ] Approved driver can login and access dashboard
- [ ] Only approved drivers appear in assignment list
- [ ] Ghana Card images are secure (admin-only viewing)
- [ ] File validation works (type, size)
- [ ] All validation error messages display correctly
- [ ] Database records created correctly for each user/driver
- [ ] Role-based access control enforced on backend

---

## Quick Debug Commands

### Check server logs:
Terminal showing server process (port 5001)

### Check database:
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/logistics-platform

# View users
db.users.find()

# View drivers
db.drivers.find()

# View uploaded files
ls -la server/uploads/ghana-cards/
```

### Clear test data:
```bash
# In mongo shell
db.users.deleteMany({ email: { $regex: "test|example" } })
db.drivers.deleteMany({})
rm -rf server/uploads/ghana-cards/*
```

---

## Next Steps After Testing

1. ✅ Verify all test flows pass
2. ✅ Check database records
3. ✅ Validate error messages
4. ✅ Test edge cases
5. ✅ Security verification
6. ✅ Performance check (file uploads)
7. Deploy to production

---

