# 👨‍💻 دليل المطور - للمطور الجديد

**المشروع:** NCH Community Platform  
**التقنيات:** Next.js 15.5.7, TypeScript, Prisma, NextAuth v5  
**آخر تحديث:** 11 ديسمبر 2025

---

## 🚀 البدء السريع

### التثبيت
```bash
# 1. النسخ
git clone https://github.com/oguenfoude/nch-community-off-main.git
cd nch-community-off-main

# 2. التبعيات
npm install

# 3. قاعدة البيانات
npx prisma generate
npx prisma db push

# 4. مسؤول
node scripts/create-admin.js

# 5. تشغيل
npm run dev
```

### متغيرات البيئة
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
CLOUDINARY_...="..."
SOFIZPAY_...="..."
GOOGLE_...="..."
```

---

## 📂 البنية الأساسية

```
app/
  ├── api/                     # نقاط النهاية
  │   ├── generatepdf/         # ★ توليد DOCX
  │   ├── payment-callback/    # ★ رد اتصال الدفع
  │   ├── process-payment/     # بدء الدفع
  │   └── register/            # تسجيل جديد
  ├── admin/                   # لوحة المسؤول
  ├── me/                      # لوحة العميل
  └── login/                   # تسجيل الدخول

components/
  ├── admin/                   # مكونات المسؤول
  ├── client/                  # مكونات العميل
  └── ui/                      # shadcn/ui

lib/
  ├── services/                # ★ منطق الأعمال
  │   ├── registration.service.ts
  │   ├── payment.service.ts
  │   └── googleSheets.sync.ts
  ├── validators/              # التحقق من البيانات
  ├── auth.ts                  # NextAuth
  └── prisma.ts                # قاعدة البيانات

prisma/
  └── schema.prisma            # ★ مخطط قاعدة البيانات

public/
  └── garenttie.docx           # ★ قالب العقد
```

---

## 🔑 الملفات الرئيسية

### 1. توليد DOCX
**الملف:** `app/api/generatepdf/route.ts`

```typescript
// استراتيجية 3 مراحل:

// المرحلة 1: دمج النصوص المقسمة
docContent = docContent.replace(
  /\(le<\/w:t>[\s\S]*?<w:t[^>]*>\s*montant\)/gi,
  '(le montant)'
);

// المرحلة 2: الاستبدال في <w:t>
updatedContent = docContent.replace(
  /<w:t[^>]*>([\s\S]*?)<\/w:t>/g,
  (full, text) => { /* استبدال */ }
);

// المرحلة 3: تنظيف عام
for (const [needle, value] of Object.entries(replacements)) {
  updatedContent = updatedContent.split(needle).join(value);
}
```

**النقاط الحرجة:**
- استخدام `String.fromCharCode(8217)` للفاصلة المنحنية
- دمج XML قبل الاستبدال
- معالجة الأسماء بدون تكرار

---

### 2. رد اتصال الدفع
**الملف:** `app/api/payment-callback/route.ts`

```typescript
// التحقق من التوقيع
const isValid = sdk.verifySignature({
  message: message || '',
  signature_url_safe: signature || ''
});

if (status === 'success' && isValid) {
  if (isSecondPayment) {
    // الدفعة الثانية
    await completeSecondPayment(token, transactionId, response);
    redirect('/me?payment=success&type=second');
  } else {
    // الدفعة الأولى
    await completeCardPaymentRegistration(token, transactionId, response);
    redirect('/success?...');
  }
}
```

**التدفق:**
1. استلام callback من SofizPay
2. التحقق من التوقيع الرقمي
3. إنشاء/تحديث Payment
4. مزامنة Google Sheets
5. توجيه المستخدم

---

### 3. خدمة التسجيل
**الملف:** `lib/services/registration.service.ts`

```typescript
// CIB
export async function registerWithCardPayment(data: RegistrationInput) {
  // 1. فحص البريد
  if (await emailExists(data.email)) return { success: false };
  
  // 2. توليد كلمة مرور + token
  const password = generatePassword(firstName, lastName);
  const sessionToken = generateSessionToken('card');
  
  // 3. حفظ في PendingRegistration
  const pending = await prisma.pendingRegistration.create({ ... });
  
  // 4. استدعاء SofizPay
  const result = await initiateSofizPayTransaction({ ... });
  
  // 5. إرجاع رابط الدفع
  return { success: true, paymentUrl: result.url };
}

