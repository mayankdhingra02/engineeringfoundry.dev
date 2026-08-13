import type { Metadata } from "next";
import { LearningTrackPage } from "@/components/learning-track-page";

export const metadata: Metadata = { title: "System Design", description: "Build system-design foundations and practice architecture interviews." };
const config = { eyebrow: "System Design", title: "Design systems with clear reasoning.", description: "Learn the fundamentals, explore architecture tradeoffs, and practice communicating designs under interview constraints.", roadmap: [
  { title: "Foundations", description: "Latency, throughput, availability, and capacity." }, { title: "Data & storage", description: "Data models, databases, partitioning, and replication." }, { title: "Distributed building blocks", description: "Caching, queues, load balancing, and APIs." }, { title: "Reliability & tradeoffs", description: "Failure modes, consistency, observability, and recovery." }, { title: "Interview practice", description: "Scope, estimate, design, evaluate, and communicate." },
], categories: ["Scalability", "Caching", "Databases", "Load Balancing", "Messaging", "Distributed Systems", "Storage", "APIs", "Reliability", "Consistency"], practiceTitle: "Practice architecture interviews with a repeatable approach.", resources: ["Architecture fundamentals", "Distributed systems reading", "Design interview prompts"] };
export default function Page() { return <LearningTrackPage config={config} />; }
