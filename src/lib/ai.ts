/**
 * The AI plumbing, in one place.
 *
 * Two routes now talk to a model — the essay reviewer and the advisor — and the parts
 * that matter are identical between them: the key never reaching the client, the
 * sign-in gate, the rate limit, and the error codes that carry advice. A second copy
 * of an authorization check is how a hole opens, so there is one copy.
 *
 * Server-side only. Nothing here may be imported into a client component: the key is
 * read from `AI_API_KEY` with no `NEXT_PUBLIC_` prefix precisely so it cannot ship.
 */

/**
 * Defaults use `||` deliberately, not `??`. An *empty* environment variable — which
 * is exactly what `.env.example` ships and what a half-filled `.env.local` contains —
 * is a string, so `??` would happily pass `""` through as the model name and the base
 * URL, and every call would then fail with an unhelpful "network" error. `||` treats
 * empty and unset the same way, which is what a default is for.
 */
export const AI_MODEL = process.env.AI_MODEL?.trim() || "deepseek-chat";
const BASE = process.env.AI_API_BASE_URL?.trim() || "https://api.deepseek.com";

export const aiConfigured = () => Boolean(process.env.AI_API_KEY);

/** Whether this deployment has accounts at all — if not, there is nothing to gate on. */
export const signsInRequired = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Who is allowed to spend the owner's credit.
 *
 * The service is free to students and the operator pays per call, which makes an open
 * endpoint somebody else's bill. So the route asks Supabase to validate the caller's
 * access token — the same session the rest of the app already has.
 *
 * If this deployment has no Supabase configured there is no identity to check against
 * and no way for anyone to sign in, so the gate stands aside rather than locking the
 * feature out of a local checkout.
 */
export async function signedIn(req: Request): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return true;

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── rate limiting ────────────────────────────────────────────────────────────
 * Best-effort and in-memory: serverless instances are recycled and not shared, so
 * this throttles a single abuser well and a distributed one poorly. That is a real
 * limit, not a pretend one — the honest fix is a shared store, which this app does
 * not have. Buckets are named per route so the reviewer and the advisor do not
 * consume each other's allowance.
 */
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

export function checkRate(bucket: string, ip: string, maxPerWindow: number): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > maxPerWindow;
}

export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

/* ── the call ───────────────────────────────────────────────────────────────── */

export type AiFailure =
  | "upstream_auth"
  | "upstream_model"
  | "upstream_quota"
  | "upstream_busy"
  | "upstream_error"
  | "timeout"
  | "network";

export type AiResult = { ok: true; text: string } | { ok: false; error: AiFailure };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function askModel(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number; timeoutMs?: number } = {},
): Promise<AiResult> {
  const key = process.env.AI_API_KEY;
  if (!key) return { ok: false, error: "upstream_auth" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 55_000);
  try {
    const upstream = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 1600,
      }),
    });

    if (!upstream.ok) {
      // Logged server-side for diagnosis; the client gets a code, not the body,
      // because an upstream error body can echo credential fragments.
      const detail = await upstream.text().catch(() => "");
      console.error("[ai] upstream", upstream.status, detail.slice(0, 400));
      /**
       * Providers disagree about how to say "this account has no money", and the
       * wrong code sends whoever runs the deployment chasing the wrong thing:
       * DeepSeek uses `402`, while Zhipu uses `429` + code `1113`, which would
       * otherwise pattern-match to a rate limit. Both map to `upstream_quota`;
       * a plain `429` stays `upstream_busy`, because "top up" and "wait a
       * minute" are different advice.
       */
      if (upstream.status === 401 || upstream.status === 403) return { ok: false, error: "upstream_auth" };
      if (/1211|模型不存在|model not found/i.test(detail)) return { ok: false, error: "upstream_model" };
      if (
        upstream.status === 402 ||
        (upstream.status === 429 && /1113|余额|balance|quota|credit|insufficient/i.test(detail))
      ) {
        return { ok: false, error: "upstream_quota" };
      }
      if (upstream.status === 429) return { ok: false, error: "upstream_busy" };
      return { ok: false, error: "upstream_error" };
    }

    const payload = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
    return { ok: true, text: payload.choices?.[0]?.message?.content ?? "" };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, error: aborted ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

/* ── parsing ──────────────────────────────────────────────────────────────────
 * The model is asked for JSON and mostly complies. It is parsed defensively anyway:
 * an answer wrapped in fences, or with a field missing, must degrade to whatever is
 * usable rather than throwing the whole response away.
 */

export function parseJsonLoose(raw: string): Record<string, unknown> | null {
  const fenced = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(fenced.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const asString = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

export const asStringArray = (v: unknown, cap: number) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, cap)
    : [];
