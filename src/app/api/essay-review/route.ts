import { NextResponse } from "next/server";
import {
  AI_MODEL,
  aiConfigured,
  askModel,
  checkRate,
  clientIp,
  signedIn,
  signsInRequired,
  type ChatMessage,
} from "@/lib/ai";

/**
 * AI essay review — the one place in this app that talks to a model.
 *
 * Server-side on purpose: the API key is a secret, so it is read from
 * `AI_API_KEY` (no `NEXT_PUBLIC_` prefix) and never reaches the browser. The
 * endpoint is optional exactly like the Supabase client is — unset the key and
 * `GET` reports `configured: false` so the UI can say so honestly instead of
 * showing a form that fails.
 *
 * The vendor is configuration, not code: any OpenAI-compatible chat-completions
 * endpoint works. The default is DeepSeek (`deepseek-chat`); `AI_API_BASE_URL`
 * and `AI_MODEL` switch it to Zhipu GLM, OpenAI, or anything else with the same
 * shape, with no code change. That is deliberate — the provider has already
 * changed once, and it should not cost a code edit again.
 *
 * Two things this deliberately does NOT do: store the essay (it is forwarded to
 * the provider and dropped) and promise an outcome. It is a reader's opinion,
 * and the UI says so.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A model call is slow; Vercel's default would cut it off. */
export const maxDuration = 60;

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

/** Does this deployment have a key, and does it expect a signed-in caller? */
export async function GET() {
  return NextResponse.json({
    configured: aiConfigured(),
    model: AI_MODEL,
    requiresSignIn: signsInRequired(),
  });
}

interface Body {
  essay?: unknown;
  kind?: unknown;
  target?: unknown;
  level?: unknown;
  wordLimit?: unknown;
}

export async function POST(req: Request) {
  if (!aiConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  if (checkRate("essay", clientIp(req), 8)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // checked after the limiter, so a flood of bad tokens cannot turn into a flood of
  // calls to the auth server
  if (!(await signedIn(req))) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
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

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
  const res = await askModel(messages, { temperature: 0.4, maxTokens: 1600 });
  if (!res.ok) {
    const status = res.error === "timeout" || res.error === "network" ? 504 : 502;
    return NextResponse.json({ error: res.error }, { status });
  }

  const review = parseReview(res.text);
  if (!review) {
    console.error("[essay-review] unparseable model output");
    return NextResponse.json({ error: "bad_model_output" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, model: AI_MODEL, review });
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
