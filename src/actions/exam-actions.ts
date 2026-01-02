"use server"

import connectDB from "@/lib/db";
import Question from "@/models/Question";
import Module from "@/models/Module"; // Added
import Course from "@/models/Course"; // Added
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose"; // Added

import ExamResult from "@/models/ExamResult";
import User from "@/models/User";

// --- Practice Mode ---

export async function getPracticeQuestions() {
  const session = await getServerSession(authOptions);
  const isDev = process.env.DEV_MODE === "true";

  if (!session && !isDev) {
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
    const session = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";
    if (!session && !isDev) throw new Error("Unauthorized");

    await connectDB();

    const module = await Module.findById(moduleId);
    if (!module) throw new Error("Module not found");

    const settings = module.quizSettings || { questionCount: 10, timeLimit: 30, passingScore: 75 };

    // Check for existing active attempt? (Simplification: just create new for now, or return existing)
    // For module exams, we allow infinite retries, so just create new.

    const userId = session?.user?.id || (isDev ? new mongoose.Types.ObjectId() : null);
    
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
        totalQuestions: settings.questionCount,
        answers: [],
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
  const session = await getServerSession(authOptions);
  const isDev = process.env.DEV_MODE === "true";

  if (!session && !isDev) throw new Error("Unauthorized");

  await connectDB();

  // 1. Get Course Settings
  const course = await Course.findById(courseId).populate('modules');
  if (!course) throw new Error("Course not found");

  const settings = course.finalExamSettings || { questionCount: 20, passingScore: 75, maxRetries: 3 };

  // 2. Check Attempts / Retries
  const attempts = await ExamResult.countDocuments({
      userId: session?.user?.id, // @ts-ignore
      courseId: courseId,
      type: "final",
      completedAt: { $ne: null }
  });

  // Get User Progress to check for extra granted attempts
  const userId = session?.user?.id;
  const user = userId ? await User.findById(userId) : null;
  const courseProgress = user?.progress?.get(courseId.toString()) || {};
  const extraRetries = courseProgress.extraRetries || 0;

  // If retries are limited (e.g. > 0), check limit
  if (settings.maxRetries > 0 && attempts >= (settings.maxRetries + extraRetries)) {
      // Check if user has a special "granted" attempt? (Not implemented yet, assumes strict)
      // We could return a specific error code
      return { error: "Max retries exceeded. Please contact your lecturer." };
  }

  // Check for active unfinished exam
  const activeExam = await ExamResult.findOne({
    userId: session?.user?.id, // @ts-ignore
    courseId: courseId,
    type: "final",
    completedAt: null
  });

  if (activeExam) {
       // Return existing active exam
       return { examId: activeExam._id.toString(), startTime: activeExam.startedAt, resume: true };
  }

  // 3. Balanced Question Generation
  // Strategy: Divide total questions by number of modules.
  const modules = course.modules || [];
  if (modules.length === 0) return { error: "Course has no modules." };

  const countPerModule = Math.floor(settings.questionCount / modules.length);
  const remainder = settings.questionCount % modules.length;

  let allQuestions: any[] = [];

  for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        // Add remainder to first few modules to hit total count
        const size = countPerModule + (i < remainder ? 1 : 0);
        
        if (size > 0) {
            const modQuestions = await Question.aggregate([
                { $match: { moduleId: mod._id } },
                { $sample: { size: size } }
            ]);
            allQuestions = [...allQuestions, ...modQuestions];
        }
  }

  // Shuffle the combined questions
  allQuestions = allQuestions.sort(() => Math.random() - 0.5);

  // 4. Create Exam Record
  const newExam = await ExamResult.create({
    userId: session?.user?.id, // @ts-ignore
    courseId: courseId,
    type: "final",
    score: 0,
    totalQuestions: allQuestions.length,
    answers: [],
    startedAt: new Date()
  });
  
  const formattedQuestions = allQuestions.map((q: any) => ({
    id: q._id.toString(),
    text: q.text,
    options: q.options,
    // DO NOT SEND CORRECT OPTIONS FOR FINAL EXAM
  }));

  return { 
    examId: newExam._id.toString(), 
    questions: formattedQuestions,
    startTime: newExam.startedAt,
    timeLimit: 60 // Default 60 min for final or add to settings if needed
  };
}


