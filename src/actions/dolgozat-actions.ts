"use server";

import connectDB from "@/lib/db";
import Course from "@/models/Course";
import Dolgozat from "@/models/Dolgozat";
import DolgozatSubmission from "@/models/DolgozatSubmission";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { getAuthSession } from "@/lib/session";
import {
  MAX_SUBMISSION_FILES,
  ALLOWED_SUBMISSION_DOCUMENT_TYPES,
  isAllowedSubmissionMime,
  getFileKindFromMime,
  computeIsLate,
  getSubmissionStatus,
  canEditSubmission,
  isIncompleteStatus,
  STATUS_LABELS,
  type SubmissionStatus,
} from "@/lib/dolgozat-utils";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import { sendEmail } from "@/lib/email";
import { buildPublishedEmail, buildGradedEmail } from "@/lib/dolgozat-email-templates";

export type DolgozatInput = {
  title: string;
  description?: string;
  label?: string;
  moduleId?: string;
  pageId?: string;
  maxPoints?: number;
  deadlineAt?: string | null;
  isPublished?: boolean;
  allowResubmitUntilDeadline?: boolean;
  questionFile?: {
    mediaId: string;
    url: string;
    originalName: string;
    contentType: string;
  } | null;
};

export type PhotoInput = {
  mediaId: string;
  url: string;
  originalName?: string;
  contentType: string;
  kind?: "image" | "document";
};

async function ensureLecturerCanAccessCourse(
  session: { user?: { id?: string; role?: string } } | null,
  courseId: string
) {
  if (session?.user?.role === "admin") return true;
  if (session?.user?.role !== "lecturer") return false;
  await connectDB();
  const course = await Course.findById(courseId).select("authorId").lean();
  return !!course && course.authorId?.toString() === session?.user?.id;
}

async function ensureStudentCourseAccess(
  session: { user?: { id?: string; role?: string; subscriptionStatus?: string } } | null,
  courseId: string
) {
  if (!session?.user?.id) return false;
  if (session.user.role === "admin") return true;
  if (session.user.subscriptionStatus !== "active") return false;
  await connectDB();
  const user = await User.findById(session.user.id).select("progress").lean();
  const progress = (user as any)?.progress;
  if (!progress) return false;
  const progressObj = progress instanceof Map ? Object.fromEntries(progress) : progress;
  return !!progressObj[courseId];
}

async function getEnrolledStudentIds(courseId: string): Promise<string[]> {
  const students = await User.find({ role: "student" }).select("progress").lean();
  const ids: string[] = [];
  for (const s of students as any[]) {
    const progress = s.progress;
    const progressObj = progress instanceof Map ? Object.fromEntries(progress) : progress || {};
    if (progressObj[courseId]) ids.push(s._id.toString());
  }
  return ids;
}

async function createNotification(data: {
  userId: string;
  type: "dolgozat_submitted" | "dolgozat_graded" | "dolgozat_on_behalf";
  dolgozatId: string;
  submissionId?: string;
  courseId: string;
  message: string;
}) {
  await Notification.create({
    userId: data.userId,
    type: data.type,
    dolgozatId: data.dolgozatId,
    submissionId: data.submissionId,
    courseId: data.courseId,
    message: data.message,
  });
}

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

async function tagGridFsForSubmission(
  mediaIds: mongoose.Types.ObjectId[],
  submissionId: string,
  ownerId: string
) {
  const db = mongoose.connection.db;
  if (!db) return;
  for (const mediaId of mediaIds) {
    await db.collection("uploads.files").updateOne(
      { _id: mediaId },
      {
        $set: {
          "metadata.submissionId": submissionId,
          "metadata.dolgozatProtected": true,
          "metadata.ownerId": ownerId,
        },
      }
    );
  }
}

function buildOrderedFiles(photos: PhotoInput[]) {
  return photos.map((p, index) => ({
    order: index,
    mediaId: new mongoose.Types.ObjectId(p.mediaId),
    url: p.url,
    originalName: p.originalName,
    contentType: p.contentType,
    kind: p.kind || getFileKindFromMime(p.contentType) || "image",
    uploadedAt: new Date(),
  }));
}

