"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Braces,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  ExternalLink,
  GitBranch,
  Globe2,
  Network,
  Route,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { companies } from "@/data/companies";
import type { CompanyGuideLevel, CompanyInterviewGuide, RoleGuide } from "@/data/company-guides/types";
import { EvidenceBadge } from "./evidence-badge";
import {
  CodingRoundFormatCard,
  DesignTrackSelector,
  GeographySelector,
  PracticalEngineeringCard,
  ProjectDeepDiveCard,
  QuestionStrategyCard,
  ReadinessScorecardCard,
} from "./company-guide-modules";
import { InterviewExecutionFramework } from "./interview-execution-framework";
import { CompanyQuestionBank } from "./question-bank";

const companyLevelOrder: Partial<Record<string, CompanyGuideLevel[]>> = {
  amazon: ["sde-i", "sde-ii", "sde-iii"],
  google: ["l3", "l4", "l5"],
  meta: ["e3", "e4", "e5"],
  walmart: ["early", "mid", "senior"],
};

const preparationJobs = [
  { id: "understand-loop", label: "Understand the loop", shortLabel: "Loop" },
  { id: "practice", label: "Practice", shortLabel: "Practice" },
  { id: "stories", label: "Build your stories", shortLabel: "Stories" },
  { id: "plan", label: "Make a plan", shortLabel: "Plan" },
] as const;

