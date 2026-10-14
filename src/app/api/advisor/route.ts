import { NextResponse } from "next/server";
import {
  AI_MODEL,
  aiConfigured,
  askModel,
  asString,
  asStringArray,
  checkRate,
  clientIp,
  parseJsonLoose,
  signedIn,
  signsInRequired,
  type ChatMessage,
} from "@/lib/ai";

/**
 * The advisor — what to do next, given everything already in the workspace.
 *
 * The dashboard holds a student's whole application across fifteen tabs, and the
 * hardest question is not "where do I find X" but "what should I be doing this
 * week". Everything needed to answer that is already stored — the list, the
 * statuses, the checklist, the deadlines, the timeline's own phase assessment — and
 * none of it was being synthesised. This does that, and nothing more: it is a
 * reader of the workspace, not a chatbot with opinions about admissions.
 *
 * The student's summary is sent by the client and forwarded to the model. That is
 * disclosed in the Privacy Policy, the same as the essay reviewer, and the route is
 * gated behind sign-in for the same reason: the operator pays per call.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_SNAPSHOT = 40;
const MAX_SNAPSHOT = 8_000;

const SYSTEM = `You are an experienced university-admissions adviser. You are given a summary of one applicant's workspace — their profile, scores, university list with application statuses, document checklist, deadlines, portfolio and the app's own assessment of where they are behind.

Your job is to say what they should do next, and it is the only thing you are for.

Non-negotiable rules:
- Use ONLY the facts in the summary. Never invent a university, a deadline, a score or a requirement. If something important is missing, say that it is missing.
- Be specific to this student. "Start your essays early" is useless and forbidden; "TU Delft closes in 21 days and you have no personal statement drafted" is the job.
- Prioritise by consequence and by time. The thing that costs them a place outranks the thing that merely improves a file.
- Be blunt about weakness. Do not reassure, and do not pad. If they are behind, say so plainly and say why it matters.
- Respect the ordering of the world: you cannot write an essay before you know the prompt, you cannot get a visa before you accept an offer.
- Never offer to write an essay or a statement for them, and never suggest submitting AI-written text as their own.
- Keep every line short enough to act on.

Return ONLY a JSON object, with no markdown fences and no commentary around it, in exactly this shape:
{
  "read": "2-3 sentences: where this applicant actually stands right now",
  "priorities": [
    { "action": "the concrete thing to do",
      "why": "why it matters for THIS applicant, naming their own data",
      "by": "a time — a date, a count of days, or a phase like 'this week'" }
  ],
  "risks": ["things that will cost them if left alone"],
  "firstStep": "the single next action, specific enough to start in the next hour"
}
Cap the arrays: priorities 4, risks 3.`;

export async function GET() {
  return NextResponse.json({
    configured: aiConfigured(),
    model: AI_MODEL,
    requiresSignIn: signsInRequired(),
  });
}

export interface Advice {
  read: string;
  priorities: { action: string; why: string; by: string }[];
  risks: string[];
  firstStep: string;
}

export async function POST(req: Request) {
  if (!aiConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // a tighter ceiling than the reviewer: advice is worth reading once, not reloaded
  if (checkRate("advisor", clientIp(req), 6)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (!(await signedIn(req))) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  let body: { snapshot?: unknown; question?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const snapshot = typeof body.snapshot === "string" ? body.snapshot.trim() : "";
  if (snapshot.length < MIN_SNAPSHOT) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (snapshot.length > MAX_SNAPSHOT) return NextResponse.json({ error: "too_long" }, { status: 413 });

  const question = typeof body.question === "string" ? body.question.trim().slice(0, 400) : "";

  const lines = ["Here is the applicant's workspace:", "", snapshot];
  if (question) lines.push("", `They also asked specifically: ${question}`);
  lines.push("", "Tell them what to do next.");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];

  const res = await askModel(messages, { temperature: 0.3, maxTokens: 1400 });
  if (!res.ok) {
    const status = res.error === "timeout" || res.error === "network" ? 504 : 502;
    return NextResponse.json({ error: res.error }, { status });
  }

  const advice = parseAdvice(res.text);
  if (!advice) {
    console.error("[advisor] unparseable model output");
    return NextResponse.json({ error: "bad_model_output" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, model: AI_MODEL, advice });
}

function parseAdvice(raw: string): Advice | null {
  const obj = parseJsonLoose(raw);
  if (!obj) return null;

  const priorities = Array.isArray(obj.priorities)
    ? (obj.priorities as Record<string, unknown>[])
        .map((p) => ({
          action: asString(p?.action),
          why: asString(p?.why),
          by: asString(p?.by),
        }))
        .filter((p) => p.action)
        .slice(0, 4)
    : [];

  const read = asString(obj.read);
  if (!read && priorities.length === 0) return null;

  return {
    read,
    priorities,
    risks: asStringArray(obj.risks, 3),
    firstStep: asString(obj.firstStep),
  };
}
