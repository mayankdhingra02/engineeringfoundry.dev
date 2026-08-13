"use client";

import { ExternalLink } from "lucide-react";
import type { DsaQuestion } from "@/types";
import { track } from "@/lib/analytics";

export function ExternalQuestionLink({ question, className = "question-open" }: { question: DsaQuestion; className?: string }) {
  if (!question.externalUrl) return null;
  const host = new URL(question.externalUrl).hostname;
  return <a className={className} href={question.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${question.title} on ${question.source.name} in a new tab`} onClick={() => { track("dsa_question_clicked", { question_id: question.id, source: question.source.platform, difficulty: question.difficulty, primary_topic: question.topics[0], external_host: host }); track("verification_source_opened", { content_type: "dsa_question", content_id: question.id, source: question.source.platform, external_host: host }); }}>Open on {question.source.name}<ExternalLink size={14} aria-hidden="true" /></a>;
}
