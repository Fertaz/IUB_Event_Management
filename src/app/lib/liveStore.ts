/**
 * liveStore.ts
 *
 * A tiny bridge that lets non-React modules (e.g. memberService) read and
 * mutate the single React `store` owned by Providers. Providers registers
 * the getter/setter once on mount; any mutation flows back through React
 * state and is auto-persisted to Firestore by Providers' persist effect.
 *
 * This keeps a single source of truth (the React store) while allowing the
 * service layer to stay call-compatible with the previous backend API.
 */
import type { StoreState } from "./store";

type Getter = () => StoreState;
type Setter = (updater: (prev: StoreState) => StoreState) => void;

let getter: Getter | null = null;
let setter: Setter | null = null;

export function registerLiveStore(get: Getter, set: Setter): void {
  getter = get;
  setter = set;
}

export function getLiveStore(): StoreState {
  if (!getter) {
    throw new Error("liveStore not registered yet");
  }
  return getter();
}

/** Apply a pure mutation to the live store; returns the resulting state. */
export function mutateLiveStore(
  updater: (prev: StoreState) => StoreState,
): StoreState {
  if (!setter || !getter) {
    throw new Error("liveStore not registered yet");
  }
  const next = updater(getter());
  setter(() => next);
  return next;
}
