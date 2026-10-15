/**
 * Route geometry for a personal earth.
 *
 * Pure maths, no framework and no DOM: given a home location and a set of
 * destinations, where does each arc go on screen, and what is the SVG path for it.
 *
 * The projection is **orthographic, centred on the student's own location**, so the
 * person reading it is always at the middle of the map and their universities radiate
 * outward. That is the whole point of the view — a globe centred on the Greenwich
 * meridian would put a Kazakhstani student's home near the edge and half their list
 * behind the sphere.
 *
 * Arc points are interpolated along the **great circle** (slerp on unit vectors),
 * then scaled outward by a small factor that peaks at the midpoint. On an orthographic
 * projection that bulge reads as the arc lifting off the surface, which is what makes a
 * flat line between two dots look like a flight path.
 */

const DEG = Math.PI / 180;

export type Vec3 = [number, number, number];

/** Earth-space unit vector in the convention the rest of the globe uses. */
export const toVec = (lat: number, lng: number): Vec3 => {
  const la = lat * DEG;
  const lo = lng * DEG;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
};

export interface Camera {
  /** the basis vectors of a view looking straight at the home location */
  f: Vec3;
  r: Vec3;
  u: Vec3;
}

/** The view basis for a camera centred on (lat, lng). */
export function cameraFor(lat: number, lng: number): Camera {
  const la = lat * DEG;
  const lo = lng * DEG;
  const f: Vec3 = [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
  const r: Vec3 = [-Math.sin(lo), 0, Math.cos(lo)];
  const u: Vec3 = [-Math.sin(la) * Math.cos(lo), Math.cos(la), -Math.sin(la) * Math.sin(lo)];
  return { f, r, u };
}

export interface Projected {
  x: number;
  y: number;
  /** 1 at the centre of the disc, 0 at the limb — used to fade with depth */
  depth: number;
}

/** Project an earth-space vector to screen pixels, or null when it faces away. */
export function project(
  v: Vec3,
  cam: Camera,
  cx: number,
  cy: number,
  radius: number,
): Projected | null {
  const depth = v[0] * cam.f[0] + v[1] * cam.f[1] + v[2] * cam.f[2];
  if (depth <= 0.02) return null;
  const east = v[0] * cam.r[0] + v[1] * cam.r[1] + v[2] * cam.r[2];
  const north = v[0] * cam.u[0] + v[1] * cam.u[1] + v[2] * cam.u[2];
  return { x: cx + east * radius, y: cy - north * radius, depth };
}

export interface RouteInput {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Route extends RouteInput {
  /** the SVG path for the arc, in the same pixel space as the globe */
  d: string;
  end: Projected;
  /** the on-screen point of the arc's midpoint, where a label sits best */
  mid: Projected;
  /** a short mark for the marker: "MIT", "ETH" — initials, never a fabricated logo */
  mark: string;
}

const STEPS = 48;
const LIFT = 0.14;

/** Initials for the travelling marker. Cheap, and honest: it is not a logo. */
export function markFor(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").split(/[\s,]+/).filter(Boolean);
  const caps = words.filter((w) => /^[A-Z]/.test(w) && w.length > 1);
  if (caps.length >= 2) return caps.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
  return (caps[0] ?? words[0] ?? "?").slice(0, 4).toUpperCase();
}

/**
 * Build the arcs for one student.
 *
 * An arc stops at the first point that rotates out of view rather than drawing on
 * regardless: on an orthographic globe, a line that carries past the limb appears to
 * cut through the sphere, which reads as a bug rather than as depth.
 */
export function buildRoutes(
  home: [number, number],
  targets: RouteInput[],
  cx: number,
  cy: number,
  radius: number,
): { routes: Route[]; camera: Camera } {
  const camera = cameraFor(home[0], home[1]);
  const a = toVec(home[0], home[1]);
  const routes: Route[] = [];

  for (const t of targets) {
    const b = toVec(t.lat, t.lng);
    const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);

    const pts: string[] = [];
    let mid: Projected | null = null;

    for (let i = 0; i <= STEPS; i++) {
      const t01 = i / STEPS;
      // slerp, falling back to a straight blend when the endpoints nearly coincide
      const k0 = sinOmega < 1e-6 ? 1 - t01 : Math.sin((1 - t01) * omega) / sinOmega;
      const k1 = sinOmega < 1e-6 ? t01 : Math.sin(t01 * omega) / sinOmega;
      let v: Vec3 = [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];

      const lift = 1 + LIFT * Math.sin(Math.PI * t01);
      v = [v[0] * lift, v[1] * lift, v[2] * lift];

      const p = project(v, camera, cx, cy, radius);
      if (!p) break; // rotated past the limb — stop, do not draw through the sphere
      pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
      if (p) mid = p;
    }

    if (pts.length < 2) continue;
    const end = project(b, camera, cx, cy, radius);

    routes.push({
      name: t.name,
      country: t.country,
      lat: t.lat,
      lng: t.lng,
      d: `M${pts.join("L")}`,
      end: end ?? { x: cx, y: cy, depth: 0.02 },
      // the midpoint label sits at the arc's own middle, not the endpoint's
      mid: mid ?? { x: cx, y: cy, depth: 0.5 },
      mark: markFor(t.name),
    });
  }

  return { routes, camera };
}
