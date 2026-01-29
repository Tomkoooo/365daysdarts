"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePage } from "@/actions/course-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RichTextEditor, RichTextEditorRef } from "@/components/ui/rich-text-editor"
import { Loader2, Upload, Video, FileText, Image as ImageIcon, FileType, BookOpen } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { MediaManager } from "./MediaManager"
import { useUpload } from "@/components/providers/UploadContext"

interface PageEditorProps {
    page: any;
    onClose: () => void;
    onSave: () => void;
}

export function PageEditor({ page, onClose, onSave }: PageEditorProps) {
    const { startAwaitedUpload, uploads } = useUpload()
    const [title, setTitle] = useState(page.title)
    const [content, setContent] = useState(page.content || "")
    const [pageType, setPageType] = useState<'text' | 'video' | 'image' | 'pdf'>(page.type || 'text')
    const [mediaUrl, setMediaUrl] = useState(page.mediaUrl || "")
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadStatus, setUploadStatus] = useState<'uploading' | 'merging' | 'idle'>('idle')
    const [mediaManagerOpen, setMediaManagerOpen] = useState(false)
    const [mediaWidth, setMediaWidth] = useState("100%")
    const editorRef = useRef<RichTextEditorRef>(null);

    // Track active upload for local progress UI
    const [activeFile, setActiveFile] = useState<string | null>(null);
    useEffect(() => {
        if (!activeFile || !uploading) return;
        const upload = uploads.find(u => u.filename === activeFile && (u.status === 'uploading' || u.status === 'merging'));
        if (upload) {
            setProgress(upload.progress);
            setUploadStatus(upload.status === 'merging' ? 'merging' : 'uploading');
        }
    }, [uploads, activeFile, uploading]);

    async function handleSave() {
        setLoading(true)
        try {
            const updateData: any = { 
                title, 
                type: pageType 
            }
            
            if (pageType === 'text') {
                updateData.content = content
                updateData.mediaUrl = "" 
            } else {
                updateData.mediaUrl = mediaUrl
                updateData.content = "" 
            }
            
            await updatePage(page._id, updateData)
            onSave()
        } catch (e) {
            console.error("Failed to save", e)
        } finally {
            setLoading(false)
        }
    }

    async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setActiveFile(file.name)
        setUploading(true)
        setProgress(0)
        setUploadStatus('uploading')
        
        try {
            const { success, url } = await startAwaitedUpload(file);
            
            if (!success || !url) throw new Error("Upload failed");
            
            const data = { success, url };
            
            if (pageType === 'text') {
                 const fileType = file.type.startsWith('image/') ? 'image' : 'video';
                 const style = `max-width: ${mediaWidth}; width: ${mediaWidth}; height: auto; display: block; margin: 0 auto;`;
                 
                 let insertHtml = '';
                 if (fileType === 'image') {
                     insertHtml = `<p><img src="${data.url}" alt="${file.name}" style="${style}" width="${mediaWidth}" /></p>`;
                 } else if (file.type.startsWith('video/')) {
                     insertHtml = `<p><video src="${data.url}" controls style="${style}" width="${mediaWidth}"></video></p>`;
                 } else {
                     insertHtml = `<p><a href="${data.url}" target="_blank">Download ${file.name}</a></p>`;
                 }

                 if (editorRef.current) {
                     editorRef.current.insertContent(insertHtml);
                 } else {
                     setContent((prev: string) => prev + insertHtml);
                 }
            } 
            else if (pageType === 'pdf' && file.type === 'application/pdf') {
                 setMediaUrl(data.url)
                 const pdfjs = await import('pdfjs-dist');
                 pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                 try {
                     const pdf = await pdfjs.getDocument(data.url).promise;
                     const numPages = pdf.numPages;

                     if (numPages > 1) {
                         if (confirm(`Ennek a PDF-nek ${numPages} oldala van. Szeretne külön oldalakat létrehozni minden oldalhoz? (A jelenlegi oldal lesz az 1. oldal)`)) {
                             const { createPageBatch, updatePage } = await import("@/actions/course-actions");
                             
                             const newPages = [];
                             for (let i = 2; i <= numPages; i++) {
                                 newPages.push({
                                     title: `${title} - ${i}. rész`,
                                     type: 'pdf',
                                     mediaUrl: data.url,
                                     pdfPageIndex: i,
                                     pdfTotalPages: numPages,
                                     chapterId: page.chapterId 
                                 });
                             }
                             
                             await createPageBatch(page.chapterId, newPages);
                             
                             await updatePage(page._id, { 
                                 mediaUrl: data.url, 
                                 type: 'pdf',
                                 // @ts-ignore
                                 pdfPageIndex: 1, 
                                 // @ts-ignore
                                 pdfTotalPages: numPages 
                             });
                             
                             alert(`Létrehozva ${numPages - 1} további oldal a PDF-ből!`);
                             onSave(); 
                         }
                     }
                 } catch (pdfErr) {
                     console.error("Error parsing PDF:", pdfErr);
                 }
            }
            else {
                setMediaUrl(data.url)
            }

        } catch (err) {
            console.error(err)
            alert("Upload failed")
        } finally {
            setUploading(false)
            setUploadStatus('idle')
            setActiveFile(null)
        }
    }

    const getAcceptedFileTypes = () => {
        switch (pageType) {
            case 'video': return 'video/*'
            case 'image': return 'image/*'
            case 'pdf': return '.pdf'
            default: return 'image/*,video/*,.pdf'
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Oldal Tartalmának Szerkesztése</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 flex-1 overflow-y-auto p-1">
                    <div className="space-y-2">
                        <Label htmlFor="title">Oldal Címe</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="hidden">
                        <Label htmlFor="pageType">Oldal Típusa</Label>
                        <Select value={pageType} onValueChange={(val: any) => setPageType(val)}>
                            <SelectTrigger id="pageType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Szöveges Tartalom</SelectItem>
                                <SelectItem value="video">Videó</SelectItem>
                                <SelectItem value="image">Kép</SelectItem>
                                <SelectItem value="pdf">PDF Dia</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>

                     <div className="flex-1 flex flex-col gap-2 min-h-0">
                        {pageType === 'text' ? (
                            <div className="flex-1 flex flex-col gap-2 border rounded-md p-4 bg-background shadow-sm overflow-hidden">
                                <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b">
                                     <Label className="text-sm font-semibold">Tartalomszerkesztő</Label>
                                     <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 border rounded px-2 py-1 bg-muted/50">
                                            <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Kép Szélessége:</Label>
                                            <select 
                                                className="h-6 text-xs bg-transparent border-none focus:ring-0 cursor-pointer font-medium"
                                                value={mediaWidth}
                                                onChange={(e) => setMediaWidth(e.target.value)}
                                            >
                                                <option value="100%">Teljes Szélesség (100%)</option>
                                                <option value="75%">Nagy (75%)</option>
                                                <option value="50%">Közepes (50%)</option>
                                                <option value="25%">Kicsi (25%)</option>
                                                <option value="300px">Fix 300px</option>
                                                <option value="500px">Fix 500px</option>
                                            </select>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 gap-2"
                                                onClick={() => setMediaManagerOpen(true)}
                                            >
                                                <BookOpen className="h-4 w-4" />
                                                Médiatár
                                            </Button>
                                            <Label htmlFor="file-upload" className="cursor-pointer text-xs flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded transition-colors font-medium border shadow-sm">
                                                 <ImageIcon className="h-3 w-3" /> Kép Beszúrása
                                            </Label>
                                            <Input 
                                                id="file-upload" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleMediaUpload} 
                                                disabled={uploading}
                                            />
                                        </div>
                                        {uploading && (
                                            <div className="flex items-center gap-2 min-w-[100px]">
                                                <Progress value={progress} className="h-2 w-24" />
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {uploadStatus === 'merging' ? 'Összefűzés...' : `${progress}%`}
                                                </span>
                                            </div>
                                        )}
                                     </div>
                                </div>
                                <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[600px] border rounded bg-card">
                                    <RichTextEditor 
                                        value={content} 
                                        onChange={setContent} 
                                        ref={editorRef}
                                    />
                                </div>
                            </div>
                        ) : (
                             <div className="flex-1 flex flex-col gap-4 border rounded-md p-6 bg-muted/10">
                                 <div className="space-y-2">
                                    <Label className="text-lg font-semibold capitalize flex items-center gap-2">
                                        {pageType === 'video' && <Video className="h-5 w-5" />}
                                        {pageType === 'pdf' && <BookOpen className="h-5 w-5" />}
                                        {pageType === 'video' ? 'Videó' : pageType === 'image' ? 'Kép' : 'PDF'} Tartalom
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {pageType === 'video' ? 'Töltsön fel egy MP4 videófájlt. Ez lesz az oldal egyetlen tartalma.' : 
                                         pageType === 'pdf' ? 'Töltsön fel egy PDF fájlt. Lehetősége lesz oldalak szerint felosztani.' : 
                                         'Média tartalom feltöltése.'}
                                    </p>
                                </div>
                                <Label htmlFor="mediaUrl">
                                    {pageType === 'video' && 'Videó URL'}
                                    {pageType === 'image' && 'Kép URL'}
                                    {pageType === 'pdf' && 'PDF URL'}
                                </Label>
                                <Input 
                                    id="mediaUrl" 
                                    value={mediaUrl} 
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                    placeholder={`Írja be a ${pageType === 'video' ? 'videó' : pageType === 'image' ? 'kép' : 'PDF'} URL-jét vagy töltsön fel egy fájlt`}
                                />

                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-9 gap-2"
                                        onClick={() => setMediaManagerOpen(true)}
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        Médiatár
                                    </Button>
                                    <Label htmlFor="media-upload" className="cursor-pointer flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded transition-colors">
                                        <Upload className="h-4 w-4" /> {pageType === 'video' ? 'Videó' : pageType === 'image' ? 'Kép' : 'PDF'} Feltöltése
                                    </Label>
                                    <Input 
                                        id="media-upload" 
                                        type="file" 
                                        className="hidden" 
                                        accept={getAcceptedFileTypes()} 
                                        onChange={handleMediaUpload} 
                                        disabled={uploading}
                                    />
                                    {uploading && (
                                        <div className="flex items-center gap-3 flex-1">
                                            <Progress value={progress} className="h-2" />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {uploadStatus === 'merging' ? (
                                                    <span className="flex items-center gap-1">
                                                        <Loader2 className="h-3 w-3 animate-spin" /> Összefűzés... (Ez eltarthat néhány percig)
                                                    </span>
                                                ) : `${progress}%`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {mediaUrl && (
                                    <div className="border rounded-lg p-4 bg-muted/50">
                                        <Label className="text-sm text-muted-foreground mb-2 block">Előnézet:</Label>
                                        {pageType === 'video' && (
                                            <video src={mediaUrl} controls className="w-full max-h-64 rounded" />
                                        )}
                                        {pageType === 'image' && (
                                            <img src={mediaUrl} alt="Előnézet" className="w-full max-h-64 object-contain rounded" />
                                        )}
                                        {pageType === 'pdf' && (
                                            <div className="text-sm text-muted-foreground">
                                                PDF fájl: {mediaUrl}
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                        )}
                     </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Mégse</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Módosítások Mentése
                    </Button>
                </DialogFooter>
            </DialogContent>
            
            <MediaManager 
                open={mediaManagerOpen} 
                onClose={() => setMediaManagerOpen(false)}
                onSelect={(url: string) => {
                    setMediaUrl(url)
                    setMediaManagerOpen(false)
                }}
            />
        </Dialog>
    )
}
