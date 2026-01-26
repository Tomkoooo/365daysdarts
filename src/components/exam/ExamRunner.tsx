"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle } from "lucide-react"

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptions?: number[]; // Added for feedback
}

export function ExamRunner({ questions, onFinish, isPractice = false }: { questions: Question[], onFinish: (answers: any) => void, isPractice?: boolean }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number[]>>({}) // Changed to array of numbers
  const [showFeedback, setShowFeedback] = useState(false) // For practice mode

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  
  // Get currently selected options for this question (default empty)
  const currentSelected = answers[currentQuestion.id] || []

  const handleSelect = (optionIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after feedback shown

    const newSelected = currentSelected.includes(optionIndex)
      ? currentSelected.filter(i => i !== optionIndex) // Deselect
      : [...currentSelected, optionIndex]; // Select

    setAnswers({ ...answers, [currentQuestion.id]: newSelected })
  }

  const handleNext = () => {
    // Logic for Practice Mode: Show Feedback first
    if (isPractice && !showFeedback) {
      setShowFeedback(true);
      return;
    }

    // Move to next
    if (isLastQuestion) {
      onFinish(answers)
    } else {
      setShowFeedback(false);
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const isCorrect = (optionIndex: number) => {
    if (!showFeedback || !currentQuestion.correctOptions) return false;
    return currentQuestion.correctOptions.includes(optionIndex);
  }

  const isInCorrectSelected = (optionIndex: number) => {
     if (!showFeedback) return false;
     return currentSelected.includes(optionIndex) && !currentQuestion.correctOptions?.includes(optionIndex);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Kérdés {currentQuestionIndex + 1} / {questions.length}</span>
        <span>Haladás: {Math.round(((currentQuestionIndex) / questions.length) * 100)}%</span>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold leading-relaxed">{currentQuestion.text}</h2>
        <p className="text-sm text-muted-foreground">Válassza ki az összes helyes választ!</p>
        
        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => {
            const selected = currentSelected.includes(idx);
            let styleClass = "border-muted bg-background hover:bg-muted/50";
            
            if (selected) {
                 styleClass = "border-primary bg-primary/5 ring-1 ring-primary";
            }
            
            // Feedback Styles
            if (showFeedback) {
                 if (isCorrect(idx)) styleClass = "border-green-500 bg-green-50/50 ring-1 ring-green-500";
                 else if (isInCorrectSelected(idx)) styleClass = "border-destructive bg-destructive/10 ring-1 ring-destructive";
            }

            return (
                <div 
                key={idx} 
                onClick={() => handleSelect(idx)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${styleClass}`}
                >
                <span>{option}</span>
                {selected && !showFeedback && <CheckCircle className="w-5 h-5 text-primary" />}
                {showFeedback && isCorrect(idx) && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
            )
          })}
        </div>
        
        {showFeedback && (
            <div className={`p-4 rounded-md ${currentQuestion.correctOptions?.sort().toString() === currentSelected.sort().toString() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {currentQuestion.correctOptions?.sort().toString() === currentSelected.sort().toString() 
                    ? "Helyes! Szép munka." 
                    : "Helytelen. Kérjük, nézze át a fent kiemelt helyes válaszokat."}
            </div>
        )}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={currentSelected.length === 0} size="lg">
          {showFeedback || !isPractice 
              ? (isLastQuestion ? "Vizsga Befejezése" : "Következő Kérdés")
              : "Ellenőrzés"
          }
          {(showFeedback || !isPractice) && !isLastQuestion && <ArrowRight className="ml-2 w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
