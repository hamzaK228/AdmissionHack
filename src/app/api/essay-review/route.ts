import { NextResponse } from "next/server";

/**
 * AI essay review — the one place in this app that talks to a model.
 *
 * Server-side on purpose: the API key is a secret, so it is read from
 * `GLM_API_KEY` (no `NEXT_PUBLIC_` prefix) and never reaches the browser. The
 * endpoint is optional exactly like the Supabase client is — unset the key and
 * `GET` reports `configured: false` so the UI can say so honestly instead of
 * showing a form that fails.
 *
 * The provider is Zhipu's GLM (OpenAI-compatible chat completions). `GLM_MODEL`
 * and `GLM_API_BASE_URL` exist so the model can be changed without a code change.
 *
 * Two things this deliberately does NOT do: store the essay (it is forwarded to
 * the provider and dropped) and promise an outcome. It is a reader's opinion,
 * and the UI says so.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A model call is slow; Vercel's default would cut it off. */
export const maxDuration = 60;

const BASE = process.env.GLM_API_BASE_URL ?? "https://open.bigmodel.cn/api/paas/v4";
const MODEL = process.env.GLM_MODEL ?? "glm-4.6";

const MIN_CHARS = 200;
const MAX_CHARS = 18_000;

const KIND_LABEL: Record<string, string> = {
  personal: "a personal statement (undergraduate, Common App style)",
  sop: "a statement of purpose (graduate)",
  supplemental: "a supplemental / 'why us' essay",
  scholarship: "a scholarship essay",
};

const SYSTEM = `You are an experienced admissions reader and writing coach for international applicants applying to universities abroad. You review drafts of application essays and return blunt, specific, actionable feedback.

Non-negotiable rules:
- Judge only what is in the draft. Never invent facts about the applicant, and never assume details the draft does not state.
- Be specific and quote the draft's own words when you praise or criticise. "The opening is weak" is useless; "your opening describes the town before it describes you" is feedback.
- No flattery, no filler, no praise sandwich. If the draft is mediocre, say so plainly and say why.
- Prefer the biggest problems. Five real issues beat fifteen nitpicks.
- Judge clarity, specificity, structure, voice, and whether the draft answers its prompt. Do NOT reward "sounding impressive" — inflated vocabulary and vague grandiosity are faults, not virtues.
- Every issue needs a concrete fix, and where you can, example wording.

Return ONLY a JSON object, with no markdown fences and no commentary around it, in exactly this shape:
{
  "read": "2-4 sentences: your honest overall read of this draft",
  "strengths": ["up to 3, each specific and quoting the draft"],
  "issues": [
    { "severity": "high" | "medium" | "low",
      "title": "a short name for the problem",
      "detail": "what is wrong and why it matters to a reader",
      "fix": "the concrete change to make, with example wording where useful" }
  ],
  "lineNotes": [ { "quote": "an exact phrase from the draft", "note": "what to do about it" } ],
  "nextSteps": ["up to 4 ordered, concrete actions"]
}
Cap the arrays: strengths 3, issues 5, lineNotes 6, nextSteps 4.`;

/* ── best-effort rate limiting ────────────────────────────────────────────────
 * This endpoint spends the owner's credits, and the app has no login, so some
 * ceiling is owed. It is per-instance and in-memory: serverless instances are
 * recycled and not shared, so it throttles a single abuser well and a
 * distributed one poorly. That is a real limit, not a pretend one — the honest
 * fix is a shared store, which this app does not have yet.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // keep the map from growing without bound
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

/** Does this deployment have a key? The UI asks so it can be honest about it. */
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.GLM_API_KEY), model: MODEL });
}

interface Body {
  essay?: unknown;
  kind?: unknown;
  target?: unknown;
  level?: unknown;
  wordLimit?: unknown;
}

