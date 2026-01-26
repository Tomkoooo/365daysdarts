"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { updateModuleSettings } from "@/actions/course-actions"

interface ModuleSettingsProps {
    module: any;
    onClose: () => void;
    onSave: () => void;
}

export function ModuleSettings({ module, onClose, onSave }: ModuleSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [passingScore, setPassingScore] = useState(module.quizSettings?.passingScore || 75)
    const [questionCount, setQuestionCount] = useState(module.quizSettings?.questionCount || 10)
    const [timeLimit, setTimeLimit] = useState(module.quizSettings?.timeLimit || 30)

    async function handleSave() {
        setLoading(true)
        try {
            await updateModuleSettings(module._id, {
                quizSettings: {
                    passingScore: Number(passingScore),
                    questionCount: Number(questionCount),
                    timeLimit: Number(timeLimit)
                }
            })
            onSave()
        } catch (e) {
            console.error("Failed to save module settings", e)
            alert("A beállítások mentése sikertelen.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modulzáró Vizsga Beállításai</DialogTitle>
                    <DialogDescription>
                        Konfigurálja a modulzáró vizsga követelményeit.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="passingScore" className="text-right">
                            Sikeres Pontszám (%)
                        </Label>
                        <Input
                            id="passingScore"
                            type="number"
                            min="0"
                            max="100"
                            value={passingScore}
                            onChange={(e) => setPassingScore(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="questionCount" className="text-right">
                            Kérdések Száma
                        </Label>
                        <Input
                            id="questionCount"
                            type="number"
                            min="1"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="timeLimit" className="text-right">
                            Időkorlát (perc)
                        </Label>
                        <Input
                            id="timeLimit"
                            type="number"
                            min="1"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Mégse</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Beállítások Mentése
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
