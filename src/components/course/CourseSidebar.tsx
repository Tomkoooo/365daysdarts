"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, PlayCircle, FileText, FileQuestion, GraduationCap, ClipboardList, AlertTriangle } from "lucide-react"
import { getStudentDolgozatPendingSummary } from "@/actions/dolgozat-actions"
import { getStudentOptionSelectorPendingSummary } from "@/actions/option-selector-actions"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Page {
  _id: string;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'image';
  completed?: boolean;
}

interface Chapter {
  _id: string;
  title: string;
  pages: Page[];
}

interface Module {
  _id: string;
  title: string;
  chapters: Chapter[];
}

interface CourseSidebarProps {
  courseId?: string;
  courseTitle: string;
  modules: any[];
  currentLectureId?: string;
  progress?: {
    completedModules?: string[];
    completedPages?: string[];
    finalExamUnlocked?: boolean;
  };
  onLectureSelect: (lectureId: string) => void;
  onModuleExamSelect?: (moduleId: string) => void; 
}

export function CourseSidebar({ 
    courseId,
    courseTitle, 
    modules, 
    currentLectureId, 
    progress = { completedModules: [], completedPages: [] },
    onLectureSelect, 
    onModuleExamSelect 
}: CourseSidebarProps) {
    const completedModules = progress.completedModules || [];
    const completedPages = progress.completedPages || [];
    const finalExamUnlocked = !!progress.finalExamUnlocked;
    const allModulesCompleted =
      finalExamUnlocked ||
      modules.every((m: any) => {
        const moduleId = m._id.toString();
        if (m.hasExam === false) return true;
        return completedModules.includes(moduleId);
      });
  const [pendingDolgozat, setPendingDolgozat] = useState({ pendingCount: 0, hasUrgent: false });
  const [pendingOptions, setPendingOptions] = useState({ pendingCount: 0 });

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      getStudentDolgozatPendingSummary(courseId),
      getStudentOptionSelectorPendingSummary(courseId),
    ])
      .then(([dolgozat, options]) => {
        setPendingDolgozat(dolgozat);
        setPendingOptions(options);
      })
      .catch(() => {
        setPendingDolgozat({ pendingCount: 0, hasUrgent: false });
        setPendingOptions({ pendingCount: 0 });
      });
  }, [courseId]);

  const totalPending = pendingDolgozat.pendingCount + pendingOptions.pendingCount;

  return (
    <div className="w-full h-full flex flex-col bg-background min-h-0">
       <div className="p-4 border-b font-semibold truncate" title={courseTitle}>{courseTitle}</div>
       <ScrollArea className="flex-1 min-h-0">
         <Accordion type="multiple" defaultValue={[]} className="w-full">
           {modules.map((module: any) => (
             <AccordionItem value={module._id} key={module._id}>
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 text-sm font-bold bg-muted/20">
                  <div className="flex items-center gap-2">
                    {completedModules.includes(module._id.toString()) && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {module.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-0">
                  {module.chapters && module.chapters.map((chapter: any) => (
                      <div key={chapter._id} className="border-b last:border-0 border-border/50">
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/10 uppercase tracking-wider">
                              {chapter.title}
                          </div>
                          {chapter.pages && chapter.pages.map((page: any) => {
                            const isActive = currentLectureId === page._id;
                            const isCompleted = completedPages.includes(page._id.toString());
                            return (
                             <button 
                                key={page._id} 
                                onClick={() => onLectureSelect(page._id)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/80 pl-8",
                                  isActive && "bg-muted text-primary font-medium"
                                )}
                             >
                                {isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                ) : (
                                  page.type === 'video' ? <PlayCircle className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />
                                )}
                                <span className="text-sm truncate leading-none">{page.title}</span>
                             </button>
                            )
                          })}
                      </div>
                  ))}
                  
                  {/* Module Exam Button */}
                  {onModuleExamSelect && module.hasExam !== false && (
                      <button 
                        onClick={() => onModuleExamSelect(module._id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-red-50 text-destructive hover:text-destructive font-medium border-t border-dashed",
                          currentLectureId === `exam-${module._id}` && "bg-red-100"
                        )}
                     >
                         <FileQuestion className="w-4 h-4 shrink-0" />
                         <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm truncate leading-none">Modulzáró Vizsga</span>
                            {completedModules.includes(module._id.toString()) && (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            )}
                         </div>
                      </button>
                  )}
                </AccordionContent>
             </AccordionItem>
           ))}
         </Accordion>
       </ScrollArea>

       {courseId && (
         <div className="border-t p-3">
           <Link
             href={`/courses/${courseId}/dolgozatok`}
             className={cn(
               "w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium hover:bg-muted/80 transition-colors relative",
               totalPending > 0 && "border border-amber-500/40 bg-amber-500/5"
             )}
           >
             <ClipboardList className="w-4 h-4 shrink-0 text-cta" />
             <span className="flex-1">Dolgozatok</span>
             {totalPending > 0 && (
               <span
                 className={cn(
                   "flex items-center gap-0.5 text-amber-500",
                   pendingDolgozat.hasUrgent && "text-amber-400"
                 )}
                 title={[
                   pendingDolgozat.pendingCount > 0 &&
                     `${pendingDolgozat.pendingCount} be nem adott dolgozat`,
                   pendingOptions.pendingCount > 0 &&
                     `${pendingOptions.pendingCount} új jelentkezés`,
                 ]
                   .filter(Boolean)
                   .join(", ")}
               >
                 <AlertTriangle className="h-4 w-4 shrink-0" />
                 <span className="text-xs font-semibold">{totalPending}</span>
               </span>
             )}
           </Link>
         </div>
       )}
       
       {/* Final Exam Section */}
       {onModuleExamSelect && (
           <div className="border-t p-4 bg-muted/10">
                <button 
                    onClick={() => allModulesCompleted ? onModuleExamSelect?.('final-exam') : null}
                    disabled={!allModulesCompleted}
                    className={cn(
                        "w-full flex flex-col items-center justify-center gap-1 p-3 rounded-md transition-colors font-bold shadow-sm",
                        allModulesCompleted 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer" 
                            : "bg-muted text-muted-foreground cursor-not-allowed opacity-70",
                        currentLectureId === 'exam-final-exam' && "ring-2 ring-primary ring-offset-2"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Záróvizsga
                    </div>
                    {!allModulesCompleted && (
                        <span className="text-[10px] font-normal opacity-80 italic">
                          {finalExamUnlocked
                            ? "Oktatói engedély — elindítható"
                            : "Teljesítsd az összes modulzáró vizsgát a kezdéshez!"}
                        </span>
                    )}
                </button>
           </div>
       )}
    </div>
  )
}
