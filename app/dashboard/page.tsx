/*
THESIS: The dashboard is the candidate's next-interview control surface, not a generic KPI grid.
OWN-WORLD: Warm paper, flat white work surfaces, quiet rules, rust actions, and green completion states.
STORY: See the pipeline, identify the next interview or stale application, then open the exact record.
FIRST VIEWPORT: New accounts see one preference-aware start action; active accounts see compact summaries and the next interview.
FORM: Code-led extension of the established Operate workspace; the signature is a schedule that updates in the mutation roundtrip.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing, BookOpenText, Boxes, BriefcaseBusiness, CalendarDays, CircleAlert, Code2, Compass, Gift, Plus } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { PreparationCountsStatus } from "@/components/preparation-counts-status";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { attentionLabel, applicationNeedsAttention, isActiveApplication } from "@/lib/applications/insights";
import { formatCountdown, formatInterviewDate } from "@/lib/applications/format";
import { getDashboardPipeline } from "@/lib/applications/queries";
import { getReadyBehavioralStoryCount } from "@/lib/behavioral/queries";
import { getDsaDashboardSummary } from "@/lib/dsa/queries";
import { modulesForRound } from "@/lib/interview-preparation/model";
import { getPreparationCounts } from "@/lib/interview-preparation/queries";
import { getRoundReminderStates } from "@/lib/interview-calendar/queries";
import { getSystemDesignDashboardSummary } from "@/lib/system-design/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PrimaryPreparationFocus } from "@/lib/account/preferences";

export const metadata: Metadata = { title: "Dashboard", description: "Your private interview pipeline.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const badge = (value: string) => value.toLowerCase().replace(/[^a-z]+/g, "-");

function dsaPracticeHref(application: { id: string; company_slug: string | null }) {
  const params = new URLSearchParams({ application: application.id });
  if (application.company_slug) params.set("company", application.company_slug);
  return `/dsa/practice?${params.toString()}`;
}

const gettingStartedPaths: Record<PrimaryPreparationFocus, { title: string; description: string; href: string; action: string }> = {
  dsa: { title: "Begin with your DSA roadmap", description: "Use a level-aware path to choose the next pattern and problem without sorting the full library first.", href: "/dsa/roadmap", action: "Choose a DSA roadmap" },
  system_design: { title: "Start a System Design practice", description: "Open the private workspace, choose one real design prompt, and save your first attempt.", href: "/system-design/practice", action: "Open System Design practice" },
  behavioral: { title: "Build your first reusable story", description: "Capture one specific STAR example, then connect it to the questions it can support.", href: "/behavioral/stories/new", action: "Create a behavioral story" },
  applications: { title: "Add the role you’re pursuing", description: "Start with the company and role. Add interview rounds only when the process becomes clear.", href: "/applications/new", action: "Add an application" },
  unsure: { title: "Choose one preparation path", description: "The preparation hub gives you a calm overview of each track without committing you to one.", href: "/prepare", action: "Explore preparation paths" },
};

export default async function DashboardPage() {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const { user, profile } = await requireMemberProfile("/dashboard");
  const pipeline = await getDashboardPipeline(4);
  const behavioralRound = pipeline.upcoming.find((round) => modulesForRound(round.round_type).includes("behavioral"));
  const codingRound = pipeline.upcoming.find((round) => modulesForRound(round.round_type).includes("dsa"));
  const systemDesignRound = pipeline.upcoming.find((round) => modulesForRound(round.round_type).includes("system-design"));
  const supabase = await createSupabaseServerClient();
  const [readyStoryCount, dsaSummary, systemDesignSummary, preparationCounts, reminderStates, preferenceResult, storyCountResult] = await Promise.all([behavioralRound ? getReadyBehavioralStoryCount() : 0, getDsaDashboardSummary(), getSystemDesignDashboardSummary(), getPreparationCounts(pipeline.upcoming.map((round) => round.id)), getRoundReminderStates(pipeline.upcoming.map((round) => round.id)), supabase ? supabase.from("user_preparation_preferences").select("preferred_role_level,primary_preparation_focus").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }), supabase ? supabase.from("behavioral_stories").select("id", { count: "exact", head: true }).eq("user_id", user.id) : Promise.resolve({ count: 0 })]);
  const active = pipeline.applications.filter((application) => isActiveApplication(application.status)).length;
  const offers = pipeline.applications.filter((application) => ["Offer", "Accepted"].includes(application.status)).length;
  const attention = pipeline.applications.filter((application) => applicationNeedsAttention(application));
  const name = profile.display_name ?? profile.username ?? "Engineer";
  const preparationHasStarted = Boolean(
    pipeline.applications.length
    || (storyCountResult.count ?? 0)
    || (dsaSummary && (dsaSummary.completed || dsaSummary.attempted || dsaSummary.review))
    || (systemDesignSummary && (systemDesignSummary.practiced || systemDesignSummary.drafts || systemDesignSummary.review || systemDesignSummary.comfortable)),
  );
  const focus = (preferenceResult.data?.primary_preparation_focus ?? "unsure") as PrimaryPreparationFocus;
  const firstPath = gettingStartedPaths[focus];
  const summaries = [
    { label: "Active applications", value: active, icon: BriefcaseBusiness },
    { label: "Interviews scheduled", value: pipeline.scheduledCount, icon: CalendarDays },
    { label: "Offers", value: offers, icon: Gift },
    { label: "Need attention", value: attention.length, icon: CircleAlert },
  ];

  return <section className="member-dashboard"><div className="page-width member-dashboard-shell">
    <header className="member-dashboard-header"><div><h1>Your interview pipeline</h1><p>Keep applications moving and see the next preparation deadline without rebuilding context.</p></div><nav aria-label="Dashboard actions"><Link className="button button-secondary" href="/interview-playbook"><Compass size={15} />Playbook</Link><Link className="button button-secondary" href="/calendar"><CalendarDays size={15} />Calendar</Link><Link className="button button-secondary" href="/applications">All applications</Link><Link className="button" href="/applications/new"><Plus size={15} />Add application</Link></nav></header>
    {!preparationHasStarted ? <section className="dashboard-first-use"><div className="dashboard-first-use-primary"><span><Compass size={22} aria-hidden="true" /></span><div><h2>{firstPath.title}</h2><p>{firstPath.description}</p><Link className="button" href={firstPath.href}>{firstPath.action}<ArrowRight size={15} /></Link></div></div><nav aria-label="Other ways to begin"><Link href="/applications/new">Add an application</Link><Link href="/dsa/roadmap">Choose a DSA roadmap</Link><Link href="/behavioral/stories/new">Create a behavioral story</Link><Link href="/system-design/practice">Practice System Design</Link></nav></section> : <>
      <section className="pipeline-summary" aria-label="Interview pipeline overview">{summaries.map(({ label, value, icon: Icon }) => <article key={label}><span><Icon size={17} aria-hidden="true" /></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</section>
      <PreparationCountsStatus status={preparationCounts.status} />
      <section className="dashboard-upcoming"><div className="dashboard-upcoming-heading"><h2>Upcoming interviews</h2><Link href="/calendar">Open calendar<ArrowRight size={14} /></Link></div>{pipeline.upcoming.length ? <div className="dashboard-upcoming-list">{pipeline.upcoming.map((round) => { const count = preparationCounts.status === "ready" ? preparationCounts.counts.get(round.id) : undefined; const countText = preparationCounts.status === "unavailable" ? "Task count unavailable." : count ? `${count.completed}/${count.total} tasks` : "Start plan"; const reminders = reminderStates.get(round.id)?.filter((item) => item.status === "pending") ?? []; return <Link key={round.id} href={`/interviews/${round.id}/prepare`}><span className="member-dashboard-icon"><CalendarDays size={18} aria-hidden="true" /></span><div><strong>{round.application.company_name}</strong><p>{round.application.role_title} · {round.round_type}</p>{reminders.length > 0 && <small className="dashboard-reminder-state"><BellRing size={12} />{reminders.length} scheduled</small>}</div><div className="dashboard-upcoming-stage"><span className={`tracker-badge ${badge(round.application.status)}`}>{round.application.status}</span><small>{round.round_name}</small></div><time dateTime={round.scheduled_at ?? undefined}>{formatInterviewDate(round.scheduled_at, round.timezone)}</time><b>{formatCountdown(round.scheduled_at as string, round.timezone)}</b><span className="dashboard-prepare-action"><span>{countText}</span>Prepare<ArrowRight size={13} /></span></Link>; })}</div> : <div className="dashboard-upcoming-empty"><div><strong>No upcoming interviews scheduled</strong><p>Add a round when a company confirms the next step.</p></div><Link className="button button-secondary button-sm" href="/applications">View applications</Link></div>}</section>
      {behavioralRound && <aside className="dashboard-behavioral-cue"><BookOpenText size={19} aria-hidden="true" /><div><strong>Behavioral preparation for {behavioralRound.application.company_name}</strong><p>{readyStoryCount} content-complete {readyStoryCount === 1 ? "story" : "stories"} · {formatCountdown(behavioralRound.scheduled_at as string, behavioralRound.timezone)}</p></div><Link href={`/behavioral/workspace?application=${behavioralRound.application.id}`}>Review stories<ArrowRight size={14} /></Link></aside>}
      {codingRound && <aside className="dashboard-dsa-cue"><Code2 size={19} aria-hidden="true" /><div><strong>DSA preparation for {codingRound.application.company_name}</strong><p>{dsaSummary?.completed ?? 0} roadmap complete · {dsaSummary?.review ?? 0} need review · {formatCountdown(codingRound.scheduled_at as string, codingRound.timezone)}</p></div><Link href={dsaPracticeHref(codingRound.application)}>Continue practice<ArrowRight size={14} /></Link></aside>}
      {systemDesignRound && <aside className="dashboard-system-design-cue"><Boxes size={19} aria-hidden="true" /><div><strong>System Design for {systemDesignRound.application.company_name}</strong><p>{systemDesignSummary?.drafts ?? 0} drafts · {systemDesignSummary?.review ?? 0} concepts need review · {formatCountdown(systemDesignRound.scheduled_at as string, systemDesignRound.timezone)}</p></div><Link href={`/system-design/practice?application=${systemDesignRound.application.id}`}>Open workspace<ArrowRight size={14} /></Link></aside>}
      {dsaSummary && <section className="dashboard-dsa-summary"><div><span>DSA practice</span><strong>{dsaSummary.preferredRoadmap === "sde3plus" ? "SDE III+" : dsaSummary.preferredRoadmap.toUpperCase()} roadmap</strong><p>{dsaSummary.completed} / {dsaSummary.roadmapTotal} complete · {dsaSummary.attempted} attempted · {dsaSummary.review} need review</p></div><Link href="/dsa/practice">Open My Practice<ArrowRight size={14} /></Link></section>}
      {systemDesignSummary && <section className="dashboard-system-design-summary"><div><span>System Design practice</span><strong>{systemDesignSummary.practiced} practiced · {systemDesignSummary.drafts} drafts</strong><p>{systemDesignSummary.comfortable} comfortable · {systemDesignSummary.review} need review</p></div><Link href="/system-design/practice">Open My Practice<ArrowRight size={14} /></Link></section>}
      <section className="dashboard-attention"><div className="dashboard-upcoming-heading"><h2>Applications needing attention</h2><Link href="/applications?sort=updated">Review pipeline<ArrowRight size={14} /></Link></div>{attention.length ? <div className="dashboard-attention-list">{attention.slice(0, 4).map((application) => <Link key={application.id} href={`/applications/${application.id}`}><div><strong>{application.company_name}</strong><span>{application.role_title}</span></div><p>{attentionLabel(application)}</p><span className={`tracker-badge ${badge(application.status)}`}>{application.status}</span></Link>)}</div> : <p className="dashboard-attention-clear">Nothing is waiting beyond seven days. Your follow-up queue is clear.</p>}</section>
    </>}
    <footer className="member-dashboard-account"><div><strong>{name}</strong><span>@{profile.username} · {profile.is_public ? "Public profile" : "Private profile"}</span></div><p>Your application details and interview schedule are private to your account.</p></footer>
  </div></section>;
}
