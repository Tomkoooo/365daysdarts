"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDolgozatSubmissionsOverview, exportDolgozatGrades } from "@/actions/dolgozat-actions";
import { SubmissionsTable, type SubmissionRow } from "@/components/dolgozat/SubmissionsTable";
import { OnBehalfUploadDialog } from "@/components/dolgozat/OnBehalfUploadDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useScheduledSubmissionDelete } from "@/hooks/use-scheduled-submission-delete";

export default function DolgozatSubmissionsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const dolgozatId = params.dolgozatId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [onBehalfRow, setOnBehalfRow] = useState<SubmissionRow | null>(null);
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { hiddenSubmissionIds, scheduleSubmissionDelete } = useScheduledSubmissionDelete({
    onDeleted: () => {
      void loadRef.current();
    },
  });

  async function load() {
    try {
      const overview = await getDolgozatSubmissionsOverview(dolgozatId);
      setData(overview);
    } catch {
      toast.error("Betöltési hiba");
    } finally {
      setLoading(false);
    }
  }

  loadRef.current = load;

  useEffect(() => {
    load();
  }, [dolgozatId]);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportDolgozatGrades(dolgozatId);
      if (!result.success || !result.base64) {
        toast.error(result.error || "Export hiba");
        return;
      }
      const bytes = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(
        new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || "beadasok.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export kész");
    } catch {
      toast.error("Export hiba");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const gradeBasePath = `/lecturer/courses/${courseId}/dolgozatok/${dolgozatId}/grade`;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/lecturer/courses/${courseId}/dolgozatok`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data.dolgozat.title}</h1>
            <p className="text-muted-foreground text-sm">Beadások áttekintése</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href={`/lecturer/courses/${courseId}/dolgozatok/${dolgozatId}/edit`}>
              <Pencil className="h-4 w-4 mr-1" /> Szerkesztés
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled={exporting} onClick={handleExport}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-1" />
            )}
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Összes", value: data.summary.total },
          { label: "Beadva", value: data.summary.submitted },
          { label: "Későn", value: data.summary.late },
          { label: "Nem beadva", value: data.summary.notSubmitted },
          { label: "Értékelve", value: data.summary.graded },
        ].map((chip) => (
          <Card key={chip.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{chip.value}</div>
              <div className="text-xs text-muted-foreground">{chip.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SubmissionsTable
        rows={data.rows}
        gradeBasePath={gradeBasePath}
        hiddenSubmissionIds={hiddenSubmissionIds}
        onUploadOnBehalf={(row) => setOnBehalfRow(row)}
        onDeleteSubmission={(row) => {
          if (!row.submissionId) return;
          scheduleSubmissionDelete(row.submissionId, row.name, {
            hasGrade: row.status === "graded",
          });
        }}
      />

      {onBehalfRow && (
        <OnBehalfUploadDialog
          open={!!onBehalfRow}
          onOpenChange={(open) => !open && setOnBehalfRow(null)}
          dolgozatId={dolgozatId}
          studentId={onBehalfRow.studentId}
          studentName={onBehalfRow.name}
          hasExistingSubmission={
            !!onBehalfRow.submissionId &&
            ["submitted", "submitted_late", "graded"].includes(onBehalfRow.status)
          }
          onSuccess={load}
        />
      )}
    </div>
  );
}
