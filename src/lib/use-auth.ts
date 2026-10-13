"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "counselor" | "parent";
  fullName: string;
}

/**
 * Session + the user's role.
 *
 * Absent a configured backend every consumer sees `configured: false` and keeps
 * working entirely locally, so an unconfigured deploy is still a usable product
 * rather than a broken one.
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
    const { data: prof } = await sb
      .from("ah_profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .maybeSingle();
    setUser({
      id: data.user.id,
      email: data.user.email ?? "",
      role: (prof?.role as AuthUser["role"]) ?? "student",
      fullName: prof?.full_name ?? "",
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const sb = supabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const signUp = async (email: string, password: string, role: AuthUser["role"], fullName: string) => {
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

  return { user, loading, error, configured: isSupabaseConfigured, signIn, signUp, signOut, reload: load };
}
