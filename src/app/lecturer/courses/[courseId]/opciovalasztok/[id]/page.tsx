"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOptionSelectorById,
  updateOptionSelector,
  exportOptionSelectorResponses,
  updateOptionSelectorResponse,
  deleteOptionSelectorResponse,
} from "@/actions/option-selector-actions";
import { OptionSelectorForm } from "@/components/option-selector/OptionSelectorForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileSpreadsheet, Loader2, Mail, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function OptionSelectorDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updatingResponseId, setUpdatingResponseId] = useState<string | null>(null);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);

  async function load() {
    try {
      const selector = await getOptionSelectorById(id);
      setData(selector);
    } catch {
      toast.error("Betöltési hiba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportOptionSelectorResponses(id);
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
      a.download = result.filename || "jelentkezesek.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export kész");
    } catch {
      toast.error("Export hiba");
    } finally {
      setExporting(false);
    }
  }

  async function handleChangeResponse(responseId: string, newOptionId: string) {
    setUpdatingResponseId(responseId);
    const result = await updateOptionSelectorResponse(id, responseId, newOptionId);
    setUpdatingResponseId(null);
    if (result.success) {
      toast.success("Jelentkezés módosítva");
      load();
    } else {
      toast.error(result.error || "Hiba történt");
    }
  }

  async function handleDeleteResponse(responseId: string, studentName: string) {
    if (!confirm(`Törlöd ${studentName} jelentkezését?`)) return;
    setDeletingResponseId(responseId);
    const result = await deleteOptionSelectorResponse(id, responseId);
    setDeletingResponseId(null);
    if (result.success) {
      toast.success("Jelentkezés törölve");
      load();
    } else {
      toast.error(result.error || "Hiba történt");
    }
  }

  function copyEmails(emails: string[]) {
    const unique = [...new Set(emails.filter(Boolean))];
    if (unique.length === 0) {
      toast.error("Nincs e-mail másolható");
      return;
    }
    navigator.clipboard.writeText(unique.join(", "));
    toast.success(`${unique.length} e-mail másolva`);
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const responsesByOption = data.options.map((opt: any) => ({
    option: opt,
    responses: (data.responses || []).filter((r: any) => r.optionId === opt._id),
  }));

  const allEmails = (data.responses || []).map((r: any) => r.studentEmail).filter(Boolean);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/lecturer/courses/${courseId}/opciovalasztok`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data.title}</h1>
            <p className="text-muted-foreground text-sm">
              Opcióválasztó kezelése
              {data.deadlineAt && (
                <>
                  {" "}
                  · Határidő: {new Date(data.deadlineAt).toLocaleString("hu-HU")}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyEmails(allEmails)}
            disabled={allEmails.length === 0}
          >
            <Copy className="h-4 w-4 mr-1" /> E-mailek másolása
          </Button>
          {allEmails.length > 0 && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${allEmails.join(",")}`}>
                <Mail className="h-4 w-4 mr-1" /> E-mail küldése
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={exporting} onClick={handleExport}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-1" />
            )}
            Excel export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">Jelentkezések</TabsTrigger>
          <TabsTrigger value="edit">Szerkesztés</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-4 mt-4">
          {responsesByOption.map(({ option, responses }: any) => (
            <Card key={option._id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{option.text}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {option.count ?? responses.length}
                    {option.limit > 0 ? ` / ${option.limit}` : ""} fő
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {responses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Még nincs jelentkező.</p>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyEmails(responses.map((r: any) => r.studentEmail))
                        }
                      >
                        <Copy className="h-3 w-3 mr-1" /> E-mailek
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Név</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Időpont</TableHead>
                          <TableHead className="min-w-[180px]">Műveletek</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responses.map((r: any) => (
                          <TableRow key={r._id}>
                            <TableCell>{r.studentName}</TableCell>
                            <TableCell>{r.studentEmail}</TableCell>
                            <TableCell>
                              {r.createdAt
                                ? new Date(r.createdAt).toLocaleString("hu-HU")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                <Select
                                  value={r.optionId}
                                  disabled={updatingResponseId === r._id}
                                  onValueChange={(value) =>
                                    handleChangeResponse(r._id, value)
                                  }
                                >
                                  <SelectTrigger className="h-9 min-w-[140px] max-w-[220px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {data.options.map((opt: any) => (
                                      <SelectItem key={opt._id} value={opt._id}>
                                        {opt.text}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-destructive shrink-0"
                                  disabled={deletingResponseId === r._id}
                                  onClick={() =>
                                    handleDeleteResponse(r._id, r.studentName)
                                  }
                                  aria-label="Jelentkezés törlése"
                                >
                                  {deletingResponseId === r._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <OptionSelectorForm
            initial={{
              title: data.title,
              description: data.description,
              allowMultiple: data.allowMultiple,
              deadlineAt: data.deadlineAt,
              isPublished: data.isPublished,
              requirements: data.requirements,
              options: data.options.map((o: any) => ({
                _id: o._id,
                text: o.text,
                limit: o.limit,
              })),
            }}
            onSubmit={async (input) => {
              const result = await updateOptionSelector(id, input);
              if (result.success) {
                toast.success("Mentve");
                load();
              }
              return result;
            }}
            onCancel={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
