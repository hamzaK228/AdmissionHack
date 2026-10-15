#!/usr/bin/env node
/**
 * Fetch university marks into `public/logos/`, once, at build-authoring time.
 *
 * Why this exists at all, and why it is a script rather than a runtime request:
 *
 *  1. **The cursor trail cannot fetch.** A trail spawns a mark every ~24px of travel, so
 *     hotlinking an image per mark would be a network request every few pixels — slow,
 *     janky, and it would leak the visitor's IP to a third party per mark. The images
 *     have to be local.
 *  2. **The reference does the same thing.** iHub Admissions serves `yale-*.webp`,
 *     `columbia-*.webp`, `cornell-*.webp` from its own asset folder — real university
 *     marks, vendored into the build. That is the established practice in this market.
 *  3. **These are third-party trademarks.** Using a university's mark to *identify that
 *     university* is nominative use and is what every directory and comparison site does;
 *     it must never imply endorsement or partnership. Preferred source is the mark the
 *     university publishes for exactly this purpose — its own `apple-touch-icon`, which
 *     is typically 180x180 and therefore crisp at badge size. If an institution objects,
 *     delete its file and the UI falls back to initials automatically.
 *
 * Usage:  node scripts/fetch-university-logos.mjs [--check]
 * `--check` re-verifies which files already exist without downloading.
 */

import { mkdir, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "logos");
const MANIFEST = join(ROOT, "src", "data", "logos.ts");

/** The display name must match our data EXACTLY — it is the lookup key. */
const UNIVERSITIES = [
  { name: "Massachusetts Institute of Technology (MIT)", slug: "mit", domain: "mit.edu" },
  { name: "Stanford University", slug: "stanford", domain: "stanford.edu" },
  { name: "Harvard University", slug: "harvard", domain: "harvard.edu" },
  { name: "University of Oxford", slug: "oxford", domain: "ox.ac.uk" },
  { name: "University of Cambridge", slug: "cambridge", domain: "cam.ac.uk" },
  { name: "Imperial College London", slug: "imperial", domain: "imperial.ac.uk" },
  { name: "University College London (UCL)", slug: "ucl", domain: "ucl.ac.uk" },
  { name: "University of California, Berkeley", slug: "berkeley", domain: "berkeley.edu" },
  { name: "Columbia University", slug: "columbia", domain: "columbia.edu" },
  { name: "Princeton University", slug: "princeton", domain: "princeton.edu" },
  { name: "Yale University", slug: "yale", domain: "yale.edu" },
  { name: "Cornell University", slug: "cornell", domain: "cornell.edu" },
  { name: "University of Pennsylvania", slug: "upenn", domain: "upenn.edu" },
  { name: "California Institute of Technology", slug: "caltech", domain: "caltech.edu" },
  { name: "ETH Zurich", slug: "eth", domain: "ethz.ch" },
  { name: "National University of Singapore", slug: "nus", domain: "nus.edu.sg" },
  { name: "University of Toronto", slug: "utoronto", domain: "utoronto.ca" },
  { name: "McGill University", slug: "mcgill", domain: "mcgill.ca" },
  { name: "University of British Columbia (UBC)", slug: "ubc", domain: "ubc.ca" },
  { name: "Technical University of Munich (TUM)", slug: "tum", domain: "tum.de" },
  { name: "University of Edinburgh", slug: "edinburgh", domain: "ed.ac.uk" },
  { name: "University of Manchester", slug: "manchester", domain: "manchester.ac.uk" },
  { name: "London School of Economics (LSE)", slug: "lse", domain: "lse.ac.uk" },
  { name: "RWTH Aachen University", slug: "rwth", domain: "rwth-aachen.de" },
  { name: "Georgia Institute of Technology", slug: "gatech", domain: "gatech.edu" },
  { name: "University of Michigan, Ann Arbor", slug: "umich", domain: "umich.edu" },
  { name: "University of Waterloo", slug: "uwaterloo", domain: "uwaterloo.ca" },
  { name: "University of Texas at Austin", slug: "utexas", domain: "utexas.edu" },
];

/** The paths worth trying, best quality first. */
const CANDIDATES = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/apple-touch-icon-180x180.png",
  "/favicon-32x32.png",
  "/favicon.png",
  "/favicon.ico",
];

/**
 * The vendored-size budget, enforced here rather than in the UI.
 *
 * The trail's whole design is that it costs almost nothing, and it spawns a mark every
 * ~24px of travel. Two of these icons (UCL 433 KB, Penn 243 KB) are full multi-size ICO
 * bundles — perfectly good icons, and useless here: vendoring them would add 676 KB to a
 * page whose trail budget is a couple of hundred kilobytes in total. Everything else is
 * 1-28 KB. So the constraint lives at the point of download: anything over the budget is
 * not vendored at all, and the UI falls back to that university's initials.
 *
 * It is also the honest place for it. A limit expressed as "we only ship marks small
 * enough to be free" is a design decision; the same limit buried in a component reads as
 * a bug.
 */
