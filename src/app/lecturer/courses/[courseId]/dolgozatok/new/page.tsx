"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createDolgozat } from "@/actions/dolgozat-actions";
import { DolgozatForm } from "@/components/dolgozat/DolgozatForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewDolgozatPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/lecturer/courses/${courseId}/dolgozatok`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Új dolgozat</h1>
      </div>
      <DolgozatForm
        courseId={courseId}
        onSubmit={async (input) => {
          const result = await createDolgozat(courseId, input);
          if (result.success && result.id) {
            toast.success("Dolgozat létrehozva");
            router.push(`/lecturer/courses/${courseId}/dolgozatok/${result.id}`);
          }
          return result;
        }}
        onCancel={() => router.push(`/lecturer/courses/${courseId}/dolgozatok`)}
      />
    </div>
  );
}
