"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, createMotionPath } from "animejs";
import { useReducedMotion } from "motion/react";
import { useStore } from "@/components/dashboard/store";
import { COUNTRY_COORDS } from "@/data/geo";
import { LAND_W, LAND_H, landMask } from "@/data/land-mask";
import { buildRoutes, type RouteInput } from "@/lib/routes";
import { Eyebrow } from "@/components/ui";
import type { SlimUni } from "@/lib/match-engine";

/**
 * Your own earth: where you are, and the arcs to every university on your list.
 *
 * Two things make this different from the landing globe, and both are deliberate:
 *
 *  1. **It does not rotate, and it is not redrawn.** The view is centred on the
 *     student's own location, so the globe is rendered to a canvas *once* (and again
 *     only on resize), and the arcs are static SVG geometry. There is no animation
 *     frame loop anywhere in this component — the only moving things are a handful of
 *     markers, animated by anime.js along the arc paths. That is the whole performance
 *     argument: a spinning globe costs a frame loop forever, and this costs ~8 tweens.
 *  2. **The camera looks at you.** A globe centred on the prime meridian would put a
 *     Kazakhstani student's home near the edge and half their list behind the sphere.
 *     Centred on home, everyone they applied to radiates outward.
 *
 * The arcs are drawn along the great circle and lifted at the midpoint, which is what
 * makes a line between two dots read as a flight path rather than a chord.
 *
 * The home location is kept in this browser for now, and the page says so — the same
 * honest limit the CV builder has. Syncing it is one column away when it matters.
 */

const VB = 1000;
const CX = VB / 2;
const CY = VB / 2;
const R = VB * 0.38;
const HOME_KEY = "ah.home";

/**
 * Country lookup, normalised.
 *
 * The two vocabularies do not quite agree: the coordinate table is keyed
 * `"China (Mainland)"` while a university carries `"China"`, so a direct lookup silently
 * drops every Chinese destination — an arc that simply never appears, with no error to
 * chase. The table is folded once so a name and its parenthetical-stripped form both
 * resolve.
 */
const COORDS: Record<string, [number, number]> = (() => {
  const out: Record<string, [number, number]> = {};
  for (const [k, v] of Object.entries(COUNTRY_COORDS)) {
    out[k.toLowerCase()] = v;
    out[k.replace(/\s*\(.*\)$/, "").toLowerCase()] = v;
  }
  return out;
})();
const coordsFor = (name: string): [number, number] | undefined => COORDS[name.toLowerCase()];

