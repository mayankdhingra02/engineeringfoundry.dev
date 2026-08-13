"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleDotDashed, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { activeResources, resourceAccessLevels, resourceCategories, resourceTypes } from "@/data/resources";
import { track } from "@/lib/analytics";
import type { Resource } from "@/types";

function setUrlParam(key: string, value: string) {
  const params = new URLSearchParams(window.location.search);
  if (!value || value.startsWith("All")) params.delete(key); else params.set(key, value);
  window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
}

function ResourceCard({ resource }: { resource: Resource }) {
  const external = !resource.isInternal;
  const content = <>
    <div className="resource-card-top">
      <span className={`resource-verification ${resource.verification}`} aria-label={`Verification status: ${resource.verification.replace("_", " ")}`}>{resource.verification === "verified" ? <BadgeCheck size={13} aria-hidden="true" /> : <CircleDotDashed size={13} aria-hidden="true" />}{resource.verification.replace("_", " ")}</span>
      <span className="resource-destination">{external ? <><ExternalLink size={13} aria-hidden="true" /> External</> : <>Internal <ArrowRight size={13} aria-hidden="true" /></>}</span>
    </div>
    <small className="resource-provider">{resource.provider}</small>
    <h3>{resource.title}</h3>
    <p>{resource.description}</p>
    <div className="resource-card-tags"><span>{resource.category}</span><span>{resource.type}</span><span>{resource.access}</span></div>
    <footer><span>{resource.lastVerifiedAt ? `Checked ${resource.lastVerifiedAt}` : "Not independently checked"}</span><b>{external ? "Open resource" : "Open in Foundry"} <ArrowRight size={14} /></b></footer>
  </>;
  const onOpen = () => track("resource_opened", { resource_id: resource.id, provider: resource.provider, category: resource.category, resource_type: resource.type, internal: resource.isInternal });
  return external
    ? <a className="resource-card real-resource-card" href={resource.url} target="_blank" rel="noopener noreferrer" onClick={onOpen}>{content}</a>
    : <Link className="resource-card real-resource-card" href={resource.url} onClick={onOpen}>{content}</Link>;
}

export function ResourceDirectory() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "All categories");
  const [type, setType] = useState(searchParams.get("type") ?? "All types");
  const [access, setAccess] = useState(searchParams.get("access") ?? "All access");
  const [source, setSource] = useState(searchParams.get("source") ?? "All sources");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "Category");

  const filtered = useMemo(() => activeResources.filter((resource) => {
    const searchable = `${resource.title} ${resource.description} ${resource.provider} ${resource.tags.join(" ")}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase())
      && (category === "All categories" || resource.category === category)
      && (type === "All types" || resource.type === type)
      && (access === "All access" || resource.access === access)
      && (source === "All sources" || (source === "Internal" ? resource.isInternal : !resource.isInternal));
  }).sort((a, b) => sort === "Alphabetical"
    ? a.title.localeCompare(b.title)
    : sort === "Recently verified"
      ? (b.lastVerifiedAt ?? "").localeCompare(a.lastVerifiedAt ?? "") || a.title.localeCompare(b.title)
      : a.category.localeCompare(b.category) || a.title.localeCompare(b.title)), [access, category, query, sort, source, type]);

  return <>
    <div className="resource-filters" aria-label="Resource directory filters">
      <label className="resource-search"><span>Search resources</span><div><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setUrlParam("search", event.target.value); }} placeholder="Search title, provider, or topic" /></div></label>
      <label><span>Category</span><select value={category} onChange={(event) => { setCategory(event.target.value); setUrlParam("category", event.target.value); }}><option>All categories</option>{resourceCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Type</span><select value={type} onChange={(event) => { setType(event.target.value); setUrlParam("type", event.target.value); }}><option>All types</option>{resourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Access</span><select value={access} onChange={(event) => { setAccess(event.target.value); setUrlParam("access", event.target.value); }}><option>All access</option>{resourceAccessLevels.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Source</span><select value={source} onChange={(event) => { setSource(event.target.value); setUrlParam("source", event.target.value); }}><option>All sources</option><option>Internal</option><option>External</option></select></label>
      <label><span>Sort</span><select value={sort} onChange={(event) => { setSort(event.target.value); setUrlParam("sort", event.target.value); }}><option>Category</option><option>Alphabetical</option><option>Recently verified</option></select></label>
    </div>
    <div className="resource-result-meta"><span>{filtered.length} {filtered.length === 1 ? "resource" : "resources"}</span><span>Verification is evidence of a checked destination, not an endorsement.</span></div>
    <div className="resource-grid real-resource-grid">{filtered.map((resource) => <ResourceCard resource={resource} key={resource.id} />)}{!filtered.length && <div className="empty-state"><strong>No resources found</strong><p>Try a broader search or reset one of the filters.</p></div>}</div>
  </>;
}
