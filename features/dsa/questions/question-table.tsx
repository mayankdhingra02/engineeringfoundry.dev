"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { DSACompany, DSAInterviewQuestion } from "@/data/dsa/interview-prep";
import { QuickDsaBookmarkControl, QuickDsaStatusControl } from "@/features/dsa/progress/quick-progress-actions";
import type { DsaProgressMap } from "@/lib/dsa/progress";

function DifficultyBadge({ difficulty }: { difficulty: DSAInterviewQuestion["difficulty"] }) {
  return <span className={`dsa-difficulty ${difficulty.toLowerCase()}`}>{difficulty}</span>;
}

function CompanyCell({ question, companies, fixedCompanySlug, selectedCompanySlug }: { question: DSAInterviewQuestion; companies: ReadonlyMap<string, DSACompany>; fixedCompanySlug?: string; selectedCompanySlug?: string }) {
  const associations = fixedCompanySlug
    ? question.companies.filter((item) => item.companySlug === fixedCompanySlug)
    : selectedCompanySlug
      ? [...question.companies].sort((left, right) => Number(right.companySlug === selectedCompanySlug) - Number(left.companySlug === selectedCompanySlug))
      : question.companies;
  const names = associations.map((association) => companies.get(association.companySlug)).filter((company): company is DSACompany => Boolean(company));
  const visible = names.slice(0, 1); const remaining = names.slice(1);
  return <div className="dsa-browser-companies">{visible.map((company) => <Link href={`/dsa/companies/${company.slug}`} key={company.slug}>{company.name}</Link>)}{remaining.length > 0 && <span title={remaining.map((company) => company.name).join(", ")}>+{remaining.length}<span className="sr-only"> more: {remaining.map((company) => company.name).join(", ")}</span></span>}{!names.length && <span className="muted">No association</span>}</div>;
}

function TopicCell({ topics, onToggleTopic }: { topics: string[]; onToggleTopic: (topic: string) => void }) {
  const visible = topics.slice(0, 3); const remaining = topics.slice(3);
  return <div className="dsa-browser-topics">{visible.map((topic) => <button type="button" key={topic} onClick={() => onToggleTopic(topic)}>{topic}</button>)}{remaining.length > 0 && <span title={remaining.join(", ")}>+{remaining.length}<span className="sr-only"> more: {remaining.join(", ")}</span></span>}</div>;
}

function SourceCell({ question }: { question: DSAInterviewQuestion }) {
  const sources = question.sources.filter((source) => source.url && source.access !== "metadata-only");
  const primary = sources[0];
  if (!primary?.url) return <span className="muted">No public source</span>;
  return <div className="dsa-browser-sources"><a href={primary.url} target="_blank" rel="noopener noreferrer" aria-label={`${question.title} on ${primary.label} (opens in a new tab)`}>{primary.label}<ExternalLink size={12} aria-hidden="true" /></a>{sources.length > 1 && <span title={sources.slice(1).map((source) => source.label).join(", ")}>+{sources.length - 1}<span className="sr-only"> more public sources</span></span>}</div>;
}

function QuestionTitle({ question, applicationId, companySlug }: { question: DSAInterviewQuestion; applicationId?: string; companySlug?: string }) {
  const params = new URLSearchParams();
  if (companySlug) params.set("company", companySlug);
  if (applicationId) params.set("application", applicationId);
  const query = params.toString();
  return <Link className="dsa-browser-question-link" href={`/dsa/questions/${question.id}${query ? `?${query}` : ""}`}><strong>{question.title}</strong></Link>;
}

export function QuestionTable({ questions, companies, fixedCompanySlug, selectedCompanySlug, onToggleTopic, progress = {}, signedIn = false, accountPlatformAvailable, applicationId }: { questions: DSAInterviewQuestion[]; companies: DSACompany[]; fixedCompanySlug?: string; selectedCompanySlug?: string; onToggleTopic: (topic: string) => void; progress?: DsaProgressMap; signedIn?: boolean; accountPlatformAvailable: boolean; applicationId?: string }) {
  const companyMap = new Map(companies.map((company) => [company.slug, company]));
  return <div className="dsa-browser-table-wrap"><table className="dsa-browser-table"><thead><tr><th scope="col">Question</th><th scope="col">Progress</th><th scope="col">Company</th><th scope="col">Difficulty</th><th scope="col">Topics</th><th scope="col">Source</th></tr></thead><tbody>{questions.map((question) => { const row = progress[question.id]; const status = row?.status ?? "not_started"; return <tr key={question.id}>
    <th scope="row" data-label="Question"><QuestionTitle question={question} applicationId={applicationId} companySlug={fixedCompanySlug ?? selectedCompanySlug} />{question.isSample && <small>Demo company tag</small>}</th>
    <td data-label="Progress">{signedIn ? <div className="dsa-row-progress"><span className={`dsa-progress-status ${status}`}>{status.replace("_", " ")}</span><div><QuickDsaStatusControl questionId={question.id} status={status} compact /><QuickDsaBookmarkControl questionId={question.id} questionTitle={question.title} bookmarked={row?.bookmarked ?? false} /></div></div> : accountPlatformAvailable ? <Link className="dsa-signin-progress" href={`/signin?next=${encodeURIComponent("/dsa/questions")}`}>Sign in to track</Link> : <span>Account progress unavailable</span>}</td>
    <td data-label="Company"><CompanyCell question={question} companies={companyMap} fixedCompanySlug={fixedCompanySlug} selectedCompanySlug={selectedCompanySlug} /></td>
    <td data-label="Difficulty"><DifficultyBadge difficulty={question.difficulty} /></td>
    <td data-label="Topics"><TopicCell topics={question.topics} onToggleTopic={onToggleTopic} /></td>
    <td data-label="Source"><SourceCell question={question} /></td>
  </tr>; })}</tbody></table></div>;
}
