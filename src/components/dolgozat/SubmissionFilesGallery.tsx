"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileKindFromMime } from "@/lib/dolgozat-utils";

export type SubmissionFile = {
  order?: number;
  url: string;
  originalName?: string;
  contentType?: string;
  kind?: "image" | "document";
};

function isDocument(file: SubmissionFile): boolean {
  if (file.kind === "document") return true;
  if (file.kind === "image") return false;
  return file.contentType ? getFileKindFromMime(file.contentType) === "document" : false;
}

export function SubmissionFilesGallery({ files }: { files: SubmissionFile[] }) {
  const sorted = [...files].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const images = sorted.filter((f) => !isDocument(f));
  const documents = sorted.filter((f) => isDocument(f));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!sorted.length) {
    return <p className="text-muted-foreground text-sm">Nincs feltöltött fájl.</p>;
  }

  return (
    <div className="space-y-6">
      {images.length > 0 && (
        <div>
          {documents.length > 0 && (
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Képek</h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((photo, index) => (
              <button
                key={`${photo.order}-${photo.url}`}
                type="button"
                className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted"
                onClick={() => setLightboxIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`${index + 1}. oldal`}
                  className="object-cover w-full h-full"
                />
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {sorted.indexOf(photo) + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          {images.length > 0 && (
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Dokumentumok</h3>
          )}
          <div className="grid gap-2">
            {documents.map((doc, index) => (
              <a
                key={`${doc.order}-${doc.url}`}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">
                  {doc.originalName || `Dokumentum ${index + 1}`}
                </span>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Letöltés</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl p-2 bg-navy-darker border-navy-lighter">
          {lightboxIndex !== null && images[lightboxIndex] && (
            <div className="relative flex flex-col items-center gap-4">
              <div className="relative w-full max-h-[80vh] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[lightboxIndex].url}
                  alt=""
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={lightboxIndex === 0}
                  onClick={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {lightboxIndex + 1} / {images.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={lightboxIndex === images.length - 1}
                  onClick={() =>
                    setLightboxIndex((i) =>
                      i !== null && i < images.length - 1 ? i + 1 : i
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** @deprecated use SubmissionFilesGallery */
export const SubmissionGallery = SubmissionFilesGallery;
