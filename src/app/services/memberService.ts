/**
 * memberService.ts
 *
 * Single-source-of-truth member API calls.
 *
 * Every function talks to the backend so the frontend never derives
 * member counts or lists from a stale local array.
 *
 * Response shape for the member list endpoint:
 *   GET /clubs/:clubId/members
 *   → { clubId, totalCount, members: MemberSummary[] }
 *
 * This guarantees `totalCount` and the rendered list always come from
 * the same DB query — fixing the "259 members / 6 rows" divergence.
 */

import { apiClient } from "@/app/services/apiClient";

export interface MemberSummary {
  id: string;
  user_id: string;
  club_id: string;
  name: string;
  email: string;
  student_id: string;
  department: string;
  avatar?: string;
  status: string;
  role?: string;
  committee_type?: "executive" | "sub_committee";
  permissions?: string[];
  applied_at: string;
}

export interface GetClubMembersResponse {
  clubId: string;
  totalCount: number;
  members: MemberSummary[];
}

/** Fetches members + authoritative total count in one call. */
export async function fetchClubMembers(
  clubId: string,
): Promise<GetClubMembersResponse> {
  return apiClient<GetClubMembersResponse>(`/clubs/${clubId}/members`, {
    method: "GET",
  });
}

/** Assigns executive + sub-committee roles randomly; returns updated list. */
export async function assignRoles(
  clubId: string,
): Promise<GetClubMembersResponse> {
  return apiClient<GetClubMembersResponse>(
    `/clubs/${clubId}/members/assign-roles`,
    { method: "POST" },
  );
}

/** Updates a single member's role; enforces exec-role limits server-side. */
export async function updateMemberRole(
  clubId: string,
  membershipId: string,
  role: string,
): Promise<{ ok: boolean }> {
  return apiClient<{ ok: boolean }>(
    `/clubs/${clubId}/members/${membershipId}/role`,
    {
      method: "PUT",
      body: JSON.stringify({ role }),
    },
  );
}

/** Removes a member from the club. */
export async function deleteMember(
  clubId: string,
  membershipId: string,
): Promise<{ ok: boolean; totalCount: number }> {
  return apiClient<{ ok: boolean; totalCount: number }>(
    `/clubs/${clubId}/members/${membershipId}`,
    { method: "DELETE" },
  );
}

/**
 * RBAC permission map — mirrors the server-side ROLE_PERMISSIONS constant.
 * Use this on the frontend to gate UI elements by the current user's role.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  President: ["club:read", "club:write", "event:manage", "member:manage"],
  "Vice President": ["club:read", "event:manage", "member:read"],
  "General Secretary": ["club:read", "member:manage", "event:read"],
  Treasurer: ["club:read", "finance:read", "finance:write"],
  "Organizing Secretary": ["club:read", "event:manage", "member:read"],
  "Event Manager": ["event:manage", "event:read"],
  Member: ["event:read"],
};

/** Returns true if `role` grants the given `permission`. */
export function canAccess(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}
