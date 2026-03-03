# Hop-In 🚌 — Student Transport Management Platform

A full-stack web application connecting **parents**, **drivers**, and **administrators** through real-time student transportation tracking, QR-based attendance, and geo-fence alerts.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Functional Requirements](#-functional-requirements)
3. [Tech Stack](#-tech-stack)
4. [Firebase Setup](#-firebase-setup)
5. [Environment Variables](#-environment-variables)
6. [Running the Project](#-running-the-project)
7. [Demo Credentials](#-demo-credentials)
8. [Step-by-Step Testing Guide](#-step-by-step-testing-guide)
9. [Project Structure](#-project-structure)

---

## 🚀 Project Overview

Hop-In is a student transportation management platform designed for schools. It provides:
- **Parents** — real-time van tracking, QR attendance alerts, emergency alerts, booking management
- **Drivers** — trip management, QR-based child attendance scanning, live route updates
- **Admins** — driver verification (Aadhaar-based), system stats, emergency alert monitoring

---

## ✅ Functional Requirements

| # | Requirement | Status |
|---|---|---|
| 1 | User registration (Parent, Driver, Admin) with role-based access | ✅ |
| 2 | Email/Password authentication via Firebase | ✅ |
| 3 | Driver Aadhaar verification with admin approval workflow | ✅ |
| 4 | Search vans by school ID with vacancy & rating display | ✅ |
| 5 | Van detail page with route map, driver profile, reviews | ✅ |
| 6 | Contract-based booking (1–12 months) with cost calculator | ✅ |
| 7 | Child QR code generation for attendance | ✅ |
| 8 | Driver QR scanner to mark child boarding/drop-off | ✅ |
| 9 | Real-time GPS tracking with Leaflet + OpenStreetMap | ✅ |
| 10 | Geo-fence proximity alerts (1km and 500m thresholds) | ✅ |
| 11 | Push notification support via Firebase Cloud Messaging | ✅ |
| 12 | Emergency alert system (parent/driver → admin) | ✅ |
| 13 | Parent attendance history with date filter + CSV export | ✅ |
| 14 | Star rating and review system for drivers | ✅ |
| 15 | Admin dashboard with system-wide stats | ✅ |
| 16 | Admin manages emergency alerts | ✅ |
| 17 | Performance score tracking for drivers | ✅ |
| 18 | Haversine distance calculation for geo-fencing | ✅ |
| 19 | Session trip logs for drivers | ✅ |

### Non-Functional Requirements
- **Security** — Aadhaar numbers encrypted before storage
- **Performance** — Vite build, Firestore persistent cache, lazy loading
- **Responsive** — Mobile-first design, works on all screen sizes
- **Accessibility** — Semantic HTML, keyboard navigation
- **Reliability** — 7/7 unit tests pass, full production build verified

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, React Hook Form |
| Styling | Vanilla CSS (custom design system, white + sky blue theme) |
| Backend | Firebase (Auth, Firestore, Cloud Messaging, Storage) |
| Maps | Leaflet.js + OpenStreetMap (via React-Leaflet) |
| QR | qrcode.react (generation), react-qr-scanner (scanning) |
| Build | Vite 6 |
| Testing | Vitest |
| Utilities | date-fns, dayjs, yup, @hookform/resolvers |

---

## 🔥 Firebase Setup

### Step 1 — Create a Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → Enter name `hop-in` → Continue
3. Click **"Create project"**

### Step 2 — Enable Authentication
1. Left sidebar → **Build → Authentication**
2. Click **"Get started"**
3. Click **Email/Password** → Toggle **Enable** → **Save**

### Step 3 — Enable Firestore
1. Left sidebar → **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** → Choose region (e.g., `asia-south1`) → **Done**

### Step 4 — Set Firestore Security Rules
Go to **Firestore → Rules** tab and paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
Click **Publish**.

> ⚠️ These rules are for development only. Apply proper security rules before production.

### Step 5 — Create Required Firestore Indexes
Go to **Firestore → Indexes** and create this composite index:

| Collection | Field 1 | Field 2 |
|---|---|---|
| `attendance` | `vanId` (Ascending) | `date` (Descending) |

### Step 6 — Get Web App Config
1. Project Settings (gear icon) → General → Your apps → Click **"</>"** (Web)
2. Register app → Copy the `firebaseConfig` values into `.env`

### Step 7 — Enable Cloud Messaging (Optional)
1. Project Settings → **Cloud Messaging** tab
2. Under **Web Push certificates** → Click **"Generate key pair"**
3. Copy the key for `VITE_FIREBASE_VAPID_KEY`

---

## 🔐 Environment Variables

Create a `.env` file in the `hope-in-app/` directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key_optional
VITE_AADHAAR_ENCRYPTION_SECRET=any-random-32-char-secret-string
```

Refer to `.env.example` for the template.

---

## ▶️ Running the Project

### Prerequisites
- Node.js v18+ installed
- npm v9+ installed

### Installation & Start
```bash
# Navigate to the app directory
cd hope-in-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Run Tests
```bash
npm test
```
Expected: **7 tests passing** (haversine + business rules)

### Production Build
```bash
npm run build
```

---

## 🧪 Demo Credentials

> Create these accounts by registering in the app in the order listed below.

### 👤 Admin Account
| Field | Value |
|---|---|
| Registration URL | `http://localhost:5173/register-admin` |
| Name | `Admin Ravi` |
| Email | `admin@hopin.demo` |
| Password | `Admin@1234` |
| Secret Code | `HOPIN-ADMIN-2024` |

### 🚐 Driver Account
| Field | Value |
|---|---|
| Registration URL | `http://localhost:5173/register-driver` |
| Name | `Suresh Kumar` |
| Phone | `9876543210` |
| Email | `driver@hopin.demo` |
| Password | `Driver@1234` |
| Aadhaar Number | `234567891234` |
| Aadhaar Doc URL | `https://example.com/aadhaar.jpg` |
| Years of Experience | `5` |
| School ID | `DPS-Bangalore` |
| Pickup Time | `07:30` |
| Drop Time | `13:30` |
| Van Capacity | `12` |
| Monthly Price (₹) | `2500` |

### 👩‍👧 Parent Account
| Field | Value |
|---|---|
| Registration URL | `http://localhost:5173/register-parent` |
| Name | `Priya Sharma` |
| Phone | `9123456780` |
| Email | `parent@hopin.demo` |
| Password | `Parent@1234` |
| Child Name | `Anjali Sharma` |
| Child Age | `10` |
| School ID | `DPS-Bangalore` |
| Street | `MG Road, Indiranagar` |
| Latitude | `12.9716` |
| Longitude | `77.5946` |

---

## 🧭 Step-by-Step Testing Guide

Follow this **exact order** to test all features:

### 1️⃣ Register Admin
→ `http://localhost:5173/register-admin` → Fill form → Enter secret `HOPIN-ADMIN-2024` → Create Account

### 2️⃣ Register Driver
→ `http://localhost:5173/register-driver` → Fill all fields → Create Driver Account
→ Status shows **"Pending Verification"**

### 3️⃣ Admin Approves Driver
→ Login as Admin (`admin@hopin.demo`) → Admin Dashboard → Click **Approve** on the pending driver

### 4️⃣ Register Parent
→ `http://localhost:5173/register-parent` → Fill form + add child → Create Account
→ Auto-redirected to Parent Dashboard

### 5️⃣ Parent Books a Van
→ Click **🔍 Find Vans** → Search `DPS-Bangalore` → View Details → Book This Van
→ Select child + contract duration → **Pay & Confirm**

### 6️⃣ Driver Runs a Trip
→ Login as Driver (`driver@hopin.demo`) → Driver Dashboard → **Start Trip**
→ QR Scanner activates → Scan child's QR (from Parent Dashboard on another device or tab)
→ **Mark School Arrival** → **End Trip**

### 7️⃣ Parent Views Attendance History
→ Login as Parent → Dashboard → Attendance History section → Set date range → **Export CSV**

### 8️⃣ Emergency Alert
→ Parent Dashboard → Safety & Alerts → **🚨 Emergency Alert** → Send message
→ Login as Admin → Alert appears with blinking **LIVE** badge → Mark Resolved

### 9️⃣ Submit a Review
→ Login as Parent → Find Vans → View Details → Submit Your Review → Rate + comment → **Submit**

### 🔟 Admin Dashboard Stats
→ Login as Admin → View total verified drivers, active parents, system alerts, performance dashboard

---

## 📁 Project Structure

```
hope-in-app/
├── public/
├── src/
│   ├── app/
│   │   └── App.jsx              # Route configuration
│   ├── components/
│   │   ├── common/              # ProtectedRoute, RoleRoute, RoleRedirect, Loader
│   │   └── layout/
│   │       └── AppShell.jsx     # Nav shell (Dashboard + Find Vans tabs)
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state & role management
│   ├── hooks/                   # useAsyncAction, useGeolocation, etc.
│   ├── lib/
│   │   └── firebase.js          # Firebase initialization
│   ├── pages/
│   │   ├── admin/               # AdminDashboardPage
│   │   ├── auth/                # Login, RegisterParent/Driver/Admin
│   │   ├── booking/             # BookingPage
│   │   ├── driver/              # DriverDashboardPage
│   │   ├── landing/             # LandingPage (public)
│   │   ├── parent/              # ParentDashboardPage
│   │   └── search/              # SearchVansPage, VanDetailPage
│   ├── services/
│   │   ├── auth/                # login.js, register.js
│   │   └── db/                  # users.js, vans.js, bookings.js, attendance.js, etc.
│   ├── styles/
│   │   └── global.css           # Design system (white + sky blue)
│   └── utils/                   # haversine.js, security.js, children.js
├── tests/
│   ├── haversine.test.js        # Geo-distance unit tests (3 tests)
│   └── businessRules.test.js    # Booking logic unit tests (4 tests)
├── .env                         # Your Firebase credentials (not committed to git)
├── .env.example                 # Credentials template
└── vite.config.js
```

---

## 🔒 Security Notes

- Aadhaar numbers are **AES encrypted** before Firestore storage
- Admin registration gated by a **secret passphrase**
- Firebase Auth handles all session management and token validation
- Role-based route guards (`RoleRoute`) prevent unauthorized page access

---

## 📄 License

Built for academic/demonstration purposes. Apply proper Firebase Security Rules and secret management before any production deployment.
