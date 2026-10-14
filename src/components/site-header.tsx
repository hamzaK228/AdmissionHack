"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/dashboard/store";
import { useAuth } from "@/lib/use-auth";

const nav = [
  { href: "/how-admission-works", label: "how-it-works" },
  { href: "/universities", label: "universities" },
  { href: "/exams", label: "exams" },
  { href: "/writing", label: "writing" },
  { href: "/play", label: "arcade" },
  { href: "/scholarships", label: "scholarships" },
  { href: "/countries", label: "countries" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { apps, ready } = useStore();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  // condense the pill once you leave the hero, like the reference
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Floating pill nav — inset from the viewport edge, not a full-width bar */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 print:hidden">
        <div
          className={`mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-3 rounded-full border px-4 transition-[background-color,border-color,box-shadow] duration-300 sm:px-5 ${
            condensed
              ? "border-line2 bg-ink/90 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
              : "border-line/60 bg-ink/70 backdrop-blur-md"
          }`}
        >
          {/* brand */}
          <Link href="/" className="flex shrink-0 items-center gap-1.5">
            <span className="text-lime">&gt;</span>
            <span className="text-[15px] font-bold tracking-tight text-paper">AdmissionHack</span>
            <span className="anim-blink -ml-0.5 inline-block h-3.5 w-[6px] bg-lime/90" />
          </Link>

          {/* centre links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                  isActive(item.href)
                    ? "bg-lime/12 font-bold text-lime"
                    : "text-fog hover:bg-panel hover:text-paper"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {!user && (
              <Link
                href="/signin"
                className="hidden shrink-0 rounded-full border border-lime/40 bg-lime/10 px-3 py-1.5 text-xs font-bold text-lime transition-colors hover:bg-lime/20 sm:inline-flex"
              >
                sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("ah:open-search"))}
              aria-label="Search (Ctrl+K)"
              className="flex items-center gap-1.5 rounded-full border border-line bg-panel/70 px-2.5 py-1.5 text-xs text-dim transition-colors hover:border-lime/40 hover:text-lime"
            >
              <span aria-hidden>⌕</span>
              <kbd className="hidden border border-line bg-ink px-1 text-[10px] sm:inline">⌘K</kbd>
            </button>

            <Link
              href="/dashboard"
              aria-label="Dashboard"
              className={`relative flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                isActive("/dashboard")
                  ? "border-lime/60 bg-lime/15 text-lime"
                  : "border-line bg-panel/70 text-fog hover:border-lime/40 hover:text-lime"
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

            {/* the reference's "message us" slot -> our primary action */}
            <Link
              href="/universities"
              className="anim-glow hidden items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-[13px] font-bold text-ink md:flex press-grow"
            >
              start now
            </Link>

            <button
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full border border-line bg-panel/70 lg:hidden"
            >
              <span className={`h-0.5 w-4 bg-paper transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-4 bg-paper transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-4 bg-paper transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
          </div>
        </div>

        {/* mobile sheet, also floating */}
        <div
          className={`mx-auto mt-2 max-w-[1360px] overflow-hidden rounded-2xl border border-line2 bg-ink/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 border-transparent opacity-0"
          }`}
        >
          <nav className="space-y-1 p-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 text-sm ${
                  isActive(item.href) ? "bg-lime/10 font-bold text-lime" : "text-fog"
                }`}
              >
                <span className="text-lime/60">&gt; </span>
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className={`block rounded-xl px-3 py-2.5 text-sm ${
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
            {!user && (
              <Link
                href="/signin"
                className="mt-2 block rounded-xl border border-lime/40 bg-lime/10 px-3 py-3 text-center text-sm font-bold text-lime"
              >
                sign in / create account
              </Link>
            )}
            <Link
              href="/universities"
              className="mt-2 block rounded-xl bg-lime px-3 py-3 text-center text-sm font-bold text-ink"
            >
              start now →
            </Link>
          </nav>
        </div>
      </header>

      {/* spacer so content starts below the floating pill */}
      <div className="h-[68px]" aria-hidden />
    </>
  );
}
