"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listOptionSelectorsForCourse,
  archiveOptionSelector,
} from "@/actions/option-selector-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OptionSelectorsListPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await listOptionSelectorsForCourse(courseId);
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

  async function handleArchive(id: string) {
    if (!confirm("Archiválod ezt az opcióválasztót?")) return;
    const result = await archiveOptionSelector(id);
    if (result.success) {
      toast.success("Archiválva");
      load();
    } else {
      toast.error(result.error || "Hiba");
    }
  }

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
            <h1 className="text-2xl md:text-3xl font-bold">Opcióválasztók</h1>
            <p className="text-muted-foreground text-sm">
              Időpont-jelentkezés, témaválasztás stb.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/lecturer/courses/${courseId}/opciovalasztok/new`}>
            <Plus className="h-4 w-4 mr-2" /> Új opcióválasztó
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Még nincs opcióválasztó. Hozz létre egyet!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item._id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.options.length} opció ·{" "}
                      {item.allowMultiple ? "több választható" : "egy választható"}
                      {item.deadlineAt && (
                        <>
                          {" "}
                          · Határidő:{" "}
                          {new Date(item.deadlineAt).toLocaleString("hu-HU")}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant={item.isPublished ? "default" : "secondary"}>
                    {item.isPublished ? "Közzétéve" : "Piszkozat"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/lecturer/courses/${courseId}/opciovalasztok/${item._id}`}>
                    <Users className="h-4 w-4 mr-1" />
                    Jelentkezések ({item.stats.uniqueStudents})
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleArchive(item._id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Archiválás
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
