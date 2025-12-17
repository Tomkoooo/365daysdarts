"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { ExamRunner } from "@/components/exam/ExamRunner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

// Mock questions
const MOCK_QUESTIONS = [
  { id: "q1", text: "What does a red traffic light mean?", options: ["Stop", "Go", "Yield", "Speed Up"] },
  { id: "q2", text: "When can you overtake on the right?", options: ["Never", "On one-way streets", "In a tunnel", "Always"] },
  { id: "q3", text: "What is the speed limit in urban areas?", options: ["30 km/h", "50 km/h", "70 km/h", "90 km/h"] },
]

import { getPracticeQuestions } from "@/actions/exam-actions"

export default function ExamPage() {
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      // Direct call to server action
      const data = await getPracticeQuestions(); 
      if (data) {
        setQuestions(data)
        setStarted(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = (answers: any) => {
    // Calculate score locally for practice
    let correct = 0;
    questions.forEach(q => {
      const userSelected = (answers[q.id] || []).sort().toString();
      const correctSelected = (q.correctOptions || []).sort().toString();
      if (userSelected === correctSelected) correct++;
    });
    setScore(Math.round((correct / questions.length) * 100))
    setFinished(true)
  }

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle className="text-3xl">Vizsga Befejezve!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="py-8">
                <div className="text-6xl font-bold text-primary mb-2">{score}%</div>
                <p className="text-muted-foreground">{score >= 75 ? "Sikeres vizsga!" : "Sajnos ez most nem sikerült."}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild><Link href="/dashboard">Irányítópult</Link></Button>
                 <Button onClick={() => { setFinished(false); setStarted(false); setQuestions([]); }}>Újra</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/10">
        {!started ? (
           <div className="container mx-auto p-8 flex flex-col items-center">
             <Card className="max-w-2xl w-full">
               <CardHeader>
                 <CardTitle>Gyakorló Vizsga</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <p>A vizsga véletlenszerű kérdéseket tartalmaz az adatbázisból.</p>
                 <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                   <li>Időkorlát: Nincs (Gyakorló mód)</li>
                   <li>Sikerességi határ: 75%</li>
                 </ul>
                 <div className="pt-4">
                   <Button size="lg" className="w-full" onClick={fetchQuestions} disabled={loading}>
                     {loading ? "Betöltés..." : "Vizsga Indítása"}
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>
        ) : (
          <ExamRunner questions={questions} onFinish={handleFinish} isPractice={true} />
        )}
      </main>
    </div>
  )
}
