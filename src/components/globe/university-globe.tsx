"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { globePoints, countryStats, type GlobePoint } from "@/data/geo";

interface Props {
  /** called when a university dot is clicked */
  onSelect?: (p: GlobePoint) => void;
  /** start rotation, radians */
  initialRotation?: number;
  className?: string;
}

const DEG = Math.PI / 180;

/**
 * The university planet: every QS-ranked institution plotted on a rotating
 * dotted sphere. Hand-rolled canvas — orthographic projection, density halos,
 * orbital rings, drag to spin, hover to identify.
 */
export function UniversityGlobe({ onSelect, initialRotation = -2.1, className = "" }: Props) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const points = useMemo(() => globePoints(), []);
  const countries = useMemo(() => countryStats(), []);
  const maxCount = useMemo(
    () => Math.max(...countries.map((c) => c.count), 1),
    [countries],
  );

  const rotRef = useRef(initialRotation); // radians, longitude
  const tiltRef = useRef(-0.32); // fixed axial tilt
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number; moved: boolean }>({
    active: false,
    lastX: 0,
    lastY: 0,
    moved: false,
  });
  const hoverRef = useRef<GlobePoint | null>(null);
  const spinRef = useRef(0); // 0..1 pause factor when hovering

  const [hoverLabel, setHoverLabel] = useState<{ x: number; y: number; p: GlobePoint } | null>(null);

  /** project lat/lng → screen, returns null if behind the globe */
  const project = useCallback(
    (lat: number, lng: number, cx: number, cy: number, R: number) => {
      const la = lat * DEG;
      const lo = lng * DEG + rotRef.current;
      const x = Math.cos(la) * Math.cos(lo);
      const y = Math.sin(la);
      const z = Math.cos(la) * Math.sin(lo);
      const t = tiltRef.current;
      // tilt around X axis
      const y2 = y * Math.cos(t) - z * Math.sin(t);
      const z2 = y * Math.sin(t) + z * Math.cos(t);
      if (z2 <= 0.02) return null; // back hemisphere
      return { x: cx + x * R, y: cy - y2 * R, depth: z2 };
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let size = { w: 0, h: 0 };
    let dpr = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { w: rect.width, h: rect.height };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const draw = () => {
      const { w, h } = size;
      if (w === 0 || h === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w * 0.42, h * 0.44);

      // ── outer atmosphere: soft lime bloom behind the sphere
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.24);
      atmo.addColorStop(0, "rgba(201,255,74,0.20)");
      atmo.addColorStop(0.5, "rgba(94,234,212,0.07)");
      atmo.addColorStop(1, "rgba(201,255,74,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.24, 0, Math.PI * 2);
      ctx.fillStyle = atmo;
      ctx.fill();

      // ── sphere body: lit sphere, green-tinted
      const g = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.42, R * 0.05, cx, cy, R * 1.02);
      g.addColorStop(0, "rgba(74,110,58,0.95)");
      g.addColorStop(0.32, "rgba(38,62,30,0.96)");
      g.addColorStop(0.7, "rgba(16,30,14,0.97)");
      g.addColorStop(1, "rgba(6,12,6,0.98)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // ── rim light: the planet's edge
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201,255,74,0.85)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201,255,74,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── graticule: faint lat/long dots give the sphere its body
      ctx.fillStyle = "rgba(201,255,74,0.30)";
      for (let lat = -80; lat <= 80; lat += 8) {
        const step = 8 / Math.max(0.25, Math.cos(lat * DEG));
        for (let lng = -180; lng < 180; lng += step) {
          const p = project(lat, lng, cx, cy, R);
          if (!p) continue;
          const s = 1.0 + p.depth * 0.8;
          ctx.fillRect(p.x, p.y, s, s);
        }
      }

      // ── country density halos: where higher education concentrates
      for (const c of countries) {
        const p = project(c.coords![0], c.coords![1], cx, cy, R);
        if (!p) continue;
        const weight = c.count / maxCount;
        const rad = (R * 0.06) + weight * R * 0.34;
        const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        hg.addColorStop(0, `rgba(94,234,212,${0.2 + weight * 0.26})`);
        hg.addColorStop(1, "rgba(94,234,212,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = hg;
        ctx.fill();
      }

      // ── universities: every institution as a lime dot, size by QS rank
      for (const pt of points) {
        const p = project(pt.lat, pt.lng, cx, cy, R);
        if (!p) continue;
        const rankBoost = pt.rank <= 50 ? 1.5 : pt.rank <= 200 ? 1.1 : 0.85;
        const s = (1.7 + p.depth * 1.9) * rankBoost;
        const alpha = 0.6 + p.depth * 0.4;
        if (pt.rank <= 50) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, s * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(201,255,74,${alpha * 0.3})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.62, 0, Math.PI * 2);
        ctx.fillStyle =
          pt.rank <= 50
            ? `rgba(201,255,74,${alpha})`
            : pt.rank <= 200
              ? `rgba(214,255,140,${alpha})`
              : `rgba(180,225,150,${alpha * 0.9})`;
        ctx.fill();
      }

      // ── hovered point: ring + crosshair
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
          ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = "#c9ff4a";
          ctx.fill();
        }
      }

      // ── orbital rings: tilted ellipses reading as orbit paths
      ctx.save();
      ctx.translate(cx, cy);
      const orbits = [
        { rx: R * 1.26, ry: R * 0.32, rot: -0.42, alpha: 0.45 },
        { rx: R * 1.44, ry: R * 0.2, rot: 0.34, alpha: 0.28 },
      ];
      for (const o of orbits) {
        ctx.rotate(o.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(125,211,252,${o.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.rotate(-o.rot);
      }
      ctx.restore();
    };

    const loop = () => {
      if (!dragRef.current.active) {
        const pause = spinRef.current;
        rotRef.current += 0.0022 * (1 - pause * 0.85);
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    if (reduce) {
      draw(); // static frame for reduced-motion
    } else {
      raf = requestAnimationFrame(loop);
    }
    // second draw catches late layout
    const t = setTimeout(draw, 120);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
    };
  }, [points, countries, maxCount, project, reduce]);

  /* ── interaction ───────────────────────────────────────── */
  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current;
      if (!wrap) return null;
      const rect = wrap.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const R = Math.min(rect.width, rect.height) * 0.36;

      let best: GlobePoint | null = null;
      let bestD = 16; // px pick radius
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

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
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
    const hit = pick(e.clientX, e.clientY);
    hoverRef.current = hit;
    spinRef.current = hit ? 1 : 0;
    if (hit) {
      const wrap = wrapRef.current!;
      const rect = wrap.getBoundingClientRect();
      setHoverLabel({ x: e.clientX - rect.left, y: e.clientY - rect.top, p: hit });
    } else {
      setHoverLabel(null);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    d.active = false;
    spinRef.current = 0;
    if (!d.moved) {
      const hit = pick(e.clientX, e.clientY);
      if (hit) onSelect?.(hit);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`relative touch-none select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        dragRef.current.active = false;
        hoverRef.current = null;
        spinRef.current = 0;
        setHoverLabel(null);
      }}
      style={{ cursor: dragRef.current.active ? "grabbing" : "grab" }}
      role="img"
      aria-label={`Interactive globe plotting ${points.length} universities worldwide`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {hoverLabel && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-lime/40 bg-ink/95 px-3 py-1.5 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          style={{ left: hoverLabel.x, top: hoverLabel.y - 14 }}
        >
          <span className="font-bold text-paper">{hoverLabel.p.name}</span>
          <span className="ml-2 text-lime">QS #{hoverLabel.p.rank}</span>
          <span className="ml-2 text-dim">{hoverLabel.p.country}</span>
        </div>
      )}
    </div>
  );
}
