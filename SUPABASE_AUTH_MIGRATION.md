# 🔐 Supabase Auth Migration Guide

**Status:** Complete - Firebase Auth → Supabase Auth  
**Date:** September 2, 2026

---

## ✅ What Changed

### Before (Firebase Auth)
- Firebase handles authentication
- Custom sync logic to MongoDB
- Firebase UID stored in database
- Two separate systems

### After (Supabase Auth)
- Supabase handles EVERYTHING
- Auto-sync with trigger
- Supabase Auth ID (UUID)
- One unified system ✨

---

## 🗄️ Database Changes

### Users Table Updated

```sql
-- OLD
firebase_uid TEXT UNIQUE NOT NULL

-- NEW
auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
```

**Key Benefits:**
- Direct reference to Supabase auth system
- CASCADE delete (if auth deleted, user deleted)
- Native UUID type (not string)
- Automatic indexing

### Auto-Creation Trigger

When someone signs up via Supabase Auth, a user record is automatically created:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**What it does:**
1. User signs up (email/password, Google, etc.)
2. Supabase creates auth record
3. Trigger fires automatically
4. User record created in `public.users`
5. Role extracted from metadata

---

## 🔧 Backend Changes

### 1. Environment Variables

**`.env` updated:**
```env
# Supabase (replaces Firebase)
SUPABASE_URL=https://ekkeajtpxgwrtcebumhh.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
SUPABASE_ANON_KEY=eyJhbG... (for client)

# Firebase removed ❌
# FIREBASE_SERVICE_ACCOUNT_PATH (not needed anymore)
```

### 2. Authentication Middleware

**`middleware/auth.js` - Completely rewritten:**

```javascript
// OLD
export async function verifyFirebaseToken(req, res, next) {
  const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
  req.auth = decoded;
}

// NEW
export async function verifySupabaseToken(req, res, next) {
  const { data: { user } } = await supabase.auth.getUser(token);
  req.auth = { uid: user.id, email: user.email };
}
```

### 3. User Model

**`models/User.js` updated:**

```javascript
// OLD
async findByFirebaseUid(firebaseUid)

// NEW
async findByAuthId(authId) // Uses Supabase Auth UUID
```

### 4. All RLS Policies Updated

```sql
-- OLD
WHERE firebase_uid = auth.uid()::text

-- NEW
WHERE auth_id = auth.uid()
```

---

## 🎨 Frontend Changes

### Client Configuration

**`client/src/lib/supabase.js` (NEW FILE):**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Authentication Context

**`client/src/context/AuthContext.jsx` - NEEDS UPDATE:**

```javascript
// OLD - Firebase
import { auth } from '../lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

// NEW - Supabase
import { supabase } from '../lib/supabase'

// Sign Up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name,
      role,
      phone,
      // This metadata triggers the auto-create user
    }
  }
})

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// Sign Out
await supabase.auth.signOut()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    setUser(session.user)
  } else {
    setUser(null)
  }
})
```

### API Client

**`client/src/lib/api.js` - UPDATE:**

```javascript
import { supabase } from './supabase'

// Get token from Supabase (not Firebase)
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

// Set token in axios headers
axios.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

---

## 📦 Dependencies

### Backend

**Remove:**
```bash
npm uninstall firebase-admin
```

**Keep:**
```bash
@supabase/supabase-js (already installed ✅)
```

### Frontend

**Remove:**
```bash
npm uninstall firebase
```

**Install:**
```bash
npm install @supabase/supabase-js
```

---

## 🚀 Setup Steps

### 1. Enable Email Auth in Supabase

1. Go to: https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh
2. Click **Authentication** → **Providers**
3. **Email** provider:
   - Enable: ✅ ON
   - Confirm email: ✅ ON (recommended)
   - Email templates: Customize if needed
4. Click **Save**

### 2. Configure Allowed URLs

1. Authentication → **URL Configuration**
2. **Site URL:** `http://localhost:3000` (development)
3. **Redirect URLs:** Add:
   - `http://localhost:3000/**`
   - `https://yourdomain.com/**` (production)
4. Click **Save**

### 3. Optional: Enable OAuth Providers

