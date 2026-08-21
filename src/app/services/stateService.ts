/**
 * stateService.ts
 *
 * Persistence layer for the whole app store. Backed by a single Firestore
 * document `appState/main` that holds the entire StoreState snapshot.
 *
 * When Firebase is not configured this throws so Providers falls back to local
 * demo mode (no persistence).
 */
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { StoreState } from "@/app/lib/store";
import { db, isFirebaseConfigured } from "@/app/lib/firebase";
import { createDemoStore } from "@/app/lib/storeHelpers";

export interface AppStateSnapshot {
  store: StoreState;
  currentUserId: string | null;
}

const APP_STATE_COLLECTION = "appState";
const APP_STATE_DOC = "main";

function appStateDocRef() {
  if (!db) throw new Error("Firestore not initialised");
  return doc(db, APP_STATE_COLLECTION, APP_STATE_DOC);
}

/** Strips undefined values so Firestore accepts the snapshot cleanly. */
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Loads the app state from Firestore. On first run (document missing) it
 * returns the demo dataset in-memory WITHOUT writing — the document is created
 * on the first authenticated persist (see security rules: writes require an
 * authenticated @iub.edu.bd user).
 */
export async function fetchAppState(): Promise<AppStateSnapshot> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase not configured");
  }

  const ref = appStateDocRef();
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as AppStateSnapshot;
  }

  // First run — no document yet. Seed in-memory; it will be written to
  // Firestore by the first authenticated user action.
  return {
    store: createDemoStore(),
    currentUserId: null,
  };
}

/** Persists the whole app state snapshot to Firestore. */
export async function persistAppState(
  snapshot: AppStateSnapshot,
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase not configured");
  }
  await setDoc(appStateDocRef(), toPlain(snapshot));
}
