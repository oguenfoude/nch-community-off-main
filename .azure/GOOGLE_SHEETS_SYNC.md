# 🔄 Google Sheets Synchronization System

## 📋 Overview

This system provides **real-time synchronization** between MongoDB and Google Sheets with complete **change history tracking**. Every admin update is automatically synced to Google Sheets, creating a reliable backup and transparent audit trail.

---

## 🎯 Key Features

### ✅ **Real-Time Sync**
- Updates Google Sheets immediately after any admin action
- Non-blocking: API requests never fail if sheets sync fails
- Complete data integrity with fresh database reads

### 📊 **Dual Sheet Architecture**
1. **Main Sheet** (`Clients NCH Community`) - Current state of all clients (26 columns)
2. **History Sheet** (`Historique Modifications`) - Complete audit trail of all changes (9 columns)

### 🔐 **Change History Tracking**
Every update is logged with:
- Date/Time of change
- Client email and full name
- Type of change (payment verification, status update, etc.)
- Field modified
- Old value → New value
- Admin who made the change
- Additional details

---

## 📊 Sheet Structures

### Main Sheet: `Clients NCH Community` (26 Columns)

#### **Client Info (9 columns)**
1. Date Inscription
2. Nom
3. Prénom
4. Email
5. Téléphone
6. Wilaya
7. Diplôme
8. Offre
9. Pays Sélectionnés

#### **First Payment (5 columns)**
10. Premier Paiement (50%)
11. Date 1er Paiement
12. Méthode 1er Paiement
13. Statut 1er Paiement
14. Reçu 1er Paiement (clickable link)

#### **Second Payment (5 columns)**
15. Deuxième Paiement (50%)
16. Date 2ème Paiement
17. Méthode 2ème Paiement
18. Statut 2ème Paiement
19. Reçu 2ème Paiement (clickable link)

#### **Status & Documents (7 columns)**
20. Statut Paiement Global (Non payé / Payé 50% / Payé 100% / Paiement Rejeté)
21. Carte Identité (clickable link)
22. Diplôme (doc) (clickable link)
23. Certificat Travail (clickable link)
24. Photo (clickable link)
25. Mot de Passe
26. Dernière Mise à Jour

---

### History Sheet: `Historique Modifications` (9 Columns)

1. **Date/Heure** - Timestamp in Algeria timezone
2. **Email Client** - Client identifier
3. **Nom Complet** - Client full name
4. **Type de Changement** - Category:
   - `payment_verification` - Payment accept/reject
   - `status_update` - Client status change
   - `client_update` - Client info modification
   - `document_upload` - New document uploaded
   - `payment_status_change` - Manual payment status override
5. **Champ Modifié** - Which field(s) changed
6. **Ancienne Valeur** - Previous value (if applicable)
7. **Nouvelle Valeur** - New value
8. **Admin ID** - Who made the change
9. **Détails** - Additional context

---

## 🔧 Implementation Details

### Core Functions (`lib/services/googleSheets.sync.ts`)

#### **1. syncClientToGoogleSheets(clientId, changeInfo?)**
Main sync function - fetches fresh data and updates main sheet
```typescript
await syncClientToGoogleSheets(clientId, {
  changeType: 'payment_verification',
  fieldChanged: 'Paiement 1er',
  oldValue: 'pending',
  newValue: 'verified',
  adminId: admin.id,
  details: 'Paiement accepté par admin (14000 DZD)'
})
```

#### **2. syncPaymentVerification(clientId, paymentId, action, adminId, reason?)**
Specialized function for payment accept/reject
```typescript
await syncPaymentVerification(clientId, paymentId, 'accept', admin.id)
```

#### **3. syncClientUpdate(clientId, updatedFields[], adminId)**
Tracks client information updates
```typescript
await syncClientUpdate(clientId, ['firstName', 'phone'], admin.id)
```

#### **4. syncStatusChange(clientId, oldStatus, newStatus, adminId)**
Logs status transitions
```typescript
await syncStatusChange(clientId, 'pending', 'active', admin.id)
```

#### **5. syncDocumentUpload(clientEmail, documentType, documentUrl)**
Records new document uploads
```typescript
await syncDocumentUpload(client.email, 'diploma', cloudinaryUrl)
```

#### **6. logChangeToHistory(entry)**
Low-level function to write to history sheet (called automatically)

---

## 🚀 Integrated Endpoints

### ✅ **Endpoint 1: Payment Verification**
**File:** `app/api/clients/[id]/payment/[paymentId]/verify/route.ts`

**Syncs When:**
- Admin accepts or rejects a payment
- Updates payment status to `verified` or `rejected`

**What Gets Synced:**
- Main sheet: Payment status, verification timestamp
- History: Payment verification details with accept/reject reason

```typescript
// After payment update
await syncPaymentVerification(id, paymentId, action, admin.id, reason)
```

---

### ✅ **Endpoint 2: Client Update (PUT)**
**File:** `app/api/clients/[id]/route.ts` (PUT method)

**Syncs When:**
- Admin updates client information (name, phone, wilaya, etc.)

**What Gets Synced:**
- Main sheet: All updated client fields
- History: List of modified fields

```typescript
// After client update
const updatedFields = Object.keys(body)
await syncClientUpdate(client.id, updatedFields, admin.id)
```

---

### ✅ **Endpoint 3: Client Update (PATCH)**
**File:** `app/api/clients/[id]/route.ts` (PATCH method)

**Syncs When:**
- Admin makes partial updates to client data

