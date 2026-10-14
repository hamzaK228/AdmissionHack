"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";
import {
  listBoard,
  createPost,
  createComment,
  deletePost,
  deleteComment,
  since,
  TOPICS,
  TOPIC_LABEL,
  type BoardPost,
  type Topic,
} from "@/lib/community";
import { Eyebrow } from "@/components/ui";

/**
 * The student board — the one shared surface in the app.
 *
 * Everything else here is one student's private workspace, which is why the rest
 * of the product works signed-out and offline. This does not: a board with no
 * accounts is a board with no authors. So the tab is honest about that instead of
 * offering a composer that fails on submit.
 *
 * Author identity is stamped by the database, and the client's only judgement is
 * whether a row is yours — so the delete control cannot be pointed at someone
 * else's post even by tampering, because the policy would refuse it anyway.
 */

const inputCls =
  "w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-dim focus:border-lime/60";

function Composer({ onPosted }: { onPosted: () => void }) {
  const [topic, setTopic] = useState<Topic>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const canPost = title.trim().length >= 4 && body.trim().length > 0 && !busy;

  const submit = async () => {
    setBusy(true);
    setErr(null);
    const res = await createPost({ topic, title, body });
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    setTitle("");
    setBody("");
    setOpen(false);
    onPosted();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-line2 p-4 text-left text-sm text-fog transition-colors hover:border-lime/50 hover:text-lime"
      >
        + ask the board something — about a university, an exam, a visa, a scholarship
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-5">
      <Eyebrow>new post</Eyebrow>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          className={inputCls}
          placeholder="A question in one line — e.g. Has anyone applied to TU Delft with a Kazakh certificate?"
          value={title}
          maxLength={160}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          aria-label="Topic"
          className={`${inputCls} sm:w-52 [&>option]:bg-ink`}
          value={topic}
          onChange={(e) => setTopic(e.target.value as Topic)}
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {TOPIC_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className={`${inputCls} mt-3`}
        rows={5}
        placeholder="What you have already tried, what you have read, and what is still unclear. Specific questions get answers."
        value={body}
        maxLength={6000}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!canPost}
          className="anim-glow rounded-lg bg-lime px-5 py-2.5 text-sm font-bold text-ink press-grow disabled:opacity-30"
        >
          {busy ? "posting…" : "post"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="link-quiet text-xs font-bold text-dim hover:text-fog"
        >
          cancel
        </button>
        <span className="ml-auto text-[11px] text-dim">
          your display name is attached automatically
        </span>
      </div>
      {err && (
        <p className="mt-3 rounded-lg border border-amber/40 bg-amber/5 px-3.5 py-2.5 text-xs text-amber">
          {err}
        </p>
      )}
    </div>
  );
}

function ReplyBox({ postId, onReplied }: { postId: string; onReplied: () => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        await createComment(postId, body);
        setBusy(false);
        setBody("");
        onReplied();
      }}
    >
      <input
        className={inputCls}
        placeholder="add a reply…"
        value={body}
        maxLength={3000}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        type="submit"
        disabled={!body.trim() || busy}
        className="shrink-0 rounded-lg border border-line2 px-4 py-2 text-xs font-bold text-lime transition-colors hover:border-lime/50 disabled:opacity-30"
      >
        {busy ? "…" : "reply"}
      </button>
    </form>
  );
}

