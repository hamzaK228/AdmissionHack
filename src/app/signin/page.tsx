import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/account/auth-panel";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sign in or create an account — AdmissionHack",
  description:
    "An account syncs your workspace across devices, lets a counselor you accept read it, lets you join your class, and unlocks the essay reviewer. The dashboard itself works without one.",
  robots: { index: false },
};

/**
 * The sign-in page — a page, because a page can be found.
 *
 * Sign-in used to live only inside the dashboard's account tab, which meant a visitor
 * had to already be in the workspace, and then guess which of fifteen tabs held it.
 * That is a bad place for the front door of anything that needs an account — the
 * class join code, the community board and the essay reviewer all do.
 *
 * The page explains *why* an account is worth having before it asks for one, because
 * "sign in" on its own is only meaningful to someone who already knows what happens
 * next. And it says plainly that the workspace works without an account, so the form
 * never reads as a gate.
 */

const WHY = [
  {
    title: "Your workspace follows you",
    body: "The dashboard lives in your browser, which means it is lost when you clear it or change device. Signing in mirrors it to the cloud so it can be restored.",
  },
  {
    title: "A counselor can read it — if you let them",
    body: "Counselors read a student's workspace only after the student enters their class code. Nothing is visible before that, and you can revoke it at any time.",
  },
  {
    title: "The parts that need a name",
    body: "Joining a class, posting on the community board, and the AI essay reviewer all need an identity — the reviewer because reviews cost money to run.",
  },
];

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <Eyebrow>account</Eyebrow>
      <h1 className="headline-gradient mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Sign in, or create an account.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-fog">
        Free, and only needed for the parts that involve other people. Your dashboard works without one.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,380px)]">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-dim">what an account is for</p>
          <ul className="mt-4 space-y-4">
            {WHY.map((w) => (
              <li key={w.title} className="rounded-2xl border border-line bg-panel/70 p-5">
                <p className="font-bold text-paper">{w.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-fog">{w.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border border-line/70 bg-panel/40 p-5">
            <p className="text-sm leading-relaxed text-fog">
              <span className="font-bold text-paper">Not ready?</span> Everything except the class, the
              board and the reviewer works signed out —{" "}
              <Link href="/dashboard" className="font-bold text-lime/80 hover:text-lime">
                open the dashboard
              </Link>{" "}
              and start a profile straight away.
            </p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <AuthPanel />
          <p className="mt-4 text-xs leading-relaxed text-dim">
            A counselor signing up should pick the <strong className="text-fog">counselor</strong> role on
            the sign-up form, then read the{" "}
            <Link href="/counselors" className="font-bold text-lime/80 hover:text-lime">
              guide to running a class
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
