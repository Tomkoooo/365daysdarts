"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, AlertTriangle, Loader2, CheckCircle2, RotateCcw } from "lucide-react"
import { uploadQuestionsFromExcel } from "@/actions/bulk-upload-actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ExcelUploadModalProps {
    courseId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function ExcelUploadModal({ courseId, onClose, onSuccess }: ExcelUploadModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [mode, setMode] = useState<'add' | 'overwrite'>('add')
    const [loading, setLoading] = useState(false)

    async function handleUpload() {
        if (!file) return;

        setLoading(true)
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const result = await uploadQuestionsFromExcel(courseId, formData, { mode });
            
            if (result.success) {
                toast.success(`Sikeres feltöltés! Létrehozott kérdések: ${result.count}`);
                onSuccess();
                onClose();
            } else {
                 toast.error(result.error || "Feltöltési hiba");
            }
        } catch (e) {
            console.error(e)
            toast.error("Hiba történt a feltöltés során.");
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Kérdések Importálása Excelből</DialogTitle>
                    <DialogDescription>
                        Töltse fel a kérdéseket tartalmazó Excel fájlt.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label>Excel Fájl (.xlsx, .xls)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                            <input 
                                type="file" 
                                accept=".xlsx, .xls"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm font-medium">
                                {file ? file.name : "Kattintson ide vagy húzza ide a fájlt"}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                                Formátum: Modul #, Fejezet #, Sorszám, Kérdés, Válaszok, Helyes Betű
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <Label>Importálás Módja</Label>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div 
                                className={cn(
                                    "cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-muted/50 flex flex-col gap-2",
                                    mode === 'add' ? "border-primary bg-primary/5" : "border-muted"
                                )}
                                onClick={() => setMode('add')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <div className={cn("h-4 w-4 rounded-full border flex items-center justify-center", mode === 'add' ? "border-primary" : "border-muted-foreground")}>
                                            {mode === 'add' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                        </div>
                                        Hozzáadás
                                    </div>
                                    {mode === 'add' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground pl-6">
                                    Az új kérdések hozzáadódnak a meglévőkhöz. Biztonságos mód, nem töröl adatot.
                                </p>
                            </div>

                            <div 
                                className={cn(
                                    "cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-destructive/10 flex flex-col gap-2",
                                    mode === 'overwrite' ? "border-destructive bg-destructive/5" : "border-muted"
                                )}
                                onClick={() => setMode('overwrite')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-semibold text-destructive">
                                        <div className={cn("h-4 w-4 rounded-full border flex items-center justify-center", mode === 'overwrite' ? "border-destructive" : "border-muted-foreground")}>
                                            {mode === 'overwrite' && <div className="h-2 w-2 rounded-full bg-destructive" />}
                                        </div>
                                        Felülírás
                                    </div>
                                    {mode === 'overwrite' && <RotateCcw className="h-4 w-4 text-destructive" />}
                                </div>
                                <p className="text-xs text-muted-foreground pl-6">
                                    A fájlban szereplő modulok teljes kérdésbankja TÖRLŐDIK az importálás előtt.
                                </p>
                            </div>
                         </div>
                    </div>

                    {mode === 'overwrite' && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md flex items-start gap-3 text-orange-600 dark:text-orange-400 text-sm border border-orange-200 dark:border-orange-800">
                            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                            <p>
                                <strong>Figyelem!</strong> A művelet nem visszavonható. Csak akkor válassza ezt, ha teljesen le akarja cserélni a kérdéseket.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Mégse</Button>
                    <Button onClick={handleUpload} disabled={!file || loading} variant={mode === 'overwrite' ? "destructive" : "default"}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === 'overwrite' ? 'Felülírás Indítása' : 'Importálás Indítása'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
