"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Camera, ChevronDown, ChevronUp, FileText, Loader2, Trash2, Plus } from "lucide-react";
import {
  MAX_SUBMISSION_FILES,
  MAX_DOCUMENT_SIZE_BYTES,
  isImageMime,
  isDocumentMime,
  getFileKindFromMime,
} from "@/lib/dolgozat-utils";
import { toast } from "sonner";
import type { PhotoInput } from "@/actions/dolgozat-actions";

export type LocalFile = PhotoInput & { localId: string };

const ACCEPT =
  "image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function uploadFile(file: File): Promise<PhotoInput> {
  if (isImageMime(file.type)) {
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
    if (!data.success || !data.url) throw new Error(data.message || "Feltöltési hiba");
    const mediaId = data.url.split("/").pop()!;
    return {
      mediaId,
      url: data.url,
      originalName: file.name,
      contentType: "image/jpeg",
      kind: "image",
    };
  }

  if (isDocumentMime(file.type)) {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new Error("A dokumentum maximum 15 MB lehet");
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.success || !data.url) throw new Error(data.message || "Feltöltési hiba");
    const mediaId = data.url.split("/").pop()!;
    return {
      mediaId,
      url: data.url,
      originalName: file.name,
      contentType: file.type,
      kind: "document",
    };
  }

  throw new Error("Érvénytelen fájltípus. Kép, PDF vagy Word engedélyezett.");
}

export function SubmissionFileUploader({
  files,
  onChange,
  disabled,
}: {
  files: LocalFile[];
  onChange: (files: LocalFile[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length || disabled) return;
    const remaining = MAX_SUBMISSION_FILES - files.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_SUBMISSION_FILES} fájl`);
      return;
    }

    const toAdd = Array.from(fileList).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: LocalFile[] = [];
      for (const file of toAdd) {
        const item = await uploadFile(file);
        uploaded.push({ ...item, localId: crypto.randomUUID() });
      }
      onChange([...files, ...uploaded]);
      toast.success(`${uploaded.length} fájl feltöltve`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Feltöltési hiba");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeFile(localId: string) {
    onChange(files.filter((f) => f.localId !== localId));
  }

  function moveFile(index: number, direction: -1 | 1) {
    const next = [...files];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {files.length} / {MAX_SUBMISSION_FILES} fájl
        </p>
        {!disabled && files.length < MAX_SUBMISSION_FILES && (
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
            Kép / PDF / Word
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="space-y-3">
        {files.map((file, index) => {
          const isDoc = file.kind === "document" || getFileKindFromMime(file.contentType) === "document";
          return (
            <div
              key={file.localId}
              className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card"
            >
              <span className="text-sm font-medium w-6 text-center">{index + 1}</span>
              {isDoc ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate">{file.originalName || "Dokumentum"}</span>
                </div>
              ) : (
                <div className="relative w-16 h-20 rounded overflow-hidden shrink-0 bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.url} alt="" className="object-cover w-full h-full" />
                </div>
              )}
              {!disabled && (
                <div className="flex flex-col gap-1 ml-auto shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => moveFile(index, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === files.length - 1}
                    onClick={() => moveFile(index, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFile(file.localId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** @deprecated use SubmissionFileUploader */
export const SubmissionPhotoUploader = SubmissionFileUploader;
export type LocalPhoto = LocalFile;
