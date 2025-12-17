"use client"

import { useEffect } from "react"

export default function PrivacyWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'S') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        // Note: Browsers protect most screenshot shortcuts, this is best effort.
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        body {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        @media print {
          html, body {
            display: none !important;
          }
        }
      `}</style>
      <div className="relative min-h-screen">
         {children}
         {/* Simple watermark or overlay could go here */}
      </div>
    </>
  )
}
