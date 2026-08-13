import type { CompanyGuide } from "@/types";
import companyData from "./companies.json";

export const companies = companyData as CompanyGuide[];

export function getCompany(slug: string) {
  return companies.find((company) => company.slug === slug);
}
