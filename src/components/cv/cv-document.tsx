import type { ReactNode } from "react";

/**
 * The CV document itself — a sheet of paper, not a dashboard panel.
 *
 * Deliberately light-on-white rather than the app's dark terminal theme: a CV is a
 * printed document, and it is the one screen in this product that is meant to leave
 * the screen. Rendering it as paper also means printing needs no colour overrides —
 * what you see on this sheet is what comes out of the printer.
 *
 * Sans-serif, again on purpose. The rest of the app is monospace because it is a
 * terminal; an academic CV in monospace reads as a bug report.
 */

export interface CvEducation {
  school: string;
  qualification: string;
  years: string;
  grade: string;
}

export interface CvDetails {
  email: string;
  phone: string;
  city: string;
  summary: string;
  education: CvEducation[];
  skills: string;
  languages: string;
}

export interface CvEntry {
  kind: string;
  title: string;
  org?: string;
  years?: string;
  hours?: string;
  description?: string;
}

export interface CvScore {
  label: string;
  value: string;
}

const KIND_LABEL: Record<string, string> = {
  work: "Work & internships",
  activity: "Extracurricular activities",
  award: "Awards & honours",
  volunteering: "Volunteering",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="border-b border-neutral-300 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function CvDocument({
  name,
  level,
  details,
  scores,
  entries,
}: {
  name: string;
  level: string;
  details: CvDetails;
  scores: CvScore[];
  entries: CvEntry[];
}) {
  const contact = [details.email, details.phone, details.city].filter(Boolean);

  const byKind = (kind: string) => entries.filter((e) => e.kind === kind);
  const order = ["work", "activity", "volunteering", "award"];

  return (
    <article className="cv-sheet mx-auto max-w-[820px] bg-white p-10 font-sans text-neutral-900 shadow-xl print:max-w-none print:p-0 print:shadow-none">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{name || "Your name"}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {level === "master's" ? "Graduate applicant" : "Undergraduate applicant"}
        </p>
        {contact.length > 0 && (
          <p className="mt-2 text-sm text-neutral-700">{contact.join("  ·  ")}</p>
        )}
      </header>

      {details.summary && (
        <Section title="Profile">
          <p className="text-sm leading-relaxed">{details.summary}</p>
        </Section>
      )}

      {details.education.some((e) => e.school || e.qualification) && (
        <Section title="Education">
          <ul className="space-y-3">
            {details.education
              .filter((e) => e.school || e.qualification)
              .map((e, i) => (
                <li key={i} className="text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{e.school}</span>
                    <span className="text-neutral-500">{e.years}</span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-neutral-700">
                    <span>{e.qualification}</span>
                    <span>{e.grade}</span>
                  </div>
                </li>
              ))}
          </ul>
        </Section>
      )}

      {scores.length > 0 && (
        <Section title="Test scores">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
            {scores.map((s) => (
              <li key={s.label} className="flex justify-between gap-3">
                <span className="text-neutral-600">{s.label}</span>
                <span className="font-semibold">{s.value}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {order.map((kind) => {
        const list = byKind(kind);
        if (list.length === 0) return null;
        return (
          <Section key={kind} title={KIND_LABEL[kind] ?? kind}>
            <ul className="space-y-3">
              {list.map((e, i) => (
                <li key={i} className="text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{e.title}</span>
                    <span className="text-neutral-500">{e.years}</span>
                  </div>
                  {(e.org || e.hours) && (
                    <div className="text-neutral-600">
                      {[e.org, e.hours ? `${e.hours} hrs/week` : null].filter(Boolean).join("  ·  ")}
                    </div>
                  )}
                  {e.description && <p className="mt-1 leading-relaxed">{e.description}</p>}
                </li>
              ))}
            </ul>
          </Section>
        );
      })}

      {(details.skills || details.languages) && (
        <Section title="Skills & languages">
          <ul className="space-y-1 text-sm">
            {details.skills && (
              <li>
                <span className="text-neutral-600">Skills: </span>
                {details.skills}
              </li>
            )}
            {details.languages && (
              <li>
                <span className="text-neutral-600">Languages: </span>
                {details.languages}
              </li>
            )}
          </ul>
        </Section>
      )}

      {entries.length === 0 && details.education.every((e) => !e.school) && (
        <p className="mt-8 rounded border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
          Nothing to show yet — fill in the form, and add activities, awards and work on the portfolio tab.
          They appear here automatically.
        </p>
      )}
    </article>
  );
}
