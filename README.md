# Orchestra Manager

A mobile-first web app for managing an orchestra: rehearsal attendance, season & concert planning, musician management, news, CMS pages, and internal messaging.

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, Tiptap rich text editor
- **Backend**: Node.js + Express, MySQL 8.0
- **Auth**: JWT + email-based login codes (via SMTP or [Resend](https://resend.com))
- **Infrastructure**: Docker multi-stage build, NGINX reverse proxy, Let's Encrypt SSL
- **i18n**: English, French, Dutch (Belgian locales)

## Features

### For Musicians
- **Attendance**: Mark availability (Attending / Not Attending / Maybe) per rehearsal and concert
- **Season info**: View season details and concerts (maestro, venues with Google Maps links, dates)
- **News feed**: Read orchestra news articles with cover images, mark as read
- **Inbox**: Receive messages from admins and maestros
- **Profile**: Manage instrument, part, phone, birthdate

### For Maestros
- **Season overview**: View rehearsals and concerts for assigned seasons
- **Attendance tracking**: Expand any rehearsal to see who's attending, grouped by instrument section
- **Messaging**: Send announcements to all musicians

### For Section Leaders
- **Section attendance**: View attendance for rehearsals in assigned seasons, grouped by instrument

### For Admins
- **Season management**: Create seasons with concerts (date, venue, address), set fees, assign maestro
- **Rehearsal planning**: Single or recurring rehearsals (auto-generated until concert date)
- **Attendance overview**: View responses grouped by instrument section (violins split by part)
- **Musician management**: Add/edit musicians, assign roles (musician, section leader, maestro, admin), activate/deactivate, track season fee payments
- **News & Messages**: Publish articles (with cover images) and announcements, track read status
- **CMS Pages**: Create and edit public-facing pages with a rich text editor (Tiptap)
- **Dashboard**: Overview of active seasons, upcoming rehearsals, musician count

### Public Site
- **Home page**: Customizable via CMS
- **Concerts**: Upcoming concerts with venue details and Google Maps links
- **News**: Public news articles
- **Custom pages**: Any page created via the CMS is accessible publicly

### General
- **Mobile-first design**: Touch-friendly, responsive UI with dark mode
- **Role-based access**: Four roles — musician, section leader, maestro, admin — with view switching (e.g. maestros can switch to musician view to register their own attendance)
- **Email-only auth**: No passwords — everyone logs in via a 6-digit code sent by email (SMTP or Resend)
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

> **Dev mode**: When `NODE_ENV=development` and email sending fails, login codes are shown directly in the browser.

## Production Deployment

The app is fully containerized with Docker. Create your own deploy script or use Docker Compose directly:

```bash
cp .env.example .env          # fill in your production values
cp nginx.conf.example nginx.conf  # replace yourdomain.com with your domain
docker compose up -d --build
```

### Deploy Modes

1. **Fresh install** — wipes the database, applies base schema + all migrations
2. **Keep data** — preserves existing data, applies only pending migrations

### Docker Architecture

```
NGINX (80/443) → App container (3001) → MySQL (3306)
     ↑
  certbot (auto-renewal via cron)
```

### SSL

The included `nginx.conf.example` is configured for Let's Encrypt SSL. On first deploy, obtain certificates using certbot with the webroot method.

## Database

### Migrations

Located in `backend/migrations/`. Tracked via a `schema_migrations` table for idempotent application.

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
| 011 | CMS pages |
| 012 | Maestro & section leader roles (role enum + season maestro FK) |
| 013 | Concert attendance (links concerts to rehearsal entries for attendance tracking) |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, file upload
│   │   ├── models/         # Data access (MySQL queries)
│   │   ├── routes/         # API routes (admin, musician, maestro, section-leader, public, auth)
│   │   └── services/       # Email, auth code services
│   ├── migrations/         # SQL migration files
│   └── server.js           # Express entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # Shared components (Header, RichTextEditor, PublicLayout)
│   │   ├── context/        # Auth, Language, Theme providers
│   │   ├── pages/          # All page components
│   │   ├── services/       # API client (axios)
│   │   └── translations/   # en.json, fr.json, nl.json
│   └── index.html
├── .env.example            # Environment variables template
├── Dockerfile              # Multi-stage build (frontend + backend)
├── docker-compose.yml      # MySQL + App + NGINX + Certbot
└── nginx.conf.example      # SSL termination + reverse proxy template
```

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
