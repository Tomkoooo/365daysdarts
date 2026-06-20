"use server"

import connectDB from "@/lib/db";
import Question from "@/models/Question";
import Module from "@/models/Module"; // Added
import Course from "@/models/Course"; // Added
import { getAuthSession } from "@/lib/session";
import mongoose from "mongoose"; // Added

import ExamResult from "@/models/ExamResult";
import User from "@/models/User";
import Dolgozat from "@/models/Dolgozat";
import DolgozatSubmission from "@/models/DolgozatSubmission";
import OptionSelector from "@/models/OptionSelector";
import { getModuleIdsWithQuestions, isEligibleForFinalExam } from "@/lib/module-exams";
import { getSubmissionStatus, STATUS_LABELS } from "@/lib/dolgozat-utils";
import * as XLSX from "xlsx";

// --- Practice Mode ---

export async function getPracticeQuestions() {
  const session = await getAuthSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await connectDB();

  // Get 10 random questions
  const questions = await Question.aggregate([
    { $sample: { size: 10 } }
  ]);

  // Format and serialize
  const formattedQuestions = questions.map((q: any) => ({
    id: q._id.toString(),
    text: q.text,
    options: q.options,
    // Support multiple correct options
    correctOptions: q.correctOptions || (q.correctOption !== undefined ? [q.correctOption] : [])
  }));

  return formattedQuestions;
}

// --- Module Exam Mode ---

export async function startModuleExam(moduleId: string) {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();

    const module = await Module.findById(moduleId);
    if (!module) throw new Error("Module not found");

    const settings = module.quizSettings || { questionCount: 10, timeLimit: 30, passingScore: 75 };

    // Check if player already passed this module
    const userId = session.user.id;
    const User = (await import("@/models/User")).default;
    const user = await User.findById(userId);
    const progress = user?.progress?.get(module.courseId.toString());
    if (progress?.completedModules?.includes(moduleId)) {
        return { error: "Ezt a vizsgát már sikeresen teljesítetted!" };
    }
    
    // Fetch random questions from this module
    const questions = await Question.aggregate([
        { $match: { moduleId: new mongoose.Types.ObjectId(moduleId) } },
        { $sample: { size: settings.questionCount } }
    ]);

    if (questions.length === 0) {
        return { error: "No questions found in this module. Please ask the lecturer to add questions." };
    }

    const newExam = await ExamResult.create({
        userId: userId,
        courseId: module.courseId,
        moduleId: moduleId,
        type: "module",
        score: 0,
        totalQuestions: questions.length,
        answers: [],
        questionIds: questions.map((q: any) => q._id),
        startedAt: new Date()
    });

    const formattedQuestions = questions.map((q: any) => ({
        id: q._id.toString(),
        text: q.text,
        options: q.options,
        // No correct options
    }));

    return {
        examId: newExam._id.toString(),
        questions: formattedQuestions,
        startTime: newExam.startedAt,
        timeLimit: settings.timeLimit
    };
}


// --- Final Exam Mode ---

