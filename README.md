# 🎓 Apex Campus Lost and Found Management System (UniFind)

A modern, full-stack, enterprise-grade **Campus Lost and Found Management System** built specifically for university campuses. Designed to connect students, security personnel, and university administrators in a centralized, secure ecosystem for reporting, matching, claiming, and returning lost property.

---

## 🌟 Key Features

### 1. 👥 Multi-Role Campus Access
- **Students / Users**: Report lost & found items, view automated match notifications, submit ownership claims with private verification evidence, view printable **Official Campus Collection Passes**, and mark items as recovered.
- **Security / Lost-and-Found Officers**: Access the **Officer Duty Console**, look up vouchers using collection references or student IDs, perform physical verification against campus custody records, sign digital handover receipts, and maintain an immutable return log.
- **University Administrators**: System KPI analytics, interactive category/location incident charts, review claims queue, manage campus categories and building locations, manage user directory and account statuses, inspect security audit trails, and export CSV/PDF reports.
- **1-Click Demo Role Switcher**: Quick-switch instantly between **Sarah (Student)**, **Alex (Finder)**, **Raymond (Officer)**, and **Dr. Sterling (Admin)** directly from the top navigation bar or login screen.

### 2. 🧠 Smart AI-Inspired Possible-Match Engine
- Automatically scans all campus found property whenever a lost item is reported (and vice-versa).
- **Weighted Multi-Factor Scoring Algorithm**:
  - **Category Alignment**: 30%
  - **Campus Location Proximity**: 20%
  - **Color Matching**: 15%
  - **Date / Time Window**: 15%
  - **Title & Description Token Similarity**: 20%
- Automatically alerts students when a match score exceeds $50\%$, detailing matching indicators.

### 3. 🛡️ Privacy & Sensitive Item Protection
- High-value items (laptops, phones, student cards, wallets) have private markings, internal contents, and serial numbers masked from public view.
- Private details are only accessible to authorized verification officers and administrators during claim adjudication.

### 4. 🎫 Official Collection Pass & Handover Ledger
- Approved claims generate a cryptographic-style collection reference (e.g. `CLAIM-2026-00452`).
- Students receive a printable **Official Collection Voucher** complete with simulated verification barcode, authorization stamp, and pickup desk instructions.
- Officers record digital sign-offs with ID checklist verification, generating handover ledger entries (e.g. `HAND-2026-0001`).

---

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, Canvas Confetti
- **Backend**: Node.js, Express.js, TypeScript (`tsx`), JWT Authentication, Multer file uploads
- **Database Layer**: Pure WASM SQLite (`sql.js`) with synchronous query wrapper and automated disk persistence to `campus_lost_found.db`
- **Security**: Role-Based Access Control (RBAC), bcrypt password hashing, immutable audit logging

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Database Seeding
Populate the database with realistic sample categories, campus locations, user accounts, lost/found items, claims, and handovers:
```bash
npm run seed
```

### 3. Run Development Servers (Backend + Frontend)
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Pre-Configured Demo Accounts

| Role | Name | Email / Identifier | Password | Key Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Sarah Chen | `sarah.chen@campus.edu` | `student123` | Reported missing HP Pavilion laptop |
| **Finder** | Alex Kim | `alex.kim@campus.edu` | `student123` | Found HP laptop in Science Complex |
| **Security Officer** | Raymond Vance | `security@campus.edu` | `officer123` | Authorizes physical handovers at Room G-04 |
| **Administrator** | Dr. Eleanor Sterling | `admin@campus.edu` | `admin123` | Dean of Students & System Oversight |

> **Pro Tip**: Use the **"Demo Mode"** popover in the top navbar to switch roles in a single click without logging out!

---

## 📊 Database Schema Summary

The relational SQLite database conforms strictly to institutional requirements:
- `users`: Account profiles, role enums, student/staff IDs, and departments.
- `categories`: Property categories (Electronics, Wallets, Campus IDs, etc.).
- `locations`: University buildings, zones, and lecture halls.
- `lost_items`: Missing property reports with timestamps, coordinates, and contact details.
- `found_items`: Discovered property with custody locker assignments and privacy flags.
- `matches`: Multi-factor similarity matches with weighted scoring.
- `claims`: Ownership claims with private verification evidence and status lifecycles.
- `handovers`: Physical handover sign-off records with officer timestamps and student ID checklist.
- `notifications`: User notification dispatch feed with unread badges.
- `audit_logs`: Immutable security event ledger.

---

## 📜 Campus Policy & Terms
Property deposited with University Security is retained for up to 90 days in accordance with the Campus Student Code and Property Custody Guidelines.
