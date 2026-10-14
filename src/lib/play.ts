/**
 * The arcade's shared vocabulary.
 *
 * Pure and tiny on purpose: the games run entirely in the browser with no account
 * and no backend, so the only thing the server sends is a small array of
 * universities. The dataset is the *curated* slice of the directory — the
 * institutions that carry tuition, a rank and a country — because a game about
 * numbers is worth playing only if the numbers are real.
 */

export interface PlayUni {
  slug: string;
  name: string;
  country: string;
  /** QS position, or null for a specialist school the ranking does not cover */
  qs: number | null;
  /** international tuition, USD per year */
  min: number;
  max: number;
}

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;
export const moneyK = (n: number) => `$${Math.round(n / 1000)}k`;

export const randInt = (n: number) => Math.floor(Math.random() * n);

/** A random item, optionally excluding some by key — the workhorse of both games. */
export function pick<T>(arr: T[], excludeKeys: string[] = [], key: (t: T) => string = String): T | null {
  const skip = new Set(excludeKeys);
  const pool = arr.filter((a) => !skip.has(key(a)));
  if (pool.length === 0) return null;
  return pool[randInt(pool.length)];
}

/** Read/write a personal best without a backend. Silently no-ops in private mode. */
export const loadBest = (key: string): number => {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
};
export const saveBest = (key: string, value: number) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* private mode — the score simply does not persist */
  }
};
