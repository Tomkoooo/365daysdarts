"use server"

import connectDB from "@/lib/db";
import Question from "@/models/Question";
import { authOptions } from "@/lib/auth";
import { getAuthSession } from "@/lib/session";
import Module from "@/models/Module";
import mongoose from "mongoose";

export async function getQuestionsForModule(moduleId: string) {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();
    const questions = await Question.find({ moduleId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(questions));
}

export async function createQuestion(moduleId: string, data: { text: string, options: string[], correctOptions: number[] }) {
    const session = await getAuthSession();
    if (session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();
    const newQuestion = await Question.create({
        moduleId,
        text: data.text,
        options: data.options,
        correctOptions: data.correctOptions,
        difficulty: 'medium' // Default for now
    });
    return JSON.parse(JSON.stringify(newQuestion));
}

export async function deleteQuestion(questionId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();
    await Question.findByIdAndDelete(questionId);
    return { success: true };
}

export async function getQuestionCountsForCourse(courseId: string) {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();

    const modules = await Module.find({ courseId }).select('_id');
    const moduleIds = modules.map(m => m._id);

    const totalCount = await Question.countDocuments({ moduleId: { $in: moduleIds } });

    const byModuleRaw = await Question.aggregate([
        { $match: { moduleId: { $in: moduleIds } } },
        { $group: { _id: "$moduleId", count: { $sum: 1 } } }
    ]);

    const byChapterRaw = await Question.aggregate([
        { $match: { moduleId: { $in: moduleIds }, chapterId: { $ne: null } } },
        { $group: { _id: "$chapterId", count: { $sum: 1 } } }
    ]);

    const byModule: Record<string, number> = {};
    byModuleRaw.forEach((item: any) => {
        byModule[item._id.toString()] = item.count;
    });

    const byChapter: Record<string, number> = {};
    byChapterRaw.forEach((item: any) => {
        byChapter[item._id.toString()] = item.count;
    });

    return {
        total: totalCount,
        byModule,
        byChapter
    };
}

export async function getQuestionsForCourse(courseId: string) {
    const session = await getAuthSession();
    if (!session) throw new Error("Unauthorized");

    await connectDB();

    const modules = await Module.find({ courseId: new mongoose.Types.ObjectId(courseId) }).select('_id');
    const moduleIds = modules.map(m => m._id);

    const questions = await Question.find({ moduleId: { $in: moduleIds } })
        .sort({ createdAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(questions));
}
