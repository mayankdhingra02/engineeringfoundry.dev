import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { BehavioralWorkspaceHeader } from "@/features/behavioral/workspace-header";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { BEHAVIORAL_CATEGORIES } from "@/lib/behavioral/catalog";
import { getBehavioralWorkspaceData, linkMatchesQuestion, preparationStatus, preparationStatusLabel } from "@/lib/behavioral/queries";
import { normalizeCompanySlug, TRACKER_COMPANIES } from "@/lib/applications/options";

export const metadata: Metadata = { title: "Behavioral questions", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BehavioralQuestionsPage({ searchParams }: { searchParams: Promise<{ application?: string; q?: string; category?: string; company?: string; coverage?: string; preparation?: string; source?: string }> }) {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  await requireMemberProfile("/behavioral/questions"); const params = await searchParams; const data = await getBehavioralWorkspaceData(); const q = params.q?.trim().toLowerCase() ?? "";
  const companyOptions = Array.from(new Map([...data.applications.map((application) => [application.company_slug, application.company_name] as const), ...TRACKER_COMPANIES.map((name) => [normalizeCompanySlug(name), name] as const)].filter(([slug]) => slug)).entries());
  const questions = data.questions.filter((question) => {
    const status = preparationStatus(question, data);
    const coverageMatches = !params.coverage || (params.coverage === "Covered" ? status !== "Not started" : params.coverage === "Needs story" ? status === "Not started" : true);
    return (!q || `${question.prompt} ${question.category} ${question.description ?? ""}`.toLowerCase().includes(q)) && (!params.category || question.category === params.category) && (!params.source || question.source === params.source) && (!params.company || question.source === "curated" || question.companySlug === params.company || data.answers.some((answer) => answer.company_slug === params.company && answer.custom_question_id === question.id)) && coverageMatches && (!params.preparation || status === params.preparation);
  });
  const context = new URLSearchParams(); if (params.company) context.set("company", params.company); if (params.application) context.set("application", params.application); const contextSuffix = context.size ? `?${context}` : "";
  return <div className="behavioral-workspace"><div className="page-width"><BehavioralWorkspaceHeader title="Question library" description="Search curated prompts and your private questions, then connect reusable stories or save question-specific framing." />
    <div className="behavioral-toolbar"><form className="behavioral-filters">{params.application && <input type="hidden" name="application" value={params.application} />}<div><label htmlFor="question-search">Search</label><input id="question-search" name="q" type="search" defaultValue={params.q} placeholder="Search questions and guidance" /></div><div><label htmlFor="question-category-filter">Category</label><select id="question-category-filter" name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{BEHAVIORAL_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div><div><label htmlFor="question-company-filter">Company</label><select id="question-company-filter" name="company" defaultValue={params.company ?? ""}><option value="">Any company</option>{companyOptions.map(([slug, name]) => <option key={slug as string} value={slug as string}>{name}</option>)}</select></div><div><label htmlFor="question-source-filter">Source</label><select id="question-source-filter" name="source" defaultValue={params.source ?? ""}><option value="">Curated + mine</option><option value="curated">Curated</option><option value="custom">Mine</option></select></div><div><label htmlFor="question-coverage-filter">Coverage</label><select id="question-coverage-filter" name="coverage" defaultValue={params.coverage ?? ""}><option value="">All</option><option>Covered</option><option>Needs story</option></select></div><button className="button button-secondary button-sm">Apply</button></form><Link className="button button-sm" href="/behavioral/questions/new"><Plus size={15} />Add your own</Link></div>
    <p className="behavioral-results-count" aria-live="polite">{questions.length} question{questions.length === 1 ? "" : "s"}</p>
    {questions.length ? <section className="behavioral-question-list">{questions.map((question) => { const status = preparationStatus(question, data); const linked = data.links.filter((link) => linkMatchesQuestion(link, question)).length; return <article key={`${question.source}-${question.id}`}><div className="behavioral-card-meta"><span>{question.category}</span><span>{question.source === "curated" ? "Engineering Foundry" : "Your question"}</span>{question.companySlug && <span>{question.companySlug.replaceAll("-", " ")}</span>}</div><h2>{question.prompt}</h2><div className="behavioral-card-footer"><div><span className={`behavioral-status status-${status.toLowerCase().replaceAll(" ", "-")}`}>{preparationStatusLabel(status)}</span><small>{linked} linked {linked === 1 ? "story" : "stories"}</small></div><Link href={`/behavioral/questions/${question.id}${contextSuffix}`}>Open<ArrowRight size={14} /></Link></div></article>; })}</section> : <div className="tracker-empty"><h2>No questions match</h2><p>Clear a filter or add the exact prompt you were asked.</p><Link className="button button-secondary button-sm" href={`/behavioral/questions${contextSuffix}`}>Clear filters</Link></div>}
  </div></div>;
}
