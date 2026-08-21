
# IUB Event & Club Management | Campus Hub

This is the code repository for the IUB Campus Hub web application, designed to help students discover events, join clubs, and manage campus activities.

## Backend configuration

This app now loads and persists app state through a backend API instead of local mock persistence.

Set the API base URL by defining `window.__API_BASE_URL__` before the app loads (for example in your hosting template):

`<script>window.__API_BASE_URL__ = "https://your-backend.example.com/api";</script>`

Expected endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `GET /state`
- `PUT /state`

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  