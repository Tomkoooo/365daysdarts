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

export async function updatePage(pageId: string, data: { title?: string, content?: string, type?: string, mediaUrl?: string }) {
    await connectDB();
    const updatedPage = await Page.findByIdAndUpdate(pageId, data, { new: true });
    return JSON.parse(JSON.stringify(updatedPage));
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
