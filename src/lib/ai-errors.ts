/**
 * What the AI routes say when they fail.
 *
 * Client-safe, and deliberately separate from `@/lib/ai` — that module reads the key
 * and must never be bundled. The messages are shared because two surfaces now call a
 * model, and a student who learns that "no credit" means "not your fault, tell the
 * operator" should not have to learn it twice in different words.
 *
 * Each code carries the next move rather than a diagnosis. An error a student cannot
 * act on is worse than no error at all.
 */
export const AI_ERRORS: Record<string, string> = {
  not_configured: "Not switched on for this deployment — no model key is configured.",
  rate_limited: "That is a lot of requests in a short time. Wait a few minutes and try again.",
  sign_in_required:
    "This costs money to run, so it is limited to accounts. Sign in on the account tab, then try again.",
  too_short: "That is too short to work with. Paste at least a couple of paragraphs.",
  empty:
    "There is not enough in your workspace to advise on yet. Fill in your profile, add a university or two, and then ask again — the advice is only as specific as what you have told it.",
  too_long: "That is longer than this accepts. Trim it, or do it in sections.",
  timeout: "The model took too long to answer. Try again, or try a shorter piece.",
  upstream_auth: "The model key was rejected. Whoever runs this deployment needs to check it.",
  upstream_quota:
    "The model account has no credit left, so this cannot run. That is a billing problem on the deployment's side — nothing is wrong with what you sent.",
  upstream_busy: "The model provider is rate-limiting right now. Try again in a minute.",
  upstream_model: "The configured model name is not available on this account.",
  upstream_error: "The model provider returned an error. Try again in a moment.",
  bad_model_output: "The model's answer could not be read. Try again.",
  network: "Could not reach the server. Check your connection and try again.",
  bad_request: "Something went wrong sending that. Try again.",
};

export const aiError = (code?: string) => AI_ERRORS[code ?? ""] ?? AI_ERRORS.upstream_error;
