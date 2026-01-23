"use server"

import connectDB from "@/lib/db";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { getAuthSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getAllUsers() {
  const session = await getAuthSession();

  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await connectDB();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export async function updateUserRole(userId: string, newRole: string) {
  const session = await getAuthSession();

  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await connectDB();
  await User.findByIdAndUpdate(userId, { role: newRole });
  revalidatePath("/dashboard");
  return { success: true };
}