export async function POST(req: Request) {
  const key = process.env.GLM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const essay = typeof body.essay === "string" ? body.essay.trim() : "";
  if (essay.length < MIN_CHARS) return NextResponse.json({ error: "too_short" }, { status: 400 });
  if (essay.length > MAX_CHARS) return NextResponse.json({ error: "too_long" }, { status: 413 });

  const kind = typeof body.kind === "string" && KIND_LABEL[body.kind] ? body.kind : "personal";
  const lines = [`This draft is ${KIND_LABEL[kind]}.`];
  if (typeof body.level === "string" && body.level) lines.push(`The applicant is applying at ${body.level} level.`);
  if (typeof body.target === "string" && body.target.trim())
    lines.push(`The intended destination/context is: ${body.target.trim().slice(0, 200)}.`);
  if (typeof body.wordLimit === "number" && Number.isFinite(body.wordLimit))
    lines.push(`The stated word limit is about ${Math.round(body.wordLimit)} words.`);
  lines.push("", "Here is the draft:", "", essay);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);
  try {
    const upstream = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: lines.join("\n") },
        ],
        temperature: 0.4,
        max_tokens: 1600,
      }),
    });

    if (!upstream.ok) {
      // Logged server-side for diagnosis; the client gets a code, not the body,
      // because an upstream error body can echo credential fragments.
      const detail = await upstream.text().catch(() => "");
      console.error("[essay-review] upstream", upstream.status, detail.slice(0, 400));
      /**
       * Zhipu reports an account with no credit as `429` + code `1113`, not as
       * `402` — so a balance problem would otherwise look like a rate limit and
       * send whoever runs the deployment chasing the wrong thing. The distinc-
       * tions below are worth the branch: each maps to different advice.
       */
      const code =
        upstream.status === 401 || upstream.status === 403
          ? "upstream_auth"
          : /1211|模型不存在/.test(detail)
            ? "upstream_model"
            : upstream.status === 429 && /1113|余额|balance|quota|credit/i.test(detail)
              ? "upstream_quota"
              : upstream.status === 429
                ? "upstream_busy"
                : "upstream_error";
      return NextResponse.json({ error: code }, { status: 502 });
    }

    const payload = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const review = parseReview(raw);
    if (!review) {
      console.error("[essay-review] unparseable model output");
      return NextResponse.json({ error: "bad_model_output" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, model: MODEL, review });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return NextResponse.json({ error: aborted ? "timeout" : "network" }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}

/* ── parsing ──────────────────────────────────────────────────────────────────
 * The model is asked for JSON, and mostly complies. It is parsed defensively
 * anyway: a review that arrives wrapped in fences or with a field missing must
 * degrade to whatever is usable rather than throwing away the whole response.
 */

export interface Review {
  read: string;
  strengths: string[];
  issues: { severity: "high" | "medium" | "low"; title: string; detail: string; fix: string }[];
  lineNotes: { quote: string; note: string }[];
  nextSteps: string[];
}

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const strArray = (v: unknown, cap: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, cap) : [];

function parseReview(raw: string): Review | null {
  const fenced = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(fenced.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }

  const severity = (v: unknown): "high" | "medium" | "low" =>
    v === "high" || v === "low" ? v : "medium";

  const issues = Array.isArray(obj.issues)
    ? (obj.issues as Record<string, unknown>[])
        .map((i) => ({
          severity: severity(i?.severity),
          title: str(i?.title, "Issue"),
          detail: str(i?.detail),
          fix: str(i?.fix),
        }))
        .filter((i) => i.detail || i.fix)
        .slice(0, 5)
    : [];

  const lineNotes = Array.isArray(obj.lineNotes)
    ? (obj.lineNotes as Record<string, unknown>[])
        .map((l) => ({ quote: str(l?.quote), note: str(l?.note) }))
        .filter((l) => l.quote && l.note)
        .slice(0, 6)
    : [];

  const read = str(obj.read);
  if (!read && issues.length === 0) return null;

  return {
    read,
    strengths: strArray(obj.strengths, 3),
    issues,
    lineNotes,
    nextSteps: strArray(obj.nextSteps, 4),
  };
}
