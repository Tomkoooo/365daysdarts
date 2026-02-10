"use server"

import connectDB from "@/lib/db";
import Question from "@/models/Question";
import Module from "@/models/Module";
import Chapter from "@/models/Chapter";
import Course from "@/models/Course";
import { getAuthSession } from "@/lib/session";
import * as XLSX from 'xlsx';
import mongoose from "mongoose";

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

        // Parse Correct Options
        const correctOptions: number[] = [];
        // Handle "A", "A, C", "A,C", etc.
        const chars = String(correctChar).split(',').map(s => s.trim().toUpperCase());
        
        chars.forEach(char => {
            const index = char.charCodeAt(0) - 65; // A=0, B=1...
            if (index >= 0 && index < answers.length) {
                correctOptions.push(index);
            }
        });

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
