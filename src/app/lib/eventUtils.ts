// ─── Event calendar & sharing helpers ─────────────────────────────────────────
// Pure, UI-agnostic utilities for exporting events to calendars and sharing
// public event links. Used by EventDetailPage (and reusable elsewhere).

import type { Event, Club } from "@/app/lib/store";

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
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  } catch {
    // user cancelled or share failed — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