export async function startFinalExam(courseId: string) {
  const session = await getAuthSession();

  if (!session) throw new Error("Unauthorized");

  await connectDB();

  // 1. Get Course Settings
  const course = await Course.findById(courseId).populate('modules');
  if (!course) throw new Error("Course not found");

  const settings = course.finalExamSettings || { questionCount: 20, passingScore: 75, maxRetries: 3, timeLimit: 60 };

  // 2. Check Attempts / Retries
  const attempts = await ExamResult.countDocuments({
      userId: session.user.id,
      courseId: courseId,
      type: "final",
      completedAt: { $ne: null }
  });

  // Get User Progress to check for extra granted attempts
  const userId = session.user.id;
  const user = userId ? await User.findById(userId) : null;
  const courseProgress = user?.progress?.get(courseId.toString()) || {};
  const extraRetries = courseProgress.extraRetries || 0;

  const completedModules = (courseProgress.completedModules || []).map((id: string) => id.toString());
  const moduleIds = course.modules.map((m: any) => (m._id ? m._id.toString() : m.toString()));
  const modulesRequiringExam = Array.from(await getModuleIdsWithQuestions(moduleIds));
  const finalExamUnlocked = !!courseProgress.finalExamUnlocked;

  if (!isEligibleForFinalExam(completedModules, modulesRequiringExam, finalExamUnlocked)) {
      return { error: "HIBA: A záróvizsga megkezdése előtt minden modulzáró vizsgát sikeresen teljesítened kell!" };
  }

  // If retries are limited, check limit
  const maxRetries = settings.maxRetries || 3;
  if (attempts >= (maxRetries + extraRetries)) {
      return { error: `HIBA: Elérted a maximális vizsgaszámot (${maxRetries + extraRetries}). Kérlek vedd fel a kapcsolatot az oktatóval!` };
  }

  // Check for active unfinished exam
  const activeExam = await ExamResult.findOne({
    userId: session.user.id,
    courseId: courseId,
    type: "final",
    completedAt: null
  });

  // Deterministic resume: if active exam already has a fixed question set, reuse it.
  if (activeExam?.questionIds?.length) {
      const idOrder = activeExam.questionIds.map((id: any) => id.toString());
      const storedQuestions = await Question.find({ _id: { $in: idOrder } }).lean();
      const byId = new Map(storedQuestions.map((q: any) => [q._id.toString(), q]));
      const orderedQuestions = idOrder.map((id: string) => byId.get(id)).filter(Boolean);

      const formattedQuestions = orderedQuestions.map((q: any) => ({
          id: q._id.toString(),
          text: q.text,
          options: q.options,
      }));

      return {
          examId: activeExam._id.toString(),
          questions: formattedQuestions,
          startTime: activeExam.startedAt,
          resume: true,
          timeLimit: settings.timeLimit || 60
      };
  }

  // 3. Question Generation Logic
  const modules = course.modules || [];
  if (modules.length === 0) return { error: "HIBA: Ehhez a kurzushoz nincsenek modulok rendelve." };

  let finalQuestions: any[] = [];
  const mode = settings.structure?.mode || 'legacy';

  if (mode === 'per_module') {
      const counts = settings.structure?.moduleCounts || [];
      for (const item of counts) {
          if (item.count > 0) {
              const questions = await Question.aggregate([
                  { $match: { moduleId: new mongoose.Types.ObjectId(item.moduleId) } },
                  { $sample: { size: item.count } }
              ]);
              finalQuestions = [...finalQuestions, ...questions];
          }
      }
  } else if (mode === 'per_chapter') {
      const counts = settings.structure?.chapterCounts || [];
      for (const item of counts) {
          if (item.count > 0) {
              const questions = await Question.aggregate([
                  { $match: { chapterId: new mongoose.Types.ObjectId(item.chapterId) } },
                  { $sample: { size: item.count } }
              ]);
              finalQuestions = [...finalQuestions, ...questions];
          }
      }
  } else {
      // LEGACY / BALANCED
      const moduleIds = modules.map((m: any) => m._id ? m._id.toString() : m.toString());
      const objectIdModuleIds = moduleIds.map((id: string) => new mongoose.Types.ObjectId(id));
      
      const allPoolQuestions = await Question.find({ 
          moduleId: { $in: objectIdModuleIds } 
      }).lean();

      if (allPoolQuestions.length === 0) {
           return { error: "HIBA: Nincsenek kérdések." };
      }

      if (allPoolQuestions.length <= settings.questionCount) {
          finalQuestions = allPoolQuestions;
      } else {
          const byModule: Record<string, any[]> = {};
          moduleIds.forEach((id: string) => { byModule[id] = []; });
          allPoolQuestions.forEach((q: any) => {
              const mId = q.moduleId?.toString();
              if (mId && byModule[mId]) byModule[mId].push(q);
          });

          const countPerModule = Math.floor(settings.questionCount / moduleIds.length);
          const remainderInitial = settings.questionCount % moduleIds.length;
          let extraNeeded = 0;

          moduleIds.forEach((mId: string, i: number) => {
              const pool = byModule[mId];
              const targetSize = countPerModule + (i < remainderInitial ? 1 : 0);
              
              if (pool.length <= targetSize) {
                  finalQuestions = [...finalQuestions, ...pool];
                  extraNeeded += (targetSize - pool.length);
              } else {
                  const sampled = pool.sort(() => 0.5 - Math.random()).slice(0, targetSize);
                  finalQuestions = [...finalQuestions, ...sampled];
              }
          });

          if (extraNeeded > 0) {
              const currentIds = new Set(finalQuestions.map(q => q._id.toString()));
              const availableFallback = allPoolQuestions.filter(q => !currentIds.has(q._id.toString()));
              const extraSample = availableFallback.sort(() => 0.5 - Math.random()).slice(0, extraNeeded);
              finalQuestions = [...finalQuestions, ...extraSample];
          }
      }
  }

  // Common: Check if we have questions
  if (finalQuestions.length === 0) {
      return { error: "HIBA: Nem sikerült kérdéseket generálni. Ellenőrizze a beállításokat vagy a kérdésbankot." };
  }

  // Shuffle final selection
  finalQuestions = finalQuestions.sort(() => 0.5 - Math.random());

  const formattedQuestions = finalQuestions.map((q: any) => ({
    id: q._id.toString(),
    text: q.text,
    options: q.options,
  }));

  if (activeExam) {
       activeExam.questionIds = finalQuestions.map((q: any) => q._id);
       activeExam.totalQuestions = finalQuestions.length;
       await activeExam.save();

       return { 
           examId: activeExam._id.toString(), 
           questions: formattedQuestions, 
           startTime: activeExam.startedAt, 
           resume: true,
           timeLimit: settings.timeLimit || 60
       };
  }

  // 4. Create Exam Record
  const newExam = await ExamResult.create({
    userId: session?.user?.id, 
    courseId: courseId,
    type: "final",
    score: 0,
    totalQuestions: finalQuestions.length,
    answers: [],
    questionIds: finalQuestions.map((q: any) => q._id),
    startedAt: new Date()
  });

  return { 
    examId: newExam._id.toString(), 
    questions: formattedQuestions,
    startTime: newExam.startedAt,
    timeLimit: settings.timeLimit || 60
  };
}


export async function submitModuleExam(examId: string, answers: Record<string, number[]>) {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();

    const exam = await ExamResult.findById(examId);
    if (!exam) throw new Error("Exam not found");
    if (exam.completedAt) throw new Error("Exam already submitted");
    if (exam.userId?.toString() !== session.user.id) throw new Error("Unauthorized");

    // Calculate Score
    let correctCount = 0;
    const answerDetails = [];
    
    const questionIds = (exam.questionIds || []).map((id: any) => id.toString());
    const idsForLookup = questionIds.length > 0 ? questionIds : Object.keys(answers);
    const questions = await Question.find({ _id: { $in: idsForLookup } });

    for (const q of questions) {
        const selectedIndices = answers[q._id.toString()] || [];
        const correctIndices = q.correctOptions || (q.correctOption !== undefined ? [q.correctOption] : []);
        
        const selectedSorted = [...selectedIndices].sort();
        const correctSorted = [...correctIndices].sort();

        const isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctSorted);
        if (isCorrect) correctCount++;

        answerDetails.push({
            questionId: q._id,
            selectedOptions: selectedIndices,
            isCorrect
        });
    }

    const score = Math.round((correctCount / (idsForLookup.length || 1)) * 100);

    // Get Module settings to check pass
    const module = await Module.findById(exam.moduleId);
    const passingScore = module?.quizSettings?.passingScore || 75;
    const passed = score >= passingScore;

    // Update Exam Result
    exam.score = score;
    exam.completedAt = new Date();
    exam.answers = answerDetails;
    exam.totalQuestions = idsForLookup.length;
    await exam.save();

    // If passed, we could update User progress here to unlock next?
    // User progress is stored as Map<courseId, data>
    // For now we just return the result and let the frontend handle the next step logic or update DB here if we want to be secure.
    // Let's update DB progress for security.
    if (passed && session?.user?.id) {
        const user = await User.findById(session.user.id);
        // Ensure progress map exists
        if (!user.progress) user.progress = new Map();
        
        let courseProgress = user.progress.get(exam.courseId.toString()) || { completedModules: [], completedPages: [] };
        // Mongoose Map special handling might be needed, but for now assuming POJO struct inside
        // Add to completedModules if not there
        if (!courseProgress.completedModules) courseProgress.completedModules = [];
        const currentModuleId = exam.moduleId?.toString();
        if (currentModuleId && !courseProgress.completedModules.includes(currentModuleId)) {
            courseProgress.completedModules.push(currentModuleId);
        }
       
        // Mongoose Map set
        user.progress.set(exam.courseId.toString(), courseProgress);
        user.markModified('progress');
        await user.save();
        console.log(`[submitModuleExam] Progress saved for course ${exam.courseId}, modules:`, courseProgress.completedModules);
    }

    return { success: true, score, passed, passingScore };
}

