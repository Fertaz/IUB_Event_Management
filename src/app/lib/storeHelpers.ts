import type { StoreState } from "./store";
import { initialState, seedCounters, syncMemberCounts } from "./store";

function createEmptyStore(): StoreState {
  return {
    ...initialState,
    users: [],
    clubs: [],
    events: [],
    registrations: [],
    memberships: [],
    notifications: [],
    roleRequests: [],
    currentUserId: "",
  };
}

function cloneStore(state: StoreState): StoreState {
  return {
    ...state,
    users: state.users.map((u) => ({ ...u })),
    clubs: state.clubs.map((c) => ({ ...c })),
    events: state.events.map((e) => ({
      ...e,
      tags: [...e.tags],
      exception_dates: e.exception_dates
        ? [...e.exception_dates]
        : undefined,
    })),
    registrations: state.registrations.map((r) => ({ ...r })),
    memberships: state.memberships.map((m) => ({ ...m })),
    notifications: state.notifications.map((n) => ({ ...n })),
    roleRequests: state.roleRequests.map((r) => ({ ...r })),
  };
}

function createDemoStore(): StoreState {
  const next = cloneStore(initialState);
  next.currentUserId = "";
  seedCounters(next);
  return syncMemberCounts(next);
}

export { createEmptyStore, cloneStore, createDemoStore };
