export const MAX_SUBMISSION_FILES = 10;
/** @deprecated use MAX_SUBMISSION_FILES */
export const MAX_SUBMISSION_PHOTOS = MAX_SUBMISSION_FILES;

export const ALLOWED_SUBMISSION_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** @deprecated use ALLOWED_SUBMISSION_IMAGE_TYPES */
export const ALLOWED_IMAGE_TYPES = ALLOWED_SUBMISSION_IMAGE_TYPES;

export const ALLOWED_SUBMISSION_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/** @deprecated use ALLOWED_SUBMISSION_DOCUMENT_TYPES */
export const ALLOWED_QUESTION_FILE_TYPES = ALLOWED_SUBMISSION_DOCUMENT_TYPES;

export const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;

export type SubmissionFileKind = 'image' | 'document';

export type SubmissionStatus =
  | 'not_submitted'
  | 'submitted'
  | 'submitted_late'
  | 'graded'
  | 'draft';

export function isImageMime(contentType: string): boolean {
  return (ALLOWED_SUBMISSION_IMAGE_TYPES as readonly string[]).includes(contentType);
}

export function isDocumentMime(contentType: string): boolean {
  return (ALLOWED_SUBMISSION_DOCUMENT_TYPES as readonly string[]).includes(contentType);
}

export function getFileKindFromMime(contentType: string): SubmissionFileKind | null {
  if (isImageMime(contentType)) return 'image';
  if (isDocumentMime(contentType)) return 'document';
  return null;
}

export function isAllowedSubmissionMime(contentType: string): boolean {
  return getFileKindFromMime(contentType) !== null;
}

export function computeIsLate(submittedAt: Date, deadlineAt?: Date | null): boolean {
  if (!deadlineAt) return false;
  return submittedAt.getTime() > new Date(deadlineAt).getTime();
}

export function getSubmissionStatus(
  submission: {
    submittedAt?: Date | null;
    gradedAt?: Date | null;
    isLate?: boolean;
    photos?: unknown[];
  } | null
): SubmissionStatus {
  if (!submission) return 'not_submitted';
  if (submission.gradedAt) return 'graded';
  if (!submission.submittedAt) {
    return (submission.photos?.length ?? 0) > 0 ? 'draft' : 'not_submitted';
  }
  if (submission.isLate) return 'submitted_late';
  return 'submitted';
}

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  not_submitted: 'Nem beadva',
  submitted: 'Beadva',
  submitted_late: 'Későn beadva',
  graded: 'Értékelve',
  draft: 'Piszkozat',
};

export function isIncompleteStatus(status: SubmissionStatus): boolean {
  return status === 'not_submitted' || status === 'draft';
}

export function canEditSubmission(
  submission: { submittedAt?: Date | null; gradedAt?: Date | null },
  dolgozat: { deadlineAt?: Date | null; allowResubmitUntilDeadline?: boolean }
): boolean {
  if (submission.gradedAt) return false;
  if (!dolgozat.allowResubmitUntilDeadline && submission.submittedAt) return false;
  if (dolgozat.deadlineAt && new Date() > new Date(dolgozat.deadlineAt)) return false;
  return true;
}
