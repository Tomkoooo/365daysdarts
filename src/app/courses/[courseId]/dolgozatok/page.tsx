import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/session";
import { enrollInCourse } from "@/actions/course-actions";
import { listPublishedDolgozatokForStudent } from "@/actions/dolgozat-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dolgozat/SubmissionStatusBadge";
import { ArrowLeft } from "lucide-react";
import type { SubmissionStatus } from "@/lib/dolgozat-utils";

export default async function StudentDolgozatokListPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getAuthSession();
  const hasAccess =
    session?.user?.subscriptionStatus === "active" || session?.user?.role === "admin";

  if (!hasAccess) redirect("/dashboard");
  if (!session?.user?.id) redirect("/login");

  await enrollInCourse(courseId);

  let items: any[] = [];
  try {
    items = await listPublishedDolgozatokForStudent(courseId);
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/courses/${courseId}/learn`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Dolgozatok</h1>
          <p className="text-muted-foreground text-sm">Beadandók és házi feladatok</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Jelenleg nincs közzétett dolgozat.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((d) => (
            <Card key={d._id} className="hover:border-cta/50 transition-colors">
              <Link href={`/courses/${courseId}/dolgozatok/${d._id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{d.title}</CardTitle>
                    <SubmissionStatusBadge status={d.myStatus as SubmissionStatus} />
                  </div>
                  {d.label && (
                    <span className="text-sm text-muted-foreground">{d.label}</span>
                  )}
                </CardHeader>
                <CardContent>
                  {d.deadlineAt && (
                    <p className="text-sm text-muted-foreground">
                      Határidő: {new Date(d.deadlineAt).toLocaleString("hu-HU")}
                    </p>
                  )}
                  {d.myPoints != null && (
                    <p className="text-sm font-medium mt-1">
                      Pontszám: {d.myPoints} / {d.maxPoints}
                    </p>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
