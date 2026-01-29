"use client"

import { useUpload } from "@/components/providers/UploadContext"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
    ChevronUp, 
    ChevronDown, 
    X, 
    Pause, 
    Play,
    Trash2, 
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    UploadCloud,
    RefreshCw
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function UploadProgressWidget() {
    const { uploads, pauseUpload, resumeUpload, cancelUpload, clearFinished } = useUpload()
    const [isExpanded, setIsExpanded] = useState(true)

    if (uploads.length === 0) return null

    const finishedCount = uploads.filter(u => ['complete', 'error', 'cancelled'].includes(u.status)).length
    const activeCount = uploads.length - finishedCount

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-[100] w-80 bg-card border shadow-2xl rounded-xl overflow-hidden transition-all duration-300 transform",
            !isExpanded && "h-12"
        )}>
            {/* Header */}
            <div 
                className="bg-primary text-primary-foreground p-3 flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4" />
                    <span className="text-sm font-bold">
                        {activeCount > 0 ? `${activeCount} folyamatban` : "Feltöltések"}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {finishedCount > 0 && activeCount === 0 && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-primary-foreground hover:bg-white/20"
                            onClick={(e) => {
                                e.stopPropagation()
                                clearFinished()
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-white/20">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* List */}
            {isExpanded && (
                <div className="max-h-64 overflow-y-auto p-2 bg-background/95 backdrop-blur-sm">
                    <div className="space-y-3">
                        {uploads.map((upload) => (
                            <div key={upload.id} className="space-y-1.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium truncate flex-1" title={upload.filename}>
                                        {upload.filename}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {upload.status === 'uploading' || upload.status === 'merging' ? (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground hover:text-amber-600 hover:bg-amber-100"
                                                    title="Szüneteltetés"
                                                    onClick={() => pauseUpload(upload.id)}
                                                >
                                                    <Pause className="h-3 w-3" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    title="Megállítás és Törlés"
                                                    onClick={() => cancelUpload(upload.id, true)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </>
                                        ) : upload.status === 'paused' || upload.status === 'interrupted' || upload.status === 'error' ? (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-100"
                                                    title={upload.status === 'interrupted' ? "Folytatáshoz válaszd ki a fájlt" : "Folytatás"}
                                                    onClick={() => resumeUpload(upload.id)}
                                                >
                                                    {upload.status === 'interrupted' ? <RefreshCw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    title="Törlés a szerverről"
                                                    onClick={() => cancelUpload(upload.id, true)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </>
                                        ) : upload.status === 'complete' ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => cancelUpload(upload.id, true)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {(upload.status === 'uploading' || upload.status === 'merging' || upload.status === 'idle' || upload.status === 'paused' || upload.status === 'interrupted') && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>
                                                {upload.status === 'merging' ? 'Összefűzés...' : 
                                                 upload.status === 'paused' ? 'Szüneteltetve' : 
                                                 upload.status === 'interrupted' ? 'Félbehagyott (frissíts!)' : `${upload.progress}%`}
                                            </span>
                                            {upload.status === 'merging' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                                            {upload.status === 'interrupted' && <RefreshCw className="h-2.5 w-2.5 animate-pulse text-amber-500" />}
                                        </div>
                                        <Progress 
                                            value={upload.progress} 
                                            className={cn(
                                                "h-1", 
                                                (upload.status === 'paused' || upload.status === 'interrupted') && "opacity-50"
                                            )} 
                                        />
                                    </div>
                                )}
                                
                                {upload.status === 'error' && (
                                    <p className="text-[10px] text-destructive leading-tight">
                                        Hiba: {upload.error || 'Ismeretlen hiba'}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {activeCount === 0 && uploads.length > 0 && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-3 text-xs h-8"
                            onClick={clearFinished}
                        >
                            Befejezettek törlése
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
