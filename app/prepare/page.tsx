import Link from "next/link";
import { ArrowRight, Binary, BookOpenCheck, BrainCircuit, Building2, CheckCircle2, MessagesSquare, Network } from "lucide-react";
import { SectionHeading } from "@/components/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Engineering Interview Preparation Tracks",
  description: "Choose a focused preparation track for coding interviews, System Design, company interviews, ML System Design, behavioral interviews, or interview execution.",
  path: "/prepare",
});

const preparationTracks = [
  {
    index: "01",
    icon: Binary,
    title: "DSA & Coding Interviews",
    description: "Build pattern recognition, practice interview questions, and follow a focused roadmap for coding rounds.",
    href: "/dsa",
    cta: "Prepare for coding interviews",
    highlights: ["Core patterns", "Question database", "Role-based roadmaps"],
  },
  {
    index: "02",
    icon: Network,
    title: "System Design",
    description: "Learn architecture fundamentals, reason through tradeoffs, and practice complete system design problems.",
    href: "/system-design/start-here/introduction",
    cta: "Prepare for System Design",
    highlights: ["Fundamentals", "Design patterns", "Practice problems"],
  },
  {
    index: "03",
    icon: Building2,
    title: "Company Interview Guides",
    description: "Translate a target company and level into a focused loop, practice priorities, story work, and preparation plan.",
    href: "/companies",
    cta: "Choose a company guide",
    highlights: ["Level context", "Reported evidence", "Focused plans"],
  },
  {
    index: "04",
    icon: BrainCircuit,
    title: "ML System Design",
    description: "Connect product goals to data, training, evaluation, serving, monitoring, and feedback loops.",
    href: "/ml-design",
    cta: "Prepare for ML Design",
    highlights: ["ML architecture", "Evaluation", "Production systems"],
  },
  {
    index: "05",
    icon: MessagesSquare,
    title: "Behavioral Interviews",
    description: "Develop concise evidence-based stories about impact, leadership, judgment, and collaboration.",
    href: "/behavioral",
    cta: "Prepare behavioral stories",
    highlights: ["Story frameworks", "Practice prompts", "Self-review"],
  },
  {
    index: "06",
    icon: BookOpenCheck,
    title: "Interview Execution Guide",
    description: "Learn how to clarify, communicate, recover, validate, and close during common software-engineering interview rounds.",
    href: "/interview-tips",
    cta: "Open the execution guide",
    highlights: ["Round execution", "Recovery and validation", "Final-preparation checklists"],
  },
] as const;

export default function PreparePage() {
  return (
    <section className="section prepare-hub-section">
      <div className="page-width">
        <SectionHeading
          level={1}
          eyebrow="Choose a track"
          title="Start with the interview in front of you."
          description="Each track has its own roadmap, focused material, and practice workflow. Pick one now—you can move between tracks at any time."
        />
        <div className="prepare-track-grid" role="list">
          {preparationTracks.map(({ index, icon: Icon, title, description, href, cta, highlights }) => (
            <Link className="prepare-track-card" href={href} key={href} role="listitem">
              <div className="prepare-track-top">
                <span className="prepare-track-icon"><Icon size={23} aria-hidden="true" /></span>
                <span className="prepare-track-index">{index}</span>
              </div>
              <div className="prepare-track-copy">
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
              <ul aria-label={`${title} includes`}>
                {highlights.map((highlight) => <li key={highlight}><CheckCircle2 size={14} aria-hidden="true" />{highlight}</li>)}
              </ul>
              <span className="prepare-track-link">{cta}<ArrowRight size={16} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
