"use client";

import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
import { Link, Power, Settings, Play, Pause, RefreshCw, ChevronLeft, ChevronRight, Sliders } from "lucide-react";

export default function PresenterRemote() {
  const [pin, setPin] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [intervalSec, setIntervalSec] = useState(10);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Pusher listener when connected
  useEffect(() => {
    if (!isConnected || !pin) return;

    const pusher = new Pusher("e9724bd6db7ccd51f076", { cluster: "ap2" });
    const channel = pusher.subscribe(`ecoblock-${pin}`);

    channel.bind("slide-update", (data: any) => {
      if (data.action === "sync_remote") {
        setCurrentSlide(data.current);
        setTotalSlides(data.total);
        setIsPlaying(data.isPlaying);
        setIsLooping(data.isLooping);
        setIntervalSec(data.interval);
      } else if (data.action === "disconnect") {
        handleDisconnect();
      }
    });

    // Request initial state from PC
    sendCommand("status");

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [isConnected, pin]);

  const sendCommand = async (action: string, slideNum: number | null = null, extra: any = {}) => {
    if (!pin) return;

    // Haptic feedback simulation
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }

    try {
      await fetch("/api/pusher.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          action,
          slide: slideNum,
          ...extra
        })
      });
    } catch (e) {
      console.error("Failed to send command", e);
    }
  };

  const handleConnect = () => {
    if (pin.trim().length >= 4) {
      setIsConnected(true);
    } else {
      alert("Please enter a valid 4-digit PIN.");
    }
  };

  const handleDisconnect = () => {
    sendCommand("disconnect");
    setIsConnected(false);
    setPin("");
    setIsSettingsOpen(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-100 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.05)_0%,transparent_60%)] pointer-events-none" />
        
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-6 border-white/5 shadow-2xl">
          <div>
            <h1 className="text-2xl font-black text-glow-primary text-emerald-400 tracking-widest uppercase">
              AEROSTONE
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
              Presenter Remote Setup
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-left">
                Enter Presentation Room PIN
              </label>
              <input
                type="text"
                pattern="\d*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="XXXX"
                className="w-full text-center text-3xl font-bold p-4 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-colors tracking-widest text-slate-100"
              />
            </div>

            <button
              onClick={handleConnect}
              disabled={pin.length < 4}
              className="btn-primary w-full justify-center py-4 text-base tracking-widest uppercase"
            >
              Connect Remote
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 flex flex-col justify-between">
      
      {/* Remote Header */}
      <div className="px-6 py-4 bg-slate-900 border-b border-white/5 flex items-center justify-between">
        <button 
          onClick={() => setIsSettingsOpen(prev => !prev)}
          className={`p-3 rounded-xl border border-white/5 transition-colors ${isSettingsOpen ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-950 text-slate-400"}`}
        >
          <Sliders className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active PIN: {pin}</span>
          <div className="text-lg font-black text-slate-200 mt-0.5">
            Slide <span className="text-emerald-400">{currentSlide}</span> / {totalSlides}
          </div>
        </div>

        <button 
          onClick={handleDisconnect}
          className="p-3 rounded-xl bg-slate-950 border border-white/5 text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      {/* Grid selector */}
      <div className="flex-grow p-6 overflow-y-auto max-w-lg mx-auto w-full flex items-center justify-center">
        <div className="grid grid-cols-4 gap-3 w-full">
          {Array.from({ length: totalSlides }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => sendCommand("goto", num)}
              className={`py-4 text-lg font-black rounded-2xl border transition-all ${
                currentSlide === num
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105"
                  : "bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-900"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Settings sheet drawer when open */}
      {isSettingsOpen && (
        <div className="bg-slate-900 border-t border-white/10 p-6 space-y-4 max-w-lg mx-auto w-full animate-enter">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Settings</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="text-xs text-slate-500 font-bold">Close</button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => isPlaying ? sendCommand("pause") : sendCommand("play")}
              className={`flex-1 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                isPlaying 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-950 text-slate-400 border-white/5"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause Autoplay" : "Auto Play"}
            </button>

            <button
              onClick={() => sendCommand("toggle_loop")}
              className={`flex-1 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                isLooping 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-950 text-slate-400 border-white/5"
              }`}
            >
              <RefreshCw className="w-4 h-4" /> Loop Slides
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-white/5">
            <span className="text-xs font-semibold text-slate-400">Slide Interval (Sec)</span>
            <input
              type="number"
              value={intervalSec}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 3 && val <= 60) {
                  setIntervalSec(val);
                  sendCommand("set_interval", null, { interval: val });
                }
              }}
              className="w-16 bg-slate-900 border border-white/10 rounded px-2 py-1 text-center font-bold text-emerald-400 text-sm outline-none"
            />
          </div>
        </div>
      )}

      {/* Big navigation bar */}
      <div className="px-6 py-5 bg-slate-900 border-t border-white/5 flex gap-4 max-w-lg mx-auto w-full">
        <button
          onClick={() => sendCommand("prev")}
          disabled={currentSlide === 1}
          className="flex-1 py-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-2xl border border-white/5 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Prev
        </button>
        <button
          onClick={() => sendCommand("next")}
          disabled={currentSlide === totalSlides}
          className="flex-1 py-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors"
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
