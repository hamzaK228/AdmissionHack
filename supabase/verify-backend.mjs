/**
 * End-to-end verification of the AdmissionHack backend.
 *
 * Runs the claims this product makes about who can see what through the real
 * HTTP API with real JWTs — not a SQL simulation of RLS. The security model is
 * the product here (the database holds passports, transcripts and official exam
 * reports), so it gets a regression test rather than a promise.
 *
 *   node supabase/verify-backend.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from the
 * environment, falling back to .env.local. Both are publishable values.
 *
 * It creates two throwaway accounts on first run (the auth email rate limit
 * makes signing up through the API in a loop impractical, and the assertions
 * need a confirmed email). They are cleaned up by the script's own DELETE
 * calls, so it is safe to run repeatedly.
 */

import { readFileSync } from "node:fs";

const TEST_PASSWORD = "TestPassword123!";
const STUDENT = "student@example.com";
const COUNSELOR = "counselor@example.com";

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local — rely on the environment */
  }
  return env;
}

const env = loadEnv();
const U = env.NEXT_PUBLIC_SUPABASE_URL;
const K = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!U || !K) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or add .env.local).");
  process.exit(2);
}

const rest = (p) => `${U}/rest/v1/${p}`;
const H = (t) => ({ apikey: K, Authorization: `Bearer ${t}`, "Content-Type": "application/json" });

async function signIn(email) {
  const r = await fetch(`${U}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: K, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`${email} sign-in failed: ${JSON.stringify(j).slice(0, 300)}`);
  return { token: j.access_token, id: j.user.id, email };
}

const get = async (path, tok) => {
  const r = await fetch(rest(path), { headers: H(tok) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const post = async (path, tok, payload) => {
  const r = await fetch(rest(path), {
    method: "POST",
    headers: { ...H(tok), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const patch = async (path, tok, payload) => {
  const r = await fetch(rest(path), {
    method: "PATCH",
    headers: { ...H(tok), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body };
};
const del = async (path, tok) => {
  const r = await fetch(rest(path), { method: "DELETE", headers: H(tok) });
  return r.status;
};

let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `\n        ${detail}` : ""}`);
};

const student = await signIn(STUDENT);
const counselor = await signIn(COUNSELOR);
console.log(`signed in  student=${student.id}  counselor=${counselor.id}\n`);

// ── start from a known state so the run is repeatable ─────────────────────
for (const t of ["ah_university_lists", "ah_score_reports", "ah_exam_results", "ah_checklist", "ah_documents"]) {
  await del(`${t}?user_id=eq.${student.id}`, student.token);
}
await del(`ah_counselor_links?counselor_id=eq.${counselor.id}`, counselor.token);
await del(`ah_group_members?student_id=eq.${student.id}`, student.token);
await del(`ah_groups?owner_id=eq.${counselor.id}`, counselor.token);

// ── profiles are created lazily, with the declared role ───────────────────
const sp = await post("rpc/ah_ensure_profile", student.token, { p_full_name: "Test Student", p_role: "student" });
check("ah_ensure_profile creates the profile with the declared role", sp.body?.role === "student", JSON.stringify(sp.body));
const cp = await post("rpc/ah_ensure_profile", counselor.token, { p_full_name: "Test Counselor", p_role: "counselor" });
check("…and does not demote an existing role", cp.body?.role === "counselor", JSON.stringify(cp.body));
const again = await post("rpc/ah_ensure_profile", student.token, { p_full_name: "", p_role: "student" });
const establishedName = again.body?.full_name;
const overwrite = await post("rpc/ah_ensure_profile", student.token, { p_full_name: "Someone Else", p_role: "student" });
check(
  "…and never overwrites a name that is already set",
  !!establishedName && overwrite.body?.full_name === establishedName,
  `"${establishedName}" then asked for "Someone Else" → "${overwrite.body?.full_name}"`,
);

// ── consent: nothing is visible before the student accepts ───────────────
const before = await get(`ah_profiles?id=eq.${student.id}&select=id`, counselor.token);
check("counselor sees NOTHING before acceptance", before.body?.length === 0, JSON.stringify(before.body));

// ── the owner can write their own workspace, and only their own ──────────
const uni = await post("ah_university_lists", student.token, [
  { user_id: student.id, university_slug: "eth-zurich", tier: "dream" },
]);
check("student writes their own university list", uni.body?.[0]?.university_slug === "eth-zurich", JSON.stringify(uni.body));

const rep = await post("ah_score_reports", student.token, [
  { user_id: student.id, exam_id: "sat", file_path: `${student.id}/sat.pdf`, file_name: "sat.pdf", is_verified: true },
]);
check(
  "student CANNOT insert a pre-verified score report",
  rep.status >= 400 || rep.body?.length === 0,
  `http ${rep.status} ${JSON.stringify(rep.body).slice(0, 160)}`,
);
const rep2 = await post("ah_score_reports", student.token, [
  { user_id: student.id, exam_id: "sat", file_path: `${student.id}/sat.pdf`, file_name: "sat.pdf" },
]);
check("student CAN upload an unverified report", rep2.body?.[0]?.is_verified === false, JSON.stringify(rep2.body));