// BaridiMob
export async function registerWithBaridiMob(data: RegistrationInput) {
  // إنشاء فوري مع status: 'pending'
  const { client, payment } = await createClientWithPayment({ ... });
  return { success: true, clientId: client.id };
}
```

---

### 4. مزامنة Google Sheets
**الملف:** `lib/services/googleSheets.sync.ts`

```typescript
// إضافة عميل
export async function appendClientToSheet(data: ClientSheetData) {
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Clients!A:Z',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[...clientData]] }
  });
}

// تحديث
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

## 🗄️ قاعدة البيانات (Prisma)

### النماذج الرئيسية

```prisma
model Client {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String    // نص صريح
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
  expiresAt         DateTime  // 24 ساعة
}
```

### الأوامر الشائعة
```bash
npx prisma generate          # توليد العميل
npx prisma db push           # دفع المخطط
npx prisma studio            # واجهة بصرية
npx prisma migrate dev       # إنشاء migration
```

---

## 🔐 المصادقة (NextAuth v5)

### التكوين
**الملف:** `auth.config.ts`

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

### الحماية
**الملف:** `middleware.ts`

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

## 🧪 الاختبار والتصحيح

### السجلات
```typescript
// تمكين السجلات
console.log('🔍 Debug:', { variable });

// فحص الجلسة
const session = await getServerSession(authConfig);
console.log('Session:', session);

// فحص قاعدة البيانات
const client = await prisma.client.findUnique({ where: { id } });
console.log('Client:', client);
```

### الأخطاء الشائعة

**1. "Session expired"**
```typescript
// الحل
const session = await getServerSession(authConfig);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**2. "Template not found"**
```typescript
// التحقق
const templatePath = path.join(process.cwd(), "public", "garenttie.docx");
if (!fs.existsSync(templatePath)) {
  console.error('Missing:', templatePath);
}
```

**3. "Google Sheets sync failed"**
```typescript
// التحقق من المفتاح
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
```

---

## 📊 التدفقات الرئيسية

### تسجيل + دفع CIB
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

### دفع ثانٍ
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

### توليد عقد
```
GET /api/generatepdf?name=...&phone=...&offer=...
  → read template
  → prepare data
  → 3-pass replacement
  → return DOCX buffer
```

---

## 🛠️ الأوامر المفيدة

```bash
# تطوير
npm run dev                  # خادم محلي
npm run build                # بناء إنتاج
npm start                    # تشغيل إنتاج

# قاعدة البيانات
npx prisma studio            # واجهة بصرية
npx prisma db push           # دفع التغييرات
npx prisma migrate dev       # migration جديد

# أدوات
node scripts/create-admin.js           # مسؤول جديد
node scripts/clean-database.ts         # تنظيف
node scripts/verify-workflow.ts        # اختبار
```

---

## 📚 موارد إضافية

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://next-auth.js.org
- **SofizPay API:** (وثائق داخلية)

---

## ⚠️ نقاط مهمة

1. **لا تنسَ:** تحديث `NEXTAUTH_URL` للإنتاج
2. **احفظ:** ملف `credentials/drive-service.json` بشكل آمن
3. **اختبر:** دورة الدفع الكاملة في staging
4. **نسخة احتياطية:** قاعدة البيانات بانتظام
5. **راجع:** `.env.local` قبل النشر

---

**جاهز للتطوير:** ✅ نعم  
**التوثيق:** ✅ كامل  
**الدعم:** oguenfoude@gmail.com
