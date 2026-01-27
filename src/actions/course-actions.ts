"use server"

import connectDB from "@/lib/db";
import Course from "@/models/Course";
import Module from "@/models/Module";
import Chapter from "@/models/Chapter";
import Page from "@/models/Page";
import { authOptions } from "@/lib/auth";
import { getAuthSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import User from "@/models/User";

export async function getCourseWithContent(courseId: string) {
  const session = await getAuthSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await connectDB();
  const Course = (await import("@/models/Course")).default;
  const Module = (await import("@/models/Module")).default;
  const Chapter = (await import("@/models/Chapter")).default;
  const Page = (await import("@/models/Page")).default;

  const course = await Course.findById(courseId).populate({
    path: "modules",
    model: Module,
    populate: {
      path: "chapters",
      model: Chapter,
      populate: {
          path: "pages",
          model: Page
      }
    },
  }).lean(); // lean() for simpler serialization

  if (!course) return null;

  // Security: Only allow admins/lecturers to view unpublished courses
  if (!course.isPublished && session.user?.role !== 'admin' && session.user?.role !== 'lecturer') {
      return null;
  }

  // Convert ObjectIds to strings for serialization to client components
  return JSON.parse(JSON.stringify(course));
}

export async function getAllCourses(onlyPublished: boolean = true) {
    const session = await getAuthSession();
    await connectDB();
    
    // If onlyPublished is false, ensure user is lecturer or admin
    if (!onlyPublished && session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
        throw new Error("Unauthorized access to unpublished courses");
    }

    const query = onlyPublished ? { isPublished: true } : {};
    
    // If lecturer, they should only see their own courses when looking at unpublished
    // (Optional: but good practice. For now I'll just follow the specific request)
    
    const courses = await Course.find(query)
      .select("title description thumbnail price isPublished")
      .sort({ createdAt: -1 })
      .lean();
      
    return JSON.parse(JSON.stringify(courses));
}

// --- Lecturer Actions ---

export async function createCourse(data: { title: string, description: string, imageUrl: string }) {
  const session = await getAuthSession();

  if (session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
      throw new Error("Unauthorized");
  }

  await connectDB();

  const newCourse = await Course.create({
      title: data.title,
      description: data.description,
      thumbnail: data.imageUrl,
      isPublished: false, // Draft by default
      modules: [],
      authorId: session?.user?.id
  });

  return { id: newCourse._id.toString() };
}

export async function createModule(courseId: string, title: string) {
    await connectDB();
    const newModule = await Module.create({ title, courseId, chapters: [] });
    await Course.findByIdAndUpdate(courseId, { $push: { modules: newModule._id } });
    return JSON.parse(JSON.stringify(newModule));
}

export async function createChapter(moduleId: string, title: string) {
    await connectDB();
    const newChapter = await Chapter.create({ title, moduleId, pages: [] });
    await Module.findByIdAndUpdate(moduleId, { $push: { chapters: newChapter._id } });
    return JSON.parse(JSON.stringify(newChapter));
}

export async function updateCourse(courseId: string, data: { title?: string, description?: string, price?: number, isPublished?: boolean, thumbnail?: string }) {
    await connectDB();
    const updatedCourse = await Course.findByIdAndUpdate(courseId, data, { new: true });
    return JSON.parse(JSON.stringify(updatedCourse));
}

export async function updateModule(moduleId: string, data: { title?: string }) {
    await connectDB();
    const updatedModule = await Module.findByIdAndUpdate(moduleId, data, { new: true });
    return JSON.parse(JSON.stringify(updatedModule));
}

export async function updateChapter(chapterId: string, data: { title?: string }) {
    await connectDB();
    const updatedChapter = await Chapter.findByIdAndUpdate(chapterId, data, { new: true });
    return JSON.parse(JSON.stringify(updatedChapter));
}

export async function createPage(chapterId: string, title: string, content: string = '<p>Új oldal</p>', type: string = 'text') {
    await connectDB();
    const newPage = await Page.create({ title, chapterId, type, content });
    await Chapter.findByIdAndUpdate(chapterId, { $push: { pages: newPage._id } });
    return JSON.parse(JSON.stringify(newPage));
}

export async function createPageBatch(chapterId: string, pages: { title: string, type: string, content?: string, mediaUrl?: string, pdfPageIndex?: number, pdfTotalPages?: number }[]) {
    await connectDB();
    
    // Get current page count to determine order
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) throw new Error("Chapter not found");
    
    const existingPagesCount = chapter.pages.length;

    const newPages = await Page.insertMany(pages.map((p, idx) => ({
        ...p,
        chapterId,
        order: existingPagesCount + idx
    })));
    
    const newPageIds = newPages.map(p => p._id);
    await Chapter.findByIdAndUpdate(chapterId, { $push: { pages: { $each: newPageIds } } });
    
    return JSON.parse(JSON.stringify(newPages));
}

export async function updatePage(pageId: string, data: { title?: string, content?: string, type?: string, mediaUrl?: string }) {
    await connectDB();
    const updatedPage = await Page.findByIdAndUpdate(pageId, data, { new: true });
    return JSON.parse(JSON.stringify(updatedPage));
}

export async function deletePage(pageId: string) {
    await connectDB();
    const page = await Page.findById(pageId);
    if (!page) throw new Error("Page not found");

    // Remove from chapter
    await Chapter.findByIdAndUpdate(page.chapterId, { $pull: { pages: pageId } });
    
    return { success: true };
}

