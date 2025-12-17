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

  if (!stats) return <div className="p-8">Loading stats...</div>

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Business Insights</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estimated Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${stats.revenue.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.activeSubscriptions}</CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Students</h2>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground p-8">No students found.</TableCell>
                            </TableRow>
                        ) : (
                            stats.students.map((s: any) => (
                                <TableRow key={s._id}>
                                    <TableCell>{s.name}</TableCell>
                                    <TableCell>{s.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={s.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                            {s.subscriptionStatus}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
