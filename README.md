# Orchestra Manager

A mobile-first web app for managing an orchestra: rehearsal attendance, season & concert planning, musician management, news, and internal messaging. Built for the Philharmonique d'Uccle.

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS
- **Backend**: Node.js + Express, MySQL 8.0
- **Auth**: JWT + email-based login codes (via [Resend](https://resend.com))
- **Infrastructure**: Docker multi-stage build, NGINX reverse proxy, Let's Encrypt SSL
- **i18n**: English, French, Dutch (Belgian locales)

## Features

### For Musicians
- **Attendance**: Mark availability (Attending / Not Attending / Maybe) per rehearsal
- **Season info**: View season details and concerts (maestro, venues with Google Maps links, dates)
- **News feed**: Read orchestra news articles with cover images, mark as read
- **Inbox**: Receive messages from admins
- **Profile**: Manage instrument, part, phone, birthdate

### For Admins
- **Season management**: Create seasons with concerts (date, venue, address), set fees, assign maestro
- **Rehearsal planning**: Single or recurring rehearsals (auto-generated until concert date)
- **Attendance overview**: View responses grouped by instrument section (violins split by part)
- **Musician management**: Add/edit musicians, promote/demote roles, activate/deactivate, track payments
- **News & Messages**: Publish articles (with cover images) and announcements, track read status
- **Dashboard**: Overview of active seasons, upcoming rehearsals, musician count

### General
- **Mobile-first design**: Touch-friendly, responsive UI with dark mode
- **Email-only auth**: No passwords — everyone logs in via a 6-digit code sent by email
- **Multi-language**: Full support for EN, FR, NL with locale-aware date/time formatting
- **Base64 images**: News cover images stored as data URIs in the DB for easy data migration

## Quick Start (Development)

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 1. Start MySQL

```bash
docker compose up -d mysql
```

Check it's ready:

```bash
docker compose logs mysql     # look for "ready for connections"
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # defaults match docker-compose
npm install
npm run seed                  # creates admin user + sample data
npm run dev                   # starts on port 3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on port 5173
```

Open http://localhost:5173 in your browser.

## Production Deployment

The app is fully containerized with Docker. Two deployment scripts are included:

### deploy.sh — LAN server

Deploys to a local network server. Runs behind an existing reverse proxy on a subpath (`/orchestra/`).

```bash
./deploy.sh
```

### deploy-new.sh — OVH VPS

Deploys to the public VPS at `philharmoniqueuccle.ovh`. Includes NGINX + SSL (Let's Encrypt with auto-renewal). Runs at the root path (`/`).

```bash
./deploy-new.sh
```

Two modes:
1. **Erase data** — fresh install, wipes the database
2. **Keep data** — rebuilds containers, preserves existing data

On first deploy, SSL certificates are automatically provisioned via certbot.

### Docker Architecture

```
NGINX (80/443) → App container (3001) → MySQL (3306)
     ↑
  certbot (auto-renewal via cron)
```

## Database

### Migrations

Located in `backend/migrations/`. Applied automatically on container start.

| File | Description |
|------|-------------|
| 001_schema.sql | Base schema (users, seasons, concerts, rehearsals, attendance) |
| 002–003 | Venue/concert restructuring, maestro field |
| 004 | Season payments tracking |
| 005 | User active/inactive status |
| 006–007 | Internal messaging system |
| 008 | News/articles system |
| 009 | Email log and user sessions (online status) |
| 010 | News cover images as base64 (MEDIUMTEXT) |

### Data Transfer Scripts

```bash
./db-import.sh    # Dump remote DB → local orchestra_dump.sql
./db-export.sh    # Upload orchestra_dump.sql → another remote and import
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, file upload
│   │   ├── models/         # Data access (MySQL queries)
│   │   ├── routes/         # API routes (admin, musician, auth)
│   │   └── services/       # Email, auth code services
│   ├── migrations/         # SQL migration files
│   └── server.js           # Express entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared components (Layout, RichEditor)
│   │   ├── context/        # Auth, Language providers
│   │   ├── pages/          # All page components
│   │   ├── services/       # API client (axios)
│   │   └── translations/   # en.json, fr.json, nl.json
│   └── index.html
├── Dockerfile              # Multi-stage build (frontend + backend)
├── docker-compose.yml      # MySQL + App + NGINX + Certbot
├── nginx.conf              # SSL termination + reverse proxy
├── deploy.sh               # LAN deployment
├── deploy-new.sh           # VPS deployment (with SSL)
├── db-import.sh            # Import DB from remote
└── db-export.sh            # Export DB to remote
```
