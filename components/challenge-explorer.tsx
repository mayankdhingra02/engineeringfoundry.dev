"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { activeChallenges } from "@/data/challenges";
import type { ChallengeCategory, ChallengeLevel } from "@/types";

const categories: Array<"All" | ChallengeCategory> = ["All", "DSA", "System Design", "ML System Design", "Backend Engineering"];
const levels: Array<"All" | ChallengeLevel> = ["All", "Foundation", "Intermediate", "Advanced"];

export function ChallengeExplorer() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | ChallengeCategory>("All");
  const [level, setLevel] = useState<"All" | ChallengeLevel>("All");
  const results = useMemo(() => activeChallenges.filter((challenge) => {
    const matchesSearch = `${challenge.title} ${challenge.summary}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (category === "All" || challenge.category === category) && (level === "All" || challenge.level === level);
  }), [category, level, search]);

  return <div className="challenge-explorer">
    <div className="challenge-filters">
      <label className="challenge-search"><span>Search challenges</span><div><Search size={15} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or scenario" /></div></label>
      <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as "All" | ChallengeCategory)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Engineering Foundry level</span><select value={level} onChange={(event) => setLevel(event.target.value as "All" | ChallengeLevel)}>{levels.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <div className="challenge-results-meta" role="status"><span>{results.length} {results.length === 1 ? "challenge" : "challenges"}</span><span>Self-guided · no account required</span></div>
    {results.length ? <div className="challenge-card-grid">{results.map((challenge) => <Link className="challenge-card" href={`/challenges/${challenge.slug}`} key={challenge.id}>
      <div className="challenge-card-meta"><span>{challenge.category}</span><span>{challenge.level}</span></div>
      <h3>{challenge.title}</h3>
      <p>{challenge.summary}</p>
      <footer><span><Clock3 size={14} />Suggested practice time: {challenge.suggested_minutes} minutes</span><strong>Open challenge <ArrowRight size={14} /></strong></footer>
    </Link>)}</div> : <div className="empty-state"><Search size={22} /><strong>No challenges match those filters.</strong><p>Try a broader title, category, or level.</p></div>}
  </div>;
}
