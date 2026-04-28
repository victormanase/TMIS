# TMIS — Tenant & Rental Units Management System

A full-stack web application for managing rental properties, units, tenants, payments, and AirBnB bookings — with role-based access control, financial reporting, and PDF/Excel exports.

**Made with ❤️ by Smart Stack**

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js · Express.js · TypeScript |
| **Database** | PostgreSQL 16 · Prisma ORM |
| **Frontend** | React 18 · Vite · Tailwind CSS v4 |
| **Auth** | JWT (access + refresh tokens) · bcryptjs |
| **Charts** | Recharts |
| **Exports** | pdfkit (PDF) · exceljs (Excel) |
| **Deployment** | Docker Compose · Nginx (HTTP) |

---

## Features

| Module | What it does |
|---|---|
| **User Management** | 4 roles (Admin / Manager / Accountant / Viewer), activate/deactivate, full permissions matrix |
| **Properties** | Register and manage rental properties with location and description |
| **Rental Units** | Apartment, Studio, AirBnB, Other — per-unit rent, service charge, daily rate |
| **Tenants** | Register tenants, assign to units, track full assignment history |
| **Payments** | Record Rent and Service Charge collections with period tracking |
| **AirBnB Bookings** | Daily rate, auto-calculated nights & total, discount support |
| **Rental Reports** | Filter by property/date, export as PDF or Excel |
| **AirBnB Reports** | Booking summary, revenue, nights — export as PDF or Excel |
| **Upcoming Collections** | Tenants with rent due in the next 45 days (Overdue / Due Soon / Upcoming) |
| **Dashboard** | KPI cards, monthly income bar chart, occupancy donut, collection alerts |
| **Audit Logs** | Every create / update / delete action logged with acting user |

---

## Role Permissions

| Feature | Admin | Manager | Accountant | Viewer |
|---|:---:|:---:|:---:|:---:|
| Dashboard & KPIs | ✅ | ✅ | ✅ | ✅ |
| Upcoming collections alert | ✅ | ✅ | ✅ | ❌ |
| View properties & units | ✅ | ✅ | ✅ | ❌ |
| Create / edit properties & units | ✅ | ✅ | ❌ | ❌ |
| Manage tenants & assignments | ✅ | ✅ | ❌ | ❌ |
| Record & view payments | ✅ | ✅ | ✅ | ❌ |
| Manage AirBnB bookings | ✅ | ✅ | ❌ | ❌ |
| Reports & export (PDF/Excel) | ✅ | ✅ | ✅ | ❌ |
| User management | ✅ | ❌ | ❌ | ❌ |
| Audit logs | ✅ | ❌ | ❌ | ❌ |

---

## Default Login

| Field | Value |
|---|---|
| Email | `admin@tmis.local` |
| Password | `Admin@1234` |

> ⚠️ Change the default password immediately after first login.

---

## Project Structure

```
tmis/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # All database models & enums
│   │   ├── migrations/          # Migration history (auto-applied on deploy)
│   │   └── seed.ts              # Seeds the default admin user
│   ├── src/
│   │   ├── controllers/         # Thin request handlers
│   │   ├── middleware/          # auth · rbac · auditLog · errorHandler
│   │   ├── routes/              # Express route definitions
│   │   ├── services/            # All business logic
│   │   └── utils/               # JWT · password · PDF · Excel · response
│   ├── Dockerfile               # Multi-stage build (builder → runner)
│   ├── entrypoint.sh            # Runs migrations then starts server
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API modules (one per resource)
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar · Layout · ProtectedRoute
│   │   │   └── ui/              # Button · Input · Card · Modal · Table …
│   │   ├── hooks/               # useAuth
│   │   ├── pages/               # One folder per route
│   │   └── store/               # Zustand auth store (persisted)
│   ├── Dockerfile               # Build SPA → serve with Nginx
│   └── nginx.conf               # Proxies /api/* to backend, serves SPA
├── docker-compose.yml           # Orchestrates db · backend · frontend
├── deploy.sh                    # One-shot VPS deployment script
├── .env.example                 # Environment variable template
└── README.md
```

