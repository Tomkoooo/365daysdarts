"use server";

import connectDB from "@/lib/db";
import Course from "@/models/Course";
import OptionSelector from "@/models/OptionSelector";
import User from "@/models/User";
import { getAuthSession } from "@/lib/session";
import {
  canChangeResponse,
  countResponsesForOption,
  getStudentSelectedOptionIds,
  hasStudentResponded,
  isPastDeadline,
} from "@/lib/option-selector-utils";
import mongoose from "mongoose";
import * as XLSX from "xlsx";

export type OptionSelectorOptionInput = {
  _id?: string;
  text: string;
  limit?: number;
};

export type OptionSelectorInput = {
  title: string;
  description?: string;
  allowMultiple?: boolean;
  options: OptionSelectorOptionInput[];
  deadlineAt?: string | null;
  isPublished?: boolean;
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

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

type NormalizedResponse = {
  _id?: string;
  studentId: string;
  optionId: string;
  createdAt?: Date | string;
};

type NormalizedSelector = {
  _id: string;
  courseId: string;
  authorId: string;
  title: string;
  description?: string;
  allowMultiple: boolean;
  options: { _id: string; text: string; limit: number }[];
  responses: NormalizedResponse[];
  deadlineAt?: string;
  isPublished: boolean;
  isArchived: boolean;
};

function normalizeSelector(doc: any): NormalizedSelector {
  const options = (doc.options || []).map((o: any) => ({
    _id: o._id.toString(),
    text: o.text,
    limit: o.limit ?? 0,
  }));
  const responses = (doc.responses || []).map((r: any) => ({
    _id: r._id?.toString(),
    studentId: r.studentId.toString(),
    optionId: r.optionId.toString(),
    createdAt: r.createdAt,
  }));
  return {
    ...serialize(doc),
    _id: doc._id.toString(),
    courseId: doc.courseId.toString(),
    authorId: doc.authorId.toString(),
    options,
    responses,
  };
}

// --- Lecturer CRUD ---

export async function listOptionSelectorsForCourse(courseId: string) {
  const session = await getAuthSession();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }
  await connectDB();

  const selectors = await OptionSelector.find({ courseId, isArchived: false })
    .sort({ createdAt: -1 })
    .lean();

  return selectors.map((s: any) => {
    const normalized = normalizeSelector(s);
    const responseCount = normalized.responses.length;
    const uniqueStudents = new Set(
      normalized.responses.map((r: NormalizedResponse) => r.studentId)
    ).size;
    return {
      ...normalized,
      stats: { responseCount, uniqueStudents, optionCount: normalized.options.length },
    };
  });
}

export async function getOptionSelectorById(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error("Bejelentkezés szükséges");

  await connectDB();
  const selector = await OptionSelector.findById(id).lean();
  if (!selector || (selector as any).isArchived) {
    throw new Error("Opcióválasztó nem található");
  }

  const courseId = (selector as any).courseId.toString();
  const isLecturer = await ensureLecturerCanAccessCourse(session, courseId);
  const isStudent = await ensureStudentCourseAccess(session, courseId);
  if (!isLecturer && !isStudent) throw new Error("Nincs jogosultság");

  const normalized = normalizeSelector(selector);

  if (isLecturer) {
    const studentIds = [
      ...new Set(normalized.responses.map((r: NormalizedResponse) => r.studentId)),
    ];
    const users = await User.find({ _id: { $in: studentIds } })
      .select("name email")
      .lean();
    const userMap = new Map(
      (users as any[]).map((u) => [u._id.toString(), { name: u.name, email: u.email }])
    );

    const responsesWithUsers = normalized.responses.map((r: NormalizedResponse) => ({
      ...r,
      studentName: userMap.get(r.studentId)?.name || "Ismeretlen",
      studentEmail: userMap.get(r.studentId)?.email || "",
    }));

    const optionsWithCounts = normalized.options.map((o) => ({
      ...o,
      count: countResponsesForOption(normalized.responses as any, o._id),
    }));

    return {
      ...normalized,
      options: optionsWithCounts,
      responses: responsesWithUsers,
    };
  }

  const myOptionIds = getStudentSelectedOptionIds(
    normalized.responses as any,
    session.user.id
  );
  const optionsWithAvailability = normalized.options.map((o) => {
    const count = countResponsesForOption(normalized.responses as any, o._id);
    const limit = o.limit ?? 0;
    const isFull = limit > 0 && count >= limit;
    return { ...o, count, isFull };
  });

  return {
    ...normalized,
    options: optionsWithAvailability,
    myOptionIds,
    hasResponded: myOptionIds.length > 0,
    canChange: canChangeResponse(normalized),
    isPastDeadline: isPastDeadline(normalized.deadlineAt),
  };
}

