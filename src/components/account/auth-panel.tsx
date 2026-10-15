"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import { Eyebrow } from "@/components/ui";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim";
const quietBtn = "link-quiet rounded-lg border border-line2 px-4 py-2 text-xs font-bold text-fog";

const ROLES = [
  { id: "student", label: "student", desc: "I'm applying" },
  { id: "counselor", label: "counselor", desc: "I guide applicants" },
  { id: "parent", label: "parent", desc: "I'm supporting one" },
] as const;

/**
 * The external providers, all of which are already enabled on the shared project.
 *
 * Deliberately text-and-dot rather than logos: official "Sign in with Google" button
 * assets are required for production and they are not mine to draw, so this is the
 * honest placeholder — swap in the real assets before launch rather than a hand-drawn
 * approximation of someone's trademark.
 */
const PROVIDERS = [
  { id: "google", label: "Google", brand: "#4285F4" },
  { id: "facebook", label: "Facebook", brand: "#1877F2" },
  { id: "github", label: "GitHub", brand: "#8B949E" },
] as const;

/**
 * GoTrue's errors are accurate and unhelpful. Two of them are worth translating,
 * because they describe situations the student cannot guess at:
 *
 *   * "Invalid login credentials" is what a student sees when they signed up with
 *     Google and are now typing a password that never existed. The fix is a different
 *     button, not a different password — and without this they conclude the site is broken.
 *   * an address that is not confirmed is a different problem from a wrong password.
 */
const friendlyError = (raw: string): string => {
  if (/invalid login credentials/i.test(raw))
    return "That email and password do not match. If you created your account with Google, Facebook or GitHub, use that button above — those accounts have no password to type. Otherwise try “forgot password”.";
  if (/email not confirmed/i.test(raw))
    return "That address has not been confirmed yet. Check your inbox for the link, or resend it below.";
  if (/rate limit|too many requests|over_email_send_rate_limit/i.test(raw))
    return "Too many attempts in a row. Wait a minute and try again.";
  if (/user already registered/i.test(raw))
    return "That email already has an account. Sign in instead — or use “forgot password” if you never set one.";
  return raw;
};

type Msg = { tone: "ok" | "err"; text: string } | null;

/**
 * Account panel: sign in, sign up, forgotten password, and signing out.
 *
 * Workspace sync is a bonus, never a requirement — this panel says so plainly
 * when no backend is configured rather than showing a broken form.
 *
 * An unconfirmed address is treated as its own case, with a resend, because
 * "not confirmed" and "wrong password" are different problems and only one of
 * them is fixed by typing the password again.
 */