async function sendDolgozatEmailToUser(
  userId: string,
  template: "published" | "graded",
  payload: Parameters<typeof buildPublishedEmail>[0] | Parameters<typeof buildGradedEmail>[0]
) {
  await connectDB();
  const user = await User.findById(userId).select("name email dolgozatEmailNotifications").lean();
  if (!user || !(user as any).dolgozatEmailNotifications || !(user as any).email) return;

  const emailContent =
    template === "published"
      ? buildPublishedEmail(payload as Parameters<typeof buildPublishedEmail>[0])
      : buildGradedEmail(payload as Parameters<typeof buildGradedEmail>[0]);

  await sendEmail({
    to: (user as any).email,
    ...emailContent,
  });
}

async function notifyPublishedDolgozat(dolgozat: {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  deadlineAt?: Date;
}) {
  const course = await Course.findById(dolgozat.courseId).select("title").lean();
  const studentIds = await getEnrolledStudentIds(dolgozat.courseId.toString());
  const courseId = dolgozat.courseId.toString();
  const dolgozatId = dolgozat._id.toString();

  for (const studentId of studentIds) {
    const user = await User.findById(studentId).select("name dolgozatEmailNotifications").lean();
    if (!(user as any)?.dolgozatEmailNotifications) continue;
    await sendDolgozatEmailToUser(studentId, "published", {
      studentName: (user as any).name || "Tanuló",
      courseTitle: (course as any)?.title || "Kurzus",
      dolgozatTitle: dolgozat.title,
      courseId,
      dolgozatId,
      deadlineAt: dolgozat.deadlineAt,
      description: dolgozat.description,
    });
  }
}

// --- Lecturer: Dolgozat CRUD ---

export async function listDolgozatokForCourse(courseId: string) {
  const session = await getAuthSession();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }
  await connectDB();

  const dolgozatok = await Dolgozat.find({ courseId, isArchived: false })
    .sort({ createdAt: -1 })
    .lean();

  const dolgozatIds = dolgozatok.map((d: any) => d._id);
  const submissions = await DolgozatSubmission.find({ dolgozatId: { $in: dolgozatIds } }).lean();
  const enrolledCount = (await getEnrolledStudentIds(courseId)).length;

  const result = dolgozatok.map((d: any) => {
    const subs = submissions.filter((s: any) => s.dolgozatId.toString() === d._id.toString());
    const submitted = subs.filter((s: any) => s.submittedAt).length;
    const graded = subs.filter((s: any) => s.gradedAt).length;
    return {
      ...serialize(d),
      _id: d._id.toString(),
      courseId: d.courseId.toString(),
      authorId: d.authorId.toString(),
      stats: { enrolledCount, submittedCount: submitted, gradedCount: graded },
    };
  });

  return result;
}

export async function getDolgozatById(dolgozatId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Bejelentkezés szükséges");

  await connectDB();
  const dolgozat = await Dolgozat.findById(dolgozatId).lean();
  if (!dolgozat || (dolgozat as any).isArchived) throw new Error("Dolgozat nem található");

  const courseId = (dolgozat as any).courseId.toString();
  const isLecturer = await ensureLecturerCanAccessCourse(session, courseId);
  const isStudent =
    (dolgozat as any).isPublished && (await ensureStudentCourseAccess(session, courseId));

  if (!isLecturer && !isStudent) throw new Error("Nincs jogosultság");

  return serialize({
    ...(dolgozat as any),
    _id: (dolgozat as any)._id.toString(),
    courseId,
    authorId: (dolgozat as any).authorId.toString(),
    moduleId: (dolgozat as any).moduleId?.toString(),
    pageId: (dolgozat as any).pageId?.toString(),
  });
}

export async function createDolgozat(courseId: string, input: DolgozatInput) {
  const session = await getAuthSession();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }
  if (!input.title?.trim()) return { success: false, error: "A cím kötelező" };

  if (
    input.questionFile?.contentType &&
    !ALLOWED_SUBMISSION_DOCUMENT_TYPES.includes(input.questionFile.contentType as any)
  ) {
    return { success: false, error: "Érvénytelen fájltípus" };
  }

  await connectDB();
  const doc = await Dolgozat.create({
    courseId,
    authorId: session!.user!.id,
    title: input.title.trim(),
    description: input.description?.trim(),
    label: input.label?.trim(),
    moduleId: input.moduleId || undefined,
    pageId: input.pageId || undefined,
    maxPoints: input.maxPoints ?? 100,
    deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
    isPublished: input.isPublished ?? false,
    allowResubmitUntilDeadline: input.allowResubmitUntilDeadline ?? true,
    questionFile: input.questionFile || undefined,
  });

  if (doc.isPublished) {
    await notifyPublishedDolgozat(doc);
  }

  return { success: true, id: doc._id.toString() };
}

