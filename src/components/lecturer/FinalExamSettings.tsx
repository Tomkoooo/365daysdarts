"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { updateCourseSettings } from "@/actions/course-actions"
import { getQuestionCountsForCourse } from "@/actions/question-actions"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FinalExamSettingsProps {
    course: any;
    onClose: () => void;
    onSave: () => void;
}

export function FinalExamSettings({ course, onClose, onSave }: FinalExamSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [passingScore, setPassingScore] = useState(course.finalExamSettings?.passingScore || 75)
    const [questionCount, setQuestionCount] = useState(course.finalExamSettings?.questionCount || 20)
    const [maxRetries, setMaxRetries] = useState(course.finalExamSettings?.maxRetries || 3)
    
    // Available Counts
    const [countsLoading, setCountsLoading] = useState(true)
    const [availableCounts, setAvailableCounts] = useState<{ total: number, byModule: Record<string, number>, byChapter: Record<string, number> } | null>(null)
    
    // Distribution Settings
    const [mode, setMode] = useState<'legacy' | 'per_module' | 'per_chapter'>(
        course.finalExamSettings?.structure?.mode || 'legacy'
    )
    
    // Initialize counts from saved settings or default to 0
    const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({})
    const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({})

    useEffect(() => {
        // Hydrate counts from course settings
        const mCounts: Record<string, number> = {}
        course.finalExamSettings?.structure?.moduleCounts?.forEach((mc: any) => {
            mCounts[mc.moduleId] = mc.count
        })
        setModuleCounts(mCounts)

        const cCounts: Record<string, number> = {}
        course.finalExamSettings?.structure?.chapterCounts?.forEach((cc: any) => {
            cCounts[cc.chapterId] = cc.count
        })
        setChapterCounts(cCounts)
        
        loadAvailableCounts()
    }, [course])

    async function loadAvailableCounts() {
        try {
            const data = await getQuestionCountsForCourse(course._id)
            setAvailableCounts(data)
        } catch (e) {
            console.error("Failed to load question counts", e)
        } finally {
            setCountsLoading(false)
        }
    }

    async function handleSave() {
        setLoading(true)
        try {
            // Transform maps to arrays for DB
            const moduleCountsArray = Object.entries(moduleCounts).map(([moduleId, count]) => ({ moduleId, count: Number(count) }));
            const chapterCountsArray = Object.entries(chapterCounts).map(([chapterId, count]) => ({ chapterId, count: Number(count) }));

            // Calculate total questions if in granular mode
            let totalQuestions = Number(questionCount);
            if (mode === 'per_module') {
                totalQuestions = moduleCountsArray.reduce((acc, curr) => acc + curr.count, 0);
            } else if (mode === 'per_chapter') {
                totalQuestions = chapterCountsArray.reduce((acc, curr) => acc + curr.count, 0);
            }

            await updateCourseSettings(course._id, {
                finalExamSettings: {
                    passingScore: Number(passingScore),
                    questionCount: totalQuestions, // Sync total count
                    maxRetries: Number(maxRetries),
                    structure: {
                        mode,
                        moduleCounts: moduleCountsArray,
                        chapterCounts: chapterCountsArray
                    }
                }
            })
            onSave()
        } catch (e) {
            console.error("Failed to save final exam settings", e)
            alert("A beállítások mentése sikertelen.")
        } finally {
            setLoading(false)
        }
    }

    const handleModuleCountChange = (moduleId: string, val: string) => {
        setModuleCounts(prev => ({ ...prev, [moduleId]: Number(val) }))
    }

    const handleChapterCountChange = (chapterId: string, val: string) => {
        setChapterCounts(prev => ({ ...prev, [chapterId]: Number(val) }))
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="px-1">
                    <DialogTitle>Záróvizsga Beállításai</DialogTitle>
                    <DialogDescription>
                        Konfigurálja a kurzus záróvizsgájának követelményeit és kérdéseloszlását.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto min-h-0 pr-4 -mr-4 px-1">
                    <div className="grid gap-6 py-4">
                        {/* Basic Settings */}
                        <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                            <h3 className="font-medium text-sm text-foreground">Alapbeállítások</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="passingScore">Sikeres Pontszám (%)</Label>
                                    <Input
                                        id="passingScore"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={passingScore}
                                        onChange={(e) => setPassingScore(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxRetries">Kísérletek Száma</Label>
                                    <Input
                                        id="maxRetries"
                                        type="number"
                                        min="0"
                                        value={maxRetries}
                                        onChange={(e) => setMaxRetries(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Distribution Configuration */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-foreground">Kérdéseloszlás</h3>
                            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="legacy">Modulunként Egyenlő</TabsTrigger>
                                    <TabsTrigger value="per_module">Modulonkénti Beállítás</TabsTrigger>
                                    <TabsTrigger value="per_chapter">Fejezetenkénti Beállítás</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="legacy" className="p-4 border rounded-md mt-2 text-sm text-muted-foreground bg-muted/20">
                                    <div className="space-y-4">
                                        <p>
                                            A rendszer automatikusan és egyenlően válogat kérdéseket minden modulból, hogy elérje a megadott össz-kérdésszámot.
                                        </p>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="totalQuestions">Összes Kérdés Száma</Label>
                                            <Input
                                                id="totalQuestions"
                                                type="number"
                                                min="1"
                                                className="col-span-1"
                                                value={questionCount}
                                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                            />
                                            <div className="col-span-2 text-xs text-muted-foreground">
                                                {countsLoading ? <Loader2 className="h-3 w-3 animate-spin inline mr-1"/> : (
                                                    <span>(Elérhető: {availableCounts?.total || 0} db)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="per_module" className="mt-2 space-y-4">
                                    <div className="text-sm text-white p-2 bg-blue-50/50 rounded border border-blue-100 dark:border-blue-900/30">
                                        Állítsa be, hány kérdés kerüljön be az egyes modulokból. (0 = nem szerepel a vizsgában)
                                    </div>
                                    <div className="space-y-2">
                                        {course.modules?.map((m: any) => {
                                            const available = availableCounts?.byModule[m._id] || 0;
                                            return (
                                            <div key={m._id} className="flex items-center justify-between p-3 border rounded shadow-sm bg-card">
                                                <span className="font-medium text-sm flex flex-col">
                                                    {m.title}
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        Elérhető: {countsLoading ? "..." : available}
                                                    </span>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Input 
                                                        type="number" 
                                                        min="0"
                                                        max={available} 
                                                        className="w-20 text-right" 
                                                        value={moduleCounts[m._id] || 0}
                                                        onChange={(e) => handleModuleCountChange(m._id, e.target.value)}
                                                    />
                                                    <span className="text-xs text-muted-foreground w-12">db kérdés</span>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-right text-sm font-medium">
                                        Összesen: {Object.values(moduleCounts).reduce((a, b) => a + b, 0)} kérdés
                                    </div>
                                </TabsContent>

                                <TabsContent value="per_chapter" className="mt-2 space-y-4">
                                     <div className="text-sm text-white p-2 bg-blue-50/50 rounded border border-blue-100 dark:border-blue-900/30">
                                        Állítsa be, hány kérdés kerüljön be az egyes fejezetekből. Ez a funkció csak akkor működik, ha a kérdések fejezetekhez vannak rendelve.
                                    </div>
                                    <div className="space-y-4">
                                        {course.modules?.map((m: any) => (
                                            <div key={m._id} className="space-y-2">
                                                <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider ml-1">{m.title}</h4>
                                                <div className="pl-2 border-l-2 space-y-2">
                                                    {m.chapters?.map((c: any) => {
                                                        const available = availableCounts?.byChapter[c._id] || 0;
                                                        return (
                                                        <div key={c._id} className="flex items-center justify-between p-2 border rounded bg-card text-sm">
                                                            <span className="flex flex-col">
                                                                {c.title}
                                                                <span className="text-[10px] text-muted-foreground font-normal">
                                                                    Elérhető: {countsLoading ? "..." : available}
                                                                </span>
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <Input 
                                                                    type="number" 
                                                                    min="0"
                                                                    max={available} 
                                                                    className="w-20 text-right" 
                                                                    value={chapterCounts[c._id] || 0}
                                                                    onChange={(e) => handleChapterCountChange(c._id, e.target.value)}
                                                                />
                                                                <span className="text-xs text-muted-foreground w-12">db</span>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                    {(!m.chapters || m.chapters.length === 0) && (
                                                        <p className="text-xs text-muted-foreground italic pl-2">Nincsenek fejezetek</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-right text-sm font-medium">
                                        Összesen: {Object.values(chapterCounts).reduce((a, b) => a + b, 0)} kérdés
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 px-1">
                    <Button variant="outline" onClick={onClose}>Mégse</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Beállítások Mentése
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