export async function createOptionSelector(courseId: string, input: OptionSelectorInput) {
  const session = await getAuthSession();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }
  if (!input.title?.trim()) {
    return { success: false, error: "A cím kötelező" };
  }
  if (!input.options?.length) {
    return { success: false, error: "Legalább egy opció szükséges" };
  }

  await connectDB();
  const doc = await OptionSelector.create({
    courseId,
    authorId: session!.user!.id,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    allowMultiple: input.allowMultiple ?? false,
    options: input.options.map((o) => ({
      text: o.text.trim(),
      limit: o.limit ?? 0,
    })),
    deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
    isPublished: input.isPublished ?? false,
  });

  return { success: true, id: doc._id.toString() };
}

export async function updateOptionSelector(id: string, input: OptionSelectorInput) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  await connectDB();
  const existing = await OptionSelector.findById(id);
  if (!existing || existing.isArchived) {
    return { success: false, error: "Opcióválasztó nem található" };
  }

  const courseId = existing.courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  if (!input.title?.trim()) {
    return { success: false, error: "A cím kötelező" };
  }

  const existingOptionIds = new Set(
    existing.options.map((o: { _id: { toString(): string } }) => o._id.toString())
  );
  const newOptions = input.options.map((o) => {
    if (o._id && existingOptionIds.has(o._id)) {
      const existingOpt = existing.options.id(o._id);
      if (existingOpt) {
        existingOpt.text = o.text.trim();
        existingOpt.limit = o.limit ?? 0;
        return existingOpt;
      }
    }
    return { text: o.text.trim(), limit: o.limit ?? 0 };
  });

  existing.title = input.title.trim();
  existing.description = input.description?.trim() || undefined;
  existing.allowMultiple = input.allowMultiple ?? false;
  existing.options = newOptions as any;
  existing.deadlineAt = input.deadlineAt ? new Date(input.deadlineAt) : undefined;
  existing.isPublished = input.isPublished ?? existing.isPublished;

  const keptOptionIds = new Set(
    existing.options.map((o: { _id: { toString(): string } }) => o._id.toString())
  );
  existing.responses = existing.responses.filter(
    (r: { optionId: { toString(): string } }) => keptOptionIds.has(r.optionId.toString())
  ) as any;

  await existing.save();
  return { success: true };
}

export async function archiveOptionSelector(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  await connectDB();
  const existing = await OptionSelector.findById(id);
  if (!existing) return { success: false, error: "Nem található" };

  const courseId = existing.courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  existing.isArchived = true;
  await existing.save();
  return { success: true };
}

// --- Student ---

