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
