# 🏦 CIB Payment Flow - Complete Documentation

## Overview
This document explains exactly how CIB (Carte Interbancaire) payments work in the NCH Community system, what gets saved, and what admins and clients see.

---

## 🔄 Payment Flow Diagram

```
CLIENT                    SYSTEM                    SOFIZPAY              DATABASE
  |                         |                          |                      |
  |-- Select CIB payment -->|                          |                      |
  |                         |                          |                      |
  |                    Create Session                  |                      |
  |                         |-- Save to ----------->   |                  PendingRegistration
  |                         |   pending_registrations  |                      |
  |                         |                          |                      |
  |                    Generate Payment URL            |                      |
  |                         |-- Call SofizPay API ---->|                      |
  |                         |                          |                      |
  |<-- Redirect to SofizPay |                          |                      |
  |                         |                          |                      |
  |-- Enter card details -->|                          |                      |
  |                         |                      Process                    |
  |                         |                      Payment                    |
  |                         |                          |                      |
  |                         |<-- Callback with --------|                      |
  |                         |    payment result        |                      |
  |                         |                          |                      |
  |                    Verify Signature                |                      |
  |                         |                          |                      |
  |                    Save Payment Record             |                      |
  |                         |-- Create Payment ------->|                  Payment
  |                         |    (status: verified)    |                      |
  |                         |                          |                      |
  |                    Update Google Sheets            |                      |
  |                         |-- Sync data ------------>|              Google Sheets
  |                         |                          |                      |
  |<-- Redirect to success -|                          |                      |
  |    /me or /success      |                          |                      |
```

---

## 📊 What Gets Saved in Database

### 1. **PendingRegistration** (Temporary - deleted after completion)
Created when payment is initiated, deleted after payment completes.

```typescript
{
  sessionToken: "pay2_1702234567890_abc123...",
  registrationData: {
    clientId: "client_id_here",         // If second payment
    isSecondPayment: true,              // true for second payment, false for initial
    email: "client@example.com"
  },
  paymentDetails: {
    amount: 10500,                      // 50% of offer price
    paymentMethod: "cib",
    paymentType: "second"               // or "initial"
  },
  status: "pending",
  createdAt: "2025-12-10T10:30:00Z",
  expiresAt: "2025-12-11T10:30:00Z"    // 24 hours expiry
}
```

### 2. **Payment** (Permanent record)
Created when payment is successfully completed.

```typescript
{
  id: "payment_id_123",
  clientId: "client_id_here",
  paymentType: "initial",              // or "second"
  paymentMethod: "cib",
  amount: 10500.0,
  status: "verified",                  // ✅ CIB payments are immediately verified
  transactionId: "TXN123456789",       // From SofizPay
  sofizpayResponse: {                  // Full response from SofizPay
    status: "success",
    transactionId: "TXN123456789",
    amount: "10500",
    signature: "signature_hash...",
    message: "Payment successful",
    timestamp: "2025-12-10T10:35:00Z"
  },
  receiptUrl: null,                    // Only for BaridiMob
  baridiMobInfo: null,                 // Only for BaridiMob
  verifiedBy: null,                    // Auto-verified by SofizPay
  verifiedAt: null,
  createdAt: "2025-12-10T10:35:00Z",
  updatedAt: "2025-12-10T10:35:00Z"
}
```

### 3. **Google Sheets** (Synced automatically)
Updates the client's row with payment information.

**For First Payment:**
```
| Premier Paiement (50%) | Date 1er Paiement | Méthode 1er Paiement | Statut 1er Paiement |
|------------------------|-------------------|----------------------|---------------------|
| 10500 DZD             | 10/12/2025        | Carte CIB            | Vérifié             |
```

**For Second Payment:**
```
| Deuxième Paiement (50%) | Date 2ème Paiement | Méthode 2ème Paiement | Statut 2ème Paiement | Statut Paiement Global |
|-------------------------|--------------------|-----------------------|----------------------|------------------------|
| 10500 DZD              | 10/12/2025         | Carte CIB             | Vérifié              | Payé 100%              |
```

---

## 👁️ What Client Sees

### **On /me Dashboard**

