"use server"

import connectDB from "@/lib/db";
import Course from "@/models/Course";
import Module from "@/models/Module";
import Chapter from "@/models/Chapter";
import Page from "@/models/Page";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCourseWithContent(courseId: string) {
  const session = await getServerSession(authOptions);
  // Simpler dev mode check
  const isDev = process.env.DEV_MODE === "true";

  if (!session && !isDev) {
    throw new Error("Unauthorized");
  }

  await connectDB();

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

  // Convert ObjectIds to strings for serialization to client components
  return JSON.parse(JSON.stringify(course));
}

export async function getAllCourses() {
    // Optional: Add auth check if needed
    await connectDB();
    const courses = await Course.find({ isPublished: true })
      .select("title description thumbnail price")
      .sort({ createdAt: -1 })
      .lean();
      
    return JSON.parse(JSON.stringify(courses));
}

// --- Lecturer Actions ---

export async function createCourse(data: { title: string, description: string, imageUrl: string }) {
  const session = await getServerSession(authOptions);
  const isDev = process.env.DEV_MODE === "true";

  if (!isDev && session?.user?.role !== "lecturer" && session?.user?.role !== "admin") {
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

export async function createPage(chapterId: string, title: string, content: string = '<p>New page</p>', type: string = 'text') {
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
    
    // Delete page
    await Page.findByIdAndDelete(pageId);
    
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
    const session = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";

    if (!session && !isDev) {
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
    const progressMap = user.progress || new Map();
    const courseIds = Array.from(progressMap.keys());

    if (courseIds.length === 0) return [];

    const courses = await Course.find({ _id: { $in: courseIds } })
        .select("title description thumbnail")
        .lean();

    // Enrich with progress data
    const enrichedCourses = courses.map((course: any) => {
        const progress = progressMap.get(course._id.toString()) || {};
        return {
            ...course,
            progress: {
                completedModules: progress.completedModules || [],
                completedPages: progress.completedPages || [],
                lastViewedPage: progress.lastViewedPage || null,
                lastViewedAt: progress.lastViewedAt || null
            }
        };
    });

    return JSON.parse(JSON.stringify(enrichedCourses));
}

export async function getStudentProgress(courseId: string) {
    const session = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";

    if (!session && !isDev) {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const User = (await import("@/models/User")).default;
    const userId = session?.user?.id;
    
    if (!userId) return null;

    const user = await User.findById(userId).lean();
    if (!user) return null;

    const progressMap = user.progress || new Map();
    const progress = progressMap.get(courseId.toString()) || {};

    return JSON.parse(JSON.stringify(progress));
}

export async function updateStudentProgress(courseId: string, pageId: string) {
    const session = await getServerSession(authOptions);
    const isDev = process.env.DEV_MODE === "true";

    if (!session && !isDev) {
        throw new Error("Unauthorized");
    }

    await connectDB();

    const User = (await import("@/models/User")).default;
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
    await user.save();

    return { success: true };
}
