"use server"

import connectDB from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getBusinessStats() {
  const session = await getServerSession(authOptions);
  const isDev = process.env.DEV_MODE === "true";

  if (!isDev && session?.user?.role !== "business" && session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await connectDB();

  // Count active subscriptions
  const activeSubs = await User.countDocuments({ subscriptionStatus: 'active' });
  
  // Get list of standard users (students) for potential viewing
  const students = await User.find({ role: 'student' })
    .select('name email subscriptionStatus')
    .sort({ createdAt: -1 })
    .limit(50) // Limit for performance
    .lean();

  return {
    revenue: activeSubs * 10, // Mock revenue (e.g. $10/user)
    activeSubscriptions: activeSubs,
    students: JSON.parse(JSON.stringify(students))
  };
}