#### Payment Summary Card:
```
┌─────────────────────────────────────────┐
│  💳 Récapitulatif des paiements        │
├─────────────────────────────────────────┤
│  Montant total de l'offre: 21,000 DZD  │
│  Montant payé:            10,500 DZD   │
│  Solde restant:           10,500 DZD   │
│                                         │
│  Statut: [Payé 50%]                    │
└─────────────────────────────────────────┘
```

#### Payment History:
```
┌─────────────────────────────────────────┐
│  Historique des paiements               │
├─────────────────────────────────────────┤
│  [✓] Paiement #1 (Premier paiement 50%)│
│      Carte CIB • 10 décembre 2025       │
│      10,500 DZD                         │
│      [Vérifié] ✅                       │
├─────────────────────────────────────────┤
│  [✓] Paiement #2 (Deuxième paiement 50%)│
│      Carte CIB • 10 décembre 2025       │
│      10,500 DZD                         │
│      [Vérifié] ✅                       │
└─────────────────────────────────────────┘
```

**Key Points:**
- ✅ Status shows "Vérifié" immediately after successful payment
- 🟢 Green badge and checkmark icon
- 💳 Shows "Carte CIB" as payment method
- 📅 Shows payment date
- 💰 Shows exact amount paid

---

## 👨‍💼 What Admin Sees

### **On Admin Dashboard (/admin)**

#### Stats Cards:
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Payé 100%    │ Payé 50%     │ Non payé     │
│ 150 clients  │ 45 clients   │ 78 clients   │ 27 clients   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### **On Client Details Page (/admin/clients/[id])**

#### Payment Status Dropdown:
```
┌─────────────────────────────┐
│ Statut de paiement:         │
│ [Payé 100% ▼]              │
│  Options:                   │
│  - Non payé                 │
│  - Payé 50%                 │
│  - Payé complètement        │
└─────────────────────────────┘
```

#### Payment History Section:
```
┌─────────────────────────────────────────────────────────┐
│  Historique des paiements                               │
├─────────────────────────────────────────────────────────┤
│  [💳] CIB                                               │
│       10/12/2025                                        │
│       10,500 DZD          [Vérifié]                    │
├─────────────────────────────────────────────────────────┤
│  [💳] CIB                                               │
│       10/12/2025                                        │
│       10,500 DZD          [Vérifié]                    │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Payments show "Vérifié" status immediately
- 🟢 Green badge indicates successful verification
- 💳 CIB icon and label
- 📊 Admin can see full payment history
- 🔄 Can filter clients by payment status

---

## 🔐 Security & Verification

### **Automatic Verification:**
CIB payments are **automatically verified** because:

1. ✅ **SofizPay Signature Verification**
   ```typescript
   const isValid = sdk.verifySignature({
     message: message || '',
     signature_url_safe: signature || ''
   })
   ```

2. ✅ **Transaction ID from Bank**
   - SofizPay provides bank transaction ID
   - Stored in `transactionId` field

3. ✅ **No Manual Review Needed**
   - Status set to `"verified"` immediately
   - No admin verification button needed
   - Client can proceed immediately

### **Difference from BaridiMob:**

| Feature            | CIB Payment              | BaridiMob Payment         |
|--------------------|--------------------------|---------------------------|
| Status on creation | `verified` ✅           | `pending` ⏳              |
| Receipt needed     | No                       | Yes (PDF/image)           |
| Admin action       | None required            | Must verify manually      |
| Processing time    | Instant                  | 24-48 hours               |
| Verification       | Automatic (SofizPay)     | Manual (admin reviews)    |

---

## 💻 Code Flow Summary

### **Step 1: Initiate Payment**
```typescript
// File: app/api/process-payment/route.ts

// Create session
const sessionToken = crypto.randomBytes(32).toString('hex')

// Store pending registration
await prisma.pendingRegistration.create({
  data: {
    sessionToken,
    registrationData: { clientId, isSecondPayment },
    paymentDetails: { amount, paymentMethod: 'cib' },
    status: 'pending'
  }
})

// Call SofizPay API
const result = await makeCIBTransaction({
  account: SOFIZPAY_API_KEY,
  amount: amount,
  full_name: `${firstName} ${lastName}`,
  phone: phone,
  email: email,
  return_url: `${baseUrl}/api/payment-callback?token=${sessionToken}`,
  memo: "Payment description",
  redirect: "yes"
})

