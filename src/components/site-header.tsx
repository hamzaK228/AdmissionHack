"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/dashboard/store";

const nav = [
  { href: "/how-admission-works", label: "how-it-works" },
  { href: "/universities", label: "universities" },
  { href: "/exams", label: "exams" },
  { href: "/scholarships", label: "scholarships" },
  { href: "/countries", label: "countries" },
];

function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="absolute inset-x-0 top-0 h-0.5">
      <div
        className="h-full bg-gradient-to-r from-mint to-lime transition-[width] duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { apps, ready } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-ink/85 backdrop-blur-md">
      <ScrollProgress />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-1.5">
          <span className="text-lime">&gt;</span>
          <span className="text-[17px] font-bold tracking-tight text-paper">AdmissionHack</span>
          <span className="anim-blink -ml-0.5 inline-block h-4 w-[7px] bg-lime/90" />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                isActive(item.href) ? "font-bold text-lime" : "text-fog hover:text-paper"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* search trigger */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("ah:open-search"))}
            aria-label="Search (Ctrl+K)"
            className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2 text-xs text-dim transition-colors hover:border-lime/40 hover:text-lime"
          >
            <span aria-hidden>⌕</span>
            <kbd className="hidden rounded border border-line bg-ink px-1 text-[10px] sm:inline">⌘K</kbd>
          </button>

          <Link
            href="/dashboard"
            aria-label="Dashboard"
            className={`relative flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors ${
              isActive("/dashboard")
                ? "border-lime/60 bg-lime/15 text-lime"
                : "border-line bg-panel text-fog hover:border-lime/40 hover:text-lime"
            }`}
          >
            <span aria-hidden>▤</span>
            <span className="hidden sm:inline">dashboard</span>
            {ready && apps.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold text-ink">
                {apps.length}
              </span>
            )}
          </Link>

          <Link
            href="/universities"
            className="anim-glow hidden rounded-lg bg-lime px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-[1.03] active:scale-95 md:block"
          >
            Start now
          </Link>

          {/* mobile hamburger */}
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-panel lg:hidden"
          >
            <span className={`h-0.5 w-4 bg-paper transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-4 bg-paper transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-4 bg-paper transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div
        className={`overflow-hidden border-t border-line/60 bg-ink/95 backdrop-blur-md transition-[max-height,opacity] duration-300 lg:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="space-y-1 px-4 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm ${
                isActive(item.href) ? "bg-lime/10 font-bold text-lime" : "text-fog"
              }`}
            >
              <span className="text-lime/60">&gt; </span>
              {item.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className={`block rounded-lg px-3 py-2.5 text-sm ${
              isActive("/dashboard") ? "bg-lime/10 font-bold text-lime" : "text-fog"
            }`}
          >
            <span className="text-lime/60">&gt; </span>dashboard
            {ready && apps.length > 0 && (
              <span className="ml-2 rounded-full bg-lime px-1.5 text-[10px] font-bold text-ink">
                {apps.length}
              </span>
            )}
          </Link>
          <Link
            href="/universities"
            className="mt-2 block rounded-lg bg-lime px-3 py-3 text-center text-sm font-bold text-ink"
          >
            Start now →
          </Link>
        </nav>
      </div>
    </header>
  );
}
