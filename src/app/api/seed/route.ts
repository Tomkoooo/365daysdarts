import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import Module from "@/models/Module";
import Chapter from "@/models/Chapter";
import Page from "@/models/Page";
import Question from "@/models/Question";
import mongoose from "mongoose";

export async function POST() {
  if (process.env.DEV_MODE !== "true") {
      return NextResponse.json({ error: "Only available in DEV_MODE" }, { status: 403 });
  }

  await connectDB();

  // 1. Clear existing generic data? Or just append?
  // Let's clear for a clean slate
  await User.deleteMany({ email: { $regex: /@example.com/ } }); // Only delete seeds
  await Course.deleteMany({});
  await Module.deleteMany({});
  await Chapter.deleteMany({});
  await Page.deleteMany({});
  await Question.deleteMany({});

  // 2. Create Admin and Student Users
  const adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      image: "",
      subscriptionStatus: "active"
  });

  const studentUser = await User.create({
      name: "Student User",
      email: "student@example.com",
      role: "student",
      image: "",
      subscriptionStatus: "active"
  });

  // 3. Create Course: "Kezdő Darts Tanfolyam"
  const course = await Course.create({
      title: "Kezdő Darts Tanfolyam",
      description: "Minden amit a darts alapjairól tudni kell.",
      price: 15000,
      isPublished: true,
      authorId: adminUser._id
  });

  // Module 1: Felszerelés
  const mod1 = await Module.create({
      title: "1. Modul: Felszerelés",
      courseId: course._id,
      description: "A tábla, a nyilak és a dobás technikája.",
      order: 1
  });

  // Chapter 1.1: A Nyíl
  const ch1 = await Chapter.create({
      title: "A Nyíl részei",
      moduleId: mod1._id,
      order: 1
  });

  // Chapter 1.2: A Tábla
  const ch2 = await Chapter.create({
      title: "A Tábla",
      moduleId: mod1._id,
      order: 2
  });

  // Create links
  await Course.findByIdAndUpdate(course._id, { $push: { modules: mod1._id } });
  await Module.findByIdAndUpdate(mod1._id, { $push: { chapters: [ch1._id, ch2._id] } });
  
  // Link Pages to Chapters
  const p1 = await Page.create({
      title: "A nyíl felépítése",
      chapterId: ch1._id,
      content: "<p>A darts nyíl 4 részből áll: hegy, test (barrel), szár (shaft) és toll (flight).</p>",
      type: "text",
      order: 1
  });
  await Chapter.findByIdAndUpdate(ch1._id, { $push: { pages: p1._id } });

  const p2 = await Page.create({
      title: "A szektorok",
      chapterId: ch2._id,
      content: "<p>A tábla 20 szektorra van osztva. A tripla gyűrű a belső, a dupla a külső.</p>",
      type: "text",
      order: 1
  });
  await Chapter.findByIdAndUpdate(ch2._id, { $push: { pages: p2._id } });

  // 4. Create Questions for Module 1
  await Question.create({
      text: "Hány részből áll egy darts nyíl?",
      options: ["2", "3", "4", "5"],
      correctOptions: [2], // "4" is index 2
      chapterId: ch1._id,
      difficulty: "easy"
  });

  await Question.create({
      text: "Melyik a legértékesebb szektor?",
      options: ["Bullseye", "Tripla 20", "Dupla 20", "Szimpla 20"],
      correctOptions: [1], 
      chapterId: ch2._id,
      difficulty: "medium"
  });

  return NextResponse.json({ success: true, message: "Database seeded with Hungarian Darts content." });
}
