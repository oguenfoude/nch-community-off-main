# 👨‍💻 Developer Guide - For New Developers

**Project:** NCH Community Platform  
**Stack:** Next.js 15.5.7, TypeScript, Prisma, NextAuth v5  
**Last Updated:** December 11, 2025

---

## 🚀 Quick Start

### Installation
```bash
# 1. Clone
git clone https://github.com/oguenfoude/nch-community-off-main.git
cd nch-community-off-main

# 2. Dependencies
npm install

# 3. Database
npx prisma generate
npx prisma db push

# 4. Admin
node scripts/create-admin.js

# 5. Run
npm run dev
```

### Environment Variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
CLOUDINARY_...="..."
SOFIZPAY_...="..."
GOOGLE_...="..."
```

---

## 📂 Core Structure

```
app/
  ├── api/                     # API endpoints
  │   ├── generatepdf/         # ★ DOCX generation
  │   ├── payment-callback/    # ★ Payment callback
  │   ├── process-payment/     # Payment initiation
  │   └── register/            # New registration
  ├── admin/                   # Admin dashboard
  ├── me/                      # Client dashboard
  └── login/                   # Login

components/
  ├── admin/                   # Admin components
  ├── client/                  # Client components
  └── ui/                      # shadcn/ui

lib/
  ├── services/                # ★ Business logic
  │   ├── registration.service.ts
  │   ├── payment.service.ts
  │   └── googleSheets.sync.ts
  ├── validators/              # Data validation
  ├── auth.ts                  # NextAuth
  └── prisma.ts                # Database

prisma/
  └── schema.prisma            # ★ Database schema

public/
  └── garenttie.docx           # ★ Contract template
```

---

## 🔑 Key Files

### 1. DOCX Generation
**File:** `app/api/generatepdf/route.ts`

```typescript
// 3-pass strategy:

// Pass 1: Merge split text
docContent = docContent.replace(
  /\(le<\/w:t>[\s\S]*?<w:t[^>]*>\s*montant\)/gi,
  '(le montant)'
);

// Pass 2: Replace in <w:t>
updatedContent = docContent.replace(
  /<w:t[^>]*>([\s\S]*?)<\/w:t>/g,
  (full, text) => { /* replacement */ }
);

// Pass 3: Global cleanup
for (const [needle, value] of Object.entries(replacements)) {
  updatedContent = updatedContent.split(needle).join(value);
}
```

**Critical Points:**
- Use `String.fromCharCode(8217)` for curly apostrophe
- Merge XML before replacement
- Handle names without duplication

---

### 2. Payment Callback
**File:** `app/api/payment-callback/route.ts`

```typescript
// Verify signature
const isValid = sdk.verifySignature({
  message: message || '',
  signature_url_safe: signature || ''
});

if (status === 'success' && isValid) {
  if (isSecondPayment) {
    // Second payment
    await completeSecondPayment(token, transactionId, response);
    redirect('/me?payment=success&type=second');
  } else {
    // First payment
    await completeCardPaymentRegistration(token, transactionId, response);
    redirect('/success?...');
  }
}
```

**Flow:**
1. Receive callback from SofizPay
2. Verify digital signature
3. Create/update Payment
4. Sync Google Sheets
5. Redirect user

---

### 3. Registration Service
**File:** `lib/services/registration.service.ts`

```typescript
// CIB
export async function registerWithCardPayment(data: RegistrationInput) {
  // 1. Check email
  if (await emailExists(data.email)) return { success: false };
  
  // 2. Generate password + token
  const password = generatePassword(firstName, lastName);
  const sessionToken = generateSessionToken('card');
  
  // 3. Save to PendingRegistration
  const pending = await prisma.pendingRegistration.create({ ... });
  
  // 4. Call SofizPay
  const result = await initiateSofizPayTransaction({ ... });
  
  // 5. Return payment URL
  return { success: true, paymentUrl: result.url };
}

// BaridiMob
export async function registerWithBaridiMob(data: RegistrationInput) {
  // Instant creation with status: 'pending'
  const { client, payment } = await createClientWithPayment({ ... });
  return { success: true, clientId: client.id };
}
```

---

### 4. Google Sheets Sync
**File:** `lib/services/googleSheets.sync.ts`

```typescript
// Add client
export async function appendClientToSheet(data: ClientSheetData) {
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Clients!A:Z',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[...clientData]] }
  });
}

