/*
DIRECTION CONTRACT
THESIS: My Practice is a private engineering notebook, not a scorecard or readiness dashboard.
OWN-WORLD: Extend the public System Design reading surface with flat paper worksheets, quiet rules, rust actions, and green saved states.
STORY: Resume the latest rehearsal, narrow the canonical catalog, update one concept deliberately, then open an independent design attempt.
FIRST VIEWPORT: Context, resume action, compact progress summary, and useful filters—no gamified percentage or fake readiness.
FORM: Operate-mode extension of the established System Design workspace; explicit saves and visible ownership are the signature.
FINISH: Browser QA, detector, independent finish review, and documentation are required before ship.
*/
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Bookmark, FilePenLine, Filter, LockKeyhole } from "lucide-react";
import { SystemDesignSidebar } from "@/components/system-design-sidebar";
import { systemDesignCurriculum } from "@/data/system-design/curriculum";
import { systemDesignTopicManifest } from "@/data/system-design/manifest";
import { systemDesignPracticeContents } from "@/content/system-design/problems/data";
import { SystemDesignProgressEditor } from "@/features/system-design/progress-editor";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { getSystemDesignWorkspaceState } from "@/lib/system-design/queries";
import { chooseSystemDesignContinueTarget } from "@/lib/system-design/workspace";

