# IUB Event & Club Management System

A web-based campus activity management platform developed for **Independent University, Bangladesh (IUB)**. It brings student clubs, events, registrations, memberships, notifications, and administrative workflows together in one centralized application.

**Live website:** https://iub-event-management.web.app

## Project overview

Information about university clubs and campus events is often scattered across different platforms and communication channels. This project gives IUB students and club organizers a single place to discover events, join clubs, register for activities, and manage extracurricular operations.

The platform is designed for:

- IUB students
- Event coordinators
- Club administrators
- System administrators

Account registration is restricted to users with a valid `@iub.edu.bd` email address.

## Core features

### Authentication and profiles

- Email/password authentication through Firebase Authentication
- Registration restricted to the IUB email domain
- Protected routes and role-based permissions
- User profiles with academic and personal information
- Password-reset support
- Local demo mode when Firebase is not configured

### Event discovery and registration

Students can:

- Browse and search published campus events
- View event dates, times, venues, organizers, and available capacity
- Submit contact information through an event registration form
- Join the waitlist when an event reaches capacity
- Cancel a registration or waitlist entry
- View registration status from their dashboard
- Present a personal QR code for event check-in

The registration workflow prevents duplicate entries and keeps confirmed and waitlisted attendees separate. Event organizers can view attendee rosters, monitor capacity, and record check-ins.

### Club discovery and membership

Students can explore university clubs, view club details, and submit membership applications containing their contact information and motivation.

Club administrators can:

- Review, approve, or reject membership applications
- Manage approved members
- Assign club-level roles and committee positions
- Organize club events
- View event attendees and check-in statistics

### Event management

Authorized club administrators and coordinators can:

- Create, edit, publish, and cancel events
- Set event dates, start and end times, venues, and capacities
- Add event descriptions, tags, and promotional images
- Create recurring daily, weekly, or monthly events
- Define exception dates for recurring events
- Review registered and waitlisted attendees
- Check in attendees using registration QR data

Coordinators can manage event operations only for their assigned clubs. Membership and club-member administration remain restricted to club administrators.

### Dashboards

Each role receives a dashboard tailored to its responsibilities:

- **Students:** registrations, memberships, upcoming activities, and notifications
- **Coordinators:** assigned-club events, attendance, and event operations
- **Club Admins:** club statistics, events, membership requests, and member management
- **Super Admins:** platform-wide users, clubs, roles, and administrative requests

### Notifications

In-app notifications keep users informed about:

- Event registrations and waitlist changes
- Event updates
- Membership decisions
- Role-request decisions
- General platform announcements

## User roles

The system uses four application roles with protected routes and role-specific capabilities.

### 1. Student

Students can:

- Browse clubs and published events
- Register for events or join waiting lists
- Apply for club membership
- View their personal dashboard
- Manage their profile
- Receive notifications
- Submit eligible club leadership or creation requests

Students cannot access administrative pages or view other students' private details.

### 2. Coordinator

Coordinators manage event operations for clubs assigned to them through the club's coordinator list.

They can:

- Create and edit events
- Manage event status and capacity
- View attendee and waitlist rosters
- Record attendee check-ins
- Monitor event performance

Coordinators cannot manage club memberships or approve member applications.

### 3. Club Admin

Club Admins manage the clubs for which they are responsible.

They can:

- Perform all club event-management tasks
- Review membership applications
- Approve or reject requests
- Manage member rosters
- Assign committee roles and permissions
- Monitor club and event statistics

Administrative permissions are limited to the relevant club or clubs.

### 4. Super Admin

The Super Admin provides system-level oversight and can:

- Monitor platform activity
- Manage users and application roles
- Review role and club-creation requests
- Oversee clubs, events, and memberships
- Manage administrative access

## Event registration flow

```text
Student opens an event
        |
        v
Completes registration form
        |
        v
System validates the request
        |
        v
System checks event capacity
       / \
      /   \
 Seat      Event
available   full
    |         |
    v         v
Registered  Waitlisted
    |         |
    +----+----+
         |
         v
Dashboard and notification updated
```

A student cannot be both registered and waitlisted for the same event, and duplicate registrations are blocked.

## Event creation flow

