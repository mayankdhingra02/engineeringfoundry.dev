export type RoundPreparationNextAction = Readonly<{
  href: string;
  label: string;
}>;

export type RoundPreparationNextActionInput = Readonly<{
  applicationId: string;
  dsaQuestion?: Readonly<{
    id: string;
    title: string;
  }> | null;
  systemDesignAttempt?: Readonly<{
    id: string;
    problemId: string;
    title: string;
  }> | null;
  behavioralAvailable: boolean;
  systemDesignConcept?: Readonly<{
    href: string;
    title: string;
  }> | null;
}>;

export function chooseRoundPreparationNextAction(
  input: RoundPreparationNextActionInput,
): RoundPreparationNextAction {
  const context = `application=${input.applicationId}`;

  if (input.dsaQuestion) {
    return {
      href: `/dsa/questions/${input.dsaQuestion.id}?${context}`,
      label: `Review ${input.dsaQuestion.title}`,
    };
  }

  if (input.systemDesignAttempt) {
    return {
      href: `/system-design/problems/${input.systemDesignAttempt.problemId}/practice/${input.systemDesignAttempt.id}`,
      label: `Review ${input.systemDesignAttempt.title}`,
    };
  }

  if (input.behavioralAvailable) {
    return {
      href: `/behavioral/questions?${context}`,
      label: "Continue behavioral preparation",
    };
  }

  if (input.systemDesignConcept) {
    return {
      href: input.systemDesignConcept.href,
      label: `Review ${input.systemDesignConcept.title}`,
    };
  }

  return {
    href: `/applications/${input.applicationId}`,
    label: "Review application details",
  };
}
