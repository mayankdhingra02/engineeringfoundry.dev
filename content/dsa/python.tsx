import { LanguageGuide } from "@/features/dsa/languages/language-guide";
import { pythonLanguageGuide } from "./languages/python-content";

export function PythonDSAGuide() {
  return <LanguageGuide guide={pythonLanguageGuide} />;
}