export async function submitFinalExam(examId: string, answers: Record<string, number[]>) {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();

    const exam = await ExamResult.findById(examId);
    if (!exam) throw new Error("Exam not found");

    if (exam.completedAt) throw new Error("Exam already submitted");
    if (exam.userId?.toString() !== session.user.id) throw new Error("Unauthorized");

    // Check Time Limit (1 Hour)
    const now = new Date();
    const startTime = new Date(exam.startedAt);
    const diffMs = now.getTime() - startTime.getTime();
    if (diffMs > 3600 * 1000 + 60000) { // 1h + 1m buffer
        // Time expired logic - maybe force submit or fail?
        // For this MVP, we accepting it but marking strict
    }

    // Calculate Score
    let correctCount = 0;
    const answerDetails = [];
    
    const questionIds = (exam.questionIds || []).map((id: any) => id.toString());
    const idsForLookup = questionIds.length > 0 ? questionIds : Object.keys(answers);
    const questions = await Question.find({ _id: { $in: idsForLookup } });

    for (const q of questions) {
        const selectedIndices = answers[q._id.toString()] || [];
        const correctIndices = q.correctOptions || (q.correctOption !== undefined ? [q.correctOption] : []);
        
        // Exact match required for multiple choice
        // Sort both to compare
        const selectedSorted = [...selectedIndices].sort();
        const correctSorted = [...correctIndices].sort();

        const isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctSorted);
        
        if (isCorrect) correctCount++;

        answerDetails.push({
            questionId: q._id,
            selectedOptions: selectedIndices,
            isCorrect
        });
    }

    const score = Math.round((correctCount / (idsForLookup.length || 1)) * 100);

    // Update Exam Result
    exam.score = score;
    exam.completedAt = now;
    exam.answers = answerDetails;
    exam.totalQuestions = idsForLookup.length;
    await exam.save();

    const course = await Course.findById(exam.courseId).select("finalExamSettings");
    const passingScore = course?.finalExamSettings?.passingScore || 75;
    const passed = score >= passingScore;

    // If final exam passed, mark course as completed in progress
    if (passed && session?.user?.id) {
        const user = await User.findById(session.user.id);
        if (user) {
            if (!user.progress) user.progress = new Map();
            let courseProgress = user.progress.get(exam.courseId.toString()) || { completedModules: [], completedPages: [] };
            courseProgress.finalExamPassed = true;
            courseProgress.courseCompleted = true; // Mark as fully completed
            user.progress.set(exam.courseId.toString(), courseProgress);
            user.markModified('progress');
            await user.save();
        }
    }

    return { success: true, score, passed, passingScore };
}

// --- Lecturer Actions ---

async function getScopedCourseIds(session: any): Promise<string[]> {
    if (session?.user?.role === "admin") {
        const courses = await Course.find({}).select("_id").lean();
        return courses.map((c: any) => c._id.toString());
    }

    const courses = await Course.find({ authorId: session?.user?.id }).select("_id").lean();
    return courses.map((c: any) => c._id.toString());
}

async function ensureLecturerCanAccessCourse(session: any, courseId: string) {
    if (session?.user?.role === "admin") return true;
    const course = await Course.findById(courseId).select("authorId").lean();
    return !!course && course.authorId?.toString() === session?.user?.id;
}

function formatHuDate(value: Date | string | null | undefined) {
    if (!value) return "";
    return new Date(value).toLocaleString("hu-HU");
}

function progressObject(progress: unknown): Record<string, any> {
    if (!progress) return {};
    if (progress instanceof Map) return Object.fromEntries(progress);
    return progress as Record<string, any>;
}

async function getStudentDolgozatStatusForCourse(studentId: string, courseId: string) {
    const dolgozatok = await Dolgozat.find({
        courseId,
        isArchived: false,
        isPublished: true,
    })
        .select("_id title maxPoints deadlineAt")
        .sort({ createdAt: 1 })
        .lean();

    const submissions = await DolgozatSubmission.find({ courseId, userId: studentId }).lean();
    const submissionByDolgozat = new Map(
        submissions.map((sub: any) => [sub.dolgozatId.toString(), sub])
    );

    return dolgozatok.map((dolgozat: any) => {
        const submission = submissionByDolgozat.get(dolgozat._id.toString()) || null;
        const status = getSubmissionStatus(submission);
        return {
            id: dolgozat._id.toString(),
            title: dolgozat.title,
            status,
            statusLabel: STATUS_LABELS[status],
            isSubmitted: !!submission?.submittedAt,
            submittedAt: submission?.submittedAt || null,
            isLate: submission?.isLate || false,
            points: submission?.points ?? null,
            maxPoints: dolgozat.maxPoints ?? null,
            uploadedOnBehalf: !!submission?.uploadedOnBehalfBy,
            photoCount: submission?.photos?.length || 0,
        };
    });
}

function normalizeObjectId(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
        const asString = (value as { toString(): string }).toString();
        if (/^[a-f0-9]{24}$/i.test(asString)) return asString;

        const inner = (value as { _id?: unknown })._id;
        if (inner != null && inner !== value) {
            return normalizeObjectId(inner);
        }
    }
    return String(value);
}

async function getStudentOptionSelectionsForCourse(studentId: string, courseId: string) {
    const normalizedStudentId = normalizeObjectId(studentId);
    const selectors = await OptionSelector.find({
        courseId,
        isArchived: false,
        isPublished: true,
    })
        .select("_id title allowMultiple options responses deadlineAt")
        .sort({ createdAt: 1 })
        .lean();

    return selectors.map((selector: any) => {
        const optionMap = new Map(
            (selector.options || []).map((option: any) => [normalizeObjectId(option._id), option.text])
        );
        const studentResponses = (selector.responses || []).filter(
            (response: any) => normalizeObjectId(response.studentId) === normalizedStudentId
        );
        const selectedIds = studentResponses.map((response: any) => normalizeObjectId(response.optionId));
        const selectedOptions = selectedIds.map((id: string) => optionMap.get(id) || "Ismeretlen");
        let latestResponseAt: Date | null = null;
        for (const response of studentResponses) {
            if (!response.createdAt) continue;
            const createdAt = new Date(response.createdAt);
            if (!latestResponseAt || createdAt > latestResponseAt) {
                latestResponseAt = createdAt;
            }
        }

        return {
            id: selector._id.toString(),
            title: selector.title,
            allowMultiple: !!selector.allowMultiple,
            hasResponded: selectedIds.length > 0,
            selectedOptions,
            selectionText: selectedOptions.length > 0 ? selectedOptions.join(", ") : null,
            respondedAt: latestResponseAt,
        };
    });
}

