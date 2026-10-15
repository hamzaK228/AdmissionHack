"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { University } from "@/data/types";
import { RANKING_EDITIONS } from "@/data/types";
import { FIELDS } from "@/data/types";
import { countryByCode } from "@/data/countries";
import { Badge } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import { Reveal } from "@/components/reveal";
import { useStore } from "@/components/dashboard/store";

const PAGE = 60;

function tuitionLabel(u: University): string {
  if (!u.tuitionUsdPerYear) return "tuition: see site";
  if (u.tuitionUsdPerYear.min === 0 && u.tuitionUsdPerYear.max === 0) return "full ride possible";
  if (u.tuitionUsdPerYear.max <= 5000) return "≈ $0–5k / yr";
  return `≈ $${Math.round(u.tuitionUsdPerYear.min / 1000)}k–${Math.round(u.tuitionUsdPerYear.max / 1000)}k / yr`;
}

function selectivityLabel(u: University): string {
  switch (u.selectivity) {
    case "very-high": return "very high selectivity";
    case "high": return "high selectivity";
    case "moderate": return "moderate";
    case "open": return "open admission";
    default: return "selectivity n/a";
  }
}

function RankBadge({ u }: { u: University }) {
  if (u.qsRank != null) return <Badge tone="lime">QS #{u.qsRank}</Badge>;
  if (u.arwuRank != null) return <Badge tone="cyan">ARWU #{u.arwuRank}</Badge>;
  return <Badge>specialist</Badge>;
}

type SortKey = "qs" | "tuition-asc" | "tuition-desc";

