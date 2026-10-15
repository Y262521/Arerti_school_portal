# Arerti General Secondary & Preparatory School — Digital Portal

A full-featured, security-first school management system built for **Arerti General Secondary & Preparatory School**, replacing all paper-based processes with a unified digital platform accessible from any device.

**Live site:** https://arerti-school-portal.vercel.app  
**Backend API:** https://arerti-school-backend.onrender.com  
**Stack:** Java 21 · Spring Boot 3 · PostgreSQL · MongoDB · React 18 · Vite · Tailwind CSS · JWT

---

## 📋 Table of Contents

- [Overview](#overview)
- [User Roles](#user-roles)
- [Features](#features)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [Academic Structure](#academic-structure)
- [Security](#security)
- [Languages](#languages)
- [Deployment](#deployment)

---

## Overview

The portal manages the full academic lifecycle of a secondary school — from student enrolment through to grade submission, report cards, and annual pass/fail decisions. It supports four user roles (Director, Teacher, Student, Parent) each with a tailored interface and strict access controls.

---

## User Roles

### 🏫 School Director (ADMIN)
- Register and manage students and teachers (with photo and document upload)
- Create class sections and assign subjects and teachers
- Define grade curriculum per grade level and stream
- Open / close / extend grade submission windows
- Approve or reject homeroom teacher regrade requests
- Edit any grade including locked ones (director override)
- View and manage attendance for all classes
- Post, edit and delete school notices with photos
- Upload and manage study resources
- Look up any user and reset their password
- Review the full system audit log
- End the academic year (archive assignments, unassign students)

### 👩‍🏫 Teacher
- Enter grades (mid exam, final exam, assignment, test/quiz) for assigned subjects
- View all subjects as homeroom teacher
- Mark daily attendance (present / absent / late / excused) for homeroom class
- Register new and existing students during open registration windows
- Request regrade permission for locked marks (homeroom only)
- Upload and manage study resources
- Read school notices
- Manage account and change password

### 🎓 Student
- View full grade history across all semesters and batches
- See pass / fail (Promoted / Failed) result per academic year
- Check day-by-day attendance record with rate summary
- Read school notices
- Download study resources uploaded by teachers
- Manage account and change password

### 👨‍👩‍👧 Parent
- Link children using their portal username and password (secure — no Student ID)
- View all semester grades for each linked child
- See annual promotion / retention result per year
- Track child's full attendance history
- Read school notices
- Manage account and change password

---

## Features

### Student Registration
- Multi-step wizard: Personal Info → Academic Placement → Guardian → Payment
- Supports: New Entrant (Grade 9), Promoted, Transfer, Repeater
- Photo and document upload (ID, Grade 8 certificate, release letter, payment receipt) via Cloudinary
- Director opens registration windows; teachers enrol students within the window
- Auto-assign students to class sections after registration closes

### Gradebook
- Subjects separated by code — same name, different code = different subject per stream
- Marks auto-lock after submission; regrade permission required to edit
- Director can override locked grades without permission
- Homeroom teacher sees all class subjects (read-only); can request regrade for any subject
- Grade entry window controls when teachers can submit (open / extend / close)
- Semester averages and annual averages calculated automatically
- Pass/fail based on annual average ≥ 50

### Attendance
- Homeroom teacher marks daily attendance per class
- Director can view and manage all classes
- Students and parents can view their own attendance history
- Attendance rate warning shown when below 75%

### Registration History (Student / Parent view)
- Table showing: Academic Year, Batch (Grade 9 = Batch 1), Semester, Registration Date (Ethiopian Calendar), Average, Prev Status, Final Status
- Expandable rows showing individual subject scores
- Pass/fail displayed as **Promoted** / **Failed** (ተዛውሯል / ወድቋል in Amharic)

### Notice Board
- Director posts notices with photos, targeted by audience (All / Students / Teachers / Parents)
- Priority levels: Low / Medium / High
- Notices can be pinned to the top
- All authenticated users can read notices relevant to their role

### Resources
- Upload PDFs and documents for Students, Teachers, or General audience
- Parents do not have access to the resources page
- Director can delete any resource; teachers can delete their own uploads

### Audit Log
- Full trail of all system activity: logins, registrations, grade entries, password resets
- Filterable by entity type (AUTH, STUDENT, TEACHER, RESOURCE, etc.)
- Only visible to the Director

### Academic Years
- Fetched dynamically from the database — no hardcoded list
- New academic years appear automatically when the first student is registered
- Always includes the current year as a fallback

---

## Project Structure

```
arerti-portal/
├── backend/                    Spring Boot 3 (Java 21, Maven)
│   ├── src/main/java/com/arerti/portal/
│   │   ├── config/             Security, MongoDB, database migration
│   │   ├── controller/         REST endpoints
│   │   ├── dto/                Request/Response DTOs
│   │   ├── entity/             JPA entities (PostgreSQL) + MongoDB documents
│   │   ├── repository/         Spring Data repositories
│   │   ├── security/           JWT filter, user details service
│   │   └── service/            Business logic
│   └── Dockerfile
└── frontend/                   React 18 + Vite + Tailwind CSS
    └── src/
        ├── components/         Reusable UI components
        ├── context/            Auth + Language contexts
        ├── hooks/              Custom hooks (useAcademicYears)
        ├── pages/              One file per page/feature
        └── services/           API service functions
```

---

## Running Locally

### Prerequisites
- Java 21+
- Maven 3.9+
- Node 18+ and npm
- PostgreSQL 15+ on `localhost:5432`
- MongoDB 6+ on `localhost:27017`

### 1. Start the databases
Ensure PostgreSQL and MongoDB are running. The Spring app will auto-create the schema on first run.

### 2. Start the backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend starts on **http://localhost:8080**

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts on **http://localhost:5173** (Vite proxies `/api` → backend)

### 4. First login
On first boot the admin account is auto-seeded:

| Field    | Value          |
|----------|----------------|
| Username | `admin`        |
| Password | `Admin@12345`  |

Override via env vars: `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`

---

## Environment Variables

### Backend (`application.yml` / environment)

| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `SPRING_DATA_MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | 256-bit secret for signing JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SEED_ADMIN_USERNAME` | Initial admin username (default: `admin`) |
| `SEED_ADMIN_PASSWORD` | Initial admin password (default: `Admin@12345`) |

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |

---

## Academic Structure

| Level | Detail |
|-------|--------|
| Grades | 9, 10, 11, 12 |
| Streams | Grade 11–12: Natural Science or Social Science |
| Semesters | 2 per academic year (Semester I and II) |
| Batches | Batch 1 = Grade 9, Batch 2 = Grade 10, Batch 3 = Grade 11, Batch 4 = Grade 12 |
| Academic Year | Ethiopian format e.g. `2026/2027` |
| Scoring | Mid Exam (20) + Final Exam (60) + Assignment (10) + Test/Quiz (10) = 100 |
| Pass mark | Annual average ≥ 50 = Promoted; < 50 = Failed |
| Subject codes | Same subject name with different codes = different subject (used to separate streams) |

---

## Security

- Stateless JWT authentication (HS256), 24-hour token expiry
- Passwords hashed with BCrypt (strength 10)
- 5-minute inactivity auto-logout
- Grade marks lock after submission — regrade permission required
- Parent can only link a child using the child's portal username **and** password
- Parent can only view their own linked children's data
- CORS restricted to known frontend origins
- Field-level validation on all DTOs (`@Valid` + `jakarta.validation`)
- Spring method-level `@PreAuthorize` on all role-restricted endpoints
- Full audit log of all actions (MongoDB)

---

## Languages

The frontend supports two languages switchable at any time via the language toggle in the navigation bar:

- 🇬🇧 **English** (default)
- 🇪🇹 **Amharic (አማርኛ)**

All page content, labels, status messages, and dashboard descriptions are fully translated.

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Auto-deploys on every push to `master` |
| Backend | Render (Free tier) | Auto-deploys on every push to `master`; spins down after 15 min inactivity (50s cold start) |
| Database (SQL) | Render PostgreSQL | Persistent |
| Database (NoSQL) | MongoDB Atlas | Persistent — used for notices and audit logs |
| File storage | Cloudinary | Direct browser upload (no backend roundtrip) |

### Deploying

Push to `master` branch — both Vercel and Render will auto-deploy.

```bash
git add .
git commit -m "your message"
git push
```

### Production Checklist
- [ ] Replace `JWT_SECRET` with a real 256-bit random key
- [ ] Switch `ddl-auto: update` to `validate` and use Flyway migrations
- [ ] Enable HTTPS termination at reverse proxy
- [ ] Upgrade Render to a paid tier to eliminate cold-start delays
- [ ] Set `SEED_ADMIN_PASSWORD` to a strong password and change it on first login

---

## Roadmap

| Feature | Status |
|---------|--------|
| Student & Teacher registration | ✅ Complete |
| JWT Authentication & role-based access | ✅ Complete |
| Gradebook with lock/regrade | ✅ Complete |
| Attendance tracking | ✅ Complete |
| Report cards & pass/fail | ✅ Complete |
| Notice board with photos | ✅ Complete |
| Resource repository | ✅ Complete |
| Parent portal | ✅ Complete |
| Audit log | ✅ Complete |
| Ethiopian Calendar display | ✅ Complete |
| Academic year from database | ✅ Complete |
| Amharic language toggle | ✅ Complete |
| SMS / email notifications | ⏳ Planned |
| Printable report cards (PDF) | ⏳ Planned |
| Mobile app (PWA) | ⏳ Planned |
| Timetable management | ⏳ Planned |

---

© 2024–2026 Arerti General Secondary & Preparatory School. All rights reserved.