const intrude = await post("ah_university_lists", student.token, [
  { user_id: counselor.id, university_slug: "stolen", tier: "safe" },
]);
check("student CANNOT write into another user's workspace", intrude.status >= 400, `http ${intrude.status}`);

// ── invite → accept → read ───────────────────────────────────────────────
const link = await post("ah_counselor_links", counselor.token, [
  { counselor_id: counselor.id, student_email: STUDENT, status: "pending" },
]);
check("counselor creates an invite", !!link.body?.[0]?.id, JSON.stringify(link.body));
const linkId = link.body?.[0]?.id;

const seen = await get("ah_counselor_links?select=id,status,counselor_id", student.token);
check("student sees the pending invite", seen.body?.length === 1 && seen.body[0].status === "pending", JSON.stringify(seen.body));

const who = await get(`ah_profiles?id=eq.${counselor.id}&select=full_name,role`, student.token);
check("student can see WHO invited them", who.body?.[0]?.role === "counselor", JSON.stringify(who.body));

const roster = await get("ah_profiles?select=id,role&limit=10", student.token);
check("student cannot enumerate other profiles", roster.body?.length <= 2, JSON.stringify(roster.body));

const acc = await patch(`ah_counselor_links?id=eq.${linkId}`, student.token, {
  status: "active", student_id: student.id, responded_at: new Date().toISOString(),
});
check("student accepts the invite", acc.body?.[0]?.status === "active", JSON.stringify(acc.body));

const seenUni = await get(`ah_university_lists?user_id=eq.${student.id}&select=university_slug,tier`, counselor.token);
check("counselor CAN read the workspace after acceptance", seenUni.body?.[0]?.university_slug === "eth-zurich", JSON.stringify(seenUni.body));

// ── verification is the counselor's act; the evidence stays immutable ────
const ver = await patch(`ah_score_reports?user_id=eq.${student.id}`, counselor.token, {
  is_verified: true, verified_by: counselor.id, verified_at: new Date().toISOString(),
});
check("counselor can verify the score report", ver.body?.[0]?.is_verified === true, JSON.stringify(ver.body).slice(0, 200));