function buildModuleSummaryText(modules: Array<{ title: string; status: string; bestScore: number | null }>) {
    const statusLabels: Record<string, string> = {
        passed: "Sikeres",
        manual: "Manuális pass",
        failed: "Sikertelen",
        no_exam: "Nincs vizsga",
        not_attempted: "Nincs kitöltve",
    };

    return modules
        .map((module) => {
            const label = statusLabels[module.status] || module.status;
            const scorePart = module.bestScore !== null ? ` (${module.bestScore}%)` : "";
            return `${module.title}: ${label}${scorePart}`;
        })
        .join("; ");
}

type ActivityEventRecord = {
    timestamp: Date;
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    eventType: string;
    description: string;
    details: string;
};

function buildModuleDetailsForStudent(
    course: any,
    progress: any,
    studentExams: any[],
    modulesWithQuestions: Set<string>
) {
    const completedModules = (progress.completedModules || []).map((id: string) => id.toString());

    return ((course.modules || []) as any[])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((module) => {
            const moduleId = module._id.toString();
            const hasExam = modulesWithQuestions.has(moduleId);
            const passingScore = module.quizSettings?.passingScore || 75;
            const moduleAttempts = studentExams
                .filter((exam) => exam.type === "module" && normalizeObjectId(exam.moduleId) === moduleId)
                .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
            const passedAttempt = moduleAttempts.find((exam) => exam.score >= passingScore);
            const bestAttempt = passedAttempt || moduleAttempts[0] || null;
            const isManuallyPassed = (progress.manualModulePasses || []).includes(moduleId);
            const isPassed = completedModules.includes(moduleId);

            let status = "not_attempted";
            if (!hasExam) status = "no_exam";
            else if (isManuallyPassed) status = "manual";
            else if (isPassed && passedAttempt) status = "passed";
            else if (moduleAttempts.length > 0) status = "failed";
            else if (isPassed) status = "passed";

            return {
                title: module.title,
                status,
                bestScore: bestAttempt ? bestAttempt.score : null,
            };
        });
}

function buildStudentSummaryRow(
    student: any,
    course: any,
    progress: any,
    studentExams: any[],
    modulesWithQuestions: Set<string>,
    courseDolgozatok: any[],
    courseSelectors: any[],
    submissionMap: Map<string, any>
) {
    const completedModules = (progress.completedModules || []).map((id: string) => id.toString());
    const modulesRequiringExam = (course.modules || [])
        .map((module: any) => module._id.toString())
        .filter((id: string) => modulesWithQuestions.has(id));
    const completedRequiredModules = completedModules.filter((id: string) =>
        modulesWithQuestions.has(id)
    );
    const totalPages = (course.modules || []).reduce((sum: number, module: any) => {
        return sum + (module.chapters || []).reduce(
            (chapterSum: number, chapter: any) => chapterSum + (chapter.pages?.length || 0),
            0
        );
    }, 0);

    const finalExams = studentExams
        .filter((exam) => exam.type === "final" && exam.completedAt)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    const latestFinal = finalExams[0] || null;
    const finalPassingScore = course.finalExamSettings?.passingScore || 75;
    const moduleDetails = buildModuleDetailsForStudent(course, progress, studentExams, modulesWithQuestions);

    const row: Record<string, string | number> = {
        Név: student.name || "",
        Email: student.email || "",
        "Aktív profil": student.subscriptionStatus === "active" ? "Igen" : "Nem",
        Kurzus: course.title || "",
        "Utolsó aktivitás": formatHuDate(progress.lastViewedAt),
        "Oldalak teljesítve": `${(progress.completedPages || []).length} / ${totalPages}`,
        "Modulzárók teljesítve": `${completedRequiredModules.length} / ${modulesRequiringExam.length}`,
        "Modulok részletei": buildModuleSummaryText(moduleDetails),
        "Záróvizsga eredmény": latestFinal ? `${latestFinal.score}%` : "Nincs",
        "Záróvizsga sikeres": latestFinal
            ? latestFinal.score >= finalPassingScore
                ? "Igen"
                : "Nem"
            : "Nincs",
        "Záróvizsga kísérletek": finalExams.length,
        "Beadandók beadva": "",
        "Opcióválasztások": "",
    };

    const submittedDolgozatLabels: string[] = [];
    for (const dolgozat of courseDolgozatok) {
        const submission = submissionMap.get(`${normalizeObjectId(student._id)}-${normalizeObjectId(dolgozat._id)}`) || null;
        const status = getSubmissionStatus(submission);
        const statusLabel = STATUS_LABELS[status];
        const source = submission?.uploadedOnBehalfBy ? " (oktató feltöltötte)" : "";
        row[`Beadandó: ${dolgozat.title}`] = `${statusLabel}${source}`;
        if (submission?.submittedAt) submittedDolgozatLabels.push(dolgozat.title);
    }
    row["Beadandók beadva"] = courseDolgozatok.length
        ? `${submittedDolgozatLabels.length} / ${courseDolgozatok.length}`
        : "Nincs beadandó";

    const respondedSelectors: string[] = [];
    for (const selector of courseSelectors) {
        const optionMap = new Map(
            (selector.options || []).map((option: any) => [normalizeObjectId(option._id), option.text])
        );
        const studentResponses = (selector.responses || []).filter(
            (response: any) => normalizeObjectId(response.studentId) === normalizeObjectId(student._id)
        );
        const selectedOptions = studentResponses.map(
            (response: any) => optionMap.get(normalizeObjectId(response.optionId)) || "Ismeretlen"
        );
        row[`Opció: ${selector.title}`] = selectedOptions.length ? selectedOptions.join(", ") : "Nincs válasz";
        if (selectedOptions.length > 0) respondedSelectors.push(selector.title);
    }
    row["Opcióválasztások"] = courseSelectors.length
        ? `${respondedSelectors.length} / ${courseSelectors.length}`
        : "Nincs opcióválasztó";

    return row;
}

