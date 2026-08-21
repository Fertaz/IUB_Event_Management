import http from "node:http";
import {
  createDatabase,
  createSession,
  createUserRecord,
  deleteSession,
  findUserByEmail,
  loadSnapshot,
  saveSnapshot,
  verifyPassword,
  writeCurrentUserId,
  listClubMembers,
  getClubMemberCount,
  syncAllClubMemberCounts,
  updateMembershipRole,
  assignRolesForClub,
  deleteMembership,
  addClubMember,
  updateMemberDetails,
} from "./db.mjs";

const db = createDatabase();
const port = Number(process.env.PORT ?? 8787);

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function authToken(req) {
  const header = req.headers.authorization || "";
  if (!header) return "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return header.trim();
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    });
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/auth/login") {
      const body = (await readBody(req)) || {};
      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      const user = findUserByEmail(db, email);
      if (!user || !verifyPassword(user, password)) {
        json(res, 401, { message: "Invalid email or password" });
        return;
      }
      const token = createSession(db, user.id);
      json(res, 200, { token, userId: user.id });
      return;
    }

    if (req.method === "POST" && url.pathname === "/auth/register") {
      const body = (await readBody(req)) || {};
      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      if (password.length < 8) {
        json(res, 400, { message: "Password must be at least 8 characters" });
        return;
      }
      if (!email.endsWith("@iub.edu.bd")) {
        json(res, 400, { message: "Use an @iub.edu.bd email address" });
        return;
      }
      if (findUserByEmail(db, email)) {
        json(res, 409, { message: "Email already exists" });
        return;
      }
      const userId = createUserRecord(db, {
        name: String(body.name || "").trim(),
        email,
        student_id: String(body.student_id || "").trim(),
        department: String(body.department || "").trim(),
        password,
      });
      const token = createSession(db, userId);
      json(res, 200, { token, userId });
      return;
    }

    if (req.method === "POST" && url.pathname === "/auth/logout") {
      deleteSession(db, authToken(req));
      writeCurrentUserId(db, "");
      json(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/state") {
      json(res, 200, loadSnapshot(db));
      return;
    }

    if (req.method === "PUT" && url.pathname === "/state") {
      const body = await readBody(req);
      if (!body || typeof body !== "object") {
        json(res, 400, { message: "Invalid state payload" });
        return;
      }
      saveSnapshot(db, body);
      // Keep club member_count in sync after every full state write.
      syncAllClubMemberCounts(db);
      json(res, 200, { ok: true });
      return;
    }

    // ── Member CRUD ──────────────────────────────────────────────────────────

    // GET /clubs/:clubId/members
    // Returns { clubId, totalCount, members[] } — single source of truth for
    // both the dashboard stat and the member list.
    const membersMatch = url.pathname.match(/^\/clubs\/([^/]+)\/members$/);
    if (req.method === "GET" && membersMatch) {
      const clubId = membersMatch[1];
      const members = listClubMembers(db, clubId);
      const totalCount = getClubMemberCount(db, clubId);
      json(res, 200, { clubId, totalCount, members });
      return;
    }

    // POST /clubs/:clubId/members
    // Body: { name, email, student_id, department, password?, role? }
    // Adds an existing user (by email) or creates a new user+membership.
    if (req.method === "POST" && membersMatch) {
      const clubId = membersMatch[1];
      const body = (await readBody(req)) || {};
      try {
        const membershipId = addClubMember(db, clubId, body);
        const members = listClubMembers(db, clubId);
        const totalCount = getClubMemberCount(db, clubId);
        json(res, 201, { clubId, totalCount, members, membershipId });
      } catch (err) {
        json(res, 409, {
          message: err instanceof Error ? err.message : "Add member failed",
        });
      }
      return;
    }

    // PUT /clubs/:clubId/members/:membershipId/role
    // Body: { role: ClubRole }
    const memberRoleMatch = url.pathname.match(
      /^\/clubs\/([^/]+)\/members\/([^/]+)\/role$/,
    );
    if (req.method === "PUT" && memberRoleMatch) {
      const membershipId = memberRoleMatch[2];
      const body = (await readBody(req)) || {};
      const role = String(body.role || "").trim();
      if (!role) {
        json(res, 400, { message: "role is required" });
        return;
      }
      try {
        updateMembershipRole(db, membershipId, role);
        syncAllClubMemberCounts(db);
        json(res, 200, { ok: true });
      } catch (err) {
        json(res, 409, {
          message: err instanceof Error ? err.message : "Role update failed",
        });
      }
      return;
    }

    // POST /clubs/:clubId/members/assign-roles
    // Randomly assigns exec + sub-committee roles to all approved members.
    const assignMatch = url.pathname.match(
      /^\/clubs\/([^/]+)\/members\/assign-roles$/,
    );
    if (req.method === "POST" && assignMatch) {
      const clubId = assignMatch[1];
      try {
        assignRolesForClub(db, clubId);
        const members = listClubMembers(db, clubId);
        const totalCount = getClubMemberCount(db, clubId);
        json(res, 200, { clubId, totalCount, members });
      } catch (err) {
        json(res, 400, {
          message: err instanceof Error ? err.message : "Role assignment failed",
        });
      }
      return;
    }

    // DELETE /clubs/:clubId/members/:membershipId
    // PUT    /clubs/:clubId/members/:membershipId  (update name / email / password)
    const memberDeleteMatch = url.pathname.match(
      /^\/clubs\/([^/]+)\/members\/([^/]+)$/,
    );
    if (req.method === "PUT" && memberDeleteMatch) {
      const clubId = memberDeleteMatch[1];
      const membershipId = memberDeleteMatch[2];
      const body = (await readBody(req)) || {};
      try {
        updateMemberDetails(db, membershipId, body);
        const members = listClubMembers(db, clubId);
        const totalCount = getClubMemberCount(db, clubId);
        json(res, 200, { ok: true, clubId, totalCount, members });
      } catch (err) {
        json(res, 409, {
          message: err instanceof Error ? err.message : "Update failed",
        });
      }
      return;
    }
    if (req.method === "DELETE" && memberDeleteMatch) {
      const membershipId = memberDeleteMatch[2];
      try {
        deleteMembership(db, membershipId);
        const clubId = memberDeleteMatch[1];
        const totalCount = getClubMemberCount(db, clubId);
        json(res, 200, { ok: true, totalCount });
      } catch (err) {
        json(res, 404, {
          message: err instanceof Error ? err.message : "Delete failed",
        });
      }
      return;
    }

    json(res, 404, { message: "Not found" });
  } catch (error) {
    console.error(error);
    json(res, 500, {
      message: error instanceof Error ? error.message : "Server error",
    });
  }
}

const server = http.createServer(handleRequest);

server.listen(port, () => {
  console.log(`Backend API running on http://127.0.0.1:${port}`);
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
