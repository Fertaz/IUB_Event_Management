# IUB Event & Club Management

A modern campus engagement platform built for students, clubs, and administrators at IUB. The app brings together event discovery, club membership management, role-based administration, and activity tracking in a single clean experience.

## Project overview

IUB Event & Club Management is designed to help a university community:

- discover upcoming events and activities
- browse student clubs and their member directories
- join clubs and track membership requests
- manage event attendance and check-in flows
- support club admins with dashboards and reporting
- give super admins visibility into the wider campus ecosystem

The project blends a polished React frontend with a lightweight local SQLite-backed backend to simulate a full student platform in development and demo environments.

## Why this project matters

Campus life is fragmented across groups, announcements, clubs, and events. This system centralizes those touchpoints into a cohesive experience where students can engage, clubs can organize, and administrators can oversee participation without juggling multiple tools.

## Core features

### Student experience
- personalized dashboard with campus activity overview
- event feed with detail pages and RSVP-like interactions
- club directory and club detail pages
- member count and roster visibility
- profile and notification center
- join-request flow for club membership

### Club/admin experience
- club admin dashboard
- event creation and editing
- attendee roster management
- membership request approvals and rejection flows
- member roster tracking

### Super admin experience
- central oversight of roles and platform operations
- higher-level controls for administrative workflows

### Technical experience
- role-protected routes
- loading states and toast feedback
- clean modular frontend structure
- SQLite persistence for demo data
- modern UI with Tailwind + Radix primitives

## Tech stack

- Frontend: React, TypeScript, Vite
- Routing: React Router
- UI: Tailwind CSS, Radix UI, Lucide icons, motion
- State + app structure: context providers and modular app architecture
- Backend: Node.js + SQLite
- Data layer: local JSON/SQLite-backed demo store with seeded campus data

## Repository structure

- `src/app/` — frontend app, pages, components, context, utilities
- `server/` — backend API and SQLite logic
- `scripts/` — local dev startup scripts
- `public/` — static assets
- `dist/` — production build output

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app

```bash
npm run dev
```

This starts the local backend and frontend together in development mode.

### 3) Build for production

```bash
npm run build
```

## Demo accounts

The app includes seeded demo users for quick testing:

- Admin: `admin@iub.edu.bd` / `Admin@12345`
- Club admin: `shoikat.azad@iub.edu.bd` / `Club@12345`
- Student: `anika.rahman@iub.edu.bd` / `Student@12345`

## API overview

The app uses a local API with endpoints such as:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `GET /state`
- `PUT /state`

## Notes

This repository is best viewed as a demo/portfolio campus management system with realistic seeded data, role-based access, and polished UX patterns. It is intentionally designed to showcase a full student platform workflow without requiring a production-grade external backend.

## License

This project is for educational/demo purposes and is not a production deployment setup by default.
