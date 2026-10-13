"use client";

import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Eyebrow } from "@/components/ui";

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";
const labelCls = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-dim";

const ROLES = [
  { id: "student", label: "student", desc: "I'm applying" },
  { id: "counselor", label: "counselor", desc: "I guide applicants" },
  { id: "parent", label: "parent", desc: "I'm supporting one" },
] as const;

/**
 * Account panel: sign in / sign up, role, and sign-out.
 *
 * Workspace sync is a bonus, never a requirement — this panel says so plainly
 * when no backend is configured rather than showing a broken form.
 */
export function AuthPanel() {
  const { user, loading, configured, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("student");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (loading) {
    return <p className="text-sm text-dim">checking session…</p>;
  }

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
        <button
          type="button"
          onClick={signOut}
          className="link-quiet mt-5 rounded-lg border border-line2 px-4 py-2 text-xs font-bold text-fog"
        >
          sign out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl rounded-2xl border border-line bg-panel/70 p-6">
      <Eyebrow>{mode === "signin" ? "sign in" : "create an account"}</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        {mode === "signin"
          ? "Sign in to sync your workspace across devices and let a counselor review it."
          : "An account lets your workspace follow you to any device — and lets you invite a counselor."}
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          const res =
            mode === "signin"
              ? await signIn(email, password)
              : await signUp(email, password, role, name);
          setBusy(false);
          if (!res.ok) setMsg(res.error);
          else if (mode === "signup") setMsg("check your email to confirm, then sign in");
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
                      role === r.id
                        ? "border-lime/60 bg-lime/10"
                        : "border-line bg-ink hover:border-lime/30"
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

        {msg && <p className="text-xs leading-relaxed text-amber">{msg}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-40"
          >
            {busy ? "working…" : mode === "signin" ? "sign in" : "create account"}
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
        </div>
      </form>
    </div>
  );
}
