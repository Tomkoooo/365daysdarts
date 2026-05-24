"use server"

import connectDB from "@/lib/db";
import Question from "@/models/Question";
import Module from "@/models/Module";
import Chapter from "@/models/Chapter";
import Course from "@/models/Course";
import { getAuthSession } from "@/lib/session";
import * as XLSX from 'xlsx';
import mongoose from "mongoose";
import {
    QUESTION_EXCEL_HEADERS,
    lettersToCorrectIndices,
    questionToExcelRow,
    sanitizeExcelFilename,
} from "@/lib/excel-question-format";

interface BulkUploadOptions {
    mode: 'add' | 'overwrite';
}

export async function uploadQuestionsFromExcel(courseId: string, formData: FormData, options: BulkUploadOptions = { mode: 'add' }) {
    const session = await getAuthSession();
    if (session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    const file = formData.get('file') as File;
    if (!file) throw new Error("No file uploaded");

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    await connectDB();

    // 1. Fetch Course Structure (Modules & Chapters)
    const course = await Course.findById(courseId).populate({
        path: 'modules',
        populate: { path: 'chapters' }
    });

    if (!course) throw new Error("Course not found");

    // Index Modules by Array Order (since 'order' field is unreliable/default 0)
    // Excel 1 -> Index 0
    const modulesByIndex = course.modules; // These are already populated and in order

    const questionsToCreate: any[] = [];
    const modulesToClean = new Set<string>();

    // Skip header? Assuming Row 1 is header based on typical Excel usage.
    const startRow = 1; 

    for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Data Extraction
        const modNum = Number(row[0]);
        const chapNum = Number(row[1]);
        const questionText = row[3];
        const answers = [row[4], row[5], row[6], row[7]].filter(a => a); // Filter empty
        const correctChar = row[8];

        if (!modNum || !questionText || answers.length < 2 || !correctChar) {
            console.warn(`Skipping row ${i + 1}: Missing required data`);
            continue;
        }

        // Find Module by Index (1-based -> 0-based)
        const moduleIndex = modNum - 1;
        const module = modulesByIndex[moduleIndex];

        if (!module) {
            console.warn(`Skipping row ${i + 1}: Module ${modNum} not found in course (Index ${moduleIndex})`);
            continue;
        }

        // Find Chapter by Index (within Module)
        let chapter = null;
        if (chapNum && module.chapters && module.chapters.length > 0) {
            const chapterIndex = chapNum - 1;
            chapter = module.chapters[chapterIndex];
        } else if (chapNum) {
            console.warn(`Row ${i + 1}: Chapter ${chapNum} requested but module has no chapters or index out of bounds.`);
        }
        
        const chapterId = chapter ? chapter._id : null;

        const correctOptions = lettersToCorrectIndices(correctChar, answers.length);

        if (correctOptions.length === 0) {
            console.warn(`Skipping row ${i + 1}: No valid correct answer parsed from '${correctChar}'`);
            continue;
        }

        questionsToCreate.push({
            moduleId: module._id,
            chapterId: chapterId,
            text: questionText,
            options: answers,
            correctOptions: correctOptions,
            difficulty: 'medium'
        });

        modulesToClean.add(module._id.toString());
    }

    if (questionsToCreate.length === 0) {
        return { success: false, error: "Nem találtunk érvényes kérdéseket az importáláshoz." };
    }

    // execute DB operations
    try {
        console.log(`[BulkUpload] Mode: ${options.mode}`);
        console.log(`[BulkUpload] Modules to clean:`, Array.from(modulesToClean));

        if (options.mode === 'overwrite') {
            // Delete questions for affected modules
            const moduleIds = Array.from(modulesToClean).map(id => new mongoose.Types.ObjectId(id));
            const deleteResult = await Question.deleteMany({ moduleId: { $in: moduleIds } });
            console.log(`[BulkUpload] Deleted ${deleteResult.deletedCount} questions for modules:`, moduleIds);
        }

        const insertResult = await Question.insertMany(questionsToCreate);
        console.log(`[BulkUpload] Inserted ${insertResult.length} questions`);

        return { success: true, count: questionsToCreate.length };
    } catch (error) {
        console.error("Bulk upload error:", error);
        throw new Error("Adatbázis hiba történt a feltöltés során.");
    }
}