export async function updateDolgozat(dolgozatId: string, input: DolgozatInput) {
  const session = await getAuthSession();
  await connectDB();
  const existing = await Dolgozat.findById(dolgozatId);
  if (!existing || existing.isArchived) return { success: false, error: "Dolgozat nem található" };
  if (!(await ensureLecturerCanAccessCourse(session, existing.courseId.toString()))) {
    return { success: false, error: "Nincs jogosultság" };
  }
  if (!input.title?.trim()) return { success: false, error: "A cím kötelező" };

  const wasPublished = existing.isPublished;

  existing.title = input.title.trim();
  existing.description = input.description?.trim();
  existing.label = input.label?.trim();
  existing.moduleId = input.moduleId ? new mongoose.Types.ObjectId(input.moduleId) : undefined;
  existing.pageId = input.pageId ? new mongoose.Types.ObjectId(input.pageId) : undefined;
  existing.maxPoints = input.maxPoints ?? 100;
  existing.deadlineAt = input.deadlineAt ? new Date(input.deadlineAt) : undefined;
  existing.isPublished = input.isPublished ?? false;
  existing.allowResubmitUntilDeadline = input.allowResubmitUntilDeadline ?? true;
  if (input.questionFile === null) {
    existing.questionFile = undefined;
  } else if (input.questionFile) {
    existing.questionFile = input.questionFile as any;
  }
  await existing.save();

  if (!wasPublished && existing.isPublished) {
    await notifyPublishedDolgozat(existing);
  }

  return { success: true };
}

export async function archiveDolgozat(dolgozatId: string) {
  const session = await getAuthSession();
  await connectDB();
  const existing = await Dolgozat.findById(dolgozatId);
  if (!existing) return { success: false, error: "Dolgozat nem található" };
  if (!(await ensureLecturerCanAccessCourse(session, existing.courseId.toString()))) {
    return { success: false, error: "Nincs jogosultság" };
  }
  existing.isArchived = true;
  await existing.save();
  return { success: true };
}

// --- Lecturer: Submissions overview ---

export async function getDolgozatSubmissionsOverview(dolgozatId: string) {
  const session = await getAuthSession();
  await connectDB();

  const dolgozat = await Dolgozat.findById(dolgozatId).lean();
  if (!dolgozat || (dolgozat as any).isArchived) throw new Error("Dolgozat nem található");
  const courseId = (dolgozat as any).courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }

  const [submissions, studentIds] = await Promise.all([
    DolgozatSubmission.find({ dolgozatId }).populate("userId", "name email").lean(),
    getEnrolledStudentIds(courseId),
  ]);

  const students = await User.find({ _id: { $in: studentIds } })
    .select("name email")
    .lean();

  const submissionByUser = new Map(
    (submissions as any[]).map((s) => [s.userId._id?.toString() || s.userId.toString(), s])
  );

  const rows = students.map((student: any) => {
    const sub = submissionByUser.get(student._id.toString());
    const status = getSubmissionStatus(sub || null);
    return {
      studentId: student._id.toString(),
      name: student.name,
      email: student.email,
      status,
      statusLabel: STATUS_LABELS[status],
      submissionId: sub?._id?.toString(),
      submittedAt: sub?.submittedAt || null,
      isLate: sub?.isLate || false,
      points: sub?.points ?? null,
      feedback: sub?.feedback || null,
      photoCount: sub?.photos?.length || 0,
      uploadedOnBehalf: !!sub?.uploadedOnBehalfBy,
    };
  });

  const summary = {
    total: rows.length,
    submitted: rows.filter((r) => ["submitted", "submitted_late", "graded"].includes(r.status)).length,
    late: rows.filter((r) => r.status === "submitted_late").length,
    notSubmitted: rows.filter((r) => r.status === "not_submitted" || r.status === "draft").length,
    graded: rows.filter((r) => r.status === "graded").length,
  };

  return {
    dolgozat: serialize({
      ...(dolgozat as any),
      _id: (dolgozat as any)._id.toString(),
      courseId,
    }),
    rows,
    summary,
  };
}

