"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface PDFViewerProps {
  url: string;
  pageIndex?: number;
}

export function PDFViewer({ url, pageIndex = 1 }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let renderTask: any = null;

    async function renderPage() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import pdfjs
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!active) return;

        // Ensure page index is valid
        const targetPage = Math.max(1, Math.min(pageIndex, pdf.numPages));
        const page = await pdf.getPage(targetPage);

        if (!active) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        
        if (!container || !canvas) return;

        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = container.clientWidth;
        
        // Scale to fit width
        const scale = (containerWidth / viewport.width);
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext: any = {
          canvasContext: canvas.getContext('2d')!,
          viewport: scaledViewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

      } catch (err: any) {
        if (active) {
          console.error("Error rendering PDF:", err);
          setError("Nem sikerült betölteni a PDF oldalt.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    
    // Initial render
    renderPage();

    // Re-render on resize
    const handleResize = () => {
        if (active && !renderTask) {
             renderPage();
        }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      active = false;
      window.removeEventListener('resize', handleResize);
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [url, pageIndex]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 rounded-lg shadow-sm overflow-hidden border relative min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 transition-opacity">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error ? (
        <div className="text-destructive text-sm p-4 text-center">
            {error}
            <div className="mt-2 text-xs text-muted-foreground w-full break-all">
                {url}
            </div>
        </div>
      ) : (
        <canvas ref={canvasRef} className="max-w-full h-auto shadow-md" />
      )}
    </div>
  )
}
