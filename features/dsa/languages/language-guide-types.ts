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

export interface LanguageGuideExercise {
  kind: "predict" | "trace" | "repair" | "choose" | "transfer";
  title: string;
  prompt: string;
  answerCheck: string;
}

export interface LanguageGuideSource {
  id: string;
  label: string;
  url: string;
  supports: string;
}

export interface LanguageGuideData {
  slug: "python" | "java";
  name: string;
  label: string;
  description: string;
  runtimeNote: string;
  reviewedAt: string;
  sources: LanguageGuideSource[];
  quickReference: LanguageCodeExample[];
  sections: LanguageGuideSection[];
  templates: LanguageInterviewTemplate[];
  debuggingChecklist: string[];
  interviewerTopics: string[];
  exercises: LanguageGuideExercise[];
  mistakes: Array<{ title: string; explanation: string }>;
}
