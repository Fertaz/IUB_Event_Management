import React from "react";
import {
  Navigate
} from "react-router";

import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "club_admin" | "super_admin";
}) {
  const { currentUser, isClubAdmin, isSuperAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role === "club_admin" && !isClubAdmin)
    return <Navigate to="/dashboard" replace />;
  if (role === "super_admin" && !isSuperAdmin)
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Login ────────────────────────────────────────────────────────────────────

// ─── Auth Brand Panel (shared) ────────────────────────────────────────────────

