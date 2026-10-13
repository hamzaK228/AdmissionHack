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

const ROLES: readonly AhRole[] = ["student", "counselor", "parent"];
const asRole = (v: unknown): AhRole =>
  typeof v === "string" && (ROLES as readonly string[]).includes(v) ? (v as AhRole) : "student";

/**
 * Session + the user's role.
 *
 * Absent a configured backend every consumer sees `configured: false` and keeps
 * working entirely locally, so an unconfigured deploy is still a usable product
 * rather than a broken one.
 *
 * The profile row is created lazily, on first authenticated load, by
 * `ah_ensure_profile` — not by a trigger on `auth.users`. That keeps this
 * schema's faults out of the auth flow entirely, and the same call claims any
 * counselor invites already addressed to this email.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        role = row.role;
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

  const signUp = async (email: string, password: string, role: AhRole, fullName: string) => {
    const sb = supabase();
    if (!sb) return { ok: false as const, error: "backend not configured" };
    setError(null);
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      return { ok: false as const, error: error.message };
    }
    await load();
    return { ok: true as const };
  };

  const signIn = async (email: string, password: string) => {
    const sb = supabase();
    if (!sb) return { ok: false as const, error: "backend not configured" };
    setError(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return { ok: false as const, error: error.message };
    }
    await load();
    return { ok: true as const };
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
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    reload: load,
  };
}