// Return payment URL to client
return { success: true, paymentUrl: result.data.url }
```

### **Step 2: Process Callback**
```typescript
// File: app/api/payment-callback/route.ts

// Verify signature from SofizPay
const isValid = sdk.verifySignature({ message, signature })

if (status === 'success') {
  if (isSecondPayment) {
    // Create second payment record
    await completeSecondPayment(token, transactionId, sofizpayResponse)
    // Redirect to /me?payment=success&type=second
  } else {
    // Create client account + first payment record
    await completeCardPaymentRegistration(token, transactionId, sofizpayResponse)
    // Redirect to /success?email=...&type=partial&remaining=10500
  }
}
```

### **Step 3: Save Payment**
```typescript
// File: lib/services/payment.service.ts

// Add payment record to client
await prisma.payment.create({
  data: {
    clientId: clientId,
    paymentType: 'second',
    paymentMethod: 'cib',
    amount: amount,
    status: 'verified',        // ✅ Immediately verified
    transactionId: transactionId,
    sofizpayResponse: sofizpayResponse
  }
})

// Update Google Sheets
await updateClientInSheet(client.email, {
  paymentStatus: 'Vérifié',
  paymentType: '2ème paiement 50%',
  paymentMethod: 'cib'
})
```

---

## 📝 Summary

### **CIB Payment Characteristics:**

✅ **Instant Verification**
- No waiting period
- No admin action needed
- Status = "verified" immediately

💳 **Full Payment Trail**
- Transaction ID from bank
- SofizPay response stored
- Google Sheets synced

📊 **What Client Sees:**
- Green "Vérifié" badge
- Payment amount and date
- Can proceed immediately

👨‍💼 **What Admin Sees:**
- "Vérifié" status in payment history
- Transaction details
- No verification button (already verified)

🔄 **Database Records:**
1. Payment record (status: verified)
2. Google Sheets updated
3. PendingRegistration deleted (cleanup)

---

## 🆚 Comparison: CIB vs BaridiMob

### **CIB (Card Payment):**
- ✅ Automatic verification via SofizPay
- ⚡ Instant processing
- 💳 Bank transaction ID provided
- 🔒 Secure signature verification
- 📱 Online payment only

### **BaridiMob (CCP Transfer):**
- ⏳ Manual verification required
- 🕐 24-48 hours processing
- 📄 Receipt upload required
- 👨‍💼 Admin must verify
- 🏦 Bank transfer method

---

## ✅ Testing Checklist

### **CIB First Payment (50%):**
- [ ] Navigate to registration page
- [ ] Select CIB payment
- [ ] Complete SofizPay checkout
- [ ] Verify redirected to /success
- [ ] Check email received
- [ ] Login and see payment on /me
- [ ] Verify Google Sheets updated
- [ ] Check payment status = "Vérifié"

### **CIB Second Payment (50%):**
- [ ] Login to /me dashboard
- [ ] See "Payer le solde" button
- [ ] Click and select CIB
- [ ] Complete SofizPay checkout
- [ ] Verify redirected to /me?payment=success
- [ ] Check both payments show "Vérifié"
- [ ] Verify Google Sheets shows 100% paid
- [ ] Check "Statut Paiement Global" = "Payé 100%"

### **Admin Verification:**
- [ ] Login to admin panel
- [ ] View client details
- [ ] See both payments in history
- [ ] Verify no verification button (already verified)
- [ ] Check payment status filter works
- [ ] Verify stats dashboard accurate

---

## 🐛 Troubleshooting

### **Payment not appearing after success:**
- Check PendingRegistration was deleted
- Verify Payment record created with status='verified'
- Check Google Sheets synced (look for error logs)

### **Status shows 'pending' instead of 'verified':**
- Issue in payment-callback route
- Check completeSecondPayment or completeCardPaymentRegistration
- Verify status set to 'verified' not 'pending'

### **Client can't see payment:**
- Check client ID matches in Payment record
- Verify /api/clients/profile includes payments
- Check Payment.clientId relationship

---

**Last Updated:** December 10, 2025
**Status:** ✅ Production Ready
