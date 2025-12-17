"use client"

import { useParams } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getCourseWithContent, createModule, createChapter, createPage } from "@/actions/course-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageEditor } from "@/components/lecturer/PageEditor"
import { ModuleSettings } from "@/components/lecturer/ModuleSettings"
import { QuestionManager } from "@/components/lecturer/QuestionManager"
import { FinalExamSettings } from "@/components/lecturer/FinalExamSettings"
import { Settings, Trash2, Plus, ChevronRight, FileText, Folder, FolderOpen, Upload, Loader2, Database } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function CourseEditorPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Editor State
  const [editingPage, setEditingPage] = useState<any>(null)
  const [editingModule, setEditingModule] = useState<any>(null)
  const [viewingQuestions, setViewingQuestions] = useState<any>(null)
  const [editingFinalExam, setEditingFinalExam] = useState(false)

  // Quick inputs state
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newChapterTitle, setNewChapterTitle] = useState("")

  useEffect(() => {
    loadCourse()
  }, [])

  async function loadCourse() {
      try {
          const data = await getCourseWithContent(courseId)
          setCourse(data)
      } catch (e) {
          console.error(e)
      } finally {
          setLoading(false)
      }
  }

  async function handleAddModule() {
      if (!newModuleTitle) return
      await createModule(courseId, newModuleTitle)
      setNewModuleTitle("")
      loadCourse()
  }

  async function handleAddChapter(moduleId: string) {
      const title = prompt("Enter Chapter Title:")
      if (!title) return
      await createChapter(moduleId, title)
      loadCourse()
  }

  async function handleImportPdf(chapterId: string, e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      
      try {
          // Dynamic import to avoid SSR issues
          const pdfjsLib = await import('pdfjs-dist');
          // Use CDN for worker to avoid build complexity with Next.js specific config for now
          // In a prod app we would bundle the worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

          const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
          
          if (!confirm(`Import ${pdf.numPages} pages from this PDF?`)) return;

          setLoading(true);

          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 1.5 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (context) {
                  // @ts-ignore
                  await page.render({ canvasContext: context, viewport }).promise;
                  
                  // Convert to Blob
                  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                  
                  if (blob) {
                      // Upload the image
                      const formData = new FormData();
                      formData.append('file', blob, `page-${i}.jpg`);
                      
                      const res = await fetch('/api/upload', { method: 'POST', body: formData });
                      const data = await res.json();
                      
                      if (data.success) {
                          // Create Page with Image
                          const imgHtml = `<p><img src="${data.url}" alt="Page ${i}" style="width:100%;" /></p>`;
                          // Pass content directly to createPage
                          await createPage(chapterId, `Page ${i}`, imgHtml, 'text');
                      }
                  }
              }
          }
           await loadCourse();
      } catch (err) {
          console.error("PDF Import Failed", err);
          alert("Failed to import PDF");
      } finally {
          setLoading(false);
      }
  }


  async function handleAddPage(chapterId: string) {
      await createPage(chapterId, "New Page")
      loadCourse()
  }

  if (loading) return <div>Loading course...</div>
  if (!course) return <div>Course not found</div>

  return (
    <div className="min-h-screen flex flex-col relative">
       <Navbar />
       <main className="flex-1 bg-muted/10 p-8">
         <div className="container mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                   <h1 className="text-3xl font-bold">{course.title}</h1>
                   <p className="text-muted-foreground">Managing Course Structure (Modules - Chapters - Pages)</p>
                </div>
                <div className="flex gap-4">
                     <Button variant="outline" asChild>
                         <Link href="/dashboard">Back to Dashboard</Link>
                     </Button>
                     <Button>Publish Course</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Structure Sidebar / Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Modules</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {course.modules?.length === 0 && <p className="text-muted-foreground">No modules yet.</p>}
                            
                            {course.modules?.map((module: any) => (
                                <div key={module._id} className="border rounded-lg p-4 bg-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 font-semibold text-lg">
                                            <FolderOpen className="h-5 w-5 text-blue-500" />
                                            {module.title}
                                            {/* Module Settings Trigger */}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 ml-2"
                                                title="Module Settings"
                                                onClick={() => setEditingModule(module)}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            {/* Question Pool Trigger */}
                                             <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 ml-1"
                                                title="Manage Question Pool"
                                                onClick={() => setViewingQuestions(module)}
                                            >
                                                <Database className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => handleAddChapter(module._id)}>
                                            <Plus className="h-4 w-4 mr-1" /> Add Chapter
                                        </Button>
                                    </div>
                                    
                                    <div className="pl-6 space-y-3 border-l-2 border-muted ml-2">
                                        {module.chapters?.map((chapter: any) => (
                                            <div key={chapter._id} className="bg-muted/30 p-3 rounded">
                                                 <div className="flex items-center justify-between mb-2">
                                                    <div className="font-medium flex items-center gap-2">
                                                        <Folder className="h-4 w-4 text-yellow-500" />
                                                        {chapter.title}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <label className="cursor-pointer">
                                                            <div className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Import PDF Pages">
                                                                <Upload className="h-3 w-3" />
                                                            </div>
                                                            <input 
                                                                type="file" 
                                                                accept="application/pdf" 
                                                                className="hidden" 
                                                                onChange={(e) => handleImportPdf(chapter._id, e)}
                                                            />
                                                        </label>
                                                        <Button size="sm" variant="ghost" onClick={() => handleAddPage(chapter._id)} className="h-6 text-xs">
                                                            <Plus className="h-3 w-3 mr-1" /> Page
                                                        </Button>
                                                    </div>
                                                 </div>
                                                 <div className="pl-6 space-y-1">
                                                     {chapter.pages?.map((page: any) => (
                                                         <div 
                                                            key={page._id} 
                                                            className="flex items-center justify-between text-sm text-foreground p-2 hover:bg-muted rounded cursor-pointer group"
                                                            onClick={() => setEditingPage(page)}
                                                         >
                                                             <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                                {page.title}
                                                             </div>
                                                             <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                                                         </div>
                                                     ))}
                                                     {chapter.pages?.length === 0 && <span className="text-xs text-muted-foreground italic">No pages</span>}
                                                 </div>
                                            </div>
                                        ))}
                                        {module.chapters?.length === 0 && <p className="text-sm text-muted-foreground italic">No chapters yet.</p>}
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-2 pt-4 border-t">
                                <Input 
                                    placeholder="New Module Title..." 
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                />
                                <Button onClick={handleAddModule}>Add Module</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Editor Settings (Future) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Configure global course settings and the final exam.</p>
                             <Button variant="outline" className="w-full" onClick={() => setEditingFinalExam(true)}>
                                <Settings className="mr-2 h-4 w-4" /> Final Exam Settings
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
         </div>
       </main>

       {/* Page Editor Slide-over */}
       {editingPage && (
           <PageEditor 
             page={editingPage} 
             onClose={() => setEditingPage(null)} 
             onSave={() => {
                 setEditingPage(null)
                 loadCourse()
             }} 
            />
       )}

       {/* Module Settings Dialog */}
       {editingModule && !viewingQuestions && (
           <ModuleSettings
               module={editingModule}
               onClose={() => setEditingModule(null)}
               onSave={() => {
                   setEditingModule(null)
                   loadCourse()
               }}
           />
       )}

       {/* Question Pool Manager */}
       {viewingQuestions && (
           <QuestionManager 
               module={viewingQuestions}
               onClose={() => setViewingQuestions(null)}
           />
       )}

       {/* Final Exam Settings Dialog */}
         {editingFinalExam && (
              <FinalExamSettings
                course={course}
                onClose={() => setEditingFinalExam(false)}
                onSave={() => {
                     setEditingFinalExam(false)
                     loadCourse()
                }}
              />
         )}
    </div>
  )
}