function GuideSection({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return <section className="company-guide-section" id={id}><div className="company-section-heading"><h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</section>;
}

function ReferencePanel({ id, title, summary, children, open = false }: { id?: string; title: string; summary: string; children: React.ReactNode; open?: boolean }) {
  return <details className="company-detail company-reference-panel" id={id} open={open}><summary><span><strong>{title}</strong><small>{summary}</small></span><ChevronDown size={17} aria-hidden="true" /></summary><div className="company-detail-body">{children}</div></details>;
}

function RoleLabel({ role, levelFirst = false, geography }: { role: RoleGuide; levelFirst?: boolean; geography?: string }) {
  return <span className="company-role-label"><b>{levelFirst ? `${role.level} · ${role.role}` : role.role}</b><small>{levelFirst ? role.careerStage : `${role.level} · ${role.careerStage}`}</small>{geography && role.geographyTitles?.[geography] && <em>{role.geographyTitles[geography]}</em>}</span>;
}

function ProcessPipeline({ role, compact = false }: { role: RoleGuide; compact?: boolean }) {
  return <ol className={`company-pipeline${compact ? " compact" : ""}${compact && role.process.length > 7 ? " long" : ""}`} aria-label={`${role.level} ${role.role} interview process`}>{role.process.map((stage, index) => <li key={`${stage.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{stage.title}</strong>{stage.detail && <small>{stage.detail}</small>}</div>{index < role.process.length - 1 && <ArrowRight size={15} aria-hidden="true" />}</li>)}</ol>;
}

function StoryWorkspace({ guide, role }: { guide: CompanyInterviewGuide; role: RoleGuide }) {
  const fields = guide.storyFields ?? ["Story title", "Situation", "Task", "Actions", "Alternatives considered", "Conflict", "Data / metrics", "Result", "Failure / learning", guide.behavioralTitle, "Scope / level evidence", "Likely follow-up questions"];
  return <ReferencePanel title="Open the behavioral story workspace" summary="Private, session-only planning surface"><div className="company-session-note"><ShieldCheck size={15} /><span>Nothing entered here is saved or submitted. Copy your notes before leaving or refreshing.</span></div><div className="company-story-fields">{fields.map((field, index) => <label key={field}><span>{field}</span>{index === 0 ? <input type="text" autoComplete="off" /> : <textarea rows={index >= 8 ? 3 : 2} />}</label>)}</div><p className="company-form-footnote">Use this as a thinking workspace, not a script. For {role.level}, test every story against the expected scope.</p></ReferencePanel>;
}

function Allocation({ role }: { role: RoleGuide }) {
  const priorities = [...role.preparationAllocation].sort((a, b) => b.value - a.value);
  return <div className="company-allocation"><ul aria-label={`${role.level} qualitative preparation priorities`}>{priorities.map((item, index) => <li key={item.label}><i data-index={index} />{item.label}<strong>{index === 0 ? "Primary emphasis" : index === 1 ? "Strong emphasis" : "Supporting emphasis"}</strong></li>)}</ul></div>;
}

function ResourceGroup({ guide, category }: { guide: CompanyInterviewGuide; category: string }) {
  const resources = guide.resources.filter((resource) => resource.category === category);
  if (!resources.length) return null;
  return <div className="company-resource-group"><h3>{category}</h3><div>{resources.map((resource) => <a href={resource.url} target={resource.url.startsWith("/") ? undefined : "_blank"} rel={resource.url.startsWith("/") ? undefined : "noreferrer"} key={resource.title}><span><strong>{resource.title}</strong><small>{resource.description}</small></span><EvidenceBadge kind={resource.evidence} compact company={guide.company} /><ExternalLink size={14} aria-hidden="true" /></a>)}</div></div>;
}

function FrameworkList({ items, compact = false }: { items: string[]; compact?: boolean }) {
  return <div className={`company-framework-list${compact ? " compact" : ""}`}>{items.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></div>)}</div>;
}

function PreparationPriorities({ role, company }: { role: RoleGuide; company: string }) {
  const priorities = [...role.preparationAllocation].sort((a, b) => b.value - a.value).slice(0, 3);
  return <div className="company-prep-priorities"><div className="company-prep-priority-heading"><div><h2>Prepare these first</h2><p>Qualitative Engineering Foundry recommendations for {role.level}. A later item is not an interview category you can automatically skip.</p></div><EvidenceBadge kind="recommendation" confidence="Medium" compact company={company} /></div><ol>{priorities.map((item, index) => <li key={item.label}><span>{index === 0 ? "Primary emphasis" : "Important"}</span><strong>{item.label}</strong><small>{index === 0 ? "Start here" : "Build after the core"}</small></li>)}</ol></div>;
}

export function CompanyGuideWorkspace({ guide, embedded = false }: { guide: CompanyInterviewGuide; embedded?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const validLevels = new Set(guide.roles.map((item) => item.id));
  const levelParam = searchParams.get("level") as CompanyGuideLevel | null;
  const selectedLevel = levelParam && validLevels.has(levelParam) ? levelParam : guide.defaultLevel;
  const role = guide.roles.find((item) => item.id === selectedLevel) ?? guide.roles[0];
  const validGeographies = new Set(guide.geographyContext?.options.map((item) => item.id) ?? []);
  const geographyParam = searchParams.get("geo");
  const selectedGeography = guide.geographyContext ? (geographyParam && validGeographies.has(geographyParam) ? geographyParam : guide.geographyContext.defaultId) : undefined;
  const geographyOption = guide.geographyContext?.options.find((item) => item.id === selectedGeography);
  const defaultPlan = guide.plans.find((plan) => plan.duration === "7 Days")?.duration ?? guide.plans[0].duration;
  const [planDuration, setPlanDuration] = useState<CompanyInterviewGuide["plans"][number]["duration"]>(defaultPlan);
  const [activeJob, setActiveJob] = useState<(typeof preparationJobs)[number]["id"]>("understand-loop");
  const guideIndexRef = useRef<HTMLDetailsElement>(null);
  const activePlan = guide.plans.find((plan) => plan.duration === planDuration) ?? guide.plans[0];
  const experiences = guide.experiences.filter((experience) => experience.level === selectedLevel).sort((a, b) => selectedGeography && selectedGeography !== "general" ? Number(b.geography === selectedGeography) - Number(a.geography === selectedGeography) : 0);
  const loopVariants = guide.loopVariants?.filter((loop) => loop.level === selectedLevel && (!selectedGeography || selectedGeography === "general" || !loop.geography || loop.geography === selectedGeography)) ?? [];
  const visibleQuestions = guide.questions.filter((question) => !selectedGeography || selectedGeography === "general" || !question.geography || question.geography === selectedGeography);
  const currentCompanySlug = companies.find((company) => company.slug === guide.slug)?.slug ?? guide.slug;
  const compactLevelFirst = Boolean(guide.levelFirst || guide.roles.every((item) => item.role === guide.roles[0]?.role));
  const fullGuideGroups = [
    { label: "Process", items: [
      ["overview", "Compare levels"],
      ...(guide.geographyContext ? [["geography", "Geography & titles"]] : []),
      ...(guide.postInterview ? [["post-interview", "After the loop"]] : []),
    ] },
    { label: "Practice", items: [
      ...(guide.codingRoundFormat ? [["coding-format", "Coding format"]] : []),
      ...(guide.codingExecution ? [["execution", "Coding environment"]] : []),
      ...(guide.codingTransformations ? [["company-style", `${guide.company}-style coding`]] : []),
      ["questions", "Reported questions"],
      ...(guide.questionStrategy ? [["question-strategy", "Question strategy"]] : []),
      ["design", "System design"], ["lld", "Practical design"],
      ...(guide.practicalEngineering ? [["practical-engineering", "Backend & practical"]] : []),
      ...(guide.projectDeepDive ? [["project-deep-dive", "Project deep dive"]] : []),
    ] },
    { label: "Evidence & reference", items: [
      ["experiences", "Candidate experiences"],
      ...(!embedded && guide.readiness ? [["readiness", "Practice transfer checklist"]] : []),
      ...(guide.specializedRoles ? [["specialized", "Specialized roles"]] : []),
      ["resources", "Resources"], ["sources", "Sources & confidence"],
    ] },
  ];

  const chooseLevel = (level: CompanyGuideLevel) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("level", level);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const chooseGeography = (geography: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("geo", geography);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const chooseCompany = (companySlug: string) => {
    const currentLevelIndex = guide.roles.findIndex((item) => item.id === selectedLevel);
    const targetLevel = companyLevelOrder[companySlug]?.[Math.max(0, currentLevelIndex)];
    router.push(targetLevel ? `/companies/${companySlug}?level=${targetLevel}` : `/companies/${companySlug}`);
  };

  useEffect(() => {
    let frame = 0;
    function updateActiveJob() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        let current: (typeof preparationJobs)[number]["id"] = preparationJobs[0].id;
        for (const job of preparationJobs) {
          const section = document.getElementById(job.id);
          if (section && section.getBoundingClientRect().top <= 132) current = job.id;
        }
        setActiveJob(current);
      });
    }
    updateActiveJob();
    window.addEventListener("scroll", updateActiveJob, { passive: true });
    window.addEventListener("resize", updateActiveJob);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveJob);
      window.removeEventListener("resize", updateActiveJob);
    };
  }, []);

  useEffect(() => {
    function closeIndexOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !guideIndexRef.current?.open) return;
      guideIndexRef.current.open = false;
      guideIndexRef.current.querySelector<HTMLElement>("summary")?.focus();
    }
    document.addEventListener("keydown", closeIndexOnEscape);
    return () => document.removeEventListener("keydown", closeIndexOnEscape);
  }, []);

  const closeGuideIndex = () => { if (guideIndexRef.current) guideIndexRef.current.open = false; };

  return <div className={`company-guide-shell${embedded ? " company-guide-embedded" : ""}`}>
    {!embedded && <header className="company-guide-hero">
      <div className="page-width company-guide-hero-inner">
        <div className="company-guide-brand" aria-hidden="true"><Building2 size={22} /><span>{guide.brandCode}</span></div>
        <div className="company-guide-hero-copy">
          <h1>{guide.company} interview guide</h1>
          <p>{guide.subtitle}</p>
          <div className="company-guide-meta"><span><Clock3 size={14} />Researched {guide.updatedAt}</span><span><Users size={14} />Viewing {role.level} · {role.careerStage}</span>{geographyOption && <span><Globe2 size={14} />{geographyOption.label}</span>}</div>
          <div id="levels" className="company-level-summary-grid" role="group" aria-label="Choose target level">{guide.roles.map((item) => <button type="button" className={item.id === selectedLevel ? "active" : ""} aria-label={`${item.role}, ${item.level}, ${item.careerStage}${item.id === selectedLevel ? ", selected" : ""}`} aria-pressed={item.id === selectedLevel} onClick={() => chooseLevel(item.id)} key={item.id}><span className={`company-level-quick-label${compactLevelFirst ? " level-first" : ""}`}><b>{compactLevelFirst ? item.level : item.role}</b><small>{compactLevelFirst ? item.role : item.level}</small><em>{item.careerStage}</em></span><span className="company-level-choice-state">{item.id === selectedLevel ? "Selected" : "Choose"}</span></button>)}</div>
        </div>
        <div className="company-guide-hero-actions">
          <label htmlFor="company-guide-switcher">Change company</label>
          <div className="company-guide-switcher-wrap"><select id="company-guide-switcher" value={currentCompanySlug} onChange={(event) => chooseCompany(event.target.value)}>{companies.map((company) => <option value={company.slug} key={company.slug}>{company.name}{company.guideStatus === "curating" ? " · Guide in progress" : ""}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div>
          <a className="button button-secondary company-official-link" href={guide.officialUrl} target="_blank" rel="noreferrer">{guide.officialLinkLabel ?? "Official company guide"}<ExternalLink size={14} /></a>
          <a className="button company-mobile-start" href="#practice">Review {role.level} practice priorities<ArrowRight size={15} /></a>
        </div>
      </div>
    </header>}

    {!embedded && <nav className="company-guide-nav" aria-label={`${guide.company} preparation jobs`}><div className="page-width">{preparationJobs.map((job) => <a href={`#${job.id}`} aria-current={activeJob === job.id ? "location" : undefined} key={job.id}><span>{job.label}</span><small>{job.shortLabel}</small></a>)}<details ref={guideIndexRef} className="company-guide-index"><summary><span>Full guide index</span><small>Guide</small><ChevronDown size={14} aria-hidden="true" /></summary><div>{fullGuideGroups.map((group) => <section className="company-guide-index-group" aria-label={group.label} key={group.label}><strong>{group.label}</strong>{group.items.map(([href, label]) => <a href={`#${href}`} key={href} onClick={closeGuideIndex}>{label}</a>)}</section>)}</div></details></div></nav>}

    <div className={embedded ? "company-guide-layout company-guide-embedded-layout" : "page-width company-guide-layout"}>
      <div className="company-guide-main">
        <div className="company-guide-brief">
          <div className="company-guide-brief-loop"><div className="company-prep-brief-heading"><div><h2>Your {role.level} interview brief</h2><p>{role.summary}</p></div><EvidenceBadge kind={role.processEvidence.kind} confidence={role.processEvidence.confidence} compact company={guide.company} /></div><ProcessPipeline role={role} compact /><p className="company-loop-caveat"><AlertTriangle size={15} />{guide.processDisclaimer}</p></div>
          <PreparationPriorities role={role} company={guide.company} />
          <div className="company-guide-next-action"><div><strong>Recommended next action</strong><span>Review the practice priorities, then open the best workspace for your selected level.</span></div><a className="button" href="#practice">Review {role.level} priorities<ArrowRight size={15} /></a><a className="text-link" href="#understand-loop">Review the full loop</a></div>
        </div>

        <GuideSection id="understand-loop" title={`Understand the ${guide.company} interview loop`} description={`This ${role.level} sequence is a supported planning baseline, not a promise that every team or location uses the same loop.`}>
          <div className="company-section-toolbar"><RoleLabel role={role} levelFirst={guide.levelFirst} geography={selectedGeography} /><EvidenceBadge kind={role.processEvidence.kind} confidence={role.processEvidence.confidence} company={guide.company} /></div>
          <ProcessPipeline role={role} />
          {role.processMetrics && <div className="company-metric-grid">{role.processMetrics.map((metric) => <article key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></article>)}</div>}
          <div className="company-reference-stack">
            <ReferencePanel id="overview" title="Compare every level" summary="Titles, experience signals, and preparation emphasis"><div className="company-table-wrap"><table className="company-comparison-table"><thead><tr><th>Dimension</th>{guide.comparison.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{guide.comparison.rows.map((row) => <tr key={row[0]}><th>{row[0]}</th>{row.slice(1).map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div><p className="company-table-note"><AlertTriangle size={14} />{guide.comparison.disclaimer}</p></ReferencePanel>
            {guide.geographyContext && selectedGeography && <ReferencePanel id="geography" title="Geography and title context" summary={`${geographyOption?.label ?? "General"} is currently selected`}><GeographySelector context={guide.geographyContext} selected={selectedGeography} onSelect={chooseGeography} /></ReferencePanel>}
            <ReferencePanel title="Process caveats and observed variants" summary={`${role.processNotes.length} interpretation notes${loopVariants.length ? ` · ${loopVariants.length} visible variant${loopVariants.length === 1 ? "" : "s"}` : ""}`}><div className="company-process-notes">{role.processNotes.map((note, index) => <article key={note}><span>{index + 1}</span><p>{note}</p></article>)}</div>{loopVariants.length > 0 && <div className="company-loop-variants">{loopVariants.map((loop) => <article key={loop.id}><header><span>{loop.baseline ? "Working baseline" : "Observed variant"}</span><EvidenceBadge kind={loop.evidence.kind} confidence={loop.evidence.confidence} compact company={guide.company} /></header><h3>{loop.title}</h3><div>{loop.stages.map((stage) => <span key={stage.title}>{stage.title}</span>)}</div>{loop.interviewsLabel && <strong>{loop.interviewsLabel}</strong>}{loop.note && <p>{loop.note}</p>}</article>)}</div>}</ReferencePanel>
          </div>
        </GuideSection>

        <GuideSection id="practice" title={`Practice what matters for ${role.level}`} description="Start with the priority map, then open the company-specific evidence and deeper practice modules you need.">
          <div className="company-topic-tiers">{role.codingTiers.map((tier, index) => <article key={tier.title}><span>{index === 0 ? "Must prepare" : index === 1 ? "Important" : "Useful if time permits"}<small>{tier.title}</small></span><div>{tier.topics.map((topic) => <b key={topic}>{topic}</b>)}</div></article>)}</div>
          <div className="company-callout recommendation"><Code2 size={18} /><div><EvidenceBadge kind="recommendation" compact company={guide.company} /><strong>Interview goal</strong><p>{role.codingGoal}</p></div></div>
          {role.codingNote && <div className="company-callout important"><Sparkles size={18} /><div><strong>Level calibration</strong><p>{role.codingNote}</p></div></div>}
          <div className="company-action-row"><Link className="button" href={`/dsa/practice?company=${guide.slug}`}>Practice DSA<ArrowRight size={15} /></Link>{role.hldLabel.toLowerCase().includes("not the primary") || role.hldLabel.toLowerCase().includes("low priority") ? null : <Link className="button button-secondary" href="/system-design/problems">Practice System Design<ArrowRight size={15} /></Link>}</div>
          <div className="company-reference-stack">
            {guide.codingRoundFormat && <ReferencePanel id="coding-format" title={`${guide.company} coding format`} summary="Timing, environment, and execution expectations"><CodingRoundFormatCard format={guide.codingRoundFormat} company={guide.company} /></ReferencePanel>}
            {guide.codingExecution && <ReferencePanel id="execution" title={guide.codingExecution.title} summary="Practice the interview environment, not only the algorithm"><InterviewExecutionFramework framework={guide.codingExecution} /></ReferencePanel>}
            {guide.codingTransformations && <ReferencePanel id="company-style" title={`${guide.company}-style coding transformations`} summary="Recognize familiar patterns after the story changes"><div className="company-transformation-grid">{guide.codingTransformations.map((item) => <article key={item.textbook}><div><span>Textbook</span><p>{item.textbook}</p></div><ArrowRight size={17} aria-hidden="true" /><div><span>{guide.company}-style</span><p>{item.companyStyle}</p></div></article>)}</div></ReferencePanel>}
            <ReferencePanel id="questions" title="Reported question patterns" summary={`${visibleQuestions.length} candidate-reported records available before filters`}><div className="company-intelligence"><GitBranch size={21} /><div><EvidenceBadge kind="candidate" confidence="Medium" company={guide.company} /><h3>High-signal {guide.company} coding patterns</h3><ol>{(guide.codingInsightPatterns ?? ["Graph traversal", "Trees", "Heaps", "Dynamic programming", "Practical modeling"]).map((item) => <li key={item}>{item}</li>)}</ol><p>Public report frequency is a preparation signal, not an interview probability.</p></div></div><CompanyQuestionBank key={`${selectedLevel}-${selectedGeography ?? "all"}`} questions={visibleQuestions} initialLevel={selectedLevel} roles={guide.roles} company={guide.company} levelFirst={guide.levelFirst} /></ReferencePanel>
            {guide.questionStrategy && <ReferencePanel id="question-strategy" title={guide.questionStrategy.title} summary="Use reported patterns without memorizing implementations"><QuestionStrategyCard strategy={guide.questionStrategy} /></ReferencePanel>}
            <ReferencePanel id="design" title={`System Design · ${role.hldLabel}`} summary={role.hldSummary}>{guide.designTracks && <DesignTrackSelector tracks={guide.designTracks} />}<div className="company-design-layout"><div>{guide.hldFramework.length > 15 ? <ReferencePanel title="Complete system-design framework" summary={`${guide.hldFramework.length} prompts from requirements through evolution`}><FrameworkList items={guide.hldFramework} /></ReferencePanel> : <FrameworkList items={guide.hldFramework} />}</div><aside><Network size={20} /><h3>Depth calibration</h3><p>{role.hldGuidance ?? role.hldSummary}</p><EvidenceBadge kind="recommendation" compact company={guide.company} /></aside></div>{guide.designQuestions && (guide.designQuestionLevels ? guide.designQuestionLevels.includes(selectedLevel) : selectedLevel !== "l3") && <div className="company-design-question-grid">{guide.designQuestions.map((item) => <article key={item.title}><header><h3>{item.title}</h3><EvidenceBadge kind={item.evidence.kind} confidence={item.evidence.confidence} compact company={guide.company} /></header>{item.detail && <p>{item.detail}</p>}<div>{item.themes.map((theme) => <span key={theme}>{theme}</span>)}</div></article>)}</div>}{guide.designPracticeDomains && <div className="company-practice-domains"><header><EvidenceBadge kind="recommendation" compact company={guide.company} /><div><h3>{guide.designPracticeDomains.title}</h3><p>{guide.designPracticeDomains.description}</p></div></header><div>{guide.designPracticeDomains.domains.map((domain) => <span key={domain}>{domain}</span>)}</div></div>}{guide.designWarning && <div className="company-design-warning"><AlertTriangle size={19} /><div><h3>{guide.designWarning.title}</h3><p><b>Bad:</b> {guide.designWarning.bad}</p><p><b>Better:</b> {guide.designWarning.better}</p><small>{guide.designWarning.text}</small></div></div>}<Link className="company-inline-link" href="/system-design/start-here/introduction">Open the System Design workspace<ArrowRight size={14} /></Link></ReferencePanel>
            <ReferencePanel id="lld" title="Practical design and LLD" summary="Model behavior before naming patterns"><div className="company-design-layout"><FrameworkList items={guide.lldFramework} compact /><aside><Braces size={20} /><h3>{role.lldExamplesTitle ?? `${role.level} reported examples`}</h3><ul>{role.lldExamples.map((example) => <li key={example}>{example}</li>)}</ul><EvidenceBadge kind={role.lldEvidence?.kind ?? "candidate"} confidence={role.lldEvidence?.confidence} compact company={guide.company} /></aside></div></ReferencePanel>
            {guide.practicalEngineering && <ReferencePanel id="practical-engineering" title={guide.practicalEngineering.title} summary="Backend and practical engineering tied to the job description"><PracticalEngineeringCard guide={guide.practicalEngineering} company={guide.company} /></ReferencePanel>}
          </div>
        </GuideSection>

        <GuideSection id="stories" title={`Build ${role.level} stories that survive follow-ups`} description={`${role.storyCount} is an Engineering Foundry planning target—not a company requirement.`}>
          <div className="company-lp-layout"><div><h3>{guide.behavioralTitle} themes</h3><div className="company-lp-grid">{guide.behavioralThemes.map((theme) => <span key={theme}>{theme}</span>)}</div></div><aside><EvidenceBadge kind="recommendation" confidence="Medium" company={guide.company} /><h3>{role.storyCount}</h3><p>Build reusable stories that demonstrate the right scope.</p><ul>{role.storyFocus.map((focus) => <li key={focus}>{focus}</li>)}</ul></aside></div>
          {role.storyWarning && <div className="company-callout caution"><AlertTriangle size={18} /><div><strong>Scope warning</strong><p>{role.storyWarning}</p></div></div>}
          {guide.projectDeepDive && guide.projectDeepDive.levels.includes(selectedLevel) && <ReferencePanel id="project-deep-dive" title="Prepare your project deep dives" summary={guide.projectDeepDive.description}><ProjectDeepDiveCard guide={guide.projectDeepDive} /></ReferencePanel>}
          <StoryWorkspace guide={guide} role={role} />
          <div className="company-two-up"><article><Scale size={19} /><h3>What changes at {role.level}?</h3><p>{role.successMessage}</p></article><article><CircleHelp size={19} /><h3>What evidence matters?</h3><p>Show decisions, alternatives, tradeoffs, measurable outcomes, and scope appropriate to {role.careerStage.toLowerCase()} work.</p></article></div>
          <Link className="company-inline-link" href="/behavioral">Open the full Behavioral workspace<ArrowRight size={14} /></Link>
        </GuideSection>

        <GuideSection id="plan" title={`Make a ${planDuration.toLowerCase()} plan for ${role.level}`} description="Choose a preparation window. The sequence summarizes this guide’s existing research; it is not an official company schedule.">
          <div className="company-section-toolbar"><EvidenceBadge kind="recommendation" confidence="Medium" company={guide.company} /><span className="company-toolbar-note">Not an official {guide.company} weighting</span></div>
          <Allocation role={role} />
          {role.allocationNote && <p className="company-table-note"><AlertTriangle size={14} />{role.allocationNote}</p>}
          <div className="company-plan-tabs" role="group" aria-label="Preparation duration">{guide.plans.map((plan) => <button type="button" aria-pressed={plan.duration === planDuration} className={plan.duration === planDuration ? "active" : ""} onClick={() => setPlanDuration(plan.duration)} key={plan.duration}>{plan.duration}</button>)}</div>
          <div className="company-plan-panel"><div><span>{activePlan.duration}</span><h3>{role.level} preparation sequence</h3><p>{role.successMessage}</p></div><ol>{(activePlan.byLevel[selectedLevel] ?? []).map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ol></div>
          <div className="company-reference-stack">{role.mockGuidance && <ReferencePanel title="Mock interview strategy" summary="Engineering Foundry suggested targets"><ul className="company-check-grid">{role.mockGuidance.map((item) => <li key={item}><CheckCircle2 size={14} />{item}</li>)}</ul></ReferencePanel>}{guide.errorTaxonomy && <ReferencePanel title="Practice error log" summary="Track why you failed, not only whether you solved it"><div className="company-error-taxonomy">{guide.errorTaxonomy.map((item) => <span key={item}>{item}</span>)}</div></ReferencePanel>}<ReferencePanel title={`Success signals and failure modes for ${role.level}`} summary="Use these as a final preparation check"><div className="company-two-up"><article><Target size={19} /><h3>Success signal</h3><p>{role.successMessage}</p></article><article><AlertTriangle size={19} /><h3>Common failure modes</h3><ul>{role.failureModes.map((item) => <li key={item}>{item}</li>)}</ul></article></div></ReferencePanel></div>
          <Link className="company-inline-link" href="/mock-interviews">Open the Mock Interview Lab<ArrowRight size={14} /></Link>
        </GuideSection>

        <GuideSection id="full-guide" title="Full guide and research reference" description="Open only the deeper evidence, edge cases, and supporting material you need. Nothing has been removed.">
          <div className="company-reference-stack">
            <ReferencePanel id="experiences" title="Recent candidate experiences" summary={`${experiences.length} ${role.level} report${experiences.length === 1 ? "" : "s"} in the current context`}><div className="company-experience-grid">{experiences.map((experience) => <article key={experience.id}><header><div><span>{experience.approximateDate ?? experience.year}{experience.location ? ` · ${experience.location}` : ""}</span><h3>{experience.title}</h3></div><EvidenceBadge kind="candidate" confidence={experience.confidence} compact company={guide.company} /></header><div className="company-experience-facts"><span><b>Result</b>{experience.result}</span>{experience.environment && <span><b>Environment</b>{experience.environment}</span>}{experience.yearsExperience && <span><b>Experience</b>{experience.yearsExperience}</span>}</div><details><summary>Rounds and topics<ChevronDown size={15} /></summary><div><strong>Sequence</strong><ul>{experience.sequence.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul><strong>Reported topics</strong><ul>{experience.topics.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>{experience.note && <p>{experience.note}</p>}</div></details>{experience.sourceUrl ? <a href={experience.sourceUrl} target="_blank" rel="noreferrer">Open source report<ExternalLink size={12} /></a> : <span className="company-source-pending">Candidate report · Source URL pending</span>}</article>)}</div></ReferencePanel>
            {!embedded && guide.readiness && <ReferencePanel id="readiness" title="Practice transfer checklist" summary="Check whether practice transfers under pressure"><ReadinessScorecardCard scorecard={guide.readiness} level={selectedLevel} /></ReferencePanel>}
            {guide.postInterview && <ReferencePanel id="post-interview" title={guide.postInterview.title} summary={guide.postInterview.description}><div className="company-post-interview"><div>{guide.postInterview.stages.map((stage, index) => <span key={stage}><b>{String(index + 1).padStart(2, "0")}</b>{stage}</span>)}</div><aside><Route size={19} /><h3>Can {guide.company} ask for another interview?</h3><p>{guide.postInterview.reround}</p></aside></div></ReferencePanel>}
            {guide.specializedRoles && <ReferencePanel id="specialized" title={guide.specializedRoles.title} summary={guide.specializedRoles.description}><div className="company-specialized-model"><strong>{guide.specializedRoles.model}</strong><div>{guide.specializedRoles.roles.map((item) => <span key={item}>{item}</span>)}</div></div>{guide.watchItems?.map((item) => <div className="company-callout caution" key={item.title}><Sparkles size={18} /><div><EvidenceBadge kind={item.evidence.kind} confidence={item.evidence.confidence} compact company={guide.company} /><strong>Current watch item · {item.title}</strong><p>{item.text}</p></div></div>)}</ReferencePanel>}
            <ReferencePanel id="resources" title="Resources" summary="Official material first, followed by clearly labeled practice resources"><div className="company-resource-groups">{guide.resourceCategories.map((category) => <ResourceGroup guide={guide} category={category} key={category} />)}</div>{guide.systemsReading && <div className="company-systems-reading">{guide.systemsReading.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.title}><span><strong>{item.title}</strong><small>{item.lesson}</small></span><ExternalLink size={14} /></a>)}</div>}</ReferencePanel>
            <ReferencePanel id="sources" title="Sources and confidence" summary={`Research reviewed ${guide.updatedAt}; confidence describes evidence, not interview probability`}><div className="company-confidence-grid">{guide.sourceNotes.map((item) => <article key={item.title}><EvidenceBadge kind={item.kind} confidence={item.confidence} company={guide.company} /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div><ReferencePanel title="Confidence scale" summary="From current official sources to isolated reports"><ul className="company-confidence-list"><li><b>Very High</b>Current official company documentation</li><li><b>High</b>Official material or multiple consistent recent reports</li><li><b>Medium</b>Multiple consistent candidate reports with meaningful variation</li><li><b>Low–Medium</b>A recent individual report or limited reporting</li><li><b>Low</b>Emerging, isolated, or difficult-to-verify claims</li></ul></ReferencePanel><p className="company-research-note"><BookOpenCheck size={15} />Research review: {guide.updatedAt}. Re-check recruiter instructions and the job listing because role-specific guidance takes precedence.</p><p className="company-research-note"><ShieldCheck size={15} />Engineering Foundry is not affiliated with or endorsed by {guide.company}. Official information, candidate reports, and preparation recommendations remain visibly distinct.</p></ReferencePanel>
          </div>
        </GuideSection>
      </div>
    </div>
  </div>;
}
