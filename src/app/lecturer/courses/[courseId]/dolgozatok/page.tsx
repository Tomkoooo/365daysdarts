"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listDolgozatokForCourse, archiveDolgozat, exportDolgozatGrades } from "@/actions/dolgozat-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileSpreadsheet, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useScheduledDelete } from "@/hooks/use-scheduled-delete";

export default function DolgozatokListPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const { hiddenIds, scheduleDelete } = useScheduledDelete();

  async function load() {
    try {
      const data = await listDolgozatokForCourse(courseId);
      setItems(data);
    } catch {
      toast.error("Betöltési hiba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [courseId]);

  async function handleExport(dolgozatId: string) {
    setExportingId(dolgozatId);
    try {
      const result = await exportDolgozatGrades(dolgozatId);
      if (!result.success || !result.base64) {
        toast.error(result.error || "Export hiba");
        return;
      }
      const blob = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || "beadasok.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export kész");
    } catch {
      toast.error("Export hiba");
    } finally {
      setExportingId(null);
    }
  }

  function handleArchive(item: { _id: string; title: string }) {
    scheduleDelete(item._id, {
      confirmMessage: `Biztosan archiválja a „${item.title}” dolgozatot? A művelet 10 másodpercig visszavonható.`,
      toastTitle: `${item.title} archiválva`,
      onExecute: async () => {
        const result = await archiveDolgozat(item._id);
        if (!result.success) {
          return { success: false, error: result.error || "Hiba" };
        }
      },
      onAfterExecute: () => load(),
    });
  }

  const visibleItems = items.filter((d) => !hiddenIds.includes(d._id));

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/lecturer/courses/${courseId}/edit`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dolgozatok</h1>
            <p className="text-muted-foreground text-sm">Beadandók és házi feladatok</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/lecturer/courses/${courseId}/dolgozatok/new`}>
            <Plus className="h-4 w-4 mr-2" /> Új dolgozat
          </Link>
        </Button>
      </div>

      {visibleItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Még nincs dolgozat. Hozz létre egyet!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleItems.map((d) => (
            <Card key={d._id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{d.title}</CardTitle>
                    {d.label && (
                      <Badge variant="outline" className="mt-1">
                        {d.label}
                      </Badge>
                    )}
                  </div>
                  <Badge variant={d.isPublished ? "default" : "secondary"}>
                    {d.isPublished ? "Közzétéve" : "Piszkozat"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.deadlineAt && (
                  <p className="text-sm text-muted-foreground">
                    Határidő: {new Date(d.deadlineAt).toLocaleString("hu-HU")}
                  </p>
                )}
                <p className="text-sm">
                  Beadások: {d.stats.submittedCount}/{d.stats.enrolledCount} · Értékelve:{" "}
                  {d.stats.gradedCount}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="default">
                    <Link href={`/lecturer/courses/${courseId}/dolgozatok/${d._id}`}>
                      <Users className="h-4 w-4 mr-1" /> Beadások
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/lecturer/courses/${courseId}/dolgozatok/${d._id}/edit`}>
                      Szerkesztés
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={exportingId === d._id}
                    onClick={() => handleExport(d._id)}
                  >
                    {exportingId === d._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 mr-1" />
                    )}
                    Export
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleArchive(d)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