---

## VPS Deployment — One Command

> Tested on **Ubuntu 22.04 / 24.04**. No SSL certificate required — runs on plain HTTP (port 80).

### Step 1 — SSH into your VPS and clone the repository

```bash
ssh user@YOUR_VPS_IP

git clone https://github.com/YOUR_USERNAME/tmis.git
cd tmis
```

### Step 2 — Run the deployment script

```bash
sudo bash deploy.sh
```

That's it. The script does everything:

| # | What it does |
|---|---|
| 1 | Checks the operating system |
| 2 | Installs Docker and Docker Compose if not present |
| 3 | Detects your server's public IP (or lets you enter a domain) |
| 4 | Generates a `.env` file with cryptographically secure random secrets |
| 5 | Pulls the latest code from Git (if applicable) |
| 6 | Builds all Docker images |
| 7 | Starts all containers (`db`, `backend`, `frontend`) |
| 8 | Waits for the backend health check to pass |
| 9 | Seeds the default admin user (first deployment only) |
| 10 | Prints the access URL and login credentials |

When it finishes you will see:

```
╔══════════════════════════════════════════════════════╗
║            TMIS is now running! 🎉                  ║
╚══════════════════════════════════════════════════════╝

  Application URL:   http://YOUR_VPS_IP
  API Health:        http://YOUR_VPS_IP/api/health

  Default Login:
    Email    →  admin@tmis.local
    Password →  Admin@1234
```

### Step 3 — Open firewall ports

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

### Step 4 — Verify

```bash
curl http://YOUR_VPS_IP/api/health
# {"status":"ok","timestamp":"..."}
```

Open `http://YOUR_VPS_IP` in a browser and log in.

---

## Updating the Application

```bash
cd tmis
sudo bash deploy.sh
```

The script detects an existing `.env` (keeps your secrets), pulls latest code, rebuilds images, and restarts containers. Migrations run automatically on every startup.

---

## Environment Variables

All variables live in `.env` at the project root. The `deploy.sh` script creates this file automatically. If you need to set values manually:

```bash
cp .env.example .env
nano .env
```

| Variable | Description | Auto-generated? |
|---|---|:---:|
| `SERVER_IP` | Public IP or domain (no `http://`, no trailing `/`) | ✅ |
| `DB_PASSWORD` | PostgreSQL password | ✅ |
| `JWT_ACCESS_SECRET` | Secret for signing 15-minute access tokens | ✅ |
| `JWT_REFRESH_SECRET` | Secret for signing 7-day refresh tokens | ✅ |

To generate secrets manually:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Docker Services

| Service | Image | Exposed | Role |
|---|---|---|---|
| `db` | `postgres:16-alpine` | Internal only | PostgreSQL database |
| `backend` | Built from `./backend` | Internal only | Express REST API |
| `frontend` | Built from `./frontend` | `0.0.0.0:80` | Nginx — serves React SPA + proxies `/api/*` to backend |

> The backend is **not exposed on a public port**. All traffic goes through the Nginx frontend container, which proxies `/api/*` internally to the backend.

---

## Useful Commands

```bash
# View status of all containers
docker compose ps

# Follow live logs (all services)
docker compose logs -f

# Follow backend logs only
docker compose logs backend -f

# Restart a single service
docker compose restart backend

# Open a shell inside the backend container
docker compose exec backend sh

# Open psql in the database container
docker compose exec db psql -U tmis_user -d tmis_db

# Stop all containers (data is preserved)
docker compose down

# Stop and destroy ALL data (⚠️ irreversible)
docker compose down -v
```

---

## Database Backup & Restore

### Backup

```bash
docker compose exec -T db pg_dump -U tmis_user tmis_db \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
cat backup_YYYYMMDD_HHMMSS.sql \
  | docker compose exec -T db psql -U tmis_user -d tmis_db
```

### Automated daily backup (cron)

