"use client";

import Link from "next/link";
import { useStore } from "@/components/dashboard/store";

/** Returning-visitor personalisation, inline in the hero readout. */
export function WelcomeLine() {
  const { ready, profile, apps } = useStore();
  if (!ready || !profile) return null;
  return (
    <>
      <span className="flex items-center gap-2">
        <span className="text-lime">●</span>
        <span className="text-fog">
          welcome back, <span className="font-bold text-paper">{profile.name || "applicant"}</span>
        </span>
      </span>
      <span className="text-line2">/</span>
      <Link href="/dashboard" className="text-lime hover:opacity-80">
        dashboard{apps.length > 0 ? ` (${apps.length})` : ""} →
      </Link>
      <span className="text-line2">/</span>
    </>
  );
}
