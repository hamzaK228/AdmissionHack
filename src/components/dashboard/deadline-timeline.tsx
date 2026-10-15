"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { Eyebrow } from "@/components/ui";

/**
 * Every tracked date on one line.
 *
 * The rings on the list below answer "how long have I got?" — one date at a time. This answers
 * the question a list cannot: **how close the dates are to each other.** Three deadlines inside
 * the same fortnight is a different situation from three spaced over a term, and a sorted list
 * renders both identically.
 *
 * It is a timeline, not a gantt, and the difference is honesty: a gantt draws *durations*, and
 * the data has no duration to draw. An application has a status, not a start date; a document
 * has a folder, not a schedule. So this plots the dates that exist, spaced by the calendar, and
 * does not invent bars for work nobody has dated.
 *
 * No chart library: thirty deadlines is a `map` and a percentage, and a dependency would be
 * several hundred kilobytes to place thirty dots.
 */

interface Entry {
  title: string;
  date: string;
}

const DAY = 86_400_000;

/** where the timeline's axis sits, in px from the top of the plot */
const AXIS = 76;

/** Days from today; negative is in the past. */
const daysAway = (iso: string) => Math.round((new Date(iso + "T00:00:00").getTime() - Date.now()) / DAY);

const tint = (days: number) => (days < 0 ? "#3c5240" : days <= 7 ? "#f87171" : days <= 30 ? "#fbbf24" : "#c9ff4a");

const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" });

export function DeadlineTimeline({ deadlines }: { deadlines: Entry[] }) {
  const reduce = useReducedMotion();

  const model = useMemo(() => {
    const dated = deadlines
      .map((d) => ({ ...d, away: daysAway(d.date) }))
      .sort((a, b) => a.away - b.away);
    if (dated.length === 0) return null;

    // the axis runs from today to the last date, with a floor so one near date is not stretched
    // across the whole width
    const furthest = Math.max(...dated.map((d) => d.away), 1);
    const span = Math.max(furthest, 14);
    const pct = (away: number) => Math.min(100, Math.max(0, (away / span) * 100));

    // month marks, so the gaps have a scale rather than being decorative spacing
    const months: { at: number; label: string }[] = [];
    const start = new Date();
    const end = new Date(Date.now() + span * DAY);
    const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    while (cursor <= end && months.length < 14) {
      months.push({
        at: pct(Math.round((cursor.getTime() - Date.now()) / DAY)),
        label: cursor.toLocaleDateString("en-US", { month: "short" }),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { dated, span, pct, months };
  }, [deadlines]);

  if (!model) return null;
  const { dated, pct, months, span } = model;
  const nearest = dated.find((d) => d.away >= 0);
  const collision = dated.some((d) => d.away >= 0 && nearest && d.away - nearest.away <= 14 && d !== nearest);

  return (
    <section className="rounded-2xl border border-line bg-panel/70 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>the whole run, on one line</Eyebrow>
        <span className="text-[11px] text-dim">
          today → {shortDate(dated[dated.length - 1].date)} · {span} days
        </span>
      </div>

      <div className="relative mt-8 h-32">
        {/* the axis, at a fixed height: the dots sit on it, labels hang above, months below */}
        <div
          className="absolute inset-x-0 h-px origin-left bg-line2"
          style={{ top: AXIS, ...(reduce ? {} : { animation: "growX 0.7s cubic-bezier(0.23, 1, 0.32, 1) backwards" }) }}
        />
        {months.map((m) => (
          <span
            key={m.label + m.at}
            className="absolute -translate-x-1/2 text-[10px] text-dim"
            style={{ left: `${m.at}%`, top: AXIS + 8 }}
          >
            {m.label}
          </span>
        ))}
        {/* today, as the origin the reader stands on — labelled below the axis so it can never
            sit under the first deadline's label */}
        <span className="absolute w-px bg-lime/40" style={{ left: "0%", top: 26, height: AXIS - 20 }} />
        <span className="absolute text-[10px] font-bold text-lime" style={{ left: 4, top: AXIS + 8 }}>
          today
        </span>

        {dated.map((d, i) => {
          // two lanes, so labels only collide when there are genuinely more than two dates close
          const lane = i % 2 === 0 ? 0 : 1;
          const past = d.away < 0;
          const labelTop = lane === 0 ? 0 : 24;
          return (
            <div
              key={d.title + d.date}
              className="row-in absolute"
              style={{
                left: `${pct(d.away)}%`,
                top: labelTop,
                animationDelay: reduce ? undefined : `${140 + i * 45}ms`,
              }}
            >
              <span
                className="block -translate-x-1/2 whitespace-nowrap rounded-md border bg-ink px-2 py-0.5 text-[10px] font-bold"
                style={{ borderColor: tint(d.away) + "66", color: tint(d.away), opacity: past ? 0.5 : 1 }}
                title={`${d.title} — ${shortDate(d.date)}`}
              >
                {d.title.length > 26 ? d.title.slice(0, 25) + "…" : d.title}
              </span>
              {/* a tick down from the label to the dot, which sits on the axis */}
              <span
                className="absolute left-1/2 w-px -translate-x-1/2"
                style={{ background: tint(d.away) + "70", top: 20, height: AXIS - labelTop - 20 }}
              />
              <span
                className="absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: tint(d.away), top: AXIS - labelTop }}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-dim">
        {collision ? (
          <>
            The next few land inside the same fortnight — that is the part worth planning around,
            because documents and score reports take longer than people expect.
          </>
        ) : (
          <>The dates are reasonably spread. Nothing collides in the next fortnight.</>
        )}
      </p>
    </section>
  );
}
