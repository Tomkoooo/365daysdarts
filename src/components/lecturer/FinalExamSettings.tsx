"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { updateCourseSettings } from "@/actions/course-actions"

interface FinalExamSettingsProps {
    course: any;
    onClose: () => void;
    onSave: () => void;
}

export function FinalExamSettings({ course, onClose, onSave }: FinalExamSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [passingScore, setPassingScore] = useState(course.finalExamSettings?.passingScore || 75)
    const [questionCount, setQuestionCount] = useState(course.finalExamSettings?.questionCount || 20)
    const [maxRetries, setMaxRetries] = useState(course.finalExamSettings?.maxRetries || 3)

    async function handleSave() {
        setLoading(true)
        try {
            await updateCourseSettings(course._id, {
                finalExamSettings: {
                    passingScore: Number(passingScore),
                    questionCount: Number(questionCount),
                    maxRetries: Number(maxRetries)
                }
            })
            onSave()
        } catch (e) {
            console.error("Failed to save final exam settings", e)
            alert("Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Final Exam Settings</DialogTitle>
                    <DialogDescription>
                        Configure the requirements for the final course exam.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="passingScore" className="text-right">
                            Passing Score (%)
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
                            Total Questions
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
                        <Label htmlFor="maxRetries" className="text-right">
                            Max Retries
                        </Label>
                        <Input
                            id="maxRetries"
                            type="number"
                            min="0"
                            value={maxRetries}
                            onChange={(e) => setMaxRetries(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