// Update
export async function updateClientInSheet(email: string, updates: Partial<ClientSheetData>) {
  const row = await findClientRowByEmail(email);
  if (!row) return;
  
  await sheets.spreadsheets.values.update({
    range: `Clients!A${row}:Z${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[...updatedData]] }
  });
}
```

---

## 🗄️ Database (Prisma)

### Main Models

```prisma
model Client {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String    // plain text
  firstName         String
  lastName          String
  phone             String
  selectedOffer     String    // basic, premium, gold
  selectedCountries Json
  paymentStatus     String    // Non payé, Payé 50%, Payé 100%
  
  payments          Payment[]
  stages            ClientStage[]
}

model Payment {
  id                String    @id @default(cuid())
  clientId          String
  paymentType       String    // initial, second
  paymentMethod     String    // cib, baridimob
  amount            Float
  status            String    // pending, verified, rejected
  transactionId     String?
  sofizpayResponse  Json?
  baridiMobInfo     Json?
  
  client            Client    @relation(...)
}

model PendingRegistration {
  id                String    @id @default(cuid())
  sessionToken      String    @unique
  registrationData  Json
  paymentDetails    Json
  status            String    @default("pending")
  expiresAt         DateTime  // 24 hours
}
```

### Common Commands
```bash
npx prisma generate          # Generate client
npx prisma db push           # Push schema
npx prisma studio            # Visual UI
npx prisma migrate dev       # Create migration
```

---

## 🔐 Authentication (NextAuth v5)

### Configuration
**File:** `auth.config.ts`

```typescript
export const authConfig = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const { email, password, userType } = credentials;
        
        if (userType === 'admin') {
          const admin = await prisma.admin.findUnique({ ... });
          const isValid = await bcrypt.compare(password, admin.password);
          return isValid ? { ...admin, userType: 'admin' } : null;
        } else {
          const client = await prisma.client.findUnique({ ... });
          return client.password === password 
            ? { ...client, userType: 'client' } 
            : null;
        }
      }
    })
  ],
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  callbacks: { jwt, session }
};
```

### Protection
**File:** `middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request });
  
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session || session.userType !== 'admin') {
      return NextResponse.redirect('/admin/login');
    }
  }
  
  if (request.nextUrl.pathname.startsWith('/me')) {
    if (!session || session.userType !== 'client') {
      return NextResponse.redirect('/login');
    }
  }
}
```

---

## 🧪 Testing and Debugging

### Logging
```typescript
// Enable logs
console.log('🔍 Debug:', { variable });

// Check session
const session = await getServerSession(authConfig);
console.log('Session:', session);

// Check database
const client = await prisma.client.findUnique({ where: { id } });
console.log('Client:', client);
```

### Common Errors

**1. "Session expired"**
```typescript
// Solution
const session = await getServerSession(authConfig);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**2. "Template not found"**
```typescript
// Check
const templatePath = path.join(process.cwd(), "public", "garenttie.docx");
if (!fs.existsSync(templatePath)) {
  console.error('Missing:', templatePath);
}
```

**3. "Google Sheets sync failed"**
```typescript
// Check key
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
```

---

## 📊 Main Flows

### Registration + CIB Payment
```
POST /api/register
  → validateRegistration()
  → registerWithCardPayment()
    → create PendingRegistration
    → call SofizPay API
    → return paymentUrl

User pays on SofizPay
  ↓
GET /api/payment-callback?token=...&status=success
  → verifySignature()
  → completeCardPaymentRegistration()
    → create Client + Payment (status: verified)
    → sync Google Sheets
    → send email
    → redirect /success
```

### Second Payment
```
Client on /me
  → clicks "Pay Balance"
  ↓
POST /api/clients/second-payment
  → create PendingRegistration
  → call SofizPay
  → return paymentUrl

User pays
  ↓
GET /api/payment-callback
  → completeSecondPayment()
    → create Payment (second, verified)
    → update Client.paymentStatus = "Payé 100%"
    → sync Google Sheets
    → redirect /me?payment=success
```

### Contract Generation
```
GET /api/generatepdf?name=...&phone=...&offer=...
  → read template
  → prepare data
  → 3-pass replacement
  → return DOCX buffer
```

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev                  # Local server
npm run build                # Production build
npm start                    # Run production

# Database
npx prisma studio            # Visual UI
npx prisma db push           # Push changes
npx prisma migrate dev       # New migration

# Tools
node scripts/create-admin.js           # New admin
node scripts/clean-database.ts         # Clean
node scripts/verify-workflow.ts        # Test
```

---

## 📚 Additional Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://next-auth.js.org
- **SofizPay API:** (internal docs)

---

## ⚠️ Important Notes

1. **Don't forget:** Update `NEXTAUTH_URL` for production
2. **Keep safe:** `credentials/drive-service.json` file secure
3. **Test:** Complete payment flow in staging
4. **Backup:** Database regularly
5. **Review:** `.env.local` before deployment

---

**Ready for Development:** ✅ Yes  
**Documentation:** ✅ Complete  
**Support:** oguenfoude@gmail.com
