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

import { Skeleton } from "@/components/ui/skeleton"

export function ModuleExamRunner({ moduleId, onComplete, onCancel }: ModuleExamRunnerProps) {
    const [loading, setLoading] = useState(true)
    const [examData, setExamData] = useState<any>(null)
    const [answers, setAnswers] = useState<Record<string, number[]>>({})
    const [currentIndex, setCurrentIndex] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)

    useEffect(() => {
        startExam()
    }, [])

    async function startExam() {
        setLoading(true)
        setError(null)
        try {
            const data = await startModuleExam(moduleId)
            if (data.error) {
                setError(data.error)
            } else {
                setExamData(data)
            }
        } catch (e) {
            console.error("Failed to start exam", e)
            setError("Az vizsga elindítása sikertelen. Kérjük próbáld újra.")
        } finally {
            setLoading(false)
        }
    }

    // Timer Effect
    useEffect(() => {
        if (loading || !examData || result || timeLeft === null) return;

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, examData, result, timeLeft]);

    // Set initial time - more robust check
    useEffect(() => {
        if (examData) {
            const limit = examData.timeLimit || 30; // Default to 30 if not provided
            setTimeLeft(limit * 60);
        }
    }, [examData]);

    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function handleOptionSelect(questionId: string, optionIndex: number) {
        setAnswers(prev => ({
            ...prev,
            [questionId]: [optionIndex]
        }))
    }

    async function handleSubmit() {
        if (!examData?.examId || submitting) return
        setSubmitting(true)
        try {
            const res = await submitModuleExam(examData.examId, answers)
            setResult(res)
        } catch (e) {
            console.error("Failed to submit", e)
            alert("Sikertelen beküldés")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Card className="w-full min-w-[320px] sm:min-w-[500px] md:min-w-[700px] lg:min-w-[800px] max-w-4xl mx-auto mt-8">
                <CardHeader>
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-2 w-full" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <div className="space-y-3">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                </CardContent>
                <CardFooter className="justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="max-w-xl mx-auto mt-8 border-destructive/50 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" /> Hiba történt
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error}</p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={onCancel}>Vissza a kurzushoz</Button>
                </CardFooter>
            </Card>
        )
    }

    if (result) {
        return (
            <Card className="max-w-xl mx-auto mt-8">
                <CardHeader>
                    <CardTitle className={result.passed ? "text-green-600" : "text-destructive"}>
                        {result.passed ? "Modul sikeresen teljesítve!" : "Sikertelen vizsga"}
                    </CardTitle>
                    <CardDescription>
                        Pontszámod: {result.score}%. Minimum: {result.passingScore || 75}%
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {result.passed ? <CheckCircle className="h-16 w-16 text-green-500" /> : <XCircle className="h-16 w-16 text-destructive" />}
                    <p className="text-center text-muted-foreground">
                        {result.passed 
                            ? "Gratulálunk! Folytathatod a következő modullal." 
                            : "Sajnos nem sikerült elérni a minimum pontszámot. Nézd át az anyagot és próbáld újra."}
                    </p>
                </CardContent>
                <CardFooter className="justify-center gap-4">
                    {result.passed ? (
                         <Button onClick={() => onComplete(true)}>Tovább</Button>
                    ) : (
                         <Button onClick={() => {
                             setResult(null);
                             setAnswers({});
                             setCurrentIndex(0);
                             startExam();
                         }}>Újrapróbálkozás</Button>
                    )}
                </CardFooter>
            </Card>
        )
    }

    const questions = examData?.questions || []
    const currentQuestion = questions[currentIndex]

    if (!currentQuestion) {
        return (
            <div className="text-center p-12">
                <p className="text-muted-foreground">Nem találhatóak kérdések.</p>
                <Button variant="outline" onClick={onCancel} className="mt-4">Vissza</Button>
            </div>
        )
    }

    return (
        <Card className="w-full min-w-[320px] sm:min-w-[500px] md:min-w-[700px] lg:min-w-[800px] max-w-4xl mx-auto mt-8 shadow-md">
            <CardHeader>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">{currentIndex + 1}. kérdés a {questions.length}-ból</span>
                     {timeLeft !== null && (
                        <span className={`text-sm font-mono px-2 py-1 rounded ${timeLeft < 60 ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted'}`}>
                            Idő: {formatTime(timeLeft)}
                        </span>
                     )}
                 </div>
                 <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                     <div className="bg-primary h-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
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
                        <div 
                            key={idx} 
                            onClick={() => handleOptionSelect(currentQuestion.id, idx)}
                            className={`flex items-center space-x-2 border rounded-lg hover:bg-accent transition-colors group cursor-pointer ${
                                answers[currentQuestion.id]?.[0] === idx 
                                ? 'border-primary bg-accent/50 ring-1 ring-primary' 
                                : ''
                            }`}
                        >
                            <div className="flex items-center justify-center pl-4">
                                <RadioGroupItem 
                                    value={idx.toString()} 
                                    id={`q${currentIndex}-opt${idx}`} 
                                />
                            </div>
                            <Label 
                                htmlFor={`q${currentIndex}-opt${idx}`} 
                                className="flex-1 cursor-pointer p-4 text-base font-normal"
                                onClick={(e) => e.preventDefault()} // Prevent double trigger since parent div handles it
                            >
                                {opt}
                            </Label>
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
                    Előző
                </Button>

                {currentIndex < questions.length - 1 ? (
                    <Button 
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        disabled={answers[currentQuestion.id] === undefined}
                    >
                        Következő
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSubmit} 
                        disabled={submitting || answers[currentQuestion.id] === undefined}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Vizsga beküldése
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
