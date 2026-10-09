const items = [
  "SAT",
  "IELTS",
  "TOEFL iBT",
  "Duolingo DET",
  "CSCA",
  "ACT",
  "PTE",
  "GRE",
  "GMAT",
  "EJU",
  "IMAT",
  "UCAT",
];

/** Infinite exam ticker. */
export function ExamMarquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line/70 bg-panel/50 py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
      <div
        className="flex w-max gap-10"
        style={{ animation: "marquee 30s linear infinite" }}
      >
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-10 whitespace-nowrap text-sm font-bold tracking-widest text-dim"
          >
            {item}
            <span className="text-lime/50">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
