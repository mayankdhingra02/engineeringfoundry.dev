import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, BookOpenCheck, Compass, SearchCheck, ShieldCheck } from "lucide-react";
import { HomeEntryExperience } from "@/components/home-entry-experience";
import { SearchLauncher } from "@/components/search-launcher";
import { systemDesignLessons } from "@/data/system-design/curriculum";
import { canonicalDsaQuestions } from "@/lib/dsa/catalog";
import { activeMlDesignProblems } from "@/data/ml-design";
import { activeBehavioralQuestions } from "@/data/behavioral";
import { accountDeletionProofCookieName, isAccountDeletionProof } from "@/lib/auth/account-deletion";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Engineering Foundry — Focused Engineering Interview Preparation",
  description: "Choose a focused path for coding, System Design, Low-Level Design, ML Design, company, behavioral, or interview-execution preparation.",
  path: "/",
  absoluteTitle: true,
});

const continuationLessons = systemDesignLessons
  .filter((lesson) => lesson.status === "published" && lesson.slug)
  .map((lesson) => ({
    id: lesson.id,
    title: lesson.navigationTitle ?? lesson.title,
    href: lesson.slug!,
    kind: lesson.id.startsWith("problem-") ? "practice" : "lesson",
  }));

const continuationCatalog = {
  dsa: canonicalDsaQuestions.map((question) => ({ id: question.id, title: question.title, href: `/dsa/questions/${question.id}` })),
  "system-design": continuationLessons.map((lesson) => ({ id: lesson.kind === "practice" ? lesson.id.slice("problem-".length) : lesson.id, title: lesson.title, href: lesson.href })),
  "ml-design": activeMlDesignProblems.map((problem) => ({ id: problem.id, title: problem.title, href: `/ml-design/${problem.slug}` })),
  behavioral: activeBehavioralQuestions.map((question) => ({ id: question.id, title: question.prompt, href: `/behavioral?question=${encodeURIComponent(question.slug)}` })),
} as const;

const supportingPaths = [
  { title: "Build a study roadmap", description: "Turn your timeline and target level into a focused DSA plan.", href: "/dsa/roadmap" },
  { title: "Practice interview questions", description: "Filter coding questions by pattern, difficulty, and company.", href: "/dsa/questions" },
  { title: "Run a mock interview", description: "Use a structured solo session or practice with your own peer.", href: "/mock-interviews" },
  { title: "Practice engineering judgment", description: "Work through self-guided engineering scenarios and rubrics.", href: "/challenges" },
];

export default async function HomePage() {
  const accountDeleted = isAccountDeletionProof((await cookies()).get(accountDeletionProofCookieName)?.value);
  return (
    <>
      {accountDeleted && <div className="account-deleted-notice" role="status"><div className="page-width"><ShieldCheck size={18} aria-hidden="true" /><p><strong>Your account was deleted.</strong> Your private Engineering Foundry data and authentication identity have been removed.</p></div></div>}
      <section className="home-entry">
        <div className="page-width">
          <div className="home-entry-heading">
            <div>
              <h1>What should you prepare next?</h1>
              <p>Choose the interview track in front of you. Start focused, then move through the rest when it becomes useful.</p>
            </div>
            <div className="home-entry-actions">
              <SearchLauncher className="home-search-trigger" label="Search topics, questions, or companies" showShortcut />
            </div>
          </div>

          <HomeEntryExperience continuationCatalog={continuationCatalog} />
        </div>
      </section>

      <section className="home-supporting section-compact" aria-labelledby="home-supporting-title">
        <div className="page-width">
          <div className="home-section-heading">
            <div>
              <h2 id="home-supporting-title">More ways to prepare</h2>
              <p>Use these when you need a plan, deliberate practice, or support around the main interview tracks.</p>
            </div>
          </div>
          <nav className="home-supporting-list" aria-label="Additional preparation paths">
            {supportingPaths.map((path) => (
              <Link href={path.href} key={path.href}>
                <span><strong>{path.title}</strong><small>{path.description}</small></span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="home-trust section-compact" aria-labelledby="home-trust-title">
        <div className="page-width home-trust-layout">
          <div className="home-section-heading">
            <div>
              <h2 id="home-trust-title">Preparation without the noise</h2>
              <p>Engineering Foundry keeps useful technical depth available while helping you decide what deserves attention now.</p>
            </div>
            <Link href="/about">How the Foundry works <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <ul className="home-trust-list">
            <li><Compass size={19} aria-hidden="true" /><span><strong>Focused paths</strong><small>Choose by interview type, company, level, and available time where supported.</small></span></li>
            <li><BookOpenCheck size={19} aria-hidden="true" /><span><strong>Depth stays available</strong><small>Recommendations organize the curriculum; they do not lock useful material.</small></span></li>
            <li><ShieldCheck size={19} aria-hidden="true" /><span><strong>Public by default</strong><small>Browse preparation content without creating an account or claiming fake progress.</small></span></li>
            <li><SearchCheck size={19} aria-hidden="true" /><span><strong>Clear source boundaries</strong><small>General guidance and attributed company-specific material remain visibly distinct.</small></span></li>
          </ul>
        </div>
      </section>
    </>
  );
}