function PostCard({ post, onChanged }: { post: BoardPost; onChanged: () => void }) {
  const [openReplies, setOpenReplies] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const long = post.body.length > 420;
  const shown = expanded || !long ? post.body : `${post.body.slice(0, 420)}…`;

  return (
    <li className="rounded-2xl border border-line bg-panel/70 p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-dim">
        <span className="font-bold text-fog">{post.authorName}</span>
        <span>·</span>
        <span>{since(post.createdAt)}</span>
        <span className="rounded border border-line2 px-1.5 py-0.5 uppercase tracking-wider">
          {TOPIC_LABEL[post.topic]}
        </span>
        {post.mine && (
          <button
            type="button"
            onClick={async () => {
              await deletePost(post.id);
              onChanged();
            }}
            className="ml-auto text-[11px] font-bold text-dim transition-colors hover:text-red"
          >
            delete
          </button>
        )}
      </div>

      <h3 className="mt-3 font-bold text-paper">{post.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fog">{shown}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-bold text-lime/80 hover:text-lime"
        >
          {expanded ? "show less" : "read the rest"}
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpenReplies((v) => !v)}
        className="mt-4 text-xs font-bold text-lime/80 transition-colors hover:text-lime"
      >
        {post.replies.length === 0
          ? "be the first to reply"
          : `${post.replies.length} repl${post.replies.length === 1 ? "y" : "ies"}`}
      </button>

      {openReplies && (
        <div className="mt-3 border-t border-line pt-3">
          <ul className="space-y-3">
            {post.replies.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-ink px-3.5 py-3">
                <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-dim">
                  <span className="font-bold text-fog">{r.authorName}</span>
                  <span>·</span>
                  <span>{since(r.createdAt)}</span>
                  {r.mine && (
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteComment(r.id);
                        onChanged();
                      }}
                      className="ml-auto font-bold transition-colors hover:text-red"
                    >
                      delete
                    </button>
                  )}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fog">{r.body}</p>
              </li>
            ))}
          </ul>
          <ReplyBox postId={post.id} onReplied={onChanged} />
        </div>
      )}
    </li>
  );
}

export function Community() {
  const { user, configured } = useAuth();
  const [posts, setPosts] = useState<BoardPost[] | null>(null);
  const [filter, setFilter] = useState<Topic | "all">("all");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPosts(await listBoard());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) refresh();
    else setLoading(false);
  }, [user, refresh]);

  if (!configured || !user) {
    return (
      <div className="max-w-xl rounded-2xl border border-dashed border-line2 bg-panel/40 p-6">
        <Eyebrow>the board</Eyebrow>
        <p className="mt-3 text-sm leading-relaxed text-fog">
          This is the one part of AdmissionHack that is shared between students — so it is the one part
          that needs an account. Everything else in your workspace stays private and works without one.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-dim">
          {configured
            ? "Sign in on the account tab and this board opens: ask about a university, an exam, a visa or a scholarship, and answer someone else's question."
            : "No backend is configured for this deployment, so there is no board to show."}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-lg bg-lime px-4 py-2 text-xs font-bold text-ink press-grow"
        >
          go to the account tab →
        </Link>
      </div>
    );
  }

  const visible = (posts ?? []).filter((p) => filter === "all" || p.topic === filter);
  const counts = new Map<Topic, number>();
  for (const p of posts ?? []) counts.set(p.topic, (counts.get(p.topic) ?? 0) + 1);

  return (
    <div className="max-w-3xl">
      <p className="text-sm leading-relaxed text-fog">
        Ask the people who are doing this at the same time as you. The board is shared — the rest of your
        workspace is not — and your display name is attached to what you post.
      </p>

      <div className="mt-6">
        <Composer onPosted={refresh} />
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded border px-2.5 py-1 text-[11px] font-bold transition-colors ${
            filter === "all" ? "border-lime/50 bg-lime/15 text-lime" : "border-line text-fog hover:border-lime/40"
          }`}
        >
          all {posts ? `(${posts.length})` : ""}
        </button>
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded border px-2.5 py-1 text-[11px] font-bold transition-colors ${
              filter === t ? "border-lime/50 bg-lime/15 text-lime" : "border-line text-fog hover:border-lime/40"
            }`}
          >
            {TOPIC_LABEL[t]} {counts.get(t) ? `(${counts.get(t)})` : ""}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-sm text-dim">loading the board…</p>}

      {!loading && visible.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-line2 p-6">
          <p className="text-sm text-fog">
            {posts && posts.length > 0
              ? "Nothing in this topic yet."
              : "The board is new, so it is empty — which is the honest state of a community before anyone arrives. Ask the first question and it stops being empty."}
          </p>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {visible.map((p) => (
          <PostCard key={p.id} post={p} onChanged={refresh} />
        ))}
      </ul>

      <p className="mt-8 text-xs leading-relaxed text-dim">
        Posts are public to signed-in students and are not moderated yet — write nothing you would not put
        on a noticeboard, and take anything said about a specific university or visa with the usual
        caution. You can delete your own posts and replies at any time.
      </p>
    </div>
  );
}