export async function listPublishedOptionSelectorsForStudent(courseId: string) {
  const session = await getAuthSession();
  if (!(await ensureStudentCourseAccess(session, courseId))) {
    throw new Error("Nincs jogosultság");
  }
  await connectDB();

  const selectors = await OptionSelector.find({
    courseId,
    isPublished: true,
    isArchived: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  const userId = session!.user!.id;

  return selectors.map((s: any) => {
    const normalized = normalizeSelector(s);
    const myOptionIds = getStudentSelectedOptionIds(normalized.responses as any, userId);
    const optionsWithAvailability = normalized.options.map((o) => {
      const count = countResponsesForOption(normalized.responses as any, o._id);
      const limit = o.limit ?? 0;
      const isFull = limit > 0 && count >= limit;
      return { ...o, count, isFull };
    });
    const canChange = canChangeResponse(normalized);
    return {
      ...normalized,
      options: optionsWithAvailability,
      myOptionIds,
      hasResponded: myOptionIds.length > 0,
      needsResponse: myOptionIds.length === 0,
      canChange,
      isPastDeadline: isPastDeadline(normalized.deadlineAt),
    };
  });
}

export async function submitStudentResponse(
  optionSelectorId: string,
  optionIds: string[]
) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  if (!optionIds.length) {
    return { success: false, error: "Válassz legalább egy opciót" };
  }

  await connectDB();
  const selector = await OptionSelector.findById(optionSelectorId);
  if (!selector || !selector.isPublished || selector.isArchived) {
    return { success: false, error: "Opcióválasztó nem található" };
  }

  const courseId = selector.courseId.toString();
  if (!(await ensureStudentCourseAccess(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  if (!selector.allowMultiple && optionIds.length > 1) {
    return { success: false, error: "Csak egy opció választható" };
  }

  if (!canChangeResponse(selector)) {
    return { success: false, error: "A határidő lejárt, módosítás nem lehetséges" };
  }

  const validOptionIds = new Set(
    selector.options.map((o: { _id: { toString(): string } }) => o._id.toString())
  );
  for (const oid of optionIds) {
    if (!validOptionIds.has(oid)) {
      return { success: false, error: "Érvénytelen opció" };
    }
  }

  const studentId = session.user.id;
  const otherResponses = selector.responses.filter(
    (r: { studentId: { toString(): string } }) => r.studentId.toString() !== studentId
  );

  for (const oid of optionIds) {
    const opt = selector.options.id(oid);
    if (!opt) continue;
    const limit = opt.limit ?? 0;
    if (limit > 0) {
      const currentCount = countResponsesForOption(otherResponses as any, oid);
      if (currentCount >= limit) {
        return {
          success: false,
          error: `"${opt.text}" már betelt (${limit} fő)`,
        };
      }
    }
  }

  const newResponses = optionIds.map((oid) => ({
    studentId: new mongoose.Types.ObjectId(studentId),
    optionId: new mongoose.Types.ObjectId(oid),
    createdAt: new Date(),
  }));

  selector.responses = [...otherResponses, ...newResponses] as any;
  await selector.save();

  return { success: true };
}

export async function updateOptionSelectorResponse(
  optionSelectorId: string,
  responseId: string,
  newOptionId: string
) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  await connectDB();
  const selector = await OptionSelector.findById(optionSelectorId);
  if (!selector || selector.isArchived) {
    return { success: false, error: "Opcióválasztó nem található" };
  }

  const courseId = selector.courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  const response = selector.responses.id(responseId);
  if (!response) return { success: false, error: "Jelentkezés nem található" };

  const opt = selector.options.id(newOptionId);
  if (!opt) return { success: false, error: "Érvénytelen opció" };

  if (response.optionId.toString() === newOptionId) {
    return { success: true };
  }

  const otherResponses = selector.responses.filter(
    (r: { _id: { toString(): string } }) => r._id.toString() !== responseId
  );
  const limit = opt.limit ?? 0;
  if (limit > 0) {
    const currentCount = countResponsesForOption(otherResponses as any, newOptionId);
    if (currentCount >= limit) {
      return {
        success: false,
        error: `"${opt.text}" már betelt (${limit} fő)`,
      };
    }
  }

  response.optionId = new mongoose.Types.ObjectId(newOptionId);
  await selector.save();
  return { success: true };
}

export async function deleteOptionSelectorResponse(
  optionSelectorId: string,
  responseId: string
) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: "Bejelentkezés szükséges" };

  await connectDB();
  const selector = await OptionSelector.findById(optionSelectorId);
  if (!selector || selector.isArchived) {
    return { success: false, error: "Opcióválasztó nem található" };
  }

  const courseId = selector.courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  const before = selector.responses.length;
  selector.responses = selector.responses.filter(
    (r: { _id: { toString(): string } }) => r._id.toString() !== responseId
  ) as any;

  if (selector.responses.length === before) {
    return { success: false, error: "Jelentkezés nem található" };
  }

  await selector.save();
  return { success: true };
}

export async function exportOptionSelectorResponses(optionSelectorId: string) {
  const session = await getAuthSession();
  await connectDB();

  const selector = await OptionSelector.findById(optionSelectorId).lean();
  if (!selector || (selector as any).isArchived) {
    return { success: false, error: "Opcióválasztó nem található" };
  }

  const courseId = (selector as any).courseId.toString();
  if (!(await ensureLecturerCanAccessCourse(session, courseId))) {
    return { success: false, error: "Nincs jogosultság" };
  }

  const normalized = normalizeSelector(selector);
  const studentIds = [
    ...new Set(normalized.responses.map((r: NormalizedResponse) => r.studentId)),
  ];
  const users = await User.find({ _id: { $in: studentIds } })
    .select("name email")
    .lean();
  const userMap = new Map(
    (users as any[]).map((u) => [u._id.toString(), { name: u.name, email: u.email }])
  );
  const optionMap = new Map(normalized.options.map((o) => [o._id, o.text]));

  const rows = normalized.responses.map((r: NormalizedResponse) => {
    const user = userMap.get(r.studentId);
    return {
      Név: user?.name || "",
      Email: user?.email || "",
      Opció: optionMap.get(r.optionId) || "",
      "Jelentkezés ideje": r.createdAt
        ? new Date(r.createdAt).toLocaleString("hu-HU")
        : "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jelentkezések");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `${(selector as any).title.replace(/[^\w\s-]/g, "").slice(0, 40)}_jelentkezesek.xlsx`;

  return { success: true, base64, filename };
}

export async function getStudentOptionSelectorPendingSummary(courseId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { pendingCount: 0, pendingIds: [] as string[] };
  }
  if (!(await ensureStudentCourseAccess(session, courseId))) {
    return { pendingCount: 0, pendingIds: [] as string[] };
  }

  await connectDB();
  const selectors = await OptionSelector.find({
    courseId,
    isPublished: true,
    isArchived: false,
  }).lean();

  const userId = session.user.id;
  const pendingIds: string[] = [];

  for (const s of selectors as any[]) {
    const normalized = normalizeSelector(s);
    if (!hasStudentResponded(normalized.responses as any, userId)) {
      pendingIds.push(normalized._id);
    }
  }

  return { pendingCount: pendingIds.length, pendingIds };
}

export async function getCourseActionWarningCounts(courseIds: string[]) {
  const session = await getAuthSession();
  if (!session?.user?.id || courseIds.length === 0) {
    return {} as Record<string, { dolgozatWarningCount: number; optionWarningCount: number }>;
  }

  await connectDB();
  const Dolgozat = (await import("@/models/Dolgozat")).default;
  const DolgozatSubmission = (await import("@/models/DolgozatSubmission")).default;
  const { getSubmissionStatus, isIncompleteStatus } = await import("@/lib/dolgozat-utils");

  const userId = session.user.id;
  const result: Record<string, { dolgozatWarningCount: number; optionWarningCount: number }> =
    {};

  for (const courseId of courseIds) {
    result[courseId] = { dolgozatWarningCount: 0, optionWarningCount: 0 };
  }

  const hasAccess =
    session.user.role === "admin" ||
    session.user.subscriptionStatus === "active";
  if (!hasAccess) return result;

  const user = await User.findById(userId).select("progress").lean();
  const progress = (user as any)?.progress;
  const progressObj = progress instanceof Map ? Object.fromEntries(progress) : progress || {};

  const accessibleIds = courseIds.filter((id) => progressObj[id] || session.user?.role === "admin");
  if (accessibleIds.length === 0) return result;

  const [dolgozatok, selectors, submissions] = await Promise.all([
    Dolgozat.find({
      courseId: { $in: accessibleIds },
      isPublished: true,
      isArchived: false,
    }).lean(),
    OptionSelector.find({
      courseId: { $in: accessibleIds },
      isPublished: true,
      isArchived: false,
    }).lean(),
    DolgozatSubmission.find({
      courseId: { $in: accessibleIds },
      userId,
    }).lean(),
  ]);

  const subMap = new Map(
    (submissions as any[]).map((s) => [`${s.courseId}:${s.dolgozatId}`, s])
  );

  for (const d of dolgozatok as any[]) {
    const cid = d.courseId.toString();
    const sub = subMap.get(`${cid}:${d._id}`);
    const status = getSubmissionStatus(sub || null);
    if (isIncompleteStatus(status)) {
      result[cid].dolgozatWarningCount += 1;
    }
  }

  for (const s of selectors as any[]) {
    const cid = s.courseId.toString();
    const normalized = normalizeSelector(s);
    if (!hasStudentResponded(normalized.responses as any, userId)) {
      result[cid].optionWarningCount += 1;
    }
  }

  return result;
}
