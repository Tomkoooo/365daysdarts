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
