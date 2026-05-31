"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Trash2, Pencil } from "lucide-react"
import { getQuestionsForModule, createQuestion, deleteQuestion } from "@/actions/question-actions"
import { Textarea } from "@/components/ui/textarea"
import { QuestionEditDialog } from "@/components/lecturer/QuestionEditDialog"
import { useScheduledDelete } from "@/hooks/use-scheduled-delete"

interface QuestionManagerProps {
    module: any;
    onClose: () => void;
}

export function QuestionManager({ module, onClose }: QuestionManagerProps) {
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
    const { hiddenIds, scheduleDelete } = useScheduledDelete()

    // Form State
    const [newQuestionText, setNewQuestionText] = useState("")
    const [options, setOptions] = useState(["", "", "", ""])
    const [correctOption, setCorrectOption] = useState(0)

    useEffect(() => {
        loadQuestions()
    }, [])

    async function loadQuestions() {
        setLoading(true)
        try {
            const data = await getQuestionsForModule(module._id)
            setQuestions(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateQuestion() {
        if (!newQuestionText || options.some(o => !o)) {
            alert("Kérjük, töltsön ki minden mezőt!")
            return
        }

        setSubmitting(true)
        try {
            await createQuestion(module._id, {
                text: newQuestionText,
                options,
                correctOptions: [correctOption]
            })
            setNewQuestionText("")
            setOptions(["", "", "", ""])
            setCorrectOption(0)
            loadQuestions()
        } catch (e) {
            console.error(e)
            alert("A kérdés létrehozása sikertelen.")
        } finally {
            setSubmitting(false)
        }
    }

    function handleDeleteQuestion(q: any) {
        const preview = q.text.length > 60 ? `${q.text.slice(0, 60)}…` : q.text
        scheduleDelete(q._id, {
            confirmMessage: `Biztosan törli a kérdést?\n\n„${preview}”\n\nA törlés 10 másodpercig visszavonható.`,
            toastTitle: "Kérdés törölve",
            onExecute: async () => {
                await deleteQuestion(q._id)
            },
            onAfterExecute: () => loadQuestions(),
        })
    }

    const visibleQuestions = questions.filter((q) => !hiddenIds.includes(q._id))

    return (
        <>
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Kérdésbank Kezelése: {module.title}</DialogTitle>
                        <DialogDescription>
                            Adjon hozzá kérdéseket a modulzáró- és a záróvizsga kérdéssorához.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-1 space-y-6">
                        <div className="bg-muted/30 p-4 rounded-lg space-y-4 border">
                            <Label>Új Kérdés</Label>
                            <Textarea 
                                placeholder="Írja be a kérdés szövegét..." 
                                value={newQuestionText} 
                                onChange={(e) => setNewQuestionText(e.target.value)} 
                            />
                            
                            <div className="space-y-2">
                                <Label>Opciók</Label>
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                         <div 
                                            className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center ${correctOption === idx ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}
                                            onClick={() => setCorrectOption(idx)}
                                         >
                                             {correctOption === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                                         </div>
                                         <Input 
                                            placeholder={`${String.fromCharCode(65 + idx)}. opció`} 
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...options]
                                                newOpts[idx] = e.target.value
                                                setOptions(newOpts)
                                            }}
                                         />
                                    </div>
                                ))}
                            </div>

                            <Button onClick={handleCreateQuestion} disabled={submitting} className="w-full">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Kérdés Hozzáadása
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground">
                                Meglévő Kérdések ({visibleQuestions.length})
                            </h4>
                            {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                                <div className="space-y-2">
                                    {visibleQuestions.map((q) => (
                                        <div key={q._id} className="border p-3 rounded-md flex justify-between items-start bg-card gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm">{q.text}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Helyes: {q.options[q.correctOptions?.[0] ?? q.correctOption]}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingQuestion(q)}
                                                    title="Szerkesztés"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteQuestion(q)}
                                                    title="Törlés"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {visibleQuestions.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic text-center">
                                            Még nincsenek kérdések ebben a kategóriában.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Bezárás</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <QuestionEditDialog
                question={editingQuestion}
                open={!!editingQuestion}
                onOpenChange={(open) => !open && setEditingQuestion(null)}
                onSaved={loadQuestions}
            />
        </>
    )
}
