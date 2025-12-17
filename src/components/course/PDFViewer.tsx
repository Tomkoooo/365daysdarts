"use client"

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <iframe 
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full flex-1 border-0" 
        title="PDF Content"
      />
      {/* Fallback or sophisticated viewer can be added later */}
    </div>
  )
}
