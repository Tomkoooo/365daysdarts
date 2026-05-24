import connectDB from "@/lib/db";
import Course from "@/models/Course";
import DolgozatSubmission from "@/models/DolgozatSubmission";
import mongoose from "mongoose";

export async function canAccessProtectedMedia(
  mediaId: string,
  userId: string,
  userRole?: string
): Promise<boolean> {
  if (userRole === "admin") return true;

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) return false;

  const file = await db.collection("uploads.files").findOne({
    _id: new mongoose.Types.ObjectId(mediaId),
  });
  if (!file?.metadata?.dolgozatProtected) return true;

  const ownerId = file.metadata?.ownerId?.toString();
  if (ownerId === userId) return true;

  const submissionId = file.metadata?.submissionId?.toString();
  if (submissionId) {
    const submission = await DolgozatSubmission.findById(submissionId).lean();
    if (!submission) return false;
    if ((submission as any).userId.toString() === userId) return true;

    if (userRole === "lecturer") {
      const course = await Course.findById((submission as any).courseId).select("authorId").lean();
      if (course?.authorId?.toString() === userId) return true;
    }
  }

  return false;
}