export async function exportQuestionsToExcel(courseId: string) {
    const session = await getAuthSession();
    if (session?.user?.role !== 'lecturer' && session?.user?.role !== 'admin') {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const course = await Course.findById(courseId).lean();
    if (!course) throw new Error("Course not found");

    const allModules = await Module.find({ courseId })
        .populate({ path: 'chapters' })
        .lean();

    const courseModuleOrder = (course.modules || []).map((id: mongoose.Types.ObjectId) => id.toString());
    const moduleById = new Map(allModules.map((module) => [module._id.toString(), module]));

    const orderedModules = [
        ...courseModuleOrder
            .map((id: string) => moduleById.get(id))
            .filter((module: (typeof allModules)[number] | undefined): module is (typeof allModules)[number] => Boolean(module)),
        ...allModules.filter((module: (typeof allModules)[number]) => !courseModuleOrder.includes(module._id.toString())),
    ];

    const moduleIds = orderedModules.map((module) => module._id);
    const questions = await Question.find({ moduleId: { $in: moduleIds } }).lean();

    if (questions.length === 0) {
        return { success: false as const, error: "Nincsenek exportálható kérdések." };
    }

    const questionsByModule = new Map<string, typeof questions>();
    for (const question of questions) {
        const moduleId = question.moduleId.toString();
        if (!questionsByModule.has(moduleId)) {
            questionsByModule.set(moduleId, []);
        }
        questionsByModule.get(moduleId)!.push(question);
    }

    const sortByCreatedAt = (a: (typeof questions)[number], b: (typeof questions)[number]) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    const rows: (string | number)[][] = [[...QUESTION_EXCEL_HEADERS]];
    let totalExported = 0;

    orderedModules.forEach((module, moduleIndex) => {
        const modNum = moduleIndex + 1;
        const moduleId = module._id.toString();
        const moduleQuestions = questionsByModule.get(moduleId) || [];
        if (moduleQuestions.length === 0) return;

        const chapters = module.chapters || [];
        const chapterIdToNum = new Map<string, number>();
        chapters.forEach((chapter: any, chapterIndex: number) => {
            chapterIdToNum.set(chapter._id.toString(), chapterIndex + 1);
        });

        const moduleLevelQuestions: typeof questions = [];
        const questionsByChapterId = new Map<string, typeof questions>();
        const orphanedQuestions: typeof questions = [];

        for (const question of moduleQuestions) {
            const chapterId = question.chapterId?.toString();
            if (!chapterId) {
                moduleLevelQuestions.push(question);
            } else if (chapterIdToNum.has(chapterId)) {
                if (!questionsByChapterId.has(chapterId)) {
                    questionsByChapterId.set(chapterId, []);
                }
                questionsByChapterId.get(chapterId)!.push(question);
            } else {
                orphanedQuestions.push(question);
            }
        }

        moduleLevelQuestions.sort(sortByCreatedAt);
        questionsByChapterId.forEach((chapterQuestions) => chapterQuestions.sort(sortByCreatedAt));
        orphanedQuestions.sort(sortByCreatedAt);

        const sorszamByFejezet = new Map<number, number>();

        const appendQuestions = (chapterQuestions: typeof questions, chapNum: number) => {
            for (const question of chapterQuestions) {
                const sorszam = (sorszamByFejezet.get(chapNum) ?? 0) + 1;
                sorszamByFejezet.set(chapNum, sorszam);

                rows.push(questionToExcelRow(
                    modNum,
                    chapNum,
                    sorszam,
                    {
                        text: question.text,
                        options: question.options,
                        correctOptions: question.correctOptions,
                    }
                ));
                totalExported += 1;
            }
        };

        // Module-level questions always use fejezet 1
        appendQuestions(moduleLevelQuestions, 1);

        // Chapter questions in course structure order
        chapters.forEach((chapter: any, chapterIndex: number) => {
            const chapterId = chapter._id.toString();
            const chapNum = chapterIndex + 1;
            appendQuestions(questionsByChapterId.get(chapterId) || [], chapNum);
        });

        // Questions linked to unknown chapters still get a fejezet number
        if (orphanedQuestions.length > 0) {
            const orphanFejezet = chapters.length > 0 ? chapters.length + 1 : 1;
            appendQuestions(orphanedQuestions, orphanFejezet);
        }
    });

    if (totalExported === 0) {
        return { success: false as const, error: "Nincsenek exportálható kérdések." };
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kérdések');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return {
        success: true as const,
        data: Buffer.from(buffer).toString('base64'),
        filename: sanitizeExcelFilename(course.title, courseId),
        count: totalExported,
    };
}
