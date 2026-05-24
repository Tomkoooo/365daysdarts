"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Photo = {
  order?: number;
  url: string;
  originalName?: string;
};

export function SubmissionGallery({ photos }: { photos: Photo[] }) {
  const sorted = [...photos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!sorted.length) {
    return <p className="text-muted-foreground text-sm">Nincs feltöltött kép.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sorted.map((photo, index) => (
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
              {index + 1}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl p-2 bg-navy-darker border-navy-lighter">
          {lightboxIndex !== null && (
            <div className="relative flex flex-col items-center gap-4">
              <div className="relative w-full max-h-[80vh] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sorted[lightboxIndex].url}
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
                  {lightboxIndex + 1} / {sorted.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={lightboxIndex === sorted.length - 1}
                  onClick={() =>
                    setLightboxIndex((i) =>
                      i !== null && i < sorted.length - 1 ? i + 1 : i
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
    </>
  );
}