export const metadata: Metadata = { title: "My System Design Practice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export default async function SystemDesignPracticePage({ searchParams }: { searchParams: Promise<{ application?: string; q?: string; kind?: string; status?: string; bookmarked?: string }> }) {
  const accountPlatformAvailable = isAccountPlatformAvailable();
  if (!accountPlatformAvailable) return <div className="sd-doc-layout"><SystemDesignSidebar curriculum={systemDesignCurriculum} accountPlatformAvailable={accountPlatformAvailable} /><div className="sd-practice-home signed-out"><section><BookOpen size={24} aria-hidden="true" /><h1>Public System Design practice remains available</h1><p>Account-backed practice is unavailable in this configuration. Browse a problem for an unsaved rehearsal, or continue through the course without an account.</p><div><Link className="button" href="/system-design/problems">Browse public problems</Link><Link className="button button-secondary" href="/system-design/start-here/introduction">Start learning</Link></div></section></div></div>;
  const params = await searchParams;
  const state = await getSystemDesignWorkspaceState(params.application);
  if (!state.signedIn) return <div className="sd-doc-layout"><SystemDesignSidebar curriculum={systemDesignCurriculum} accountPlatformAvailable={state.accountPlatformAvailable} /><div className="sd-practice-home signed-out"><section><LockKeyhole size={24} /><h1>Your System Design practice stays private</h1><p>Public lessons and walkthroughs remain available without an account. Sign in to keep concept notes, confidence, bookmarks, and independent design attempts.</p><div><Link className="button" href="/signin?next=/system-design/practice">Sign in</Link><Link className="button button-secondary" href="/system-design/problems">Browse public problems</Link></div></section></div></div>;

  const q = params.q?.trim().toLowerCase() ?? "";
  const catalog = [
    ...systemDesignTopicManifest.filter((item) => item.published).map((item) => ({ id: item.id, itemType: "concept" as const, title: item.title, description: item.description, kind: "Concept", href: item.slug, group: item.section })),
    ...systemDesignPracticeContents.map((item) => ({ id: item.id, itemType: "design_problem" as const, title: item.title, description: item.summary, kind: "Design problem", href: `/system-design/problems/${item.id}`, group: item.category })),
  ];
  const filtered = catalog.filter((item) => {
    const progress = state.progress[`${item.itemType}:${item.id}`];
    return (!q || `${item.title} ${item.description} ${item.group}`.toLowerCase().includes(q))
      && (!params.kind || item.kind === params.kind)
      && (!params.status || (progress?.status ?? "not_started") === params.status)
      && (!params.bookmarked || progress?.bookmarked);
  });
  const applicationSuffix = state.application ? `?application=${state.application.id}` : "";
  const progressRows = Object.values(state.progress);
  const continueTarget = chooseSystemDesignContinueTarget(state.attempts, progressRows, catalog);
  const topicProgress = [...systemDesignTopicManifest.filter((item) => item.published).reduce((groups, item) => {
    const current = groups.get(item.section) ?? { label: item.section, total: 0, reviewed: 0, comfortable: 0 };
    const progress = state.progress[`concept:${item.id}`];
    current.total += 1;
    if (progress?.status === "reviewed" || progress?.status === "comfortable") current.reviewed += 1;
    if (progress?.status === "comfortable") current.comfortable += 1;
    groups.set(item.section, current);
    return groups;
  }, new Map<string, { label: string; total: number; reviewed: number; comfortable: number }>()).values()];

  return <div className="sd-doc-layout"><SystemDesignSidebar curriculum={systemDesignCurriculum} accountPlatformAvailable={state.accountPlatformAvailable} /><div className="sd-practice-home">
    <header className="sd-practice-home-header"><div><h1>My System Design Practice</h1><p>Keep durable notes and separate rehearsals without changing the public curriculum.</p></div><Link className="button" href={`/system-design/problems${applicationSuffix}`}>Choose a design problem<ArrowRight size={15} /></Link></header>
    {state.application && <aside className="sd-practice-context"><strong>Preparing for {state.application.company_name}</strong><span>{state.application.role_title}</span><Link href="/system-design/practice">Clear context</Link></aside>}
    <section className="sd-practice-overview" aria-label="Saved System Design work">
      <article><strong>{state.attempts.length}</strong><span>Design attempts</span></article><article><strong>{state.attempts.filter((item) => item.status === "draft").length}</strong><span>Drafts to continue</span></article><article><strong>{progressRows.filter((item) => item.status === "review").length}</strong><span>Need review</span></article><article><strong>{progressRows.filter((item) => item.bookmarked).length}</strong><span>Bookmarked</span></article>
    </section>
    {continueTarget && <section className="sd-practice-resume"><FilePenLine size={19} /><div><strong>{continueTarget.title}</strong><span>{continueTarget.detail}{continueTarget.updatedAt ? ` · updated ${when(continueTarget.updatedAt)}` : ""}</span></div><Link href={`${continueTarget.href}${continueTarget.kind === "item" && continueTarget.itemType === "design_problem" ? applicationSuffix : ""}`}>{continueTarget.kind === "attempt" ? "Open attempt" : "Open item"}<ArrowRight size={14} /></Link></section>}
    <section className="sd-practice-attempt-list"><header><div><h2>Design attempt history</h2><p>Each rehearsal is independent and can carry optional application context.</p></div></header>{state.attempts.length ? <div>{state.attempts.slice(0, 12).map((attempt) => { const application = state.applications.find((item) => item.id === attempt.application_id); return <Link key={attempt.id} href={`/system-design/problems/${attempt.problem_id}/practice/${attempt.id}`}><span><strong>{attempt.title}</strong><small>{attempt.problem_id.replaceAll("-", " ")}{application ? ` · ${application.company_name}` : ""}</small></span><span>{attempt.status}{attempt.confidence ? ` · ${attempt.confidence}` : ""}</span><time dateTime={attempt.updated_at}>{when(attempt.updated_at)}</time><ArrowRight size={14} /></Link>; })}</div> : <p className="sd-attempt-empty">No saved attempts. Choose a public problem and start with a blank worksheet.</p>}</section>
    <section className="sd-practice-catalog"><header><div><h2>Concepts and design problems</h2><p>Statuses and confidence are self-reported. They are organizational aids, not readiness scores.</p></div><span>{filtered.length} results</span></header>
      <form className="sd-practice-filters">{state.application && <input type="hidden" name="application" value={state.application.id} />}<label>Search<input type="search" name="q" defaultValue={params.q} placeholder="Search the canonical catalog" /></label><label>Type<select name="kind" defaultValue={params.kind ?? ""}><option value="">All items</option><option>Concept</option><option>Design problem</option></select></label><label>Status<select name="status" defaultValue={params.status ?? ""}><option value="">All statuses</option><option value="not_started">Not started</option><option value="reviewed">Reviewed</option><option value="review">Needs review</option><option value="comfortable">Comfortable</option></select></label><label className="sd-bookmark-filter"><input type="checkbox" name="bookmarked" value="1" defaultChecked={Boolean(params.bookmarked)} /><Bookmark size={14} />Bookmarked</label><button className="button button-secondary button-sm"><Filter size={14} />Apply</button></form>
      <details className="sd-practice-topic-progress"><summary>Concept progress <span>Reviewed and comfortable are self-reported</span></summary><div>{topicProgress.map((topic) => <article key={topic.label}><strong>{topic.label}</strong><span>{topic.reviewed} / {topic.total} reviewed</span><small>{topic.comfortable} comfortable</small></article>)}</div></details>
      <div className="sd-practice-catalog-list">{filtered.slice(0, 80).map((item) => <article key={`${item.itemType}:${item.id}`}><div className="sd-practice-catalog-copy"><span>{item.kind} · {item.group}</span><h3><Link href={`${item.href}${item.kind === "Design problem" ? applicationSuffix : ""}`}>{item.title}</Link></h3><p>{item.description}</p></div><SystemDesignProgressEditor itemId={item.id} itemType={item.itemType} progress={state.progress[`${item.itemType}:${item.id}`] ?? null} latestHref={item.href} compact /></article>)}</div>
      {filtered.length > 80 && <p className="sd-practice-limit">Showing the first 80 matches. Narrow the catalog to reach a specific concept.</p>}
    </section>
  </div></div>;
}
