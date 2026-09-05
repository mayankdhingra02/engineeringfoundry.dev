export type SalaryNegotiationSource = Readonly<{
  id: string;
  title: string;
  publisher: string;
  url: string;
  jurisdiction: string;
  claim: string;
  limits: string;
  verifiedAt: string;
  reviewBy: string;
  volatility: "periodic" | "volatile";
  moduleSlugs: readonly string[];
}>;

export const salaryNegotiationSources: readonly SalaryNegotiationSource[] = [
  {
    id: "SRC-SAL-DOL-VETS-2026",
    title: "Salary Negotiation Participant Guide",
    publisher: "U.S. Department of Labor, Veterans’ Employment and Training Service",
    url: "https://www.dol.gov/sites/dolgov/files/VETS/files/SalaryNegotiation_PG_Interactive_Feb2026.pdf",
    jurisdiction: "United States · general educational starting point",
    claim: "A candidate can evaluate the whole offer, prepare a supported request, ask for time, and confirm final terms in writing.",
    limits: "The guide is not employer policy and does not make any component negotiable or guarantee an improved offer.",
    verifiedAt: "2026-09-05",
    reviewBy: "2027-03-05",
    volatility: "periodic",
    moduleSlugs: ["compensation-package-anatomy", "timing-and-process", "honest-leverage", "counters-and-trade-offs", "raises-and-promotions"],
  },
  {
    id: "SRC-SAL-DOL-OTHER-COMP",
    title: "Other compensation benefits",
    publisher: "U.S. Department of Labor",
    url: "https://www.dol.gov/general/topic/benefits-other/othercompbenefits",
    jurisdiction: "United States · federal overview",
    claim: "Many compensation benefits are matters of agreement, so the actual employer terms must be checked instead of assumed.",
    limits: "This does not describe every benefit, mandate negotiability, or replace plan and offer documents.",
    verifiedAt: "2026-09-05",
    reviewBy: "2027-03-05",
    volatility: "periodic",
    moduleSlugs: ["compensation-package-anatomy", "remote-and-written-terms"],
  },
  {
    id: "SRC-SAL-IRS-STOCK-OPTIONS",
    title: "Topic no. 427, Stock options",
    publisher: "Internal Revenue Service",
    url: "https://www.irs.gov/taxtopics/tc427",
    jurisdiction: "United States · federal tax starting point",
    claim: "Employee stock-option tax treatment depends on the instrument and on events such as grant, exercise, and disposition.",
    limits: "Federal overview only. It is not a calculation for a particular grant, transaction, tax year, state, or country.",
    verifiedAt: "2026-09-05",
    reviewBy: "2027-03-05",
    volatility: "periodic",
    moduleSlugs: ["startup-equity-diligence"],
  },
  {
    id: "SRC-SAL-FTC-NONCOMPETE",
    title: "Noncompete Rule",
    publisher: "U.S. Federal Trade Commission",
    url: "https://www.ftc.gov/legal-library/browse/rules/noncompete-rule",
    jurisdiction: "United States · federal status only",
    claim: "The FTC page currently states that its federal Noncompete Rule is not in effect and is not enforceable.",
    limits: "State law and individual agreements can differ. Re-check the live source and obtain qualified advice before relying on any restriction.",
    verifiedAt: "2026-09-05",
    reviewBy: "2026-12-05",
    volatility: "volatile",
    moduleSlugs: ["remote-and-written-terms"],
  },
  {
    id: "SRC-SAL-USCIS-I765",
    title: "Instructions for Application for Employment Authorization",
    publisher: "U.S. Citizenship and Immigration Services",
    url: "https://www.uscis.gov/sites/default/files/document/forms/i-765instr.pdf",
    jurisdiction: "United States · federal immigration starting point",
    claim: "Work authorization can depend on a person’s immigration category and whether authorization is incident to status or separately documented.",
    limits: "Do not infer an individual’s work authorization, portability, filing need, or deadline from this overview; use current case-specific guidance and qualified advice.",
    verifiedAt: "2026-09-05",
    reviewBy: "2026-12-05",
    volatility: "volatile",
    moduleSlugs: ["remote-and-written-terms"],
  },
];

export function getSalaryNegotiationSources(moduleSlug?: string) {
  return moduleSlug
    ? salaryNegotiationSources.filter((source) => source.moduleSlugs.includes(moduleSlug))
    : salaryNegotiationSources;
}
