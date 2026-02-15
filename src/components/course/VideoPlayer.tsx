"use client"

interface VideoPlayerProps {
  url: string;
  title?: string;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  // Simple check for YouTube URL
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  if (isYouTube) {
     let embedUrl = url;
     if (url.includes("watch?v=")) {
         embedUrl = url.replace("watch?v=", "embed/");
     } else if (url.includes("youtu.be/")) {
         embedUrl = url.replace("youtu.be/", "www.youtube.com/embed/");
     }
     // Remove extra query params if simple replace failed or needed cleanup
     // For robust parsing, regex is better but this works for standard share links

    return (
        <div className="aspect-video max-w-full max-h-full bg-black rounded-lg overflow-hidden relative shadow-lg">
            <iframe 
                src={embedUrl} 
                title={title || "Video player"} 
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            />
        </div>
    )
  }

  return (
    <div className="aspect-video max-w-full max-h-full bg-black rounded-lg overflow-hidden relative shadow-lg">
      <video 
        src={url} 
        controls 
        controlsList="nodownload" 
        className="w-full h-full object-contain"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
