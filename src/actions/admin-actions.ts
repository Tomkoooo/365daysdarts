"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export async function getAllUsers() {
  await requireAdmin();
  await connectDB();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(users));
}

export async function updateUserRole(userId: string, newRole: string) {
  const admin = await requireAdmin();
  await connectDB();
  await User.findByIdAndUpdate(userId, { role: newRole });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true, updatedSelf: admin.id === userId };
}

export async function updateSubscriptionStatus(userId: string, newStatus: string) {
  await requireAdmin();
  await connectDB();
  await User.findByIdAndUpdate(userId, { subscriptionStatus: newStatus });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true };
}
