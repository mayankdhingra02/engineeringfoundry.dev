import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, CircleAlert, Gift, Plus, Search } from "lucide-react";
import { AccountUnavailable } from "@/components/account-unavailable";
import { RevisionConfirmAction } from "@/features/applications/revision-confirm-action";
import { StatusForm } from "@/features/applications/status-form";
import { deleteApplicationAction, updateApplicationStatusAction } from "@/features/applications/actions";
import { isAccountPlatformAvailable } from "@/lib/account-platform";
import { requireMemberProfile } from "@/lib/auth/guards";
import { APPLICATION_STATUSES } from "@/lib/applications/options";
import { applicationNeedsAttention, isActiveApplication, roundProgress } from "@/lib/applications/insights";
import { formatApplicationDate, formatInterviewDate } from "@/lib/applications/format";
import { getApplications, upcomingRounds, type ApplicationWithRounds } from "@/lib/applications/queries";

export const metadata: Metadata = { title: "Applications", description: "Private application and interview tracker.", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
const badge = (value: string) => value.toLowerCase().replace(/[^a-z]+/g, "-");

function nextRound(application: ApplicationWithRounds) {
  return upcomingRounds([application], 1)[0]?.round ?? null;
}

export default async function ApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
  if (!isAccountPlatformAvailable()) return <AccountUnavailable />;
  const [, params] = await Promise.all([requireMemberProfile("/applications"), searchParams]);
  const applications = await getApplications();
  const query = one(params.q).trim().toLowerCase();
  const status = one(params.status);
  const company = one(params.company);
  const level = one(params.level);
  const sort = one(params.sort) || "updated";
  let visible = applications.filter((application) => (!query || `${application.company_name} ${application.role_title}`.toLowerCase().includes(query)) && (!status || application.status === status) && (!company || application.company_name === company) && (!level || application.role_level === level));
  visible = [...visible].sort((a, b) => {
    if (sort === "company") return a.company_name.localeCompare(b.company_name);
    if (sort === "application-date") return (b.application_date ?? "").localeCompare(a.application_date ?? "");
    if (sort === "next-interview") return (nextRound(a)?.scheduled_at ?? "9999").localeCompare(nextRound(b)?.scheduled_at ?? "9999");
    return b.updated_at.localeCompare(a.updated_at);
  });
  const now = new Date();
  const upcoming = upcomingRounds(applications, 100, now).length;
  const summaries = [
    { label: "Active applications", value: applications.filter((item) => isActiveApplication(item.status)).length, icon: BriefcaseBusiness },
    { label: "Interviews scheduled", value: upcoming, icon: CalendarDays },
    { label: "Offers", value: applications.filter((item) => ["Offer", "Accepted"].includes(item.status)).length, icon: Gift },
    { label: "Need attention", value: applications.filter((item) => applicationNeedsAttention(item, now)).length, icon: CircleAlert },
  ];
  const companies = Array.from(new Set(applications.map((item) => item.company_name))).sort();
  const levels = Array.from(new Set(applications.map((item) => item.role_level).filter(Boolean) as string[])).sort();

  return <div className="tracker-workspace"><div className="page-width tracker-shell">
    <header className="tracker-header"><div><h1>Applications</h1><p>Track companies, interview stages, upcoming rounds, and outcomes.</p></div><Link className="button" href="/applications/new"><Plus size={16} />Add application</Link></header>
    <section className="tracker-summary" aria-label="Application pipeline overview">{summaries.map(({ label, value, icon: Icon }) => <article key={label}><span><Icon size={17} aria-hidden="true" /></span><div><strong>{value}</strong><p>{label}</p></div></article>)}</section>
    {applications.length ? <>
      <form className="tracker-filters" method="get"><label className="tracker-search"><span>Search</span><span><Search size={15} /><input name="q" defaultValue={one(params.q)} placeholder="Company or role" /></span></label><label><span>Status</span><select name="status" defaultValue={status}><option value="">All statuses</option>{APPLICATION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Company</span><select name="company" defaultValue={company}><option value="">All companies</option>{companies.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Level</span><select name="level" defaultValue={level}><option value="">All levels</option>{levels.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Sort</span><select name="sort" defaultValue={sort}><option value="updated">Recently updated</option><option value="application-date">Application date</option><option value="next-interview">Next interview</option><option value="company">Company</option></select></label><button className="button button-secondary button-sm" type="submit">Apply filters</button><Link href="/applications">Reset</Link></form>
      <p className="tracker-results" role="status" aria-live="polite">Showing {visible.length} of {applications.length} application{applications.length === 1 ? "" : "s"}</p>
      <div className="tracker-table-wrap"><table className="tracker-table"><thead><tr><th>Company</th><th>Role</th><th>Progress</th><th>Next interview</th><th>Applied</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((application) => {
        const next = nextRound(application);
        const progress = roundProgress(application.interview_rounds);
        const statusAction = updateApplicationStatusAction.bind(null, application.id);
        const deleteAction = deleteApplicationAction.bind(null, application.id, application.updated_at);
        return <tr key={application.id}><td><Link href={`/applications/${application.id}`}><strong>{application.company_name}</strong></Link></td><td>{application.role_title}<small>{application.role_level || "Level not added"}</small></td><td>{progress.label}</td><td>{next ? `${next.round_type} · ${formatInterviewDate(next.scheduled_at, next.timezone)}` : "Nothing scheduled"}</td><td>{formatApplicationDate(application.application_date)}</td><td><StatusForm id={`${application.id}-table`} status={application.status} action={statusAction} compact /></td><td><div className="tracker-row-actions"><Link href={`/applications/${application.id}`}>Open</Link><Link href={`/applications/${application.id}/edit`}>Edit</Link><RevisionConfirmAction action={deleteAction} label="Delete" latestHref={`/applications/${application.id}`} /></div></td></tr>;
      })}</tbody></table></div>
      <div className="tracker-mobile-list">{visible.map((application) => { const next = nextRound(application); const progress = roundProgress(application.interview_rounds); const statusAction = updateApplicationStatusAction.bind(null, application.id); const deleteAction = deleteApplicationAction.bind(null, application.id, application.updated_at); return <article key={application.id}><div className="tracker-mobile-heading"><div><Link href={`/applications/${application.id}`}>{application.company_name}</Link><span>{application.role_title}{application.role_level ? ` · ${application.role_level}` : ""}</span></div><span className={`tracker-badge ${badge(application.status)}`}>{application.status}</span></div><dl><div><dt>Next interview</dt><dd>{next ? `${next.round_type} · ${formatInterviewDate(next.scheduled_at, next.timezone)}` : "Nothing scheduled"}</dd></div><div><dt>Progress</dt><dd>{progress.label}</dd></div><div><dt>Applied</dt><dd>{formatApplicationDate(application.application_date)}</dd></div></dl><StatusForm id={application.id} status={application.status} action={statusAction} compact /><div className="tracker-mobile-actions"><Link href={`/applications/${application.id}`}>Open</Link><Link href={`/applications/${application.id}/edit`}>Edit</Link><RevisionConfirmAction action={deleteAction} label="Delete" latestHref={`/applications/${application.id}`} /></div></article>; })}</div>
      {!visible.length && <div className="tracker-empty compact"><Search size={22} /><h2>No matching applications</h2><p>Try broadening the search or resetting your filters.</p><Link className="button button-secondary" href="/applications">Reset filters</Link></div>}
    </> : <section className="tracker-empty"><span className="icon-well"><BriefcaseBusiness size={22} /></span><h2>Track your first interview process</h2><p>Add a company you&apos;re applying to and keep every interview round organized in one place.</p><Link className="button" href="/applications/new"><Plus size={16} />Add application</Link></section>}
  </div></div>;
}
