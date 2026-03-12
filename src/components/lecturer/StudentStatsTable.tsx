"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStudentStats, grantExtraRetry, getStudentExamDetails } from "@/actions/exam-actions"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, PlusCircle, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

type SortKey =
    | "name"
    | "email"
    | "courseTitle"
    | "pagesProgressRatio"
    | "modulesProgressRatio"
    | "lastViewedAt"
    | "finalExamScore"
    | "finalExamAttempts"

type SortDirection = "asc" | "desc"

export function StudentStatsTable() {
    const [stats, setStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [details, setDetails] = useState<any>(null)
    const [searchText, setSearchText] = useState("")
    const [courseFilter, setCourseFilter] = useState("all")
    const [sortKey, setSortKey] = useState<SortKey>("lastViewedAt")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

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

    function getPagesProgressRatio(student: any) {
        return student.totalPages > 0 ? student.completedPagesCount / student.totalPages : 0
    }

    function getModulesProgressRatio(student: any) {
        return student.totalModules > 0 ? student.completedModulesCount / student.totalModules : 0
    }

    function handleSortToggle(key: SortKey) {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
            return
        }
        setSortKey(key)
        setSortDirection("asc")
    }

    function renderSortIcon(key: SortKey) {
        if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />
        if (sortDirection === "asc") return <ArrowUp className="h-3.5 w-3.5 text-primary" />
        return <ArrowDown className="h-3.5 w-3.5 text-primary" />
    }

    const availableCourses = useMemo(() => {
        return Array.from(new Set(stats.map((student) => student.courseTitle).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b, "hu")
        )
    }, [stats])

    const filteredAndSortedStats = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase()

        const filtered = stats.filter((student) => {
            const textMatch =
                normalizedSearch.length === 0 ||
                student.name?.toLowerCase().includes(normalizedSearch) ||
                student.email?.toLowerCase().includes(normalizedSearch) ||
                student.courseTitle?.toLowerCase().includes(normalizedSearch)

            const courseMatch = courseFilter === "all" || student.courseTitle === courseFilter
            return textMatch && courseMatch
        })

        const directionMultiplier = sortDirection === "asc" ? 1 : -1

        return [...filtered].sort((a, b) => {
            if (sortKey === "name" || sortKey === "email" || sortKey === "courseTitle") {
                const left = (a[sortKey] || "").toString()
                const right = (b[sortKey] || "").toString()
                const textCompare = left.localeCompare(right, "hu")
                if (textCompare !== 0) return textCompare * directionMultiplier
                return a.name.localeCompare(b.name, "hu")
            }

            let left = 0
            let right = 0

            switch (sortKey) {
                case "pagesProgressRatio":
                    left = getPagesProgressRatio(a)
                    right = getPagesProgressRatio(b)
                    break
                case "modulesProgressRatio":
                    left = getModulesProgressRatio(a)
                    right = getModulesProgressRatio(b)
                    break
                case "lastViewedAt":
                    left = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0
                    right = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0
                    break
                case "finalExamScore":
                    left = typeof a.finalExamScore === "number" ? a.finalExamScore : -1
                    right = typeof b.finalExamScore === "number" ? b.finalExamScore : -1
                    break
                case "finalExamAttempts":
                    left = a.finalExamAttempts || 0
                    right = b.finalExamAttempts || 0
                    break
                default:
                    break
            }

            if (left !== right) return (left - right) * directionMultiplier
            return a.name.localeCompare(b.name, "hu")
        })
    }, [courseFilter, searchText, sortDirection, sortKey, stats])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tanulói Teljesítmény</h3>
                <Button size="sm" variant="outline" onClick={() => { void loadStats(); }}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Frissítés
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
                    <Input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Keresés név, email vagy kurzus szerint..."
                        className="sm:max-w-sm"
                    />
                    <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="all">Minden kurzus</option>
                        {availableCourses.map((course) => (
                            <option key={course} value={course}>
                                {course}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setSortKey("pagesProgressRatio")
                            setSortDirection("desc")
                        }}
                    >
                        Leghaladóbbak
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setSortKey("pagesProgressRatio")
                            setSortDirection("asc")
                        }}
                    >
                        Legkevésbé haladó
                    </Button>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <button type="button" onClick={() => handleSortToggle("name")} className="inline-flex items-center gap-1.5">
                                    Tanuló Neve {renderSortIcon("name")}
                                </button>
                            </TableHead>
                            <TableHead>
                                <button type="button" onClick={() => handleSortToggle("email")} className="inline-flex items-center gap-1.5">
                                    Email {renderSortIcon("email")}
                                </button>
                            </TableHead>
                            <TableHead>
                                <button type="button" onClick={() => handleSortToggle("courseTitle")} className="inline-flex items-center gap-1.5">
                                    Kurzus {renderSortIcon("courseTitle")}
                                </button>
                            </TableHead>
                            <TableHead className="text-center">
                                <button type="button" onClick={() => handleSortToggle("pagesProgressRatio")} className="inline-flex items-center gap-1.5">
                                    Oldalak {renderSortIcon("pagesProgressRatio")}
                                </button>
                            </TableHead>
                            <TableHead className="text-center">
                                <button type="button" onClick={() => handleSortToggle("modulesProgressRatio")} className="inline-flex items-center gap-1.5">
                                    Modulok {renderSortIcon("modulesProgressRatio")}
                                </button>
                            </TableHead>
                            <TableHead>
                                <button type="button" onClick={() => handleSortToggle("lastViewedAt")} className="inline-flex items-center gap-1.5">
                                    Utolsó aktivitás {renderSortIcon("lastViewedAt")}
                                </button>
                            </TableHead>
                            <TableHead className="text-center">
                                <button type="button" onClick={() => handleSortToggle("finalExamScore")} className="inline-flex items-center gap-1.5">
                                    Záróvizsga {renderSortIcon("finalExamScore")}
                                </button>
                            </TableHead>
                            <TableHead className="text-center">
                                <button type="button" onClick={() => handleSortToggle("finalExamAttempts")} className="inline-flex items-center gap-1.5">
                                    Kísérletek {renderSortIcon("finalExamAttempts")}
                                </button>
                            </TableHead>
                            <TableHead className="text-right">Műveletek</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedStats.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                                    Nem található tanulói adat.
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredAndSortedStats.map((student) => (
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
