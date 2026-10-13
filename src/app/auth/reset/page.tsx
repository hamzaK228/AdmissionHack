"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Eyebrow } from "@/components/ui";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim";

/**
 * Password reset, in one page with three states.
 *
 * `/auth/reset` is both the page a user visits to ask for a link, and the page
 * the emailed link returns to — because the link carries a recovery session, the
 * same route can tell the two situations apart instead of needing a second one.
 *
 * The redirect target must be listed in the Supabase project's allowed Redirect
 * URLs, or GoTrue silently falls back to the project's Site URL and the link
 * lands somewhere that cannot finish the job.
 */
export default function ResetPasswordPage() {
  const [mode, setMode] = useState<"checking" | "request" | "update" | "done">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const sb = supabase();
    if (!sb) {
      setMode("request");
      return;
    }

    // the recovery link puts a session in the URL; supabase-js consumes it on
    // init, so a session here means "they arrived from the email"
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    sb.auth.getSession().then(({ data }) => {
      setMode((m) => (m === "checking" ? (data.session ? "update" : "request") : m));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-5 py-16">
      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-dashed border-line2 bg-panel/40 p-6">
          <Eyebrow>accounts not configured</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            This build has no account backend, so there is no password to reset. Everything works
            locally in your browser.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-xs font-bold text-lime hover:underline">
            go to the workspace →
          </Link>
        </div>
      ) : mode === "checking" ? (
        <p className="text-sm text-dim">checking your link…</p>
      ) : mode === "done" ? (
        <div className="rounded-2xl border border-lime/30 bg-panel/70 p-6">
          <Eyebrow>password changed</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            You are signed in with the new password.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-xs font-bold text-lime hover:underline">
            go to the workspace →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-panel/70 p-6">
          <Eyebrow>{mode === "update" ? "set a new password" : "reset your password"}</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            {mode === "update"
              ? "Your link worked. Choose a new password for this account."
              : "Enter your email and we will send you a link to set a new password."}
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const sb = supabase();
              if (!sb) return;
              setBusy(true);
              setMsg(null);

              if (mode === "update") {
                if (password.length < 6) {
                  setBusy(false);
                  setMsg({ tone: "err", text: "use at least 6 characters" });
                  return;
                }
                const { error } = await sb.auth.updateUser({ password });
                setBusy(false);
                if (error) setMsg({ tone: "err", text: error.message });
                else setMode("done");
                return;
              }

              const { error } = await sb.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/auth/reset`,
              });
              setBusy(false);
              setMsg(
                error
                  ? { tone: "err", text: error.message }
                  : {
                      tone: "ok",
                      text: "if that address has an account, a link is on its way — open it on this device.",
                    },
              );
            }}
          >
            {mode === "update" ? (
              <div>
                <label className={labelCls} htmlFor="rp-pass">
                  new password
                </label>
                <input
                  id="rp-pass"
                  type="password"
                  required
                  minLength={6}
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="at least 6 characters"
                />
              </div>
            ) : (
              <div>
                <label className={labelCls} htmlFor="rp-email">
                  email
                </label>
                <input
                  id="rp-email"
                  type="email"
                  required
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}

            {msg && (
              <p className={`text-xs leading-relaxed ${msg.tone === "ok" ? "text-mint" : "text-amber"}`}>
                {msg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-40"
            >
              {busy ? "working…" : mode === "update" ? "set the password" : "email me a link"}
            </button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-dim">
            <Link href="/dashboard" className="text-lime hover:underline">
              back to the workspace
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
