"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addContentBlock,
  deleteContentBlock,
  ensureMarketingPagesSeeded,
  getContentPageAdmin,
  getContentPagesAdmin,
  publishContentPage,
  reorderContentBlocks,
  restoreMarketingPagesDefaults,
  runContentPageSmokeTests,
  unpublishContentPage,
  updateContentBlock,
  updateContentPageTitle,
  upsertContentPage,
} from "@/actions/content-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaManager } from "@/components/lecturer/MediaManager";
import { ArrowDown, ArrowUp, Eye, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { CONTENT_BLOCK_TYPES, BLOCK_TYPE_LABELS, ContentBlockType } from "@/lib/content/types";
import { MarketingBlockRenderer } from "@/components/content/MarketingBlockRenderer";
import { toast } from "sonner";

type ContentPageSummary = {
  slug: string;
  title: string;
  status: "draft" | "published";
  updatedAt: string;
  publishedAt?: string;
};

type ContentBlock = {
  blockId: string;
  type: ContentBlockType;
  order: number;
  payload: any;
};

type ContentPageDetail = {
  slug: string;
  title: string;
  status: "draft" | "published";
  draftBlocks: ContentBlock[];
  publishedBlocks: ContentBlock[];
};

interface ContentCmsEditorProps {
  initialPages: ContentPageSummary[];
}

export default function ContentCmsEditor({ initialPages }: ContentCmsEditorProps) {
  const [pages, setPages] = useState<ContentPageSummary[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState(initialPages[0]?.slug || "");
  const [page, setPage] = useState<ContentPageDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBlockType, setNewBlockType] = useState<ContentBlockType>("hero");
  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");
  const [editablePageTitle, setEditablePageTitle] = useState("");

  async function refreshPages() {
    const allPages = await getContentPagesAdmin();
    setPages(allPages);
    if (!selectedSlug && allPages.length > 0) {
      setSelectedSlug(allPages[0].slug);
    }
  }

  async function loadPage(slug: string) {
    const response = await getContentPageAdmin(slug);
    setPage(response);
    setEditablePageTitle(response?.title || "");
  }

  async function runAction<T>(
    action: () => Promise<T>,
    opts?: { success?: string; error?: string }
  ) {
    try {
      const result = await action();
      if (opts?.success) toast.success(opts.success);
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : opts?.error || "Ismeretlen hiba történt.";
      toast.error(opts?.error || message);
      return null;
    }
  }

  useEffect(() => {
    if (!selectedSlug) {
      setPage(null);
      return;
    }
    startTransition(() => {
      loadPage(selectedSlug);
    });
  }, [selectedSlug]);

  const sortedDraftBlocks = useMemo(
    () => [...(page?.draftBlocks || [])].sort((a, b) => a.order - b.order),
    [page]
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">CMS Tartalomkezelő</h1>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              const confirmed = window.confirm(
                "Biztosan visszaállítod az összes marketing oldalt a gyári tartalomra? Ez felülírja az aktuális CMS tartalmat."
              );
              if (!confirmed) return;
              startTransition(async () => {
                const result = await runAction(() => restoreMarketingPagesDefaults(), {
                  success: "Gyári marketing tartalom visszaállítva.",
                });
                if (!result) return;
                await runAction(() => refreshPages());
                if (selectedSlug) {
                  await runAction(() => loadPage(selectedSlug));
                } else {
                  setSelectedSlug("home");
                }
              });
            }}
          >
            Gyári tartalom visszaállítása
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              startTransition(async () => {
                const result = await runAction(() => ensureMarketingPagesSeeded(), {
                  success: "Marketing oldalak szinkronizálva.",
                });
                if (!result) return;
                await runAction(() => refreshPages());
                if (!selectedSlug) setSelectedSlug("home");
              })
            }
          >
            Oldalak szinkronizálása
          </Button>
          <Button variant="outline" size="sm" onClick={() => startTransition(refreshPages)}>
            Frissítés
          </Button>
        </div>
      </div>

      {/* New page form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Új tartalom oldal</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="cms-slug">Slug</Label>
            <Input
              id="cms-slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="pl. rolunk/csapat"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cms-title">Cím</Label>
            <Input
              id="cms-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Oldal neve"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={() =>
                startTransition(async () => {
                  const result = await runAction(
                    () => upsertContentPage({ slug: newSlug, title: newTitle }),
                    { success: "Tartalom oldal létrehozva." }
                  );
                  if (!result) return;
                  setNewSlug("");
                  setNewTitle("");
                  await runAction(() => refreshPages());
                })
              }
              disabled={!newSlug.trim() || !newTitle.trim() || isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Létrehozás
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main layout: sidebar + editor */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: page list */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Oldalak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            {pages.length === 0 && (
              <p className="text-sm text-muted-foreground">Nincs tartalom oldal.</p>
            )}
            {pages.map((item) => (
              <button
                key={item.slug}
                className={`w-full text-left border rounded-md p-3 transition ${
                  item.slug === selectedSlug
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelectedSlug(item.slug)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate text-sm">{item.title}</p>
                  <Badge
                    variant={item.status === "published" ? "default" : "outline"}
                    className="shrink-0 text-xs"
                  >
                    {item.status === "published" ? "Publikált" : "Piszkozat"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">/{item.slug}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Main editor area */}
        <div className="space-y-4">
          {!page && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Válassz egy oldalt a szerkesztéshez.
              </CardContent>
            </Card>
          )}

          {page && (
            <>
              {/* Page header bar */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Title row */}
                  <div className="flex gap-3 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <Label htmlFor="page-title">Oldal cím</Label>
                      <Input
                        id="page-title"
                        value={editablePageTitle}
                        onChange={(e) => setEditablePageTitle(e.target.value)}
                        placeholder="Oldal cím"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        startTransition(async () => {
                          const result = await runAction(
                            () => updateContentPageTitle(page.slug, editablePageTitle),
                            { success: "Oldal cím frissítve." }
                          );
                          if (!result) return;
                          await runAction(() => loadPage(page.slug));
                          await runAction(() => refreshPages());
                        })
                      }
                      disabled={!editablePageTitle.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" /> Cím mentés
                    </Button>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap border-t pt-4">
                    {/* View toggle */}
                    <div className="flex gap-1 bg-muted rounded-md p-0.5">
                      <Button
                        size="sm"
                        variant={viewMode === "editor" ? "default" : "ghost"}
                        className="h-8 gap-1.5"
                        onClick={() => setViewMode("editor")}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Szerkesztő
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === "preview" ? "default" : "ghost"}
                        className="h-8 gap-1.5"
                        onClick={() => setViewMode("preview")}
                      >
                        <Eye className="h-3.5 w-3.5" /> Előnézet
                      </Button>
                    </div>

                    {/* Publish actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startTransition(async () => {
                            const result = await runAction(
                              () => runContentPageSmokeTests(page.slug),
                              { error: "Smoke teszt hiba." }
                            );
                            if (!result) return;
                            if (result.warnings.length === 0) {
                              toast.success("Smoke tesztek sikeresek.");
                            } else {
                              toast.warning(
                                `Figyelmeztetések: ${result.warnings.join(" | ")}`
                              );
                            }
                          })
                        }
                      >
                        Teszt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          startTransition(async () => {
                            const result = await runAction(
                              () => unpublishContentPage(page.slug),
                              { success: "Oldal piszkozat módba állítva." }
                            );
                            if (!result) return;
                            await runAction(() => loadPage(page.slug));
                            await runAction(() => refreshPages());
                          })
                        }
                      >
                        Piszkozat mód
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          startTransition(async () => {
                            const result = await runAction(
                              () => publishContentPage(page.slug),
                              { success: "Oldal publikálva." }
                            );
                            if (!result) return;
                            await runAction(() => loadPage(page.slug));
                            await runAction(() => refreshPages());
                          })
                        }
                      >
                        Publikálás
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add block row */}
              {viewMode === "editor" && (
                <div className="flex gap-2 items-center flex-wrap">
                  <Select
                    value={newBlockType}
                    onValueChange={(v: ContentBlockType) => setNewBlockType(v)}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Blokk típus" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_BLOCK_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {BLOCK_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() =>
                      startTransition(async () => {
                        const result = await runAction(
                          () => addContentBlock(page.slug, newBlockType),
                          { success: "Blokk hozzáadva." }
                        );
                        if (!result) return;
                        await runAction(() => loadPage(page.slug));
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" /> Blokk hozzáadása
                  </Button>
                </div>
              )}

              {/* Editor view */}
              {viewMode === "editor" && (
                <div className="space-y-4">
                  {sortedDraftBlocks.length === 0 && (
                    <p className="text-sm text-muted-foreground border rounded-md p-4">
                      Ez az oldal még üres. Adj hozzá blokkot a szerkesztéshez.
                    </p>
                  )}
                  {sortedDraftBlocks.map((block, index) => (
                    <Card key={block.blockId} className="border-dashed">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <CardTitle className="text-base">
                            {index + 1}. {BLOCK_TYPE_LABELS[block.type]}
                          </CardTitle>
                          <div className="flex gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() =>
                                startTransition(async () => {
                                  const ids = sortedDraftBlocks.map((b) => b.blockId);
                                  if (!ids[index - 1]) return;
                                  [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                                  const result = await runAction(
                                    () => reorderContentBlocks(page.slug, ids),
                                    { success: "Blokk átmozgatva." }
                                  );
                                  if (!result) return;
                                  await runAction(() => loadPage(page.slug));
                                })
                              }
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() =>
                                startTransition(async () => {
                                  const ids = sortedDraftBlocks.map((b) => b.blockId);
                                  if (!ids[index + 1]) return;
                                  [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                                  const result = await runAction(
                                    () => reorderContentBlocks(page.slug, ids),
                                    { success: "Blokk átmozgatva." }
                                  );
                                  if (!result) return;
                                  await runAction(() => loadPage(page.slug));
                                })
                              }
                              disabled={index === sortedDraftBlocks.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={() =>
                                startTransition(async () => {
                                  const result = await runAction(
                                    () => deleteContentBlock(page.slug, block.blockId),
                                    { success: "Blokk törölve." }
                                  );
                                  if (!result) return;
                                  await runAction(() => loadPage(page.slug));
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <BlockEditorForm
                          block={block}
                          onSave={(payload) =>
                            startTransition(async () => {
                              const result = await runAction(
                                () => updateContentBlock(page.slug, block.blockId, payload),
                                { success: "Blokk mentve." }
                              );
                              if (!result) return;
                              await runAction(() => loadPage(page.slug));
                            })
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Preview view */}
              {viewMode === "preview" && (
                <Card className="border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Piszkozat előnézet</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 border-t">
                    {sortedDraftBlocks.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-6">
                        Az oldal üres, nincs megjeleníthető tartalom.
                      </p>
                    ) : (
                      <MarketingBlockRenderer blocks={sortedDraftBlocks} compact />
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block editor form                                                  */
/* ------------------------------------------------------------------ */

function BlockEditorForm({
  block,
  onSave,
}: {
  block: ContentBlock;
  onSave: (payload: any) => void;
}) {
  const [payload, setPayload] = useState<any>(block.payload || {});
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{ key: "url" | "personImage" | "accordionMedia"; index?: number } | null>(null);

  useEffect(() => {
    setPayload(block.payload || {});
  }, [block.blockId, block.payload]);

  function updateArrayItem<T>(arr: T[], idx: number, patch: Partial<T>): T[] {
    return arr.map((item, i) => (i === idx ? { ...item, ...patch } : item));
  }

  function removeArrayItem<T>(arr: T[], idx: number): T[] {
    return arr.filter((_, i) => i !== idx);
  }

  function openMediaPicker(target: { key: "url" | "personImage" | "accordionMedia"; index?: number }) {
    setMediaTarget(target);
    setIsMediaPickerOpen(true);
  }

  function applySelectedMedia(url: string) {
    if (!mediaTarget) return;
    if (mediaTarget.key === "url") {
      setPayload((prev: any) => ({ ...prev, url }));
    }
    if (mediaTarget.key === "personImage" && typeof mediaTarget.index === "number") {
      setPayload((prev: any) => ({
        ...prev,
        people: (prev.people || []).map((item: any, i: number) =>
          i === mediaTarget.index ? { ...item, imageUrl: url } : item
        ),
      }));
    }
    if (mediaTarget.key === "accordionMedia" && typeof mediaTarget.index === "number") {
      setPayload((prev: any) => ({
        ...prev,
        items: (prev.items || []).map((item: any, i: number) =>
          i === mediaTarget.index ? { ...item, mediaUrl: url } : item
        ),
      }));
    }
    setIsMediaPickerOpen(false);
    setMediaTarget(null);
  }

  return (
    <div className="space-y-3">
      {/* ---- HERO ---- */}
      {block.type === "hero" && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Badge</Label>
              <Input
                value={payload.badge || ""}
                placeholder="pl. Ingyenes Kurzus"
                onChange={(e) => setPayload({ ...payload, badge: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Kiemelés</Label>
              <Input
                value={payload.highlight || ""}
                placeholder="Kiemelt szó (opcionális)"
                onChange={(e) => setPayload({ ...payload, highlight: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Főcím</Label>
            <Input
              value={payload.title || ""}
              placeholder="Főcím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Leírás</Label>
            <Textarea
              value={payload.description || ""}
              placeholder="Leírás szöveg"
              onChange={(e) => setPayload({ ...payload, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Gombok</Label>
            {(payload.links || []).map((link: any, idx: number) => (
              <div key={`link-${idx}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <Input
                  value={link.label || ""}
                  placeholder="Gomb felirat"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      links: updateArrayItem(payload.links, idx, { label: e.target.value }),
                    })
                  }
                />
                <Input
                  value={link.href || ""}
                  placeholder="Gomb URL"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      links: updateArrayItem(payload.links, idx, { href: e.target.value }),
                    })
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  onClick={() =>
                    setPayload({ ...payload, links: removeArrayItem(payload.links || [], idx) })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPayload({
                  ...payload,
                  links: [...(payload.links || []), { label: "", href: "/" }],
                })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Új gomb
            </Button>
          </div>
        </>
      )}

      {/* ---- RICH TEXT ---- */}
      {block.type === "richText" && (
        <>
          <div className="space-y-1">
            <Label>Szekció cím (opcionális)</Label>
            <Input
              value={payload.title || ""}
              placeholder="Szekció cím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <RichTextEditor
            value={payload.html || "<p></p>"}
            onChange={(html) => setPayload({ ...payload, html })}
          />
        </>
      )}

      {/* ---- ACCORDION ---- */}
      {block.type === "accordion" && (
        <>
          <div className="space-y-1">
            <Label>Accordion cím</Label>
            <Input
              value={payload.title || ""}
              placeholder="Accordion cím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <Label>Elemek</Label>
          <div className="space-y-3">
            {(payload.items || []).map((item: any, idx: number) => (
              <div key={`acc-${idx}`} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Elem {idx + 1}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPayload({
                        ...payload,
                        items: removeArrayItem(payload.items || [], idx),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Törlés
                  </Button>
                </div>
                <Input
                  value={item.title || ""}
                  placeholder="Kérdés / cím"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      items: updateArrayItem(payload.items, idx, { title: e.target.value }),
                    })
                  }
                />
                <Textarea
                  value={item.content || ""}
                  placeholder="Válasz / tartalom"
                  rows={3}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      items: updateArrayItem(payload.items, idx, { content: e.target.value }),
                    })
                  }
                />
                <div className="grid sm:grid-cols-3 gap-2">
                  <Select
                    value={item.mediaType || "image"}
                    onValueChange={(mediaType) =>
                      setPayload({
                        ...payload,
                        items: updateArrayItem(payload.items, idx, { mediaType }),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Média típus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Kép</SelectItem>
                      <SelectItem value="video">Videó</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={item.mediaAlt || ""}
                    placeholder="Média alt (opcionális)"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        items: updateArrayItem(payload.items, idx, { mediaAlt: e.target.value }),
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openMediaPicker({ key: "accordionMedia", index: idx })}
                  >
                    Média kiválasztása
                  </Button>
                </div>
                <Input
                  value={item.mediaUrl || ""}
                  placeholder="Média URL (opcionális)"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      items: updateArrayItem(payload.items, idx, { mediaUrl: e.target.value }),
                    })
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPayload({
                  ...payload,
                  items: [...(payload.items || []), { title: "", content: "" }],
                })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Új elem
            </Button>
          </div>
        </>
      )}

      {/* ---- MEDIA ---- */}
      {block.type === "media" && (
        <>
          <div className="space-y-1">
            <Label>Média cím</Label>
            <Input
              value={payload.title || ""}
              placeholder="Médiablokk cím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <Select
            value={payload.mediaType || "image"}
            onValueChange={(mediaType) => setPayload({ ...payload, mediaType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Média típus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Kép</SelectItem>
              <SelectItem value="video">Videó</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              value={payload.url || ""}
              placeholder="Média URL"
              onChange={(e) => setPayload({ ...payload, url: e.target.value })}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={() => openMediaPicker({ key: "url" })}>
              Médiatár
            </Button>
          </div>
          <Input
            value={payload.alt || ""}
            placeholder="Alt szöveg"
            onChange={(e) => setPayload({ ...payload, alt: e.target.value })}
          />
          <Textarea
            value={payload.caption || ""}
            placeholder="Felirat (opcionális)"
            onChange={(e) => setPayload({ ...payload, caption: e.target.value })}
          />
        </>
      )}

      {/* ---- CTA ---- */}
      {block.type === "cta" && (
        <>
          <div className="space-y-1">
            <Label>Felhívás cím</Label>
            <Input
              value={payload.title || ""}
              placeholder="CTA cím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Leírás</Label>
            <Textarea
              value={payload.description || ""}
              placeholder="Rövid leírás"
              onChange={(e) => setPayload({ ...payload, description: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Gomb felirat</Label>
              <Input
                value={payload.buttonLabel || ""}
                placeholder="Gomb felirat"
                onChange={(e) => setPayload({ ...payload, buttonLabel: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Gomb URL</Label>
              <Input
                value={payload.buttonHref || ""}
                placeholder="Gomb URL"
                onChange={(e) => setPayload({ ...payload, buttonHref: e.target.value })}
              />
            </div>
          </div>
        </>
      )}

      {/* ---- FEATURE CARDS ---- */}
      {block.type === "featureCards" && (
        <>
          <div className="space-y-1">
            <Label>Szekció cím</Label>
            <Input
              value={payload.title || ""}
              placeholder="Szekció cím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Szekció leírás</Label>
            <Textarea
              value={payload.description || ""}
              placeholder="Szekció leírás (opcionális)"
              onChange={(e) => setPayload({ ...payload, description: e.target.value })}
            />
          </div>
          <Label>Kártyák</Label>
          <div className="space-y-3">
            {(payload.cards || []).map((card: any, idx: number) => (
              <div key={`card-${idx}`} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Kártya {idx + 1}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPayload({
                        ...payload,
                        cards: removeArrayItem(payload.cards || [], idx),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Törlés
                  </Button>
                </div>
                <Input
                  value={card.title || ""}
                  placeholder="Kártya cím"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      cards: updateArrayItem(payload.cards, idx, { title: e.target.value }),
                    })
                  }
                />
                <Textarea
                  value={card.description || ""}
                  placeholder="Kártya leírás"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      cards: updateArrayItem(payload.cards, idx, { description: e.target.value }),
                    })
                  }
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input
                    value={card.buttonLabel || ""}
                    placeholder="Gomb felirat (opcionális)"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        cards: updateArrayItem(payload.cards, idx, {
                          buttonLabel: e.target.value,
                        }),
                      })
                    }
                  />
                  <Input
                    value={card.buttonHref || ""}
                    placeholder="Gomb link (opcionális)"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        cards: updateArrayItem(payload.cards, idx, {
                          buttonHref: e.target.value,
                        }),
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPayload({
                  ...payload,
                  cards: [
                    ...(payload.cards || []),
                    { title: "", description: "", buttonLabel: "", buttonHref: "" },
                  ],
                })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Új kártya
            </Button>
          </div>
        </>
      )}

      {/* ---- BUTTON ROW ---- */}
      {block.type === "buttonRow" && (
        <>
          <div className="space-y-1">
            <Label>Szekció cím (opcionális)</Label>
            <Input
              value={payload.title || ""}
              placeholder="Szekció cím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <Label>Gombok</Label>
          <div className="space-y-2">
            {(payload.buttons || []).map((button: any, idx: number) => (
              <div
                key={`btn-${idx}`}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
              >
                <Input
                  value={button.label || ""}
                  placeholder="Gomb felirat"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      buttons: updateArrayItem(payload.buttons, idx, { label: e.target.value }),
                    })
                  }
                />
                <Input
                  value={button.href || ""}
                  placeholder="Gomb link"
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      buttons: updateArrayItem(payload.buttons, idx, { href: e.target.value }),
                    })
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  onClick={() =>
                    setPayload({
                      ...payload,
                      buttons: removeArrayItem(payload.buttons || [], idx),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPayload({
                  ...payload,
                  buttons: [...(payload.buttons || []), { label: "", href: "/" }],
                })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Új gomb
            </Button>
          </div>
        </>
      )}

      {/* ---- PEOPLE GRID ---- */}
      {block.type === "peopleGrid" && (
        <>
          <div className="space-y-1">
            <Label>Szekció cím</Label>
            <Input
              value={payload.title || ""}
              placeholder="Szekció cím"
              onChange={(e) => setPayload({ ...payload, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Szekció leírás</Label>
            <Textarea
              value={payload.description || ""}
              placeholder="Szekció leírás (opcionális)"
              onChange={(e) => setPayload({ ...payload, description: e.target.value })}
            />
          </div>
          <Select
            value={payload.columns || "3"}
            onValueChange={(columns) => setPayload({ ...payload, columns })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Oszlopok száma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 oszlop</SelectItem>
              <SelectItem value="3">3 oszlop</SelectItem>
            </SelectContent>
          </Select>
          <Label>Személyek</Label>
          <div className="space-y-3">
            {(payload.people || []).map((person: any, idx: number) => (
              <div key={`person-${idx}`} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Személy {idx + 1}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPayload({
                        ...payload,
                        people: removeArrayItem(payload.people || [], idx),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Törlés
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input
                    value={person.name || ""}
                    placeholder="Név"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        people: updateArrayItem(payload.people, idx, { name: e.target.value }),
                      })
                    }
                  />
                  <Input
                    value={person.role || ""}
                    placeholder="Szerepkör"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        people: updateArrayItem(payload.people, idx, { role: e.target.value }),
                      })
                    }
                  />
                </div>
                <Textarea
                  value={person.bio || ""}
                  placeholder="Rövid bemutatkozás"
                  rows={3}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      people: updateArrayItem(payload.people, idx, { bio: e.target.value }),
                    })
                  }
                />
                <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                  <Input
                    value={person.imageUrl || ""}
                    placeholder="Kép URL"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        people: updateArrayItem(payload.people, idx, { imageUrl: e.target.value }),
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openMediaPicker({ key: "personImage", index: idx })}
                  >
                    Kép kiválasztása
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input
                    value={person.buttonLabel || ""}
                    placeholder="Gomb felirat (opcionális)"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        people: updateArrayItem(payload.people, idx, {
                          buttonLabel: e.target.value,
                        }),
                      })
                    }
                  />
                  <Input
                    value={person.buttonHref || ""}
                    placeholder="Gomb link (opcionális)"
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        people: updateArrayItem(payload.people, idx, {
                          buttonHref: e.target.value,
                        }),
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPayload({
                  ...payload,
                  people: [
                    ...(payload.people || []),
                    { name: "", role: "", bio: "", imageUrl: "", buttonLabel: "", buttonHref: "" },
                  ],
                })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Új személy
            </Button>
          </div>
        </>
      )}

      <Button onClick={() => onSave(payload)} className="mt-2">
        <Save className="h-4 w-4 mr-2" /> Blokk mentése
      </Button>

      <MediaManager
        open={isMediaPickerOpen}
        onClose={() => {
          setIsMediaPickerOpen(false);
          setMediaTarget(null);
        }}
        onSelect={applySelectedMedia}
      />
    </div>
  );
}
