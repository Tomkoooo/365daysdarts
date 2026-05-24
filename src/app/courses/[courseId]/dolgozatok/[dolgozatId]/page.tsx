"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getStudentDolgozatWithSubmission,
  saveSubmissionPhotos,
  submitDolgozat,
} from "@/actions/dolgozat-actions";
import {
  SubmissionPhotoUploader,
  type LocalPhoto,
} from "@/components/dolgozat/SubmissionPhotoUploader";
import { SubmissionGallery } from "@/components/dolgozat/SubmissionGallery";
import { SubmissionStatusBadge } from "@/components/dolgozat/SubmissionStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SubmissionStatus } from "@/lib/dolgozat-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StudentDolgozatPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const dolgozatId = params.dolgozatId as string;
  const [data, setData] = useState<any>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    try {
      const result = await getStudentDolgozatWithSubmission(dolgozatId);
      setData(result);
      if (result.submission?.photos) {
        setPhotos(
          result.submission.photos.map((p: any) => ({
            ...p,
            mediaId: p.mediaId?.toString?.() || p.mediaId,
            localId: p.mediaId?.toString?.() || p.url,
          }))
        );
      } else {
        setPhotos([]);
      }
    } catch {
      toast.error("Betöltési hiba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [dolgozatId]);

  async function handleSavePhotos() {
    if (!photos.length) {
      toast.error("Legalább egy kép szükséges");
      return;
    }
    setSaving(true);
    const result = await saveSubmissionPhotos(
      dolgozatId,
      photos.map(({ localId, ...p }) => p)
    );
    setSaving(false);
    if (result.success) {
      toast.success("Képek mentve");
      load();
    } else {
      toast.error(result.error || "Mentési hiba");
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    const saveResult = await saveSubmissionPhotos(
      dolgozatId,
      photos.map(({ localId, ...p }) => p)
    );
    if (!saveResult.success) {
      setSubmitting(false);
      toast.error(saveResult.error || "Mentési hiba");
      return;
    }
    const result = await submitDolgozat(dolgozatId);
    setSubmitting(false);
    setConfirmOpen(false);
    if (result.success) {
      toast.success("Sikeres beadás!");
      load();
    } else {
      toast.error(result.error || "Beadási hiba");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { dolgozat, editable, status } = data;
  const isGraded = status === "graded";
  const showUploader = editable && !isGraded;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 pb-24">
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur py-3 -mx-4 px-4 border-b md:static md:border-0 md:bg-transparent md:p-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/courses/${courseId}/dolgozatok`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{dolgozat.title}</h1>
            {dolgozat.deadlineAt && (
              <p className="text-xs text-muted-foreground">
                Határidő: {new Date(dolgozat.deadlineAt).toLocaleString("hu-HU")}
              </p>
            )}
          </div>
          <SubmissionStatusBadge status={status as SubmissionStatus} />
        </div>
      </div>

      {dolgozat.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utasítások</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{dolgozat.description}</p>
          </CardContent>
        </Card>
      )}

      {dolgozat.questionFile && (
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <a href={dolgozat.questionFile.url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            {dolgozat.questionFile.originalName || "Kérdőív letöltése"}
          </a>
        </Button>
      )}

      {isGraded && data.submission && (
        <Card className="border-cta/30">
          <CardHeader>
            <CardTitle className="text-base">Értékelés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold">
              {data.submission.points} / {dolgozat.maxPoints} pont
            </p>
            {data.submission.feedback && (
              <p className="text-sm whitespace-pre-wrap">{data.submission.feedback}</p>
            )}
          </CardContent>
        </Card>
      )}

      {showUploader ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Képek feltöltése</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SubmissionPhotoUploader
              photos={photos}
              onChange={setPhotos}
              disabled={saving || submitting}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleSavePhotos}
                disabled={saving || !photos.length}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Piszkozat mentése
              </Button>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={submitting || !photos.length}
                className="flex-1"
              >
                Beadás
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="font-semibold mb-3">Beadott képek</h2>
          <SubmissionGallery photos={photos} />
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beadás megerősítése</DialogTitle>
            <DialogDescription>
              Biztosan beadod a dolgozatot? {photos.length} kép kerül beküldésre.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Mégse
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Végleges beadás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