```bash
crontab -e
```

Add (runs at 2 AM, keeps 30 days of backups):

```cron
0 2 * * * cd /home/user/tmis && docker compose exec -T db pg_dump -U tmis_user tmis_db > /home/user/backups/tmis_$(date +\%Y\%m\%d).sql && find /home/user/backups -name "tmis_*.sql" -mtime +30 -delete
```

---

## Local Development (without Docker)

### Prerequisites
- Node.js ≥ 20
- PostgreSQL 16

On macOS: `brew install postgresql@16 && brew services start postgresql@16`

### Backend

```bash
cd backend

# Install dependencies
npm install

# Create and fill in your local environment file
cp .env.example .env
# Set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET in .env

# Create the database
psql postgres -c "CREATE USER tmis_user WITH PASSWORD 'tmis_password' CREATEDB;"
psql postgres -c "CREATE DATABASE tmis_db OWNER tmis_user;"

# Run migrations
npx prisma migrate dev

# Seed default admin
npm run db:seed

# Start dev server with hot-reload
npm run dev
```

Backend → **http://localhost:4000**

### Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

Frontend → **http://localhost:5173**

> Vite proxies all `/api/*` requests to `localhost:4000` automatically — no CORS issues.

---

## API Reference

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT pair |
| POST | `/api/auth/refresh` | Public | Exchange refresh token for new access token |
| POST | `/api/auth/logout` | All | Revoke refresh token |
| POST | `/api/auth/password-reset/request` | Public | Request password reset link |
| POST | `/api/auth/password-reset/confirm` | Public | Set new password via token |
| GET · POST | `/api/users` | Admin | List / create system users |
| GET · PUT · DELETE | `/api/users/:id` | Admin | Get / update / soft-delete user |
| PATCH | `/api/users/:id/toggle-active` | Admin | Activate or deactivate a user |
| GET · POST | `/api/properties` | Admin, Manager | List / create properties |
| GET · PUT · DELETE | `/api/properties/:id` | Admin, Manager | Get / update / soft-delete |
| GET · POST | `/api/units` | Admin, Manager | List / create units |
| GET · PUT · DELETE | `/api/units/:id` | Admin, Manager | Get / update / soft-delete |
| GET · POST | `/api/tenants` | Admin, Manager | List / create tenants |
| GET · PUT · DELETE | `/api/tenants/:id` | Admin, Manager | Get / update / soft-delete |
| POST | `/api/assignments` | Admin, Manager | Assign tenant to unit |
| GET | `/api/assignments/unit/:unitId` | Admin, Manager | Assignment history for a unit |
| PATCH | `/api/assignments/:id/checkout` | Admin, Manager | Check out a tenant |
| GET · POST | `/api/payments` | Admin, Manager, Accountant | List / record payments |
| GET | `/api/payments/tenant/:id` | Admin, Manager, Accountant | Full payment ledger for tenant |
| GET · POST | `/api/bookings` | Admin, Manager | List / create AirBnB bookings |
| GET · PUT | `/api/bookings/:id` | Admin, Manager | Get / update booking |
| GET | `/api/reports/dashboard` | All authenticated | KPIs + monthly income + occupancy + upcoming summary |
| GET | `/api/reports/rental` | Admin, Manager, Accountant | Rental payments report |
| GET | `/api/reports/airbnb` | Admin, Manager, Accountant | AirBnB bookings report |
| GET | `/api/reports/occupancy` | Admin, Manager, Accountant | Unit occupancy status |
| GET | `/api/reports/upcoming-collections` | Admin, Manager, Accountant | Tenants due within 45 days |
| GET | `/api/reports/export` | Admin, Manager, Accountant | `?format=pdf\|excel&type=rental\|airbnb\|occupancy` |
| GET | `/api/audit-logs` | Admin | Full audit trail |
| GET | `/api/health` | Public | Health check |

---

## License

MIT — free to use, modify, and distribute.

---

*Made with ❤️ by Smart Stack*
