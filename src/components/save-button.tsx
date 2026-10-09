"use client";

import { useStore } from "@/components/dashboard/store";

/** Terminal-styled shortlist toggle — stops propagation so it works inside card links. */
export function SaveButton({
  slug,
  size = "sm",
  withLabel = false,
}: {
  slug: string;
  size?: "sm" | "md";
  withLabel?: boolean;
}) {
  const { isSaved, toggleShortlist, ready } = useStore();
  const saved = ready && isSaved(slug);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleShortlist(slug);
      }}
      className={`shrink-0 rounded-lg border font-bold transition-all active:scale-95 ${
        size === "md" ? "px-4 py-2.5 text-sm" : "px-2 py-1 text-[11px]"
      } ${
        saved
          ? "border-lime/60 bg-lime/15 text-lime"
          : "border-line bg-ink text-dim hover:border-lime/40 hover:text-lime"
      }`}
    >
      {saved ? "★" : "+"}
      {withLabel && <span className="ml-1.5">{saved ? "saved" : "save"}</span>}
    </button>
  );
}
