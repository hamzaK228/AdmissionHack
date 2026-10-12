import qsData from "./ranking-qs.json";

/** Approximate country centroids [lat, lng] for every country in the QS list. */
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  "United States": [39.8, -98.6],
  "United Kingdom": [54.0, -2.0],
  "China (Mainland)": [35.0, 103.0],
  Germany: [51.0, 10.0],
  India: [22.0, 79.0],
  Spain: [40.0, -4.0],
  Italy: [42.5, 12.5],
  "South Korea": [36.5, 127.8],
  Japan: [36.2, 138.2],
  France: [46.5, 2.5],
  Australia: [-25.0, 134.0],
  Russia: [60.0, 100.0],
  Malaysia: [3.8, 102.0],
  Canada: [56.0, -106.0],
  Taiwan: [23.7, 121.0],
  "Türkiye": [39.0, 35.0],
  "Saudi Arabia": [24.0, 45.0],
  Brazil: [-10.0, -53.0],
  Indonesia: [-2.0, 118.0],
  Poland: [52.1, 19.4],
  Mexico: [23.6, -102.5],
  Kazakhstan: [48.0, 67.0],
  Egypt: [26.8, 30.8],
  Pakistan: [30.0, 70.0],
  Chile: [-35.0, -71.0],
  Argentina: [-35.0, -65.0],
  Czechia: [49.8, 15.5],
  Jordan: [31.2, 36.5],
  Netherlands: [52.2, 5.3],
  Thailand: [15.0, 101.0],
  Bangladesh: [23.7, 90.4],
  "United Arab Emirates": [24.0, 54.0],
  "South Africa": [-29.0, 24.0],
  Colombia: [4.0, -73.0],
  Switzerland: [46.8, 8.2],
  Portugal: [39.5, -8.0],
  Iran: [32.0, 53.0],
  "Hong Kong SAR": [22.3, 114.2],
  Belgium: [50.8, 4.5],
  Austria: [47.5, 14.5],
  Greece: [39.0, 22.0],
  Azerbaijan: [40.3, 47.9],
  Hungary: [47.2, 19.5],
  Sweden: [60.0, 15.0],
  Finland: [64.0, 26.0],
  Lebanon: [33.9, 35.9],
  Vietnam: [16.0, 106.0],
  Ukraine: [49.0, 32.0],
  "New Zealand": [-41.0, 174.0],
  Ireland: [53.2, -8.0],
  Norway: [62.0, 10.0],
  Romania: [45.9, 25.0],
  Oman: [21.0, 57.0],
  Iraq: [33.0, 44.0],
  Denmark: [56.0, 10.0],
  Israel: [31.4, 35.0],
  Peru: [-10.0, -76.0],
  Uzbekistan: [41.4, 64.6],
  Slovakia: [48.7, 19.7],
  Ecuador: [-1.8, -78.2],
  Philippines: [13.0, 122.0],
  Lithuania: [55.2, 23.9],
  Kyrgyzstan: [41.2, 74.8],
  Nigeria: [9.1, 8.7],
  Singapore: [1.35, 103.8],
  "Macau SAR": [22.2, 113.5],
  Estonia: [58.6, 25.0],
  Uruguay: [-33.0, -56.0],
  Tunisia: [34.0, 9.5],
  Croatia: [45.1, 15.2],
  Venezuela: [6.4, -66.6],
  "Sri Lanka": [7.9, 80.8],
  "Costa Rica": [9.7, -83.8],
  Cyprus: [35.1, 33.2],
  Slovenia: [46.1, 14.8],
  Kuwait: [29.3, 47.5],
  Bahrain: [26.0, 50.5],
  "Northern Cyprus": [35.2, 33.4],
  Latvia: [56.9, 24.6],
  "Palestinian Territories": [31.9, 35.2],
  Georgia: [42.3, 43.4],
  Qatar: [25.3, 51.2],
  Brunei: [4.5, 114.7],
  Belarus: [53.7, 27.9],
  Bulgaria: [42.7, 25.5],
  Serbia: [44.0, 21.0],
  Cuba: [21.5, -79.5],
  Ghana: [7.9, -1.0],
  Morocco: [31.8, -7.1],
  Guatemala: [15.8, -90.2],
  "Dominican Republic": [18.7, -70.2],
  Luxembourg: [49.8, 6.1],
  Iceland: [65.0, -18.0],
  Malta: [35.9, 14.4],
  Ethiopia: [9.1, 40.5],
  Uganda: [1.4, 32.3],
  "Puerto Rico": [18.2, -66.5],
  Kenya: [-0.02, 37.9],
  Armenia: [40.1, 45.0],
  Syria: [34.8, 39.0],
  Paraguay: [-23.4, -58.4],
  Tanzania: [-6.4, 34.9],
  Sudan: [12.9, 30.2],
  Honduras: [15.2, -86.2],
  Panama: [8.5, -80.8],
  "Bosnia & Herzegovina": [43.9, 17.7],
};

export interface GlobePoint {
  lat: number;
  lng: number;
  name: string;
  country: string;
  rank: number;
}

/** stable pseudo-random from a string, 0..1 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Every QS-ranked university as a globe point. Universities are placed at their
 * country centroid, spread by a deterministic radius scaled to how many
 * institutions that country has — so density reads honestly on the globe.
 */
export function globePoints(): GlobePoint[] {
  const counts: Record<string, number> = {};
  for (const e of qsData as { country: string }[]) {
    counts[e.country] = (counts[e.country] ?? 0) + 1;
  }
  const max = Math.max(...Object.values(counts), 1);

  return (qsData as { name: string; country: string; rank: string }[]).flatMap((e) => {
    const base = COUNTRY_COORDS[e.country];
    if (!base) return [];
    const rank = parseInt(e.rank.replace(/[=+\s]/g, ""), 10);
    if (!Number.isFinite(rank)) return [];

    // spread grows with country size, capped so big countries stay legible
    const spread = 1.5 + Math.sqrt(counts[e.country] / max) * 13;
    const a = hash(e.name) * Math.PI * 2;
    const r = Math.sqrt(hash(e.name + "r")) * spread;
    // longitude degrees shrink with latitude; guard against poles
    const lat = Math.max(-83, Math.min(83, base[0] + r * Math.sin(a) * 0.62));
    const lngScale = Math.max(0.25, Math.cos((base[0] * Math.PI) / 180));
    const lng = base[1] + (r * Math.cos(a)) / lngScale;

    return [{ lat, lng: ((lng + 540) % 360) - 180, name: e.name, country: e.country, rank }];
  });
}

export function countryStats() {
  const counts: Record<string, number> = {};
  for (const e of qsData as { country: string }[]) {
    counts[e.country] = (counts[e.country] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([country, count]) => ({ country, count, coords: COUNTRY_COORDS[country] }))
    .filter((c) => c.coords)
    .sort((a, b) => b.count - a.count);
}
