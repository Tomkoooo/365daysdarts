
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
import { updateStudentProgress } from "@/actions/course-actions"

interface CoursePlayerClientProps {
  course: any;
  previewMode?: boolean; // New prop for lecturer preview
}

export default function CoursePlayerClient({ course, previewMode = false }: CoursePlayerClientProps) {
  // Helpers to find initial state
  const firstModule = course.modules?.[0];
  const firstChapter = firstModule?.chapters?.[0];
  const firstPage = firstChapter?.pages?.[0];

  const [currentId, setCurrentId] = useState<string>(firstPage?._id || "");
  const [viewingMode, setViewingMode] = useState<'page' | 'exam' | 'final-exam'>('page');
  const [examModuleId, setExamModuleId] = useState<string | null>(null);

  // Flatten pages for easy navigation
  const allPages: any[] = [];
  course.modules?.forEach((m: any) => {
      m.chapters?.forEach((c: any) => {
          c.pages?.forEach((p: any) => {
              allPages.push({ ...p, moduleId: m._id, moduleTitle: m.title, chapterTitle: c.title });
          });
      });
  });

  const currentIndex = allPages.findIndex(p => p._id === currentId);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  // Track progress when page changes (Disable in preview mode)
  useEffect(() => {
    if (!previewMode && viewingMode === 'page' && currentId && course._id) {
      updateStudentProgress(course._id, currentId).catch(err => {
        console.error('Failed to update progress:', err)
      })
    }
  }, [currentId, viewingMode, course._id, previewMode])

  // Find current data based on currentId
  // We can use the flatten list or finding it again. Flatten list has the extra metadata we need (Breadcrumbs)
  const currentPageData = allPages.find(p => p._id === currentId);
  
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
      setCurrentId(`exam-${moduleId}`);
  }

  function handleExamComplete(passed: boolean) {
      if (passed) {
          alert("Exam Passed! Moving to next module...");
          const currentModuleIndex = course.modules.findIndex((m: any) => m._id === examModuleId);
          const nextModule = course.modules[currentModuleIndex + 1];
          if (nextModule && nextModule.chapters[0]?.pages[0]) {
              handleSelect(nextModule.chapters[0].pages[0]._id);
          } else {
              alert("Course Completed! Proceed to Final Exam if ready.");
          }
      }
  }

  // Anti-Copy Measures
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "PrintScreen") {} // No-op
    };
    document.addEventListener("contextmenu", handleContextMenu);
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
    <div className={`flex flex-col ${previewMode ? 'h-full' : 'h-screen'} select-none print:hidden bg-background`}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block h-full border-r w-80 flex-shrink-0">
          {SidebarContent}
        </div>

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
        
        {/* Main Content Area - Fixed Layout */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* 1. Header / Breadcrumbs */}
          <div className="h-16 border-b flex items-center px-6 bg-muted/5 flex-shrink-0">
             {viewingMode === 'page' && currentPageData ? (
                 <div className="flex flex-col">
                     <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                         {currentPageData.moduleTitle} <span className="mx-1">/</span> {currentPageData.chapterTitle}
                     </div>
                     <h2 className="text-lg font-bold truncate">{currentPageData.title}</h2>
                 </div>
             ) : (
                <div className="text-lg font-bold">
                    {viewingMode === 'exam' ? 'Module Exam' : viewingMode === 'final-exam' ? 'Final Exam' : 'Course Content'}
                </div>
             )}
          </div>

          {/* 2. Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-muted/10">
             <div className="max-w-4xl mx-auto h-full flex flex-col">
                 
                 {viewingMode === 'page' && currentPageData ? (
                     <div className="flex-1 flex flex-col min-h-0"> 
                         {/* Content Renders */}
                         {currentPageData.type === 'video' && (
                             <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg">
                                 <VideoPlayer url={currentPageData.mediaUrl || ""} />
                             </div>
                         )}
                         
                         {currentPageData.type === 'pdf' && (
                             <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden shadow-sm">
                                  <PDFViewer 
                                    url={currentPageData.mediaUrl || "/dummy.pdf"} 
                                    pageIndex={currentPageData.pdfPageIndex} 
                                  />
                             </div>
                         )}
                         
                         {currentPageData.type === 'text' && (
                             <div className="prose prose-lg dark:prose-invert max-w-none bg-background p-8 rounded-lg shadow-sm border">
                                 <div dangerouslySetInnerHTML={{ __html: currentPageData.content || "" }} />
                             </div>
                         )}

                         {currentPageData.type === 'image' && (
                             <div className="flex justify-center bg-background p-4 rounded-lg border shadow-sm">
                                 <img src={currentPageData.mediaUrl} alt={currentPageData.title} className="max-w-full h-auto rounded" />
                             </div>
                         )}
                     </div>
                 ) : viewingMode === 'exam' && examModuleId ? (
                     <ModuleExamRunner 
                        moduleId={examModuleId} 
                        onComplete={handleExamComplete}
                        onCancel={() => {
                            const m = course.modules.find((m: any) => m._id === examModuleId);
                            if(m?.chapters?.[0]?.pages?.[0]) handleSelect(m.chapters[0].pages[0]._id);
                        }}
                     />
                 ) : viewingMode === 'final-exam' ? (
                     <FinalExamRunner 
                         courseId={course._id}
                         onComplete={(passed) => {
                             if (passed) alert("Congratulations! You passed the course.");
                         }}
                         onCancel={() => handleSelect(firstPage._id)}
                     />
                 ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground">Select a page to start learning.</div>
                 )}
             </div>
          </div>

          {/* 3. Footer / Navigation Buttons */}
          <div className="h-16 border-t bg-background flex items-center justify-between px-6 flex-shrink-0 z-10">
              {viewingMode === 'page' && (
                  <>
                    <Button 
                        variant="ghost" 
                        disabled={!prevPage}
                        onClick={() => prevPage && handleSelect(prevPage._id)}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>

                    <div className="hidden md:block text-sm text-muted-foreground">
                        {currentIndex + 1} / {allPages.length}
                    </div>

                    <Button 
                        disabled={!nextPage}
                        onClick={() => nextPage && handleSelect(nextPage._id)}
                        className="gap-2"
                    >
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
              )}
          </div>

        </main>
      </div>
    </div>
  )
}