**What Gets Synced:**
- Main sheet: Modified fields only
- History: Partial update log

```typescript
// After partial update
const updatedFields = Object.keys(body)
await syncClientUpdate(client.id, updatedFields, admin.id)
```

---

### ✅ **Endpoint 4: Payment Status Change**
**File:** `app/api/clients/[id]/payment-status/route.ts`

**Syncs When:**
- Admin manually changes payment status
- Creates/updates Payment records

**What Gets Synced:**
- Main sheet: Global payment status
- History: Manual payment status override

```typescript
// After status change
await syncStatusChange(id, client.status, paymentStatus, admin.id)
```

---

### ✅ **Endpoint 5: Document Upload**
**File:** `app/api/upload/route.ts`

**Syncs When:**
- Client or admin uploads a new document
- Document is successfully uploaded to Cloudinary

**What Gets Synced:**
- Main sheet: Document URL (clickable HYPERLINK)
- History: Document upload notification

```typescript
// After successful upload
if (clientId && documentType) {
  await syncDocumentUpload(client.email, documentType, secureUrl)
}
```

---

## 🎯 Sync Behavior

### **When Sync Happens**
✅ **After successful database update** - Ensures DB is source of truth
✅ **Before API response** - But doesn't block the response
✅ **With fresh data fetch** - Always syncs current state, not cached data

### **Non-Blocking Pattern**
```typescript
// ✅ Good - Won't fail API request if sheets fail
try {
  await syncClientToGoogleSheets(clientId, changeInfo)
  console.log('✅ Synced to Google Sheets')
} catch (error) {
  console.error('⚠️ Sheets sync failed (non-blocking):', error.message)
}
// API response still returns successfully
```

### **Error Handling**
- Sheets sync failures are logged but don't break API requests
- Missing credentials → Skip sync silently
- Network errors → Log warning, continue
- Invalid data → Log error, continue

---

## 🔍 How to Read Sync Data

### **In Main Sheet**
```
Email: test@example.com
Nom: Dupont
Prénom: Jean
Status: Active
Statut Paiement Global: Payé 100%
Dernière Mise à Jour: 10/12/2025 14:35:22
```

### **In History Sheet**
```
Date/Heure: 10/12/2025 14:35:22
Email Client: test@example.com
Nom Complet: Jean Dupont
Type de Changement: payment_verification
Champ Modifié: Paiement 2ème
Ancienne Valeur: pending
Nouvelle Valeur: verified
Admin ID: 6751234567890abcdef12345
Détails: Paiement accepté par admin (14000 DZD)
```

---

## 🧪 Testing the Sync System

### **Test 1: Payment Verification**
1. Go to admin panel → Client detail
2. Accept or reject a payment
3. Check main sheet → Payment status updated
4. Check history sheet → New entry logged

### **Test 2: Client Info Update**
1. Edit client details (name, phone, etc.)
2. Click "Sauvegarder"
3. Check main sheet → Client info updated
4. Check history sheet → Fields modification logged

### **Test 3: Document Upload**
1. Upload a document for a client
2. Check main sheet → Document link appears (clickable)
3. Check history sheet → Upload event logged

### **Test 4: Status Change**
1. Change client status from dropdown
2. Check main sheet → Status updated
3. Check history sheet → Status transition logged

---

## 📊 Benefits of This Architecture

### ✅ **Single Source of Truth**
- Database is authoritative
- Sheets always reflect latest DB state
- No risk of stale data

### ✅ **Complete Audit Trail**
- Every change is tracked
- Who, what, when, why - all logged
- Easy to trace issues

### ✅ **Non-Blocking & Reliable**
- API performance not affected by sheets
- Graceful degradation if sheets unavailable
- User experience never compromised

### ✅ **Easy to Maintain**
- Centralized sync logic
- Reusable helper functions
- Clear separation of concerns

### ✅ **Production Ready**
- Error handling at every level
- Detailed logging for debugging
- Service account authentication

---

## 🔐 Security & Configuration

### **Required Environment Variables**
```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKey\n-----END PRIVATE KEY-----\n"
```

### **Service Account Permissions**
- Must have **Editor** access to the spreadsheet
- Or specific permissions:
  - `sheets.spreadsheets.values.update`
  - `sheets.spreadsheets.values.append`

---

## 🚨 Troubleshooting

### **Sync Not Working?**
1. Check environment variables are set
2. Verify service account has access to spreadsheet
3. Check server logs for error messages
4. Ensure spreadsheet ID is correct

### **History Sheet Missing?**
- It's created automatically on first change
- Check sheet name: `Historique Modifications`
- Service account needs permission to create sheets

### **Old Data in Sheets?**
- Sync always fetches fresh data from DB
- If outdated, check if sync actually ran (check logs)
- Manually trigger sync by making any admin update

---

## 📈 Future Enhancements

### Potential Improvements
- [ ] Batch sync scheduler (sync all clients hourly)
- [ ] Sync status dashboard in admin panel
- [ ] Manual "Sync Now" button for admins
- [ ] Export history to CSV
- [ ] Sync conflict resolution UI

---

## 👥 Contact & Support

For issues or questions about the Google Sheets sync system:
1. Check server logs: `console.log` entries with 📊 🔄 ✅ emojis
2. Verify environment variables
3. Review this documentation
4. Test with a single client first before bulk operations

---

**Last Updated:** December 10, 2025
**Version:** 1.0.0 (Production-Ready)
**Author:** NCH Community Development Team
