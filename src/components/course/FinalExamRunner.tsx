"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { startFinalExam, submitFinalExam } from "@/actions/exam-actions"

interface FinalExamRunnerProps {
    courseId: string;
    onComplete: (passed: boolean) => void;
    onCancel: () => void;
}

import { Skeleton } from "@/components/ui/skeleton"

export function FinalExamRunner({ courseId, onComplete, onCancel }: FinalExamRunnerProps) {
    const [loading, setLoading] = useState(true)
    const [examData, setExamData] = useState<any>(null)
    const [answers, setAnswers] = useState<Record<string, number[]>>({})
    const [currentIndex, setCurrentIndex] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        startExam()
    }, [])

    useEffect(() => {
        if (!timeLeft || timeLeft <= 0 || result) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleSubmit() // Auto submit when time is up
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, result])

    async function startExam() {
        setLoading(true)
        setError(null)
        try {
            const data = await startFinalExam(courseId)
            if (data.error) {
                setError(data.error)
            } else if (!data.questions || data.questions.length === 0) {
                setError("HIBA: A szerver nem küldött kérdéseket a vizsgához.")
            } else {
                setExamData(data)
                // Calculate time left from startTime + timeLimit
                const startTime = new Date(data.startTime).getTime()
                const limitMs = (data.timeLimit || 60) * 60 * 1000
                const now = Date.now()
                const remaining = Math.max(0, Math.ceil((startTime + limitMs - now) / 1000))
                setTimeLeft(remaining)
            }
        } catch (e) {
            console.error("Failed to start final exam", e)
            setError("Az vizsga elindítása sikertelen. Kérjük próbáld újra.")
        } finally {
            setLoading(false)
        }
    }

    function handleOptionSelect(questionId: string, optionIndex: number) {
        setAnswers(prev => ({
            ...prev,
            [questionId]: [optionIndex] 
        }))
    }

    async function handleSubmit() {
        if (!examData?.examId) return
        setSubmitting(true)
        try {
            const res = await submitFinalExam(examData.examId, answers)
            setResult(res)
        } catch (e) {
            console.error("Failed to submit", e)
            alert("Sikertelen beküldés")
        } finally {
            setSubmitting(false)
        }
    }

    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <Card className="w-full min-w-[320px] sm:min-w-[500px] md:min-w-[700px] lg:min-w-[800px] max-w-4xl mx-auto mt-8 shadow-lg">
                <CardHeader className="border-b bg-muted/20">
                    <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                    <Skeleton className="h-2 w-full mt-4" />
                </CardHeader>
                <CardContent className="space-y-8 pt-8 min-h-[400px]">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <div className="space-y-4">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                </CardContent>
                <CardFooter className="justify-between border-t bg-muted/20 p-6">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
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
                        {result.passed ? "Záróvizsga sikeres!" : "Záróvizsga sikertelen"}
                    </CardTitle>
                    <CardDescription>
                        Pontszámod: {result.score}%.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {result.passed ? <CheckCircle className="h-16 w-16 text-green-500" /> : <XCircle className="h-16 w-16 text-destructive" />}
                    <p className="text-center text-muted-foreground">
                        {result.passed 
                            ? "Gratulálunk! Sikeresen elvégezted a kurzust." 
                            : "Sajnos nem sikerült a vizsga. Nézd át a tananyagot és próbáld újra."}
                    </p>
                </CardContent>
                <CardFooter className="justify-center gap-4">
                     <Button onClick={() => onComplete(result.passed)}>
                        {result.passed ? "Kurzus befejezése" : "Vissza a kurzushoz"}
                     </Button>
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
        <Card className="w-full min-w-[320px] sm:min-w-[500px] md:min-w-[700px] lg:min-w-[800px] max-w-4xl mx-auto mt-8 shadow-lg">
            <CardHeader className="border-b bg-muted/20">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Záróvizsga</span>
                    <span className={`text-lg font-mono font-bold px-3 py-1 rounded border ${timeLeft < 300 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-background border-border'}`}>
                        {formatTime(timeLeft)}
                    </span>
                 </div>
                 <div className="flex justify-between items-end text-sm mt-2">
                     <span>{currentIndex + 1}. kérdés a {examData?.questions.length}-ból</span>
                 </div>
                 <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
                     <div className="bg-primary h-full transition-all" style={{ width: `${((currentIndex + 1) / examData?.questions.length) * 100}%` }} />
                 </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-8 min-h-[400px]">
                <h3 className="text-xl font-medium leading-relaxed">{currentQuestion?.text}</h3>
                
                <RadioGroup 
                    value={answers[currentQuestion?.id]?.[0]?.toString()} 
                    onValueChange={(val: string) => handleOptionSelect(currentQuestion.id, parseInt(val))}
                    className="space-y-3"
                >
                    {currentQuestion?.options.map((opt: string, idx: number) => (
                        <div 
                            key={idx} 
                            onClick={() => handleOptionSelect(currentQuestion.id, idx)}
                            className={`flex items-center space-x-3 border rounded-lg hover:bg-accent transition-colors group cursor-pointer ${
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
                                className="flex-1 cursor-pointer p-4 text-base font-normal leading-relaxed"
                                onClick={(e) => e.preventDefault()}
                            >
                                {opt}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
            <CardFooter className="justify-between border-t bg-muted/20 p-6">
                <Button 
                    variant="outline" 
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                >
                    Előző
                </Button>

                {currentIndex < examData?.questions.length - 1 ? (
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
                        variant="default" 
                        className="w-32"
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Beküldés
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
