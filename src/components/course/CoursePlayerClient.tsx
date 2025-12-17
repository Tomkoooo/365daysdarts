
"use client"

import { useState, useEffect } from "react"
import { CourseSidebar } from "@/components/course/CourseSidebar"
import { VideoPlayer } from "@/components/course/VideoPlayer"
import { PDFViewer } from "@/components/course/PDFViewer"
import { Button } from "@/components/ui/button"
import { Menu, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Navbar } from "@/components/layout/Navbar"
import { ModuleExamRunner } from "@/components/course/ModuleExamRunner"

import { FinalExamRunner } from "@/components/course/FinalExamRunner"

interface CoursePlayerClientProps {
  course: any;
}

export default function CoursePlayerClient({ course }: CoursePlayerClientProps) {
  // Helpers to find initial state
  const firstModule = course.modules?.[0];
  const firstChapter = firstModule?.chapters?.[0];
  const firstPage = firstChapter?.pages?.[0];

  const [currentId, setCurrentId] = useState<string>(firstPage?._id || "");
  const [viewingMode, setViewingMode] = useState<'page' | 'exam' | 'final-exam'>('page'); // Added 'final-exam'
  const [examModuleId, setExamModuleId] = useState<string | null>(null);

  // Find current data based on currentId (if mode is page)
  let currentPage: any = null;
  let currentModule: any = null;
  let currentChapter: any = null;
  
  if (viewingMode === 'page') {
      course.modules?.forEach((m: any) => {
        m.chapters?.forEach((c: any) => {
            const p = c.pages?.find((p: any) => p._id === currentId);
            if (p) {
                currentPage = p;
                currentChapter = c;
                currentModule = m;
            }
        });
      });
  } else if (viewingMode === 'exam' && examModuleId) {
      currentModule = course.modules?.find((m: any) => m._id === examModuleId);
  }

  // Navigation Logic
  function handleSelect(id: string) {
      setCurrentId(id);
      setViewingMode('page');
      setExamModuleId(null);
  }

  function handleSelectExam(moduleId: string) {
      if (moduleId === 'final-exam') {
          setViewingMode('final-exam');
          setExamModuleId(null);
          setCurrentId('exam-final-exam');
          return;
      }
      setExamModuleId(moduleId);
      setViewingMode('exam');
      // Set currentId to special exam id for sidebar highlight
      setCurrentId(`exam-${moduleId}`);
  }

  function handleExamComplete(passed: boolean) {
      if (passed) {
          // Logic to unlock next module or just mark complete?
          // For now, simple alert or redirect
          alert("Exam Passed! Moving to next module...");
          // Find next module
          const currentModuleIndex = course.modules.findIndex((m: any) => m._id === examModuleId);
          const nextModule = course.modules[currentModuleIndex + 1];
          if (nextModule && nextModule.chapters[0]?.pages[0]) {
              handleSelect(nextModule.chapters[0].pages[0]._id);
          } else {
              alert("Course Completed! (Or proceed to Final Exam)");
          }
      }
  }

  // Anti-Copy / Privacy Measures
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    // Disable right click
    document.addEventListener("contextmenu", handleContextMenu);

    // Disable print screen key (Basic deterrance)
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "PrintScreen") {
            // Ideally we'd blur content or alert, but browsers restrict key access to PrtScn often.
            // But we can try to block common shortcuts like Cmd+Shift+4 (Mac) - browser prevents this mostly though.
        }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    }
  }, []);

  const SidebarContent = (
    <CourseSidebar 
      courseTitle={course.title} 
      modules={course.modules || []} 
      currentLectureId={currentId}
      onLectureSelect={handleSelect}
      onModuleExamSelect={handleSelectExam}
    />
  )

  return (
    <div className="flex flex-col h-screen select-none print:hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block h-full border-r">
          {SidebarContent}
        </div>

        {/* Mobile Sidebar Trigger */}
        <div className="md:hidden absolute top-20 left-4 z-10">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="outline" size="icon"><Menu className="h-4 w-4" /></Button>
             </SheetTrigger>
             <SheetContent side="left" className="p-0 w-80">
               {SidebarContent}
             </SheetContent>
           </Sheet>
        </div>
        
        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-muted/10 relative">
          <div className="flex-1 bg-background rounded-lg shadow-sm border p-6 flex flex-col">
             
             {viewingMode === 'page' && currentPage ? (
                 <>
                    <div className="mb-4">
                        <div className="text-sm text-muted-foreground">{currentModule?.title} &gt; {currentChapter?.title}</div>
                        <h2 className="text-2xl font-bold">{currentPage.title}</h2>
                    </div>

                    <div className="flex-1 min-h-[400px]">
                        {currentPage.type === 'video' && <VideoPlayer url={currentPage.mediaUrl || ""} />}
                        {currentPage.type === 'pdf' && <PDFViewer url={currentPage.mediaUrl || "/dummy.pdf"} />}
                        {currentPage.type === 'text' && (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentPage.content || "" }} />
                        )}
                        {/* Images */}
                        {currentPage.type === 'image' && (
                             <img src={currentPage.mediaUrl} alt={currentPage.title} className="max-w-full h-auto rounded-lg" />
                        )}
                    </div>
                 </>
             ) : viewingMode === 'exam' && examModuleId ? (
                 <ModuleExamRunner 
                    moduleId={examModuleId} 
                    onComplete={handleExamComplete}
                    onCancel={() => {
                        // Go back to first page of this module
                        const m = course.modules.find((m: any) => m._id === examModuleId);
                        if(m?.chapters?.[0]?.pages?.[0]) handleSelect(m.chapters[0].pages[0]._id);
                    }}
                 />
             ) : viewingMode === 'final-exam' ? (
                 <FinalExamRunner 
                     courseId={course._id}
                     onComplete={(passed) => {
                         if (passed) {
                             alert("Congratulations! You passed the course.");
                             // Maybe redirect to certificate?
                         }
                     }}
                     onCancel={() => {
                         // Go back to start
                         handleSelect(firstPage._id);
                     }}
                 />
             ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">Select a page to start learning.</div>
             )}

          </div>
          
          {/* Navigation Footer */}
          {viewingMode === 'page' && (
              <div className="mt-4 flex justify-between">
                <Button variant="outline" disabled={false}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
          )}
        </main>
      </div>
    </div>
  )
}
