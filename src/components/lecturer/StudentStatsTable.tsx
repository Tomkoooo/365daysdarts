"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStudentStats, grantExtraRetry, getStudentExamDetails, grantModulePass, revokeModulePass, grantFinalExamAccess, revokeFinalExamAccess, exportStudentProgressExcel } from "@/actions/exam-actions"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, PlusCircle, RefreshCw, CheckCircle, XCircle, MinusCircle, ShieldCheck, FileSpreadsheet } from "lucide-react"
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
    const [exporting, setExporting] = useState(false)
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

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
        const total = student.modulesRequiringExam || student.totalModules || 0
        const completed = student.completedRequiredModules ?? student.completedModulesCount
        return total > 0 ? completed / total : 0
    }

    function getModuleStatusLabel(status: string) {
        switch (status) {
            case "passed": return "Sikeres"
            case "manual": return "Manuális pass"
            case "failed": return "Sikertelen"
            case "no_exam": return "Nincs vizsga"
            default: return "Nincs kitöltve"
        }
    }

    function getModuleStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
        switch (status) {
            case "passed": return "default"
            case "manual": return "secondary"
            case "failed": return "destructive"
            case "no_exam": return "outline"
            default: return "outline"
        }
    }

    async function reloadDetails(studentId: string, courseId: string) {
        const data = await getStudentExamDetails(studentId, courseId)
        setDetails(data)
        await loadStats(false)
    }

    async function handleGrantModulePass(moduleId: string) {
        if (!details?.student?.id || !details?.course?.id) return
        if (!confirm("Biztosan manuális pass-t adsz ehhez a modulhoz?")) return

        try {
            await grantModulePass(details.student.id, details.course.id, moduleId)
            await reloadDetails(details.student.id, details.course.id)
        } catch (e) {
            console.error("Failed to grant module pass", e)
            alert("Nem sikerült megadni a modul pass-t.")
        }
    }

    async function handleRevokeModulePass(moduleId: string) {
        if (!details?.student?.id || !details?.course?.id) return
        if (!confirm("Biztosan visszavonod a manuális pass-t ehhez a modulhoz?")) return

        try {
            await revokeModulePass(details.student.id, details.course.id, moduleId)
            await reloadDetails(details.student.id, details.course.id)
        } catch (e) {
            console.error("Failed to revoke module pass", e)
            alert("Nem sikerült visszavonni a modul pass-t.")
        }
    }

    async function handleToggleFinalExamAccess() {
        if (!details?.student?.id || !details?.course?.id) return
        const isUnlocked = !!details.progress?.finalExamUnlocked
        const message = isUnlocked
            ? "Biztosan visszavonod a záróvizsga hozzáférést?"
            : "Biztosan engedélyezed a záróvizsgát anélkül, hogy minden modul teljesítve lenne?"

        if (!confirm(message)) return

        try {
            if (isUnlocked) {
                await revokeFinalExamAccess(details.student.id, details.course.id)
            } else {
                await grantFinalExamAccess(details.student.id, details.course.id)
            }
            await reloadDetails(details.student.id, details.course.id)
        } catch (e) {
            console.error("Failed to toggle final exam access", e)
            alert("Nem sikerült módosítani a záróvizsga hozzáférést.")
        }
    }

    async function downloadExportResult(result: { success?: boolean; base64?: string; filename?: string; error?: string }) {
        if (!result.success || !result.base64) {
            alert(result.error || "Export hiba")
            return
        }
        const blob = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }))
        const a = document.createElement("a")
        a.href = url
        a.download = result.filename || "tanuloi_haladas_export.xlsx"
        a.click()
        URL.revokeObjectURL(url)
    }

    async function handleExportExcel(studentIds?: string[]) {
        setExporting(true)
        try {
            const result = await exportStudentProgressExcel({
                courseId: courseFilter === "all" ? undefined : courseFilter,
                studentIds,
            })
            await downloadExportResult(result)
        } catch (e) {
            console.error("Failed to export", e)
            alert("Nem sikerült exportálni az adatokat.")
        } finally {
            setExporting(false)
        }
    }

    function toggleStudentSelection(studentId: string) {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        )
    }

    function toggleAllVisibleStudents(visibleStudentIds: string[]) {
        setSelectedStudentIds((prev) => {
            const allSelected = visibleStudentIds.every((id) => prev.includes(id))
            if (allSelected) {
                return prev.filter((id) => !visibleStudentIds.includes(id))
            }
            return Array.from(new Set([...prev, ...visibleStudentIds]))
        })
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

    const availableCourseOptions = useMemo(() => {
        const map = new Map<string, string>()
        for (const student of stats) {
            if (student.courseId && student.courseTitle) {
                map.set(student.courseId, student.courseTitle)
            }
        }
        return Array.from(map.entries())
            .map(([id, title]) => ({ id, title }))
            .sort((a, b) => a.title.localeCompare(b.title, "hu"))
    }, [stats])

    const filteredAndSortedStats = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase()

        const filtered = stats.filter((student) => {
            const textMatch =
                normalizedSearch.length === 0 ||
                student.name?.toLowerCase().includes(normalizedSearch) ||
                student.email?.toLowerCase().includes(normalizedSearch) ||
                student.courseTitle?.toLowerCase().includes(normalizedSearch)

            const courseMatch = courseFilter === "all" || student.courseId === courseFilter
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

    const visibleStudentIds = useMemo(() => {
        return Array.from(new Set(filteredAndSortedStats.map((student) => student.studentId).filter(Boolean)))
    }, [filteredAndSortedStats])

    const allVisibleSelected = visibleStudentIds.length > 0 &&
        visibleStudentIds.every((id) => selectedStudentIds.includes(id))

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-3 flex-wrap">
                <h3 className="text-lg font-medium">Tanulói Teljesítmény</h3>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant="outline"
                        className="min-h-10 flex-1 sm:flex-none"
                        onClick={() => { void handleExportExcel() }}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                        )}
                        <span className="hidden sm:inline">Excel export (mind)</span>
                        <span className="sm:hidden">Export (mind)</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="default"
                        className="min-h-10 flex-1 sm:flex-none"
                        onClick={() => { void handleExportExcel(selectedStudentIds) }}
                        disabled={exporting || selectedStudentIds.length === 0}
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                        )}
                        Kijelöltek ({selectedStudentIds.length})
                    </Button>
                    <Button size="sm" variant="outline" className="min-h-10" onClick={() => { void loadStats(); }}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Frissítés
                    </Button>
                </div>
            </div>

            {selectedStudentIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    {selectedStudentIds.length} tanuló kijelölve. A kijelöltek exportja az összes kurzusuk adatait és aktivitás naplóját egy fájlba gyűjti.
                </div>
            )}

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
                        {availableCourseOptions.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-10 flex-1 sm:flex-none"
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
                        className="min-h-10 flex-1 sm:flex-none"
                        onClick={() => {
                            setSortKey("pagesProgressRatio")
                            setSortDirection("asc")
                        }}
                    >
                        Legkevésbé haladó
                    </Button>
                </div>
            </div>

            <div className="md:hidden space-y-3">
                {filteredAndSortedStats.length === 0 ? (
                    <div className="border rounded-md p-6 text-center text-muted-foreground">
                        Nem található tanulói adat.
                    </div>
                ) : (
                    filteredAndSortedStats.map((student) => (
                        <div key={student.id} className="border rounded-lg p-4 space-y-3 bg-background">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border mt-1 shrink-0"
                                    checked={selectedStudentIds.includes(student.studentId)}
                                    onChange={() => toggleStudentSelection(student.studentId)}
                                    aria-label={`${student.name} kijelölése`}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{student.name}</div>
                                    <div className="text-sm text-muted-foreground break-all">{student.email}</div>
                                    <div className="text-sm mt-1">{student.courseTitle}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Oldalak: </span>
                                    {student.completedPagesCount} / {student.totalPages}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Modulok: </span>
                                    {student.completedRequiredModules ?? student.completedModulesCount} / {student.modulesRequiringExam ?? student.totalModules}
                                </div>
                                <div className="col-span-2 text-xs text-muted-foreground">
                                    Utolsó aktivitás: {formatDate(student.lastViewedAt)}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Záróvizsga: </span>
                                    {student.finalExamScore !== null ? `${student.finalExamScore}%` : "Nincs"}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Kísérletek: </span>
                                    {student.finalExamAttempts}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {!student.finalExamPassed && student.courseId && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="min-h-10 text-xs border-dashed flex-1 sm:flex-none"
                                        onClick={() => handleGrantRetry(student.studentId, student.courseId)}
                                    >
                                        <PlusCircle className="h-3 w-3 mr-1" /> Újra
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="min-h-10 text-xs flex-1 sm:flex-none"
                                    onClick={() => handleOpenDetails(student.studentId, student.courseId)}
                                >
                                    Részletek
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="hidden md:block border rounded-md overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border"
                                    checked={allVisibleSelected}
                                    onChange={() => toggleAllVisibleStudents(visibleStudentIds)}
                                    aria-label="Összes látható tanuló kijelölése"
                                />
                            </TableHead>
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
                                <TableCell colSpan={10} className="text-center text-muted-foreground h-24">
                                    Nem található tanulói adat.
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredAndSortedStats.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border"
                                        checked={selectedStudentIds.includes(student.studentId)}
                                        onChange={() => toggleStudentSelection(student.studentId)}
                                        aria-label={`${student.name} kijelölése`}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                <TableCell>{student.courseTitle}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary">{student.completedPagesCount} / {student.totalPages}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary" title={`${student.completedRequiredModules ?? student.completedModulesCount} vizsgás modul teljesítve / ${student.modulesRequiringExam ?? student.totalModules} vizsgás modul`}>
                                        {student.completedRequiredModules ?? student.completedModulesCount} / {student.modulesRequiringExam ?? student.totalModules}
                                    </Badge>
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
                <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tanuló haladás részletei</DialogTitle>
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
                            <div className="space-y-6">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                                    <div className="text-muted-foreground">
                                        Utolsó aktivitás: {formatDate(details.progress?.lastViewedAt || null)}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Modulzárók: {details.progress?.modulesPassedCount ?? 0} / {details.progress?.modulesRequiringExamCount ?? 0}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Profil:</span>
                                        <Badge variant={details.student?.isActive ? "default" : "outline"}>
                                            {details.student?.isActive ? "Aktív" : "Inaktív"}
                                        </Badge>
                                    </div>
                                    <div className="text-muted-foreground">
                                        Záróvizsga: {details.progress?.finalExamScore !== null && details.progress?.finalExamScore !== undefined
                                            ? `${details.progress.finalExamScore}% (${details.progress.finalExamPassed ? "sikeres" : "sikertelen"})`
                                            : "Nincs kitöltve"}
                                    </div>
                                    <div className="text-muted-foreground">
                                        Beadandók: {details.dolgozatSummary?.submitted ?? 0} / {details.dolgozatSummary?.total ?? 0}
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                                        <div className="text-muted-foreground">
                                            Opcióválasztások: {details.optionSelectorSummary?.responded ?? 0} / {details.optionSelectorSummary?.total ?? 0}
                                        </div>
                                        {(details.optionSelectorSummary?.selections || []).length > 0 ? (
                                            <div className="flex flex-col gap-1.5">
                                                {(details.optionSelectorSummary.selections as any[]).map((selection: any) => (
                                                    <div key={selection.title} className="text-sm">
                                                        <span className="font-medium">{selection.title}:</span>{" "}
                                                        <span>{selection.choices.join(", ")}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">Nincs rögzített választás.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={details.progress?.canStartFinalExam ? "default" : "secondary"}>
                                        {details.progress?.canStartFinalExam ? "Záróvizsga elérhető" : "Záróvizsga nem elérhető"}
                                    </Badge>
                                    {details.progress?.finalExamUnlocked && (
                                        <Badge variant="outline" className="gap-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            Oktatói engedély
                                        </Badge>
                                    )}
                                    <Button
                                        size="sm"
                                        variant={details.progress?.finalExamUnlocked ? "outline" : "default"}
                                        onClick={handleToggleFinalExamAccess}
                                    >
                                        {details.progress?.finalExamUnlocked ? "Záróvizsga engedély visszavonása" : "Záróvizsga engedélyezése"}
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">Modulok</h4>
                                    <div className="border rounded-md divide-y">
                                        {(details.modules || []).map((module: any) => (
                                            <div key={module.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{module.title}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                        <span>{getModuleStatusLabel(module.status)}</span>
                                                        {module.bestScore !== null && (
                                                            <span>Legjobb eredmény: {module.bestScore}%</span>
                                                        )}
                                                        {module.attemptCount > 0 && (
                                                            <span>Kísérletek: {module.attemptCount}</span>
                                                        )}
                                                        {module.lastAttemptAt && (
                                                            <span>{new Date(module.lastAttemptAt).toLocaleString("hu-HU")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant={getModuleStatusVariant(module.status)}>
                                                        {module.isPassed ? (
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                        ) : module.status === "failed" ? (
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <MinusCircle className="h-3 w-3 mr-1" />
                                                        )}
                                                        {getModuleStatusLabel(module.status)}
                                                    </Badge>
                                                    {module.hasExam && !module.isPassed && (
                                                        <Button size="sm" variant="outline" onClick={() => handleGrantModulePass(module.id)}>
                                                            Pass megadása
                                                        </Button>
                                                    )}
                                                    {module.isManuallyPassed && (
                                                        <Button size="sm" variant="ghost" onClick={() => handleRevokeModulePass(module.id)}>
                                                            Pass visszavonása
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">Beadandók</h4>
                                    {(details.dolgozatok || []).length === 0 ? (
                                        <div className="text-sm text-muted-foreground">Nincs közzétett beadandó ehhez a kurzushoz.</div>
                                    ) : (
                                        <div className="border rounded-md divide-y">
                                            {(details.dolgozatok || []).map((dolgozat: any) => (
                                                <div key={dolgozat.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{dolgozat.title}</div>
                                                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                            <span>{dolgozat.statusLabel}</span>
                                                            {dolgozat.submittedAt && (
                                                                <span>{new Date(dolgozat.submittedAt).toLocaleString("hu-HU")}</span>
                                                            )}
                                                            {dolgozat.points !== null && dolgozat.maxPoints && (
                                                                <span>Pont: {dolgozat.points} / {dolgozat.maxPoints}</span>
                                                            )}
                                                            {dolgozat.uploadedOnBehalf && (
                                                                <span>Oktató/admin feltöltötte</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant={dolgozat.isSubmitted ? "default" : "outline"}>
                                                        {dolgozat.isSubmitted ? "Beadva" : dolgozat.statusLabel}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">Opcióválasztások</h4>
                                    {(details.optionSelectors || []).length === 0 ? (
                                        <div className="text-sm text-muted-foreground">Nincs közzétett opcióválasztó ehhez a kurzushoz.</div>
                                    ) : (
                                        <div className="border rounded-md divide-y">
                                            {(details.optionSelectors || []).map((selector: any) => (
                                                <div key={selector.id} className="p-4 flex flex-col gap-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium">{selector.title}</div>
                                                            {selector.respondedAt && (
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    {new Date(selector.respondedAt).toLocaleString("hu-HU")}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!selector.hasResponded && (
                                                            <Badge variant="outline">Nincs válasz</Badge>
                                                        )}
                                                    </div>
                                                    {selector.hasResponded ? (
                                                        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                Választott opció{selector.allowMultiple ? "k" : ""}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(selector.selectedOptions || []).map((option: string) => (
                                                                    <Badge key={`${selector.id}-${option}`} variant="default">
                                                                        {option}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">Még nem választott.</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-medium">Vizsgakísérletek</h4>
                                    {details.attempts.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">Nincs rögzített vizsgakísérlet ehhez a kurzushoz.</div>
                                    ) : (
                                        details.attempts.map((attempt: any) => {
                                            const correctCount = (attempt.answers || []).filter((a: any) => a.isCorrect).length
                                            const moduleTitle = attempt.type === "module"
                                                ? details.modules?.find((m: any) => m.id === attempt.moduleId)?.title
                                                : null
                                            return (
                                                <div key={attempt.id} className="border rounded-md p-4 space-y-2">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="font-medium">
                                                            {attempt.type === "final"
                                                                ? "Záróvizsga"
                                                                : `Modulzáró${moduleTitle ? `: ${moduleTitle}` : ""}`} - {attempt.score}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground shrink-0">
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