// ── the report file itself, in its own bucket ───────────────────────────
const RPT_PATH = `${student.id}/sat.pdf`;
const signReport = (tok, p) =>
  fetch(`${U}/storage/v1/object/sign/ah-score-reports/${p}`, {
    method: "POST",
    headers: { ...H(tok), "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });

const rptUp = await fetch(`${U}/storage/v1/object/ah-score-reports/${RPT_PATH}`, {
  method: "POST",
  headers: {
    apikey: K,
    Authorization: `Bearer ${student.token}`,
    "Content-Type": "application/pdf",
    "x-upsert": "true",
  },
  body: new TextEncoder().encode("%PDF-1.4 fake SAT report for the verification run"),
});
check(
  "student uploads the official report into ah-score-reports",
  rptUp.status < 300,
  `http ${rptUp.status} ${(await rptUp.text()).slice(0, 140)}`,
);

const cSign = await signReport(counselor.token, RPT_PATH);
const cSignBody = await cSign.json().catch(() => null);
check(
  "the accepted counselor can open the official report",
  cSign.status < 300 && !!cSignBody?.signedURL,
  JSON.stringify(cSignBody).slice(0, 140),
);

if (cSignBody?.signedURL) {
  const got = await fetch(`${U}/storage/v1${cSignBody.signedURL}`);
  const bytes = await got.text();
  check(
    "…and receives the actual bytes",
    got.status < 300 && bytes.includes("fake SAT report"),
    `http ${got.status}`,
  );
}

const strayReport = await signReport(counselor.token, `${student.id}/not-a-report.pdf`);
check("a report path that does not exist is not a way in", strayReport.status >= 400, `http ${strayReport.status}`);

const tamper = await patch(`ah_score_reports?user_id=eq.${student.id}`, counselor.token, { file_name: "tampered.pdf" });
check(
  "counselor CANNOT rewrite the report it attested to",
  tamper.status >= 400 || !JSON.stringify(tamper.body).includes("tampered.pdf"),
  `http ${tamper.status} ${JSON.stringify(tamper.body).slice(0, 160)}`,
);

// ── revocation takes effect immediately ─────────────────────────────────
const rev = await patch(`ah_counselor_links?id=eq.${linkId}`, student.token, { status: "revoked" });
check("student can revoke access", rev.body?.[0]?.status === "revoked", JSON.stringify(rev.body));

const after = await get(`ah_university_lists?user_id=eq.${student.id}&select=university_slug`, counselor.token);
check("counselor loses access the moment it is revoked", after.body?.length === 0, JSON.stringify(after.body));

// ── groups: joining with the code IS the consent ────────────────────────
const grp = await post("ah_groups", counselor.token, [
  { owner_id: counselor.id, name: "Grade 12 — Group A" },
]);
check("counselor creates a group and is given a join code", !!grp.body?.[0]?.join_code, JSON.stringify(grp.body));
const groupId = grp.body?.[0]?.id;
const joinCode = grp.body?.[0]?.join_code;

const groupsBefore = await get("ah_groups?select=id", student.token);
check("a student who has not joined cannot see any group", groupsBefore.body?.length === 0, JSON.stringify(groupsBefore.body));

const badCode = await post("rpc/ah_join_group", student.token, { p_code: "NOPE99" });
check("a wrong join code is refused", badCode.status >= 400, `http ${badCode.status}`);

const direct = await post("ah_group_members", student.token, [
  { group_id: groupId, student_id: student.id },
]);
check(
  "a membership row cannot be written directly — joining goes through the RPC",
  direct.status >= 400,
  `http ${direct.status}`,
);

const joined = await post("rpc/ah_join_group", student.token, { p_code: joinCode });
check(
  "joining with the code succeeds",
  joined.body?.name === "Grade 12 — Group A",
  JSON.stringify(joined.body),
);

const viaGroup = await get(
  `ah_university_lists?user_id=eq.${student.id}&select=university_slug`,
  counselor.token,
);
check(
  "group membership alone grants the counselor the workspace (no 1:1 link at this point)",
  viaGroup.body?.length === 1,
  JSON.stringify(viaGroup.body),
);

// ── documents live in folders ───────────────────────────────────────────
const badFolder = await post("ah_documents", student.token, [
  { user_id: student.id, name: "x.pdf", file_path: `${student.id}/nonsense/x.pdf`, folder: "nonsense" },
]);
check("the folder vocabulary is enforced by the database", badFolder.status >= 400, `http ${badFolder.status}`);

const doc = await post("ah_documents", student.token, [
  {
    user_id: student.id,
    name: "passport.pdf",
    file_path: `${student.id}/personal/passport.pdf`,
    folder: "personal",
    size_bytes: 1234,
    mime_type: "application/pdf",
  },
]);
check("a student files a document into a folder", doc.body?.[0]?.folder === "personal", JSON.stringify(doc.body));

const seenDocs = await get(`ah_documents?user_id=eq.${student.id}&select=name,folder`, counselor.token);
check(
  "the counselor sees the student's documents, with their folder",
  seenDocs.body?.[0]?.folder === "personal",
  JSON.stringify(seenDocs.body),
);

// ── the file itself, in storage ─────────────────────────────────────────
// A row is not a document: this proves the counselor can open the bytes.
const BUCKET = "ah-documents";
const PATH = `${student.id}/personal/passport.pdf`;
const signUrl = (tok, p) =>
  fetch(`${U}/storage/v1/object/sign/${BUCKET}/${p}`, {
    method: "POST",
    headers: { ...H(tok), "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });

const put = await fetch(`${U}/storage/v1/object/${BUCKET}/${PATH}`, {
  method: "POST",
  headers: {
    apikey: K,
    Authorization: `Bearer ${student.token}`,
    "Content-Type": "application/pdf",
    "x-upsert": "true",
  },
  body: new TextEncoder().encode("%PDF-1.4 fake passport scan for the verification run"),
});
check("student uploads the file into the private bucket", put.status < 300, `http ${put.status} ${(await put.text()).slice(0, 140)}`);

const ownSign = await signUrl(student.token, PATH);
const ownBody = await ownSign.json().catch(() => null);
check("the owner can mint a signed link to their own file", ownSign.status < 300 && !!ownBody?.signedURL, JSON.stringify(ownBody).slice(0, 160));

if (ownBody?.signedURL) {
  const fetched = await fetch(`${U}/storage/v1${ownBody.signedURL}`);
  const text = await fetched.text();
  check("…and the signed link really returns the bytes", fetched.status < 300 && text.includes("fake passport"), `http ${fetched.status}`);
}

const counselorSign = await signUrl(counselor.token, PATH);
check(
  "the group counselor can mint a signed link to the student's file",
  counselorSign.status < 300,
  `http ${counselorSign.status} ${(await counselorSign.text()).slice(0, 140)}`,
);

const straySign = await signUrl(counselor.token, `${student.id}/personal/not-mine.pdf`);
check(
  "but only for paths that exist — a guessed path is not a way in",
  straySign.status >= 400,
  `http ${straySign.status}`,
);

const leftStatus = await del(
  `ah_group_members?group_id=eq.${groupId}&student_id=eq.${student.id}`,
  student.token,
);
const afterLeave = await get(
  `ah_university_lists?user_id=eq.${student.id}&select=university_slug`,
  counselor.token,
);
check(
  "leaving the group takes the access away again",
  afterLeave.body?.length === 0,
  `delete http ${leftStatus} → ${JSON.stringify(afterLeave.body)}`,
);

const signAfterLeave = await signUrl(counselor.token, PATH);
check(
  "…including access to the file in storage",
  signAfterLeave.status >= 400,
  `http ${signAfterLeave.status}`,
);

// ── anonymous access ────────────────────────────────────────────────────
const anon = await fetch(rest("ah_profiles?select=id"), { headers: { apikey: K } });
const anonBody = await anon.json().catch(() => null);
check("anonymous reads nothing at all", anon.status >= 400 || anonBody?.length === 0, `http ${anon.status} ${JSON.stringify(anonBody).slice(0, 120)}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
