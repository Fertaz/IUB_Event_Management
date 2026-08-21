# IUB Event & Club Management System

A web-based role-driven platform for Independent University, Bangladesh (IUB) to manage student clubs, events, registrations, and administrative workflows in one place.

**Live website:** https://iub-event-management.web.app

## What this application does

This system supports the full campus activity flow:

1. Students discover clubs and events.
2. Students submit club applications and event registration forms.
3. Coordinators manage event operations.
4. Club Admins manage club-level members and approvals.
5. Super Admins oversee the full platform and role assignments.

## Role architecture

The app has **4 roles** with strict access control:

1. **Student**
   - Can browse clubs/events.
   - Can submit club and event forms.
   - Cannot access admin pages.
   - Cannot view other students' personal details.
2. **Coordinator**
   - Manages events for assigned clubs (create/edit events, roster/check-in related flows).
   - Cannot manage club members or role approvals.
3. **Club Admin**
   - Full club operations: events + membership requests + member roster.
4. **Super Admin**
   - System-level oversight and user role management.

## Key faculty-facing features

- **Role-Based Access Control (RBAC):** users only see and access pages relevant to their role.
- **Separate dashboards:** dedicated dashboard experience for Student, Coordinator, and Club Admin workflows.
- **Student privacy controls:** student view hides other students' personal information.
- **Club Application Form:** students apply before joining a club (no instant join).
- **Event Registration Form:** students submit contact details before event registration.
- **Seat-capacity enforcement:** when seats are full, registration is blocked and UI shows **"Seats are full"**.
- **Notification and profile support:** users receive in-app updates and maintain profile information.

## Technology and backend

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + Radix UI + Lucide icons
- **Backend platform:** Firebase
  - Firestore (state persistence)
  - Firebase Authentication (email/password)
  - Firebase Hosting (deployment)

## Data and authentication model

- Authentication is restricted to `@iub.edu.bd` emails.
- Signed-in identity is mapped to a user record with role metadata.
- App state is persisted in Firestore document `appState/main`.
- Firestore rules enforce write access for authenticated institutional users.
- If Firebase config is missing, the app falls back to local **demo mode** for testing.

## Demo mode credentials

When running without Firebase configuration:

- Super Admin: `admin@iub.edu.bd` / `Admin@12345`
- Club Admin: `shoikat.azad@iub.edu.bd` / `Club@12345`
- Coordinator: `coordinator@iub.edu.bd` / `Coord@12345`
- Student: `anika.rahman@iub.edu.bd` / `Student@12345`

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and add `VITE_FIREBASE_*` values.
3. Run development server:
   ```bash
   npm run dev
   ```

## Build and deploy

PowerShell on Windows may block `.ps1` shims (`npm`/`npx`/`firebase`). Use Node entry points:

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\vite\bin\vite.js build
node .\node_modules\firebase-tools\lib\bin\firebase.js deploy --project iub-event-management
```

## Repository structure (quick map)

- `src/app/pages/` - role dashboards and feature pages
- `src/app/components/` - reusable UI and layout
- `src/app/context/` - auth and data providers
- `src/app/lib/` - store logic, role rules, helpers
- `src/app/services/` - Firebase-backed auth/state services

## Educational use

This project is built for academic and demonstration purposes.