**Google OAuth:**
1. Authentication → Providers → **Google**
2. Enable: ON
3. Add Client ID and Secret (from Google Cloud Console)
4. Click **Save**

**GitHub, Facebook, etc.:** Same process

### 4. Run Updated Schema

```bash
# The supabase-schema.sql has been updated
# Re-run it in SQL Editor to update tables and add trigger
```

### 5. Update Frontend Environment

**`client/.env`:**
```env
VITE_SUPABASE_URL=https://ekkeajtpxgwrtcebumhh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Testing

### Test 1: Sign Up

```javascript
// Frontend
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123456',
  options: {
    data: {
      name: 'Test User',
      role: 'customer'
    }
  }
})

// Check:
// 1. Supabase Dashboard → Authentication → Users (user appears)
// 2. Table Editor → users (user auto-created)
```

### Test 2: Sign In

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'Test123456'
})

// Returns session with access_token
```

### Test 3: Protected Route

```javascript
// Backend receives request with Bearer token
// Middleware verifies token with Supabase
// req.auth.uid contains Supabase user ID
// req.user contains database user record
```

---

## 🔄 Migration Checklist

### Backend ✅ DONE
- [x] Update schema (firebase_uid → auth_id)
- [x] Add auto-create trigger
- [x] Update RLS policies
- [x] Rewrite auth middleware
- [x] Update User model methods
- [x] Update environment variables

### Frontend 🔲 TODO
- [ ] Install @supabase/supabase-js
- [ ] Remove Firebase dependencies
- [ ] Create supabase.js config
- [ ] Update AuthContext to use Supabase
- [ ] Update API client token logic
- [ ] Update RegisterPage component
- [ ] Update LoginPage component
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test protected routes

---

## 📚 Supabase Auth Features

### What You Get Free

1. **Email/Password Auth** ✅
2. **Magic Links** (passwordless login)
3. **OAuth** (Google, GitHub, Facebook, etc.)
4. **Phone Auth** (with Twilio integration)
5. **Email Verification**
6. **Password Reset**
7. **Multi-factor Authentication (MFA)**
8. **Row Level Security** (automatic)

### Advantages Over Firebase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| **Cost** | Pay per auth | Free up to 50K users |
| **Database Integration** | Custom sync needed | Automatic |
| **JWT Tokens** | Custom claims | Standard + metadata |
| **Email Templates** | Limited | Fully customizable |
| **Session Management** | Manual | Built-in |
| **RLS Integration** | N/A | Native |

---

## 🐛 Troubleshooting

### "User not found in database"

**Cause:** Auth user exists but no database record

**Fix:** Check trigger is working:
```sql
SELECT * FROM auth.users; -- Should see user
SELECT * FROM public.users WHERE auth_id = 'user-uuid'; -- Should see user record

-- If missing, trigger didn't fire. Re-run trigger creation:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### "Invalid JWT token"

**Cause:** Using old Firebase token or expired Supabase token

**Fix:**
1. Sign out and sign in again
2. Check token is from Supabase (not Firebase)
3. Verify SUPABASE_URL and keys in .env

### "Email not confirmed"

**Cause:** Email confirmation enabled but user didn't confirm

**Fix:**
1. Check spam folder for confirmation email
2. Or disable email confirmation in Auth settings
3. Or manually confirm in Dashboard → Authentication → Users → click user → Confirm email

---

## 🎯 Next Steps

1. **Update Frontend** (main work)
   - Install Supabase client
   - Update AuthContext
   - Update all auth-related components

2. **Test Everything**
   - Sign up flow
   - Sign in flow
   - Sign out
   - Protected routes
   - Driver registration

3. **Remove Firebase**
   - Delete serviceAccountKey.json
   - Remove Firebase config from client
   - Remove Firebase env variables

---

## 📖 Resources

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **JavaScript Client:** https://supabase.com/docs/reference/javascript/auth-signup
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **Your Auth Dashboard:** https://supabase.com/dashboard/project/ekkeajtpxgwrtcebumhh/auth/users

---

**Migration Status:** Backend complete ✅ | Frontend pending 🔲

The backend is ready! Now just need to update the React frontend to use Supabase Auth instead of Firebase.
