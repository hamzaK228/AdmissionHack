import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { H, P, UL, LI, Note } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service — AdmissionHack",
  description:
    "The terms for using AdmissionHack: who may use it, what you keep, what you may not do on the community board, academic integrity, and the limits of what this service can promise.",
};

const UPDATED = "14 October 2026";

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="legal"
        title="Terms of Service"
        description={`Last updated ${UPDATED}. Plain terms for a free service: what you keep, what we may do, what you may not do to other people, and — importantly — what this service cannot promise you.`}
      />

      <div className="reading-surface mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-lime/25 bg-lime/[0.06] p-6">
          <p className="text-sm font-bold text-lime">The short version</p>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            The service is free, and you keep ownership of everything you put into it. We do not write your
            essays, we cannot promise you an admission, and the figures in our directory are approximate and
            must be checked against the university&rsquo;s own page before you rely on them. Be decent to
            other students on the board. That is most of it.
          </p>
        </div>

        <H>1. These terms</H>
        <P>
          By using this service you agree to these terms. If you do not agree with them, please do not use
          the service. The service is operated by <strong className="text-paper">Hamza Kozubaev</strong>
          , <strong className="text-paper">Termechikova 51, Lenin district, Bishkek, Kyrgyzstan</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;),
          and can be reached at <strong className="text-paper">sathack.community@gmail.com</strong>. Our handling of your
          information is described separately in the{" "}
          <Link href="/privacy" className="font-bold text-lime/80 hover:text-lime">
            Privacy Policy
          </Link>
          , which forms part of these terms.
        </P>

        <H>2. Who may use it</H>
        <P>
          You may use this service if you are old enough to enter into a contract where you live, or if you
          are using it with the permission of a parent or guardian. If you are below the age at which your
          country lets you consent to online services on your own, please involve a parent or guardian. The
          service is not intended for children under 13. If you open an account for a school or an
          organisation, you confirm you are authorised to do so.
        </P>

        <H>3. Your account</H>
        <P>
          Keep your password to yourself, and give us accurate information — an application service is not
          much use if the details in it are wrong. An account is for one person; do not share one between
          several applicants. You are responsible for what happens through your account. Tell us promptly if
          you think someone else has access to it.
        </P>

        <H>4. What you put in, and what you keep</H>
        <P>
          <strong className="text-paper">You keep ownership of everything you create here</strong> — your
          essays, your portfolio entries, your documents, your posts. We claim no ownership of any of it. We
          do need a limited permission to operate the service, and that permission is only: to store your
          content, to send it to the service providers named in the Privacy Policy, and to display it back to
          you and to any counselor you accept. It ends when you delete the content or your account.
        </P>
        <P>
          Two things follow from that which are worth being explicit about. <strong className="text-paper">A
          recommendation letter, or any document about someone else, contains another person&rsquo;s personal
          information</strong> — make sure its author is content for you to upload it. And{" "}
          <strong className="text-paper">anything you post to the community board is visible to other
          signed-in students</strong>, so do not post anything confidential there.
        </P>

        <H>5. Acceptable use</H>
        <P>
          The board is the only part of this service other people can see, and a board only works if people
          behave. You agree not to:
        </P>
        <UL>
          <LI>
            <strong className="text-paper">Publish anyone&rsquo;s personal information</strong> — including
            another student&rsquo;s name, school, contact details, documents, or the contents of anything
            private that was shared with you. This applies to counselors and their records too.
          </LI>
          <LI>
            <strong className="text-paper">Harass, threaten, impersonate or discriminate</strong> against
            anyone, or post content that is hateful, sexually explicit, or aimed at someone&rsquo;s religion,
            ethnicity, gender or background.
          </LI>
          <LI>
            <strong className="text-paper">Advertise or solicit</strong> — recruiting for paid services,
            agents or agencies, selling essays, or posting referral links.
          </LI>
          <LI>
            <strong className="text-paper">Try to reach data that is not yours</strong> — probing or
            circumventing the access rules, attempting to read another student&rsquo;s workspace, or using
            someone else&rsquo;s code to join a class you are not in.
          </LI>
          <LI>
            <strong className="text-paper">Scrape or overload the service</strong> — automated bulk
            collection, or traffic intended to degrade it for others.
          </LI>
        </UL>
        <P>
          You can delete your own posts and replies at any time. Other students can report a post to us, and
          <strong className="text-paper"> we may hide or remove content that breaks these terms</strong>,
          without notice, and may suspend or close an account that repeatedly does. We are not obliged to
          monitor the board; we act on what we see and what is reported.
        </P>

        <H>6. Academic integrity</H>
        <P>
          This matters more here than in most products, so it is not buried in a subsection.
        </P>
        <UL>
          <LI>
            <strong className="text-paper">We do not write your essay for you.</strong> The writing tools
            give you feedback on a draft you wrote. They do not produce an essay to submit, and using them to
            generate one would defeat the purpose of the exercise.
          </LI>
          <LI>
            <strong className="text-paper">The AI reviewer can be wrong</strong>, and it has not read your
            file, your grades or the rest of your application. It is an opinion, not a decision.
          </LI>
          <LI>
            <strong className="text-paper">Universities set their own rules on AI assistance</strong>, and
            they vary widely — some require you to declare it, some prohibit it for the essay you submit.
            Knowing and following the rules of each university you apply to is your responsibility, not ours.
            Do not submit AI-written text as your own.
          </LI>
          <LI>
            <strong className="text-paper">Do not fake anything.</strong> Forging transcripts,
            recommendation letters or score reports, or misrepresenting your results, is grounds for
            immediate termination, and it is the applicant who carries the consequence with the university.
          </LI>
        </UL>

        <H>7. Counselors, classes and consent</H>
        <P>
          A student grants a counselor access by entering the code the counselor gave them, and that act is
          the consent. Counselors get read-only access to the students who joined their class, and a student
          may revoke it at any time. If you are a counselor, you confirm that you have the authority to hold
          the information your students share with you, that you will use it only for the purpose of helping
          them apply, and that you will follow the data protection rules that apply to schools in your
          country — including any rules about students who are minors.
        </P>

        <H>8. What we cannot promise</H>
        <P>
          <strong className="text-paper">No admission outcome is promised or implied.</strong> Nothing here
          improves your chances except in the ordinary sense that being organised helps.
        </P>
        <P>
          <strong className="text-paper">The information is approximate.</strong> University figures —
          tuition, rankings, deadlines, requirements — are community-contributed and collected from public
          sources, and they change between cycles. They are a starting point, not an authority.{" "}
          <strong className="text-paper">Always verify before you rely on a number or a date</strong>,
          especially anything involving money, a visa or a deadline. We are not responsible for a decision
          you took on the basis of an approximate figure.
        </P>
        <P>
          The service does not provide legal, immigration, financial or admissions advice, and nothing in it
          is a substitute for the official guidance of a university, an embassy or a qualified adviser.
        </P>

        <H>9. Third-party services</H>
        <P>
          The essay reviewer sends the text you submit to a third-party model provider, and the service runs
          on hosting and database providers described in the Privacy Policy. Those providers have their own
          terms, and we do not control them. Links out to universities, exam boards and scholarship bodies
          are provided for convenience; we are not responsible for their content.
        </P>

        <H>10. The service is free, and may change</H>
        <P>
          There is no charge to students, now or in future, and nothing to refund. Because it is free, we owe
          you a fair warning rather than a guarantee: we may add, change or withdraw features, and we may
          suspend the service for maintenance. If we ever intended to charge for something, it would be
          announced in advance and would not apply retroactively.
        </P>

        <H>11. Availability and disclaimers</H>
        <P>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of
          any kind, whether express or implied, including fitness for a particular purpose. We do not warrant
          that it will be uninterrupted, that it will be free of errors, or that uploaded files will never be
          lost — which is why your workspace is kept in your own browser as well, and why you should keep
          your own copy of anything irreplaceable.
        </P>

        <H>12. Limits on our responsibility</H>
        <P>
          To the fullest extent the law allows, we are not liable for indirect or consequential losses, for
          lost opportunities, or for decisions taken on approximate information. Where liability cannot be
          excluded, our total responsibility to you is limited to{" "}
          <strong className="text-paper">nothing at all &mdash; the service is free to students and no fee
          of any kind is charged for it</strong>. Nothing here excludes liability that the law does not permit to be
          excluded.
        </P>

        <H>13. Suspension and termination</H>
        <P>
          You may stop using the service and delete your account at any time. We may suspend or close an
          account that breaks these terms, that we reasonably believe is being used to harm someone, or where
          we are required to by law. Where it is reasonable to do so, we will tell you why.
        </P>

        <H>14. Governing law</H>
        <P>
          These terms are governed by the laws of <strong className="text-paper">Kyrgyzstan</strong>, and
          disputes will be heard by the courts of 
          <strong className="text-paper">Bishkek, Kyrgyzstan</strong>. If you are a consumer, this does not
          remove protections you have under the law of the country where you live.
        </P>

        <H>15. Changes to these terms</H>
        <P>
          We may update these terms. If a change is significant, we will flag it on this page and, where
          appropriate, by email to registered users. Continuing to use the service after a change means you
          accept the updated terms. The date at the top always reflects the current version.
        </P>

        <H>16. Contact</H>
        <P>
          <strong className="text-paper">sathack.community@gmail.com</strong> · Hamza Kozubaev, Termechikova 51, Lenin district, Bishkek, Kyrgyzstan.
        </P>

        <Note>
          See also our{" "}
          <Link href="/privacy" className="font-bold text-lime/80 hover:text-lime">
            Privacy Policy
          </Link>
          .
        </Note>
      </div>
    </>
  );
}
