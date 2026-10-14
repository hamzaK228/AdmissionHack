# IP, licensing and patents

**Notes to take to a lawyer, not legal advice.** What follows is written by an engineer who can check
facts; the conclusions about what to do are for a professional in your jurisdiction to confirm.

---

## 1. The fact that decides the patent question

**This repository has been public since 9 October 2026**, with no licence file. The code, the schema, the
match engine and every document in this repository are therefore *already disclosed to the world*.

Under patent law that matters more than anything else on this page:

- **Most jurisdictions require absolute novelty.** In the EPO, China, Japan and most of the world, a public
  disclosure of your own invention *before* you file destroys your ability to patent it. For anything
  visible in this repository, that door is closed.
- **The United States is the exception, and it is time-limited.** US law gives the inventor a
  **12-month grace period** from their own public disclosure. First disclosure **9 October 2026** means the
  US window would close around **9 October 2027**.
- There is also a professional reason to file before publishing anything further that you believe is
  inventive: an attorney needs time to search, draft and file, and the grace period does not pause.

**So: if patents matter to you, the action is now, not "for the future" — and it is a conversation with a
patent attorney, not a document to write.**

## 2. My honest view: patents are the wrong instrument here

I would rather tell you this than take money-adjacent steps that produce nothing. Looking at what this
product actually contains:

- The stack is **standard engineering** — Next.js, PostgREST, Postgres row-level security, an offline-first
  sync, a heuristic admission-match score, a question runner. Each of these is well-trodden, and patent
  offices treat software as patentable only where there is a *technical* invention beyond a way of doing
  business. "Explainable scoring" and "consent by join code" are good product decisions; they are unlikely
  to be granted as patents.
- Even where grantable, a patent costs roughly **five figures per jurisdiction** to obtain and more to
  enforce. Against a service that is free to students, that is a poor return — and enforcing a patent
  against a competitor is not a realistic activity for a solo operator anyway.
- The disclosure above means that for most of this code, the question is already moot.

What a patent would *not* protect is the thing that actually differentiates this product, which is the
**written content**: the country guides, the journey steps, the Writing School's annotated essays, the
original practice questions. That is protected by **copyright**, automatically, and it is the asset worth
defending.

## 3. The IP you actually have

| Instrument | What it covers here | Cost | Automatic? |
|---|---|---|---|
| **Copyright** | The source code, and — more valuable — the original written content: guides, roadmap text, model essays, 60 original practice questions | nil | **Yes**, on creation, in almost every country by treaty |
| **Licence file** | Not a right — the *decision* about what others may do with your copyrighted code | nil | No — you must choose |
| **Trademark** | The name **AdmissionHack** and any logo; registrable per class of service | modest (low hundreds per class in most systems) | No — must be filed |
| **Database right (sui generis)** | Your *compilation* of the directory, in the EU/UK — not the underlying facts | nil | In the EU/UK, yes |
| **Patent** | Potentially a specific technical invention | very high | No — and see §1 |

**Recommendation.** Skip patents. Put the effort into three cheaper and more useful things: a **licence
decision**, a **trademark** for the name (a school that adopts this asks who runs it), and the data licensing
question below — which is a genuine risk rather than a theoretical one.

## 4. Decide the licence — today it is "all rights reserved" by default

There is no `LICENSE` file, which means by default **nobody may copy, modify or redistribute this code**.
That is a legitimate and protective position, and for a product you intend to run yourself it is a sensible
default. But it should be a decision you are holding deliberately, not an oversight, and the alternatives
are meaningfully different:

| Option | Effect | Choose it if |
|---|---|---|
| **No licence** (status quo) | All rights reserved. Readable, but nobody may reuse it. | You want to keep it wholly yours |
| **Source-available** (PolyForm Noncommercial, BUSL-1.1) | Others may read, use and often study it, but not commercialise it | You want transparency and contributions without someone reselling your work |
| **Copyleft** (AGPL-3.0) | Anyone may use and modify it, but any hosted derivative must publish its source | You want it to stay open for students, permanently |
| **Permissive** (MIT, Apache-2.0) | Anyone may do anything, including sell it | You care only about adoption, not control |

For a free service where the risk is a competitor re-launching your work, **source-available** is usually the
right answer, and **AGPL** if the mission is that students always get it free. If you accept outside
contributions later, you will also want a simple contributor agreement.

## 5. The risk more likely to bite than a patent

**The ranking data is not yours.** The directory republishes **QS World University Rankings** positions and
**ARWU (ShanghaiRanking)** positions for ~1,500 institutions. Both are proprietary datasets with their own
terms of use, and both restrict redistribution and commercial use. The project credits them and links to the
official pages — which is good practice and good manners, but **attribution is not a licence**.

Concretely, that means the risk is not a patent dispute; it is a takedown notice or a licence demand over
rank numbers published across 1,500 pages. Worth handling before the site grows:

1. **Read both terms of use** and note whether republication is permitted, and whether your use is
   "commercial" (a free service funded by sponsors may still count as commercial in some terms).
2. **Consider what the ranks actually do for the product.** A student chooses between universities on
   country, cost, programme and fit — the "QS #37" chip is largely decorative. Replacing the numbers with
   a link to the official ranking page, or with your own clearly-labelled banding, removes the exposure and
   costs the product very little.
3. **Or ask for permission.** Both organisations license their data, and a small non-commercial education
   project sometimes gets a permissive answer.
4. **The rest of the data is safer than it looks.** The practice questions are original writing, the guides
   are authored here, and university tuition figures are public facts — facts themselves are not owned,
   though a *compilation* can be (see the database right above).

## 6. If you truly believe there is an invention here

Then the sequence is fixed by the disclosure dates, not by preference:

1. **Within days:** write down what you believe is new, and when it was first disclosed.
2. **Before 9 October 2027:** talk to a patent attorney, in the US if the invention is worth pursuing at all
   — first, because the US grace period is the only window you have left.
3. **Do not publish more detail in the meantime.** Every additional public commit that describes an
   invention you might file on narrows what is left to claim.
