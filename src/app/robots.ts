import type { MetadataRoute } from "next";

/**
 * Robots policy.
 *
 * The public content is exactly the thing we want indexed — the directory, the
 * guides, the exam and country pages — so the only rules here are the surfaces
 * that are private by design: a student's dashboard and the auth flow. Neither is
 * secret (the data is behind RLS regardless), but there is no reason to spend
 * crawl budget on pages that render nothing without a session.
 *
 * Same origin knob as the sitemap, for the same reason: the domain is still
 * undecided.
 */
const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://admissionhack.app").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/auth/", "/cv"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