export async function getSubmissionForGrading(submissionId: string) {
  const session = await getAuthSession();
  await connectDB();

  const submission = await DolgozatSubmission.findById(submissionId)
    .populate("userId", "name email")
    .lean();
  if (!submission) throw new Error("Beadás nem található");

  const dolgozat = await Dolgozat.findById((submission as any).dolgozatId).lean();
  if (!dolgozat) throw new Error("Dolgozat nem található");
  const courseId = (dolgozat as any).courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }

  const photos = [...((submission as any).photos || [])].sort((a: any, b: any) => a.order - b.order);

  return serialize({
    submission: {
      ...(submission as any),
      _id: (submission as any)._id.toString(),
      photos,
      user: {
        id: (submission as any).userId._id?.toString() || (submission as any).userId.toString(),
        name: (submission as any).userId.name,
        email: (submission as any).userId.email,
      },
    },
    dolgozat: {
      ...(dolgozat as any),
      _id: (dolgozat as any)._id.toString(),
      maxPoints: (dolgozat as any).maxPoints,
      title: (dolgozat as any).title,
    },
  });
}

export async function gradeSubmission(
  submissionId: string,
  points: number,
  feedback?: string
) {
  const session = await getAuthSession();
  await connectDB();

  const submission = await DolgozatSubmission.findById(submissionId);
  if (!submission) return { success: false, error: "Beadás nem található" };
  if (!submission.submittedAt) return { success: false, error: "Még nincs beadva" };

  const dolgozat = await Dolgozat.findById(submission.dolgozatId);
  if (!dolgozat) return { success: false, error: "Dolgozat nem található" };
  if (!(await ensureLecturerCanAccessCourse(session, dolgozat.courseId.toString()))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  if (points < 0 || points > dolgozat.maxPoints) {
    return { success: false, error: `A pontszám 0 és ${dolgozat.maxPoints} között legyen` };
  }

  submission.points = points;
  submission.feedback = feedback?.trim() || undefined;
  submission.gradedAt = new Date();
  submission.gradedBy = new mongoose.Types.ObjectId(session!.user!.id);
  await submission.save();

  const student = await User.findById(submission.userId).select("name").lean();
  await createNotification({
    userId: submission.userId.toString(),
    type: "dolgozat_graded",
    dolgozatId: dolgozat._id.toString(),
    submissionId: submission._id.toString(),
    courseId: dolgozat.courseId.toString(),
    message: `Értékelve: „${dolgozat.title}” — ${points}/${dolgozat.maxPoints} pont`,
  });

  const gradedStudent = await User.findById(submission.userId).select("name").lean();
  await sendDolgozatEmailToUser(submission.userId.toString(), "graded", {
    studentName: (gradedStudent as any)?.name || "Tanuló",
    dolgozatTitle: dolgozat.title,
    courseId: dolgozat.courseId.toString(),
    dolgozatId: dolgozat._id.toString(),
    points,
    maxPoints: dolgozat.maxPoints,
    feedback: feedback?.trim(),
  });

  return { success: true };
}

export async function clearGrade(submissionId: string) {
  const session = await getAuthSession();
  await connectDB();

  const submission = await DolgozatSubmission.findById(submissionId);
  if (!submission) return { success: false, error: "Beadás nem található" };

  const dolgozat = await Dolgozat.findById(submission.dolgozatId);
  if (!dolgozat) return { success: false, error: "Dolgozat nem található" };
  if (!(await ensureLecturerCanAccessCourse(session, dolgozat.courseId.toString()))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  submission.points = undefined;
  submission.feedback = undefined;
  submission.gradedAt = undefined;
  submission.gradedBy = undefined;
  await submission.save();
  return { success: true };
}

// --- Student ---

export async function listPublishedDolgozatokForStudent(courseId: string) {
  const session = await getAuthSession();
  if (!(await ensureStudentCourseAccess(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }
  await connectDB();

  const dolgozatok = await Dolgozat.find({
    courseId,
    isPublished: true,
    isArchived: false,
  })
    .sort({ deadlineAt: 1, createdAt: -1 })
    .lean();

  const userId = session!.user!.id;
  const submissions = await DolgozatSubmission.find({
    dolgozatId: { $in: dolgozatok.map((d: any) => d._id) },
    userId,
  }).lean();

  const subMap = new Map((submissions as any[]).map((s) => [s.dolgozatId.toString(), s]));

  return dolgozatok.map((d: any) => {
    const sub = subMap.get(d._id.toString());
    const status = getSubmissionStatus(sub || null);
    return {
      ...serialize(d),
      _id: d._id.toString(),
      courseId: d.courseId.toString(),
      myStatus: status,
      myStatusLabel: STATUS_LABELS[status],
      myPoints: sub?.points ?? null,
      submittedAt: sub?.submittedAt || null,
      isIncomplete: isIncompleteStatus(status),
    };
  });
}

export async function getStudentDolgozatWithSubmission(dolgozatId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Bejelentkezés szükséges");

  await connectDB();
  const dolgozat = await Dolgozat.findById(dolgozatId).lean();
  if (!dolgozat || !(dolgozat as any).isPublished || (dolgozat as any).isArchived) {
    throw new Error("Dolgozat nem található");
  }
  const courseId = (dolgozat as any).courseId.toString();
  if (!(await ensureStudentCourseAccess(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }

  let submission = await DolgozatSubmission.findOne({
    dolgozatId,
    userId: session.user.id,
  }).lean();

  const editable = canEditSubmission(
    submission || { submittedAt: null, gradedAt: null },
    dolgozat as any
  );

  const photos = submission
    ? [...((submission as any).photos || [])].sort((a: any, b: any) => a.order - b.order)
    : [];

  return {
    dolgozat: serialize({
      ...(dolgozat as any),
      _id: (dolgozat as any)._id.toString(),
      courseId,
    }),
    submission: submission
      ? serialize({
          ...(submission as any),
          _id: (submission as any)._id.toString(),
          photos,
        })
      : null,
    status: getSubmissionStatus(submission),
    statusLabel: STATUS_LABELS[getSubmissionStatus(submission)],
    editable,
  };
}

export async function saveSubmissionPhotos(dolgozatId: string, photos: PhotoInput[]) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  if (photos.length > MAX_SUBMISSION_FILES) {
    return { success: false, error: `Maximum ${MAX_SUBMISSION_FILES} fájl engedélyezett` };
  }

  for (const p of photos) {
    if (!isAllowedSubmissionMime(p.contentType)) {
      return { success: false, error: "Érvénytelen fájltípus (kép, PDF vagy Word)" };
    }
  }

  await connectDB();
  const dolgozat = await Dolgozat.findById(dolgozatId);
  if (!dolgozat || !dolgozat.isPublished || dolgozat.isArchived) {
    return { success: false, error: "Dolgozat nem található" };
  }
  if (!(await ensureStudentCourseAccess(session, dolgozat.courseId.toString()))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  let submission = await DolgozatSubmission.findOne({
    dolgozatId,
    userId: session.user.id,
  });

  if (submission && !canEditSubmission(submission, dolgozat)) {
    return { success: false, error: "A beadás már nem szerkeszthető" };
  }

  const orderedPhotos = buildOrderedFiles(photos);

  if (!submission) {
    submission = await DolgozatSubmission.create({
      dolgozatId,
      courseId: dolgozat.courseId,
      userId: session.user.id,
      photos: orderedPhotos,
    });
  } else {
    submission.photos = orderedPhotos as any;
    await submission.save();
  }

  await tagGridFsForSubmission(
    orderedPhotos.map((p) => p.mediaId),
    submission._id.toString(),
    session.user.id
  );

  return { success: true, submissionId: submission._id.toString() };
}

export async function submitDolgozat(dolgozatId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  await connectDB();
  const dolgozat = await Dolgozat.findById(dolgozatId);
  if (!dolgozat || !dolgozat.isPublished || dolgozat.isArchived) {
    return { success: false, error: "Dolgozat nem található" };
  }
  if (!(await ensureStudentCourseAccess(session, dolgozat.courseId.toString()))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  const submission = await DolgozatSubmission.findOne({
    dolgozatId,
    userId: session.user.id,
  });
  if (!submission) return { success: false, error: "Nincs feltöltött fájl" };
  if (!canEditSubmission(submission, dolgozat)) {
    return { success: false, error: "A beadás már nem módosítható" };
  }
  if (!submission.photos?.length) {
    return { success: false, error: "Legalább egy fájl szükséges" };
  }

  const now = new Date();
  submission.submittedAt = now;
  submission.isLate = computeIsLate(now, dolgozat.deadlineAt);
  await submission.save();

  const student = await User.findById(session.user.id).select("name").lean();
  await createNotification({
    userId: dolgozat.authorId.toString(),
    type: "dolgozat_submitted",
    dolgozatId: dolgozat._id.toString(),
    submissionId: submission._id.toString(),
    courseId: dolgozat.courseId.toString(),
    message: `${(student as any)?.name || "Tanuló"} beadta: „${dolgozat.title}”`,
  });

  return { success: true };
}

// --- Notifications ---

export async function getNotifications(limit = 20) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { notifications: [], unreadCount: 0 };

  await connectDB();
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId: session.user.id, readAt: null }),
  ]);

  return {
    notifications: (notifications as any[]).map((n) => ({
      ...serialize(n),
      _id: n._id.toString(),
      dolgozatId: n.dolgozatId.toString(),
      courseId: n.courseId.toString(),
      submissionId: n.submissionId?.toString(),
    })),
    unreadCount,
  };
}

export async function markNotificationRead(notificationId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false };

  await connectDB();
  await Notification.updateOne(
    { _id: notificationId, userId: session.user.id },
    { readAt: new Date() }
  );
  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false };

  await connectDB();
  await Notification.updateMany(
    { userId: session.user.id, readAt: null },
    { readAt: new Date() }
  );
  return { success: true };
}

