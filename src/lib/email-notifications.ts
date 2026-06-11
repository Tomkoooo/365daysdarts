import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendEmail, getAppUrl } from "@/lib/email";
import { BrandingSettingsService } from "@/services/branding-settings";

export async function getEnrolledStudentIds(courseId: string): Promise<string[]> {
  await connectDB();
  const students = await User.find({ role: "student" }).select("progress").lean();
  const ids: string[] = [];
  for (const s of students as any[]) {
    const progress = s.progress;
    const progressObj =
      progress instanceof Map ? Object.fromEntries(progress) : progress || {};
    if (progressObj[courseId]) ids.push(s._id.toString());
  }
  return ids;
}

export async function getStudentEmails(userIds?: string[]): Promise<
  { id: string; name: string; email: string }[]
> {
  await connectDB();
  const query = userIds
    ? { _id: { $in: userIds }, role: "student" }
    : { role: "student" };
  const users = await User.find(query).select("name email").lean();
  return (users as any[])
    .filter((u) => u.email)
    .map((u) => ({
      id: u._id.toString(),
      name: u.name || "Tanuló",
      email: u.email,
    }));
}

export async function notifyStudentsAboutNewCourse(course: {
  _id: string;
  title: string;
  description?: string;
}) {
  const branding = await BrandingSettingsService.get();
  const students = await getStudentEmails();
  const courseUrl = `${getAppUrl()}/courses/${course._id}/learn`;

  for (const student of students) {
    await sendEmail({
      to: student.email,
      subject: `Új kurzus elérhető: ${course.title}`,
      html: `
        <p>Kedves ${student.name}!</p>
        <p>Új kurzus érhető el a ${branding.brandName} platformon:</p>
        <p><strong>${course.title}</strong></p>
        ${course.description ? `<p>${course.description}</p>` : ""}
        <p><a href="${courseUrl}">Kurzus megnyitása</a></p>
      `,
      text: `Kedves ${student.name}! Új kurzus: ${course.title}. ${courseUrl}`,
    });
  }
}

export async function notifyPublishedOptionSelector(selector: {
  courseId: string;
  title: string;
  description?: string;
}) {
  const branding = await BrandingSettingsService.get();
  const enrolledIds = await getEnrolledStudentIds(selector.courseId);
  const students = await getStudentEmails(enrolledIds);
  const courseUrl = `${getAppUrl()}/courses/${selector.courseId}/dolgozatok`;

  for (const student of students) {
    await sendEmail({
      to: student.email,
      subject: `Új opcióválasztó: ${selector.title}`,
      html: `
        <p>Kedves ${student.name}!</p>
        <p>Új opcióválasztó érhető el a ${branding.brandName} platformon:</p>
        <p><strong>${selector.title}</strong></p>
        ${selector.description ? `<p>${selector.description}</p>` : ""}
        <p><a href="${courseUrl}">Megnyitás</a></p>
      `,
      text: `Kedves ${student.name}! Új opcióválasztó: ${selector.title}. ${courseUrl}`,
    });
  }
}
