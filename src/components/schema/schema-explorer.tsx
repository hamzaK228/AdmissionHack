"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { useReducedMotion } from "motion/react";
import { CLUSTER_INFO, SCHEMA_FUNCTIONS, SCHEMA_TABLES, type Cluster, type SchemaTable } from "@/data/schema";
import { Eyebrow } from "@/components/ui";

/**
 * The schema, two ways.
 *
 * **The map** answers "how is this shaped" — every table as a node, every foreign key as an
 * edge, coloured by cluster. It is hand-laid-out rather than force-directed so it reads the
 * same way every time; a diagram you have to re-learn on every visit is not documentation.
 *
 * **The tables** answer "what is in it" — each table's columns, its keys, and its row policies
 * written out. That second view is the one that matters here, because the interesting thing
 * about this schema is not its columns: it is that **every personal table repeats the same
 * pair of policies**, owner-writes and counselor-reads, and the whole consent model is one
 * function being asked the same question.
 *
 * Animation is anime.js, and only where it earns its place: the edges draw themselves in, the
 * nodes arrive staggered, and the counts tick up. Anything that must survive a busy main
 * thread is CSS — see the note in `globals.css` about why.
 */

const VB = { w: 1220, h: 780 };
const NODE_W = 208;
const NODE_H = 56;

interface Point {
  x: number;
  y: number;
}

/** A gentle S-curve between two nodes, bowed horizontally so crossings stay readable. */
function edgePath(a: Point, b: Point): string {
  const bow = Math.min(150, Math.abs(b.x - a.x) * 0.42 + 24);
  const dir = b.x >= a.x ? 1 : -1;
  return `M ${a.x} ${a.y} C ${a.x + bow * dir} ${a.y}, ${b.x - bow * dir} ${b.y}, ${b.x} ${b.y}`;
}

