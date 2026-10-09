"use client";

import { useEffect, useState } from "react";

type Line =
  | { kind: "cmd"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "log"; text: string }
  | { kind: "bar"; label: string; value: number; score: string };

const SCRIPT: Line[] = [
  { kind: "cmd", text: "admissionhack --plan" },
  { kind: "log", text: "loading applicant profile..." },
  { kind: "ok", text: "destination: Germany (tuition-free)" },
  { kind: "bar", label: "IELTS", value: 88, score: "7.5" },
  { kind: "bar", label: "DOCUMENTS", value: 75, score: "6/8" },
  { kind: "bar", label: "ESSAYS", value: 60, score: "draft 2" },
  { kind: "ok", text: "deadlines mapped · 8 universities" },
  { kind: "cmd", text: "status: ON TRACK_" },
];

/** Terminal window that types itself, line by line, when scrolled into view. */
export function TerminalHero() {
  const [started, setStarted] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(ref);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    if (!started || visibleLines >= SCRIPT.length) return;
    const line = SCRIPT[visibleLines];
    let timer: ReturnType<typeof setTimeout>;

    if (line.kind === "cmd") {
      // type the command character by character
      if (typedChars < line.text.length) {
        timer = setTimeout(() => setTypedChars((c) => c + 1), 34);
      } else {
        timer = setTimeout(() => {
          setVisibleLines((v) => v + 1);
          setTypedChars(0);
        }, 420);
      }
    } else {
      const delay = line.kind === "bar" ? 520 : 300;
      timer = setTimeout(() => setVisibleLines((v) => v + 1), delay);
    }
    return () => clearTimeout(timer);
  }, [started, visibleLines, typedChars]);

  const current = started ? SCRIPT[visibleLines] : undefined;

  return (
    <div ref={setRef} className="term w-full max-w-xl">
      <div className="term-bar">
        <span className="h-3 w-3 rounded-full bg-red/80" />
        <span className="h-3 w-3 rounded-full bg-amber/80" />
        <span className="h-3 w-3 rounded-full bg-mint/80" />
        <span className="ml-2 text-xs text-fog">admissionhack — plan</span>
      </div>
      <div className="space-y-2.5 px-5 py-5 text-[13px] leading-relaxed sm:text-sm">
        {SCRIPT.slice(0, visibleLines).map((line, i) => {
          if (line.kind === "cmd")
            return (
              <p key={i} className="text-paper">
                <span className="text-lime">&gt; </span>
                {line.text}
              </p>
            );
          if (line.kind === "log")
            return (
              <p key={i} className="text-dim">
                {line.text}
              </p>
            );
          if (line.kind === "ok")
            return (
              <p key={i} className="text-mint">
                [ok] {line.text}
              </p>
            );
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[11px] tracking-wider text-fog">
                {line.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mint to-lime"
                  style={{ width: `${line.value}%`, animation: "barfill 0.9s ease-out" }}
                />
              </div>
              <span className="w-14 text-right text-[11px] font-bold text-lime">
                {line.score}
              </span>
            </div>
          );
        })}

        {current && (
          <p className="text-paper">
            <span className="text-lime">&gt; </span>
            {current.kind === "cmd" ? current.text.slice(0, typedChars) : ""}
            <span className="anim-blink text-lime">▌</span>
          </p>
        )}
        {!started && (
          <p className="text-dim">
            <span className="text-lime">&gt; </span>
            <span className="anim-blink text-lime">▌</span>
          </p>
        )}
      </div>
    </div>
  );
}
