# Arerti High School — Digital Portal

A security-first school management system for **Arerti General Secondary & Preparatory School**.

**Stack:** Java Spring Boot · React (Vite + Tailwind) · MySQL · MongoDB · JWT

---

## 📦 Project layout

```
arerti-portal/
├── backend/                Spring Boot 3 (Java 17, Maven)
│   ├── pom.xml
│   └── src/main/...
└── frontend/               React 18 + Vite + Tailwind
    ├── package.json
    └── src/...
```

---

## 🚀 Run locally

### Prereqs
- **Java 17+**
- **Maven 3.9+**
- **Node 18+** and **npm**
- **MySQL 8** (running on `localhost:3306`)
- **MongoDB 6+** (running on `localhost:27017`)

### 1. Start the databases
Make sure MySQL and MongoDB are running. The Spring app will auto-create the `arerti_portal` database on first run.

### 2. Start the backend
```bash
cd backend
./mvnw spring-boot:run          # or: mvn spring-boot:run
```
Backend starts on **http://localhost:8080**

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend on **http://localhost:5173** (Vite proxies `/api` → backend)

### 4. First login
On first backend boot, an admin account is auto-seeded:

| Field    | Value          |
|----------|----------------|
| Username | `admin`        |
| Password | `Admin@12345`  |

> Override via env vars: `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`

---

## 🔐 API endpoints (Phase 1)

| Method | URL                    | Auth        | Description           |
|--------|------------------------|-------------|-----------------------|
| GET    | `/api/health`          | public      | Service health check  |
| POST   | `/api/auth/register`   | public      | Create account        |
| POST   | `/api/auth/login`      | public      | Get JWT token         |
| GET    | `/api/auth/admin/ping` | ADMIN only  | Sanity check          |

Send the JWT on every protected request:
```
Authorization: Bearer <token>
```

---

## 🧪 Smoke test (curl)

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@12345"}' | jq -r .token)

# 2. Use it
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/admin/ping
# -> "admin-ok"
```

---

## 🗺️ Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| **1 — Foundation** | ✅ done | Project scaffold, JWT auth, User/Student/Teacher entities, MySQL+Mongo wiring, React login + role dashboards |
| **2 — Admin Core** | ⏳ next | Student/Teacher/Class CRUD, enrollment, admin user management |
| **3 — Academics** | ⏳ | Gradebook (CA + Final), auto total/avg/rank, report cards, attendance, notice board |
| **4 — Polish** | ⏳ | Resource repository (PDFs), parent portal, PWA offline, audit logs, mobile QA |

---

## 🛡️ Security notes
- All endpoints are stateless JWT (HS256).
- Passwords hashed with **BCrypt** (strength 10).
- CORS restricted to the React dev origins.
- Field-level validation on all DTOs (`@Valid` + `jakarta.validation`).
- Spring method-level `@PreAuthorize` enforced on role-restricted endpoints.
- **Before going to production:**
  - Replace `JWT_SECRET` in `application.yml` with a real 256-bit key (env var).
  - Switch `ddl-auto: update` to `validate` + use Flyway/Liquibase migrations.
  - Enable HTTPS termination at the reverse proxy.
