export function countResponsesForOption(
  responses: { optionId: { toString(): string } }[],
  optionId: string
): number {
  return responses.filter((r) => r.optionId.toString() === optionId).length;
}

export function getStudentSelectedOptionIds(
  responses: { studentId: { toString(): string }; optionId: { toString(): string } }[],
  studentId: string
): string[] {
  return responses
    .filter((r) => r.studentId.toString() === studentId)
    .map((r) => r.optionId.toString());
}

export function hasStudentResponded(
  responses: { studentId: { toString(): string } }[],
  studentId: string
): boolean {
  return responses.some((r) => r.studentId.toString() === studentId);
}

export function isPastDeadline(deadlineAt?: Date | string | null): boolean {
  if (!deadlineAt) return false;
  return new Date() > new Date(deadlineAt);
}

export function canChangeResponse(selector: { deadlineAt?: Date | string | null }): boolean {
  return !isPastDeadline(selector.deadlineAt);
}

export function isOptionFullForStudent(
  responses: {
    studentId: { toString(): string };
    optionId: { toString(): string };
  }[],
  optionId: string,
  limit: number,
  studentId: string,
  myOptionIds: string[]
): boolean {
  if (limit <= 0) return false;
  if (myOptionIds.includes(optionId)) return false;
  const count = responses.filter(
    (r) =>
      r.optionId.toString() === optionId && r.studentId.toString() !== studentId
  ).length;
  return count >= limit;
}

export function haveSelectionsChanged(saved: string[], current: string[]): boolean {
  if (saved.length !== current.length) return true;
  const savedSet = new Set(saved);
  return current.some((id) => !savedSet.has(id));
}

export type OptionSelectorRequirements = {
  beadandoSubmitted?: boolean;
  beadandoGraded?: boolean;
  hasFinalExamResult?: boolean;
  passedFinalExam?: boolean;
};

export const REQUIREMENT_ADMIN_LABELS: Record<
  keyof OptionSelectorRequirements,
  string
> = {
  beadandoSubmitted: "Beadandó beadva",
  beadandoGraded: "Beadandó értékelve",
  hasFinalExamResult: "Van záróvizsga eredmény",
  passedFinalExam: "Sikeres záróvizsga",
};

export const UNMET_REQUIREMENT_MESSAGES: Record<
  keyof OptionSelectorRequirements,
  string
> = {
  beadandoSubmitted:
    "Még nem adtad be az összes beadandót (vagy nincs leadva helyetted).",
  beadandoGraded: "Még nem értékelték az összes beadandódat.",
  hasFinalExamResult: "Még nincs záróvizsga eredményed.",
  passedFinalExam: "Még nem teljesítetted sikeresen a záróvizsgát.",
};

export type StudentCourseEligibilityContext = {
  dolgozatCount: number;
  allDolgozatSubmitted: boolean;
  allDolgozatGraded: boolean;
  hasFinalExamResult: boolean;
  passedFinalExam: boolean;
};

function isRequirementEnabled(
  requirements: OptionSelectorRequirements | undefined | null,
  key: keyof OptionSelectorRequirements
): boolean {
  return !!requirements?.[key];
}

export function evaluateOptionSelectorRequirements(
  requirements: OptionSelectorRequirements | undefined | null,
  context: StudentCourseEligibilityContext
): { eligible: boolean; unmetRequirements: (keyof OptionSelectorRequirements)[] } {
  const unmetRequirements: (keyof OptionSelectorRequirements)[] = [];

  if (isRequirementEnabled(requirements, "beadandoSubmitted")) {
    if (context.dolgozatCount > 0 && !context.allDolgozatSubmitted) {
      unmetRequirements.push("beadandoSubmitted");
    }
  }

  if (isRequirementEnabled(requirements, "beadandoGraded")) {
    if (context.dolgozatCount > 0 && !context.allDolgozatGraded) {
      unmetRequirements.push("beadandoGraded");
    }
  }

  if (isRequirementEnabled(requirements, "hasFinalExamResult")) {
    if (!context.hasFinalExamResult) {
      unmetRequirements.push("hasFinalExamResult");
    }
  }

  if (isRequirementEnabled(requirements, "passedFinalExam")) {
    if (!context.passedFinalExam) {
      unmetRequirements.push("passedFinalExam");
    }
  }

  return {
    eligible: unmetRequirements.length === 0,
    unmetRequirements,
  };
}

export function normalizeRequirements(
  requirements?: OptionSelectorRequirements | null
): OptionSelectorRequirements {
  return {
    beadandoSubmitted: !!requirements?.beadandoSubmitted,
    beadandoGraded: !!requirements?.beadandoGraded,
    hasFinalExamResult: !!requirements?.hasFinalExamResult,
    passedFinalExam: !!requirements?.passedFinalExam,
  };
}
