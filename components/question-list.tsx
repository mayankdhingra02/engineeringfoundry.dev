import Link from "next/link";
import type { DsaQuestion } from "@/types";
import { ExternalQuestionLink } from "@/components/external-question-link";
import { VerificationLabel } from "@/components/verification-label";
import { StatusPill } from "@/components/page-shell";
import { patternBySlug, topicBySlug } from "@/data/dsa";

export function QuestionList({ questions, emptyTitle = "No questions match these filters", emptyText = "Try clearing a filter or choosing another roadmap area." }: { questions: DsaQuestion[]; emptyTitle?: string; emptyText?: string }) {
  if (!questions.length) return <div className="empty-inline question-empty"><strong>{emptyTitle}</strong><span>{emptyText}</span></div>;

  return <ol className="question-list" aria-label="DSA practice questions">{questions.map((question) => <li className="question-card" key={question.id}>
    <div className="question-card-main">
      <div className="question-card-heading"><span className="source-mark">{question.source.name}</span><VerificationLabel status={question.verification} original={question.isOriginal} /></div>
      <h3>{question.title}</h3>
      <p>{question.note}</p>
      <div className="question-taxonomy" aria-label="Question topics and patterns">
        {question.topics.map((slug) => <Link className="tag" href={`/dsa/${slug}`} key={slug}>{topicBySlug.get(slug)?.name ?? slug}</Link>)}
        {question.patterns.map((slug) => <span className="tag tag-pattern" key={slug}>{patternBySlug.get(slug)?.name ?? slug}</span>)}
      </div>
      {question.originalPrompt && <details className="original-prompt"><summary>Read original prompt</summary><p>{question.originalPrompt}</p></details>}
    </div>
    <div className="question-card-meta">
      <StatusPill tone={question.difficulty === "Easy" ? "success" : question.difficulty === "Hard" ? "danger" : "warning"}>{question.difficulty}</StatusPill>
      <span>{question.isFree ? "Free / public" : "External"}</span>
      {question.lastVerifiedAt && <span>Checked {question.lastVerifiedAt}</span>}
      {question.companyAssociations.length > 0 && <span>{question.companyAssociations.length} sourced {question.companyAssociations.length === 1 ? "association" : "associations"}</span>}
      <ExternalQuestionLink question={question} />
    </div>
  </li>)}</ol>;
}