// --- Export ---

export async function exportDolgozatGrades(dolgozatId: string) {
  const session = await getAuthSession();
  await connectDB();

  const dolgozat = await Dolgozat.findById(dolgozatId).lean();
  if (!dolgozat || (dolgozat as any).isArchived) {
    return { success: false, error: "Dolgozat nem található" };
  }
  const courseId = (dolgozat as any).courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  const overview = await getDolgozatSubmissionsOverview(dolgozatId);
  const maxPoints = (dolgozat as any).maxPoints;

  const rows = overview.rows.map((r) => ({
    Név: r.name,
    Email: r.email,
    Státusz: r.statusLabel,
    Beadva: r.submittedAt ? new Date(r.submittedAt).toLocaleString("hu-HU") : "",
    Későn: r.isLate ? "Igen" : "Nem",
    Pont: r.points ?? "",
    "Max pont": maxPoints,
    Százalék: r.points != null ? `${Math.round((r.points / maxPoints) * 100)}%` : "",
    Visszajelzés: r.feedback || "",
    "Beadás forrása": r.uploadedOnBehalf ? "E-mail / oktató feltöltése" : "Rendszer",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Beadások");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `${(dolgozat as any).title.replace(/[^\w\s-]/g, "").slice(0, 40)}_beadások.xlsx`;

  return { success: true, base64, filename };
}

// --- Student: pending summary & email preference ---

export async function getStudentDolgozatPendingSummary(courseId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { pendingCount: 0, pendingIds: [] as string[], hasUrgent: false };
  if (!(await ensureStudentCourseAccess(session, courseId))) {
    return { pendingCount: 0, pendingIds: [] as string[], hasUrgent: false };
  }

  await connectDB();
  const dolgozatok = await Dolgozat.find({
    courseId,
    isPublished: true,
    isArchived: false,
  }).lean();

  const submissions = await DolgozatSubmission.find({
    dolgozatId: { $in: dolgozatok.map((d) => d._id) },
    userId: session.user.id,
  }).lean();

  const subMap = new Map(submissions.map((s) => [s.dolgozatId.toString(), s]));
  const now = Date.now();
  const urgentWindow = 48 * 60 * 60 * 1000;

  const pendingIds: string[] = [];
  let hasUrgent = false;

  for (const d of dolgozatok as any[]) {
    const status = getSubmissionStatus(subMap.get(d._id.toString()) || null);
    if (!isIncompleteStatus(status)) continue;
    pendingIds.push(d._id.toString());
    if (d.deadlineAt) {
      const deadline = new Date(d.deadlineAt).getTime();
      if (deadline > now && deadline - now <= urgentWindow) {
        hasUrgent = true;
      }
    }
  }

  return { pendingCount: pendingIds.length, pendingIds, hasUrgent };
}

export async function getDolgozatEmailPreference() {
  const session = await getAuthSession();
  if (!session?.user?.id) return { enabled: false };
  await connectDB();
  const user = await User.findById(session.user.id).select("dolgozatEmailNotifications").lean();
  return { enabled: !!(user as any)?.dolgozatEmailNotifications };
}

export async function updateDolgozatEmailPreference(enabled: boolean) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };
  await connectDB();
  await User.updateOne(
    { _id: session.user.id },
    { dolgozatEmailNotifications: enabled }
  );
  return { success: true };
}

// --- Lecturer/admin: on-behalf upload ---

export async function uploadSubmissionOnBehalf(
  dolgozatId: string,
  studentId: string,
  files: PhotoInput[],
  options?: { markSubmitted?: boolean; force?: boolean }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  if (files.length > MAX_SUBMISSION_FILES) {
    return { success: false, error: `Maximum ${MAX_SUBMISSION_FILES} fájl` };
  }
  for (const p of files) {
    if (!isAllowedSubmissionMime(p.contentType)) {
      return { success: false, error: "Érvénytelen fájltípus" };
    }
  }
  if (!files.length) return { success: false, error: "Legalább egy fájl szükséges" };

  await connectDB();
  const dolgozat = await Dolgozat.findById(dolgozatId);
  if (!dolgozat || dolgozat.isArchived) {
    return { success: false, error: "Dolgozat nem található" };
  }
  const courseId = dolgozat.courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  const enrolled = await getEnrolledStudentIds(courseId);
  if (!enrolled.includes(studentId)) {
    return { success: false, error: "A tanuló nincs beiratkozva a kurzusra" };
  }

  let submission = await DolgozatSubmission.findOne({ dolgozatId, userId: studentId });
  if (submission?.gradedAt && !options?.force) {
    return { success: false, error: "Értékelt beadás nem írható felül. Előbb vonja vissza az értékelést." };
  }
  if (submission?.submittedAt && !options?.force) {
    return { success: false, error: "Már van beadás. Használja a felülírás opciót." };
  }

  const orderedPhotos = buildOrderedFiles(files);
  const markSubmitted = options?.markSubmitted !== false;
  const now = new Date();

  if (!submission) {
    submission = await DolgozatSubmission.create({
      dolgozatId,
      courseId: dolgozat.courseId,
      userId: studentId,
      photos: orderedPhotos,
      uploadedOnBehalfBy: new mongoose.Types.ObjectId(session.user.id),
      uploadedOnBehalfAt: now,
      ...(markSubmitted
        ? {
            submittedAt: now,
            isLate: computeIsLate(now, dolgozat.deadlineAt),
          }
        : {}),
    });
  } else {
    submission.photos = orderedPhotos as any;
    submission.uploadedOnBehalfBy = new mongoose.Types.ObjectId(session.user.id);
    submission.uploadedOnBehalfAt = now;
    if (markSubmitted) {
      submission.submittedAt = now;
      submission.isLate = computeIsLate(now, dolgozat.deadlineAt);
    }
    await submission.save();
  }

  await tagGridFsForSubmission(
    orderedPhotos.map((p) => p.mediaId),
    submission._id.toString(),
    studentId
  );

  await createNotification({
    userId: studentId,
    type: "dolgozat_on_behalf",
    dolgozatId: dolgozat._id.toString(),
    submissionId: submission._id.toString(),
    courseId,
    message: `Az oktató feltöltötte a beadásodat: „${dolgozat.title}”`,
  });

  return { success: true, submissionId: submission._id.toString() };
}

// Tag submission photos in GridFS metadata (called after upload from client)
export async function tagSubmissionMedia(mediaId: string, submissionId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false };

  await connectDB();
  const submission = await DolgozatSubmission.findById(submissionId);
  if (!submission || submission.userId.toString() !== session.user.id) {
    return { success: false, error: "Nincs jogosultság" };
  }

  const db = mongoose.connection.db;
  if (!db) return { success: false };

  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });
  const files = await bucket.find({ _id: new mongoose.Types.ObjectId(mediaId) }).toArray();
  if (!files.length) return { success: false, error: "Fájl nem található" };

  await db.collection("uploads.files").updateOne(
    { _id: new mongoose.Types.ObjectId(mediaId) },
    {
      $set: {
        "metadata.submissionId": submissionId,
        "metadata.dolgozatProtected": true,
        "metadata.ownerId": session.user.id,
      },
    }
  );

  return { success: true };
}
