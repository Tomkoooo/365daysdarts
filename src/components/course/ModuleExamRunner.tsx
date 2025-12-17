"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { startModuleExam } from "@/actions/exam-actions" // We need to check if we exported this
import {  submitFinalExam } from "@/actions/exam-actions" // We might need a separate submit for module? Reusing submitFinalExam logic might work if we tweak it or create submitModuleExam

// We need a submitModuleExam action. Let's assume we'll create it next.
import { submitModuleExam } from "@/actions/exam-actions" 

interface ModuleExamRunnerProps {
    moduleId: string;
    onComplete: (passed: boolean) => void;
    onCancel: () => void;
}

export function ModuleExamRunner({ moduleId, onComplete, onCancel }: ModuleExamRunnerProps) {
    const [loading, setLoading] = useState(true)
    const [examData, setExamData] = useState<any>(null)
    const [answers, setAnswers] = useState<Record<string, number[]>>({})
    const [currentIndex, setCurrentIndex] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        startExam()
    }, [])

    async function startExam() {
        try {
            const data = await startModuleExam(moduleId)
            setExamData(data)
        } catch (e) {
            console.error("Failed to start exam", e)
            alert("Failed to start exam. Please try again.")
            onCancel()
        } finally {
            setLoading(false)
        }
    }

    function handleOptionSelect(questionId: string, optionIndex: number) {
        setAnswers(prev => ({
            ...prev,
            [questionId]: [optionIndex] // Single choice for now
        }))
    }

    async function handleSubmit() {
        if (!examData) return
        setSubmitting(true)
        try {
            const res = await submitModuleExam(examData.examId, answers)
            setResult(res)
        } catch (e) {
            console.error("Failed to submit", e)
            alert("Failed to submit exam")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>

    if (result) {
        return (
            <Card className="max-w-xl mx-auto mt-8">
                <CardHeader>
                    <CardTitle className={result.passed ? "text-green-600" : "text-destructive"}>
                        {result.passed ? "Module Passed!" : "Exam Failed"}
                    </CardTitle>
                    <CardDescription>
                        You scored {result.score}%. Required: {result.passingScore || 75}%
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {result.passed ? <CheckCircle className="h-16 w-16 text-green-500" /> : <XCircle className="h-16 w-16 text-destructive" />}
                    <p className="text-center text-muted-foreground">
                        {result.passed 
                            ? "Congratulations! You can now proceed to the next module." 
                            : "You must pass this exam to unlock the next module. Please review the material and try again."}
                    </p>
                </CardContent>
                <CardFooter className="justify-center gap-4">
                    {result.passed ? (
                         <Button onClick={() => onComplete(true)}>Continue</Button>
                    ) : (
                         <Button onClick={() => {
                             setResult(null);
                             setAnswers({});
                             setCurrentIndex(0);
                             startExam();
                         }}>Try Again</Button>
                    )}
                </CardFooter>
            </Card>
        )
    }

    const currentQuestion = examData?.questions[currentIndex]

    return (
        <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Question {currentIndex + 1} of {examData?.questions.length}</span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">Time: --:--</span>
                 </div>
                 <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                     <div className="bg-primary h-full transition-all" style={{ width: `${((currentIndex + 1) / examData?.questions.length) * 100}%` }} />
                 </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <h3 className="text-xl font-medium">{currentQuestion?.text}</h3>
                
                <RadioGroup 
                    value={answers[currentQuestion?.id]?.[0]?.toString()} 
                    onValueChange={(val: string) => handleOptionSelect(currentQuestion.id, parseInt(val))}
                    className="space-y-3"
                >
                    {currentQuestion?.options.map((opt: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-accent cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                            <RadioGroupItem value={idx.toString()} id={`q${currentIndex}-opt${idx}`} />
                            <Label htmlFor={`q${currentIndex}-opt${idx}`} className="flex-1 cursor-pointer">{opt}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
            <CardFooter className="justify-between">
                <Button 
                    variant="outline" 
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                >
                    Previous
                </Button>

                {currentIndex < examData?.questions.length - 1 ? (
                    <Button onClick={() => setCurrentIndex(prev => prev + 1)}>
                        Next
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Exam
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
