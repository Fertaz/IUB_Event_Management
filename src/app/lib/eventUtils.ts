// ─── Event calendar & sharing helpers ─────────────────────────────────────────
// Pure, UI-agnostic utilities for exporting events to calendars and sharing
// public event links. Used by EventDetailPage (and reusable elsewhere).

import type { Event, Club } from "@/app/lib/store";
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns";

// ─── Recurrence ───────────────────────────────────────────────────────────────
// Expand an event's recurrence rule into concrete occurrence dates ("YYYY-MM-DD"),
// honouring exception_dates. Non-recurring events return their single date.
export interface Occurrence {
  date: string;
  skipped: boolean; // true if this date is in exception_dates
}

export function getOccurrences(event: Event): Occurrence[] {
  const recurrence = event.recurrence ?? "none";
  const count = recurrence === "none" ? 1 : Math.max(1, event.recurrence_count ?? 1);
  const exceptions = new Set(event.exception_dates ?? []);
  const start = parseISO(event.date);
  const step = (i: number): Date => {
    switch (recurrence) {
      case "daily":
        return addDays(start, i);
      case "weekly":
        return addWeeks(start, i);
      case "monthly":
        return addMonths(start, i);
      default:
        return start;
    }
  };
  const out: Occurrence[] = [];
  for (let i = 0; i < count; i++) {
    const date = format(step(i), "yyyy-MM-dd");
    out.push({ date, skipped: exceptions.has(date) });
  }
  return out;
}

// Human-readable label for a recurrence rule, e.g. "Repeats weekly · 6 sessions".
export function recurrenceLabel(event: Event): string | null {
  const recurrence = event.recurrence ?? "none";
  if (recurrence === "none") return null;
  const count = event.recurrence_count ?? 1;
  const word = { daily: "daily", weekly: "weekly", monthly: "monthly" }[recurrence];
  return `Repeats ${word} · ${count} session${count > 1 ? "s" : ""}`;
}

// Format stored 24-hour times for display as 12-hour campus times.
export function formatEventTime(time: string): string {
  const match = (time || "").trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return time;

  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();

  if (period) {
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${minutes} ${period}`;
  }

  const normalizedHours = hours % 12 || 12;
  const normalizedPeriod = hours >= 12 ? "PM" : "AM";
  return `${normalizedHours}:${minutes} ${normalizedPeriod}`;
}

// Turn "2026-08-01" + "09:00" into a floating calendar timestamp "20260801T090000".
// Floating (no timezone/Z) means calendar apps interpret it in the user's local
// time, which is what we want for on-campus events.
function toStamp(date: string, time: string): string {
  const [h = "00", m = "00"] = (time || "").split(":");
  return `${date.replace(/-/g, "")}T${h.padStart(2, "0")}${m.padStart(2, "0")}00`;
}

// Escape text for inclusion in an ICS field (RFC 5545).
function icsEscape(text: string): string {
  return (text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Build a full public URL to an event's detail page (works with HashRouter).
export function eventShareUrl(eventId: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/events/${eventId}`;
}

// Build an RFC 5545 .ics document for a single event.
export function buildICS(event: Event, club?: Club): string {
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const location = club ? `${event.venue} (${club.name})` : event.venue;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IUB Campus Hub//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@iub-campus-hub`,
    `DTSTAMP:${now}`,
    `DTSTART:${toStamp(event.date, event.start_time)}`,
    `DTEND:${toStamp(event.date, event.end_time)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.description)}`,
    `LOCATION:${icsEscape(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

// Trigger a browser download of the event's .ics file.
export function downloadICS(event: Event, club?: Club): void {
  const blob = new Blob([buildICS(event, club)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^\w-]+/g, "_").toLowerCase()}.ics`;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Build a "Add to Google Calendar" URL. ctz pins the campus timezone.
export function googleCalendarUrl(event: Event, club?: Club): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toStamp(event.date, event.start_time)}/${toStamp(event.date, event.end_time)}`,
    details: event.description,
    location: club ? `${event.venue} (${club.name})` : event.venue,
    ctz: "Asia/Dhaka",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── QR check-in codes ────────────────────────────────────────────────────────
// A registration's QR encodes this opaque code; scanning/entering it checks the
// attendee in. Format: "CHK|<eventId>|<registrationId>".
export function checkInCode(eventId: string, registrationId: string): string {
  return `CHK|${eventId}|${registrationId}`;
}

// Parse a scanned/entered code back into its parts. Returns null if malformed.
export function parseCheckInCode(
  code: string
): { eventId: string; registrationId: string } | null {
  const parts = code.trim().split("|");
  if (parts.length !== 3 || parts[0] !== "CHK") return null;
  return { eventId: parts[1], registrationId: parts[2] };
}

// Share an event via the native share sheet, falling back to clipboard copy.
// Returns "shared" | "copied" | "failed" so callers can toast appropriately.
export async function shareEvent(event: Event): Promise<"shared" | "copied" | "failed"> {
  const url = eventShareUrl(event.id);
  const shareData = {
    title: event.title,
    text: `Check out "${event.title}" on IUB Campus Hub`,
    url,
  };
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(shareData);
      return "shared";
    }
  } catch (error) {
    if ((error as { name?: string }).name !== "AbortError") {
      // Share failed; fall through to clipboard.
    }
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
    return "failed";
  } catch (error) {
    return "failed";
  }
}
