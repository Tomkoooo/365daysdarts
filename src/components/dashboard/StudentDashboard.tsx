"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StudentDashboard() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tananyagaim</h1>
        <Button asChild>
          <Link href="/courses">Kurzusok Böngészése</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
             <CardTitle>Tanulás Folytatása</CardTitle>
             <CardDescription>Folytasd, ahol abbahagytad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded flex items-center justify-center">
              Nincs aktív kurzus
            </div>
          </CardContent>
        </Card>
        
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
