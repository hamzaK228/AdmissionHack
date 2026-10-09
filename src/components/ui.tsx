import Link from "next/link";
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime">
      <span className="text-lime/60">&gt; </span>
      {children}
    </p>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative border-b border-line/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="headline-gradient mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-fog">{description}</p>
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-paper sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-fog sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "zinc",
}: {
  children: ReactNode;
  tone?: "zinc" | "lime" | "green" | "amber" | "cyan";
}) {
  const tones = {
    zinc: "border-line bg-panel text-fog",
    lime: "border-lime/40 bg-lime/10 text-lime",
    green: "border-mint/40 bg-mint/10 text-mint",
    amber: "border-amber/40 bg-amber/10 text-amber",
    cyan: "border-cyan/40 bg-cyan/10 text-cyan",
  } as const;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function FactCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel/80 p-4 transition-colors hover:border-line2">
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-dim">{label}</dt>
      <dd className="mt-2 text-sm font-medium leading-snug text-paper">{value}</dd>
    </div>
  );
}

export function CtaCard({
  href,
  title,
  description,
  cta,
}: {
  href: string;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-line bg-panel/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime/50 hover:shadow-[0_12px_40px_rgba(201,255,74,0.08)]"
    >
      <h3 className="font-bold text-paper">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fog">{description}</p>
      <p className="mt-4 text-sm font-bold text-lime opacity-80 transition-opacity group-hover:opacity-100">
        {cta} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

export function DataNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start justify-center gap-2 text-xs leading-relaxed text-dim ${className}`}>
      <span aria-hidden>⚠</span>
      data is community-contributed and approximate — always verify on the official website before
      paying or applying
    </p>
  );
}
