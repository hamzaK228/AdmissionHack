"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { animate, createMotionPath } from "animejs";
import { useReducedMotion } from "motion/react";
import { useStore } from "@/components/dashboard/store";
import { COUNTRY_COORDS, globePoints } from "@/data/geo";
import { UNIVERSITY_LOGOS } from "@/data/logos";
import { LAND_W, LAND_H, landMask } from "@/data/land-mask";
import { buildRoutes, cameraFor, markFor, project, toVec, type RouteInput } from "@/lib/routes";
import { Eyebrow } from "@/components/ui";
import type { SlimUni } from "@/lib/match-engine";

/**
 * Your own earth: where you are, and the arcs to every university on your list.
 *
 * Three things make this different from the landing globe, and all three are deliberate:
 *
 *  1. **It does not rotate, and it is not redrawn.** The view is centred on the
 *     student's own location, so the globe is rendered to a canvas *once* (and again
 *     only on resize), and the arcs are static SVG geometry. There is no animation
 *     frame loop anywhere in this component — the only moving things are a handful of
 *     markers, animated by anime.js along the arc paths.
 *  2. **The camera looks at you.** A globe centred on the prime meridian would put a
 *     Kazakhstani student's home near the edge and half their list behind the sphere.
 *     Centred on home, everyone they applied to radiates outward.
 *  3. **Every university is its own destination.** Not one marker per country: a list
 *     of six British universities is six arcs to six places the student actually chose,
 *     each one labelled with the institution's own mark.
 *
 * The home location is kept in this browser for now, and the page says so — the same
 * honest limit the CV builder has. Syncing it is one column away when it matters.
 */

const VB = 1000;
const CX = VB / 2;
const CY = VB / 2;
const R = VB * 0.38;
/** marker card size in viewBox units (the viewBox is 1000 wide, whatever its pixel size) */
const MARK = 46;
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

/**
 * Every university's own latitude and longitude, keyed by the display name.
 *
 * This is what changed the tab from a country map into a map of the student's list.
 * Plotting at country centroids meant six British universities collapsed into one
 * marker, and the initials were not even unique — Tokyo and Toronto both came out as
 * "UT", so the picture could not be read. The directory's globe data already carries a
 * real coordinate for every one of the 1,506 institutions; a country centroid is now
 * only the fallback for a name the two datasets spell differently.
 */
const UNI_COORDS = (() => {
  const m = new Map<string, { lat: number; lng: number }>();
  for (const p of globePoints()) m.set(p.name, { lat: p.lat, lng: p.lng });
  return m;
})();

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

interface Destination extends RouteInput {
  slug: string;
  rank: number | null;
  logo?: string;
  mark: string;
}

