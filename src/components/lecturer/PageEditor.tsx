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

interface PageEditorProps {
    page: any;
    onClose: () => void;
    onSave: () => void;
}

export function PageEditor({ page, onClose, onSave }: PageEditorProps) {
    const [title, setTitle] = useState(page.title)
    const [content, setContent] = useState(page.content || "")
    const [pageType, setPageType] = useState<'text' | 'video' | 'image' | 'pdf'>(page.type || 'text')
    const [mediaUrl, setMediaUrl] = useState(page.mediaUrl || "")
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [mediaWidth, setMediaWidth] = useState("100%")
    const editorRef = useRef<RichTextEditorRef>(null);

    async function handleSave() {
        setLoading(true)
        try {
            const updateData: any = { 
                title, 
                type: pageType 
            }
            
            // Only include content for text pages
            if (pageType === 'text') {
                updateData.content = content
                updateData.mediaUrl = "" // Clear media URL for text pages
            } else {
                // For media pages, save the URL
                updateData.mediaUrl = mediaUrl
                updateData.content = "" // Clear content for media pages
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

        setUploading(true) // Start uploading UI state
        
        try {
            // 1. Upload the file first to get the URL
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            
            if (!data.success) throw new Error("Upload failed");
            
            // 2. Handle Text Page embeds (Images/Videos in text)
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
            // 3. Handle PDF Splitting
            else if (pageType === 'pdf' && file.type === 'application/pdf') {
                 setMediaUrl(data.url)
                 
                 // Dynamically import pdfjs
                 const pdfjs = await import('pdfjs-dist');
                 // Set worker - using a CDN for simplicity in this context, 
                 // ensuring version matches or is compatible. 
                 // For production, referencing a local file is better.
                 pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                 try {
                     const pdf = await pdfjs.getDocument(data.url).promise;
                     const numPages = pdf.numPages;

                     if (numPages > 1) {
                         if (confirm(`This PDF has ${numPages} pages. Do you want to create separate slides for each page? (Current page will be Page 1)`)) {
                             const { createPageBatch, updatePage } = await import("@/actions/course-actions");
                             
                             // 1. Update ONLY the mediaUrl and pdf metadata for CURRENT page (Page 1)
                             // Do NOT update title/type yet as that happens on "Save"
                             // We just set local state for those, but for PDF splitting we need immediate server effect or we just queue it?
                             // Better: We just let the user save this page as Page 1. 
                             // BUT we need to create pages 2..N NOW.
                             
                             const newPages = [];
                             for (let i = 2; i <= numPages; i++) {
                                 newPages.push({
                                     title: `${title} - Part ${i}`,
                                     type: 'pdf',
                                     mediaUrl: data.url,
                                     pdfPageIndex: i, // 1-based index or 0-based? Let's use 1-based for logic, 0 for internal? PDFJS uses 1.
                                     // Let's store 1-based index to match PDFJS
                                     pdfTotalPages: numPages,
                                     chapterId: page.chapterId 
                                 });
                             }
                             
                             await createPageBatch(page.chapterId, newPages);
                             
                             // Current page is Page 1
                             // We update local state to reflect this metadata so it gets saved on "Save"
                             // We need to add these fields to component state or handle in handleSave
                             // For now, let's treat "mediaUrl" as sufficient trigger, but we need to save pdfPageIndex 1
                             // We'll add a hidden state or just auto-update on save if we detect PDF
                             // Limitation: PageEditor implementation refactor needed to store pdfPageIndex in state.
                             // FAST FIX: We can update the current page IMMEDIATELY with the PDF metadata.
                             await updatePage(page._id, { 
                                 mediaUrl: data.url, 
                                 type: 'pdf',
                                 // @ts-ignore
                                 pdfPageIndex: 1, 
                                 // @ts-ignore
                                 pdfTotalPages: numPages 
                             });
                             
                             alert(`Created ${numPages - 1} additional pages from this PDF!`);
                             onSave(); // Close editor to refresh details
                         }
                     }
                 } catch (pdfErr) {
                     console.error("Error parsing PDF:", pdfErr);
                     // Fallback: just set URL
                 }
            }
            // 4. Handle Video/Image Page
            else {
                setMediaUrl(data.url)
            }

        } catch (err) {
            console.error(err)
            alert("Upload failed")
        } finally {
            setUploading(false)
        }
    }

    const getAcceptedFileTypes = () => {
        switch (pageType) {
            case 'video':
                return 'video/*'
            case 'image':
                return 'image/*'
            case 'pdf':
                return '.pdf'
            default:
                return 'image/*,video/*,.pdf'
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Page Content</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 flex-1 overflow-y-auto p-1">
                    <div className="space-y-2">
                        <Label htmlFor="title">Page Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="hidden">
                        <Label htmlFor="pageType">Page Type</Label>
                        <Select value={pageType} onValueChange={(val: any) => setPageType(val)}>
                            <SelectTrigger id="pageType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Text Content</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="pdf">PDF Slide</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>

                     {/* Editor Area */}
                     <div className="flex-1 flex flex-col gap-2 min-h-0">
                        {pageType === 'text' ? (
                            <div className="flex-1 flex flex-col gap-2 border rounded-md p-4 bg-background shadow-sm overflow-hidden">
                                <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b">
                                     <Label className="text-sm font-semibold">Content Editor</Label>
                                     <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 border rounded px-2 py-1 bg-muted/50">
                                            <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Image Width:</Label>
                                            <select 
                                                className="h-6 text-xs bg-transparent border-none focus:ring-0 cursor-pointer font-medium"
                                                value={mediaWidth}
                                                onChange={(e) => setMediaWidth(e.target.value)}
                                            >
                                                <option value="100%">Full Width (100%)</option>
                                                <option value="75%">Large (75%)</option>
                                                <option value="50%">Medium (50%)</option>
                                                <option value="25%">Small (25%)</option>
                                                <option value="300px">Fixed 300px</option>
                                                <option value="500px">Fixed 500px</option>
                                            </select>
                                        </div>

                                        <Label htmlFor="file-upload" className="cursor-pointer text-xs flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded transition-colors font-medium border shadow-sm">
                                             <ImageIcon className="h-3 w-3" /> Insert Image
                                        </Label>
                                        <Input 
                                            id="file-upload" 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleMediaUpload} 
                                            disabled={uploading}
                                        />
                                        {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
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
                                        {pageType} Content
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {pageType === 'video' ? 'Upload an MP4 video file. This will be the only content on this page.' : 
                                         pageType === 'pdf' ? 'Upload a PDF file. You will be prompted to split it into individual slides.' : 
                                         'Upload media content.'}
                                    </p>
                                </div>
                                <Label htmlFor="mediaUrl">
                                    {pageType === 'video' && 'Video URL'}
                                    {pageType === 'image' && 'Image URL'}
                                    {pageType === 'pdf' && 'PDF URL'}
                                </Label>
                                <Input 
                                    id="mediaUrl" 
                                    value={mediaUrl} 
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                    placeholder={`Enter ${pageType} URL or upload a file`}
                                />

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="media-upload" className="cursor-pointer flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded transition-colors">
                                        <Upload className="h-4 w-4" /> Upload {pageType.charAt(0).toUpperCase() + pageType.slice(1)}
                                    </Label>
                                    <Input 
                                        id="media-upload" 
                                        type="file" 
                                        className="hidden" 
                                        accept={getAcceptedFileTypes()} 
                                        onChange={handleMediaUpload} 
                                        disabled={uploading}
                                    />
                                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                </div>

                                {mediaUrl && (
                                    <div className="border rounded-lg p-4 bg-muted/50">
                                        <Label className="text-sm text-muted-foreground mb-2 block">Preview:</Label>
                                        {pageType === 'video' && (
                                            <video src={mediaUrl} controls className="w-full max-h-64 rounded" />
                                        )}
                                        {pageType === 'image' && (
                                            <img src={mediaUrl} alt="Preview" className="w-full max-h-64 object-contain rounded" />
                                        )}
                                        {pageType === 'pdf' && (
                                            <div className="text-sm text-muted-foreground">
                                                PDF: {mediaUrl}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