export async function submitModuleExam(examId: string, answers: Record<string, number[]>) {
    const session = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";
    if (!session && !isDev) throw new Error("Unauthorized");

    await connectDB();

    const exam = await ExamResult.findById(examId);
    if (!exam) throw new Error("Exam not found");
    if (exam.completedAt) throw new Error("Exam already submitted");

    // Calculate Score
    let correctCount = 0;
    const answerDetails = [];
    
    const questionIds = Object.keys(answers);
    const questions = await Question.find({ _id: { $in: questionIds } });

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

    const score = Math.round((correctCount / (questions.length || 1)) * 100);

    // Get Module settings to check pass
    const module = await Module.findById(exam.moduleId);
    const passingScore = module?.quizSettings?.passingScore || 75;
    const passed = score >= passingScore;

    // Update Exam Result
    exam.score = score;
    exam.completedAt = new Date();
    exam.answers = answerDetails;
    exam.totalQuestions = questions.length;
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
        if (!courseProgress.completedModules.includes(exam.moduleId.toString())) {
            courseProgress.completedModules.push(exam.moduleId.toString());
        }
        
        // Mongoose Map set
        user.progress.set(exam.courseId.toString(), courseProgress);
        await user.save();
    }

    return { success: true, score, passed, passingScore };
}

export async function submitFinalExam(examId: string, answers: Record<string, number[]>) {
    const session = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";
    if (!session && !isDev) throw new Error("Unauthorized");

    await connectDB();

    const exam = await ExamResult.findById(examId);
    if (!exam) throw new Error("Exam not found");

    if (exam.completedAt) throw new Error("Exam already submitted");

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
    
    // We need to fetch the questions involved. 
    // Since we didn't store Question IDs in ExamResult on creation (simplified),
    // we rely on the answers keys which are question IDs.
    const questionIds = Object.keys(answers);
    const questions = await Question.find({ _id: { $in: questionIds } });

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

    const score = Math.round((correctCount / (questions.length || 1)) * 100);

    // Update Exam Result
    exam.score = score;
    exam.completedAt = now;
    exam.answers = answerDetails;
    exam.totalQuestions = questions.length;
    await exam.save();

    // Check passing info (e.g. 75%)
    // Can update Course progress here too if needed

    return { success: true, score, passed: score >= 75 };
}

// --- Lecturer Actions ---

export async function getLecturerExamResults() {
    const session = await getServerSession(authOptions);
    if (process.env.DEV_MODE !== "true" && session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();
    
    // Fetch all final exams, populated with user info
    const results = await ExamResult.find({ type: 'final', completedAt: { $ne: null } })
        .populate('userId', 'name email')
        .sort({ completedAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(results));
}

export async function getStudentStats() {
    const session = await getServerSession(authOptions);
    if (process.env.DEV_MODE !== "true" && session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();
    
    // Fetch all students
    const students = await User.find({ role: 'student' }).select('name email progress').lean();
    
    // Fetch all exam results
    const examResults = await ExamResult.find({ completedAt: { $ne: null } }).lean();

    // Combine data
    const stats = students.map((student: any) => {
        const studentExams = examResults.filter((exam: any) => exam.userId.toString() === student._id.toString());
        
        const finalExams = studentExams.filter((e: any) => e.type === 'final');
        const moduleExams = studentExams.filter((e: any) => e.type === 'module');
        
        // Calculate latest final exam result
        const latestFinal = finalExams.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

        return {
            id: student._id.toString(),
            name: student.name,
            email: student.email,
            moduleExamsPassed: moduleExams.filter((e: any) => e.score >= 75).length, // Assuming 75 is pass for now, ideally check against module settings
            finalExamScore: latestFinal ? latestFinal.score : null,
            finalExamPassed: latestFinal ? latestFinal.score >= 75 : false, // Hardcoded for view, real logic in verify
            finalExamAttempts: finalExams.length,
            courseId: latestFinal ? latestFinal.courseId.toString() : null
        };
    });

    return JSON.parse(JSON.stringify(stats));
}

export async function grantExtraRetry(studentId: string, courseId: string) {
    const session = await getServerSession(authOptions);
    if (process.env.DEV_MODE !== "true" && session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const user = await User.findById(studentId);
    if (!user) throw new Error("Student not found");

    if (!user.progress) user.progress = new Map();
    let courseProgress = user.progress.get(courseId.toString()) || {};
    
    // Increment extra retries
    courseProgress.extraRetries = (courseProgress.extraRetries || 0) + 1;
    
    user.progress.set(courseId.toString(), courseProgress);
    await user.save();

    return { success: true };
}
