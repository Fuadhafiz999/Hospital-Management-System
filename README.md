# HospiTrack — Hospital Management System

A full-stack web application for managing hospital operations including patient registration, doctor management, appointment scheduling, medical records, bed management, billing, and department administration.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [Getting Started](#getting-started)
7. [Project Structure](#project-structure)
8. [API Endpoints](#api-endpoints)
9. [Authentication & Security](#authentication--security)
10. [Roles & Permissions](#roles--permissions)
11. [Key Design Decisions](#key-design-decisions)
12. [Testing](#testing)
13. [Future Improvements](#future-improvements)

---

## Project Overview

HospiTrack is a hospital management system designed to digitize and streamline hospital workflows. It provides three separate portals — Admin, Doctor, and Patient — each with role-specific dashboards and functionality.

**Problem Statement:** Manual hospital management leads to scheduling conflicts, lost records, billing errors, and poor patient experience. This system centralizes all operations into a single platform.

**Solution:** A role-based web application where:
- **Administrators** manage the hospital (doctors, patients, departments, beds, billing)
- **Doctors** view their schedule, manage patients, write prescriptions, complete consultations
- **Patients** book appointments, view medical records, manage billing, browse doctors

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2.15 | React framework with App Router for server-side rendering and routing |
| React | 18.3.1 | UI library for building interactive user interfaces |
| TypeScript | 5.6.3 | Static type checking for JavaScript |
| Tailwind CSS | 3.4.14 | Utility-first CSS framework for styling |
| React Hook Form | 7.83.0 | Form state management and validation |
| Zod | 3.25.76 | Schema validation for forms and API inputs |
| Sonner | 2.0.7 | Toast notification library |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 14.2.15 | Server-side API endpoints (Route Handlers) |
| Prisma | 7.9.1 | ORM (Object-Relational Mapping) for database access |
| PostgreSQL | — | Relational database for data storage |
| bcryptjs | 3.0.3 | Password hashing for secure authentication |
| jsonwebtoken | 9.0.3 | JWT (JSON Web Token) generation and verification |

### Testing
| Technology | Version | Purpose |
|-----------|---------|---------|
| Playwright | 1.62.0 | End-to-end browser testing |

---

## Features

### Admin Portal
- **Dashboard** — Overview of patients, doctors, appointments, revenue, and bed occupancy with real-time statistics
- **Patient Management** — Register patients, view patient list, search by name/email, view medical history
- **Doctor Management** — Create doctor accounts with auto-generated credentials, edit room/fee, delete doctors, filter by specialty
- **Appointment Management** — View all appointments, assign doctors to pending requests, confirm/cancel appointments, book on behalf of patients
- **Department Management** — Create/edit/delete departments, assign head doctors, set icons and colors
- **Bed Management** — View beds grouped by ward, toggle status (available/occupied/maintenance), add new beds
- **Billing** — Create invoices, mark as paid (Card/Cash/Insurance), view revenue summary
- **Reports** — Aggregate statistics for patients, revenue, appointments, and bed occupancy

### Doctor Portal
- **Dashboard** — Today's appointments with status filters (All/Pending/Confirmed), quick status updates
- **Appointments** — Full appointment list with confirm/complete/cancel actions
- **My Patients** — List of patients who have appointments with this doctor
- **Medical Records** — View past consultation records with diagnosis and prescriptions
- **Prescriptions** — Aggregated list of all prescribed medications from completed consultations
- **Schedule** — Weekly calendar view of appointments organized by day

### Patient Portal
- **Dashboard** — Upcoming appointments, past appointments, medical records, and prescriptions at a glance
- **Book Appointment** — Interactive calendar date picker, time slot selector, doctor selection with details
- **My Appointments** — View and cancel pending/confirmed appointments
- **Medical Records** — Expandable records showing diagnosis, notes, vitals, and prescriptions
- **Browse Doctors** — Search doctors by name/specialty, view details (room, license, fee), book directly
- **Billing** — View invoices, pay online (Card/Cash/Insurance)
- **Profile** — Edit name and phone, view account details

### Cross-Portal Features
- **Global Search** — Search across patients, doctors, and appointments from any page
- **Notifications** — Role-aware notification bell showing recent activity (admin sees all, doctor sees own, patient sees own)
- **Responsive Design** — Mobile-friendly sidebar with hamburger menu, works on all screen sizes
- **JWT Authentication** — Secure httpOnly cookie-based sessions with role-based access control

---

## Architecture

```
Browser (React/Next.js)
    |
    |--- Client Components (pages, forms, modals)
    |       |
    |       |--- fetch("/api/...")  -->  Next.js Route Handlers (Server)
    |                                       |
    |                                       |--- Prisma ORM
    |                                       |       |
    |                                       |       |--- PostgreSQL Database
    |                                       |
    |                                       |--- bcryptjs (password hashing)
    |                                       |--- jsonwebtoken (JWT signing)
    |
    |--- Server Components (layouts)
            |
            |--- requireRole()  -->  Auth Guard (JWT verification)
```

### Rendering Strategy
- **Server Components** — Used for layouts (`admin/layout.tsx`, `doctor/layout.tsx`, `patient/layout.tsx`) to perform authentication checks before rendering any page content
- **Client Components** — All page content uses `"use client"` directive to enable interactive features (forms, state, effects)
- **Route Handlers** — API routes in `src/app/api/` handle all data operations (CRUD) with Prisma

### Data Flow
1. User interacts with a client component (e.g., clicks "Book Appointment")
2. Client component sends a `fetch()` request to an API route (e.g., `POST /api/appointments`)
3. Route handler validates the request body using `validateBody()` helper
4. Route handler executes Prisma queries against PostgreSQL
5. Response is sent back as JSON with `{ data, error }` structure
6. Client component updates its state and UI accordingly

---

## Database Schema

### Entity Relationship Diagram (Text)

```
User (1) ---< (N) Appointment (N) >--- (1) Doctor
User (1) ---< (N) Invoice
User (1) ---< (N) MedicalRecord
User (1) ---< (N) Bed (as patient)
User (1) --- (1) Doctor (as profile)

Doctor (1) ---< (N) Appointment
Doctor (1) ---< (N) MedicalRecord
Doctor (1) ---< (N) Bed (as assigned doctor)
Doctor (N) >--- (1) Department

Department (1) ---< (N) Doctor
Department (1) ---< (N) Bed

Appointment (1) --- (1) MedicalRecord (optional)
Appointment (1) --- (1) Invoice (optional)
```

### Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | Base user account (patient, doctor, or admin) | id, email, passwordHash, fullName, role, phone |
| **Doctor** | Doctor profile linked to a User | userId, specialization, licenseNumber, fee, roomNumber, departmentId |
| **Department** | Hospital department | name, description, headDoctorId, location, phone, icon, color |
| **Appointment** | Scheduled visit between patient and doctor | patientId, doctorId, date, timeSlot, status, reason |
| **MedicalRecord** | Consultation record created after appointment | appointmentId, patientId, doctorId, diagnosis, prescription (JSON), vitalsJson (JSON), notes |
| **Bed** | Hospital bed in a ward | number, ward, status, patientId, doctorId, departmentId, admittedSince |
| **Invoice** | Billing record for a patient | invoiceNumber, patientId, appointmentId, description, amount, status, method |

### Appointment Status Flow
```
PENDING  --->  CONFIRMED  --->  COMPLETED
   |              |
   v              v
CANCELLED     CANCELLED
```

### Database Indexes (for performance)
- `users`: email (unique), role
- `doctors`: userId (unique), specialization, departmentId
- `appointments`: patientId, doctorId, date, status, [doctorId + date], [patientId + status], [doctorId + date + timeSlot] (unique)
- `medical_records`: patientId, doctorId, createdAt, appointmentId (unique)
- `beds`: status, ward, departmentId
- `invoices`: patientId, status, invoiceNumber (unique)

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or remote)
- npm or yarn package manager

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd hospital-management-system

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Generate Prisma client
npx prisma generate

# 6. Seed the database (if seed script exists)
npx prisma db seed

# 7. Start the development server
npm run dev
```

### Environment Variables

```env
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/hospitrack"

# JWT secret for signing tokens (change in production)
JWT_SECRET="your-secret-key-here"
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma migrate dev` | Create and apply database migrations |
| `npx prisma db seed` | Seed the database with sample data |
| `npx prisma studio` | Open Prisma Studio (visual database browser) |
| `npx playwright test` | Run end-to-end tests |

### Default Login Credentials (if seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Doctor | doctor@hospital.com | doctor123 |
| Patient | patient@hospital.com | patient123 |

---

## Project Structure

```
hospital-management-system/
|-- prisma/
|   |-- schema.prisma          # Database schema definition
|   |-- seed.ts                # Database seed script
|
|-- src/
|   |-- app/
|   |   |-- layout.tsx         # Root layout (Toaster, global styles)
|   |   |-- page.tsx           # Landing page / redirect
|   |   |
|   |   |-- auth/
|   |   |   |-- login/page.tsx       # Login form (Zod + React Hook Form)
|   |   |   |-- register/page.tsx    # Patient registration form
|   |   |
|   |   |-- admin/
|   |   |   |-- layout.tsx           # Admin layout (auth guard + sidebar)
|   |   |   |-- AdminSidebar.tsx     # Admin navigation items
|   |   |   |-- page.tsx             # Admin dashboard
|   |   |   |-- patients/page.tsx    # Patient management
|   |   |   |-- doctors/page.tsx     # Doctor management
|   |   |   |-- appointments/page.tsx # Appointment management
|   |   |   |-- departments/page.tsx # Department management
|   |   |   |-- beds/page.tsx        # Bed management
|   |   |   |-- billing/page.tsx     # Billing & invoices
|   |   |   |-- reports/page.tsx     # Reports & analytics
|   |   |
|   |   |-- doctor/
|   |   |   |-- layout.tsx           # Doctor layout (auth guard + sidebar)
|   |   |   |-- DoctorSidebar.tsx    # Doctor navigation items
|   |   |   |-- page.tsx             # Redirect to /doctor/dashboard
|   |   |   |-- dashboard/page.tsx   # Doctor dashboard
|   |   |   |-- appointments/page.tsx # Doctor appointments
|   |   |   |-- patients/page.tsx    # Doctor's patients
|   |   |   |-- records/page.tsx     # Medical records
|   |   |   |-- prescriptions/page.tsx # Prescriptions list
|   |   |   |-- schedule/page.tsx    # Weekly schedule
|   |   |
|   |   |-- patient/
|   |   |   |-- layout.tsx           # Patient layout (auth guard + sidebar)
|   |   |   |-- PatientSidebar.tsx   # Patient navigation items
|   |   |   |-- page.tsx             # Redirect to /patient/dashboard
|   |   |   |-- dashboard/page.tsx   # Patient dashboard
|   |   |   |-- book/page.tsx        # Book appointment (calendar + time picker)
|   |   |   |-- appointments/page.tsx # My appointments
|   |   |   |-- doctors/page.tsx     # Browse doctors
|   |   |   |-- records/page.tsx     # Medical records
|   |   |   |-- billing/page.tsx     # My billing
|   |   |   |-- profile/page.tsx     # Edit profile
|   |   |
|   |   |-- api/
|   |   |   |-- auth/
|   |   |   |   |-- login/route.ts       # POST: authenticate user
|   |   |   |   |-- register/route.ts    # POST: register patient
|   |   |   |   |-- logout/route.ts      # POST: clear auth cookie
|   |   |   |   |-- me/route.ts          # GET: current user, PATCH: update profile
|   |   |   |-- appointments/route.ts    # GET/POST/PATCH: appointments CRUD
|   |   |   |-- doctors/route.ts         # GET/POST/PATCH: doctors CRUD
|   |   |   |-- doctors/[id]/route.ts    # DELETE: remove doctor
|   |   |   |-- patients/route.ts        # GET: list patients
|   |   |   |-- departments/route.ts     # GET/POST/PATCH: departments CRUD
|   |   |   |-- departments/[id]/route.ts # DELETE: remove department
|   |   |   |-- medical-records/route.ts # GET/POST: medical records
|   |   |   |-- beds/route.ts            # GET/POST/PATCH: beds CRUD
|   |   |   |-- billing/route.ts         # GET/POST/PATCH: invoices CRUD
|   |   |   |-- stats/route.ts           # GET: dashboard statistics
|   |   |   |-- notifications/route.ts   # GET: role-aware notifications
|   |   |   |-- search/route.ts          # GET: global search
|   |
|   |-- components/
|   |   |-- layout/
|   |   |   |-- Header.tsx        # Top header with search, notifications, user menu
|   |   |   |-- Sidebar.tsx       # Reusable sidebar (desktop + mobile)
|   |   |-- ui/
|   |   |   |-- Button.tsx        # Reusable button component
|   |   |   |-- Card.tsx          # Card, CardHeader, CardTitle, CardContent
|   |   |   |-- Input.tsx         # Input with label, icon, error states
|   |   |-- ConsultationModal.tsx # Doctor's consultation form (diagnosis, vitals, prescriptions)
|   |
|   |-- lib/
|   |   |-- prisma.ts            # Prisma client singleton
|   |   |-- auth-utils.ts        # Password hashing, JWT sign/verify
|   |   |-- auth-guard.ts        # Server-side role verification
|   |   |-- api-validate.ts      # Request body validation helpers
|   |   |-- supabase.ts          # Database query helpers (notifications, search)
|   |   |-- toast.ts             # Toast notification helpers
|   |
|   |-- types/
|       |-- supabase.ts          # TypeScript interfaces for database rows
|
|-- tests/
|   |-- routes.spec.ts           # Playwright end-to-end route tests
|
|-- tailwind.config.ts           # Tailwind CSS configuration
|-- next.config.js               # Next.js configuration
|-- tsconfig.json                # TypeScript configuration
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user, set JWT cookie |
| POST | `/api/auth/register` | Register new patient account |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/auth/me` | Get current authenticated user |
| PATCH | `/api/auth/me` | Update profile (name, phone) |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments (supports patientId, doctorId, status, pagination) |
| POST | `/api/appointments` | Create new appointment |
| PATCH | `/api/appointments` | Update status or assign doctor |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors with profiles |
| POST | `/api/doctors` | Create doctor (generates login account + temp password) |
| PATCH | `/api/doctors` | Update doctor fields (room, fee, specialization) |
| DELETE | `/api/doctors/[id]` | Delete doctor |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List patients (admin: all, doctor: scoped by appointments) |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List departments with doctor/bed/patient counts |
| POST | `/api/departments` | Create department |
| PATCH | `/api/departments` | Update department |
| DELETE | `/api/departments/[id]` | Delete department |

### Medical Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medical-records` | List records (supports patientId, doctorId, pagination) |
| POST | `/api/medical-records` | Create record (auto-marks appointment COMPLETED) |

### Beds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/beds` | List beds grouped by ward |
| POST | `/api/beds` | Create bed |
| PATCH | `/api/beds` | Update bed status/assignment |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing` | List invoices (supports patientId, status) |
| POST | `/api/billing` | Create invoice |
| PATCH | `/api/billing` | Update status (mark paid) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Aggregate dashboard statistics |
| GET | `/api/notifications` | Role-aware recent activity feed |
| GET | `/api/search` | Global search across patients, doctors, appointments |

---

## Authentication & Security

### How Authentication Works
1. User submits email + password on the login page
2. Server finds the user by email, verifies password using bcrypt
3. Server generates a JWT token containing `{ userId, email, role }`
4. Token is set as an httpOnly cookie (`hospitrack-auth-token`) with 7-day expiry
5. Subsequent requests automatically include the cookie
6. Server-side layouts call `requireRole()` to verify the JWT and role

### Password Security
- Passwords are hashed using **bcrypt** with 10 salt rounds
- Raw passwords are never stored in the database
- The `passwordHash` field uses Prisma's `@map("password_hash")` to map to the database column

### JWT Tokens
- Signed with a secret key (`JWT_SECRET` environment variable)
- Contains: `userId`, `email`, `role`
- Expiry: 7 days
- Stored as httpOnly cookie (not accessible via JavaScript, prevents XSS)

### Role-Based Access Control (RBAC)
- Each portal layout (`admin/layout.tsx`, `doctor/layout.tsx`, `patient/layout.tsx`) calls `requireRole()` on the server
- If the JWT is missing or the role doesn't match, the user is redirected to `/auth/login`
- Three roles: `ADMIN`, `DOCTOR`, `PATIENT`

---

## Roles & Permissions

| Action | Admin | Doctor | Patient |
|--------|-------|--------|---------|
| View all patients | Yes | No (own only) | No |
| Register patients | Yes | No | No (self-register) |
| Create doctors | Yes | No | No |
| Delete doctors | Yes | No | No |
| View all appointments | Yes | No (own only) | No (own only) |
| Assign doctor to appointment | Yes | No | No |
| Confirm/Cancel appointments | Yes | Yes (own) | Yes (own) |
| Complete consultations | No | Yes | No |
| Write prescriptions | No | Yes | No |
| Create invoices | Yes | No | No |
| Pay invoices | No | No | Yes |
| Manage departments | Yes | No | No |
| Manage beds | Yes | No | No |
| View reports | Yes | No | No |
| Edit own profile | No | No | Yes |
| Browse doctors | No | No | Yes |
| Book appointments | Yes (on behalf) | No | Yes |

---

## Key Design Decisions

### Why Next.js App Router?
- Server-side auth checks in layouts (no client-side flash of unauthorized content)
- API Route Handlers eliminate the need for a separate backend server
- File-based routing simplifies navigation structure
- Server Components reduce client-side JavaScript bundle

### Why Prisma over raw SQL?
- Type-safe database queries (TypeScript auto-completion)
- Schema-first approach (schema.prisma defines the database)
- Automatic migrations (`prisma migrate dev`)
- Relations are defined declaratively, not with JOIN queries

### Why JWT cookies over session cookies?
- Stateless: no server-side session store needed
- Scalable: works across multiple server instances
- httpOnly flag prevents JavaScript access (XSS protection)

### Why Tailwind CSS?
- Rapid UI development with utility classes
- Consistent design system via tailwind.config.ts (custom colors)
- No CSS file management needed
- Responsive design built-in

### Why Zod + React Hook Form?
- Zod schemas validate both client-side (forms) and server-side (API routes)
- React Hook Form manages form state with minimal re-renders
- Single source of truth for validation rules

---

## Testing

### End-to-End Tests (Playwright)
```bash
# Run all route tests
npx playwright test tests/routes.spec.ts

# Run with visible browser
npx playwright test tests/routes.spec.ts --headed
```

Tests verify that all pages load correctly (HTTP 200) and that protected routes redirect to login when unauthenticated.

---

## Future Improvements

1. **API Authentication Middleware** — Add Next.js middleware to protect all `/api/*` routes (currently only layout-level protection)
2. **Password Reset Flow** — Implement email-based password recovery
3. **Real-time Notifications** — Use WebSockets for live appointment updates
4. **Email Integration** — Send appointment confirmations and reminders via email
5. **File Upload** — Allow uploading lab reports and documents to medical records
6. **Pagination** — Add server-side pagination for large datasets
7. **Dark Mode** — Toggle between light and dark themes
8. **Mobile App** — React Native companion app for patients
9. **Analytics Dashboard** — Interactive charts for revenue and appointment trends
10. **Audit Log** — Track all data modifications with timestamps and user info

---

## License

This project was developed as a diploma final project.

---

**Built with Next.js, Prisma, PostgreSQL, and Tailwind CSS**
#   u p d a t e d - h o s p i t r a c k  
 