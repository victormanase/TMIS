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
| **Deployment** | Docker Compose · Nginx |

---

## Features

- **User management** with 4 roles: Admin, Manager, Accountant, Viewer
- **Property & unit management** (Apartment, Studio, AirBnB, Other)
- **Tenant management** with full assignment history
- **Payment tracking** — Rent and Service Charge collections
- **AirBnB bookings** — daily rate, auto-calculated totals, discount support
- **Rental & AirBnB reports** with PDF and Excel export
- **Upcoming rent collection alerts** — tenants due within 45 days
- **Audit trail** — every create/update/delete action is logged with the acting user
- **Dashboard** with KPI cards, monthly income bar chart, and occupancy donut

---

## Default Login

| Field | Value |
|---|---|
| Email | `admin@tmis.local` |
| Password | `Admin@1234` |

> Change this password immediately after first login.

---

## Local Development (without Docker)

### Prerequisites
- Node.js ≥ 20
- PostgreSQL 16 (or run `brew install postgresql@16` on macOS)

### 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/tmis.git
cd tmis
```

### 2 — Backend setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Run database migrations
npx prisma migrate dev

# Seed the default admin user
npm run db:seed

# Start the development server (hot-reload)
npm run dev
```

Backend runs at **http://localhost:4000**

### 3 — Frontend setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at **http://localhost:5173**

> The Vite dev server proxies all `/api/*` requests to the backend automatically — no CORS setup needed.

---

## VPS Deployment Guide (Ubuntu 22.04 / 24.04)

### Prerequisites on the VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

---

### 1 — Clone the repository

```bash
# SSH into your VPS
ssh user@YOUR_VPS_IP

# Clone the repo
git clone https://github.com/YOUR_USERNAME/tmis.git
cd tmis
```

---

### 2 — Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in the values:

```env
JWT_ACCESS_SECRET=<generate a long random string — see below>
JWT_REFRESH_SECRET=<generate a different long random string>
FRONTEND_URL=https://yourdomain.com
```

Generate secure secrets:

```bash
# Run twice — use each output for one secret
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Also update the backend `.env.example`:

```bash
cp backend/.env.example backend/.env
# The DATABASE_URL is managed by Docker internally — no change needed for Docker deployment
```

---

### 3 — Build and start all services

```bash
docker compose up -d --build
```

This starts three containers:
| Container | Description | Port |
|---|---|---|
| `db` | PostgreSQL 16 | internal |
| `backend` | Express API (runs migrations on startup) | `4000` |
| `frontend` | Nginx serving the built React app | `80` |

Check that all containers are running:

```bash
docker compose ps
```

Check backend logs:

```bash
docker compose logs backend -f
```

---

### 4 — Seed the database (first deployment only)

```bash
docker compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
bcrypt.hash('Admin@1234', 12).then(hash =>
  prisma.user.upsert({
    where: { email: 'admin@tmis.local' },
    update: {},
    create: { firstName: 'System', lastName: 'Admin', email: 'admin@tmis.local',
              phone: '+255700000000', password: hash, role: 'ADMIN', isActive: true }
  })
).then(() => { console.log('Seeded'); prisma.\$disconnect(); });
"
```

---

### 5 — Set up Nginx reverse proxy with SSL (recommended)

Install Nginx and Certbot on the host:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Create a site config:

```bash
sudo nano /etc/nginx/sites-available/tmis
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable and obtain SSL:

```bash
sudo ln -s /etc/nginx/sites-available/tmis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically updates the Nginx config to redirect HTTP → HTTPS and renews the certificate.

---

### 6 — Open firewall ports

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

### 7 — Verify deployment

```bash
# Health check
curl https://yourdomain.com/api/health

# Expected response
# {"status":"ok","timestamp":"..."}
```

Open `https://yourdomain.com` in a browser and log in with the default admin credentials.

---

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Migrations run automatically on backend startup
```

---

## Useful Docker Commands

```bash
# View running containers
docker compose ps

# View backend logs (live)
docker compose logs backend -f

# View all logs
docker compose logs -f

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Stop and delete the database volume (⚠️ destroys all data)
docker compose down -v

# Open a shell inside the backend container
docker compose exec backend sh

# Open psql inside the database container
docker compose exec db psql -U tmis_user -d tmis_db
```

---

## Database Backup & Restore

### Backup

```bash
docker compose exec db pg_dump -U tmis_user tmis_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T db psql -U tmis_user -d tmis_db
```

### Automate daily backups with cron

```bash
crontab -e
```

Add this line (backs up at 2 AM daily, keeps 30 days):

```cron
0 2 * * * cd /home/user/tmis && docker compose exec -T db pg_dump -U tmis_user tmis_db > /home/user/backups/tmis_$(date +\%Y\%m\%d).sql && find /home/user/backups -name "tmis_*.sql" -mtime +30 -delete
```

---

## Project Structure

```
tmis/
├── backend/                     # Express.js REST API
│   ├── prisma/
│   │   ├── schema.prisma        # Database models
│   │   ├── migrations/          # Migration history
│   │   └── seed.ts              # Default admin user
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # auth, rbac, auditLog, errorHandler
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic
│   │   └── utils/               # JWT, export helpers
│   ├── Dockerfile
│   └── .env.example
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── api/                 # Axios API modules
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # One folder per route
│   │   ├── store/               # Zustand auth state
│   │   └── hooks/               # useAuth
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API Endpoints Reference

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | All | Logout |
| GET/POST | `/api/users` | Admin | List / create users |
| PATCH | `/api/users/:id/toggle-active` | Admin | Activate / deactivate |
| GET/POST | `/api/properties` | Admin, Manager | List / create |
| GET/POST | `/api/units` | Admin, Manager | List / create |
| GET/POST | `/api/tenants` | Admin, Manager | List / create |
| POST | `/api/assignments` | Admin, Manager | Assign tenant to unit |
| PATCH | `/api/assignments/:id/checkout` | Admin, Manager | Check out tenant |
| GET/POST | `/api/payments` | Admin, Manager, Accountant | List / record |
| GET/POST | `/api/bookings` | Admin, Manager | AirBnB bookings |
| GET | `/api/reports/dashboard` | All | Dashboard KPIs |
| GET | `/api/reports/rental` | Admin, Manager, Accountant | Rental report |
| GET | `/api/reports/airbnb` | Admin, Manager, Accountant | AirBnB report |
| GET | `/api/reports/upcoming-collections` | Admin, Manager, Accountant | Due in 45 days |
| GET | `/api/reports/export` | Admin, Manager, Accountant | PDF / Excel export |
| GET | `/api/audit-logs` | Admin | Audit trail |
| GET | `/api/health` | Public | Health check |

---

## License

MIT — free to use, modify and distribute.

---

*Made with ❤️ by Smart Stack*
