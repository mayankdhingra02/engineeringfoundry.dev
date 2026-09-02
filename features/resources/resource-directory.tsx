"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleDotDashed, ExternalLink, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { activeResources, resourceAccessLevels, resourceCategories, resourceTypes } from "@/data/resources";
import { track } from "@/lib/analytics";
import {
  defaultResourceDirectoryUrlState,
  parseResourceDirectoryUrlState,
  RESOURCE_DIRECTORY_SEARCH_LIMIT,
  resourceDirectoryHref,
  resourceSorts,
  resourceSources,
  type ResourceDirectoryUrlState,
} from "@/lib/resources/resource-directory-url-state";
import type { Resource } from "@/types";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const filters = useMemo(() => parseResourceDirectoryUrlState(queryString), [queryString]);
  const { search, category, type, access, source, sort } = filters;

  useEffect(() => {
    const canonicalHref = resourceDirectoryHref(pathname, filters, queryString, window.location.hash);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (canonicalHref !== currentHref) window.history.replaceState(null, "", canonicalHref);
  }, [filters, pathname, queryString]);

  function commitFilters(next: ResourceDirectoryUrlState, mode: "push" | "replace") {
    const href = resourceDirectoryHref(pathname, next, window.location.search, window.location.hash);
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (href === currentHref) return;
    if (mode === "push") window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
  }

  function updateFilter(key: keyof ResourceDirectoryUrlState, value: string, mode: "push" | "replace" = "push") {
    commitFilters({ ...filters, [key]: value }, mode);
  }

  const filtered = useMemo(() => activeResources.filter((resource) => {
    const searchable = `${resource.title} ${resource.description} ${resource.provider} ${resource.tags.join(" ")}`.toLowerCase();
    return searchable.includes(search.trim().toLowerCase())
      && (category === "All categories" || resource.category === category)
      && (type === "All types" || resource.type === type)
      && (access === "All access" || resource.access === access)
      && (source === "All sources" || (source === "Internal" ? resource.isInternal : !resource.isInternal));
  }).sort((a, b) => sort === "Alphabetical"
    ? a.title.localeCompare(b.title)
    : sort === "Recently verified"
      ? (b.lastVerifiedAt ?? "").localeCompare(a.lastVerifiedAt ?? "") || a.title.localeCompare(b.title)
      : a.category.localeCompare(b.category) || a.title.localeCompare(b.title)), [access, category, search, sort, source, type]);

  const filtersActive = Object.entries(filters).some(([key, value]) => value !== defaultResourceDirectoryUrlState[key as keyof ResourceDirectoryUrlState]);

  return <>
    <div className="resource-filters" aria-label="Resource directory filters">
      <label className="resource-search"><span>Search resources</span><div><Search size={16} aria-hidden="true" /><input value={search} maxLength={RESOURCE_DIRECTORY_SEARCH_LIMIT} onChange={(event) => updateFilter("search", event.target.value.slice(0, RESOURCE_DIRECTORY_SEARCH_LIMIT), "replace")} placeholder="Search title, provider, or topic" /></div></label>
      <label><span>Category</span><select value={category} onChange={(event) => updateFilter("category", event.target.value)}><option>All categories</option>{resourceCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Type</span><select value={type} onChange={(event) => updateFilter("type", event.target.value)}><option>All types</option>{resourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Access</span><select value={access} onChange={(event) => updateFilter("access", event.target.value)}><option>All access</option>{resourceAccessLevels.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Source</span><select value={source} onChange={(event) => updateFilter("source", event.target.value)}><option>All sources</option>{resourceSources.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Sort</span><select value={sort} onChange={(event) => updateFilter("sort", event.target.value)}>{resourceSorts.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <div className="resource-result-meta"><span role="status" aria-live="polite" aria-atomic="true">{filtered.length} {filtered.length === 1 ? "resource" : "resources"}</span><button className="button button-ghost button-sm" type="button" disabled={!filtersActive} onClick={() => commitFilters(defaultResourceDirectoryUrlState, "push")}><RotateCcw size={13} aria-hidden="true" />Reset filters</button><span>Verification is evidence of a checked destination, not an endorsement.</span></div>
    <div className="resource-grid real-resource-grid">{filtered.map((resource) => <ResourceCard resource={resource} key={resource.id} />)}{!filtered.length && <div className="empty-state"><strong>No resources found</strong><p>Try a broader search or reset one of the filters.</p></div>}</div>
  </>;
}