export function SchemaExplorer() {
  const reduce = useReducedMotion();
  const [view, setView] = useState<"map" | "tables">("map");
  const [active, setActive] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [counts, setCounts] = useState({ tables: 0, keys: 0, policies: 0 });

  const byName = useMemo(() => new Map(SCHEMA_TABLES.map((t) => [t.name, t])), []);

  const totals = useMemo(() => {
    let keys = 0;
    let policies = 0;
    for (const t of SCHEMA_TABLES) {
      keys += t.columns.filter((c) => c.fk).length;
      policies += t.policies.length;
    }
    return { tables: SCHEMA_TABLES.length, keys, policies };
  }, []);

  /** every edge, as (from, to) pairs, so the map and the hover isolation agree */
  const edges = useMemo(() => {
    const out: { from: string; to: string; column: string; key: string }[] = [];
    for (const t of SCHEMA_TABLES) {
      for (const c of t.columns) {
        if (!c.fk || !byName.has(c.fk)) continue;
        out.push({ from: t.name, to: c.fk, column: c.name, key: `${t.name}.${c.name}` });
      }
    }
    return out;
  }, [byName]);

  /** the active table and everything directly joined to it, in either direction */
  const lit = useMemo(() => {
    if (!active) return null;
    const set = new Set<string>([active]);
    for (const e of edges) {
      if (e.from === active) set.add(e.to);
      if (e.to === active) set.add(e.from);
    }
    return set;
  }, [active, edges]);

  // the counts tick up rather than appearing — the first thing you read should feel measured
  useEffect(() => {
    if (reduce) {
      setCounts(totals);
      return;
    }
    const t = { n: 0 };
    const a = animate(t, {
      n: 1,
      duration: 900,
      ease: "outExpo",
      onUpdate: () =>
        setCounts({
          tables: Math.round(totals.tables * t.n),
          keys: Math.round(totals.keys * t.n),
          policies: Math.round(totals.policies * t.n),
        }),
    });
    return () => {
      a.pause();
    };
  }, [reduce, totals]);

  // the map animates when it is shown: nodes arrive, then the keys draw themselves
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || reduce || view !== "map") return;

    const paths = [...svg.querySelectorAll<SVGPathElement>("path[data-edge]")];

    /**
     * The keys draw themselves.
     *
     * `createDrawable` is the canonical anime helper for this and it produced a diagram with
     * nineteen invisible edges: it wrote `stroke-dasharray: 0px, 1010px` — a zero-length dash,
     * i.e. nothing — while every `stroke-dashoffset` read `0`, so the state *looked* finished
     * in any check that only read the offset. Measuring each path with `getTotalLength` and
     * animating its offset from its own length to zero is a few lines, and it is the real
     * geometry rather than a number anime guessed.
     *
     * Started after the nodes, so the eye reads the tables first and the relationships second.
     */
    for (const el of paths) {
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
    }
    const drawAnim = animate(paths, {
      strokeDashoffset: 0,
      duration: 900,
      ease: "outQuart",
      delay: stagger(22, { start: 220 }),
    });

    /**
     * A guarantee, not a fallback. If frames do not run — a background tab, a machine under
     * load — the offsets would stay at their hidden start and the map would be a set of boxes
     * with no relationships. Cheap insurance for a decorative reveal.
     */
    const guard = setTimeout(() => {
      for (const el of paths) el.style.strokeDashoffset = "0";
    }, 2200);

    return () => {
      drawAnim.pause();
      clearTimeout(guard);
    };
  }, [view, reduce]);

  const openTable = (name: string) => {
    setView("tables");
    setActive(name);
    // the pane remounts under `.page-enter`, so the scroll waits for it to exist
    requestAnimationFrame(() => {
      document.getElementById(`schema-${name}`)?.scrollIntoView({ block: "start", behavior: reduce ? "instant" : "smooth" });
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>the database, drawn</Eyebrow>
          <h1 className="headline-gradient mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-lime/60">&gt;</span> schema
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
            Fifteen tables in one shared Postgres, all prefixed <span className="text-lime">ah_</span> so
            several products can live in the same database. Every personal table repeats one pair of
            policies — the owner writes, an accepted counselor reads — and <em>who counts as accepted
            </em>{" "}
            is answered in a single place.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-panel p-1">
          {(["map", "tables"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                view === v ? "bg-lime text-ink" : "text-fog hover:text-paper"
              }`}
            >
              {v === "map" ? "the map" : "the tables"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-dim">
        <span>
          <span className="font-bold text-paper">{counts.tables}</span> tables
        </span>
        <span>
          <span className="font-bold text-paper">{counts.keys}</span> foreign keys
        </span>
        <span>
          <span className="font-bold text-paper">{counts.policies}</span> row policies
        </span>
        <span>
          <span className="font-bold text-paper">{SCHEMA_FUNCTIONS.length}</span> functions
        </span>
      </p>

      <div key={view} className="page-enter mt-8">
        {view === "map" ? (
          <div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {(Object.keys(CLUSTER_INFO) as Cluster[]).map((c) => (
                <span key={c} className="flex items-center gap-2 text-[11px] text-dim">
                  <span className="h-2 w-2 rounded-full" style={{ background: CLUSTER_INFO[c].tint }} />
                  <span className="font-bold text-fog">{CLUSTER_INFO[c].label}</span> — {CLUSTER_INFO[c].blurb}
                </span>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-panel/50 p-3">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VB.w} ${VB.h}`}
                className="h-auto w-full min-w-[900px]"
                role="img"
                aria-label="Entity diagram of the AdmissionHack tables and their foreign keys"
              >
                {/* keys first, so the nodes sit on top of them */}
                <g>
                  {edges.map((e) => {
                    const a = byName.get(e.from);
                    const b = byName.get(e.to);
                    if (!a || !b) return null;
                    const on = !lit || (lit.has(e.from) && lit.has(e.to));
                    return (
                      <path
                        key={e.key}
                        data-edge
                        d={edgePath({ x: a.at.x + NODE_W / 2, y: a.at.y }, { x: b.at.x - NODE_W / 2, y: b.at.y })}
                        fill="none"
                        stroke={on ? CLUSTER_INFO[a.cluster].tint : "#1c2622"}
                        strokeWidth={on && lit ? 2 : 1.2}
                        strokeOpacity={on ? 0.55 : 0.18}
                      />
                    );
                  })}
                </g>

                {SCHEMA_TABLES.map((t, i) => {
                  const info = CLUSTER_INFO[t.cluster];
                  const on = !lit || lit.has(t.name);
                  const isActive = active === t.name;
                  return (
                    <g
                      key={t.name}
                      data-node
                      className={reduce ? undefined : "node-in"}
                      style={{
                        cursor: "pointer",
                        animationDelay: reduce ? undefined : `${i * 26}ms`,
                      }}
                      transform={`translate(${t.at.x} ${t.at.y})`}
                      opacity={on ? 1 : 0.25}
                      onPointerEnter={() => setActive(t.name)}
                      onPointerLeave={() => setActive(null)}
                      onClick={() => openTable(t.name)}
                    >
                      <rect
                        x={-NODE_W / 2}
                        y={-NODE_H / 2}
                        width={NODE_W}
                        height={NODE_H}
                        rx={12}
                        fill="#0a1210"
                        stroke={info.tint}
                        strokeOpacity={isActive ? 1 : 0.4}
                        strokeWidth={isActive ? 2 : 1.2}
                      />
                      <text x={-NODE_W / 2 + 14} y={-4} fill="#e7f2e3" fontSize={14} fontFamily="ui-monospace, monospace" fontWeight="bold">
                        {t.name}
                      </text>
                      <text x={-NODE_W / 2 + 14} y={16} fill={info.tint} fontSize={10.5} fontFamily="ui-monospace, monospace" opacity={0.85}>
                        {t.columns.length} cols · {t.policies.length} policies
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-dim">
              Every table points at <span className="text-lime">ah_profiles</span> — the identity hub. Hover a
              table to isolate what it joins to; click one to read its columns and policies.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {SCHEMA_TABLES.map((t) => (
              <TableCard key={t.name} table={t} highlight={active === t.name} />
            ))}
          </div>
        )}
      </div>

      <section className="mt-10 rounded-2xl border border-lime/25 bg-lime/[0.04] p-5">
        <Eyebrow>where the consent is actually enforced</Eyebrow>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fog">
          No screen decides who may read what. Every policy above with{" "}
          <code className="text-lime">ah_is_counselor_of(...)</code> in it calls one function, so
          revoking a link closes every table at once — and a counselor who guesses an id reads nothing,
          because the policy is evaluated on the row before it is returned.
        </p>
        <ul className="mt-5 space-y-3">
          {SCHEMA_FUNCTIONS.map((f) => (
            <li key={f.name} className="rounded-xl border border-line bg-ink p-4">
              <p className="font-mono text-xs font-bold text-lime">
                {f.name}
                <span className="ml-2 font-normal text-dim">{f.signature}</span>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-fog">{f.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function TableCard({ table, highlight }: { table: SchemaTable; highlight: boolean }) {
  const info = CLUSTER_INFO[table.cluster];
  return (
    <article
      id={`schema-${table.name}`}
      className={`scroll-mt-24 rounded-2xl border bg-panel/70 p-5 transition-colors ${
        highlight ? "border-lime/60" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-mono text-sm font-bold text-paper">{table.name}</h2>
          <p className="mt-1 text-xs leading-relaxed text-fog">{table.purpose}</p>
        </div>
        <span
          className="shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold"
          style={{ borderColor: info.tint + "66", color: info.tint }}
        >
          {info.label}
        </span>
      </div>

      <ul className="mt-4 space-y-1">
        {table.columns.map((c) => (
          <li key={c.name} className="flex items-baseline gap-2 text-[11px]">
            <span className="font-mono text-paper">{c.name}</span>
            <span className="font-mono text-dim">{c.type}</span>
            {c.pk && <span className="rounded bg-lime/15 px-1 text-[9px] font-bold text-lime">pk</span>}
            {c.fk && (
              <span className="rounded bg-mint/15 px-1 text-[9px] font-bold text-mint">→ {c.fk}</span>
            )}
            {c.note && <span className="truncate text-dim">· {c.note}</span>}
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-line pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-dim">row policies</p>
        <ul className="mt-2 space-y-2">
          {table.policies.map((p) => (
            <li key={p.name} className="text-[11px]">
              <span className="flex flex-wrap items-baseline gap-2">
                <span
                  className={`rounded px-1.5 text-[9px] font-bold uppercase ${
                    p.cmd === "SELECT"
                      ? "bg-mint/15 text-mint"
                      : p.cmd === "ALL"
                        ? "bg-lime/15 text-lime"
                        : "bg-amber/15 text-amber"
                  }`}
                >
                  {p.cmd}
                </span>
                <span className="font-mono text-fog">{p.name}</span>
              </span>
              <span className="mt-0.5 block font-mono text-[10px] leading-relaxed text-dim">
                {p.using && <>using {p.using}</>}
                {p.using && p.check && p.check !== p.using && " · "}
                {p.check && p.check !== p.using && <>with check {p.check}</>}
              </span>
              {p.note && <span className="mt-0.5 block text-[10px] leading-relaxed text-fog">{p.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
