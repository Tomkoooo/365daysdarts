"use server"

import connectDB from "@/lib/db";
import Question from "@/models/Question";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getQuestionsForModule(moduleId: string) {
    const session = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";
    if (!session && !isDev) throw new Error("Unauthorized");

    await connectDB();
    const questions = await Question.find({ moduleId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(questions));
}

export async function createQuestion(moduleId: string, data: { text: string, options: string[], correctOptions: number[] }) {
    const session: any = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";
    if (!session && !isDev && session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
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
    const session: any = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";
    if (!session && !isDev && session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();
    await Question.findByIdAndDelete(questionId);
    return { success: true };
}
