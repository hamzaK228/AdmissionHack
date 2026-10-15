import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { H, P, UL, LI } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — AdmissionHack",
  description:
    "What AdmissionHack collects, where it is stored, who can see it, what leaves your device — and the things we deliberately do not do, such as analytics, advertising and tracking.",
};

/**
 * The privacy policy.
 *
 * This document is written from the code, not from a template: every claim below is
 * something the system actually does, and a claim that were not true would be worse
 * than no policy at all. The specific facts it rests on:
 *
 *   * no analytics, no advertising, no tracking, no error-reporting SDK — the only
 *     runtime dependencies are supabase-js, react, next, motion and animejs;
 *   * no cookies anywhere; the session lives in the browser's localStorage;
 *   * the only outbound flows of user data are the Supabase sync and the essay
 *     review, which posts a draft to DeepSeek.
 */

const UPDATED = "14 October 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="legal"
        title="Privacy Policy"
        description={`Last updated ${UPDATED}. This policy describes what this service actually does with your information, in the same words we would use to a person — including the parts we deliberately do not do.`}
      />

      <div className="reading-surface mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
          <p className="text-sm font-bold text-lime">The short version</p>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            Your workspace lives in your own browser and works without an account. If you sign in, it is
            copied to our database so you can restore it and let a counselor read it — and only a counselor
            you personally accept can do that. There are <strong className="text-paper">no analytics, no
            advertising, no tracking scripts and no cookies</strong> on this site. We do not sell your
            information, and we do not share it except with the handful of service providers needed to run
            the thing, which are named below.
          </p>
        </div>

        <H>1. Who we are</H>
        <P>
          The service is operated by <strong className="text-paper">[LEGAL ENTITY NAME]</strong>, registered
          at <strong className="text-paper">[REGISTERED ADDRESS]</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
          We are the controller of the personal information described here. For any question or request about
          your information, write to{" "}
          <strong className="text-paper">[CONTACT EMAIL]</strong>.
        </P>

        <H>2. What we collect</H>
        <P>
          We collect what you put in. There is no profile-building, no inference and no purchase of data
          from anyone.
        </P>
        <UL>
          <LI>
            <strong className="text-paper">Account details</strong> — your email address, the display name
            you give, and the role you pick (student, counselor or parent).
          </LI>
          <LI>
            <strong className="text-paper">Your application workspace</strong> — the profile you fill in
            (level, target country, intake, budget, grades), your test scores, the universities you are
            considering and where each application has got to, the deadlines you track, and your portfolio
            of activities, awards, work and volunteering.
          </LI>
          <LI>
            <strong className="text-paper">Documents you choose to upload</strong> — which typically include
            a passport, school transcripts, a diploma, recommendation letters, financial evidence and
            official score reports. Some of this is sensitive, and one category needs saying out loud:
            <strong className="text-paper"> a recommendation letter contains someone else&rsquo;s personal
            information</strong> as well as yours. Make sure its author is content for you to upload it.
          </LI>
          <LI>
            <strong className="text-paper">Consent records</strong> — which counselors you have accepted,
            which classes you have joined, and when. These exist so that access can be audited and revoked.
          </LI>
          <LI>
            <strong className="text-paper">Anything you post to the community board</strong> — which is the
            one part of the service that is shared with other signed-in students. Treat it as public.
          </LI>
        </UL>

        <H>3. Where it is stored</H>
        <P>
          <strong className="text-paper">In your browser first.</strong> The workspace is offline-first: it
          is kept in your browser&rsquo;s local storage and, for files, its IndexedDB. In this state nothing
          leaves your device at all, and the service works fully signed-out.
        </P>
        <P>
          <strong className="text-paper">In our database if you sign in.</strong> Signing in turns on sync,
          which mirrors your workspace to our database and your files to private storage, so that it can be
          restored on another device and read by a counselor you accept. That database and storage are
          hosted by Supabase in the <strong className="text-paper">Seoul region of South Korea</strong>, and
          the site itself is served by Vercel. If you are in another country, this means your information is
          transferred outside it — see section 8.
        </P>
        <P>
          We operate more than one product in a single database. Each product&rsquo;s data is separated by
          table naming and by database-level access rules, and no product can read another&rsquo;s rows.
        </P>

        <H>4. Who can see it</H>
        <UL>
          <LI>
            <strong className="text-paper">You</strong> — always, and fully. You can download or delete
            anything you have put in.
          </LI>
          <LI>
            <strong className="text-paper">A counselor, only if you accept them.</strong> A counselor cannot
            see anything until you enter the code they gave you, and entering it is your decision. What they
            get is <strong className="text-paper">read-only</strong>: they cannot change your list, your
            scores or your files. A link or class can be revoked by you at any moment, and when you revoke it
            their access ends immediately — this is enforced by the database itself, not by the screen you
            are looking at.
          </LI>
          <LI>
            <strong className="text-paper">Other signed-in students</strong> — only what you post on the
            community board, and only your display name alongside it. Nothing else in your workspace is
            visible to them.
          </LI>
          <LI>
            <strong className="text-paper">Us, in a limited way, for moderation.</strong> Reports about board
            posts are read by us. We do not read private workspaces except where you ask us to help you, or
            where we are legally required to.
          </LI>
        </UL>

        <H>5. What leaves your device, and to whom</H>
        <P>We use a small number of service providers, and this is the complete list:</P>
        <UL>
          <LI>
            <strong className="text-paper">Supabase</strong> — database, sign-in and file storage (Seoul,
            South Korea).
          </LI>
          <LI>
            <strong className="text-paper">Vercel</strong> — serves the website.
          </LI>
          <LI>
            <strong className="text-paper">DeepSeek</strong> — the AI features. When a signed-in student
            submits an essay draft for review, or asks the advisor what to do next, the relevant text is sent
            to DeepSeek&rsquo;s API for that request. Nothing is sent unless you press the button. See
            section 6.
          </LI>
        </UL>
        <P>
          That is the whole list. We do not sell your information, we do not share it with advertisers or
          data brokers, and we do not use it to train anything of our own.
        </P>

        <H>6. The AI features — read this before using them</H>
        <P>
          Two features send text to a third-party model provider (currently DeepSeek). The{" "}
          <strong className="text-paper">essay reviewer</strong> sends the draft you submit. The{" "}
          <strong className="text-paper">advisor</strong> sends a summary of your workspace so that it can
          tell you what to do next — your profile (level, destination, intake, budget, grades), your recorded
          scores, your university list with each application&rsquo;s status, how many of your documents are
          ticked and which are missing, your tracked deadlines, and how many portfolio entries you have.
        </P>
        <P>Three things follow, and we would rather you knew them than found out:</P>
        <UL>
          <LI>
            Your draft leaves our systems and is processed by that provider under{" "}
            <strong className="text-paper">their</strong> terms and retention rules, not ours. Do not paste
            anything you would not be willing to hand to a third party — yours, or anyone else&rsquo;s.
          </LI>
          <LI>
            The advisor sends a summary of your workspace, not your uploaded files. Your passport, your
            transcripts and your letters are not sent to it.
          </LI>
          <LI>
            Both features are limited to signed-in accounts. That is a cost measure rather than a privacy one,
            but it also means an anonymous visitor cannot use them to process anything at all.
          </LI>
        </UL>
        <P>
          If you would rather not use a third-party model, do not use the writing tab or the advisor — the
          guide, the annotated examples, the timeline, the requirement checker and the rest of the workspace
          work without them.
        </P>

        <H>7. Cookies, tracking and local storage</H>
        <P>
          <strong className="text-paper">We set no cookies.</strong> There is no analytics package, no
          advertising pixel, no session recording, no heat-mapping and no crash-reporting SDK in this
          application; we would rather know less about you than run them.
        </P>
        <P>
          We do use your browser&rsquo;s local storage and IndexedDB to keep your workspace and your sign-in
          session. That data stays on your device, is readable only by this site in your browser, and can be
          erased at any time from the profile tab (&ldquo;reset all workspace data&rdquo;) or by clearing
          your browser data. Note that clearing it also removes work you have not synced.
        </P>

        <H>8. International transfers</H>
        <P>
          Our database and file storage sit in South Korea and our site is served from Vercel&rsquo;s global
          network, so your information may be stored and processed outside the country you live in. Where the
          law requires safeguards for that (for example, under the GDPR), we rely on our providers&rsquo;
          contractual protections and standard contractual clauses. Write to us if you need the detail.
        </P>

        <H>9. How long we keep it</H>
        <P>
          Your workspace stays until you delete it — you can remove individual entries at any time, and
          resetting the workspace removes the local copy. If you ask us to delete your account, we remove
          your profile, workspace, files and posts from our database. Two honest caveats: copies may persist
          briefly in our providers&rsquo; backups before they age out, and content you posted publicly on the
          community board may have been read or copied by others before deletion.
        </P>

        <H>10. Your rights</H>
        <P>
          Depending on where you live, you may have the right to see a copy of your information, to correct
          it, to delete it, to receive it in a portable form, to object to or restrict certain processing,
          and to withdraw consent you have given (for example by revoking a counselor). Most of this you can
          do yourself from the dashboard, which is the point of building it that way. For anything you cannot
          do from the interface, write to <strong className="text-paper">[CONTACT EMAIL]</strong> and we will
          respond within the period the law allows. You also have the right to complain to your local data
          protection authority.
        </P>

        <H>11. Students under 18</H>
        <P>
          Most people using this service are applying to university, which means many are 16 or 17. If you
          are below the age at which you can consent to online services in your country, please use the
          service only with a parent or guardian&rsquo;s permission, and know that the documents this
          service can hold include a passport and your family&rsquo;s financial information. If you are a
          counselor adding a class of students, it is your responsibility to have the authority to do so.
          We do not knowingly collect information from children under 13 at all.
        </P>
        <P>
          <em className="text-dim">
            [If you operate in a jurisdiction with a specific digital age of consent, name it and the
            parental-consent mechanism here.]
          </em>
        </P>

        <H>12. How we protect it</H>
        <P>
          Every table is protected by row-level access rules enforced by the database, so a query cannot
          reach a row it is not entitled to even if it asks for it directly; uploaded files sit in private
          storage and are reachable only through short-lived links; and counselor access is read-only and
          revocable. No system is perfectly secure, and we will not pretend otherwise. If you believe your
          account or documents have been exposed, write to us immediately.
        </P>

        <H>13. Changes to this policy</H>
        <P>
          If we change this policy in a way that matters, we will say so on this page and, where appropriate,
          by email to registered users. The date at the top always reflects the current version.
        </P>

        <H>14. Contact</H>
        <P>
          <strong className="text-paper">[CONTACT EMAIL]</strong> · [LEGAL ENTITY NAME], [REGISTERED ADDRESS].
        </P>

        <p className="mt-12 text-xs leading-relaxed text-dim">
          See also our{" "}
          <Link href="/terms" className="font-bold text-lime/80 hover:text-lime">
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </>
  );
}
