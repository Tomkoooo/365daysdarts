"use client"

interface PDFViewerProps {
  url: string;
  pageIndex?: number;
}

export function PDFViewer({ url, pageIndex }: PDFViewerProps) {
  // Append page parameter if it exists (PDF standard: #page=N)
  // pageIndex comes as 1-based from the DB/Page model normally if we saved it as such
  const src = pageIndex ? `${url}#page=${pageIndex}&toolbar=0&navpanes=0&scrollbar=0&view=FitH` : `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  
  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border">
      <iframe 
        src={src}
        className="w-full flex-1 border-0" 
        title="PDF Content"
      />
    </div>
  )
}