export async function deleteModule(moduleId: string) {
    await connectDB();
    const module = await Module.findById(moduleId).populate('chapters');
    if (!module) throw new Error("Module not found");

    // Cascading delete chapters and their pages
    for (const chapter of module.chapters) {
        await Page.deleteMany({ chapterId: chapter._id });
        await Chapter.findByIdAndDelete(chapter._id);
    }

    // Remove from course
    await Course.findByIdAndUpdate(module.courseId, { $pull: { modules: moduleId } });
    
    // Delete module
    await Module.findByIdAndDelete(moduleId);
    
    return { success: true };
}

export async function deleteChapter(chapterId: string) {
    await connectDB();
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) throw new Error("Chapter not found");

    // Cascading delete pages
    await Page.deleteMany({ chapterId: chapterId });

    // Remove from module
    await Module.findByIdAndUpdate(chapter.moduleId, { $pull: { chapters: chapterId } });
    
    // Delete chapter
    await Chapter.findByIdAndDelete(chapterId);
    
    return { success: true };
}

export async function updateModuleSettings(moduleId: string, settings: { quizSettings: any }) {
    await connectDB();
    const updatedModule = await Module.findByIdAndUpdate(moduleId, { quizSettings: settings.quizSettings }, { new: true });
    return JSON.parse(JSON.stringify(updatedModule));
}

export async function updateCourseSettings(courseId: string, settings: { finalExamSettings: any }) {
    await connectDB();
    const updatedCourse = await Course.findByIdAndUpdate(courseId, { finalExamSettings: settings.finalExamSettings }, { new: true });
    return JSON.parse(JSON.stringify(updatedCourse));
}

// --- Student Progress Actions ---

export async function getStudentCourses() {
    const session = await getAuthSession();

    if (!session) {
        throw new Error("Unauthorized");
    }

    await connectDB();

    // Import User model
    const User = (await import("@/models/User")).default;
    const userId = session?.user?.id;
    
    if (!userId) return [];

    const user = await User.findById(userId).lean();
    if (!user) return [];

    // Get all courses where user has progress
    // Since we used .lean(), progress is a plain object, not a Map
    const progressObj = user.progress || {};
    const courseIds = Object.keys(progressObj);

    if (courseIds.length === 0) return [];

    const courses = await Course.find({ _id: { $in: courseIds } })
        .populate({
            path: "modules",
            populate: {
                path: "chapters",
                populate: {
                    path: "pages",
                    select: "_id"
                }
            }
        })
        .lean();

    // Enrich with progress data
    const enrichedCourses = courses.map((course: any) => {
        const progress = progressObj[course._id.toString()] || {};
        
        // Count total pages
        let totalPages = 0;
        course.modules?.forEach((m: any) => {
            m.chapters?.forEach((c: any) => {
                totalPages += c.pages?.length || 0;
            });
        });

        const completedPages = progress.completedPages?.length || 0;
        let progressPercent = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
        
        // If course is fully completed, ensure 100%
        if (progress.courseCompleted) {
            progressPercent = 100;
        }

        return {
            _id: course._id.toString(),
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            progress: {
                completedModules: progress.completedModules || [],
                completedPages: progress.completedPages || [],
                lastViewedPage: progress.lastViewedPage || null,
                lastViewedAt: progress.lastViewedAt || null,
                percent: progressPercent,
                courseCompleted: progress.courseCompleted || false
            }
        };
    });

    return JSON.parse(JSON.stringify(enrichedCourses));
}

export async function enrollInCourse(courseId: string) {
    const session = await getAuthSession();

    if (!session) {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const User = (await import("@/models/User")).default;
    const userId = session?.user?.id;
    
    if (!userId) return { success: false };

    const user = await User.findById(userId);
    if (!user) return { success: false };

    // Security: Check if course is published
    const course = await Course.findById(courseId);
    if (!course?.isPublished && session.user?.role !== 'admin') {
        return { success: false, error: "Course not published" };
    }

    if (!user.progress) user.progress = new Map();

    // Only initialize if not already enrolled
    if (!user.progress || !user.progress.has(courseId.toString())) {
        if (!user.progress) user.progress = new Map();
        
        user.progress.set(courseId.toString(), {
            completedModules: [],
            completedPages: [],
            lastViewedPage: null,
            lastViewedAt: new Date()
        });
        
        user.markModified('progress');
        await user.save();
    }

    return { success: true };
}

export async function getStudentProgress(courseId: string) {
    const session = await getAuthSession();

    if (!session) {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const User = (await import("@/models/User")).default;
    const userId = session?.user?.id;
    
    if (!userId) return null;

    const user = await User.findById(userId).lean();
    if (!user) return null;

    const progressObj = user.progress || {};
    const progress = progressObj[courseId.toString()] || {};

    return JSON.parse(JSON.stringify(progress));
}

export async function updateStudentProgress(courseId: string, pageId: string) {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    
    if (!userId) return { success: false };

    const user = await User.findById(userId);
    if (!user) return { success: false };

    // Initialize progress map if needed
    if (!user.progress) user.progress = new Map();

    let courseProgress = user.progress.get(courseId.toString()) || {
        completedModules: [],
        completedPages: [],
        lastViewedPage: null,
        lastViewedAt: null
    };

    // Update last viewed page and timestamp
    courseProgress.lastViewedPage = pageId;
    courseProgress.lastViewedAt = new Date();

    // Add to completed pages if not already there
    if (!courseProgress.completedPages) courseProgress.completedPages = [];
    if (!courseProgress.completedPages.includes(pageId)) {
        courseProgress.completedPages.push(pageId);
    }

    user.progress.set(courseId.toString(), courseProgress);
    user.markModified('progress');
    await user.save();

    return { success: true };
}
