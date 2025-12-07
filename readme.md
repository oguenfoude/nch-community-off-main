# 🏢 NCH Community - Client Registration & Admin Platform

![NCH Community](public/images/nch-logo.jpg)

**Professional client management platform for immigration services and job placement abroad.**

---

## 🌟 **Project Overview**

NCH Community is a modern web application built for managing client registrations, document processing, and administrative workflows for immigration and international job placement services. The platform features a dual-interface system with dedicated client and admin portals.

### 🎯 **Key Features**

- **🔐 Dual Authentication System** - Separate login flows for clients and administrators
- **📋 Multi-Step Registration** - Guided 4-step registration process with validation
- **📁 Document Management** - Secure document upload with Cloudinary integration
- **💰 Payment Processing** - Multiple payment methods (CIB, Edahabia, BaridiMob, SofizPay)
- **👥 Admin Dashboard** - Comprehensive client management with search, filters, and status tracking
- **🌐 Multilingual Support** - French and Arabic language support
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **📊 Progress Tracking** - Client stage management with detailed progress tracking

---

## 🛠 **Tech Stack**

### **Frontend**
- **Next.js 15.5.7** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Shadcn/ui** - Modern UI component library
- **React Hook Form** - Form validation and management
- **Sonner** - Toast notifications

### **Backend**
- **Next.js API Routes** - Server-side API endpoints
- **NextAuth.js** - Authentication and session management
- **Prisma 6.13.0** - Database ORM and type-safe queries
- **MongoDB** - NoSQL database for flexible document storage

### **Services & Integrations**
- **Cloudinary** - Image and document storage
- **Google Sheets API** - Data synchronization
- **Google Drive API** - Document management
- **SofizPay SDK** - Payment processing
- **PDF Generation** - Document creation and processing

---

## 📁 **Project Structure**

```
nch-community-off-main/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 admin/                    # Admin Dashboard
│   │   ├── 📁 clients/[id]/         # Individual client management
│   │   ├── 📄 page.tsx              # Admin dashboard main page
│   │   └── 📁 login/                # Admin authentication
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 auth/                 # NextAuth configuration
│   │   ├── 📁 clients/              # Client CRUD operations
│   │   ├── 📁 payment-callback/     # Payment processing
│   │   └── 📁 upload/               # File upload handling
│   ├── 📁 login/                    # Client authentication
│   ├── 📁 me/                       # Client dashboard
│   └── 📄 layout.tsx                # Root layout with providers
├── 📁 components/                   # Reusable React components
│   ├── 📁 admin/                    # Admin-specific components
│   ├── 📁 client/                   # Client-specific components
│   ├── 📁 ui/                       # Shared UI components
│   └── 📁 forms/                    # Form components
├── 📁 lib/                          # Utility libraries
│   ├── 📁 services/                 # External service integrations
│   ├── 📁 types/                    # TypeScript type definitions
│   ├── 📁 translations/             # Multilingual support
│   ├── 📄 auth.ts                   # NextAuth configuration
│   ├── 📄 prisma.ts                 # Database connection
│   └── 📄 utils.ts                  # Utility functions
├── 📁 prisma/                       # Database schema and migrations
├── 📁 hooks/                        # Custom React hooks
├── 📁 credentials/                  # Service account keys
└── 📁 public/                       # Static assets
```

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- MongoDB database
- Cloudinary account
- Google Cloud Platform account (for APIs)

### **Installation**

1. **Clone the repository:**
```bash
git clone https://github.com/oguenfoude/nch-community-off-main.git
cd nch-community-off-main
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Setup:**
Create `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/nch-community"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Google APIs
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Payment Configuration
NEXT_PUBLIC_SOFIZPAY_MERCHANT_ID="your-merchant-id"
NEXT_PUBLIC_SOFIZPAY_API_KEY="your-api-key"

