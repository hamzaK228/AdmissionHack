"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface IndexEntry {
  type: string;
  label: string;
  sub: string;
  href: string;
}

const typeColor: Record<string, string> = {
  university: "text-lime",
  exam: "text-cyan",
  country: "text-mint",
  scholarship: "text-amber",
  guide: "text-fog",
  page: "text-fog",
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // open via ⌘K / Ctrl+K or custom event from the header button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ah:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ah:open-search", onOpen);
    };
  }, []);

  // lazy-load the index on first open
  useEffect(() => {
    if (!open || index) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: IndexEntry[]) => setIndex(data))
      .catch(() => setIndex([]));
  }, [open, index]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const results = useMemo(() => {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    const list =
      q.length === 0
        ? index.filter((e) => e.type !== "university" || e.sub.includes("QS #"))
        : index.filter((e) => `${e.label} ${e.sub}`.toLowerCase().includes(q));
    return list.slice(0, 14);
  }, [index, query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      go(results[active].href);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="term w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Site search"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <span className="text-lime">&gt;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="search universities, exams, countries, scholarships…"
            className="w-full bg-transparent text-sm text-paper outline-none placeholder:text-dim"
          />
          <kbd className="rounded border border-line bg-ink px-1.5 py-0.5 text-[10px] text-dim">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {!index && <p className="px-3 py-6 text-center text-sm text-dim">loading index…</p>}
          {index && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-dim">grep: no matches for “{query}”</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.href}-${r.label}-${i}`}
              data-idx={i}
              onClick={() => go(r.href)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                i === active ? "bg-lime/10" : ""
              }`}
            >
              <span className="min-w-0">
                <span className={`block truncate font-bold ${i === active ? "text-lime" : "text-paper"}`}>
                  {r.label}
                </span>
                <span className="block truncate text-xs text-dim">{r.sub}</span>
              </span>
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${typeColor[r.type] ?? "text-dim"}`}>
                {r.type}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[10px] text-dim">
          <span>↑↓ navigate · enter open</span>
          <span className="text-lime/60">admissionhack --search</span>
        </div>
      </div>
    </div>
  );
}
