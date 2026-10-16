"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Eyebrow } from "@/components/ui";

/**
 * Where an emailed link lands.
 *
 * One page for both links, because both are the same operation — *prove this token, then start a
 * session* — and the only difference is where the student should end up afterwards: a signup
 * belongs in the workspace, a recovery belongs on the page that sets a new password.
 *
 * **Why the app's own page rather than the link Supabase generates.** Both products in the
 * ecosystem share one Supabase project (and therefore one email template), so the template cannot
 * hardcode either product's domain: whatever it hardcodes sends the *other* product's students to
 * the wrong site. Instead the template links to `{{ .RedirectTo }}` — whatever the app passed as
 * its redirect at signup or reset — so each product's mail lands on its own domain, and this page
 * does the verification here.
 *
 * **Why `token_hash` and not a session in the URL fragment.** A token_hash is verified server-side
 * by GoTrue when this page asks it to, so the link works no matter which device opens it: sign up
 * on a laptop, tap the link on a phone, and the phone ends up signed in. It also removes the
 * dependency on the redirect allowlist, which fails silently and confusingly when an origin is
 * missing from it.
 *
 * The fragment path is still handled, deliberately: if a link arrives in the older
 * `supabase.co/auth/v1/verify` form, supabase-js consumes it on init and a session is already
 * present — so a working link is never reported as broken just because it took the other route.
 */
export default function ConfirmEmailPage() {
  const router = useRouter();
  const [state, setState] = useState<"verifying" | "ok" | "failed" | "unconfigured">("verifying");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const sb = supabase();
    if (!sb) {
      setState("unconfigured");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    const next = params.get("next") || "/dashboard";

    const land = (recovery: boolean) => {
      setState("ok");
      // a small beat so the confirmation is seen rather than flashed past
      window.setTimeout(() => router.replace(recovery ? "/auth/reset" : next), 600);
    };

    if (!tokenHash || !type) {
      sb.auth.getSession().then(({ data }) => {
        if (data.session) land(false);
        else {
          setState("failed");
          setDetail("This link has no token in it. Ask for a new email and use the newest link.");
        }
      });
      return;
    }

    sb.auth
      .verifyOtp({ type, token_hash: tokenHash })
      .then(({ error }) => {
        if (error) {
          setState("failed");
          setDetail(error.message);
          return;
        }
        land(type === "recovery");
      })
      .catch((e: unknown) => {
        setState("failed");
        setDetail(e instanceof Error ? e.message : "verification failed");
      });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-5 py-16">
      <div className="rounded-2xl border border-line bg-panel/70 p-6">
        {state === "verifying" && (
          <>
            <Eyebrow>confirming</Eyebrow>
            <p className="mt-3 text-sm text-fog">
              <span className="anim-blink text-lime">▌</span> checking your link…
            </p>
          </>
        )}

        {state === "ok" && (
          <>
            <Eyebrow>confirmed</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-fog">
              You are signed in. Taking you through&nbsp;…
            </p>
          </>
        )}

        {state === "unconfigured" && (
          <>
            <Eyebrow>accounts not configured</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-fog">
              This build has no account backend, so there is no link to confirm.
            </p>
            <Link href="/" className="mt-4 inline-block text-sm font-bold text-lime">
              back to the site →
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <Eyebrow>that link did not work</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-fog">
              Links work once and expire within an hour. Ask for a fresh one and use the newest email
              — an older link in the same inbox will fail even though it looks identical.
            </p>
            {detail && <p className="mt-2 text-xs text-dim">{detail}</p>}
            <div className="mt-5 flex flex-wrap gap-4">
              <Link href="/signin" className="text-sm font-bold text-lime">
                sign in →
              </Link>
              <Link href="/auth/reset" className="text-sm font-bold text-lime/70 hover:text-lime">
                reset your password →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
