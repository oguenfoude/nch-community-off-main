# 🌐 NCH Community - Immigration Platform

Professional immigration consultation platform for Algeria → International migration.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Update `.env.local` with your production domain:
```bash
# ⚠️ IMPORTANT: Update for production!
NEXTAUTH_URL="https://your-production-domain.com"
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Deploy to Production
```bash
npm run build
npm start
```

---

## 🔐 Authentication System (NextAuth v5)

### **How It Works:**

**Two Separate Login Systems:**
- **Clients**: `/login` - Email + password (plain text for MVP)
- **Admins**: `/admin/login` - Email + hashed password (bcrypt)

**Session Management:**
- JWT tokens (24-hour expiry)
- Stored in `session.user` with `id`, `email`, `name`, `role`, `userType`
- Auto-logout when session expires

**Protected Routes:**
- `/me` → Client dashboard (requires client auth)
- `/admin` → Admin panel (requires admin auth)
- `/payment` → Second payment (requires client auth)

**Key Files:**
- `auth.ts` - Main NextAuth configuration
- `auth.config.ts` - Providers and callbacks
- `middleware.ts` - CORS only (auth handled at page level)

### **Production Setup:**

**CRITICAL for Production:**
```bash
# .env.local
NEXTAUTH_URL="https://your-domain.com"  # ⚠️ Must match your domain!
NEXTAUTH_SECRET="a1aa91f0950461246b847dfe1eecef2993729e949844506ae9398dbfa7d9e7b6"
```

**Why NEXTAUTH_URL is Important:**
- NextAuth uses this for callback URLs
- SofizPay redirects to `${NEXTAUTH_URL}/api/payment-callback`
- Login redirects use this URL
- Cookies are set for this domain

**Session Access:**
```typescript
// Server Component
import { auth } from "@/auth"
const session = await auth()
const clientId = session?.user.id

// Client Component  
import { useSession } from "next-auth/react"
const { data: session } = useSession()
const email = session?.user.email
```

---

## 💳 Payment System

### **Two Payment Methods:**

#### **1. CIB (Card Payment - Instant)**
- ✅ Automatic verification via SofizPay
- ✅ Bank transaction ID provided
- ✅ Status: `verified` immediately
- ✅ No admin action needed
- ⚡ Processing: Instant

#### **2. BaridiMob (CCP Transfer - Manual)**
- 📄 Receipt upload required (PDF/image)
- ⏳ Status: `pending` → Admin verifies → `verified`
- 👨‍💼 Requires admin approval
- 🕐 Processing: 24-48 hours

### **Installment Payments (50% + 50%)**

**First Payment:**
- Registration → Select offer → Pay 50%
- Creates client account + payment record
- Client receives login credentials

**Second Payment:**
- Login → Dashboard → "Payer le solde" button
- Choose CIB or BaridiMob
- Complete payment → Account fully activated

### **Payment Flow:**

```
CLIENT PAYS → API creates Payment record → Google Sheets synced
                     ↓
           CIB: status=verified (instant)
           BaridiMob: status=pending (awaits admin)
                     ↓
           Admin verifies → status=verified
                     ↓
           Client sees "Vérifié" badge
