
"use client"

import { useState, useEffect } from "react"
import { CourseSidebar } from "@/components/course/CourseSidebar"
import { VideoPlayer } from "@/components/course/VideoPlayer"
import { PDFViewer } from "@/components/course/PDFViewer"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Navbar } from "@/components/layout/Navbar"
import { ModuleExamRunner } from "@/components/course/ModuleExamRunner"
import { FinalExamRunner } from "@/components/course/FinalExamRunner"
import { startModuleExam, submitFinalExam, submitModuleExam } from "@/actions/exam-actions"
import { updateStudentProgress, getStudentProgress } from "@/actions/course-actions"
import { Skeleton } from "@/components/ui/skeleton"

interface CoursePlayerClientProps {
  course: any;
  progress?: any;
  previewMode?: boolean; // New prop for lecturer preview
  initialPageId?: string;
}

export default function CoursePlayerClient({ 
  course, 
  progress = {},
  previewMode = false,
  initialPageId 
}: CoursePlayerClientProps) {
  const router = useRouter();
  // Helpers to find initial state
  const firstModule = course.modules?.[0];
  const firstChapter = firstModule?.chapters?.[0];
  const firstPage = firstChapter?.pages?.[0];

  const [currentId, setCurrentId] = useState<string>(initialPageId || firstPage?._id || "");
  const [viewingMode, setViewingMode] = useState<'page' | 'exam' | 'final-exam'>('page');
  const [examModuleId, setExamModuleId] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState(progress);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

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
      updateStudentProgress(course._id, currentId).catch((err: any) => {
        console.error('Failed to update progress:', err)
      })
    }
  }, [currentId, viewingMode, course._id, previewMode])

  // Find current data based on currentId
  // We can use the flatten list or finding it again. Flatten list has the extra metadata we need (Breadcrumbs)
  const currentPageData = allPages.find(p => p._id === currentId);
  
  // Navigation Logic
  function handleSelect(id: string) {
      if (id === currentId && viewingMode === 'page') return;
      setLoading(true);
      setCurrentId(id);
      setViewingMode('page');
      setExamModuleId(null);
      setImgLoading(true);
      setTimeout(() => setLoading(false), 300);
  }

  function handleSelectExam(moduleId: string) {
      setLoading(true);
      if (moduleId === 'final-exam') {
          setViewingMode('final-exam');
          setExamModuleId(null);
          setCurrentId('exam-final-exam');
      } else {
          setExamModuleId(moduleId);
          setViewingMode('exam');
          setCurrentId(`exam-${moduleId}`);
      }
      setTimeout(() => setLoading(false), 300);
  }

  async function handleExamComplete(passed: boolean) {
      if (passed) {
          // Refresh progress data
          const newProgress = await getStudentProgress(course._id);
          if (newProgress) setUserProgress(newProgress);

          alert("Sikeres vizsga! Következő modul feloldva.");
          const currentModuleIndex = course.modules.findIndex((m: any) => m._id === examModuleId);
          const nextModule = course.modules[currentModuleIndex + 1];
          if (nextModule && nextModule.chapters[0]?.pages[0]) {
              handleSelect(nextModule.chapters[0].pages[0]._id);
          } else {
              alert("Gratulálunk! Minden modult teljesítettél. Most már elindíthatod a záróvizsgát.");
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
      progress={userProgress}
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
                    {viewingMode === 'exam' ? 'Modulzáró vizsga' : viewingMode === 'final-exam' ? 'Záróvizsga' : 'Kurzus Tartalom'}
                </div>
             )}
          </div>

          {/* 2. Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/10">
             <div className="max-w-5xl mx-auto h-full flex flex-col items-center">
                 
                {loading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                        <Skeleton className="h-10 w-3/4" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                ) : viewingMode === 'page' && currentPageData ? (
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
                            <div className="relative flex justify-center bg-background p-4 rounded-lg border shadow-sm min-h-[400px]">
                                {imgLoading && <Skeleton className="absolute inset-0 m-4 rounded-lg" />}
                                <img 
                                    src={currentPageData.mediaUrl} 
                                    alt={currentPageData.title} 
                                    className={`max-w-full h-auto rounded transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`} 
                                    onLoad={() => setImgLoading(false)}
                                />
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
                            if (passed) {
                                alert("Gratulálunk! Sikeresen elvégezted a kurzust és sikeres záróvizsgát tettél. Most visszairányítunk a főoldalra.");
                                router.push("/dashboard");
                            }
                        }}
                        onCancel={() => handleSelect(firstPage._id)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Válassz egy oldalt a kezdéshez.</div>
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
                        <ChevronLeft className="h-4 w-4" /> Előző
                    </Button>

                    <div className="hidden md:block text-sm text-muted-foreground">
                        {currentIndex + 1} / {allPages.length}
                    </div>

                    <Button 
                        disabled={!nextPage}
                        onClick={() => nextPage && handleSelect(nextPage._id)}
                        className="gap-2"
                    >
                        Következő <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
              )}
          </div>

        </main>
      </div>
    </div>
  )
}