# Google Services
GOOGLE_SHEETS_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEETS_SHEET_ID="your-google-sheet-id"
GOOGLE_DRIVE_FOLDER_ID="your-drive-folder-id"
```

4. **Database Setup:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

5. **Run Development Server:**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 🔧 **Configuration**

### **Admin Account Setup**

Create an admin account using the setup script:

```bash
node scripts/create-admin.js
```

Default admin credentials:
- **Email:** `admin@nch-community.com`
- **Password:** `admin123`

### **Payment Methods Configuration**

The platform supports multiple payment methods:

- **CIB (Credit Card)** - International card payments
- **Edahabia** - Algerian postal service card
- **BaridiMob** - Algerian mobile payment
- **SofizPay** - Alternative payment processor

### **Document Types Supported**

- **ID Document** - Passport or National ID (Required)
- **Diploma** - Educational certificates (Required) 
- **Work Certificate** - Employment verification (Optional)
- **Photo** - Professional headshot (Required)

---

## 🏗 **Database Schema**

### **Client Model**
```prisma
model Client {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  firstName         String
  lastName          String
  email             String   @unique
  phone             String
  wilaya            String
  diploma           String
  password          String
  selectedOffer     String   // basic, premium, gold
  selectedCountries String[]
  documents         Json     // Document storage
  status            String   @default("pending")
  payments          Payment[]
  stages            ClientStage[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### **Payment Model**
```prisma
model Payment {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clientId          String   @db.ObjectId
  paymentType       String   // 'initial' or 'second'
  paymentMethod     String   // 'cib', 'edahabia', 'baridimob'
  amount            Float
  status            String   @default("pending")
  receiptUrl        String?
  verifiedBy        String?
  verifiedAt        DateTime?
  createdAt         DateTime @default(now())
}
```

---

## 🎨 **UI Components**

The project uses **Shadcn/ui** components built on **Radix UI** primitives:

### **Form Components**
- Multi-step registration wizard
- File upload with drag & drop
- Dynamic form validation
- Progress indicators

### **Admin Components**
- Data tables with sorting/filtering
- Modal dialogs for detailed views
- Status management dropdowns
- Document preview system

### **Design System**
- **Primary Color:** `#042d8e` (NCH Blue)
- **Typography:** Inter font family
- **Spacing:** Tailwind spacing scale
- **Responsive:** Mobile-first breakpoints

---

## 📱 **Features Breakdown**

### **🔐 Authentication System**

**Client Authentication:**
- Registration with email verification
- Secure session management
- Password reset functionality
- Automatic redirects to client dashboard

**Admin Authentication:**
- Role-based access control (ADMIN, SUPER_ADMIN)
- Separate admin login portal
- Enhanced security measures
- Session timeout management

### **📋 Registration Process**

**Step 1: Personal Information**
- Full name and contact details
- Location (Wilaya) selection
- Educational background
- Form validation with real-time feedback

**Step 2: Document Upload**
- Secure file upload to Cloudinary
- Image and PDF support
- File size and type validation
- Preview functionality

**Step 3: Service Selection**
- Multiple service packages (Basic, Premium, Gold)
- Country destination selection
- Package comparison features
- Dynamic pricing display

**Step 4: Payment Processing**
- Multiple payment method support
- Secure payment processing
- Receipt generation and storage
- Payment status tracking

### **👥 Admin Dashboard**

**Client Management:**
- Comprehensive client list with pagination
- Advanced search and filtering
- Status management (pending, processing, approved, rejected, completed)
- Bulk operations support

**Document Review:**
- Document preview with Google Docs viewer
- PDF and image support
- Approval/rejection workflows
- Download functionality

**Payment Tracking:**
- Payment status monitoring
- Amount tracking (paid, pending, total)
- Payment method analytics
- Receipt verification

**Progress Tracking:**
- Multi-stage client progress
- Status updates and notes
- Timeline view of client journey
- Automated notifications

---

## 🌍 **Internationalization**

The platform supports **French** and **Arabic** languages:

```typescript
// Language switching
const { t, language, setLanguage } = useTranslation()

// Translations structure
export const translations = {
  fr: {
    welcome: "Bienvenue",
    steps: { /* French translations */ }
  },
  ar: {
    welcome: "مرحبا", 
    steps: { /* Arabic translations */ }
  }
}
```

### **RTL Support**
- Automatic layout direction switching
- Arabic typography optimization
- Culturally appropriate UI patterns

---

## 🔒 **Security Features**

### **Authentication Security**
- JWT token-based sessions
- CSRF protection
- Secure password hashing with bcrypt
- Rate limiting on sensitive endpoints

### **File Upload Security**
- File type validation
- Size restrictions
- Virus scanning integration ready
- Secure cloud storage with Cloudinary

### **Data Protection**
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection
- CORS configuration

### **Privacy Compliance**
- GDPR-ready data handling
- Client data export functionality
- Right to deletion support
- Audit log capabilities

---

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**
```bash
# Build analysis
npm run build

# Bundle size: 20 routes, ~175kb main page
# Performance: Optimized for Core Web Vitals
```

### **Error Tracking**
- Console logging for debugging
- Error boundary components
- API error handling
- User-friendly error messages

### **Analytics Ready**
- Google Analytics integration points
- Custom event tracking setup
- User journey analytics
- Conversion funnel monitoring

---

## 🚀 **Deployment**

### **Production Build**
```bash
# Build the application
npm run build

# Start production server
npm start
```

### **Environment Configuration**
- Production environment variables
- CDN configuration for assets
- Database connection optimization
- Security headers configuration

### **Recommended Hosting**
- **Vercel** - Optimal for Next.js applications
- **Netlify** - JAMstack deployment
- **AWS Amplify** - Full-stack hosting
- **Railway** - Simple deployment with database

---

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Code Standards**
- **ESLint** configuration for code quality
- **Prettier** for code formatting
- **TypeScript** strict mode enabled
- **Conventional Commits** for commit messages

### **Testing Guidelines**
- Component testing with React Testing Library
- API endpoint testing
- E2E testing setup ready
- User journey testing protocols

---

## 📞 **Support & Contact**

### **Technical Support**
- **Documentation:** [Project Wiki](./docs/)
- **Issues:** [GitHub Issues](https://github.com/oguenfoude/nch-community-off-main/issues)
- **Discussions:** [GitHub Discussions](https://github.com/oguenfoude/nch-community-off-main/discussions)

### **Business Contact**
- **Website:** [NCH Community](https://nch-community.com)
- **Email:** support@nch-community.com
- **Phone:** +213 XXX XXX XXX

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform  
- **Prisma Team** - For the excellent database toolkit
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Cloudinary** - For media management services

---

<div align="center">

**Built with ❤️ by the NCH Community Team**

⭐ **Star this repository if it helped you!** ⭐

</div>