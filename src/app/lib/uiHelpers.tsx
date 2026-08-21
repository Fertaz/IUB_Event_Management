import React from "react";
import {
  CheckCircle2,
  Hourglass,
  AlertCircle,
  UserCheck,
  BadgeCheck,
  Bell,
} from "lucide-react";
import type { Notification } from "./store";

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function capacityColor(pct: number) {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 80) return "bg-accent";
  return "bg-primary";
}

export function roleBadge(role: string) {
  const map: Record<string, string> = {
    student: "bg-secondary text-secondary-foreground",
    club_admin: "bg-accent/15 text-accent",
    super_admin: "bg-primary/15 text-primary",
  };
  return map[role] ?? "bg-muted text-muted-foreground";
}

export function categoryColor(cat: string) {
  const map: Record<string, string> = {
    Technology: "bg-primary/10 text-primary border-primary/30",
    Academic:
      "bg-secondary/15 text-secondary-foreground border-secondary/40",
    "Arts & Culture":
      "bg-accent/15 text-accent-foreground border-accent/40",
    Social:
      "bg-quaternary/15 text-foreground border-quaternary/40",
  };
  return (
    map[cat] ??
    "bg-muted text-muted-foreground border-border-soft"
  );
}

export const notifIcon = (type: Notification["type"]) => {
  const map: Record<string, React.ElementType> = {
    registration: CheckCircle2,
    waitlist: Hourglass,
    event_update: AlertCircle,
    membership: UserCheck,
    role_request: BadgeCheck,
    general: Bell,
  };
  return map[type] ?? Bell;
};

// Role badge colour: exec roles get a distinct tint.
const EXEC_ROLES = new Set([
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Organizing Secretary",
]);

export function roleBadgeClass(role: string | undefined) {
  if (!role) return "text-primary border-primary/30";
  if (EXEC_ROLES.has(role))
    return "text-quaternary border-quaternary/40 bg-quaternary/10";
  if (role === "Event Manager")
    return "text-accent border-accent/40 bg-accent/10";
  return "text-primary border-primary/30";
}
