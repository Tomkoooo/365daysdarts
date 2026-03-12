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
  const hasInitialRenderRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let renderTask: any = null;
    let loadingTask: any = null;
    let pdfDocument: any = null;
    let pdfPage: any = null;
    let objectUrl: string | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;

    const renderCurrentPage = async () => {
      if (!active || !pdfPage) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      if (renderTask) {
        renderTask.cancel();
        renderTask = null;
      }

      const baseViewport = pdfPage.getViewport({ scale: 1 });

      // Keep a small inner gutter around the canvas in the viewer card.
      const availableWidth = Math.max(container.clientWidth - 24, 1);
      const availableHeight = Math.max(container.clientHeight - 24, 1);

      const fitScale = Math.min(
        availableWidth / baseViewport.width,
        availableHeight / baseViewport.height
      );
      const clampedScale = Math.min(Math.max(fitScale, 0.25), 3);
      const scaledViewport = pdfPage.getViewport({ scale: clampedScale });

      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.style.width = `${scaledViewport.width}px`;
      canvas.style.height = `${scaledViewport.height}px`;
      canvas.width = Math.floor(scaledViewport.width * devicePixelRatio);
      canvas.height = Math.floor(scaledViewport.height * devicePixelRatio);

      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.imageSmoothingEnabled = true;

      renderTask = pdfPage.render({
        canvasContext: context,
        viewport: scaledViewport,
      });
      await renderTask.promise;
      renderTask = null;
    };

    const scheduleRender = () => {
      if (!active) return;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        void renderCurrentPage();
      });
    };

    async function initializePdf() {
      try {
        if (!hasInitialRenderRef.current) {
          setLoading(true);
        }
        setError(null);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        let pdfUrl = url;
        if (url.startsWith("/api/media/")) {
          const response = await fetch(url, { credentials: "include" });
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          pdfUrl = objectUrl;
        }

        loadingTask = pdfjs.getDocument(pdfUrl);
        pdfDocument = await loadingTask.promise;

        if (!active) return;

        const targetPage = Math.max(1, Math.min(pageIndex, pdfDocument.numPages));
        pdfPage = await pdfDocument.getPage(targetPage);

        if (!active) return;
        await renderCurrentPage();
        hasInitialRenderRef.current = true;

        const container = containerRef.current;
        if (container) {
          resizeObserver = new ResizeObserver(() => {
            scheduleRender();
          });
          resizeObserver.observe(container);
        }

      } catch (err: any) {
        if (active) {
          console.error("Error rendering PDF:", err);
          setError("Nem sikerült betölteni a PDF oldalt.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    
    initializePdf();

    return () => {
      active = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (renderTask) {
        renderTask.cancel();
      }
      if (loadingTask) {
        loadingTask.destroy();
      }
      if (pdfDocument) {
        pdfDocument.destroy();
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url, pageIndex]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-0 flex items-center justify-center rounded-lg shadow-sm border relative p-3 bg-background overflow-hidden">
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
