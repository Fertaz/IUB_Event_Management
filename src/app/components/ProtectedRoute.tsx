import React from "react";
import {
  Navigate
} from "react-router";

import type { UserRole } from "../lib/store";
import { useAuth, roleHome } from "../context/AuthContext";

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  /** Allowed role(s). When omitted, any authenticated user may enter. */
  role?: UserRole | UserRole[];
}) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(currentUser.role))
      return <Navigate to={roleHome(currentUser.role)} replace />;
  }

  return <>{children}</>;
}

// ─── Login ────────────────────────────────────────────────────────────────────

// ─── Auth Brand Panel (shared) ────────────────────────────────────────────────

