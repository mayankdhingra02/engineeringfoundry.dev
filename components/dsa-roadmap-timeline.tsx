import Link from "next/link";
import { ArrowRight, CheckSquare, CircleAlert, Clock3, Target } from "lucide-react";
import type { DSARoadmap } from "@/data/dsa/roadmaps";
import { DSANote } from "@/components/dsa-learning";

export function RoadmapTimeline({ roadmap }: { roadmap: DSARoadmap }) {
  return <>
    <div className="dsa-roadmap-summary"><div><Target size={17} /><span>Goal</span><strong>{roadmap.description}</strong></div><div><Clock3 size={17} /><span>Time commitment</span><strong>{roadmap.timeCommitment}</strong></div><div><CheckSquare size={17} /><span>Progress</span><strong>Available when account progress is connected</strong></div></div>
    <DSANote title="Planning guidance"><p>{roadmap.revisionNote}</p></DSANote>
    <ol className="dsa-roadmap-timeline">{roadmap.phases.map((phase, index) => <li key={phase.id}><div className="dsa-roadmap-marker"><span>{index + 1}</span></div><article><div className="dsa-roadmap-phase-heading"><div><span>{phase.days}</span><h2 id={phase.id}>{phase.title}<a className="sd-heading-anchor" href={`#${phase.id}`} aria-label={`Link to ${phase.title}`}>#</a></h2></div>{phase.targetProblems && <small>Planning target: {phase.targetProblems} reviewed problems</small>}</div><p>{phase.summary}</p><div className="dsa-roadmap-phase-grid"><div><h3>Goals</h3><ul>{phase.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul></div><div><h3>Focus</h3><div className="tag-list">{phase.topics.map((topic) => <span className="tag" key={topic}>{topic}</span>)}</div>{phase.recommendedPatterns && <p className="dsa-pattern-note">Patterns: {phase.recommendedPatterns.join(" · ")}</p>}</div></div><div className="dsa-roadmap-tasks" aria-label={`${phase.title} tasks`}>{phase.tasks.map((task) => task.href ? <Link href={task.href} key={task.id}><span aria-hidden="true" />{task.label}<ArrowRight size={13} /></Link> : <div key={task.id}><span aria-hidden="true" />{task.label}</div>)}</div></article></li>)}</ol>
  </>;
}

export function RoadmapComingSoon({ roadmap }: { roadmap: DSARoadmap }) {
  return <section className="sd-coming-soon"><span><CircleAlert size={18} />Roadmap route ready</span><h2>{roadmap.role} — {roadmap.durationDays} days is awaiting editorial review.</h2><p>The role and duration route is live, but its tasks have not been filled with generic or unsupported prescriptions. Use the published <Link href="/dsa/roadmaps/sde-2/60-day">SDE II 60-day roadmap</Link> to preview the reusable timeline.</p><DSANote tone="important" title="No fake progress"><p>Progress is intentionally absent until persistent user state is connected.</p></DSANote></section>;
}
