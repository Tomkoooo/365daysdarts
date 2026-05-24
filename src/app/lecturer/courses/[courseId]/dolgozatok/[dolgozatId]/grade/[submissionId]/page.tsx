"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSubmissionForGrading } from "@/actions/dolgozat-actions";
import { SubmissionFilesGallery } from "@/components/dolgozat/SubmissionFilesGallery";
import { GradePanel } from "@/components/dolgozat/GradePanel";
import { SubmissionStatusBadge } from "@/components/dolgozat/SubmissionStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSubmissionStatus } from "@/lib/dolgozat-utils";

export default function GradeSubmissionPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const dolgozatId = params.dolgozatId as string;
  const submissionId = params.submissionId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const result = await getSubmissionForGrading(submissionId);
      setData(result);
    } catch {
      toast.error("Betöltési hiba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { submission, dolgozat } = data;
  const status = getSubmissionStatus(submission);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/lecturer/courses/${courseId}/dolgozatok/${dolgozatId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{submission.user.name}</h1>
          <p className="text-sm text-muted-foreground">{submission.user.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {submission.uploadedOnBehalfBy && (
            <Badge variant="outline">E-mailben beadva / feltöltve</Badge>
          )}
          <SubmissionStatusBadge status={status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-3">Beadott képek</h2>
          <SubmissionFilesGallery files={submission.photos} />
        </div>
        <div>
          <GradePanel
            submissionId={submissionId}
            maxPoints={dolgozat.maxPoints}
            initialPoints={submission.points}
            initialFeedback={submission.feedback}
            isGraded={!!submission.gradedAt}
            onSaved={load}
          />
        </div>
      </div>
    </div>
  );
}