const MAX_BYTES = 60_000;
const MIN_BYTES = 700; // anything smaller is a placeholder, not a mark

/**
 * A normal browser user-agent, deliberately.
 *
 * The first run of this script fetched 11 of 28 marks, and the misses were not missing:
 * stanford.edu answered `403` to an unfamiliar `User-Agent` and `200 image/x-icon` to a
 * browser's. Several university sites sit behind bot protection that keys on exactly
 * that, so a custom agent turns a working request into a false negative.
 */
const UA =
  "Mozilla/5.0 (X11; Linux x86_64; rv:157.0) Gecko/20100101 Firefox/157.0";

async function grab(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA, accept: "image/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/image\//i.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES || buf.length > MAX_BYTES) return null;
    return { buf, type };
  } catch {
    return null;
  }
}

/**
 * The marks a site actually declares.
 *
 * Some institutions serve nothing at the conventional paths — ethz.ch answers `404` for
 * both `apple-touch-icon.png` and `favicon.ico` — because their icon lives at a hashed
 * build path. So when the guesses fail, read the homepage and follow its own `<link
 * rel="icon">`, which is the authoritative answer rather than another guess.
 */
async function declaredIcons(domain) {
  try {
    const res = await fetch(`https://${domain}/`, {
      redirect: "follow",
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const out = [];
    const re = /<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]*href=["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html))) {
      const href = m[2];
      if (href.startsWith("data:")) continue;
      try {
        out.push(new URL(href, `https://${domain}/`).href);
      } catch {
        /* unparseable href — skip rather than guess */
      }
    }
    return out.slice(0, 6);
  } catch {
    return [];
  }
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  await mkdir(OUT, { recursive: true });

  const found = {};
  const missed = [];

  for (const u of UNIVERSITIES) {
    const ext = (t) => (t.includes("svg") ? "svg" : t.includes("webp") ? "webp" : t.includes("ico") ? "ico" : "png");
    const existing = existsSync(join(OUT, `${u.slug}.png`))
      ? "png"
      : existsSync(join(OUT, `${u.slug}.ico`))
        ? "ico"
        : existsSync(join(OUT, `${u.slug}.webp`))
          ? "webp"
          : null;

    if (checkOnly) {
      if (existing) found[u.name] = `/logos/${u.slug}.${existing}`;
      else missed.push(u.name);
      continue;
    }

    if (existing) {
      found[u.name] = `/logos/${u.slug}.${existing}`;
      continue;
    }

    let hit = null;
    for (const path of CANDIDATES) {
      hit = await grab(`https://${u.domain}${path}`);
      if (hit) break;
    }
    if (!hit) {
      // fall back to the icon the site declares for itself, then to www.
      for (const url of [...(await declaredIcons(u.domain)), ...(await declaredIcons(`www.${u.domain}`))]) {
        hit = await grab(url);
        if (hit) break;
      }
    }
    if (!hit) {
      for (const path of CANDIDATES) {
        hit = await grab(`https://www.${u.domain}${path}`);
        if (hit) break;
      }
    }
    if (!hit) {
      missed.push(`${u.name} (${u.domain})`);
      continue;
    }
    const name = `${u.slug}.${ext(hit.type)}`;
    await writeFile(join(OUT, name), hit.buf);
    found[u.name] = `/logos/${name}`;
    console.log(`  ok  ${name.padEnd(18)} ${(hit.buf.length / 1024).toFixed(1)} KB`);
  }

  const files = await readdir(OUT).catch(() => []);

  // the manifest is generated so the component never has to guess a filename
  const body = `/**
 * University marks, keyed by the EXACT display name used in the directory.
 *
 * GENERATED by scripts/fetch-university-logos.mjs — re-run it to refresh, and do not
 * hand-edit. An institution missing from this map is not an error: the UI falls back to
 * the university's initials, which is also the answer if anyone asks us to remove a mark.
 *
 * These are third-party trademarks, used only to identify the university they belong to.
 * No endorsement or partnership is implied.
 */
export const UNIVERSITY_LOGOS: Record<string, string> = {
${Object.entries(found)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n")}
};

/** Files present on disk, for the check output. */
export const LOGO_FILE_COUNT = ${files.length};
`;
  await writeFile(MANIFEST, body);

  console.log(`\n${Object.keys(found).length} marks in the manifest · ${missed.length} missing`);
  if (missed.length) console.log("missing:\n  " + missed.join("\n  "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
