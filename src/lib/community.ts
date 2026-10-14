"use client";

import { supabase, T } from "./supabase";

/**
 * The student board.
 *
 * Unlike the rest of the workspace, this data is *shared* — it is the one place in
 * the app where a student reads what another student wrote. So it is the one place
 * that needs an account, and the UI says that plainly rather than showing a form
 * that silently fails.
 *
 * Author names are computed server-side by a trigger (`ah_stamp_author`), not sent
 * by the client, so nobody can post under someone else's name. The client only
 * decides whether a row is *yours*.
 */

export const TOPICS = [
  "general",
  "universities",
  "exams",
  "essays",
  "visa",
  "scholarships",
] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABEL: Record<Topic, string> = {
  general: "anything",
  universities: "universities",
  exams: "exams & scores",
  essays: "essays",
  visa: "visa & arrival",
  scholarships: "scholarships & money",
};

export interface BoardComment {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface BoardPost {
  id: string;
  authorName: string;
  topic: Topic;
  title: string;
  body: string;
  createdAt: string;
  mine: boolean;
  replies: BoardComment[];
}

export type WriteResult = { ok: true } | { ok: false; error: string };

const asTopic = (v: string): Topic => (TOPICS as readonly string[]).includes(v) ? (v as Topic) : "general";

/** Signed in? The board is the only shared surface, so this gates the whole tab. */
export async function boardUser(): Promise<{ id: string; name: string } | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: prof } = await sb.from(T.profiles).select("full_name").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, name: prof?.full_name ?? "a student" };
}

/** Every post, newest first, with its replies. `null` means "no backend configured". */
export async function listBoard(): Promise<BoardPost[] | null> {
  const sb = supabase();
  if (!sb) return null;
  const me = await boardUser();
  if (!me) return null;

  const [posts, comments] = await Promise.all([
    sb
      .from(T.posts)
      .select("id, author_id, author_name, topic, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    sb
      .from(T.comments)
      .select("id, post_id, author_id, author_name, body, created_at")
      .order("created_at", { ascending: true })
      .limit(600),
  ]);

  if (posts.error) return [];

  const byPost = new Map<string, BoardComment[]>();
  for (const c of comments.data ?? []) {
    const list = byPost.get(c.post_id) ?? [];
    list.push({
      id: c.id,
      postId: c.post_id,
      authorName: c.author_name,
      body: c.body,
      createdAt: c.created_at,
      mine: c.author_id === me.id,
    });
    byPost.set(c.post_id, list);
  }

  return (posts.data ?? []).map((p) => ({
    id: p.id,
    authorName: p.author_name,
    topic: asTopic(p.topic),
    title: p.title,
    body: p.body,
    createdAt: p.created_at,
    mine: p.author_id === me.id,
    replies: byPost.get(p.id) ?? [],
  }));
}

export async function createPost(input: { topic: Topic; title: string; body: string }): Promise<WriteResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const { error } = await sb.from(T.posts).insert({
    topic: input.topic,
    title: input.title.trim(),
    body: input.body.trim(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function createComment(postId: string, body: string): Promise<WriteResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const { error } = await sb.from(T.comments).insert({ post_id: postId, body: body.trim() });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deletePost(id: string): Promise<WriteResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const { error } = await sb.from(T.posts).delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteComment(id: string): Promise<WriteResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const { error } = await sb.from(T.comments).delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Report a post or a comment.
 *
 * There is no admin screen: reports are collected and the operator reads them in
 * the Supabase dashboard, where hiding is one statement. Building a role in the app
 * for a single action would be a bigger surface than the problem it solves, and
 * the board is small enough that a human reading reports is the honest design.
 *
 * The reporter is taken from the session rather than from the caller's argument —
 * the policy enforces it anyway, but passing it in would suggest it were the
 * client's choice.
 */
export async function reportTarget(
  target: { postId: string } | { commentId: string },
  reason: string,
): Promise<WriteResult> {
  const sb = supabase();
  if (!sb) return { ok: false, error: "not configured" };
  const { data } = await sb.auth.getUser();
  if (!data.user) return { ok: false, error: "not signed in" };
  const { error } = await sb.from(T.boardReports).insert({
    reporter_id: data.user.id,
    ...("postId" in target ? { post_id: target.postId } : { comment_id: target.commentId }),
    reason: reason.trim(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** "3 minutes ago" — enough for a board, and cheaper than a date library. */
export function since(iso: string, now: Date = new Date()): string {
  const s = Math.max(1, Math.round((+now - +new Date(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
