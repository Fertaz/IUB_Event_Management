/**
 * firebase.ts
 *
 * Firebase app initialisation. Reads config from Vite env vars
 * (VITE_FIREBASE_*). When those vars are absent the app runs in
 * "demo mode" (no persistence, local seeded data) — see isFirebaseConfigured.
 *
 * Create a `.env` (or `.env.local`) with the web-app config from your Firebase
 * console (Project settings -> Your apps -> Web app -> SDK setup and config):
 *
 *   VITE_FIREBASE_API_KEY=...
 *   VITE_FIREBASE_AUTH_DOMAIN=...
 *   VITE_FIREBASE_PROJECT_ID=...
 *   VITE_FIREBASE_STORAGE_BUCKET=...
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *   VITE_FIREBASE_APP_ID=...
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as
    | string
    | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
    | string
    | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/**
 * True when the minimum required Firebase config is present. When false the
 * app falls back to local demo mode so it still builds and runs without a
 * configured project.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig as Record<string, string>);
  authInstance = getAuth(app);
  // ignoreUndefinedProperties lets us persist the store snapshot directly even
  // though some optional fields (avatar, bio, role, exception_dates…) are
  // undefined.
  dbInstance = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = dbInstance;