/** Land dots are projected once, so this must stay cheap: ~41k points, no allocation. */
function drawGlobe(canvas: HTMLCanvasElement, home: [number, number]) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const w = rect.width;
  const h = rect.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.38; // the same ratio as the SVG viewBox, so the layers align
  if (r <= 0) return;

  const DEG = Math.PI / 180;
  const la0 = home[0] * DEG;
  const lo0 = home[1] * DEG;
  const F = [Math.cos(la0) * Math.cos(lo0), Math.sin(la0), Math.cos(la0) * Math.sin(lo0)];
  const Rv = [-Math.sin(lo0), 0, Math.cos(lo0)];
  const U = [-Math.sin(la0) * Math.cos(lo0), Math.cos(la0), -Math.sin(la0) * Math.sin(lo0)];

  // sphere body
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.34, r * 0.1, cx, cy, r);
  g.addColorStop(0, "rgba(11,15,13,0.96)");
  g.addColorStop(1, "rgba(2,4,3,0.98)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // continents — one batched path, front hemisphere only
  const mask = landMask();
  const path = new Path2D();
  for (let i = 0; i < LAND_W * LAND_H; i++) {
    if (!mask[i]) continue;
    const gx = i % LAND_W;
    const gy = (i - gx) / LAND_W;
    const la = (90 - ((gy + 0.5) * 180) / LAND_H) * DEG;
    const lo = (-180 + ((gx + 0.5) * 360) / LAND_W) * DEG;
    const cl = Math.cos(la);
    const vx = cl * Math.cos(lo);
    const vy = Math.sin(la);
    const vz = cl * Math.sin(lo);
    const depth = vx * F[0] + vy * F[1] + vz * F[2];
    if (depth <= 0.03) continue;
    const east = vx * Rv[0] + vy * Rv[1] + vz * Rv[2];
    const north = vx * U[0] + vy * U[1] + vz * U[2];
    const s = 0.6 + depth * 0.66;
    path.rect(cx + east * r, cy - north * r, s, s);
  }
  ctx.fillStyle = "rgba(238,246,236,0.82)";
  ctx.fill(path);

  // limb shading — one gradient, so the dot field reads as a sphere
  const limb = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
  limb.addColorStop(0, "rgba(3,5,4,0)");
  limb.addColorStop(0.72, "rgba(3,5,4,0.32)");
  limb.addColorStop(1, "rgba(3,5,4,0.92)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = limb;
  ctx.fill();

  // rim
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(201,255,74,0.28)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

export function PersonalEarth({ uniIndex }: { uniIndex: Record<string, SlimUni> }) {
  const { apps } = useStore();
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [home, setHome] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [size, setSize] = useState(0);

  useEffect(() => {
    try {
      setHome(window.localStorage.getItem(HOME_KEY) ?? "");
    } catch {
      /* private mode */
    }
    setLoaded(true);
  }, []);

  const choose = (name: string) => {
    setHome(name);
    try {
      window.localStorage.setItem(HOME_KEY, name);
    } catch {
      /* ignore */
    }
  };

  const homeCoords = home ? coordsFor(home) : undefined;

  /** The destinations: every university on the list, at its country's centroid. */
  const targets = useMemo<RouteInput[]>(() => {
    const seen = new Set<string>();
    const out: RouteInput[] = [];
    for (const a of apps) {
      const u = uniIndex[a.slug];
      if (!u) continue;
      const coords = coordsFor(u.countryName);
      if (!coords) continue;
      // one arc per country, so a list of six UK universities is not six identical lines
      if (seen.has(u.countryName)) continue;
      seen.add(u.countryName);
      out.push({ name: u.name, country: u.countryName, lat: coords[0], lng: coords[1] });
    }
    return out;
  }, [apps, uniIndex]);

  const { routes } = useMemo(
    () => (homeCoords ? buildRoutes(homeCoords, targets, CX, CY, R) : { routes: [] }),
    [homeCoords, targets],
  );

  // measure once, and again on resize — the canvas is the only thing that depends on it
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => setSize(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the globe is drawn to canvas once per (home, size). No frame loop.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !homeCoords) return;
    drawGlobe(el, homeCoords);
  }, [homeCoords, size]);

  // only the markers move: one anime.js tween per route, along its own arc
  useEffect(() => {
    const svg = svgRef.current;
    if (reduce || !svg || routes.length === 0) return;

    const running = routes.map((_, i) => {
      const path = svg.querySelector<SVGPathElement>(`#arc-${i}`);
      const pulse = svg.querySelector<SVGCircleElement>(`#pulse-${i}`);
      if (!path || !pulse) return null;
      const motion = createMotionPath(path);
      if (!motion) return null;
      return animate(pulse, {
        translateX: motion.translateX,
        translateY: motion.translateY,
        duration: 2400 + i * 140,
        delay: i * 220,
        loop: true,
        loopDelay: 700,
        ease: "inOutSine",
      });
    });

    return () => {
      for (const a of running) a?.revert();
    };
  }, [routes, reduce]);

  if (!loaded) return <p className="text-sm text-dim">loading…</p>;

  const countries = Object.keys(COUNTRY_COORDS).sort();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow>your own earth</Eyebrow>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
            Every university on your list, plotted from where you are. The view is centred on your own
            location, so the arcs radiate out from you rather than wrapping around the back of the planet.
          </p>
        </div>
        <label className="shrink-0 text-xs text-dim">
          <span className="mb-1.5 block font-bold uppercase tracking-wider">you are in</span>
          <select
            className="rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-paper outline-none focus:border-lime/60 [&>option]:bg-ink"
            value={home}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="">choose your country…</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!homeCoords && (
        <p className="mt-6 rounded-2xl border border-dashed border-line2 p-6 text-sm text-fog">
          Choose the country you are applying <em>from</em> above — not where you want to go. That is what
          puts you at the middle of the map.
        </p>
      )}

      {homeCoords && apps.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line2 p-6 text-sm text-fog">
          Nothing to plot yet. Add universities to your list and each one gets an arc from you.
        </p>
      )}

      {homeCoords && (
        <div className="relative mx-auto mt-8 aspect-square w-full max-w-[620px]">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VB}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Earth centred on ${home}, with arcs to ${routes.length} destinations`}
          >
            <style>{`
              .route-arc { stroke-dasharray: 5 7; animation: route-flow 2.4s linear infinite; }
              @keyframes route-flow { to { stroke-dashoffset: -24; } }
              @media (prefers-reduced-motion: reduce) { .route-arc { animation: none; } }
            `}</style>

            {routes.map((r, i) => (
              <g key={`${r.country}-${i}`}>
                <path id={`arc-${i}`} className="route-arc" d={r.d} fill="none" stroke="#c9ff4a" strokeWidth={1.4} strokeOpacity={0.5} />
                {/* the travelling signal — the only thing animated by JS */}
                <circle id={`pulse-${i}`} r={4} fill="#c9ff4a" opacity={0.95} />
                {/* the destination, readable and static */}
                <g transform={`translate(${r.end.x.toFixed(1)} ${r.end.y.toFixed(1)})`}>
                  <circle r={17} fill="#05080a" stroke="#c9ff4a" strokeOpacity={0.6} strokeWidth={1.2} />
                  <text textAnchor="middle" dominantBaseline="central" fill="#c9ff4a" fontSize={13} fontFamily="monospace" fontWeight="bold">
                    {r.mark}
                  </text>
                </g>
              </g>
            ))}

            {/* you are here */}
            <g transform={`translate(${CX} ${CY})`}>
              <circle r={26} fill="none" stroke="#c9ff4a" strokeOpacity={0.35} strokeWidth={1} />
              <circle r={5} fill="#c9ff4a" />
              <text y={44} textAnchor="middle" fill="#c9ff4a" fontSize={12} fontFamily="monospace">
                you · {home}
              </text>
            </g>
          </svg>
        </div>
      )}

      {homeCoords && routes.length > 0 && (
        <p className="mt-6 text-xs leading-relaxed text-dim">
          One arc per country, so six British universities draw one line rather than six. Markers are the
          university&rsquo;s initials, not its logo — those are third-party trademarks. Where you are is kept
          in this browser only for now.{" "}
          {reduce ? "Motion is off in your system settings, so the arcs are drawn without the travelling signal." : ""}
        </p>
      )}
    </div>
  );
}