export function UniversityExplorer({
  items,
  initialCountry = "all",
}: {
  items: University[];
  initialCountry?: string;
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(initialCountry);
  const [field, setField] = useState("all");
  const [tuition, setTuition] = useState("all");
  const [rankBand, setRankBand] = useState("all");
  const [sort, setSort] = useState<SortKey>("qs");
  const [limit, setLimit] = useState(PAGE);
  const { profile, ready } = useStore();

  const countryOptions = useMemo(
    () => [...new Set(items.map((u) => u.countryName))].sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const filtered = useMemo(() => {
    const qsCeiling = rankBand === "all" ? Infinity : Number(rankBand);
    const list = items.filter((u) => {
      if (query && !`${u.name} ${u.city}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (country !== "all" && u.countryName !== country) return false;
      if (field !== "all" && !(u.fields as readonly string[]).includes(field)) return false;
      if (tuition === "free" && !((u.tuitionUsdPerYear?.max ?? 999999) <= 5000)) return false;
      if (tuition === "under10k" && (u.tuitionUsdPerYear?.min ?? 999999) > 10000) return false;
      if (tuition === "over10k" && (u.tuitionUsdPerYear?.min ?? 0) <= 10000) return false;
      if (rankBand !== "all" && (u.qsRank == null || u.qsRank > qsCeiling)) return false;
      return true;
    });

    const tuitionMin = (u: University) => u.tuitionUsdPerYear?.min ?? 999999;
    switch (sort) {
      case "qs":
        return [...list].sort((a, b) => (a.qsRank ?? 99999) - (b.qsRank ?? 99999));
      case "tuition-asc":
        return [...list].sort((a, b) => tuitionMin(a) - tuitionMin(b));
      case "tuition-desc":
        return [...list].sort((a, b) => tuitionMin(b) - tuitionMin(a));
    }
  }, [items, query, country, field, tuition, rankBand, sort]);

  const visible = filtered.slice(0, limit);
  const reset = (fn: () => void) => { fn(); setLimit(PAGE); };
  const selectCls =
    "rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors focus:border-lime/60 [&>option]:bg-ink";

  return (
    <div>
      <Reveal>
      <div className="grid gap-3 rounded-2xl border border-line bg-panel/70 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="search"
          value={query}
          onChange={(e) => reset(() => setQuery(e.target.value))}
          placeholder="$ grep 1504 universities…"
          className="rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60"
        />
        <select value={country} onChange={(e) => reset(() => setCountry(e.target.value))} className={selectCls}>
          <option value="all">all countries ({countryOptions.length})</option>
          {countryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={field} onChange={(e) => reset(() => setField(e.target.value))} className={selectCls}>
          <option value="all">all fields</option>
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select value={tuition} onChange={(e) => reset(() => setTuition(e.target.value))} className={selectCls}>
          <option value="all">any tuition</option>
          <option value="free">free / under $5k</option>
          <option value="under10k">under $10k (known)</option>
          <option value="over10k">$10k and above</option>
        </select>
        <select value={rankBand} onChange={(e) => reset(() => setRankBand(e.target.value))} className={selectCls}>
          <option value="all">any ranking</option>
          <option value="50">QS top 50</option>
          <option value="100">QS top 100</option>
          <option value="200">QS top 200</option>
          <option value="500">QS top 500</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
          <option value="qs">sort: QS rank</option>
          <option value="tuition-asc">sort: tuition ↑</option>
          <option value="tuition-desc">sort: tuition ↓</option>
        </select>
      </div>

      </Reveal>

      <p className="mt-5 text-xs uppercase tracking-widest text-dim">
        <span className="text-lime">{String(Math.min(limit, filtered.length)).padStart(2, "0")}</span> /{" "}
        {filtered.length} results · rankings: QS {RANKING_EDITIONS.qs} + ARWU {RANKING_EDITIONS.arwu}
      </p>

      <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
        {visible.map((u) => (
          <motion.div
            key={u.slug}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
          <Link
            href={`/universities/${u.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-line bg-panel/70 p-5 card-interactive"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-dim">
                  {u.country ? countryByCode(u.country)?.flag : "🌍"} {u.countryName}
                  {u.city ? ` · ${u.city}` : ""}
                </p>
                <h3 className="mt-1.5 font-bold leading-snug text-paper transition-colors group-hover:text-lime">
                  {u.name}
                </h3>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <RankBadge u={u} />
                {ready && profile && u.tuitionUsdPerYear && u.tuitionUsdPerYear.max > 0 && u.tuitionUsdPerYear.min <= profile.budget && (
                  <Badge tone="lime">within budget</Badge>
                )}
              </div>
            </div>
            <p className="prose-sm mt-2 line-clamp-2 text-fog">{u.description}</p>

            {/* How far up the field it sits, as a shape rather than a word: three segments,
                filled to the band, so "is this a top-50 school?" is a glance instead of a
                number the reader has to interpret. */}
            <div className="mt-3 flex items-center gap-1" aria-hidden>
              {[0, 1, 2].map((seg) => {
                const band = u.qsRank == null ? -1 : u.qsRank <= 50 ? 0 : u.qsRank <= 200 ? 1 : 2;
                const on = band >= 0 && seg <= band;
                const tint = band === 0 ? "#c9ff4a" : band === 1 ? "#5eead4" : "#7dd3fc";
                return (
                  <span
                    key={seg}
                    className="h-1 flex-1 rounded-full"
                    style={{ background: on ? tint : "#1c2b1a", opacity: on && seg < band ? 0.45 : 1 }}
                  />
                );
              })}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
              <Badge tone="green">{tuitionLabel(u)}</Badge>
              <Badge>{selectivityLabel(u)}</Badge>
              {u.fields[0] ? <Badge tone="cyan">{u.fields[0]}</Badge> : null}
              <span className="ml-auto">
                <SaveButton slug={u.slug} />
              </span>
            </div>
          </Link>
          </motion.div>
        ))}
        </AnimatePresence>
      </motion.div>

      {limit < filtered.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-xl border border-line2 bg-panel px-6 py-3 text-sm font-bold text-lime transition-colors hover:border-lime/50"
          >
            load {Math.min(PAGE, filtered.length - limit)} more ↓
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line2 p-10 text-center">
          <p className="font-bold text-paper">grep: no matches found</p>
          <p className="mt-1 text-sm text-fog">
            try clearing a filter — or this field may not exist in the chosen country.
          </p>
        </div>
      )}
    </div>
  );
}
