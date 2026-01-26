"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { getStudentCourses } from "@/actions/course-actions"
import { Loader2, BookOpen, Trophy, Clock } from "lucide-react"

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      const data = await getStudentCourses()
      setCourses(data)
    } catch (error) {
      console.error("Failed to load courses", error)
    } finally {
      setLoading(false)
    }
  }

  const { data: session } = useSession()
  const hasAccess = session?.user?.subscriptionStatus === 'active' || session?.user?.role === 'admin'

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Card className="max-w-md w-full border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Feldolgozás alatt...</CardTitle>
            <CardDescription className="text-lg mt-4">
              Jelenleg nem elérhető várjon amíg feldolgozzuk a jelentkezését.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Clock className="h-12 w-12 text-primary animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tananyagaim</h1>
        <Button asChild>
          <Link href="/courses">Kurzusok Böngészése</Link>
        </Button>
      </div>
      
      {courses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nincs aktív kurzus</CardTitle>
            <CardDescription>Kezdj el egy új kurzust a tanulás megkezdéséhez</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/courses">Kurzusok Böngészése</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = course.progress?.percent || 0
            const lastViewed = course.progress?.lastViewedAt 
              ? new Date(course.progress.lastViewedAt).toLocaleDateString('hu-HU')
              : 'Még nem kezdted el'

            return (
              <Card key={course._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  {course.thumbnail && (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  )}
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Haladás</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Utoljára: {lastViewed}</span>
                  </div>

                  {!course.progress?.courseCompleted && (
                    <div className="flex gap-2">
                      {course.progress?.lastViewedPage ? (
                        <Button asChild className="flex-1">
                          <Link href={`/courses/${course._id}/learn`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Folytatás
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild className="flex-1">
                          <Link href={`/courses/${course._id}/learn`}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Kezdés
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}

                  {course.progress?.courseCompleted && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                      <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-700 dark:text-green-300">Teljesítve</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Gyakorló Vizsgák</CardTitle>
            <CardDescription>Készülj fel a végső tesztre</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/exams/practice">Gyakorlás Indítása</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Előfizetés</CardTitle>
            <CardDescription>Csomag kezelése</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Előfizetés Kezelése</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
