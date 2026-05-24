"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, ChevronUp, Loader2, Trash2, Plus } from "lucide-react";
import { MAX_SUBMISSION_PHOTOS } from "@/lib/dolgozat-utils";
import { toast } from "sonner";
import type { PhotoInput } from "@/actions/dolgozat-actions";

export type LocalPhoto = PhotoInput & { localId: string };

async function compressAndUpload(file: File): Promise<PhotoInput> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: "image/jpeg",
  });

  const formData = new FormData();
  formData.append("file", compressed, file.name.replace(/\.\w+$/, ".jpg"));

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!data.success || !data.url) {
    throw new Error(data.message || "Feltöltési hiba");
  }

  const mediaId = data.url.split("/").pop()!;
  return {
    mediaId,
    url: data.url,
    originalName: file.name,
    contentType: "image/jpeg",
  };
}

export function SubmissionPhotoUploader({
  photos,
  onChange,
  disabled,
}: {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || disabled) return;
    const remaining = MAX_SUBMISSION_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_SUBMISSION_PHOTOS} kép`);
      return;
    }

    const toAdd = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: LocalPhoto[] = [];
      for (const file of toAdd) {
        const photo = await compressAndUpload(file);
        uploaded.push({ ...photo, localId: crypto.randomUUID() });
      }
      onChange([...photos, ...uploaded]);
      toast.success(`${uploaded.length} kép feltöltve`);
    } catch (e: any) {
      toast.error(e.message || "Feltöltési hiba");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(localId: string) {
    onChange(photos.filter((p) => p.localId !== localId));
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const next = [...photos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {photos.length} / {MAX_SUBMISSION_PHOTOS} kép
        </p>
        {!disabled && photos.length < MAX_SUBMISSION_PHOTOS && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="gap-2 min-h-12"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            <Camera className="h-5 w-5" />
            Kép hozzáadása
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="space-y-3">
        {photos.map((photo, index) => (
          <div
            key={photo.localId}
            className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card"
          >
            <span className="text-sm font-medium w-6 text-center">{index + 1}</span>
            <div className="relative w-16 h-20 rounded overflow-hidden shrink-0 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="object-cover w-full h-full" />
            </div>
            {!disabled && (
              <div className="flex flex-col gap-1 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => movePhoto(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === photos.length - 1}
                  onClick={() => movePhoto(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removePhoto(photo.localId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