function buildStudentActivityEvents(
    student: any,
    course: any,
    progress: any,
    studentExams: any[],
    courseDolgozatok: any[],
    courseSelectors: any[],
    submissionMap: Map<string, any>,
    moduleTitleById: Map<string, string>
): ActivityEventRecord[] {
    const events: ActivityEventRecord[] = [];
    const studentName = student.name || "";
    const studentEmail = student.email || "";
    const courseTitle = course.title || "";

    if (progress.lastViewedAt) {
        events.push({
            timestamp: new Date(progress.lastViewedAt),
            studentName,
            studentEmail,
            courseTitle,
            eventType: "Tananyag aktivitás",
            description: "Utolsó tananyag megtekintés",
            details: `${(progress.completedPages || []).length} oldal megtekintve`,
        });
    }

    for (const exam of studentExams) {
        const moduleTitle = exam.moduleId
            ? moduleTitleById.get(normalizeObjectId(exam.moduleId)) || "Ismeretlen modul"
            : null;
        const examLabel =
            exam.type === "final"
                ? "Záróvizsga"
                : exam.type === "module"
                    ? `Modulzáró: ${moduleTitle}`
                    : "Gyakorló vizsga";

        if (exam.startedAt) {
            events.push({
                timestamp: new Date(exam.startedAt),
                studentName,
                studentEmail,
                courseTitle,
                eventType: "Vizsga indítva",
                description: examLabel,
                details: exam.completedAt ? "Befejezve" : "Folyamatban / megszakítva",
            });
        }

        if (exam.completedAt) {
            events.push({
                timestamp: new Date(exam.completedAt),
                studentName,
                studentEmail,
                courseTitle,
                eventType: "Vizsga befejezve",
                description: examLabel,
                details: `${exam.score}% (${exam.totalQuestions} kérdés)`,
            });
        }
    }

    for (const dolgozat of courseDolgozatok) {
        const submission = submissionMap.get(`${normalizeObjectId(student._id)}-${normalizeObjectId(dolgozat._id)}`) || null;
        if (!submission) continue;

        if (submission.uploadedOnBehalfAt) {
            events.push({
                timestamp: new Date(submission.uploadedOnBehalfAt),
                studentName,
                studentEmail,
                courseTitle,
                eventType: "Beadandó feltöltve",
                description: dolgozat.title,
                details: "Oktató/admin feltöltötte",
            });
        }

        if (submission.submittedAt) {
            events.push({
                timestamp: new Date(submission.submittedAt),
                studentName,
                studentEmail,
                courseTitle,
                eventType: submission.isLate ? "Beadandó későn beadva" : "Beadandó beadva",
                description: dolgozat.title,
                details: submission.uploadedOnBehalfBy ? "Oktatói feltöltés után beadva" : "Tanuló által beadva",
            });
        }

        if (submission.gradedAt) {
            events.push({
                timestamp: new Date(submission.gradedAt),
                studentName,
                studentEmail,
                courseTitle,
                eventType: "Beadandó értékelve",
                description: dolgozat.title,
                details: submission.points != null
                    ? `${submission.points}${dolgozat.maxPoints ? ` / ${dolgozat.maxPoints}` : ""} pont`
                    : "Értékelve",
            });
        }
    }

    for (const selector of courseSelectors) {
        const optionMap = new Map<string, string>(
            (selector.options || []).map((option: any) => [normalizeObjectId(option._id), String(option.text || "")])
        );
        const studentResponses = (selector.responses || []).filter(
            (response: any) => normalizeObjectId(response.studentId) === normalizeObjectId(student._id)
        );

        for (const response of studentResponses) {
            const optionText = optionMap.get(normalizeObjectId(response.optionId)) || "Ismeretlen";
            events.push({
                timestamp: response.createdAt ? new Date(response.createdAt) : new Date(0),
                studentName,
                studentEmail,
                courseTitle,
                eventType: "Opcióválasztás",
                description: selector.title,
                details: optionText,
            });
        }
    }

    return events;
}

function activityEventsToRows(events: ActivityEventRecord[]) {
    return events
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .map((event) => ({
            "Dátum": formatHuDate(event.timestamp),
            Név: event.studentName,
            Email: event.studentEmail,
            Kurzus: event.courseTitle,
            "Esemény": event.eventType,
            Leírás: event.description,
            Részletek: event.details,
        }));
}

