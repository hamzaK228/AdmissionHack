import Link from "next/link";

const columns = [
  {
    title: "$ ls start-here",
    links: [
      { href: "/how-admission-works", label: "how-admission-works" },
      { href: "/universities", label: "universities/" },
      { href: "/exams", label: "exams/" },
      { href: "/writing", label: "writing/" },
      { href: "/scholarships", label: "scholarships/" },
      { href: "/countries", label: "countries/" },
      { href: "/dashboard", label: "dashboard/" },
    ],
  },
  {
    title: "$ ls top-exams",
    links: [
      { href: "/exams/sat", label: "sat" },
      { href: "/exams/ielts", label: "ielts" },
      { href: "/exams/toefl", label: "toefl" },
      { href: "/exams/csca", label: "csca" },
    ],
  },
  {
    title: "$ ls destinations",
    links: [
      { href: "/countries/united-states", label: "united-states" },
      { href: "/countries/united-kingdom", label: "united-kingdom" },
      { href: "/countries/germany", label: "germany" },
      { href: "/countries/china", label: "china" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-panel/60">
      <div className="scroll-rule" aria-hidden />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lime">&gt;</span>
              <span className="text-[17px] font-bold tracking-tight text-paper">
                AdmissionHack
              </span>
              <span className="anim-blink -ml-0.5 inline-block h-4 w-[7px] bg-lime/90" />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fog">
              The admission system, decoded — for every applicant, everywhere. Guides, universities
              and exams in one place. More modules are being compiled.
            </p>
            <p className="mt-5 text-xs text-dim">
              <span className="anim-pulse-dot mr-2 inline-block h-2 w-2 rounded-full bg-lime align-middle" />
              build: beta · status: compiling next modules
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-dim">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-fog transition-colors hover:text-lime"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AdmissionHack — data is community-contributed, always verify on official sites.</p>
          <p className="text-lime/70">$ exit 0</p>
        </div>
      </div>
    </footer>
  );
}
