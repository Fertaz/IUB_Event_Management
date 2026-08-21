// noinspection SqlNoDataSourceInspection,SqlResolve
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { initialState } from "../src/app/lib/store";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "iub-event-management.sqlite");

const ROLE_PASSWORDS = {
  student: "Student@12345",
  club_admin: "Club@12345",
  super_admin: "Admin@12345",
};

const TARGET_USER_COUNT = 200;
const FIRST_NAMES = [
  "Ayaan",
  "Nabila",
  "Farhan",
  "Tasnina",
  "Rahim",
  "Mahi",
  "Nafisa",
  "Imran",
  "Sadia",
  "Tanim",
  "Nusrat",
  "Rafi",
  "Areeba",
  "Shihab",
  "Meher",
  "Rahat",
  "Mim",
  "Samin",
  "Afsana",
  "Hasib",
];
const LAST_NAMES = [
  "Hossain",
  "Ahmed",
  "Rahman",
  "Chowdhury",
  "Sarkar",
  "Khan",
  "Islam",
  "Akter",
  "Azad",
  "Mahmud",
  "Begum",
  "Amin",
  "Tasnim",
  "Jahan",
  "Nahar",
  "Khatun",
  "Kabir",
  "Araf",
  "Molla",
  "Parvez",
];
const DEPARTMENTS = ["CSE", "EEE", "BBA", "ENG", "Economics", "Architecture"];

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function passwordForUser(user) {
  return sha256(ROLE_PASSWORDS[user.role] ?? "Student@12345");
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildSyntheticUser(index) {
  const first = FIRST_NAMES[(index - 1) % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor((index - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
  const name = `${first} ${last}`;
  const department = DEPARTMENTS[(index - 1) % DEPARTMENTS.length];
  return {
    id: `user_${index}`,
    email: `${slugify(first)}.${slugify(last)}.${String(index).padStart(3, "0")}@iub.edu.bd`,
    name,
    student_id: `24${String(index).padStart(5, "0")}`,
    department,
    role: "student",
    avatar: null,
    bio: `${department} student at IUB.`,
    password_hash: sha256("Student@12345"),
  };
}

function toInt(value) {
  return value ? 1 : 0;
}

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  return JSON.parse(value);
}

function rowToUser(row) {
  const { password_hash, ...user } = row;
  return user;
}

function rowToEvent(row) {
  return {
    ...row,
    tags: parseJson(row.tags_json, []),
    exception_dates: parseJson(row.exception_dates_json, undefined),
  };
}

function rowToRegistration(row) {
  return {
    ...row,
    checked_in: row.checked_in ? true : undefined,
  };
}

function rowToMembership(row) {
  return {
    ...row,
    permissions: parseJson(row.permissions, undefined),
  };
}

function rowToNotification(row) {
  return {
    ...row,
    is_read: Boolean(row.is_read),
  };
}

function rowToRoleRequest(row) {
  return row;
}

function nextId(db, table, prefix) {
  const row = db
    .prepare(
      `SELECT id FROM ${table}
       WHERE id LIKE ?
       ORDER BY CAST(SUBSTR(id, ?) AS INTEGER) DESC
       LIMIT 1`,
    )
    .get(`${prefix}%`, prefix.length + 1);
  const current = row?.id ? Number.parseInt(row.id.slice(prefix.length), 10) : 0;
  return `${prefix}${current + 1}`;
}

function createSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      admin_user_id TEXT NOT NULL,
      member_count INTEGER NOT NULL,
      cover_url TEXT NOT NULL,
      founded TEXT NOT NULL,
      contact_email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      registered_count INTEGER NOT NULL,
      waitlisted_count INTEGER NOT NULL,
      poster_url TEXT NOT NULL,
      status TEXT NOT NULL,
      club_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      recurrence TEXT,
      recurrence_count INTEGER,
      exception_dates_json TEXT
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      status TEXT NOT NULL,
      registered_at TEXT NOT NULL,
      checked_in INTEGER NOT NULL DEFAULT 0,
      checked_in_at TEXT
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      club_id TEXT NOT NULL,
      status TEXT NOT NULL,
      applied_at TEXT NOT NULL,
      role TEXT,
      committee_type TEXT,
      permissions TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      event_id TEXT,
      club_id TEXT
    );

    CREATE TABLE IF NOT EXISTS role_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      requested_role TEXT NOT NULL,
      club_id TEXT,
      club_name TEXT,
      club_category TEXT,
      club_description TEXT,
      message TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- committee_role_catalog: enforced max per exec role
    CREATE TABLE IF NOT EXISTS committee_role_catalog (
      role_name TEXT PRIMARY KEY,
      max_count INTEGER NOT NULL
    );

    -- member_permissions: RBAC permission tags per user per club
    CREATE TABLE IF NOT EXISTS member_permissions (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'club',
      granted_at TEXT NOT NULL,
      UNIQUE (club_id, user_id, permission)
    );

    -- event_access: sub-committee member access to specific events
    CREATE TABLE IF NOT EXISTS event_access (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('viewer','manager','organizer')),
      granted_by TEXT NOT NULL,
      granted_at TEXT NOT NULL,
      UNIQUE (club_id, event_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_memberships_club ON memberships(club_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_club_role ON memberships(club_id, role);
    CREATE INDEX IF NOT EXISTS idx_member_permissions_user ON member_permissions(user_id, club_id);
    CREATE INDEX IF NOT EXISTS idx_event_access_user ON event_access(user_id, club_id);
  `);
}

function seedRoleCatalog(db) {
  const roles = [
    ["President", 1],
    ["Vice President", 2],
    ["General Secretary", 1],
    ["Treasurer", 1],
    ["Organizing Secretary", 1],
    ["Event Manager", 999],
    ["Member", 999],
  ];
  const upsert = db.prepare(
    "INSERT OR IGNORE INTO committee_role_catalog (role_name, max_count) VALUES (?, ?)",
  );
  for (const [name, max] of roles) upsert.run(name, max);
}

function seedIfEmpty(db) {
  const hasUsers = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const insert = {
    users: db.prepare(`
      INSERT INTO users (id, email, name, student_id, department, role, avatar, bio, password_hash)
      VALUES (@id, @email, @name, @student_id, @department, @role, @avatar, @bio, @password_hash)
    `),
    clubs: db.prepare(`
      INSERT INTO clubs (id, name, short_name, description, category, admin_user_id, member_count, cover_url, founded, contact_email)
      VALUES (@id, @name, @short_name, @description, @category, @admin_user_id, @member_count, @cover_url, @founded, @contact_email)
    `),
    events: db.prepare(`
      INSERT INTO events (id, title, description, date, start_time, end_time, venue, capacity, registered_count, waitlisted_count, poster_url, status, club_id, created_by, tags_json, recurrence, recurrence_count, exception_dates_json)
      VALUES (@id, @title, @description, @date, @start_time, @end_time, @venue, @capacity, @registered_count, @waitlisted_count, @poster_url, @status, @club_id, @created_by, @tags_json, @recurrence, @recurrence_count, @exception_dates_json)
    `),
    registrations: db.prepare(`
      INSERT INTO registrations (id, user_id, event_id, status, registered_at, checked_in, checked_in_at)
      VALUES (@id, @user_id, @event_id, @status, @registered_at, @checked_in, @checked_in_at)
    `),
    memberships: db.prepare(`
      INSERT INTO memberships (id, user_id, club_id, status, applied_at, role, committee_type, permissions)
      VALUES (@id, @user_id, @club_id, @status, @applied_at, @role, @committee_type, @permissions)
    `),
    notifications: db.prepare(`
      INSERT INTO notifications (id, user_id, type, message, is_read, created_at, event_id, club_id)
      VALUES (@id, @user_id, @type, @message, @is_read, @created_at, @event_id, @club_id)
    `),
    roleRequests: db.prepare(`
      INSERT INTO role_requests (id, user_id, kind, requested_role, club_id, club_name, club_category, club_description, message, status, created_at)
      VALUES (@id, @user_id, @kind, @requested_role, @club_id, @club_name, @club_category, @club_description, @message, @status, @created_at)
    `),
  };

  db.exec("BEGIN");
  try {
    if (hasUsers === 0) {
        insert.users.run({
          ...user,
          avatar: user.avatar ?? null,
          bio: user.bio ?? null,
          password_hash: passwordForUser(user),
        });
      }

      for (const club of initialState.clubs) {
        insert.clubs.run(club);
      }

      for (const event of initialState.events) {
        const { tags, exception_dates, ...eventRow } = event;
        insert.events.run({
          ...eventRow,
          tags_json: JSON.stringify(tags ?? []),
          recurrence: eventRow.recurrence ?? null,
          recurrence_count: eventRow.recurrence_count ?? null,
          exception_dates_json: exception_dates
            ? JSON.stringify(exception_dates)
            : null,
        });
      }

      for (const reg of initialState.registrations) {
        insert.registrations.run({
          ...reg,
          checked_in: toInt(reg.checked_in),
          checked_in_at: reg.checked_in_at ?? null,
        });
      }

      for (const membership of initialState.memberships) {
        insert.memberships.run({
          ...membership,
          role: membership.role ?? null,
          committee_type: membership.committee_type ?? null,
          permissions: membership.permissions ? JSON.stringify(membership.permissions) : null,
        });
      }

      for (const notification of initialState.notifications) {
        insert.notifications.run({
          ...notification,
          is_read: toInt(notification.is_read),
          event_id: notification.event_id ?? null,
          club_id: notification.club_id ?? null,
        });
      }

      for (const roleRequest of initialState.roleRequests) {
        insert.roleRequests.run({
          ...roleRequest,
          club_id: roleRequest.club_id ?? null,
          club_name: roleRequest.club_name ?? null,
          club_category: roleRequest.club_category ?? null,
          club_description: roleRequest.club_description ?? null,
          message: roleRequest.message ?? null,
        });
      }

      db.prepare(
        "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('current_user_id', '')",
      ).run();
    }

    while (
      db.prepare("SELECT COUNT(*) AS count FROM users").get().count <
      TARGET_USER_COUNT
    ) {
      const nextUserId = nextId(db, "users", "user_");
      const numericId = Number.parseInt(nextUserId.slice(5), 10);
      insert.users.run(buildSyntheticUser(numericId));
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(dbPath);
  createSchema(db);
  migrateSchema(db);
  seedRoleCatalog(db);
  seedIfEmpty(db);
  syncAllClubMemberCounts(db);
  return db;
}

export function readCurrentUserId(db) {
  const row = db
    .prepare("SELECT value FROM app_meta WHERE key = 'current_user_id'")
    .get();
  return row?.value || "";
}

export function writeCurrentUserId(db, userId) {
  db.prepare(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('current_user_id', ?)",
  ).run(userId || "");
}

export function loadSnapshot(db) {
  // Sync club member_count from actual approved memberships before returning.
  syncAllClubMemberCounts(db);

  const users = db.prepare("SELECT * FROM users ORDER BY id").all().map(rowToUser);
  const clubs = db.prepare("SELECT * FROM clubs ORDER BY id").all();
  const events = db.prepare("SELECT * FROM events ORDER BY id").all().map(rowToEvent);
  const registrations = db
    .prepare("SELECT * FROM registrations ORDER BY id")
    .all()
    .map(rowToRegistration);
  const memberships = db
    .prepare("SELECT * FROM memberships ORDER BY id")
    .all()
    .map(rowToMembership);
  const notifications = db
    .prepare("SELECT * FROM notifications ORDER BY id")
    .all()
    .map(rowToNotification);
  const roleRequests = db
    .prepare("SELECT * FROM role_requests ORDER BY id")
    .all()
    .map(rowToRoleRequest);

  return {
    store: {
      users,
      clubs,
      events,
      registrations,
      memberships,
      notifications,
      roleRequests,
      currentUserId: readCurrentUserId(db),
    },
    currentUserId: readCurrentUserId(db) || null,
  };
}

export function saveSnapshot(db, snapshot) {
  const currentUserId =
    snapshot.currentUserId ?? snapshot.store?.currentUserId ?? "";
  const passwordHashes = new Map(
    db
      .prepare("SELECT id, email, password_hash FROM users")
      .all()
      .flatMap((row) => [
        [row.id, row.password_hash],
        [row.email, row.password_hash],
      ]),
  );

  db.exec("BEGIN");
  try {
    db.exec(`
      DELETE FROM registrations;
      DELETE FROM memberships;
      DELETE FROM notifications;
      DELETE FROM role_requests;
      DELETE FROM events;
      DELETE FROM clubs;
      DELETE FROM users;
    `);

    const insert = {
      users: db.prepare(`
        INSERT INTO users (id, email, name, student_id, department, role, avatar, bio, password_hash)
        VALUES (@id, @email, @name, @student_id, @department, @role, @avatar, @bio, @password_hash)
      `),
      clubs: db.prepare(`
        INSERT INTO clubs (id, name, short_name, description, category, admin_user_id, member_count, cover_url, founded, contact_email)
        VALUES (@id, @name, @short_name, @description, @category, @admin_user_id, @member_count, @cover_url, @founded, @contact_email)
      `),
      events: db.prepare(`
        INSERT INTO events (id, title, description, date, start_time, end_time, venue, capacity, registered_count, waitlisted_count, poster_url, status, club_id, created_by, tags_json, recurrence, recurrence_count, exception_dates_json)
        VALUES (@id, @title, @description, @date, @start_time, @end_time, @venue, @capacity, @registered_count, @waitlisted_count, @poster_url, @status, @club_id, @created_by, @tags_json, @recurrence, @recurrence_count, @exception_dates_json)
      `),
      registrations: db.prepare(`
        INSERT INTO registrations (id, user_id, event_id, status, registered_at, checked_in, checked_in_at)
        VALUES (@id, @user_id, @event_id, @status, @registered_at, @checked_in, @checked_in_at)
      `),
      memberships: db.prepare(`
        INSERT INTO memberships (id, user_id, club_id, status, applied_at, role, committee_type, permissions)
        VALUES (@id, @user_id, @club_id, @status, @applied_at, @role, @committee_type, @permissions)
      `),
      notifications: db.prepare(`
        INSERT INTO notifications (id, user_id, type, message, is_read, created_at, event_id, club_id)
        VALUES (@id, @user_id, @type, @message, @is_read, @created_at, @event_id, @club_id)
      `),
      roleRequests: db.prepare(`
        INSERT INTO role_requests (id, user_id, kind, requested_role, club_id, club_name, club_category, club_description, message, status, created_at)
        VALUES (@id, @user_id, @kind, @requested_role, @club_id, @club_name, @club_category, @club_description, @message, @status, @created_at)
      `),
    };

    for (const user of snapshot.store.users) {
      insert.users.run({
        ...user,
        avatar: user.avatar ?? null,
        bio: user.bio ?? null,
        password_hash:
          passwordHashes.get(user.id) ??
          passwordHashes.get(user.email) ??
          passwordForUser(user),
      });
    }
    for (const club of snapshot.store.clubs) {
      insert.clubs.run(club);
    }
    for (const event of snapshot.store.events) {
      const { tags, exception_dates, ...eventRow } = event;
      insert.events.run({
        ...eventRow,
        tags_json: JSON.stringify(tags ?? []),
        recurrence: eventRow.recurrence ?? null,
        recurrence_count: eventRow.recurrence_count ?? null,
        exception_dates_json: exception_dates
          ? JSON.stringify(exception_dates)
          : null,
      });
    }
    for (const reg of snapshot.store.registrations) {
      insert.registrations.run({
        ...reg,
        checked_in: toInt(reg.checked_in),
        checked_in_at: reg.checked_in_at ?? null,
      });
    }
    for (const membership of snapshot.store.memberships) {
      insert.memberships.run({
        ...membership,
        role: membership.role ?? null,
        committee_type: membership.committee_type ?? null,
        permissions: membership.permissions ? JSON.stringify(membership.permissions) : null,
      });
    }
    for (const notification of snapshot.store.notifications) {
      insert.notifications.run({
        ...notification,
        is_read: toInt(notification.is_read),
        event_id: notification.event_id ?? null,
        club_id: notification.club_id ?? null,
      });
    }
    for (const roleRequest of snapshot.store.roleRequests) {
      insert.roleRequests.run({
        ...roleRequest,
        club_id: roleRequest.club_id ?? null,
        club_name: roleRequest.club_name ?? null,
        club_category: roleRequest.club_category ?? null,
        club_description: roleRequest.club_description ?? null,
        message: roleRequest.message ?? null,
      });
    }

    writeCurrentUserId(db, currentUserId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function findUserByEmail(db, email) {
  return db
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1")
    .get(email);
}

export function verifyPassword(userRow, password) {
  return userRow?.password_hash === sha256(password);
}

export function createSession(db, userId) {
  const token = crypto.randomUUID();
  db.prepare(
    "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
  ).run(token, userId, new Date().toISOString());
  writeCurrentUserId(db, userId);
  return token;
}

export function deleteSession(db, token) {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function createUserRecord(db, payload) {
  const id = nextId(db, "users", "user_");
  db.prepare(`
    INSERT INTO users (id, email, name, student_id, department, role, avatar, bio, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    payload.email,
    payload.name,
    payload.student_id,
    payload.department,
    "student",
    null,
    null,
    sha256(payload.password),
  );
  return id;
}

// ─── Schema Migration ─────────────────────────────────────────────────────────

/**
 * Adds columns introduced after the initial schema was deployed.
 * Safe to re-run — each ALTER TABLE is wrapped in a try/catch.
 */
export function migrateSchema(db) {
  const migrations = [
    "ALTER TABLE memberships ADD COLUMN committee_type TEXT",
    "ALTER TABLE memberships ADD COLUMN permissions TEXT",
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists — ignore.
    }
  }
}

// ─── Member CRUD API functions ────────────────────────────────────────────────

/**
 * Returns all memberships for a club with the joined user record.
 * member_count on the club is computed from actual approved rows.
 */
export function listClubMembers(db, clubId) {
  const memberships = db
    .prepare(
      `SELECT m.*, u.name, u.email, u.student_id, u.department, u.avatar
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.club_id = ?
       ORDER BY m.applied_at ASC`,
    )
    .all(clubId);

  return memberships.map((row) => ({
    ...row,
    permissions: parseJson(row.permissions, undefined),
  }));
}

/**
 * Returns the true approved-member count for a club directly from the DB.
 */
export function getClubMemberCount(db, clubId) {
  return db
    .prepare(
      "SELECT COUNT(*) AS count FROM memberships WHERE club_id = ? AND status = 'approved'",
    )
    .get(clubId).count;
}

/**
 * Syncs club.member_count for ALL clubs so the dashboard stat matches the DB.
 */
export function syncAllClubMemberCounts(db) {
  const counts = db
    .prepare(
      `SELECT club_id, COUNT(*) AS cnt
       FROM memberships WHERE status = 'approved'
       GROUP BY club_id`,
    )
    .all();

  const update = db.prepare(
    "UPDATE clubs SET member_count = ? WHERE id = ?",
  );
  db.exec("BEGIN");
  try {
    // Reset all to 0 first
    db.exec("UPDATE clubs SET member_count = 0");
    for (const row of counts) {
      update.run(row.cnt, row.club_id);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Updates a membership's role and committee_type, enforcing exec role limits.
 * Throws if the target exec role is already at its maximum for the club.
 */
export function updateMembershipRole(db, membershipId, newRole) {
  const EXEC_ROLE_LIMITS = {
    President: 1,
    "Vice President": 2,
    "General Secretary": 1,
    Treasurer: 1,
    "Organizing Secretary": 1,
  };
  const EXEC_ROLES = Object.keys(EXEC_ROLE_LIMITS);

  const mem = db
    .prepare("SELECT * FROM memberships WHERE id = ?")
    .get(membershipId);
  if (!mem || mem.status !== "approved") {
    throw new Error("Membership not found or not approved.");
  }

  const limit = EXEC_ROLE_LIMITS[newRole];
  if (limit !== undefined) {
    const { count } = db
      .prepare(
        "SELECT COUNT(*) AS count FROM memberships WHERE club_id = ? AND status = 'approved' AND role = ? AND id != ?",
      )
      .get(mem.club_id, newRole, membershipId);
    if (count >= limit) {
      throw new Error(
        `Role "${newRole}" is already at its maximum (${limit}) for this club.`,
      );
    }
  }

  const isExec = EXEC_ROLES.includes(newRole);
  const committeeType = isExec ? "executive" : "sub_committee";
  const permissions = isExec
    ? JSON.stringify(["manage_events", "manage_members", "view_reports"])
    : newRole === "Event Manager"
      ? JSON.stringify(["manage_events", "view_reports"])
      : JSON.stringify(["view_reports"]);

  db.prepare(
    "UPDATE memberships SET role = ?, committee_type = ?, permissions = ? WHERE id = ?",
  ).run(newRole, committeeType, permissions, membershipId);
}

/**
 * Randomly assigns exec + sub-committee roles to all approved members of
 * a club, strictly enforcing EXEC_ROLE_LIMITS before filling sub-committee.
 */
export function assignRolesForClub(db, clubId) {
  const EXEC_ROLE_QUEUE = [
    "President",
    "Vice President",
    "Vice President",
    "General Secretary",
    "Treasurer",
    "Organizing Secretary",
  ];

  const club = db.prepare("SELECT * FROM clubs WHERE id = ?").get(clubId);
  if (!club) throw new Error("Club not found.");

  const members = db
    .prepare(
      "SELECT * FROM memberships WHERE club_id = ? AND status = 'approved' ORDER BY applied_at ASC",
    )
    .all(clubId);
  if (members.length === 0) return;

  // Fisher-Yates shuffle
  const shuffled = [...members];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Ensure club admin is first so they get President
  const adminIdx = shuffled.findIndex((m) => m.user_id === club.admin_user_id);
  if (adminIdx > 0) {
    const [admin] = shuffled.splice(adminIdx, 1);
    shuffled.unshift(admin);
  }

  const EXEC_ROLES = [
    "President",
    "Vice President",
    "General Secretary",
    "Treasurer",
    "Organizing Secretary",
  ];

  const update = db.prepare(
    "UPDATE memberships SET role = ?, committee_type = ?, permissions = ? WHERE id = ?",
  );

  db.exec("BEGIN");
  try {
    let execIdx = 0;
    for (const mem of shuffled) {
      let role, committeeType, permissions;
      if (execIdx < EXEC_ROLE_QUEUE.length) {
        role = EXEC_ROLE_QUEUE[execIdx++];
        committeeType = "executive";
        permissions = JSON.stringify(["manage_events", "manage_members", "view_reports"]);
      } else {
        const isEventManager = shuffled.indexOf(mem) % 2 === 0;
        role = isEventManager ? "Event Manager" : "Member";
        committeeType = "sub_committee";
        permissions = isEventManager
          ? JSON.stringify(["manage_events", "view_reports"])
          : JSON.stringify(["view_reports"]);
      }
      update.run(role, committeeType, permissions, mem.id);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * Deletes a single membership record (remove member from club).
 * Also updates the club's member_count.
 */
export function deleteMembership(db, membershipId) {
  const mem = db
    .prepare("SELECT * FROM memberships WHERE id = ?")
    .get(membershipId);
  if (!mem) throw new Error("Membership not found.");

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM memberships WHERE id = ?").run(membershipId);
    if (mem.status === "approved") {
      db.prepare(
        "UPDATE clubs SET member_count = MAX(0, member_count - 1) WHERE id = ?",
      ).run(mem.club_id);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
