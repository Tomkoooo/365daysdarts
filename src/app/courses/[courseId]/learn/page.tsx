import { getCourseWithContent, enrollInCourse, getStudentProgress } from "@/actions/course-actions";
import CoursePlayerClient from "@/components/course/CoursePlayerClient";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/session";

export default async function CourseLearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  
  const session = await getAuthSession();
  const hasAccess = session?.user?.subscriptionStatus === 'active' || session?.user?.role === 'admin';

  if (!hasAccess) {
    redirect("/dashboard");
  }

  // 1. Enroll user if not already (initializes progress)
  await enrollInCourse(courseId);

  // 2. Fetch content and progress
  const [course, progress] = await Promise.all([
    getCourseWithContent(courseId),
    getStudentProgress(courseId)
  ]);

  if (!course) {
    redirect("/dashboard");
  }

  // 3. If course is completed, don't allow re-entry
  if (progress?.courseCompleted) {
      redirect("/dashboard");
  }

  return (
    <CoursePlayerClient 
      course={course} 
      progress={progress}
      initialPageId={progress?.lastViewedPage} 
    />
  );
}
