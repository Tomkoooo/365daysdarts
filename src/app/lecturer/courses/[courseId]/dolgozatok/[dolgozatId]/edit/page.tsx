"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDolgozatById, updateDolgozat } from "@/actions/dolgozat-actions";
import { DolgozatForm } from "@/components/dolgozat/DolgozatForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditDolgozatPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const dolgozatId = params.dolgozatId as string;
  const [dolgozat, setDolgozat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDolgozatById(dolgozatId)
      .then(setDolgozat)
      .catch(() => toast.error("Betöltési hiba"))
      .finally(() => setLoading(false));
  }, [dolgozatId]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dolgozat) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/lecturer/courses/${courseId}/dolgozatok/${dolgozatId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Dolgozat szerkesztése</h1>
      </div>
      <DolgozatForm
        courseId={courseId}
        initial={{
          title: dolgozat.title,
          description: dolgozat.description,
          label: dolgozat.label,
          maxPoints: dolgozat.maxPoints,
          deadlineAt: dolgozat.deadlineAt,
          isPublished: dolgozat.isPublished,
          allowResubmitUntilDeadline: dolgozat.allowResubmitUntilDeadline,
          questionFile: dolgozat.questionFile,
        }}
        onSubmit={async (input) => {
          const result = await updateDolgozat(dolgozatId, input);
          if (result.success) {
            toast.success("Mentve");
            router.push(`/lecturer/courses/${courseId}/dolgozatok/${dolgozatId}`);
          }
          return result;
        }}
        onCancel={() => router.push(`/lecturer/courses/${courseId}/dolgozatok/${dolgozatId}`)}
      />
    </div>
  );
}