export async function getLecturerExamResults() {
    const session = await getAuthSession();
    if (session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const scopedCourseIds = await getScopedCourseIds(session);
    if (scopedCourseIds.length === 0) return [];

    // Fetch final exams only for lecturer-owned courses (admins: all)
    const results = await ExamResult.find({
        type: 'final',
        completedAt: { $ne: null },
        courseId: { $in: scopedCourseIds }
    })
        .populate('userId', 'name email')
        .sort({ completedAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(results));
}

export async function getStudentStats() {
    const session = await getAuthSession();
    if (session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const scopedCourseIds = await getScopedCourseIds(session);
    if (scopedCourseIds.length === 0) return [];

    const [students, courses, examResults] = await Promise.all([
        User.find({ role: 'student' }).select('name email progress subscriptionStatus').lean(),
        Course.find({ _id: { $in: scopedCourseIds } })
            .select("title finalExamSettings modules")
            .populate({
                path: "modules",
                select: "_id quizSettings chapters",
                populate: {
                    path: "chapters",
                    select: "_id pages",
                    populate: {
                        path: "pages",
                        select: "_id"
                    }
                }
            })
            .lean(),
        ExamResult.find({
            completedAt: { $ne: null },
            courseId: { $in: scopedCourseIds }
        }).lean()
    ]);

    const allModuleIds = Array.from(new Set(
        courses.flatMap((c: any) => (c.modules || []).map((m: any) => m._id.toString()))
    ));
    const modulesWithQuestions = await getModuleIdsWithQuestions(allModuleIds);

    const courseMap = new Map(courses.map((c: any) => [c._id.toString(), c]));
    const stats: any[] = [];

    for (const student of students as any[]) {
        const progressObj = student.progress || {};
        const progressCourseIds = Object.keys(progressObj).filter((id: string) => scopedCourseIds.includes(id));
        const examCourseIds = Array.from(new Set(
            examResults
                .filter((exam: any) => exam.userId.toString() === student._id.toString() && exam.courseId)
                .map((exam: any) => exam.courseId.toString())
                .filter((id: string) => scopedCourseIds.includes(id))
        ));
        const studentCourseIds = Array.from(new Set([...progressCourseIds, ...examCourseIds]));

        for (const courseId of studentCourseIds) {
            const progress = progressObj[courseId] || {};
            const course = courseMap.get(courseId);
            if (!course) continue;

            const studentCourseExams = examResults.filter((exam: any) =>
                exam.userId.toString() === student._id.toString() &&
                exam.courseId?.toString() === courseId
            );
            const finalExams = studentCourseExams
                .filter((e: any) => e.type === 'final')
                .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
            const moduleExams = studentCourseExams.filter((e: any) => e.type === 'module');
            const latestFinal = finalExams[0];

            const completedModulesCount = (progress.completedModules || []).length;
            const completedPagesCount = (progress.completedPages || []).length;
            const totalModules = course.modules?.length || 0;
            const modulesRequiringExam = (course.modules || []).filter((m: any) =>
                modulesWithQuestions.has(m._id.toString())
            ).length;
            const completedRequiredModules = (progress.completedModules || []).filter((id: string) =>
                modulesWithQuestions.has(id.toString())
            ).length;
            const totalPages = (course.modules || []).reduce((sum: number, m: any) => {
                const pagesInModule = (m.chapters || []).reduce((chapterSum: number, c: any) => {
                    return chapterSum + (c.pages?.length || 0);
                }, 0);
                return sum + pagesInModule;
            }, 0);

            const finalPassingScore = course.finalExamSettings?.passingScore || 75;

            stats.push({
                id: `${student._id.toString()}-${courseId}`,
                studentId: student._id.toString(),
                name: student.name,
                email: student.email,
                subscriptionStatus: student.subscriptionStatus || "inactive",
                isActive: student.subscriptionStatus === "active",
                courseId,
                courseTitle: course.title,
                completedModulesCount,
                completedRequiredModules,
                modulesRequiringExam,
                totalModules,
                completedPagesCount,
                totalPages,
                lastViewedAt: progress.lastViewedAt || null,
                courseCompleted: !!progress.courseCompleted,
                moduleExamsPassed: moduleExams.filter((e: any) => {
                    const module = course.modules?.find((m: any) => m._id.toString() === e.moduleId?.toString());
                    const passingScore = module?.quizSettings?.passingScore || 75;
                    return e.score >= passingScore;
                }).length,
                finalExamScore: latestFinal ? latestFinal.score : null,
                finalExamPassed: latestFinal ? latestFinal.score >= finalPassingScore : false,
                finalExamAttempts: finalExams.length
            });
        }
    }

    stats.sort((a, b) => {
        const aTime = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
        const bTime = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
    });

    return JSON.parse(JSON.stringify(stats));
}

export async function grantExtraRetry(studentId: string, courseId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();
    const canAccess = await ensureLecturerCanAccessCourse(session, courseId);
    if (!canAccess) {
        throw new Error("Unauthorized");
    }

    const user = await User.findById(studentId);
    if (!user) throw new Error("Student not found");

    if (!user.progress) user.progress = new Map();
    let courseProgress = user.progress.get(courseId.toString()) || {};
    
    // Increment extra retries
    courseProgress.extraRetries = (courseProgress.extraRetries || 0) + 1;
    
    user.progress.set(courseId.toString(), courseProgress);
    user.markModified('progress');
    await user.save();

    return { success: true };
}

async function updateStudentCourseProgress(
    studentId: string,
    courseId: string,
    updater: (courseProgress: Record<string, any>) => void
) {
    const user = await User.findById(studentId);
    if (!user) throw new Error("Student not found");

    if (!user.progress) user.progress = new Map();
    const courseProgress = user.progress.get(courseId.toString()) || {
        completedModules: [],
        completedPages: [],
        manualModulePasses: [],
    };

    updater(courseProgress);
    user.progress.set(courseId.toString(), courseProgress);
    user.markModified("progress");
    await user.save();

    return { success: true };
}

export async function grantModulePass(studentId: string, courseId: string, moduleId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await connectDB();
    const canAccess = await ensureLecturerCanAccessCourse(session, courseId);
    if (!canAccess) throw new Error("Unauthorized");

    const module = await Module.findById(moduleId).select("courseId title").lean();
    if (!module || module.courseId?.toString() !== courseId) {
        throw new Error("Module not found in this course");
    }

    await updateStudentCourseProgress(studentId, courseId, (courseProgress) => {
        if (!courseProgress.completedModules) courseProgress.completedModules = [];
        if (!courseProgress.manualModulePasses) courseProgress.manualModulePasses = [];

        const moduleIdStr = moduleId.toString();
        if (!courseProgress.completedModules.includes(moduleIdStr)) {
            courseProgress.completedModules.push(moduleIdStr);
        }
        if (!courseProgress.manualModulePasses.includes(moduleIdStr)) {
            courseProgress.manualModulePasses.push(moduleIdStr);
        }
    });

    return { success: true };
}

export async function revokeModulePass(studentId: string, courseId: string, moduleId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await connectDB();
    const canAccess = await ensureLecturerCanAccessCourse(session, courseId);
    if (!canAccess) throw new Error("Unauthorized");

    const moduleIdStr = moduleId.toString();

    await updateStudentCourseProgress(studentId, courseId, (courseProgress) => {
        courseProgress.completedModules = (courseProgress.completedModules || []).filter(
            (id: string) => id !== moduleIdStr
        );
        courseProgress.manualModulePasses = (courseProgress.manualModulePasses || []).filter(
            (id: string) => id !== moduleIdStr
        );
    });

    return { success: true };
}

export async function grantFinalExamAccess(studentId: string, courseId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await connectDB();
    const canAccess = await ensureLecturerCanAccessCourse(session, courseId);
    if (!canAccess) throw new Error("Unauthorized");

    await updateStudentCourseProgress(studentId, courseId, (courseProgress) => {
        courseProgress.finalExamUnlocked = true;
    });

    return { success: true };
}

export async function revokeFinalExamAccess(studentId: string, courseId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await connectDB();
    const canAccess = await ensureLecturerCanAccessCourse(session, courseId);
    if (!canAccess) throw new Error("Unauthorized");

    await updateStudentCourseProgress(studentId, courseId, (courseProgress) => {
        courseProgress.finalExamUnlocked = false;
    });

    return { success: true };
}

export async function getStudentExamDetails(studentId: string, courseId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await connectDB();
    const canAccess = await ensureLecturerCanAccessCourse(session, courseId);
    if (!canAccess) {
        throw new Error("Unauthorized");
    }

    const [student, course, attempts, dolgozatok, optionSelectors] = await Promise.all([
        User.findById(studentId).select("name email progress subscriptionStatus").lean(),
        Course.findById(courseId)
            .select("title finalExamSettings modules")
            .populate({ path: "modules", select: "_id title order quizSettings" })
            .lean(),
        ExamResult.find({
            userId: studentId,
            courseId,
            completedAt: { $ne: null }
        })
            .sort({ completedAt: -1 })
            .lean(),
        getStudentDolgozatStatusForCourse(studentId, courseId),
        getStudentOptionSelectionsForCourse(studentId, courseId),
    ]);

    if (!student || !course) throw new Error("Not found");

    const moduleIds = ((course as any).modules || []).map((m: any) => m._id.toString());
    const modulesWithQuestions = await getModuleIdsWithQuestions(moduleIds);

    const questionIds = Array.from(new Set((attempts as any[]).flatMap((attempt: any) =>
        (attempt.answers || [])
            .map((ans: any) => ans.questionId?.toString())
            .filter(Boolean)
    )));
    const questions = await Question.find({ _id: { $in: questionIds } }).select("text").lean();

    const questionTextMap = new Map((questions as any[]).map((q: any) => [q._id.toString(), q.text]));
    const progressObj = progressObject((student as any)?.progress);
    const courseProgress = progressObj[courseId] || {};
    const completedModules: string[] = (courseProgress.completedModules || []).map((id: string) => id.toString());
    const manualModulePasses: string[] = (courseProgress.manualModulePasses || []).map((id: string) => id.toString());
    const finalExamUnlocked = !!courseProgress.finalExamUnlocked;
    const modulesRequiringExam = Array.from(modulesWithQuestions);
    const canStartFinalExam = isEligibleForFinalExam(completedModules, modulesRequiringExam, finalExamUnlocked);

    const moduleAttemptsByModule = new Map<string, any[]>();
    for (const attempt of attempts as any[]) {
        if (attempt.type !== "module" || !attempt.moduleId) continue;
        const key = attempt.moduleId.toString();
        if (!moduleAttemptsByModule.has(key)) moduleAttemptsByModule.set(key, []);
        moduleAttemptsByModule.get(key)!.push(attempt);
    }

    const modules = ((course as any).modules || [])
        .slice()
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((module: any) => {
            const moduleId = module._id.toString();
            const hasExam = modulesWithQuestions.has(moduleId);
            const passingScore = module.quizSettings?.passingScore || 75;
            const moduleAttempts = moduleAttemptsByModule.get(moduleId) || [];
            const passedAttempts = moduleAttempts.filter((a: any) => a.score >= passingScore);
            const bestAttempt = passedAttempts[0] || moduleAttempts[0] || null;
            const isManuallyPassed = manualModulePasses.includes(moduleId);
            const isPassed = completedModules.includes(moduleId);

            let status: "passed" | "failed" | "not_attempted" | "no_exam" | "manual";
            if (!hasExam) status = "no_exam";
            else if (isManuallyPassed) status = "manual";
            else if (isPassed && passedAttempts.length > 0) status = "passed";
            else if (moduleAttempts.length > 0) status = "failed";
            else if (isPassed) status = "passed";
            else status = "not_attempted";

            return {
                id: moduleId,
                title: module.title,
                order: module.order || 0,
                hasExam,
                passingScore,
                status,
                isPassed,
                isManuallyPassed,
                attemptCount: moduleAttempts.length,
                bestScore: bestAttempt ? bestAttempt.score : null,
                lastAttemptAt: bestAttempt?.completedAt || moduleAttempts[0]?.completedAt || null,
            };
        });

    const formattedAttempts = (attempts as any[]).map((attempt: any) => ({
        id: attempt._id.toString(),
        type: attempt.type,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        completedAt: attempt.completedAt,
        startedAt: attempt.startedAt,
        moduleId: attempt.moduleId?.toString() || null,
        answers: (attempt.answers || []).map((ans: any) => ({
            questionId: ans.questionId?.toString() || null,
            questionText: ans.questionId ? (questionTextMap.get(ans.questionId.toString()) || "Ismeretlen kérdés") : "Ismeretlen kérdés",
            selectedOptions: ans.selectedOptions || [],
            isCorrect: !!ans.isCorrect
        }))
    }));

    const finalExams = (attempts as any[]).filter((attempt) => attempt.type === "final");
    const latestFinal = finalExams[0] || null;
    const finalPassingScore = (course as any).finalExamSettings?.passingScore || 75;

    return JSON.parse(JSON.stringify({
        student: {
            id: studentId,
            name: (student as any).name,
            email: (student as any).email,
            subscriptionStatus: (student as any).subscriptionStatus || "inactive",
            isActive: (student as any).subscriptionStatus === "active",
        },
        course: {
            id: courseId,
            title: (course as any).title,
            passingScore: finalPassingScore
        },
        progress: {
            completedPages: courseProgress.completedPages || [],
            completedPagesCount: (courseProgress.completedPages || []).length,
            completedModules,
            manualModulePasses,
            finalExamUnlocked,
            canStartFinalExam,
            modulesRequiringExamCount: modulesRequiringExam.length,
            modulesPassedCount: modulesRequiringExam.filter((id) => completedModules.includes(id)).length,
            lastViewedAt: courseProgress.lastViewedAt || null,
            courseCompleted: !!courseProgress.courseCompleted,
            extraRetries: courseProgress.extraRetries || 0,
            finalExamScore: latestFinal ? latestFinal.score : null,
            finalExamPassed: latestFinal ? latestFinal.score >= finalPassingScore : false,
            finalExamAttempts: finalExams.length,
        },
        modules,
        dolgozatok,
        optionSelectors,
        dolgozatSummary: {
            total: dolgozatok.length,
            submitted: dolgozatok.filter((item: any) => item.isSubmitted).length,
        },
        optionSelectorSummary: {
            total: optionSelectors.length,
            responded: optionSelectors.filter((item: any) => item.hasResponded).length,
            selections: optionSelectors
                .filter((item: any) => item.hasResponded)
                .map((item: any) => ({
                    title: item.title,
                    choices: item.selectedOptions,
                })),
        },
        attempts: formattedAttempts
    }));
}

export async function exportStudentProgressExcel(options?: {
    courseId?: string;
    studentIds?: string[];
}) {
    const session = await getAuthSession();
    if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const courseIdFilter = options?.courseId;
    const studentIdFilter = options?.studentIds?.length
        ? Array.from(new Set(options.studentIds.map((id) => normalizeObjectId(id))))
        : undefined;

    const scopedCourseIds = await getScopedCourseIds(session);
    const courseIds = courseIdFilter && scopedCourseIds.includes(courseIdFilter)
        ? [courseIdFilter]
        : scopedCourseIds;

    if (courseIds.length === 0) {
        return { success: false, error: "Nincs exportálható kurzus" };
    }

    const [students, courses, examResults, dolgozatok, optionSelectors, submissions] = await Promise.all([
        User.find({ role: "student" }).select("name email progress subscriptionStatus").lean(),
        Course.find({ _id: { $in: courseIds } })
            .select("title finalExamSettings modules")
            .populate({
                path: "modules",
                select: "_id title order quizSettings chapters",
                populate: {
                    path: "chapters",
                    select: "_id pages",
                    populate: { path: "pages", select: "_id" },
                },
            })
            .lean(),
        ExamResult.find({ courseId: { $in: courseIds } }).lean(),
        Dolgozat.find({
            courseId: { $in: courseIds },
            isArchived: false,
            isPublished: true,
        })
            .select("_id courseId title maxPoints")
            .sort({ createdAt: 1 })
            .lean(),
        OptionSelector.find({
            courseId: { $in: courseIds },
            isArchived: false,
            isPublished: true,
        })
            .select("_id courseId title allowMultiple options responses")
            .sort({ createdAt: 1 })
            .lean(),
        DolgozatSubmission.find({ courseId: { $in: courseIds } }).lean(),
    ]);

    let filteredStudents = students as any[];
    if (studentIdFilter?.length) {
        const allowedIds = new Set(studentIdFilter);
        filteredStudents = filteredStudents.filter((student) =>
            allowedIds.has(normalizeObjectId(student._id))
        );
        if (filteredStudents.length === 0) {
            return { success: false, error: "A kijelölt tanulók nem találhatók" };
        }
    }

    const allModuleIds = Array.from(new Set(
        courses.flatMap((course: any) => (course.modules || []).map((module: any) => module._id.toString()))
    ));
    const modulesWithQuestions = await getModuleIdsWithQuestions(allModuleIds);

    const courseMap = new Map(courses.map((course: any) => [course._id.toString(), course]));
    const dolgozatByCourse = new Map<string, any[]>();
    const optionSelectorByCourse = new Map<string, any[]>();
    const moduleTitleById = new Map<string, string>();

    for (const course of courses as any[]) {
        for (const module of course.modules || []) {
            moduleTitleById.set(module._id.toString(), module.title);
        }
    }

    for (const dolgozat of dolgozatok as any[]) {
        const key = dolgozat.courseId.toString();
        if (!dolgozatByCourse.has(key)) dolgozatByCourse.set(key, []);
        dolgozatByCourse.get(key)!.push(dolgozat);
    }

    for (const selector of optionSelectors as any[]) {
        const key = selector.courseId.toString();
        if (!optionSelectorByCourse.has(key)) optionSelectorByCourse.set(key, []);
        optionSelectorByCourse.get(key)!.push(selector);
    }

    const submissionMap = new Map(
        (submissions as any[]).map((submission) => [
            `${normalizeObjectId(submission.userId)}-${normalizeObjectId(submission.dolgozatId)}`,
            submission,
        ])
    );

    const summaryRows: Record<string, string | number>[] = [];
    const activityEvents: ActivityEventRecord[] = [];

    for (const student of filteredStudents) {
        const progressObj = progressObject(student.progress);
        const studentCourseIds = Object.keys(progressObj).filter((id) => courseIds.includes(id));

        for (const courseId of studentCourseIds) {
            const course = courseMap.get(courseId);
            if (!course) continue;

            const progress = progressObj[courseId] || {};
            const studentExams = (examResults as any[]).filter(
                (exam) =>
                    normalizeObjectId(exam.userId) === normalizeObjectId(student._id) &&
                    normalizeObjectId(exam.courseId) === courseId
            );
            const courseDolgozatok = dolgozatByCourse.get(courseId) || [];
            const courseSelectors = optionSelectorByCourse.get(courseId) || [];

            summaryRows.push(
                buildStudentSummaryRow(
                    student,
                    course,
                    progress,
                    studentExams,
                    modulesWithQuestions,
                    courseDolgozatok,
                    courseSelectors,
                    submissionMap
                )
            );

            activityEvents.push(
                ...buildStudentActivityEvents(
                    student,
                    course,
                    progress,
                    studentExams,
                    courseDolgozatok,
                    courseSelectors,
                    submissionMap,
                    moduleTitleById
                )
            );
        }
    }

    summaryRows.sort((a, b) => {
        const courseCompare = String(a.Kurzus).localeCompare(String(b.Kurzus), "hu");
        if (courseCompare !== 0) return courseCompare;
        return String(a.Név).localeCompare(String(b.Név), "hu");
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Tanulói haladás");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activityEventsToRows(activityEvents)), "Aktivitás napló");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const base64 = Buffer.from(buffer).toString("base64");

    const courseTitle = courseIdFilter ? courseMap.get(courseIdFilter)?.title : null;
    const selectionSuffix = studentIdFilter?.length ? `_${studentIdFilter.length}_tanulo` : "";
    const safeTitle = (courseTitle || "osszes_kurzus")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .slice(0, 40);
    const filename = `${safeTitle || "tanuloi_haladas"}${selectionSuffix}_export.xlsx`;

    return { success: true, base64, filename };
}
