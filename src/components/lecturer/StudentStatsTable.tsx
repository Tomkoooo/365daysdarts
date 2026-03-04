"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStudentStats, grantExtraRetry, getStudentExamDetails } from "@/actions/exam-actions"
import { Loader2, RefreshCw, PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export function StudentStatsTable() {
    const [stats, setStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [details, setDetails] = useState<any>(null)

    useEffect(() => {
        loadStats()

        const interval = setInterval(() => {
            loadStats(false)
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    async function loadStats(showLoader: boolean = true) {
        if (showLoader) setLoading(true)
        try {
            const data = await getStudentStats()
            setStats(data)
        } catch (e) {
            console.error("Failed to load stats", e)
        } finally {
            if (showLoader) setLoading(false)
        }
    }

    async function handleGrantRetry(studentId: string, courseId: string) {
        if (!confirm("Biztosan extra záróvizsga kísérletet szeretne adni ennek a tanulónak?")) return;
        
        try {
            await grantExtraRetry(studentId, courseId);
            alert("Sikeresen megadva az extra kísérlet.");
            loadStats(false);
        } catch (e) {
            console.error("Failed to grant retry", e);
            alert("Nem sikerült extra kísérletet adni.");
        }
    }

    async function handleOpenDetails(studentId: string, courseId: string) {
        setDetailsOpen(true)
        setDetailsLoading(true)
        setDetails(null)
        try {
            const data = await getStudentExamDetails(studentId, courseId)
            setDetails(data)
        } catch (e) {
            console.error("Failed to load details", e)
            alert("Nem sikerült betölteni a részleteket.")
            setDetailsOpen(false)
        } finally {
            setDetailsLoading(false)
        }
    }

    function formatDate(value: string | null) {
        if (!value) return "Nincs aktivitás"
        return new Date(value).toLocaleString("hu-HU")
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tanulói Teljesítmény</h3>
                <Button size="sm" variant="outline" onClick={loadStats}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Frissítés
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanuló Neve</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Kurzus</TableHead>
                            <TableHead className="text-center">Oldalak</TableHead>
                            <TableHead className="text-center">Modulok</TableHead>
                            <TableHead>Utolsó aktivitás</TableHead>
                            <TableHead className="text-center">Záróvizsga</TableHead>
                            <TableHead className="text-center">Kísérletek</TableHead>
                            <TableHead className="text-right">Műveletek</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                                    Nem található tanulói adat.
                                </TableCell>
                            </TableRow>
                        )}
                        {stats.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                <TableCell>{student.courseTitle}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary">{student.completedPagesCount} / {student.totalPages}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary">{student.completedModulesCount} / {student.totalModules}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDate(student.lastViewedAt)}</TableCell>
                                <TableCell className="text-center">
                                    {student.finalExamScore !== null ? (
                                        <Badge variant="outline" className={student.finalExamPassed ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"}>
                                            {student.finalExamScore}%
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Nincs kitöltve</span>
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
                                                onClick={() => handleGrantRetry(student.studentId, student.courseId)}
                                                title="Extra kísérlet megadása"
                                            >
                                                <PlusCircle className="h-3 w-3 mr-1" /> Újra
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs"
                                            onClick={() => handleOpenDetails(student.studentId, student.courseId)}
                                        >
                                            Részletek
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Vizsga részletek</DialogTitle>
                        <DialogDescription>
                            {details?.student?.name} - {details?.course?.title}
                        </DialogDescription>
                    </DialogHeader>
                    {detailsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : details ? (
                        <ScrollArea className="max-h-[65vh] pr-4">
                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                    Utolsó aktivitás: {formatDate(details.progress?.lastViewedAt || null)}
                                </div>
                                {details.attempts.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">Nincs rögzített vizsgakísérlet ehhez a kurzushoz.</div>
                                ) : (
                                    details.attempts.map((attempt: any) => {
                                        const correctCount = (attempt.answers || []).filter((a: any) => a.isCorrect).length
                                        return (
                                            <div key={attempt.id} className="border rounded-md p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">
                                                        {attempt.type === "final" ? "Záróvizsga" : "Modulzáró"} - {attempt.score}%
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(attempt.completedAt).toLocaleString("hu-HU")}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Helyes válaszok: {correctCount} / {attempt.totalQuestions}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="text-sm text-muted-foreground">Nincs betölthető adat.</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
