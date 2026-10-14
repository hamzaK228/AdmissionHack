/**
 * Export deadlines to a downloadable .ics calendar file.
 *
 * RFC 5545-ish — good enough for Apple Calendar, Google Calendar and Outlook.
 */

function escapeIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@admissionhack`;
}

function icsDate(iso: string) {
  // ICS dates are YYYYMMDD for all-day events
  return iso.replace(/-/g, "");
}

export function downloadIcs(deadlines: { title: string; date: string }[]) {
  if (deadlines.length === 0) return;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AdmissionHack//Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:AdmissionHack Deadlines",
  ];

  for (const d of deadlines) {
    const dt = icsDate(d.date);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${escapeIcs(d.title)}`,
      `DESCRIPTION:${escapeIcs("Tracked in AdmissionHack — admissionhack-seven.vercel.app")}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 says lines must be <= 75 octets; fold long lines with CRLF + space
  const folded = lines
    .map((l) => {
      if (l.length <= 72) return l;
      const out: string[] = [];
      let rest = l;
      while (rest.length > 72) {
        out.push(rest.slice(0, 72));
        rest = " " + rest.slice(72);
      }
      out.push(rest);
      return out.join("\r\n");
    })
    .join("\r\n");

  const blob = new Blob([folded], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "admissionhack-deadlines.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
