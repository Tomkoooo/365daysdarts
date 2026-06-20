"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { StudentStatsTable } from "@/components/lecturer/StudentStatsTable"
import { getAllCourses } from "@/actions/course-actions"
import { useEffect, useState } from "react"
import { getLecturerExamResults } from "@/actions/exam-actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaManager } from "@/components/lecturer/MediaManager"
import { BookOpen } from "lucide-react"

export default function LecturerDashboard() {
  const [results, setResults] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [resultsData, coursesData] = await Promise.all([
             getLecturerExamResults(),
             getAllCourses(false)
        ])
        setResults(resultsData)
        setCourses(coursesData)
      } catch (error) {
        console.error("Failed to fetch data", error)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 max-w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Oktatói Irányítópult</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setMediaManagerOpen(true)} className="gap-2 flex-1 sm:flex-none min-h-10">
            <BookOpen className="h-4 w-4" /> Médiatár Kezelése
          </Button>
          <Button asChild className="flex-1 sm:flex-none min-h-10">
            <Link href="/lecturer/courses/new">Kurzus Létrehozása</Link>
          </Button>
        </div>
      </div>
      
      <MediaManager 
        open={mediaManagerOpen} 
        onClose={() => setMediaManagerOpen(false)} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes Kurzus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vizsgaeredmények</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="courses" className="min-h-10">Kurzusaim</TabsTrigger>
          <TabsTrigger value="students" className="min-h-10">Tanulók Haladása</TabsTrigger>
          <TabsTrigger value="results" className="min-h-10">Vizsgaeredmények</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="space-y-4">
             <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Cím</TableHead>
                        <TableHead>Állapot</TableHead>
                        <TableHead>Műveletek</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courses.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center p-8">Nem található kurzus.</TableCell></TableRow>
                        ) : (
                            courses.map((c) => (
                            <TableRow key={c._id}>
                                <TableCell className="font-medium">{c.title}</TableCell>
                                <TableCell>
                                    {c.isPublished ? <span className="text-green-600 font-bold">Közzétéve</span> : <span className="text-gray-500">Piszkozat</span>}
                                </TableCell>
                                <TableCell>
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/lecturer/courses/${c._id}/edit`}>Szerkesztés</Link>
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                    </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="students" className="space-y-4">
             <StudentStatsTable />
        </TabsContent>
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Tanuló</TableHead>
                     <TableHead>Email</TableHead>
                     <TableHead>Pontszám</TableHead>
                     <TableHead>Dátum</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {results.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Még nincs befejezett záróvizsga.</TableCell>
                     </TableRow>
                   ) : (
                     results.map((r) => (
                       <TableRow key={r._id}>
                         <TableCell className="font-medium">{r.userId?.name || "Ismeretlen"}</TableCell>
                         <TableCell>{r.userId?.email || "-"}</TableCell>
                         <TableCell className={r.score >= 75 ? "text-green-600 font-bold" : "text-red-600"}>{r.score}%</TableCell>
                         <TableCell>{new Date(r.completedAt).toLocaleDateString('hu-HU')}</TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
