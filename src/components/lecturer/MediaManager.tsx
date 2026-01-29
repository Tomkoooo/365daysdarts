"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, FileVideo, FileImage, FileText, Search, ExternalLink, Upload, UploadCloud } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { hu } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUpload } from "@/components/providers/UploadContext"

interface MediaFile {
    id: string;
    filename: string;
    originalName: string;
    contentType: string;
    size: number;
    uploadDate: string;
    url: string;
}

interface UploadSession {
    _id: string;
    filename: string;
    totalChunks: number;
    uploadedCount: number;
    lastUpdate: string;
    contentType: string;
}

interface MediaManagerProps {
    open: boolean;
    onClose: () => void;
    onSelect?: (url: string) => void;
}

export function MediaManager({ open, onClose, onSelect }: MediaManagerProps) {
    const { startUploads } = useUpload()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [media, setMedia] = useState<MediaFile[]>([])
    const [sessions, setSessions] = useState<UploadSession[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("library")

    useEffect(() => {
        if (open) {
            if (activeTab === 'library') fetchMedia()
            else fetchSessions()
        }
    }, [open, activeTab])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            startUploads(files)
            e.target.value = ''
        }
    }

    async function fetchMedia() {
        setLoading(true)
        try {
            const res = await fetch('/api/media')
            const data = await res.json()
            if (data.success) {
                setMedia(data.media)
            }
        } catch (err) {
            console.error("Failed to fetch media", err)
        } finally {
            setLoading(false)
        }
    }

    async function fetchSessions() {
        setLoading(true)
        try {
            const res = await fetch('/api/upload/chunk?list=true')
            const data = await res.json()
            if (data.success) {
                setSessions(data.sessions)
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Biztosan törölni szeretnéd ezt a fájlt? Ez a művelet nem vonható vissza.")) return

        setDeletingId(id)
        try {
            const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                setMedia(media.filter(m => m.id !== id))
                toast.success("Sikeres törlés", {
                    description: "A fájl véglegesen törölve lett."
                })
            } else {
                throw new Error(data.message)
            }
        } catch (err) {
            console.error("Delete failed", err)
            toast.error("Törlés sikertelen", {
                description: "Hiba történt a fájl törlése közben."
            })
        } finally {
            setDeletingId(null)
        }
    }

    async function handleDeleteSession(uploadId: string) {
        if (!confirm("Biztosan törölni szeretnéd ezt a megszakított feltöltést?")) return

        setDeletingId(uploadId)
        try {
            const res = await fetch(`/api/upload/chunk?uploadId=${uploadId}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) {
                setSessions(sessions.filter(s => s._id !== uploadId))
                toast.success("Feltöltés törölve", {
                    description: "Az ideiglenes fájltöredékek törlésre kerültek."
                })
            }
        } catch (err) {
            console.error("Delete session failed", err)
        } finally {
            setDeletingId(null)
        }
    }

    const filteredMedia = media.filter(m => 
        (m.originalName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.filename || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    function formatSize(bytes: number) {
        if (!bytes || bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold">Médiatár Kezelése</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="mb-4 w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger 
                            value="library" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold"
                        >
                            Feltöltött fájlok
                        </TabsTrigger>
                        <TabsTrigger 
                            value="sessions" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto font-semibold"
                        >
                            Folyamatban lévő feltöltések
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Keresés név alapján..." 
                                className="pl-10 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <input 
                            type="file" 
                            multiple 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect}
                        />
                        <Button 
                            className="h-10 gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="h-4 w-4" />
                            Fájlok feltöltése
                        </Button>
                    </div>

                    <TabsContent value="library" className="flex-1 overflow-y-auto mt-0 min-h-0 pr-2">
                        {loading && media.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Betöltés...</p>
                            </div>
                        ) : filteredMedia.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                                {searchQuery ? "Nincs találat a keresésre." : "Még nincsenek feltöltött fájlok."}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {filteredMedia.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                                    >
                                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                            {item.contentType.startsWith('video/') ? (
                                                <FileVideo className="h-6 w-6 text-purple-500" />
                                            ) : item.contentType.startsWith('image/') ? (
                                                <FileImage className="h-6 w-6 text-emerald-500" />
                                            ) : (
                                                <FileText className="h-6 w-6 text-slate-500" />
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm truncate" title={item.originalName}>
                                                {item.originalName}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium uppercase">{item.contentType.split('/')[1] || 'FÁJL'}</span>
                                                <span>{formatSize(item.size)}</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(item.uploadDate), { addSuffix: true, locale: hu })}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onSelect ? (
                                                <Button 
                                                    variant="default" 
                                                    size="sm" 
                                                    className="h-8 px-4 text-[11px] font-bold"
                                                    onClick={() => onSelect(item.url)}
                                                >
                                                    Kiválasztás
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    asChild
                                                >
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                            >
                                                {deletingId === item.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="sessions" className="flex-1 overflow-y-auto mt-0 min-h-0 pr-2">
                        {loading && sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Foltatások keresése...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                                Nincs félbehagyott feltöltés.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {sessions.map((session) => (
                                    <div 
                                        key={session._id} 
                                        className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:border-primary/50 transition-all group"
                                    >
                                        <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                            <Upload className="h-6 w-6 text-amber-600" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm truncate">
                                                {session.filename || "Ismeretlen fájl"}
                                            </h4>
                                            <div className="mt-1 space-y-1">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-muted-foreground">
                                                        Haladás: {session.uploadedCount} / {session.totalChunks} szelet
                                                    </span>
                                                    <span className="font-bold text-amber-600">
                                                        {Math.round((session.uploadedCount / session.totalChunks) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-amber-500 h-full transition-all duration-300" 
                                                        style={{ width: `${(session.uploadedCount / session.totalChunks) * 100}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Utolsó aktivitás: {formatDistanceToNow(new Date(session.lastUpdate), { addSuffix: true, locale: hu })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteSession(session._id)}
                                                disabled={deletingId === session._id}
                                            >
                                                {deletingId === session._id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="mt-4 text-[11px] text-muted-foreground italic px-2">
                            A félbehagyott feltöltéseket automatikusan folytathatod, ha újra kiválasztod ugyanazt a fájlt a kurzus szerkesztésekor. Itt felszabadíthatod a tárhelyet a már nem szükséges töredékek törlésével.
                        </p>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} className="h-10 px-8">Bezárás</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
