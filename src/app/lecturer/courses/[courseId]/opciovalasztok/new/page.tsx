"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createOptionSelector } from "@/actions/option-selector-actions";
import { OptionSelectorForm } from "@/components/option-selector/OptionSelectorForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewOptionSelectorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/lecturer/courses/${courseId}/opciovalasztok`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Új opcióválasztó</h1>
      </div>
      <OptionSelectorForm
        onSubmit={async (input) => {
          const result = await createOptionSelector(courseId, input);
          if (result.success && result.id) {
            toast.success("Opcióválasztó létrehozva");
            router.push(`/lecturer/courses/${courseId}/opciovalasztok/${result.id}`);
          }
          return result;
        }}
        onCancel={() => router.push(`/lecturer/courses/${courseId}/opciovalasztok`)}
      />
    </div>
  );
}
