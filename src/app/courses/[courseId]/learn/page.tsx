import { getCourseWithContent } from "@/actions/course-actions";
import CoursePlayerClient from "@/components/course/CoursePlayerClient";
import { redirect } from "next/navigation";

export default async function CourseLearnPage({ params }: { params: { courseId: string } }) {
  const course = await getCourseWithContent(params.courseId);

  if (!course) {
    redirect("/dashboard");
  }

  return <CoursePlayerClient course={course} />;
}
