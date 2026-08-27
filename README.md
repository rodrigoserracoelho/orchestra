<p align="center">
  <img src="assets/logo.svg" alt="Orchestra Manager" width="140">
</p>

# Orchestra Manager

A mobile-first web app for managing an orchestra: rehearsal attendance, date polls, season & concert planning, musician management, news, CMS pages, and internal messaging.

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, Tiptap rich text editor
- **Backend**: Node.js + Express, MySQL 8.0
- **Auth**: JWT + email-based login codes (via SMTP or [Resend](https://resend.com))
- **Infrastructure**: Docker multi-stage build, NGINX reverse proxy, Let's Encrypt SSL
- **i18n**: English, French, Dutch (Belgian locales)

## Features

### For Musicians
- **Attendance**: Mark availability (Attending / Not Attending / Maybe) per rehearsal and concert
- **Availability polls**: Answer "Doodle"-style date polls — mark which of the proposed slots you can make before a rehearsal is scheduled
- **Online payment**: Pay the season fee with a SEPA bank transfer — the app generates an EPC QR code and structured communication for one-tap payment from any Belgian bank app
- **Profile & directory**: Add a profile photo and short bio; browse fellow members in a directory grouped by instrument (opt-out toggle in your profile)
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
- **Availability polls**: Answer date polls like any other player (section leaders play too)

### For Admins
- **Season management**: Create seasons with concerts (date, venue, address), set fees, assign maestro
- **Rehearsal planning**: Single or recurring rehearsals (auto-generated until concert date), each marked **Tutti** (full orchestra) or **Sectionelle** (sectional)
- **Locations**: Manage the list of rehearsal venues (name, address, notes); rehearsals pick from a combo box instead of retyping the venue. Locations can be deactivated to hide them from new rehearsals
- **Date polls**: Propose several slots, see who can make each one in a Doodle-style grid, then close the poll on the winning slot — this creates the rehearsal and pre-fills attendance from the responses
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

Only the base schema is applied automatically — see [Migrations](#migrations) for the one-liner that
applies the rest.

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

> **First login**: The seed creates an admin user (`maestro@orchestra.com`) plus sample musicians (`violin1@orchestra.com`, `viola1@orchestra.com`, etc.). Enter any of these on the login page to receive a 6-digit code.

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

## Online Payments (optional)

Musicians can pay their season fee from the app using a **SEPA bank transfer + EPC QR code**. Free for the orchestra (no PSP fees), one-tap experience for the musician (any Belgian bank app prefills the form when the QR is scanned). The feature is **off by default**.

### Enabling

1. Set the following env vars in `.env`:

   ```
   PAYMENTS_ENABLED=true
   ORG_BENEFICIARY_NAME=Your Orchestra ASBL
   ORG_IBAN=BE68539007547034
   ORG_BIC=                 # optional, only needed for legacy banks
   ```

2. Restart the backend (`docker compose restart app`).

When `PAYMENTS_ENABLED=false` (or missing), the "Pay by transfer" button is hidden and the payment API rejects requests with 403.

### How it works

- User clicks **Pay by transfer** next to an unpaid season fee → backend creates a `sepa_payments` row, generates a Belgian structured communication (`+++DDD/DDDD/DDDDD+++`) and an EPC QR code
- Frontend shows a modal with the QR code, IBAN, amount, and reference
- User scans with their bank app → confirms → bank executes a regular SEPA transfer
- Funds arrive next business day. Admin marks the user paid via the existing admin UI **or** an automated CODA processor (see below)
- `season_payments.paid` remains the single source of truth across the rest of the app

### Automatic reconciliation via CODA (optional, free)

Belgian banks deliver daily **CODA files** (Coded Daily Statement) containing every transaction. A separate cron job can parse those and auto-mark payments based on the structured communication:

1. Ask your bank to email/SFTP a daily CODA file (free or ~€1-5/month depending on bank).
2. Build a small worker that:
   - Polls IMAP for new CODA emails (or watches an SFTP folder)
   - Parses the file with any open-source CODA parser
   - For each credit transaction, looks up `sepa_payments.structured_communication`
   - On match → mark `sepa_payments` as paid and upsert `season_payments.paid = TRUE`

This is not bundled yet — track it as an open task if you need full automation. Manual reconciliation still works fine in the meantime.

## Date Polls (Doodle)

When a rehearsal date isn't fixed yet, an admin can poll the players instead of guessing.

### Flow

1. **Admin** opens a season → **Polls** → *New Poll*, and proposes any number of date/time slots.
   The poll also carries what the rehearsal *will be*: title, type (Tutti/Sectionelle), location,
   duration, and an optional response deadline.
2. **Audience** is either the whole orchestra or a single section (by instrument) — a strings-only
   sectional never reaches the brass.
3. **Musicians** see the poll under **Polls** and answer each slot with ✓ (can make it),
   ? (if needed) or ✗ (cannot). Answers can be changed until the poll closes.
4. **Admin** sees a Doodle-style grid — one row per musician, one column per slot, with per-slot
   tallies. The best slot is highlighted, scoring a "maybe" as half a "yes".
5. **Closing** the poll on a slot **creates the rehearsal** with the poll's type and location, and
   carries every response on that slot straight into attendance
   (`yes → attending`, `maybe → maybe`, `no → not_attending`) — nobody is asked twice.

A closed poll can be reopened; the rehearsal it created is left alone, since attendance may have
moved on since.

### Notes

- Eligibility is enforced server-side on every read and vote, not just in the UI
- Editing an open poll keeps the votes already cast on slots that survive the edit
- Votes are rejected once the response deadline passes
- Polls are visible to musicians and section leaders; admins and the maestro are not polled for availability

## Database

### Migrations

Located in `backend/migrations/`. Tracked via a `schema_migrations` table for idempotent application.

- **Production**: `deploy.sh` applies every pending migration automatically, in filename order, and
  records each one in `schema_migrations`. Nothing to do by hand.
- **Development**: Docker only auto-applies `001_schema.sql`, and only when the database volume is
  first created. Apply the rest yourself after starting MySQL:

  ```bash
  for f in backend/migrations/*.sql; do
    [ "$(basename "$f")" = "001_schema.sql" ] && continue
    docker compose exec -T mysql mysql -uroot -porchestra_root_pass orchestra_attendance < "$f"
  done
  ```

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
| 014 | SEPA payment intents for season fees (with structured communication for CODA matching) |
| 015 | Profile picture (base64), bio, and directory opt-in flag on users |
| 016 | Rehearsal type (Tutti / Sectionelle) |
| 017 | Rehearsal locations table + `location_id` on rehearsals (backfills existing free-text venues) |
| 018 | Date polls: polls, poll options, and per-musician availability votes |

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
│   │   ├── constants/      # Shared constants (instrument and part lists)
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
