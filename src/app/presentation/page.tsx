"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { 
  Layers, 
  Expand, 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Unlink
} from "lucide-react";

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [intervalSec, setIntervalSec] = useState(10);
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  
  const totalSlides = 14;
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);

  // 1. Viewport Auto-Scaling (Scale to fit without cropping)
  useEffect(() => {
    const handleResize = () => {
      const targetWidth = 1920;
      const targetHeight = 1080;
      
      const scaleX = window.innerWidth / targetWidth;
      const scaleY = window.innerHeight / targetHeight;
      
      // Scale down to fit within browser window keeping aspect ratio
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Mouse move listener to show/hide bottom controls overlay
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nearBottom = e.clientY > window.innerHeight - 100;
      setShowControls(nearBottom);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 3. Screen WakeLock to prevent sleep/dimming during exhibition
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("WakeLock request failed", err);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, []);

  // 4. Pusher synchronization
  useEffect(() => {
    const pusher = new Pusher("e9724bd6db7ccd51f076", { cluster: "ap2" });
    const channel = pusher.subscribe(`ecoblock-${pin}`);

    channel.bind("slide-update", (data: any) => {
      if (data.action === "sync_remote" || data.action === "disconnect") return;

      setIsLinked(true);

      if (data.action === "goto" && data.slide !== null) {
        setCurrentSlide(data.slide - 1);
      } else if (data.action === "next") {
        setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : isLooping ? 0 : prev));
      } else if (data.action === "prev") {
        setCurrentSlide(prev => (prev > 0 ? prev - 1 : isLooping ? totalSlides - 1 : prev));
      } else if (data.action === "play") {
        setIsPlaying(true);
      } else if (data.action === "pause") {
        setIsPlaying(false);
      } else if (data.action === "toggle_loop") {
        setIsLooping(prev => !prev);
      } else if (data.action === "set_interval" && data.interval) {
        setIntervalSec(data.interval);
      } else if (data.action === "status") {
        syncStateWithRemote(currentSlide);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [pin, currentSlide, isLooping]);

  // Sync state back to mobile remote
  const syncStateWithRemote = async (slideIndex: number) => {
    try {
      await fetch("/api/pusher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          action: "sync_remote",
          current: slideIndex + 1,
          total: totalSlides,
          isPlaying,
          isLooping,
          interval: intervalSec
        })
      });
    } catch (e) {
      console.error("Failed to sync remote", e);
    }
  };

  useEffect(() => {
    syncStateWithRemote(currentSlide);
  }, [currentSlide, isPlaying, isLooping, intervalSec]);

  // 5. Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : isLooping ? 0 : prev));
        setIsPlaying(false);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setCurrentSlide(prev => (prev > 0 ? prev - 1 : isLooping ? totalSlides - 1 : prev));
        setIsPlaying(false);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLooping]);

  // 6. Autoplay Timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev < totalSlides - 1) return prev + 1;
          if (isLooping) return 0;
          setIsPlaying(false);
          return prev;
        });
      }, intervalSec * 1000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, isLooping, intervalSec]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const handleUnlink = async () => {
    try {
      await fetch("/api/pusher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, action: "disconnect" })
      });
    } catch (e) {}
    setIsLinked(false);
  };

  // Generate iframe slide paths
  const slideSrcs = Array.from({ length: totalSlides }, (_, i) => `/presentation/${i + 1}.html`);

  return (
    <div 
      className="min-h-screen w-screen overflow-hidden flex items-center justify-center relative select-none"
      style={{
        background: "#fcfdfe", // Light color to blend seamlessly with slides background
        fontFamily: "' Hind Siliguri', 'Outfit', sans-serif"
      }}
    >
      
      {/* Viewport scale container */}
      <div 
        style={{
          width: "1920px",
          height: "1080px",
          position: "absolute",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)"
        }}
      >
        {slideSrcs.map((src, index) => (
          <iframe
            key={index}
            src={src}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
              opacity: currentSlide === index ? 1 : 0,
              pointerEvents: currentSlide === index ? "auto" : "none",
              transition: "opacity 0.4s ease-in-out",
              zIndex: currentSlide === index ? 10 : 1,
              backgroundColor: "transparent"
            }}
          />
        ))}
      </div>

      {/* Floating PIN Display Overlay */}
      <div 
        style={{
          position: "fixed",
          top: "25px",
          right: "25px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0,0,0,0.06)",
          padding: "10px 20px",
          borderRadius: "14px",
          color: "#475569",
          fontWeight: "bold",
          fontSize: "14px",
          zIndex: 1000,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)"
        }}
      >
        ROOM PIN: <span style={{ color: "#0d9488", fontSize: "18px", letterSpacing: "2px", marginLeft: "5px" }}>{pin}</span>
      </div>

      {/* Slide Progress Line */}
      <div 
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          height: "4px",
          background: "linear-gradient(90deg, #0d9488, #0ea5e9)",
          width: `${((currentSlide + 1) / totalSlides) * 100}%`,
          zIndex: 1000,
          transition: "width 0.4s ease-in-out"
        }}
      />

      {/* Floating Control Panel (Slides up when mouse moves near bottom) */}
      <div 
        style={{
          position: "fixed",
          bottom: "25px",
          left: "50%",
          transform: `translateX(-50%) translateY(${showControls ? "0" : "100px"})`,
          opacity: showControls ? 1 : 0,
          visibility: showControls ? "visible" : "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          padding: "8px 25px",
          borderRadius: "100px",
          display: "flex",
          gap: "15px",
          alignItems: "center",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.08)",
          zIndex: 1000,
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease"
        }}
      >
        <button 
          onClick={() => { setCurrentSlide(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
          disabled={currentSlide === 0}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px" }}
          title="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600 hover:text-emerald-600 transition-colors" />
        </button>

        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px" }}
          title={isPlaying ? "Pause Autoplay" : "Play Autoplay"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-emerald-600" />
          ) : (
            <Play className="w-4 h-4 text-slate-600 hover:text-emerald-600 transition-colors" />
          )}
        </button>

        <button 
          onClick={() => { setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1)); setIsPlaying(false); }}
          disabled={currentSlide === totalSlides - 1}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px" }}
          title="Next Slide"
        >
          <ChevronRight className="w-4 h-4 text-slate-600 hover:text-emerald-600 transition-colors" />
        </button>

        <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold", minWidth: "60px", textAlign: "center", borderRight: "1px solid rgba(0,0,0,0.08)", paddingRight: "15px" }}>
          {currentSlide + 1} / {totalSlides}
        </div>

        <button 
          onClick={() => setIsLooping(!isLooping)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px" }}
          title="Toggle Loop"
        >
          <RefreshCw className={`w-4 h-4 transition-colors ${isLooping ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`} />
        </button>

        <button 
          onClick={toggleFullscreen}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px" }}
          title="Toggle Fullscreen"
        >
          <Expand className="w-4 h-4 text-slate-600 hover:text-emerald-600 transition-colors" />
        </button>

        {isLinked && (
          <button 
            onClick={handleUnlink}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "8px" }}
            title="Unlink Phone Remote"
          >
            <Unlink className="w-4 h-4 text-rose-500 hover:text-rose-600 transition-colors" />
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "6px", borderLeft: "1px solid rgba(0,0,0,0.08)", paddingLeft: "15px" }}>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="number" 
            value={intervalSec} 
            min={3} 
            max={60}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 3 && val <= 60) {
                setIntervalSec(val);
              }
            }}
            style={{ width: "35px", border: "none", background: "none", fontSize: "12px", fontWeight: "bold", color: "#334155", textAlign: "center", outline: "none" }}
          />
        </div>
      </div>

    </div>
  );
}
