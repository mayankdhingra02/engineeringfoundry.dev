"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DSACompany, DSAInterviewQuestion } from "@/data/dsa/interview-prep";

export function CompanyDirectory({ companies, questions }: { companies: DSACompany[]; questions: DSAInterviewQuestion[] }) {
  const [search, setSearch] = useState("");
  const records = useMemo(() => companies.map((company) => {
    const companyQuestions = questions.filter((question) => question.companies.some((association) => association.companySlug === company.slug));
    return { company, questions: companyQuestions, difficulty: companyQuestions.reduce((result, question) => ({ ...result, [question.difficulty]: result[question.difficulty] + 1 }), { Easy: 0, Medium: 0, Hard: 0 }) };
  }).filter(({ company }) => company.name.toLowerCase().includes(search.trim().toLowerCase())), [companies, questions, search]);
  return <section className="dsa-company-directory" aria-labelledby="company-directory-title"><div className="dsa-company-directory-toolbar"><label><span>Search companies</span><span className="field-with-icon"><Search size={15} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies…" /></span></label><span aria-live="polite">{records.length} of {companies.length} companies</span></div><h2 id="company-directory-title" className="sr-only">Company directory</h2><div className="dsa-company-directory-grid">{records.map(({ company, questions: companyQuestions, difficulty }) => <Link href={`/dsa/companies/${company.slug}`} key={company.slug}><span>{company.name.slice(0, 2).toUpperCase()}</span><div><strong>{company.name}</strong>{companyQuestions.length ? <><small>{companyQuestions.length} sample question{companyQuestions.length === 1 ? "" : "s"}</small><p>{difficulty.Easy} easy · {difficulty.Medium} medium · {difficulty.Hard} hard</p></> : <><small>Dataset pending</small><p>No associations loaded</p></>}</div><ArrowRight size={14} /></Link>)}</div>{!records.length && <div className="dsa-database-empty"><strong>No companies match this search.</strong><p>Try a shorter or broader company name.</p><button type="button" className="button button-secondary" onClick={() => setSearch("")}>Clear search</button></div>}</section>;
}
