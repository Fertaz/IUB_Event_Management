# IUB Event & Club Management

A modern campus engagement platform built for students, clubs, and administrators at IUB. The app brings together event discovery, club membership management, role-based administration, and activity tracking in a single clean experience.

**Live app:** https://iub-event-management.web.app

## Project overview

IUB Event & Club Management is designed to help a university community:

- discover upcoming events and activities
- browse student clubs and their member directories
- join clubs and track membership requests
- manage event attendance and check-in flows
- support club admins with dashboards and reporting
- give super admins visibility into the wider campus ecosystem

The project pairs a polished React frontend with **Firebase** (Firestore, Authentication, and Hosting) as the backend, so it runs as a real, deployable student platform.

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
- Firebase Auth + Firestore persistence
- modern UI with Tailwind + Radix primitives

## Tech stack

- Frontend: React, TypeScript, Vite
- Routing: React Router
- UI: Tailwind CSS, Radix UI, Lucide icons, motion
- State + app structure: context providers and modular app architecture
- Backend: Firebase — **Firestore** (data), **Firebase Authentication** (email/password), **Firebase Hosting** (deploy)

## Data & auth model

- The whole application state is stored as a single Firestore document `appState/main`
  (a snapshot of the app store: users, clubs, events, registrations, memberships,
  notifications, and role requests).
- Authentication uses **Firebase Auth** with email/password. Sign-up is restricted
  to `@iub.edu.bd` addresses. The signed-in email is matched to a user record in
  the store to resolve the current user and their role.
- Security rules live in `firestore.rules`: reads are public (for browsing),
  writes require an authenticated `@iub.edu.bd` user.
- **Demo mode:** if no Firebase config is present (see below), the app falls back to
  a local seeded demo store with no persistence, so it still runs offline.

## Repository structure

- `src/app/` — frontend app, pages, components, context, utilities
- `src/app/lib/firebase.ts` — Firebase initialization
- `src/app/services/` — auth, state (Firestore), and member service layers
- `firebase.json`, `.firebaserc` — Firebase Hosting + project config
- `firestore.rules`, `firestore.indexes.json` — Firestore security rules and indexes
- `public/` — static assets

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure Firebase

Copy `.env.example` to `.env` and fill in your Firebase web app config
(Firebase console → Project settings → Your apps → Web app → SDK config):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> `.env` is gitignored. These `VITE_*` values are safe to ship in the client bundle —
> Firebase security is enforced by Auth + Firestore rules, not by hiding them.
> If `.env` is omitted, the app runs in local demo mode.

Enable **Email/Password** sign-in and create a **Firestore** database (default) in the
Firebase console before first use.

### 3) Run in development

```bash
npm run dev
```

### 4) Build for production

```bash
npm run build
```

## Deployment

Deploy Firestore rules and the built site to Firebase Hosting:

```bash
npm run deploy
```

> PowerShell blocks `npm`/`npx`/`firebase` `.ps1` shims by execution policy. If affected,
> invoke the tools via their Node entry points instead:
>
> ```powershell
> node .\node_modules\vite\bin\vite.js build
> node .\node_modules\firebase-tools\lib\bin\firebase.js deploy --project iub-event-management
> ```

## First run

Open the app and **register** with an `@iub.edu.bd` email. The first sign-up creates the
Firebase Auth account and seeds Firestore with the app data. To grant yourself super-admin,
edit that user's `role` to `super_admin` in the Firestore console
(`appState/main` → `store.users`).

## Demo accounts

When running in **demo mode** (no Firebase config), these seeded users are available:

- Admin: `admin@iub.edu.bd` / `Admin@12345`
- Club admin: `shoikat.azad@iub.edu.bd` / `Club@12345`
- Student: `anika.rahman@iub.edu.bd` / `Student@12345`

## License

This project is for educational/demo purposes.
