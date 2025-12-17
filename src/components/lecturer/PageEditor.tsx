"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePage } from "@/actions/course-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RichTextEditor, RichTextEditorRef } from "@/components/ui/rich-text-editor"
import { Loader2, Upload } from "lucide-react"

interface PageEditorProps {
    page: any;
    onClose: () => void;
    onSave: () => void;
}

export function PageEditor({ page, onClose, onSave }: PageEditorProps) {
    const [title, setTitle] = useState(page.title)
    const [content, setContent] = useState(page.content || "")
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [mediaWidth, setMediaWidth] = useState("100%")
    const editorRef = useRef<RichTextEditorRef>(null);

    async function handleSave() {
        setLoading(true)
        try {
            // We treat everything as 'text' type now, containing HTML
            await updatePage(page._id, { title, content, type: 'text' })
            onSave()
        } catch (e) {
            console.error("Failed to save", e)
        } finally {
            setLoading(false)
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (data.success) {
                // Insert image/video into content with selected width
                const style = `max-width: ${mediaWidth}; width: ${mediaWidth}; height: auto; display: block; margin: 0 auto;`;
                const fileType = file.type.startsWith('image/') ? 'image' : 'video';
                
                let insertHtml = '';
                if (fileType === 'image') {
                    // Try adding width attribute directly as well, as some sanitizers respect that over style
                    insertHtml = `<p><img src="${data.url}" alt="${file.name}" style="${style}" width="${mediaWidth}" /></p>`;
                } else if (file.type.startsWith('video/')) {
                    insertHtml = `<p><video src="${data.url}" controls style="${style}" width="${mediaWidth}"></video></p>`;
                } else {
                     insertHtml = `<p><a href="${data.url}" target="_blank">Download ${file.name}</a></p>`;
                }

                if (editorRef.current) {
                    editorRef.current.insertContent(insertHtml);
                } else {
                    // Fallback if ref not ready (shouldn't happen in modal)
                    setContent((prev: string) => prev + insertHtml);
                }
            }
        } catch (err) {
            console.error(err)
            alert("Upload failed")
        } finally {
            setUploading(false)
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

                    <div className="space-y-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                             <Label>Content</Label>
                             <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-muted p-1 rounded">
                                    <span className="text-[10px] px-1 text-muted-foreground">Size:</span>
                                    <select 
                                        className="h-6 text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
                                        value={mediaWidth}
                                        onChange={(e) => setMediaWidth(e.target.value)}
                                    >
                                        <option value="100%">100%</option>
                                        <option value="75%">75%</option>
                                        <option value="50%">50%</option>
                                        <option value="25%">25%</option>
                                        <option value="300px">300px</option>
                                        <option value="500px">500px</option>
                                    </select>
                                </div>

                                <Label htmlFor="file-upload" className="cursor-pointer text-xs flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded transition-colors">
                                     <Upload className="h-3 w-3" /> Insert Media
                                </Label>
                                <Input 
                                    id="file-upload" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*,video/*,.pdf" 
                                    onChange={handleFileUpload} 
                                    disabled={uploading}
                                />
                                {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                             
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 text-xs flex items-center gap-1 bg-red-600 text-white hover:bg-red-700 hover:text-white border-none"
                                    onClick={() => {
                                        const url = prompt("Enter YouTube URL:");
                                        if (url) {
                                            const embedHtml = `<p><iframe src="${url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}" style="width: ${mediaWidth}; aspect-ratio: 16/9; margin: 0 auto; display: block;" frameborder="0" allowfullscreen></iframe></p>`;
                                            if (editorRef.current) {
                                                editorRef.current.insertContent(embedHtml);
                                            } else {
                                                setContent((prev: string) => prev + embedHtml);
                                            }
                                        }
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                    YouTube
                                </Button>
                             </div>
                        </div>
                        <RichTextEditor 
                            ref={editorRef}
                            value={content} 
                            onChange={setContent} 
                            placeholder="Write your page content here..."
                        />
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
