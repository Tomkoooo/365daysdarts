"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, PlayCircle, FileText, FileQuestion, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

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
  courseTitle: string;
  modules: any[];
  currentLectureId?: string;
  progress?: {
    completedModules?: string[];
    completedPages?: string[];
  };
  onLectureSelect: (lectureId: string) => void;
  onModuleExamSelect?: (moduleId: string) => void; 
}

export function CourseSidebar({ 
    courseTitle, 
    modules, 
    currentLectureId, 
    progress = { completedModules: [], completedPages: [] },
    onLectureSelect, 
    onModuleExamSelect 
}: CourseSidebarProps) {
    const completedModules = progress.completedModules || [];
    const allModulesCompleted = modules.every((m: any) => completedModules.includes(m._id.toString()));
  return (
    <div className="w-full h-full flex flex-col bg-background min-h-0">
       <div className="p-4 border-b font-semibold truncate" title={courseTitle}>{courseTitle}</div>
       <ScrollArea className="flex-1 min-h-0">
         <Accordion type="multiple" defaultValue={modules.map(m => m._id)} className="w-full">
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
                            return (
                             <button 
                                key={page._id} 
                                onClick={() => onLectureSelect(page._id)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/80 pl-8",
                                  isActive && "bg-muted text-primary font-medium"
                                )}
                             >
                                {page.completed ? (
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
                  {onModuleExamSelect && (
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
                        <span className="text-[10px] font-normal opacity-80 italic">Teljesítsd az összes modult a kezdéshez!</span>
                    )}
                </button>
           </div>
       )}
    </div>
  )
}
