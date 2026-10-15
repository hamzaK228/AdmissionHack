"use client";

import { useStore, type TranslationState } from "@/components/dashboard/store";
import { CHECKLIST } from "@/data/document-checklist";
import { Eyebrow } from "@/components/ui";

/**
 * The translation tracker.
 *
 * A single checklist tick for "sworn/notarised translations" hides the whole problem,
 * and this is the step where international applicants lose time: a sworn translator
 * takes weeks, the requirement is easy to discover late, and nothing about the file
 * looks wrong until the university asks for a translation that does not exist.
 *
 * So it is a small table instead — which documents, with whom, and how far along —
 * kept next to the checklist rather than inside it, because "this document needs a
 * translation" and "this document is ready" are two different answers about the same
 * piece of paper.
 */

const TRACKABLE = ["transcripts", "diploma", "financial", "passport", "lor", "other"] as const;
type TrackableKey = (typeof TRACKABLE)[number];

const STATES: { id: TranslationState["state"]; label: string; tone: string }[] = [
  { id: "needed", label: "needs translating", tone: "text-amber" },
  { id: "ordered", label: "with a translator", tone: "text-lime" },
  { id: "received", label: "translation in hand", tone: "text-mint" },
];

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-xs text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";

/** The checklist label, minus its parenthetical, so a row stays a row. */
const labelFor = (id: TrackableKey) =>
  id === "other"
    ? "Something else"
    : (CHECKLIST.find((c) => c.id === id)?.label.replace(/\s*\(.*\)$/, "") ?? id);

export function Translations() {
  const { translations, setTranslation } = useStore();

  const tracked = TRACKABLE.filter((k) => translations[k]);
  const received = tracked.filter((k) => translations[k]?.state === "received").length;
  const outstanding = tracked.length - received;

  return (
    <section className="mt-10 rounded-2xl border border-line bg-panel/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>translations</Eyebrow>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-dim">
            Only needed when a document is not in the language of the course — and a sworn translator takes
            weeks, not days. Mark a document here once you know it needs one; leave it alone if it does not.
          </p>
        </div>
        {tracked.length > 0 && (
          <span className="shrink-0 text-xs text-dim">
            {received} of {tracked.length} in hand
            {outstanding > 0 && <span className="text-amber"> · {outstanding} outstanding</span>}
          </span>
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {TRACKABLE.map((key) => {
          const t = translations[key];
          const spec = STATES.find((s) => s.id === t?.state);
          return (
            <li key={key} className="rounded-xl border border-line bg-ink p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-paper">{labelFor(key)}</span>
                <select
                  aria-label={`translation state for ${labelFor(key)}`}
                  className={`shrink-0 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-bold outline-none focus:border-lime/60 ${spec?.tone ?? "text-dim"}`}
                  value={t?.state ?? "untracked"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "untracked") setTranslation(key, null);
                    else setTranslation(key, { ...(t ?? {}), state: v as TranslationState["state"] });
                  }}
                >
                  <option value="untracked">not needed / not tracked</option>
                  {STATES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {t && (
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  <input
                    className={inputCls}
                    placeholder="translator or agency"
                    aria-label={`translator for ${labelFor(key)}`}
                    value={t.translator ?? ""}
                    maxLength={200}
                    onChange={(e) => setTranslation(key, { ...t, translator: e.target.value || undefined })}
                  />
                  <input
                    className={inputCls}
                    placeholder="apostille? cost? lead time?"
                    aria-label={`note for ${labelFor(key)}`}
                    value={t.note ?? ""}
                    maxLength={500}
                    onChange={(e) => setTranslation(key, { ...t, note: e.target.value || undefined })}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[11px] leading-relaxed text-dim">
        Some countries additionally require an <span className="text-fog">apostille</span> or legalisation
        after translation, and it cannot be rushed — put it in the note box so you see it coming. Tick the
        checklist item on the right once the whole chain is done, not when the translation arrives.
      </p>
    </section>
  );
}
