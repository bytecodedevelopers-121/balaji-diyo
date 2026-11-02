import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * FullscreenToggle
 * Toggles the browser's Fullscreen API for the whole page.
 * Syncs its icon with the actual fullscreen state so it stays correct
 * if the user exits via Esc instead of clicking the button again.
 */
export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="w-9 h-9 flex items-center justify-center rounded-xl
                 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface
                 transition-all cursor-pointer"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
    </button>
  );
}
