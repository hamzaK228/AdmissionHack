import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Eyebrow, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "For counselors — run your class on AdmissionHack, free",
  description:
    "How to create a class, invite your students with one code, see every applicant's universities, documents and portfolio side by side, and read any student's full workspace read-only. Free for students; nothing to install.",
};

const SEES = [
  "Their profile — level, destination, intake, budget, GPA.",
  "Their university list, by tier, with each application's status and its submission and decision dates.",
  "Their recorded scores, and any official score report they uploaded.",
  "Their document checklist and the files in their six folders.",
  "Their portfolio — activities, awards, work and volunteering, in their own words.",
  "Their tracked deadlines, so you can see what they think is coming.",
];

const CANNOT = [
  "Write anything. Every view of a student is read-only — you cannot alter a list, a score or a file.",
  "See a student who has not joined your class. There is no way to add someone who did not ask.",
  "See another counselor's students, or anything outside your own class.",
  "See a student after they leave. The moment they leave, every row and every file goes dark.",
];

export default function CounselorsPage() {
  return (
    <>
      <PageHero
        eyebrow="for counselors"
        title="Run your whole class from one page."
        description="Create a class, hand out one code, and read every student's application progress side by side — universities, documents, portfolio, next deadline. Read-only, per student, and free: the students never pay, and neither do you."
      />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {/* ── the four steps ──────────────────────────────────────────────── */}
        <Reveal>
          <section>
            <SectionHeading
              eyebrow="setup takes minutes"
              title="Four steps"
              description="Nothing to install, no spreadsheet to keep in sync, and no admin account to apply for. A counselor account is the same sign-up as a student's, with one extra choice."
            />
            <ol className="mt-10 space-y-4">
              {[
                {
                  t: "Create an account, and pick “counselor”",
                  d: "Sign up on the dashboard with your email. The role picker is on the sign-up form — choose counselor rather than student. Nothing is verified or approved; the role only decides which screens you get.",
                },
                {
                  t: "Create a class",
                  d: "On the counselor tab, name the class after the cohort — “Grade 12 · Group A”, “2027 Fall cohort”. The database generates the join code; you never choose or type one, and it cannot collide with another class's.",
                },
                {
                  t: "Send the invite",
                  d: "Press “Copy invite” and paste the message into your class chat or email. It carries the link, the join code, and a plain statement of what joining means.",
                },
                {
                  t: "Read the class",
                  d: "As students join they appear in the class list. Open the class for a side-by-side table of everyone's progress, or open a student to read their whole workspace.",
                },
              ].map((s, i) => (
                <li key={i} className="grid gap-3 rounded-2xl border border-line bg-panel/70 p-6 sm:grid-cols-[auto_1fr] sm:gap-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-lime/30 bg-lime/10 text-sm font-bold text-lime">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-bold text-paper">{s.t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fog">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* ── the invite message ──────────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20">
            <SectionHeading
              eyebrow="what you send"
              title="The invite, in full"
              description="This is the message “Copy invite” writes for you. Students can always read it before they decide — nothing is shared until they enter the code themselves."
            />
            <div className="mt-8 rounded-2xl border border-line bg-ink p-6">
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-fog">
{`Join our AdmissionHack class “Grade 12 · Group A”.

1. Create a free account: https://admissionhack-seven.vercel.app/dashboard
2. Open the counselor tab and enter this code: ABC123

Everything you put in your dashboard is private to you.
I can only read it after you join, and you can leave the
class at any time.`}
              </pre>
            </div>
          </section>
        </Reveal>

        {/* ── the class view ─────────────────────────────────────────────── */}
        <Reveal>
          <section className="mt-20">
            <SectionHeading
              eyebrow="the class at a glance"
              title="Who is behind, in one table"
              description="Opening a class reads the whole cohort at once — six queries, not six per student — so a class of thirty loads as fast as a class of three."
            />
            <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-panel/70 p-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-dim">
                    <th className="pb-2 pr-4 font-bold">student</th>
                    <th className="pb-2 pr-4 font-bold">unis</th>
                    <th className="pb-2 pr-4 font-bold">docs</th>
                    <th className="pb-2 pr-4 font-bold">portfolio</th>
                    <th className="pb-2 pr-4 font-bold">next deadline</th>
                    <th className="pb-2 font-bold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      <span className="block font-bold text-paper">Aisultan</span>
                      <span className="text-[10px] text-dim">IELTS 7.0</span>
                    </td>
                    <td className="py-2 pr-4 align-top text-fog">8</td>
                    <td className="py-2 pr-4 align-top font-bold text-mint">10/10</td>
                    <td className="py-2 pr-4 align-top text-fog">7</td>
                    <td className="py-2 pr-4 align-top text-red">TU Delft closes · 21d</td>
                    <td className="py-2 align-top text-right text-lime">open</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      <span className="block font-bold text-paper">Dana</span>
                    </td>
                    <td className="py-2 pr-4 align-top text-fog">3</td>
                    <td className="py-2 pr-4 align-top text-fog">4/10</td>
                    <td className="py-2 pr-4 align-top text-fog">2</td>
                    <td className="py-2 pr-4 align-top text-dim">none tracked</td>
                    <td className="py-2 align-top text-right text-lime">open</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              The point is the second row: three universities, four documents and nothing on the calendar is
              the shape of a student who is drifting, and it is visible without opening anything.
            </p>
          </section>
        </Reveal>

        {/* ── what you can and cannot do ─────────────────────────────────── */}
        <Reveal>
          <section className="mt-20 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-panel/70 p-6">
              <Eyebrow>what you can see</Eyebrow>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-fog">
                {SEES.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-lime">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-panel/70 p-6">
              <Eyebrow>what you cannot do</Eyebrow>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-fog">
                {CANNOT.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-dim">·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Reveal>

        {/* ── why it is built this way ───────────────────────────────────── */}
        <Reveal>
          <section className="mt-16 rounded-2xl border border-lime/25 bg-lime/[0.06] p-6 sm:p-8">
            <Eyebrow>why the consent works this way</Eyebrow>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-fog">
              The join code is not a share link — it is the student&rsquo;s own request. A student enters the
              code, and that act creates the record that lets you read their workspace. It is enforced by the
              database rather than by this website, which is why a student who leaves really does go dark
              immediately, and why nobody can quietly add a student to a class they never joined.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fog">
              That matters because of what sits in these workspaces: passports, sealed transcripts,
              recommendation letters and family financial documents. A tool for reading those has to be
              built so that reading is impossible without the student&rsquo;s own action — including when
              the person asking is you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow"
              >
                create your class →
              </Link>
              <Link
                href="/universities"
                className="rounded-lg border border-line2 bg-panel px-5 py-2.5 text-sm font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime"
              >
                see the directory your students will use →
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
