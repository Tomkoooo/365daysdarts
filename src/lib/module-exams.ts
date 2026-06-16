import mongoose from "mongoose";
import Question from "@/models/Question";

export async function getModuleIdsWithQuestions(moduleIds: string[]): Promise<Set<string>> {
  if (moduleIds.length === 0) return new Set();

  const objectIds = moduleIds.map((id) => new mongoose.Types.ObjectId(id));
  const counts = await Question.aggregate([
    { $match: { moduleId: { $in: objectIds } } },
    { $group: { _id: "$moduleId", count: { $sum: 1 } } },
  ]);

  return new Set(
    counts.filter((entry) => entry.count > 0).map((entry) => entry._id.toString())
  );
}

export function isEligibleForFinalExam(
  completedModules: string[],
  moduleIdsRequiringExam: string[],
  finalExamUnlocked = false
): boolean {
  if (finalExamUnlocked) return true;
  if (moduleIdsRequiringExam.length === 0) return true;

  return moduleIdsRequiringExam.every((moduleId) => completedModules.includes(moduleId));
}
