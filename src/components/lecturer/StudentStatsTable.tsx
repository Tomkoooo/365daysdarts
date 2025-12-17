"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStudentStats, grantExtraRetry } from "@/actions/exam-actions" // Added grantExtraRetry
import { Loader2, RefreshCw, PlusCircle } from "lucide-react"

export function StudentStatsTable() {
    const [stats, setStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    async function loadStats() {
        setLoading(true)
        try {
            const data = await getStudentStats()
            setStats(data)
        } catch (e) {
            console.error("Failed to load stats", e)
        } finally {
            setLoading(false)
        }
    }

    async function handleGrantRetry(studentId: string, courseId: string) {
        if (!confirm("Are you sure you want to grant an extra final exam attempt to this student?")) return;
        
        try {
            await grantExtraRetry(studentId, courseId);
            alert("Extra attempt granted successfully.");
            loadStats(); // Refresh to potentially update view (though attempts count won't decrease, logic changes)
        } catch (e) {
            console.error("Failed to grant retry", e);
            alert("Failed to grant retry");
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Student Performance</h3>
                <Button size="sm" variant="outline" onClick={loadStats}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Modules Passed</TableHead>
                            <TableHead className="text-center">Final Exam</TableHead>
                            <TableHead className="text-center">Attempts</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                    No student data found.
                                </TableCell>
                            </TableRow>
                        )}
                        {stats.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary">{student.moduleExamsPassed}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {student.finalExamScore !== null ? (
                                        <Badge variant="outline" className={student.finalExamPassed ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"}>
                                            {student.finalExamScore}%
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Not taken</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">{student.finalExamAttempts}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {!student.finalExamPassed && student.courseId && (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 text-xs border-dashed"
                                                onClick={() => handleGrantRetry(student.id, student.courseId)}
                                                title="Grant Extra Attempt"
                                            >
                                                <PlusCircle className="h-3 w-3 mr-1" /> Retry
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" className="h-8 text-xs">Details</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