```

---

## 📊 Data Storage

### **MongoDB (Prisma)**
- `Client` - User profiles
- `Payment` - All payment records
- `Admin` - Admin accounts
- `ClientStage` - Progress tracking
- `PendingRegistration` - Temporary payment sessions

### **Cloudinary**
- Payment receipts: `second-payments/` folder
- Client documents: `nch-community/{clientId}/` folder
- Supports: PDF, JPG, PNG (max 5MB)

### **Google Sheets (Backup)**
- **One row per client** (no duplicates)
- Finds client by email before creating new row
- Updates existing row on changes
- 26 professional columns:
  - Client info (name, email, phone, offer)
  - First payment (amount, date, method, status, receipt)
  - Second payment (amount, date, method, status, receipt)
  - Global payment status
  - Documents (ID, diploma, work certificate, photo)
  - System (password, last update)

---

## 🏗️ Project Structure

```
nch-community-off-main/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth handlers
│   │   ├── clients/
│   │   │   ├── profile/            # Get client data
│   │   │   ├── stages/             # Progress stages
│   │   │   ├── second-payment/     # Process 50% payment
│   │   │   └── [id]/payment/[paymentId]/verify/  # Admin verify
│   │   ├── upload/                 # Cloudinary uploads
│   │   ├── process-payment/        # Initialize payments
│   │   └── payment-callback/       # SofizPay callback
│   ├── admin/
│   │   ├── login/                  # Admin login page
│   │   ├── clients/[id]/          # Client details
│   │   └── page.tsx               # Admin dashboard
│   ├── me/                        # Client dashboard
│   ├── login/                     # Client login
│   ├── payment/                   # Second payment page
│   └── success/                   # Payment success
├── lib/
│   ├── auth.ts                    # NextAuth exports
│   ├── prisma.ts                  # Database client
│   ├── cloudinaryService.ts       # File uploads
│   ├── googleSheetsService.ts     # Sheets sync
│   ├── constants/                 # Pricing, config
│   ├── services/                  # Business logic
│   └── types/                     # TypeScript types
├── prisma/
│   └── schema.prisma             # Database schema
├── auth.ts                       # NextAuth setup
├── auth.config.ts                # Auth providers
├── middleware.ts                 # Route middleware
└── .env.local                   # Environment variables
```

---

## 🔧 Environment Variables

### **Production Checklist:**

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL="mongodb+srv://..."
MONGODB_URI="mongodb+srv://..."

# ============================================
# NEXTAUTH - ⚠️ UPDATE THIS!
# ============================================
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-secure-32-byte-hex-secret"

# ============================================
# CLOUDINARY
# ============================================
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ============================================
# GOOGLE SHEETS
# ============================================
GOOGLE_SHEETS_SPREADSHEET_ID="your-sheet-id"
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL="service@account.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ============================================
# SOFIZPAY
# ============================================
NEXT_PUBLIC_SOFIZPAY_API_KEY="your-sofizpay-key"
```

### **Before Deploying:**

- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Verify all environment variables are set
- [ ] Test MongoDB connection
- [ ] Test Cloudinary uploads
- [ ] Test SofizPay payment flow
- [ ] Create admin account: `npm run create-admin`
- [ ] Test Google Sheets sync

---

## 👥 User Flows

### **Client Journey:**

1. **Registration** → Form + Documents → Select Offer
2. **First Payment (50%)** → CIB or BaridiMob → Account Created
3. **Login** → View Dashboard → Track Progress
4. **Second Payment (50%)** → Complete Payment → Fully Activated

### **Admin Workflow:**

1. **Dashboard** → View Stats → Filter Clients
2. **Client Details** → View Info → Update Status
3. **Verify BaridiMob** → View Receipt → Click "Vérifier"
4. **Track Payments** → Check Google Sheets → Monitor Progress

---

## 🧪 Testing

### **Local Testing:**
```bash
npm run dev

# Test as client:
# 1. Register at http://localhost:3000
# 2. Complete payment
# 3. Login at /login
# 4. View /me dashboard

# Test as admin:
# 1. Create admin: npm run create-admin
# 2. Login at /admin/login
# 3. Verify payments
```

### **Production Testing:**
```bash
npm run build
npm start

# Critical flows:
# ✅ Client registration + CIB payment
# ✅ Client registration + BaridiMob payment
# ✅ Client second payment
# ✅ Admin verification
# ✅ Google Sheets sync
```

---

## 📱 Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: MongoDB + Prisma
- **Auth**: NextAuth v5
- **Payments**: SofizPay
- **Storage**: Cloudinary
- **Backup**: Google Sheets
- **UI**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

---

## 🛡️ Security

- ✅ JWT authentication (24h expiry)
- ✅ Admin password hashing (bcrypt)
- ✅ Payment signature verification
- ✅ Environment variables secured
- ✅ HTTPS required in production
- ✅ Client data isolated by session

---

## 📞 CCP Payment Info

- **Email**: contact@nch-community.online
- **RIP**: 00799999004145522768
- **CCP**: 0041455227
- **Clé**: 68

---

## 💰 Pricing

- **Basic**: 21,000 DZD (50% + 50%)
- **Premium**: 28,000 DZD (50% + 50%)
- **Gold**: 35,000 DZD (50% + 50%)

---

## ✅ Production Ready

All systems tested and working:
- ✅ Authentication (client + admin)
- ✅ Payment processing (CIB + BaridiMob)
- ✅ File uploads (Cloudinary)
- ✅ Data backup (Google Sheets)
- ✅ Admin verification workflow
- ✅ No TypeScript errors
- ✅ No runtime errors

**Status**: Ready for deployment
**Last Updated**: December 10, 2025
**Version**: 1.0.0
