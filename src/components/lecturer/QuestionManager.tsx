"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react"
import { getQuestionsForModule, createQuestion, deleteQuestion } from "@/actions/question-actions"
import { Textarea } from "@/components/ui/textarea"

interface QuestionManagerProps {
    module: any;
    onClose: () => void;
}

export function QuestionManager({ module, onClose }: QuestionManagerProps) {
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

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
            alert("Please fill in all fields")
            return
        }

        setSubmitting(true)
        try {
            await createQuestion(module._id, {
                text: newQuestionText,
                options,
                correctOptions: [correctOption] // Assuming single choice for now based on UI
            })
            setNewQuestionText("")
            setOptions(["", "", "", ""])
            setCorrectOption(0)
            loadQuestions()
        } catch (e) {
            console.error(e)
            alert("Failed to create question")
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDeleteQuestion(id: string) {
        if (!confirm("Are you sure?")) return
        try {
            await deleteQuestion(id)
            loadQuestions()
        } catch (e) {
            console.error(e)
            alert("Failed to delete")
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Question Pool: {module.title}</DialogTitle>
                    <DialogDescription>
                        Add questions for this module's exam and final exam pool.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-1 space-y-6">
                    {/* Add Question Form */}
                    <div className="bg-muted/30 p-4 rounded-lg space-y-4 border">
                        <Label>New Question</Label>
                        <Textarea 
                            placeholder="Enter question text..." 
                            value={newQuestionText} 
                            onChange={(e) => setNewQuestionText(e.target.value)} 
                        />
                        
                        <div className="space-y-2">
                            <Label>Options</Label>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                     <div 
                                        className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center ${correctOption === idx ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}
                                        onClick={() => setCorrectOption(idx)}
                                     >
                                         {correctOption === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                                     </div>
                                     <Input 
                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`} 
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
                            Add Question
                        </Button>
                    </div>

                    {/* Question List */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground">Existing Questions ({questions.length})</h4>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                            <div className="space-y-2">
                                {questions.map((q) => (
                                    <div key={q._id} className="border p-3 rounded-md flex justify-between items-start bg-card">
                                        <div>
                                            <p className="font-medium text-sm">{q.text}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Correct: {q.options[q.correctOptions[0]] || q.options[q.correctOption]}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q._id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {questions.length === 0 && <p className="text-sm text-muted-foreground italic text-center">No questions in this pool yet.</p>}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
