"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, Filter, Search, Edit2 } from "lucide-react"
import { getQuestionsForCourse, createQuestion, deleteQuestion } from "@/actions/question-actions"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CourseQuestionManagerProps {
    course: any;
    onClose: () => void;
}

export function CourseQuestionManager({ course, onClose }: CourseQuestionManagerProps) {
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterModule, setFilterModule] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadQuestions()
    }, [])

    async function loadQuestions() {
        setLoading(true)
        try {
            const data = await getQuestionsForCourse(course._id)
            setQuestions(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteQuestion(id: string) {
        if (!confirm("Biztos benne?")) return
        try {
            await deleteQuestion(id)
            loadQuestions()
        } catch (e) {
            console.error(e)
            alert("A törlés sikertelen.")
        }
    }

    // Derive filtered questions
    const filteredQuestions = questions.filter(q => {
        const matchesModule = filterModule === "all" || q.moduleId === filterModule;
        const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesModule && matchesSearch;
    });

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Teljes Kérdésbank: {course.title}</DialogTitle>
                    <DialogDescription>
                        Itt kezelheti a kurzushoz tartozó összes kérdést.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4 py-4 border-b">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Keresés a kérdések között..." 
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-[200px]">
                        <Select value={filterModule} onValueChange={setFilterModule}>
                            <SelectTrigger>
                                <SelectValue placeholder="Szűrés modulra" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Minden modul</SelectItem>
                                {course.modules?.map((m: any) => (
                                    <SelectItem key={m._id} value={m._id}>{m.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1 space-y-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">Kérdések betöltése...</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                             <div className="text-sm text-muted-foreground mb-2 flex justify-between">
                                <span>{filteredQuestions.length} találat (Összesen: {questions.length})</span>
                            </div>
                            
                            {filteredQuestions.map((q) => {
                                const relatedModule = course.modules?.find((m: any) => m._id === q.moduleId);
                                const relatedChapter = relatedModule?.chapters?.find((c: any) => c._id === q.chapterId);

                                return (
                                    <div key={q._id} className="border p-4 rounded-md flex justify-between items-start bg-card hover:bg-muted/10 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                    {relatedModule?.title || "Ismeretlen Modul"}
                                                </span>
                                                {relatedChapter && (
                                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                        {relatedChapter.title}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-medium text-sm">{q.text}</p>
                                            <div className="text-xs text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                                                {q.options.map((opt: string, idx: number) => (
                                                    <span key={idx} className={q.correctOptions?.includes(idx) ? "text-green-600 font-medium" : ""}>
                                                        {String.fromCharCode(65 + idx)}: {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 pl-4 border-l ml-4 h-full">
                                             <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q._id)} title="Törlés">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            
                            {filteredQuestions.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Nem található a feltételeknek megfelelő kérdés.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Bezárás</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
