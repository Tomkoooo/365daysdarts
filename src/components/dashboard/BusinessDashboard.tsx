"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getBusinessStats } from "@/actions/business-actions"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function BusinessDashboard() {
  const [stats, setStats] = useState<{ revenue: number, activeSubscriptions: number, students: any[] } | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getBusinessStats()
        setStats(data)
      } catch (e) {
        console.error(e)
      }
    }
    loadStats()
  }, [])

  if (!stats) return <div className="p-4 md:p-8">Statisztikák betöltése...</div>

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 max-w-full">
      <h1 className="text-2xl sm:text-3xl font-bold">Üzleti Betekintés</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Becsült Havi Bevétel</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.revenue.toFixed(0)} HUF</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aktív Előfizetések</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.activeSubscriptions}</CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold">Legutóbbi Tanulók</h2>

        <div className="md:hidden space-y-3">
          {stats.students.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Nem található tanuló.
              </CardContent>
            </Card>
          ) : (
            stats.students.map((s: any) => (
              <Card key={s._id}>
                <CardContent className="p-4 space-y-2">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-muted-foreground break-all">{s.email}</div>
                  <Badge variant={s.subscriptionStatus === "active" ? "default" : "secondary"}>
                    {s.subscriptionStatus === "active" ? "Aktív" : "Inaktív"}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="hidden md:block">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Név</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Állapot</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground p-8">Nem található tanuló.</TableCell>
                            </TableRow>
                        ) : (
                            stats.students.map((s: any) => (
                                <TableRow key={s._id}>
                                    <TableCell>{s.name}</TableCell>
                                    <TableCell>{s.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={s.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                            {s.subscriptionStatus === 'active' ? 'Aktív' : 'Inaktív'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