export function PersonalEarth({ uniIndex }: { uniIndex: Record<string, SlimUni> }) {
  const { apps } = useStore();
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  /**
   * The canvas lives inside a conditional, so the element appears *after* the first
   * render — a ref read on mount finds nothing, and the width it measures would stay
   * at zero forever, leaving the sphere undrawn and immune to resizing. Held in state
   * so the observer attaches when the element actually exists.
   */
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [home, setHome] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [size, setSize] = useState(0);
  /**
   * Which university is highlighted, **by name rather than by index**.
   *
   * Indices cannot be shared between the markers and the legend: the arc builder drops
   * a destination that has rotated behind the globe, so the routes array is not
   * positionally aligned with the list of universities the student chose. Two numbering
   * systems that drift apart by one is exactly how a logo ends up over the wrong
   * university.
   */
  const [active, setActive] = useState<string | null>(null);

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
  /**
   * Where the camera points: `null` means "look at home".
   *
   * An orthographic globe shows one hemisphere, so a view centred strictly on home hides
   * every destination more than 90° away — for a Kazakhstani student with an American
   * list, that is the whole list. The view is therefore turnable two ways: **drag the
   * planet**, or click a university in the legend to bring it to the middle. A drag
   * produces arbitrary angles, so the view is a latitude and longitude; `name` is set
   * only when a university is what the camera was pointed at, so the caption can say
   * which.
   */
  const [view, setView] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  /**
   * Dragging, and why this is still not a frame loop.
   *
   * A drag produces a new view on every pointer event, and each one costs a canvas repaint
   * and a rebuild of every arc — so the updates are coalesced to one per animation frame.
   * The globe is redrawn *while you are turning it* and not one frame longer, which is the
   * same bargain the design started with; there is no timer, and an untouched globe costs
   * nothing.
   */
  const drag = useRef({ active: false, x: 0, y: 0, moved: false });
  /** the lat/lng the current gesture has accumulated, held across frames so a burst of
      pointer events cannot each apply its delta to a stale view and stutter */
  const acc = useRef<{ lat: number; lng: number } | null>(null);
  const queued = useRef<{ lat: number; lng: number } | null>(null);
  const frame = useRef(0);
  const viewRef = useRef<{ lat: number; lng: number; name?: string } | null>(null);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /**
   * The destinations: the universities themselves, not the countries they sit in.
   * Sorted by rank so the strongest appear first in the legend and the drawing order
   * puts the best-known marks on top where they overlap.
   */
  const targets = useMemo<Destination[]>(() => {
    const out: Destination[] = [];
    for (const a of apps) {
      const u = uniIndex[a.slug];
      if (!u) continue;
      const own = UNI_COORDS.get(u.name);
      const centre = coordsFor(u.countryName);
      const lat = own?.lat ?? centre?.[0];
      const lng = own?.lng ?? centre?.[1];
      if (lat === undefined || lng === undefined) continue;
      out.push({
        slug: u.slug,
        name: u.name,
        country: u.countryName,
        lat,
        lng,
        rank: u.qsRank,
        logo: UNIVERSITY_LOGOS[u.name],
        mark: markFor(u.name),
      });
    }
    return out.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
  }, [apps, uniIndex]);

  /** The camera's target: the turned view when there is one, home when there is not. */
  const viewCoords = useMemo<[number, number] | undefined>(
    () => (view ? [view.lat, view.lng] : homeCoords),
    [view, homeCoords],
  );
  const camera = useMemo(
    () => (viewCoords ? cameraFor(viewCoords[0], viewCoords[1]) : null),
    [viewCoords],
  );

  const { routes } = useMemo(
    () =>
      homeCoords && viewCoords
        ? buildRoutes(homeCoords, targets, CX, CY, R, viewCoords)
        : { routes: [] },
    [homeCoords, viewCoords, targets],
  );

  /** where the student's own dot lands — the centre only while the view is on home */
  const homePoint = useMemo(
    () => (camera && homeCoords ? project(toVec(homeCoords[0], homeCoords[1]), camera, CX, CY, R) : null),
    [camera, homeCoords],
  );

  /**
   * Turning the planet by hand.
   *
   * The rate is chosen so that dragging the globe's own radius turns it about a quarter
   * turn — fast enough to cross the world in one gesture, slow enough to land on a city.
   * Latitude stops short of the poles, where the axis of a longitude rotation degenerates
   * and the globe would start spinning rather than tracking.
   */
  const RAD_PER_PX = 0.006;
  const MAX_LAT = 1.45;

  const flush = () => {
    frame.current = 0;
    const next = queued.current;
    if (!next) return;
    queued.current = null;
    setView(next);
  };

  const onDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, x: e.clientX, y: e.clientY, moved: false };
    acc.current = null;
    try {
      /* capture so the gesture survives the pointer crossing the legend on its way out. It
         throws for a pointer id the browser does not consider active, which is no reason
         to abandon the drag. */
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* not capturable — the drag still tracks while the pointer is over the globe */
    }
    setDragging(true);
  };

  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 1) drag.current.moved = true;

    const from =
      acc.current ??
      (viewRef.current ? { lat: viewRef.current.lat, lng: viewRef.current.lng } : null) ??
      (homeCoords ? { lat: homeCoords[0], lng: homeCoords[1] } : null);
    if (!from) return;

    const next = {
      lat: Math.max(-MAX_LAT, Math.min(MAX_LAT, from.lat - dy * RAD_PER_PX)),
      lng: from.lng + dx * RAD_PER_PX,
    };
    acc.current = next;
    queued.current = next;
    if (!frame.current) frame.current = requestAnimationFrame(flush);
  };

  const onDragEnd = () => {
    drag.current.active = false;
    acc.current = null;
    setDragging(false);
  };

  /** a route carries the geometry; the destination carries the slug, logo and rank */
  const detail = useMemo(() => new Map(targets.map((t) => [t.name, t])), [targets]);

  // measure when the element appears, and again on resize
  useEffect(() => {
    if (!canvasEl) return;
    const measure = () => setSize(canvasEl.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvasEl);
    return () => ro.disconnect();
  }, [canvasEl]);

  // the globe is drawn to canvas once per (view, size). No frame loop.
  useEffect(() => {
    if (!canvasEl || !viewCoords) return;
    drawGlobe(canvasEl, viewCoords);
  }, [canvasEl, viewCoords, size]);

  // only the markers move: one anime.js tween per route, along its own arc
  useEffect(() => {
    const svg = svgRef.current;
    /**
     * Not while dragging: the pulses ride paths that the gesture is rewriting every frame,
     * and re-creating a tween per route per frame would cost more than the globe itself.
     * They are hidden for the duration and rebuilt once, from the final geometry, when the
     * gesture ends.
     */
    if (reduce || !svg || routes.length === 0 || dragging) return;

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
  }, [routes, reduce, dragging]);

  if (!loaded) return <p className="text-sm text-dim">loading…</p>;

  const countries = Object.keys(COUNTRY_COORDS).sort();
  const withLogo = targets.filter((t) => t.logo).length;
  /**
   * Destinations on the far side of the globe — real, just not currently facing us.
   *
   * Deliberately not a `useMemo`: this line sits after the early `if (!loaded)` return
   * above, so a hook here would run on the second render but not the first, which React
   * rejects outright ("rendered more hooks than during the previous render"). A handful
   * of names is not worth a hook anyway.
   */
  const behind = new Set(routes.filter((r) => r.behind).map((r) => r.name));
  const shown = active !== null ? routes.find((r) => r.name === active) : undefined;
  const shownDetail = active !== null ? detail.get(active) : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Eyebrow>your own earth</Eyebrow>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
            Every university on your list, at its own coordinates, with an arc from where you are. The
            view is centred on your own location, so the arcs radiate out from you rather than wrapping
            around the back of the planet.
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

      {homeCoords && targets.length > 0 && (
        <>
          {/**
           * An orthographic globe shows one hemisphere. Rather than let a student wonder
           * where half their list went, the view says which it is and how to turn it, and
           * clicking a name below rotates the planet to that university.
           */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-dim">
              {view ? (
                <>
                  {view.name ? (
                    <>
                      turned to <span className="text-lime">{view.name}</span>
                    </>
                  ) : (
                    <>free view — you turned the planet by hand</>
                  )}
                  {behind.size > 0 && (
                    <>
                      {" "}
                      — {behind.size} {behind.size === 1 ? "university is" : "universities are"} still on the
                      far side
                    </>
                  )}
                </>
              ) : (
                <>centred on you — drag the planet to turn it, or click a university below</>
              )}
            </p>
            {view && (
              <button
                type="button"
                onClick={() => setView(null)}
                className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-lime transition-colors hover:border-lime/50"
              >
                ← back to me
              </button>
            )}
          </div>
          {/**
           * The whole square takes the drag, not just the disc: a gesture that starts a
           * few pixels outside the limb and then crosses it should still turn the globe,
           * which is how every map in the world behaves. `touchAction: pan-y` keeps a
           * vertical swipe scrolling the page on a phone while a horizontal one turns the
           * planet, so the globe never becomes a trap you cannot scroll past.
           */}
          <div
            className="relative mx-auto mt-4 aspect-square w-full max-w-[620px] cursor-grab select-none active:cursor-grabbing"
            style={{ touchAction: "pan-y" }}
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            onPointerLeave={onDragEnd}
          >
          <canvas ref={setCanvasEl} className="absolute inset-0 h-full w-full" aria-hidden />
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VB}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Earth centred on ${home}, with arcs to ${routes.length} universities`}
          >
            <defs>
              {/* one clip for every marker card: the shape is the same, only the position moves */}
              <clipPath id="pe-mark-clip">
                <circle cx={0} cy={0} r={MARK / 2 - 3} />
              </clipPath>
              <style>{`
                .route-arc { stroke-dasharray: 5 7; animation: route-flow 2.4s linear infinite; }
                @keyframes route-flow { to { stroke-dashoffset: -24; } }
                @media (prefers-reduced-motion: reduce) { .route-arc { animation: none; } }
              `}</style>
            </defs>

            {routes.map((r, i) => (
              <g key={`${r.slug}-${i}`}>
                <path
                  id={`arc-${i}`}
                  className="route-arc"
                  d={r.d}
                  fill="none"
                  stroke="#c9ff4a"
                  strokeWidth={active === r.name ? 2 : 1.4}
                  strokeOpacity={active === null || active === r.name ? 0.5 : 0.16}
                />
                {/* the travelling signal — the only thing animated by JS */}
                <circle id={`pulse-${i}`} r={4} fill="#c9ff4a" opacity={dragging ? 0 : 0.95} />
              </g>
            ))}

            {/* destinations: the university's own mark on a white card, the same language
                the landing globe's cursor trail uses. White is what makes a dark badge
                (Harvard crimson, ETH black, Cambridge blue) legible on a dark globe. */}
            {routes.map((r, i) => {
              // A destination on the far side gets no marker. Its `end` falls back to the
              // centre of the disc, so drawing one would park a university's logo on the
              // student's own dot and claim it sits in their city.
              if (r.behind) return null;
              const t = detail.get(r.name);
              const on = active === r.name;
              const dim = active !== null && !on;
              return (
                <g
                  key={`mark-${r.slug}-${i}`}
                  transform={`translate(${r.end.x.toFixed(1)} ${r.end.y.toFixed(1)})`}
                  opacity={dim ? 0.4 : 1}
                  onPointerEnter={() => setActive(r.name)}
                  onPointerLeave={() => setActive(null)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={on ? MARK / 2 + 4 : MARK / 2}
                    fill="#ffffff"
                    stroke="#c9ff4a"
                    strokeOpacity={on ? 0.95 : 0.55}
                    strokeWidth={on ? 2.4 : 1.2}
                  />
                  {t?.logo ? (
                    <image
                      href={t.logo}
                      x={-MARK / 2 + 5}
                      y={-MARK / 2 + 5}
                      width={MARK - 10}
                      height={MARK - 10}
                      clipPath="url(#pe-mark-clip)"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : (
                    // no vendored mark for this one — initials, never a fabricated logo
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#0a0f0c"
                      fontSize={15}
                      fontFamily="ui-monospace, monospace"
                      fontWeight="bold"
                    >
                      {t?.mark ?? r.mark}
                    </text>
                  )}
                </g>
              );
            })}

            {/* you are here — projected, because it only sits at the centre while the
                view is still looking at home */}
            {homePoint && (
              <g transform={`translate(${homePoint.x.toFixed(1)} ${homePoint.y.toFixed(1)})`}>
                <circle r={26} fill="none" stroke="#c9ff4a" strokeOpacity={0.35} strokeWidth={1} />
                <circle r={5} fill="#c9ff4a" />
                <text y={44} textAnchor="middle" fill="#c9ff4a" fontSize={12} fontFamily="monospace">
                  you · {home}
                </text>
              </g>
            )}
          </svg>

          {/* the hovered university, as HTML so it can wrap and use the page's type */}
          {shown && shownDetail && (
            <div
              className="pointer-events-none absolute z-10 w-max max-w-[15rem] -translate-x-1/2 -translate-y-full rounded-lg border border-lime/40 bg-ink/95 px-3 py-2 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
              style={{
                left: `${(shown.end.x / VB) * 100}%`,
                top: `${(shown.end.y / VB) * 100}%`,
                marginTop: -18,
              }}
            >
              <span className="font-bold text-paper">{shown.name}</span>
              <span className="mt-0.5 block text-dim">
                {shownDetail.country}
                {shownDetail.rank ? ` · QS #${shownDetail.rank}` : ""}
              </span>
            </div>
          )}
          </div>
        </>
      )}

      {/* The legend. A globe of logos is pretty but unreadable on its own — this is the
          same list in words, and hovering either highlights the other. */}
      {homeCoords && targets.length > 0 && (
        <ul className="mx-auto mt-8 grid max-w-[820px] gap-2 sm:grid-cols-2">
          {targets.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                onClick={() => setView({ lat: t.lat, lng: t.lng, name: t.name })}
                title={`turn the globe to ${t.name}`}
                onPointerEnter={() => setActive(t.name)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(t.name)}
                onBlur={() => setActive(null)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  active === t.name ? "border-lime/60 bg-lime/5" : "border-line hover:border-line2"
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white">
                  {t.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.logo} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="font-mono text-xs font-bold text-ink">{t.mark}</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-paper">{t.name}</span>
                  <span className="block text-xs text-dim">
                    {t.country}
                    {t.rank ? ` · QS #${t.rank}` : ""}
                    {behind.has(t.name) && <span className="text-amber"> · far side</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {homeCoords && routes.length > 0 && (
        <p className="mt-6 text-xs leading-relaxed text-dim">
          One arc per university, so six British universities draw six lines from you.{" "}
          {withLogo > 0
            ? `${withLogo} of ${routes.length} carry the institution's own mark, used only to identify it; the rest fall back to initials.`
            : "Markers are the university's initials — the marks themselves are third-party trademarks."}{" "}
          Where you are is kept in this browser only for now.{" "}
          {reduce ? "Motion is off in your system settings, so the arcs are drawn without the travelling signal." : ""}
        </p>
      )}
    </div>
  );
}
