"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { globePoints, countryStats, type GlobePoint } from "@/data/geo";
import { LAND_W, LAND_H, landMask } from "@/data/land-mask";
import { markFor } from "@/lib/routes";
import { UNIVERSITY_LOGOS } from "@/data/logos";

interface Props {
  onSelect?: (p: GlobePoint) => void;
  initialRotation?: number;
  className?: string;
}

const DEG = Math.PI / 180;

/** The trail: how many marks may exist at once, and how long each lives. */
const TRAIL_MAX = 9;
const TRAIL_LIFE = 1200;
/** How far the pointer must travel before the next mark appears. */
const TRAIL_STEP = 24;

/**
 * Pointillist planet — continents drawn from a published land mask (Natural
 * Earth 110m), with every QS-ranked university layered on top in our lime.
 * Hand-rolled canvas: orthographic projection, no 3D dependency.
 */
export function UniversityGlobe({ onSelect, initialRotation = -2.1, className = "" }: Props) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const points = useMemo(() => globePoints(), []);
  const countries = useMemo(() => countryStats(), []);
  const maxCount = useMemo(() => Math.max(...countries.map((c) => c.count), 1), [countries]);

  /**
   * The trail's marks: the highest-ranked universities, with their real mark where we
   * vendored one.
   *
   * A small fixed list computed once, so spawning a mark is an array read rather than a
   * sort — and the trail therefore costs nothing per pointer event beyond pushing onto a
   * bounded ring. Universities without a vendored mark (six of them: Oxford, UCL,
   * Columbia, Penn, Caltech, NUS) fall back to initials, which is also what happens if a
   * logo fails to decode.
   */
  const trailMarks = useMemo(() => {
    const sorted = [...points].sort((a, b) => a.rank - b.rank);
    const seen = new Set<string>();
    const out: { mark: string; src?: string }[] = [];
    for (const p of sorted) {
      const mark = markFor(p.name);
      if (seen.has(mark)) continue;
      seen.add(mark);
      out.push({ mark, src: UNIVERSITY_LOGOS[p.name] });
      if (out.length >= 16) break;
    }
    return out;
  }, [points]);

  /**
   * The trail buffer, bounded and reused.
   *
   * This is the whole performance story of the effect: **no DOM**, so nothing is
   * created or destroyed as the pointer moves and React never re-renders; a **fixed
   * ceiling** of nine marks, so memory cannot grow with how enthusiastically somebody
   * waves the mouse; and entries are compacted **in place** each frame rather than
   * rebuilt, so a frame allocates nothing.
   */
  const trailRef = useRef<{ x: number; y: number; mark: string; src?: string; born: number }[]>([]);
  const trailTickRef = useRef(0);

  /**
   * University marks, fetched at most once each and only once the pointer is actually
   * over the globe.
   *
   * Lazy on purpose: a landing page should not pull 200 KB of logos for a visitor who
   * never touches it, and a trail that re-requested an image per mark would be a network
   * call every few pixels. Loaded images are reused from this map for the life of the page.
   */
  const logosRef = useRef(new Map<string, HTMLImageElement>());

  // land dots as earth-space unit vectors — computed once, rotated per frame
  const landVectors = useMemo(() => {
    const mask = landMask();
    const vecs: number[] = [];
    for (let i = 0; i < LAND_W * LAND_H; i++) {
      if (!mask[i]) continue;
      const gx = i % LAND_W;
      const gy = (i - gx) / LAND_W;
      const lat = (90 - ((gy + 0.5) * 180) / LAND_H) * DEG;
      const lng = (-180 + ((gx + 0.5) * 360) / LAND_W) * DEG;
      const cl = Math.cos(lat);
      vecs.push(cl * Math.cos(lng), Math.sin(lat), cl * Math.sin(lng));
    }
    return new Float32Array(vecs);
  }, []);

  const rotRef = useRef(initialRotation);
  const tiltRef = useRef(-0.3);
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const hoverRef = useRef<GlobePoint | null>(null);
  const spinRef = useRef(0);
  /** newest pointer position in wrapper-local pixels, consumed by the frame loop */
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  /** the university the label is showing — identity, so state only changes when it does */
  const hoverPointRef = useRef<GlobePoint | null>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  /**
   * The wrapper's viewport rect, refreshed on resize and scroll only.
   *
   * Pointer coordinates have to be converted to wrapper-local space, and reading
   * `getBoundingClientRect()` inside a pointer handler is a read that follows the
   * frame loop's style writes — the classic read-after-write that forces a
   * synchronous layout, once per event, at whatever rate the mouse fires. The rect
   * only changes when the element is resized or the page scrolls, so it is cached
   * there and the handler does no layout at all.
   */
  const rectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const [hoverLabel, setHoverLabel] = useState<{ x: number; y: number; p: GlobePoint } | null>(null);

  const project = useCallback((lat: number, lng: number, cx: number, cy: number, R: number) => {
    const la = lat * DEG;
    const lo = lng * DEG + rotRef.current;
    const x = Math.cos(la) * Math.cos(lo);
    const y = Math.sin(la);
    const z = Math.cos(la) * Math.sin(lo);
    const t = tiltRef.current;
    const y2 = y * Math.cos(t) - z * Math.sin(t);
    const z2 = y * Math.sin(t) + z * Math.cos(t);
    if (z2 <= 0.02) return null;
    return { x: cx + x * R, y: cy - y2 * R, depth: z2 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let size = { w: 0, h: 0 };
    let dpr = 1;

    /* Halo sprite, rendered once. Creating a radial gradient per country per
       frame was ~106 gradient allocations every frame; drawing a cached sprite
       is a single drawImage call each. */
    const HALO_PX = 128;
    const haloSprite = document.createElement("canvas");
    haloSprite.width = HALO_PX;
    haloSprite.height = HALO_PX;
    {
      const hc = haloSprite.getContext("2d")!;
      const hg = hc.createRadialGradient(HALO_PX / 2, HALO_PX / 2, 0, HALO_PX / 2, HALO_PX / 2, HALO_PX / 2);
      hg.addColorStop(0, "rgba(201,255,74,0.55)");
      hg.addColorStop(0.55, "rgba(201,255,74,0.14)");
      hg.addColorStop(1, "rgba(201,255,74,0)");
      hc.fillStyle = hg;
      hc.fillRect(0, 0, HALO_PX, HALO_PX);
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      rectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { w: rect.width, h: rect.height };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // scrolling moves the wrapper relative to the viewport, so the cached rect
    // needs refreshing — but at scroll rate, not at pointer rate
    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      rectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /**
     * A loaded mark, or null while it is still arriving.
     *
     * Returning null rather than awaiting is deliberate: the trail must never stall on the
     * network. A mark whose logo has not landed yet draws as its initials, and the next
     * frame it appears — so the effect is available instantly and improves as the images
     * arrive, instead of being blank until they do.
     */
    const logoFor = (src?: string): HTMLImageElement | null => {
      if (!src) return null;
      const cache = logosRef.current;
      let img = cache.get(src);
      if (!img) {
        img = new Image();
        img.decoding = "async";
        img.src = src;
        cache.set(src, img);
      }
      return img.complete && img.naturalWidth > 0 ? img : null;
    };

    const draw = () => {
      const { w, h } = size;
      if (w === 0 || h === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w * 0.4, h * 0.44);

      /**
       * Hover picking, once per drawn frame instead of once per pointer event.
       *
       * The scan projects all 1,504 universities; on every mousemove that is
       * thousands of trig evaluations a second, and because the label state was a
       * fresh object each time it also re-rendered this whole component on every
       * move. Picking per frame costs one scan per frame, and the label now only
       * re-renders when the hovered university actually changes — while it follows
       * the cursor imperatively, on the compositor, through a transform.
       */
      const ptr = pointerRef.current;
      if (ptr) {
        pointerRef.current = null;
        let best: GlobePoint | null = null;
        let bestD = 16;
        for (let i = 0; i < points.length; i++) {
          const p = project(points[i].lat, points[i].lng, cx, cy, R);
          if (!p) continue;
          const d = Math.hypot(p.x - ptr.x, p.y - ptr.y);
          if (d < bestD) {
            bestD = d;
            best = points[i];
          }
        }
        hoverRef.current = best;
        spinRef.current = best ? 1 : 0;

        if (best && best !== hoverPointRef.current) {
          hoverPointRef.current = best;
          setHoverLabel({ x: ptr.x, y: ptr.y, p: best });
        } else if (!best && hoverPointRef.current) {
          hoverPointRef.current = null;
          setHoverLabel(null);
        }

        const el = labelRef.current;
        if (best && el) {
          el.style.transform = `translate3d(${ptr.x}px, ${ptr.y - 14}px, 0) translate(-50%, -100%)`;
        }
      }

      const cosR = Math.cos(rotRef.current);
      const sinR = Math.sin(rotRef.current);
      const cosT = Math.cos(tiltRef.current);
      const sinT = Math.sin(tiltRef.current);

      // sphere body — a planet at night
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.34, R * 0.1, cx, cy, R);
      g.addColorStop(0, "rgba(11,15,13,0.96)");
      g.addColorStop(0.7, "rgba(6,9,8,0.97)");
      g.addColorStop(1, "rgba(2,4,3,0.98)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // rim + atmosphere
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201,255,74,0.34)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.94, cx, cy, R * 1.22);
      atmo.addColorStop(0, "rgba(201,255,74,0.055)");
      atmo.addColorStop(0.55, "rgba(94,234,212,0.03)");
      atmo.addColorStop(1, "rgba(201,255,74,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fillStyle = atmo;
      ctx.fill();

      // CONTINENTS — one batched path of small dots, front hemisphere only
      const landPath = new Path2D();
      const lv = landVectors;
      for (let i = 0; i < lv.length; i += 3) {
        const vx = lv[i];
        const vy = lv[i + 1];
        const vz = lv[i + 2];
        const x1 = vx * cosR - vz * sinR;
        const z1 = vx * sinR + vz * cosR;
        const y2 = vy * cosT - z1 * sinT;
        const z2 = vy * sinT + z1 * cosT;
        if (z2 <= 0.03) continue;
        const s = 0.6 + z2 * 0.66;
        landPath.rect(cx + x1 * R, cy - y2 * R, s, s);
      }
      ctx.fillStyle = "rgba(238,246,236,0.9)";
      ctx.fill(landPath);

      // density glow where higher education concentrates — cached sprite, no allocation
      for (let i = 0; i < countries.length; i++) {
        const c = countries[i];
        const la = c.coords![0] * DEG;
        const lo = c.coords![1] * DEG + rotRef.current;
        const vx = Math.cos(la) * Math.cos(lo);
        const vy = Math.sin(la);
        const vz = Math.cos(la) * Math.sin(lo);
        const y2 = vy * cosT - vz * sinT;
        const z2 = vy * sinT + vz * cosT;
        if (z2 <= 0.03) continue;
        const weight = c.count / maxCount;
        /**
         * Much smaller and fainter than it was, and that is a legibility fix rather
         * than a taste one: at `R*0.05 + weight*R*0.30` the country with the most
         * universities became a lime blob the size of a continent, which hid the very
         * land it was meant to annotate — the map was readable only where there were
         * few universities, which is exactly backwards. The density signal survives at
         * a tenth of the area.
         */
        const rad = R * 0.03 + weight * R * 0.1;
        ctx.globalAlpha = 0.16 + weight * 0.26;
        ctx.drawImage(haloSprite, cx + vx * R - rad, cy - y2 * R - rad, rad * 2, rad * 2);
      }
      ctx.globalAlpha = 1;

      // universities on top, in lime — projection inlined so the per-frame loop
      // allocates nothing (this runs 1,504 times a frame)
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const la = pt.lat * DEG;
        const lo = pt.lng * DEG + rotRef.current;
        const vx = Math.cos(la) * Math.cos(lo);
        const vy = Math.sin(la);
        const vz = Math.cos(la) * Math.sin(lo);
        const y2 = vy * cosT - vz * sinT;
        const z2 = vy * sinT + vz * cosT;
        if (z2 <= 0.02) continue;
        const px = cx + vx * R;
        const py = cy - y2 * R;
        const boost = pt.rank <= 50 ? 1.5 : pt.rank <= 200 ? 1.1 : 0.85;
        const sz = (1.3 + z2 * 1.5) * boost;
        const alpha = 0.55 + z2 * 0.45;
        if (pt.rank <= 50) {
          ctx.beginPath();
          ctx.arc(px, py, sz * 1.9, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201,255,74," + alpha * 0.2 + ")";
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(px, py, sz * 0.6, 0, Math.PI * 2);
        ctx.fillStyle =
          pt.rank <= 50
            ? "rgba(201,255,74," + alpha + ")"
            : pt.rank <= 200
              ? "rgba(214,255,140," + alpha + ")"
              : "rgba(180,225,150," + alpha * 0.9 + ")";
        ctx.fill();
      }

      /**
       * Limb shading — the cheapest thing that makes a field of dots read as a sphere
       * rather than a flat disc. A radial gradient, transparent at the centre and
       * fading to the page colour at the rim, so every dot dims as it approaches the
       * horizon.
       *
       * Deliberately one gradient fill rather than per-dot alpha: the land is a single
       * batched Path2D, and giving each dot its own alpha would mean ~41,000 separate
       * fills a frame. This costs one gradient and one fill, and it dims the whole
       * surface uniformly — continents and universities alike, which is what depth
       * looks like.
       */
      const limb = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R);
      limb.addColorStop(0, "rgba(3,5,4,0)");
      limb.addColorStop(0.72, "rgba(3,5,4,0.3)");
      limb.addColorStop(1, "rgba(3,5,4,0.9)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = limb;
      ctx.fill();

      // hovered university
      const hv = hoverRef.current;
      if (hv) {
        const p = project(hv.lat, hv.lng, cx, cy, R);
        if (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(201,255,74,0.95)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#c9ff4a";
          ctx.fill();
        }
      }

      // orbital rings
      ctx.save();
      ctx.translate(cx, cy);
      for (const o of [
        { rx: R * 1.24, ry: R * 0.3, rot: -0.42, alpha: 0.4 },
        { rx: R * 1.42, ry: R * 0.19, rot: 0.34, alpha: 0.24 },
      ]) {
        ctx.rotate(o.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(125,211,252," + o.alpha + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.rotate(-o.rot);
      }
      ctx.restore();

      /**
       * The trail, drawn into this same canvas on this same frame.
       *
       * Canvas rather than DOM on purpose: no element is created or destroyed as the
       * pointer moves, React never re-renders, nothing is laid out, and there is no
       * second animation loop. The buffer is compacted **in place** so a busy frame
       * allocates nothing, and it is capped, so waving the mouse hard cannot grow it.
       */
      const trail = trailRef.current;
      if (trail.length > 0) {
        const now = performance.now();
        let kept = 0;
        for (let i = 0; i < trail.length; i++) {
          const t = trail[i];
          const age = (now - t.born) / TRAIL_LIFE;
          if (age >= 1) continue;
          trail[kept++] = t;

          const fade = 1 - age;
          const alpha = fade * fade;
          const radius = 12 + (1 - fade) * 6;

          const logo = logoFor(t.src);
          if (logo) {
            // the university's own mark on a white card — the reference's card language,
            // and white is what makes a dark-badged logo (Harvard crimson, ETH black)
            // legible against a near-black globe
            ctx.save();
            ctx.beginPath();
            ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255," + alpha * 0.95 + ")";
            ctx.fill();
            ctx.clip();
            const side = radius * 1.5;
            ctx.drawImage(logo, t.x - side / 2, t.y - side / 2, side, side);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(201,255,74," + alpha * 0.65 + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          } else {
            ctx.globalAlpha = alpha * 0.85;
            ctx.beginPath();
            ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(4,7,6,0.9)";
            ctx.fill();
            ctx.strokeStyle = "rgba(201,255,74," + alpha * 0.7 + ")";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "rgba(201,255,74," + alpha + ")";
            ctx.font = "bold 9px ui-monospace, SFMono-Regular, monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(t.mark, t.x, t.y + 0.5);
          }
        }
        trail.length = kept;
        ctx.globalAlpha = 1;
      }
    };

    /**
     * Frame budget and visibility.
     *
     * A full repaint here — ~41,000 land dots as one batched path plus 1,504
     * university marks — is the most expensive thing on the page, and it does not
     * need 60fps to read as a slowly rotating planet. 30fps is indistinguishable
     * for this motion and halves the cost. The loop also stops outright when the
     * hero is scrolled out of view or the tab is hidden, instead of burning CPU to
     * animate something nobody can see.
     */
    const FRAME_MS = 33;
    let last = 0;
    let running = false;
    let visible = false;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < FRAME_MS) return;
      last = t;
      if (!dragRef.current.active) rotRef.current += 0.0021 * (1 - spinRef.current * 0.85);
      draw();
    };

    const start = () => {
      if (running || reduce) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    if (reduce) draw();
    else start();

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(wrap);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const t = setTimeout(draw, 120);

    return () => {
      stop();
      clearTimeout(t);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [points, countries, maxCount, project, reduce, landVectors]);

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current;
      if (!wrap) return null;
      const rect = wrap.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const R = Math.min(rect.width * 0.4, rect.height * 0.44);
      let best: GlobePoint | null = null;
      let bestD = 16;
      for (const pt of points) {
        const p = project(pt.lat, pt.lng, cx, cy, R);
        if (!p) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          bestD = d;
          best = pt;
        }
      }
      return best;
    },
    [points, project],
  );

  return (
    <div
      ref={wrapRef}
      className={"relative touch-none select-none " + className}
      onPointerDown={(e) => {
        dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, moved: false };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (d.active) {
          const dx = e.clientX - d.lastX;
          const dy = e.clientY - d.lastY;
          if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
          rotRef.current += dx * 0.006;
          tiltRef.current = Math.max(-0.9, Math.min(0.9, tiltRef.current + dy * 0.005));
          d.lastX = e.clientX;
          d.lastY = e.clientY;
          spinRef.current = 1;
          return;
        }

        /**
         * Spawn a trail mark, but only over the earth itself — the request was for it on
         * the globe, not across the whole panel, so the test is the disc's radius rather
         * than the wrapper's bounds. Also skipped while dragging (that gesture spins the
         * globe) and entirely under reduced motion.
         */
        const rect = rectRef.current;
        const lx = e.clientX - rect.left;
        const ly = e.clientY - rect.top;
        const Rc = Math.min(rect.width * 0.4, rect.height * 0.44);
        if (
          !reduce &&
          trailMarks.length > 0 &&
          Math.hypot(lx - rect.width / 2, ly - rect.height / 2) <= Rc * 1.02
        ) {
          const trail = trailRef.current;
          const last = trail.length > 0 ? trail[trail.length - 1] : null;
          // spaced by travel, so a slow drift does not pile marks on one spot
          if (!last || Math.hypot(lx - last.x, ly - last.y) > TRAIL_STEP) {
            const pick = trailMarks[trailTickRef.current++ % trailMarks.length];
            trail.push({ x: lx, y: ly, mark: pick.mark, src: pick.src, born: performance.now() });
            if (trail.length > TRAIL_MAX) trail.splice(0, trail.length - TRAIL_MAX);
          }
        }

        // Hover is resolved once per drawn frame in draw(), not per pointer event:
        // the scan projects all 1,504 universities and this event fires far more
        // often than the screen refreshes.
        pointerRef.current = { x: lx, y: ly };
      }}
      onPointerUp={(e) => {
        const d = dragRef.current;
        d.active = false;
        spinRef.current = 0;
        if (!d.moved) {
          const hit = pick(e.clientX, e.clientY);
          if (hit) onSelect?.(hit);
        }
      }}
      onPointerLeave={() => {
        dragRef.current.active = false;
        hoverRef.current = null;
        hoverPointRef.current = null;
        pointerRef.current = null;
        spinRef.current = 0;
        setHoverLabel(null);
      }}
      style={{ cursor: "grab" }}
      role="img"
      aria-label={"Interactive globe plotting " + points.length + " universities worldwide"}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {hoverLabel && (
        <div
          ref={labelRef}
          className="pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded-lg border border-lime/40 bg-ink/95 px-3 py-1.5 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          style={{
            /* position lives in a transform so following the cursor never
               re-renders: React owns which university it says, the frame loop
               owns where it sits */
            transform: `translate3d(${hoverLabel.x}px, ${hoverLabel.y - 14}px, 0) translate(-50%, -100%)`,
            willChange: "transform",
          }}
        >
          <span className="font-bold text-paper">{hoverLabel.p.name}</span>
          <span className="ml-2 text-lime">QS #{hoverLabel.p.rank}</span>
          <span className="ml-2 text-dim">{hoverLabel.p.country}</span>
        </div>
      )}
    </div>
  );
}
