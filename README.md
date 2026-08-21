
# IUB Event & Club Management | Campus Hub

This is the code repository for the IUB Campus Hub web application, designed to help students discover events, join clubs, and manage campus activities.

## Backend configuration

This app now runs against a local SQLite-backed API in development.

Expected endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `GET /state`
- `PUT /state`

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start both the backend API and the Vite client.

Demo logins:

- `admin@iub.edu.bd` / `Admin@12345`
- `shoikat.azad@iub.edu.bd` / `Club@12345`
- `anika.rahman@iub.edu.bd` / `Student@12345`
  