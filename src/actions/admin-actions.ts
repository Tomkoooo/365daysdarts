"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import DolgozatSubmission from "@/models/DolgozatSubmission";
import OptionSelector from "@/models/OptionSelector";
import ExamResult from "@/models/ExamResult";
import { requireAdmin } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { BrandingSettingsService } from "@/services/branding-settings";
import { sendEmail } from "@/lib/email";
import { getEnrolledStudentIds, getStudentEmails } from "@/lib/email-notifications";

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

export async function getAdminDashboardStats() {
  await requireAdmin();
  await connectDB();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const branding = await BrandingSettingsService.get();

  const [
    totalUsers,
    totalCourses,
    newRegistrations,
    submittedDolgozats,
    completedCourses,
    optionSelectors,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since } }),
    DolgozatSubmission.countDocuments({ submittedAt: { $gte: since } }),
    ExamResult.countDocuments({
      type: "final",
      completedAt: { $gte: since },
    }),
    OptionSelector.find({ "responses.createdAt": { $gte: since } })
      .select("responses")
      .lean(),
  ]);

  let selectedOptions = 0;
  for (const selector of optionSelectors as any[]) {
    for (const response of selector.responses || []) {
      const createdAt = new Date(response.createdAt);
      if (createdAt >= since) selectedOptions++;
    }
  }

  let revenue: number | null = null;
  let activeSubscriptions: number | null = null;

  if (branding.enableBilling) {
    activeSubscriptions = await User.countDocuments({
      subscriptionStatus: "active",
    });
    revenue = activeSubscriptions * 10;
  }

  return {
    totalUsers,
    totalCourses,
    enableBilling: branding.enableBilling,
    revenue,
    activeSubscriptions,
    recentActivity: {
      newRegistrations,
      submittedDolgozats,
      selectedOptions,
      completedCourses,
    },
  };
}

export async function sendBulkEmailAction(
  subject: string,
  htmlContent: string,
  courseId?: string
) {
  await requireAdmin();

  if (!subject.trim()) {
    return { success: false, error: "A tárgy megadása kötelező" };
  }
  if (!htmlContent.trim()) {
    return { success: false, error: "Az üzenet megadása kötelező" };
  }

  let recipients: { id: string; name: string; email: string }[];

  if (courseId) {
    const enrolledIds = await getEnrolledStudentIds(courseId);
    recipients = await getStudentEmails(enrolledIds);
  } else {
    recipients = await getStudentEmails();
  }

  if (recipients.length === 0) {
    return { success: false, error: "Nincs címzett" };
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient.email,
      subject: subject.trim(),
      html: htmlContent,
      text: htmlContent.replace(/<[^>]+>/g, ""),
    });
    if (result.success) sent++;
    else failed++;
  }

  return {
    success: failed === 0,
    sent,
    failed,
    total: recipients.length,
    error: failed > 0 ? `${failed} e-mail küldése sikertelen` : undefined,
  };
}
