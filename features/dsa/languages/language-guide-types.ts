export interface LanguageCodeExample {
  title: string;
  code: string;
  note?: string;
}

export interface LanguageComplexityRow {
  operation: string;
  complexity: string;
  note?: string;
}

export interface LanguageGuideSection {
  id: string;
  title: string;
  introduction: string;
  examples?: LanguageCodeExample[];
  points?: string[];
  warning?: string;
  complexity?: LanguageComplexityRow[];
}

export interface LanguageInterviewTemplate {
  id: string;
  title: string;
  useWhen: string;
  code: string;
  complexity?: string;
  roadmapTopicId: string;
}

export interface LanguageGuideData {
  slug: "python" | "java";
  name: string;
  label: string;
  description: string;
  quickReference: LanguageCodeExample[];
  sections: LanguageGuideSection[];
  templates: LanguageInterviewTemplate[];
  mistakes: Array<{ title: string; explanation: string }>;
}