```text
Club Admin or Coordinator
           |
           v
    Opens event form
           |
           v
 Enters event information
           |
           v
  Saves or publishes event
           |
           v
  Event becomes available
  to the permitted audience
```

Only an authorized Club Admin or assigned Coordinator can manage an event for a club.

## Main data entities

| Entity | Purpose |
| --- | --- |
| **Users** | Stores identity, profile information, academic details, and application roles |
| **Clubs** | Stores club information and links clubs to administrators and coordinators |
| **Events** | Stores event details, capacity, publication status, recurrence, and organizer information |
| **Registrations** | Connects students to events with `registered` or `waitlisted` status and check-in data |
| **Memberships** | Connects students to clubs with `pending`, `approved`, or `rejected` status |
| **Notifications** | Stores user-specific event, membership, waitlist, role, and general updates |
| **Role requests** | Tracks requests to lead an existing club or create a new club |

## Technology stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI
- Lucide icons

### Backend and infrastructure

- Firebase Authentication for email/password identity
- Cloud Firestore for application-state persistence
- Firebase Hosting for deployment
- Firestore Security Rules for authenticated institutional writes

### Source control

- Git
- GitHub

## System architecture

```text
React + TypeScript frontend
           |
           +---- Firebase Authentication
           |
           +---- Cloud Firestore
           |       |
           |       +---- appState/main
           |
           +---- Firebase Hosting
```

The current academic prototype stores the application state as a snapshot in the Firestore document `appState/main`. Firebase Authentication provides signed-in identity, while application-level route guards and role checks control the user interface.

Firestore reads for this document are public so event and club information can be loaded, while writes require an authenticated `@iub.edu.bd` account. Because the prototype uses one shared state document, it should be migrated to per-entity collections with stricter role-based Firestore rules before use as an untrusted production system.

## Demo mode credentials

When Firebase configuration is absent, the application runs with seeded local data and no persistence.

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@iub.edu.bd` | `Admin@12345` |
| Club Admin | `shoikat.azad@iub.edu.bd` | `Club@12345` |
| Coordinator | `coordinator@iub.edu.bd` | `Coord@12345` |
| Student | `anika.rahman@iub.edu.bd` | `Student@12345` |

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- Git
- A Firebase project for persistent mode

### Setup

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` or `.env.local`.
4. Add the Firebase web configuration values:

   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

5. Start the Vite development server:

   ```bash
   npm run dev
   ```

Leave the Firebase values blank to use local demo mode.

## Build and deployment

Create a production build:

```bash
npm run build
```

Deploy the application using Firebase CLI:

```bash
npm run deploy
```

On Windows systems where PowerShell blocks `.ps1` command shims, invoke the installed tools through Node:

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\vite\bin\vite.js build
node .\node_modules\firebase-tools\lib\bin\firebase.js deploy --project iub-event-management
```

## Repository structure

```text
IUB_Event_Management/
|-- public/                  Static assets
|-- src/
|   |-- app/
|   |   |-- components/     Shared UI and layout components
|   |   |-- context/        Authentication and application-state providers
|   |   |-- lib/            Store types, business rules, and helpers
|   |   |-- pages/          Public, student, and administrative pages
|   |   `-- services/       Firebase authentication and persistence
|   `-- styles/             Global styles
|-- .env.example            Firebase environment template
|-- firebase.json           Hosting and Firestore configuration
|-- firestore.rules         Firestore access rules
|-- package.json            Scripts and dependencies
`-- README.md
```

## Project scope

The current release focuses on the core campus event and club management workflow:

- Institutional email authentication
- Role-based access control
- Club and event discovery
- Club membership applications
- Event registration and waiting lists
- Recurring event management
- Attendee rosters and QR-assisted check-in
- Club member and committee management
- Role-specific dashboards
- In-app notifications

The project does not currently include:

- Integration with IUB's academic portal or SSO
- Native Android or iOS applications
- Direct financial payment processing
- Production-grade per-entity Firestore authorization
- Email or SMS notification delivery

## Educational use

This project was developed for academic and demonstration purposes as part of **CSE 309 - Web Applications & Internet** at **Independent University, Bangladesh**.

Its goal is to demonstrate the design and implementation of a complete web application involving responsive frontend development, authentication, authorization, cloud persistence, role-driven workflows, and structured software engineering practices.
