/**
 * memberService.ts
 *
 * Club-member operations. Previously these hit the Node backend; they now run
 * entirely against the single React `store` via the liveStore bridge, so the
 * member roster stays a derived view of the one source of truth. Every mutation
 * flows through React state and is auto-persisted to Firestore by Providers.
 *
 * The public function signatures are unchanged so MemberRosterPage keeps
 * working without edits.
 */
import type { ClubRole, Membership, StoreState, User } from "@/app/lib/store";
import {
  assignClubRoles,
  registerUser,
  removeMember,
  syncMemberCounts,
  updateMemberRole as updateMemberRoleStore,
} from "@/app/lib/store";
import { getLiveStore, mutateLiveStore } from "@/app/lib/liveStore";

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

const EXEC_ROLES: ClubRole[] = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Organizing Secretary",
];

function committeeFor(role?: string): "executive" | "sub_committee" {
  return role && EXEC_ROLES.includes(role as ClubRole)
    ? "executive"
    : "sub_committee";
}

function permissionsFor(role?: string): string[] {
  if (committeeFor(role) === "executive") {
    return ["manage_events", "manage_members", "view_reports"];
  }
  return role === "Event Manager"
    ? ["manage_events", "view_reports"]
    : ["view_reports"];
}

/** Derives the approved-member roster for a club from the store. */
function deriveMembers(
  store: StoreState,
  clubId: string,
): GetClubMembersResponse {
  const usersById = new Map(store.users.map((u) => [u.id, u]));
  const members: MemberSummary[] = store.memberships
    .filter((m) => m.club_id === clubId && m.status === "approved")
    .map((m) => {
      const u = usersById.get(m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        club_id: m.club_id,
        name: u?.name ?? "Unknown",
        email: u?.email ?? "",
        student_id: u?.student_id ?? "",
        department: u?.department ?? "",
        avatar: u?.avatar,
        status: m.status,
        role: m.role,
        committee_type: m.committee_type,
        permissions: m.permissions,
        applied_at: m.applied_at,
      };
    });

  return { clubId, totalCount: members.length, members };
}

/** Fetches members + authoritative total count derived from the store. */
export async function fetchClubMembers(
  clubId: string,
): Promise<GetClubMembersResponse> {
  return deriveMembers(getLiveStore(), clubId);
}

/** Randomly assigns executive + sub-committee roles; returns updated list. */
export async function assignRoles(
  clubId: string,
): Promise<GetClubMembersResponse> {
  const next = mutateLiveStore((s) => assignClubRoles(s, clubId));
  return deriveMembers(next, clubId);
}

/** Updates a single member's role; enforces exec-role limits. */
export async function updateMemberRole(
  _clubId: string,
  membershipId: string,
  role: string,
): Promise<{ ok: boolean }> {
  mutateLiveStore((s) => updateMemberRoleStore(s, membershipId, role as ClubRole));
  return { ok: true };
}

/** Removes a member from the club. */
export async function deleteMember(
  clubId: string,
  membershipId: string,
): Promise<{ ok: boolean; totalCount: number }> {
  const next = mutateLiveStore((s) => removeMember(s, membershipId));
  return { ok: true, totalCount: deriveMembers(next, clubId).totalCount };
}

export interface AddMemberPayload {
  name: string;
  email: string;
  student_id: string;
  department: string;
  password?: string;
  role?: string;
}

function newLocalMembershipId(): string {
  // Non-numeric suffix so it never collides with or advances the mem_<n>
  // counters in store.ts.
  return `mem_x${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Adds a user to a club as an approved member. If the email already exists the
 * existing account is linked; otherwise a new student account is created.
 */
export async function addMember(
  clubId: string,
  payload: AddMemberPayload,
): Promise<GetClubMembersResponse & { membershipId: string }> {
  const email = payload.email.trim().toLowerCase();
  const membershipId = newLocalMembershipId();

  const next = mutateLiveStore((s) => {
    let state = s;
    let user: User | undefined = state.users.find(
      (u) => u.email.toLowerCase() === email,
    );

    if (!user) {
      const created = registerUser(state, {
        name: payload.name,
        email,
        student_id: payload.student_id,
        department: payload.department,
      });
      state = created.state;
      user = state.users.find((u) => u.id === created.userId);
    }

    if (!user) return state;

    // Avoid duplicate approved memberships for the same club.
    const already = state.memberships.some(
      (m) =>
        m.user_id === user!.id &&
        m.club_id === clubId &&
        m.status === "approved",
    );
    if (already) return state;

    const role = payload.role ?? "Member";
    const membership: Membership = {
      id: membershipId,
      user_id: user.id,
      club_id: clubId,
      status: "approved",
      applied_at: new Date().toISOString(),
      role,
      committee_type: committeeFor(role),
      permissions: permissionsFor(role),
    };

    return syncMemberCounts({
      ...state,
      memberships: [...state.memberships, membership],
    });
  });

  return { ...deriveMembers(next, clubId), membershipId };
}

export interface UpdateMemberDetailsPayload {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Updates a member's user record (name and/or email). Password changes require
 * Firebase Auth on the account owner's own session and are ignored here.
 */
export async function updateMemberDetails(
  clubId: string,
  membershipId: string,
  payload: UpdateMemberDetailsPayload,
): Promise<{ ok: boolean } & GetClubMembersResponse> {
  const next = mutateLiveStore((s) => {
    const mem = s.memberships.find((m) => m.id === membershipId);
    if (!mem) return s;
    return {
      ...s,
      users: s.users.map((u) =>
        u.id === mem.user_id
          ? {
              ...u,
              ...(payload.name ? { name: payload.name } : {}),
              ...(payload.email
                ? { email: payload.email.trim().toLowerCase() }
                : {}),
            }
          : u,
      ),
    };
  });

  return { ok: true, ...deriveMembers(next, clubId) };
}

/**
 * RBAC permission map — used on the frontend to gate UI elements by role.
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
export function canAccess(
  role: string | undefined,
  permission: string,
): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}
