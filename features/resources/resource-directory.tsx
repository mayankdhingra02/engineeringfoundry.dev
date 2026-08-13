"use client";

import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { resources } from "@/data/fixtures/resources";
import { track } from "@/lib/analytics";
import { StatusPill } from "@/components/page-shell";

export function ResourceDirectory() {
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("All categories"); const [access, setAccess] = useState("All access");
  const filtered = useMemo(() => resources.filter((resource) => `${resource.title} ${resource.description} ${resource.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()) && (category === "All categories" || resource.category === category) && (access === "All access" || resource.access === access)), [query, category, access]);
  return <><div className="filter-bar"><label><Search size={16} /><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search demo resources…" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option>All categories</option><option>DSA</option><option>System Design</option><option>ML Design</option><option>Behavioral</option></select><select value={access} onChange={(event) => setAccess(event.target.value)} aria-label="Filter by access"><option>All access</option><option>Free</option><option>Freemium</option><option>Paid</option></select><span className="filter-count">{filtered.length} resources</span></div>
  <div className="resource-grid">{filtered.map((resource) => <a className="resource-card" href={resource.url} target="_blank" rel="noreferrer" key={resource.id} onClick={() => track("resource_clicked", { resource_id: resource.id, category: resource.category, resource_type: resource.type })}><div className="resource-meta"><StatusPill tone="accent">Demo</StatusPill><span className="resource-link"><ExternalLink size={16} /></span></div><h3>{resource.title}</h3><p>{resource.description}</p><div className="tag-list"><span className="tag">{resource.category}</span><span className="tag">{resource.type}</span><span className="tag">{resource.access}</span></div></a>)}{!filtered.length && <div className="empty-state"><strong>No resources found</strong><p>Try a broader query or reset the filters.</p></div>}</div></>;
}
