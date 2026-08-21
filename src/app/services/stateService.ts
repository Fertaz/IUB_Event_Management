import type { StoreState } from "@/app/lib/store";
import { apiClient } from "@/app/services/apiClient";

export interface AppStateSnapshot {
  store: StoreState;
  currentUserId: string | null;
}

export async function fetchAppState(): Promise<AppStateSnapshot> {
  return apiClient<AppStateSnapshot>("/state", {
    method: "GET",
  });
}

export async function persistAppState(
  snapshot: AppStateSnapshot,
): Promise<void> {
  await apiClient<void>("/state", {
    method: "PUT",
    body: JSON.stringify(snapshot),
  });
}