export function AuthPanel({ next }: { next?: string } = {}) {
  const {
    user,
    loading,
    configured,
    needsConfirmation,
    signIn,
    signInWithProvider,
    signUp,
    signOut,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("student");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  if (loading) return <p className="text-sm text-dim">checking session…</p>;

  if (!configured) {
    return (
      <div className="max-w-xl rounded-2xl border border-dashed border-line2 bg-panel/40 p-6">
        <Eyebrow>accounts not configured</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          This build runs entirely in your browser — your workspace, documents and score reports are
          stored on this device and nothing is uploaded anywhere. That is a complete product, not a
          degraded one.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-dim">
          Setting <code className="text-lime">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-lime">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> turns on accounts, cloud
          sync and the counselor view — the schema is already written and waiting in{" "}
          <code className="text-lime">supabase/migrations</code>. Signing in is optional either way.
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-xl rounded-2xl border border-line bg-panel/70 p-6">
        <Eyebrow>signed in</Eyebrow>
        <p className="mt-3 text-lg font-bold text-paper">{user.fullName || user.email}</p>
        <p className="mt-1 text-xs text-dim">
          {user.email} · role: <span className="text-lime">{user.role}</span>
        </p>

        <form
          className="mt-5 border-t border-line pt-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setPwBusy(true);
            setPwMsg(null);
            const res = await updatePassword(newPassword);
            setPwBusy(false);
            if (res.ok) {
              setNewPassword("");
              setPwMsg({ tone: "ok", text: "password changed" });
            } else {
              setPwMsg({ tone: "err", text: res.error });
            }
          }}
        >
          <label className={labelCls} htmlFor="au-newpass">
            change password
          </label>
          <div className="flex gap-2">
            <input
              id="au-newpass"
              type="password"
              minLength={6}
              className={inputCls}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="a new password, at least 6 characters"
            />
            <button
              type="submit"
              disabled={pwBusy || newPassword.length < 6}
              className="shrink-0 rounded-lg border border-line2 px-4 py-2.5 text-xs font-bold text-fog transition-colors hover:border-lime/50 hover:text-lime disabled:opacity-40"
            >
              {pwBusy ? "…" : "update"}
            </button>
          </div>
          {pwMsg && (
            <p className={`mt-2 text-xs ${pwMsg.tone === "ok" ? "text-mint" : "text-amber"}`}>
              {pwMsg.text}
            </p>
          )}
        </form>

        {/* the next step, because "signed in" is not an outcome — reaching the workspace is */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <Link
            href="/dashboard"
            className="anim-glow rounded-lg bg-lime px-4 py-2 text-xs font-bold text-ink press-grow"
          >
            open your dashboard →
          </Link>
          <button type="button" onClick={signOut} className={quietBtn}>
            sign out
          </button>
        </div>
      </div>
    );
  }

  const title = mode === "signin" ? "sign in" : mode === "signup" ? "create an account" : "reset your password";
  const blurb =
    mode === "signin"
      ? "Sign in to sync your workspace across devices and let a counselor review it."
      : mode === "signup"
        ? "An account lets your workspace follow you to any device — and lets you invite a counselor."
        : "We will email you a link to set a new password. Nothing changes until you open it.";

  return (
    <div className="max-w-xl rounded-2xl border border-line bg-panel/70 p-6">
      <Eyebrow>{title}</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-fog">{blurb}</p>

      {mode !== "reset" && (
        <div className="mt-5 space-y-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                const res = await signInWithProvider(p.id, next);
                setBusy(false);
                if (!res.ok) setMsg({ tone: "err", text: friendlyError(res.error) });
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-line bg-ink px-4 py-2.5 text-sm font-bold text-paper transition-colors hover:border-lime/50 disabled:opacity-40"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: p.brand }}
              />
              Continue with {p.label}
            </button>
          ))}
          <p className="pt-1 text-center text-[11px] uppercase tracking-wider text-dim">
            or use an email address
          </p>
        </div>
      )}

      <form
        className="mt-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          if (mode === "reset") {
            const res = await requestPasswordReset(email);
            setBusy(false);
            setMsg(
              res.ok
                ? { tone: "ok", text: "if that address has an account, a reset link is on its way." }
                : { tone: "err", text: friendlyError(res.error) },
            );
            return;
          }
          const res =
            mode === "signin"
              ? await signIn(email, password)
              : await signUp(email, password, role, name);
          setBusy(false);
          if (!res.ok) setMsg({ tone: "err", text: friendlyError(res.error) });
          else if (mode === "signin" && next) window.location.assign(next);
          else if (mode === "signup" && res.alreadyRegistered) {
            setMsg({
              tone: "err",
              text:
                "That email already has an account — probably because it works across both of our sites. " +
                "Nothing new was created and no email was sent. Sign in below, or use “forgot password” to set one.",
            });
            setMode("signin");
          } else if (mode === "signup" && res.needsConfirmation) {
            setMsg({
              tone: "ok",
              text: "account created. Check your email to confirm it, then sign in.",
            });
          }
        }}
      >
        {mode === "signup" && (
          <>
            <div>
              <label className={labelCls} htmlFor="au-name">
                your name
              </label>
              <input
                id="au-name"
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aisultan"
              />
            </div>
            <div>
              <span className={labelCls}>i am a</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      role === r.id ? "border-lime/60 bg-lime/10" : "border-line bg-ink hover:border-lime/30"
                    }`}
                  >
                    <span className="block text-xs font-bold text-paper">{r.label}</span>
                    <span className="text-[10px] text-dim">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className={labelCls} htmlFor="au-email">
            email
          </label>
          <input
            id="au-email"
            type="email"
            required
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {mode !== "reset" && (
          <div>
            <label className={labelCls} htmlFor="au-pass">
              password
            </label>
            <input
              id="au-pass"
              type="password"
              required
              minLength={6}
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
            />
          </div>
        )}

        {msg && (
          <p
            className={`text-xs leading-relaxed ${msg.tone === "ok" ? "text-mint" : "text-amber"}`}
          >
            {msg.text}
          </p>
        )}

        {needsConfirmation && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const res = await resendConfirmation(needsConfirmation);
              setBusy(false);
              setMsg(
                res.ok
                  ? { tone: "ok", text: `confirmation email re-sent to ${needsConfirmation}.` }
                  : { tone: "err", text: res.error },
              );
            }}
            className="rounded-lg border border-amber/40 bg-amber/[0.06] px-4 py-2 text-xs font-bold text-amber disabled:opacity-40"
          >
            {busy ? "…" : "resend the confirmation email"}
          </button>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="submit"
            disabled={busy}
            className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-40"
          >
            {busy ? "working…" : mode === "signin" ? "sign in" : mode === "signup" ? "create account" : "email me a link"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMsg(null);
            }}
            className="text-xs font-bold text-fog hover:text-lime"
          >
            {mode === "signin" ? "need an account?" : "already have one?"}
          </button>
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setMsg(null);
              }}
              className="text-xs font-bold text-fog hover:text-lime"
            >
              forgot password?
            </button>
          )}
        </div>
      </form>

      {mode === "signup" && (
        <p className="mt-4 text-xs leading-relaxed text-dim">
          Creating an account means you agree to our{" "}
          <Link href="/terms" className="text-lime/80 hover:text-lime">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-lime/80 hover:text-lime">
            Privacy Policy
          </Link>
          . Your workspace stays in this browser until you sign in — signing in is what copies it to the
          cloud so it can be restored and read by a counselor you accept.
        </p>
      )}

      {mode === "reset" && (
        <p className="mt-4 text-xs leading-relaxed text-dim">
          Prefer to do it in the app?{" "}
          <Link href="/auth/reset" className="text-lime hover:underline">
            open the reset page
          </Link>
          .
        </p>
      )}
    </div>
  );
}
