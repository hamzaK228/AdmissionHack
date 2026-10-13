"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { AhRole } from "./database.types";

export interface AuthUser {
  id: string;
  email: string;
  role: AhRole;
  fullName: string;
}

export type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string };

const ROLES: readonly AhRole[] = ["student", "counselor", "parent"];
const asRole = (v: unknown): AhRole =>
  typeof v === "string" && (ROLES as readonly string[]).includes(v) ? (v as AhRole) : "student";

/** GoTrue reports an unconfirmed address in the message and, usually, a code. */
const isUnconfirmed = (message: string, code?: string) =>
  code === "email_not_confirmed" || /not confirmed/i.test(message);

/**
 * Session, role, and the account lifecycle.
 *
 * Absent a configured backend every consumer sees `configured: false` and keeps
 * working entirely locally, so an unconfigured deploy is still a usable product
 * rather than a broken one.
 *
 * The profile row is created lazily, on first authenticated load, by
 * `ah_ensure_profile` — not by a trigger on `auth.users`, which would put this
 * schema's faults inside another app's signup transaction. The same call claims
 * any counselor invites already addressed to the email.
 *
 * Whether a new signup is signed in immediately or has to click a link depends on
 * the project's "Confirm email" setting, which is server-side: `signUp` reports
 * which of the two happened rather than this layer assuming one.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** set when a sign-in failed only because the address is unconfirmed */
  const [needsConfirmation, setNeedsConfirmation] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    const { data } = await sb.auth.getUser();
    if (!data.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    const meta = (data.user.user_metadata ?? {}) as { full_name?: string; role?: string };
    const intended = asRole(meta.role);

    // Idempotent: creates the profile the first time, no-ops afterwards. Falls
    // back to a plain read so a missing RPC (schema not applied yet) degrades
    // into "signed in, default role" instead of an error screen.
    let role = intended;
    let fullName = meta.full_name ?? "";

    const { data: prof, error: rpcError } = await sb.rpc("ah_ensure_profile", {
      p_full_name: fullName,
      p_role: intended,
    });
    if (rpcError) {
      const { data: row } = await sb
        .from("ah_profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      if (row) {
        role = asRole(row.role);
        fullName = row.full_name ?? fullName;
      }
    } else if (prof) {
      role = asRole(prof.role);
      fullName = prof.full_name ?? fullName;
    }

    setUser({ id: data.user.id, email: data.user.email ?? "", role, fullName });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const sb = supabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const signUp = async (
    email: string,
    password: string,
    role: AhRole,
    fullName: string,
  ): Promise<AuthResult> => {
    const sb = supabase();
    if (!sb) return { ok: false, error: "backend not configured" };
    setError(null);
    setNeedsConfirmation(null);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
        emailRedirectTo: typeof location !== "undefined" ? `${location.origin}/dashboard` : undefined,
      },
    });
    if (error) {
      setError(error.message);
      return { ok: false, error: error.message };
    }
    // with confirmation on, GoTrue returns a user but no session
    const needsConfirmation = !data.session;
    if (needsConfirmation) setNeedsConfirmation(email);
    await load();
    return { ok: true, needsConfirmation };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const sb = supabase();
    if (!sb) return { ok: false, error: "backend not configured" };
    setError(null);
    setNeedsConfirmation(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      const code = (error as { code?: string }).code;
      // an unconfirmed address is not a wrong password, and saying so is the
      // difference between a user retrying and a user resending the email
      if (isUnconfirmed(error.message, code)) {
        setNeedsConfirmation(email);
        const msg = "That email has not been confirmed yet.";
        setError(msg);
        return { ok: false, error: msg };
      }
      setError(error.message);
      return { ok: false, error: error.message };
    }
    await load();
    return { ok: true };
  };

  /** Re-send the signup confirmation for an address that never got one. */
  const resendConfirmation = async (email: string): Promise<AuthResult> => {
    const sb = supabase();
    if (!sb) return { ok: false, error: "backend not configured" };
    const { error } = await sb.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: typeof location !== "undefined" ? `${location.origin}/dashboard` : undefined,
      },
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  };

  /** Email a password-reset link. The link returns to /auth/reset with a session. */
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const sb = supabase();
    if (!sb) return { ok: false, error: "backend not configured" };
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: typeof location !== "undefined" ? `${location.origin}/auth/reset` : undefined,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  };

  /** Set a new password for the signed-in (or recovery) session. */
  const updatePassword = async (password: string): Promise<AuthResult> => {
    const sb = supabase();
    if (!sb) return { ok: false, error: "backend not configured" };
    if (password.length < 6) return { ok: false, error: "use at least 6 characters" };
    const { error } = await sb.auth.updateUser({ password });
    return error ? { ok: false, error: error.message } : { ok: true };
  };

  const signOut = async () => {
    const sb = supabase();
    await sb?.auth.signOut();
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    needsConfirmation,
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    reload: load,
  };
}
