# 🔐 Authentication Flow - Simple & Clear

## 📋 Overview
This app has **TWO separate user types**: Admin and Client
- Each has their own login page and dashboard
- They use different credentials and access different areas

---

## 🚪 Login Pages

### 1️⃣ Admin Login
**Page:** `/admin/login`  
**File:** `app/admin/login/page.tsx`

**Flow:**
1. Admin enters email + password
2. Calls `loginAdmin(email, password)` server action
3. If success → redirects to `/admin` (admin dashboard)
4. If fail → shows error message

**Code:**
```tsx
const result = await loginAdmin(email, password)
if (result.success) {
  window.location.href = "/admin"  // Hard refresh to load session
}
```

---

### 2️⃣ Client Login
**Page:** `/login`  
**File:** `app/login/page.tsx`

**Flow:**
1. Client enters email + password
2. Calls `loginClient(email, password)` server action
3. If success → redirects to `/me` (client dashboard)
4. If fail → shows error message

**Code:**
```tsx
const result = await loginClient(email, password)
if (result.success) {
  window.location.href = "/me"  // Hard refresh to load session
}
```

---

## 🏠 Dashboard Pages

### 1️⃣ Admin Dashboard
**Page:** `/admin`  
**File:** `app/admin/page.tsx`

**What it shows:**
- List of all clients
- Client statistics (total, pending, paid, completed)
- Search and filter clients
- View/delete client actions

**Protection:**
- Checks if user is logged in
- Checks if userType === "admin"
- If not admin → redirects to `/admin/login`

---

### 2️⃣ Client Dashboard
**Page:** `/me`  
**File:** `app/me/page.tsx`

**What it shows:**
- Client's personal information
- Their application stages (progress tracking)
- Payment status
- Documents/stages for their case

**Protection:**
- Must be logged in as client
- Shows only their own data

---

## 🚪 Logout

### Admin Logout
**Code:** `app/admin/page.tsx`
```tsx
const result = await logoutAdmin()
if (result?.redirectTo) {
  window.location.href = result.redirectTo  // Goes to /admin/login
}
```

### Client Logout
**Code:** `app/me/page.tsx`
```tsx
const result = await logoutClient()
if (result?.redirectTo) {
  window.location.href = result.redirectTo  // Goes to /login
}
```

---

## 🔧 How Authentication Works

### Server Actions (Backend)
**File:** `lib/actions/auth.actions.ts`

**Three functions:**
1. `loginAdmin(email, password)` - Logs in admin
2. `loginClient(email, password)` - Logs in client
3. `logoutAdmin()` - Logs out admin → `/admin/login`
4. `logoutClient()` - Logs out client → `/login`

**Authentication Logic:**
```typescript
// Login
const result = await signIn("admin", { 
  email, 
  password, 
  redirect: false  // We handle redirect manually
})

// Logout
await signOut({ redirect: false })
return { redirectTo: "/admin/login" }  // Return where to go
```

---

### Auth Configuration
**File:** `auth.config.ts`

**Two credential providers:**

1. **Admin Provider** (`id: "admin"`)
   - Checks `Admin` table in database
   - Verifies password with bcrypt
   - Sets `userType: "admin"`

2. **Client Provider** (`id: "client"`)
   - Checks `Client` table in database
   - Verifies plain password (no hash)
   - Sets `userType: "client"`

**Session Strategy:**
- Uses JWT (JSON Web Token)
- Stored in HTTP-only cookie
- Expires after 24 hours

---

## 📄 All Pages Summary

| Page | Path | File | Purpose |
|------|------|------|---------|
| **Homepage** | `/` | `app/page.tsx` | Registration form (public) |
| **Client Login** | `/login` | `app/login/page.tsx` | Client signs in |
| **Client Dashboard** | `/me` | `app/me/page.tsx` | Client sees their info |
| **Admin Login** | `/admin/login` | `app/admin/login/page.tsx` | Admin signs in |
| **Admin Dashboard** | `/admin` | `app/admin/page.tsx` | Admin manages clients |
| **Client Details** | `/admin/clients/[id]` | `app/admin/clients/[id]/page.tsx` | Admin views one client |
| **Payment** | `/payment` | `app/payment/page.tsx` | Payment processing |
| **Success** | `/success` | `app/success/page.tsx` | Registration success |
| **Error** | `/error` | `app/error/page.tsx` | Error display |

---

## 🎯 Simple Flow Diagram

```
┌─────────────────┐
│   User visits   │
│    website      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Homepage (/)  │ ← Public registration
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Admin wants  │  │ Client wants │  │ New user     │
│ to login     │  │ to login     │  │ registers    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ /admin/login │  │   /login     │  │ Fill form +  │
│              │  │              │  │ Pay → /me    │
│ Enter email  │  │ Enter email  │  └──────────────┘
│ + password   │  │ + password   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   /admin     │  │     /me      │
│              │  │              │
│ Manage all   │  │ See my info  │
│ clients      │  │ & progress   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Logout     │  │   Logout     │
│ → /admin/    │  │ → /login     │
│   login      │  │              │
└──────────────┘  └──────────────┘
```

---

## ✅ Key Points

1. **Two separate systems:** Admin and Client never mix
2. **Hard navigation:** Uses `window.location.href` to ensure session loads
3. **No redirect in signIn/signOut:** We handle redirects manually for better control
4. **Session stored in cookie:** HTTP-only, secure, 24-hour expiry
5. **Protection on pages:** Each protected page checks userType

---

## 🔒 Security

- Passwords: Admin passwords are hashed (bcrypt), Client passwords are plain
- Sessions: JWT stored in HTTP-only cookie (can't be accessed by JavaScript)
- Page protection: Each page checks authentication before showing content
- Auto-redirect: Unauthenticated users automatically redirected to login

---

**That's it! Simple and clear.** 🎉
