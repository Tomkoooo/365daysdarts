"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/actions/course-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaManager } from "@/components/lecturer/MediaManager";
import { Loader2 } from "lucide-react";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState("");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      imageUrl: thumbnail || "/placeholder-course.jpg",
    };

    try {
      const res = await createCourse(data);
      router.push(`/lecturer/courses/${res.id}/edit`);
    } catch (error) {
      console.error("Failed to create course", error);
      alert("Valami hiba történt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-muted/10 p-4 md:p-8 flex justify-center">
        <Card className="max-w-2xl w-full h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">Új Kurzus Létrehozása</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Kurzus Címe</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="pl. Haladó technika"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Leírás</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Mit fognak tanulni a hallgatók?"
                />
              </div>

              <div className="space-y-2">
                <Label>Borítókép</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="URL vagy feltöltés"
                    className="flex-1 min-w-[200px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaPickerOpen(true)}
                  >
                    Médiatár
                  </Button>
                </div>
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt="Cover preview"
                    className="h-24 rounded border object-cover"
                  />
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                  Mégse
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kurzus Létrehozása
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <MediaManager
        open={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          setThumbnail(url);
          setIsMediaPickerOpen(false);
        }}
      />
    </div>
  );
}
