"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { globePoints, countryStats, type GlobePoint } from "@/data/geo";
import { LAND_W, LAND_H, landMask } from "@/data/land-mask";

interface Props {
  onSelect?: (p: GlobePoint) => void;
  initialRotation?: number;
  className?: string;
}

const DEG = Math.PI / 180;

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

    const draw = () => {
      const { w, h } = size;
      if (w === 0 || h === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w * 0.4, h * 0.44);

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
        const s = 0.5 + z2 * 0.62;
        landPath.rect(cx + x1 * R, cy - y2 * R, s, s);
      }
      ctx.fillStyle = "rgba(238,246,236,0.88)";
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
        const rad = R * 0.05 + weight * R * 0.3;
        ctx.globalAlpha = 0.35 + weight * 0.5;
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
          ctx.arc(px, py, sz * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201,255,74," + alpha * 0.22 + ")";
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
    };

    const loop = () => {
      if (!dragRef.current.active) rotRef.current += 0.0021 * (1 - spinRef.current * 0.85);
      draw();
      raf = requestAnimationFrame(loop);
    };

    if (reduce) draw();
    else raf = requestAnimationFrame(loop);
    const t = setTimeout(draw, 120);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
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
        const hit = pick(e.clientX, e.clientY);
        hoverRef.current = hit;
        spinRef.current = hit ? 1 : 0;
        if (hit) {
          const rect = wrapRef.current!.getBoundingClientRect();
          setHoverLabel({ x: e.clientX - rect.left, y: e.clientY - rect.top, p: hit });
        } else setHoverLabel(null);
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
