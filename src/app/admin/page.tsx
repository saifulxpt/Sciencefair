"use client";

import React, { useState, useEffect, useCallback } from "react";
import Pusher from "pusher-js";
import {
  Sliders, Layers, ArrowRight, Tv, Smartphone, Sparkles,
  Play, Pause, RefreshCw, Trash2, Plus, CheckCircle2, Users,
  Key, Database, ArrowUpRight, MessageSquare, Activity, Info,
  ChevronLeft, ChevronRight, Wifi, WifiOff, BarChart3, Brain,
  Zap, Shield, Clock, TrendingUp, Eye, Settings2, LogOut,
  AlertCircle, Check, X
} from "lucide-react";

interface TimelineEvent {
  id: string;
  event: string;
  time: string;
  type: "slide" | "vote" | "system";
}

type TabType = "control" | "votes" | "ai" | "settings";

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold backdrop-blur-xl border animate-slide-up ${
      type === "success"
        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
    }`}>
      {type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function AdminPanel() {
  const [pin, setPin] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [intervalSec, setIntervalSec] = useState(10);
  const [votes, setVotes] = useState({ yes: 0, no: 0, feed: [] as Array<{ name: string; type: string }> });
  const [aiLogs, setAiLogs] = useState<Array<{ id: number; query: string; response: string; timestamp: string }>>([]);
  const [resetting, setResetting] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [injectName, setInjectName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("control");
  const [savingConfig, setSavingConfig] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/assistant/config");
        const data = await res.json();
        if (data.status === "success") {
          setHasKey(data.has_key);
          if (data.masked_key) setApiKey(data.masked_key);
          if (data.model) setSelectedModel(data.model);
          if (data.system_prompt) setSystemPrompt(data.system_prompt);
        }
      } catch (e) {}
    };
    fetchConfig();
  }, []);

  const saveConfigSettings = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/assistant/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey, model: selectedModel, prompt: systemPrompt })
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!", "success");
        logEvent("এআই মডেল ও ট্রেনিং আপডেট করা হয়েছে।", "system");
        const resConfig = await fetch("/api/assistant/config");
        const dataConfig = await resConfig.json();
        if (dataConfig.status === "success") {
          setHasKey(dataConfig.has_key);
          if (dataConfig.masked_key) setApiKey(dataConfig.masked_key);
        }
      } else {
        showToast("কনফিগারেশন সংরক্ষণ করা সম্ভব হয়নি।", "error");
      }
    } catch (e) {
      showToast("সার্ভার ত্রুটি।", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const res = await fetch("/api/vote/fetch?t=" + Date.now());
        const data = await res.json();
        setVotes(data);
      } catch (e) {}
    };
    const fetchAiLogs = async () => {
      try {
        const res = await fetch("/api/assistant/logs?t=" + Date.now());
        const data = await res.json();
        if (data.status === "success") setAiLogs(data.logs);
      } catch (e) {}
    };
    fetchVotes();
    fetchAiLogs();
    const timer = setInterval(() => { fetchVotes(); fetchAiLogs(); }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isConnected || !pin) return;
    const pusher = new Pusher("e9724bd6db7ccd51f076", { cluster: "ap2" });
    const channel = pusher.subscribe(`ecoblock-${pin}`);
    channel.bind("slide-update", (data: any) => {
      if (data.action === "sync_remote") {
        setCurrentSlide(data.current);
        setIsPlaying(data.isPlaying);
        setIsLooping(data.isLooping);
        setIntervalSec(data.interval);
      } else if (data.action === "disconnect") {
        setIsConnected(false);
      }
    });
    sendCommand("status");
    return () => { channel.unbind_all(); channel.unsubscribe(); pusher.disconnect(); };
  }, [isConnected, pin]);

  const logEvent = (msg: string, type: "slide" | "vote" | "system") => {
    setTimelineEvents(prev => [{
      id: Math.random().toString(),
      event: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    }, ...prev].slice(0, 10));
  };

  useEffect(() => {
    if (isConnected) logEvent(`স্লাইড ${currentSlide}-এ পরিবর্তন করা হয়েছে।`, "slide");
  }, [currentSlide]);

  const totalVotes = votes.yes + votes.no;
  const approvalRate = totalVotes > 0 ? Math.round((votes.yes / totalVotes) * 100) : 0;

  useEffect(() => {
    if (totalVotes > 0) logEvent(`নতুন ভোট জমা। মোট ভোট: ${totalVotes}টি।`, "vote");
  }, [totalVotes]);

  useEffect(() => {
    if (isConnected) logEvent(`পিন ${pin} দিয়ে সংযুক্ত হয়েছে।`, "system");
    else setTimelineEvents([]);
  }, [isConnected]);

  const sendCommand = async (action: string, slideNum: number | null = null, extra: any = {}) => {
    if (!pin) return;
    try {
      await fetch("/api/pusher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, action, slide: slideNum, ...extra })
      });
    } catch (e) {}
  };

  const handleConnect = () => {
    if (pin.trim().length >= 4) setIsConnected(true);
    else showToast("দয়া করে ৪-ডিজিট পিন নাম্বারটি লিখুন।", "error");
  };

  const handleDisconnect = () => { sendCommand("disconnect"); setIsConnected(false); };

  const resetVotes = async () => {
    if (!confirm("আপনি কি নিশ্চিতভাবে সকল ভোট মুছে দিতে চান?")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/vote/reset");
      const result = await res.json();
      if (result.status === "success") {
        setVotes({ yes: 0, no: 0, feed: [] });
        logEvent("সকল ভোট রিসেট করা হয়েছে।", "system");
        showToast("ভোট ডেটা সফলভাবে মুছে ফেলা হয়েছে।", "success");
      }
    } catch (e) {
      showToast("ভোট ডেটা মুছতে ত্রুটি।", "error");
    } finally {
      setResetting(false);
    }
  };

  const injectVote = async (type: "yes" | "no") => {
    const voterName = injectName.trim() || "ভোটদাতা " + Math.floor(Math.random() * 100);
    setInjecting(true);
    try {
      const res = await fetch("/api/vote/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: voterName, type })
      });
      const result = await res.json();
      if (result.status === "success") {
        setInjectName("");
        const resFetch = await fetch("/api/vote/fetch?t=" + Date.now());
        const data = await resFetch.json();
        setVotes(data);
        showToast(`টেস্ট ভোট (${type === 'yes' ? 'হ্যাঁ' : 'না'}) সফলভাবে যোগ হয়েছে।`, "success");
      }
    } catch (e) {
      showToast("টেস্ট ভোট যোগ করা সম্ভব হয়নি।", "error");
    } finally {
      setInjecting(false);
    }
  };

  const getSlideInfo = (slideNum: number) => {
    const slides: Record<number, { title: string; emoji: string }> = {
      1: { title: "প্রজেক্ট পরিচিতি", emoji: "🏗️" },
      2: { title: "সমস্যা ও উদ্দেশ্য", emoji: "🌫️" },
      3: { title: "সমাধান সূত্র", emoji: "💡" },
      4: { title: "মিশ্রণ ও অনুপাত", emoji: "⚗️" },
      5: { title: "ফটোক্যাটালাইসিস", emoji: "☀️" },
      6: { title: "লাইভ সিমুলেশন", emoji: "🔬" },
      7: { title: "নাইট্রেট রূপান্তর", emoji: "♻️" },
      8: { title: "ল্যাব ফলাফল", emoji: "📊" },
      9: { title: "ইমপ্যাক্ট ক্যালকুলেটর", emoji: "🧮" },
      10: { title: "বাণিজ্যিক সুবিধা", emoji: "🏙️" },
      11: { title: "মতামত পোল", emoji: "🗳️" },
      12: { title: "ভবিষ্যত পরিকল্পনা", emoji: "🚀" },
      13: { title: "উপসংহার", emoji: "🎯" },
      14: { title: "প্রশ্নোত্তর", emoji: "❓" },
    };
    return slides[slideNum] || { title: "অজানা", emoji: "📄" };
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "control", label: "স্লাইড কন্ট্রোল", icon: <Tv className="w-4 h-4" /> },
    { id: "votes", label: "লাইভ ভোট", icon: <BarChart3 className="w-4 h-4" />, badge: totalVotes },
    { id: "ai", label: "AI লগ", icon: <Brain className="w-4 h-4" />, badge: aiLogs.length },
    { id: "settings", label: "সেটিংস", icon: <Settings2 className="w-4 h-4" /> },
  ];

  return (
    <div className="admin-root min-h-screen" style={{ fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; }
        
        .admin-root {
          background: #0a0f1a;
          color: #e2e8f0;
        }
        
        .glass-dark {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }
        
        .glass-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          backdrop-filter: blur(20px);
        }

        .glow-emerald { box-shadow: 0 0 30px rgba(16,185,129,0.15); }
        .glow-blue { box-shadow: 0 0 30px rgba(59,130,246,0.15); }
        
        .bg-grid {
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .neon-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 15px rgba(16,185,129,0.3);
          transition: all 0.2s ease;
        }
        .neon-btn:hover {
          box-shadow: 0 6px 25px rgba(16,185,129,0.5);
          transform: translateY(-1px);
        }
        .neon-btn:active { transform: translateY(0); }
        
        .danger-btn {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
          transition: all 0.2s ease;
        }
        .danger-btn:hover {
          background: rgba(239,68,68,0.2);
          box-shadow: 0 4px 15px rgba(239,68,68,0.2);
        }
        
        .tab-active {
          background: rgba(16,185,129,0.15);
          border-color: rgba(16,185,129,0.4) !important;
          color: #10b981;
        }
        
        .slide-btn-active {
          background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2));
          border-color: rgba(16,185,129,0.5) !important;
          color: #10b981;
          box-shadow: 0 0 15px rgba(16,185,129,0.15);
        }
        
        .input-dark {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s ease;
          outline: none;
        }
        .input-dark:focus {
          border-color: rgba(16,185,129,0.5);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .input-dark::placeholder { color: rgba(148,163,184,0.5); }
        
        .select-dark {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0;
          border-radius: 12px;
          outline: none;
          cursor: pointer;
        }
        .select-dark:focus {
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .select-dark option { background: #1e293b; }
        
        .scrollbar-dark::-webkit-scrollbar { width: 5px; }
        .scrollbar-dark::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 5px; }
        .scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 5px; }
        
        .pulse-dot {
          width: 8px; height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16,185,129,0.7);
          animation: pulse-ring 2s infinite;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        
        .stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 16px 20px;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
        }

        .timeline-line {
          position: relative;
          padding-left: 20px;
        }
        .timeline-line::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 8px;
          bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.08);
        }
        .timeline-dot {
          position: absolute;
          left: 0;
          top: 6px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid;
        }
        .timeline-dot-slide { background: rgba(16,185,129,0.2); border-color: #10b981; }
        .timeline-dot-vote { background: rgba(249,115,22,0.2); border-color: #f97316; }
        .timeline-dot-system { background: rgba(139,92,246,0.2); border-color: #8b5cf6; }
        
        .page-link-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.2s ease;
          text-decoration: none;
          color: inherit;
        }
        .page-link-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          transform: translateX(4px);
        }
        
        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-main { padding: 16px; }
        }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-100 pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, #10b981, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Header */}
      <header className="glass-dark sticky top-0 z-50 border-t-0 border-x-0 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }}>
              <Sliders className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="font-black text-sm text-white tracking-wide">এ্যারোস্টোন কন্ট্রোল</div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Science Fair 2026 Admin</div>
            </div>
          </div>

          {/* Center: Live time & status */}
          <div className="hidden md:flex items-center gap-3">
            <div className="stat-card flex items-center gap-2 py-2 px-3">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-sm text-slate-300 font-bold">
                {currentTime.toLocaleTimeString("bn-BD")}
              </span>
            </div>
            <div className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold ${
              isConnected
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-slate-700/30 border-slate-600/30 text-slate-500"
            }`}>
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isConnected ? `সংযুক্ত • পিন ${pin}` : "সংযুক্ত নেই"}
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2">
            <a href="/assistant/" target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">AI অ্যাসিস্ট্যান্ট</span>
            </a>
            <a href="/presentation/" target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
              style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}>
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">স্লাইডশো</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "মোট ভোট", value: totalVotes, icon: <BarChart3 className="w-4 h-4" />, color: "#10b981" },
            { label: "সমর্থন হার", value: `${approvalRate}%`, icon: <TrendingUp className="w-4 h-4" />, color: "#3b82f6" },
            { label: "AI কথোপকথন", value: aiLogs.length, icon: <Brain className="w-4 h-4" />, color: "#8b5cf6" },
            { label: "বর্তমান স্লাইড", value: `${currentSlide}/${totalSlides}`, icon: <Eye className="w-4 h-4" />, color: "#f97316" },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-semibold">{stat.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}20`, color: stat.color }}>
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Page Navigation */}
            <div className="glass-card p-5">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                পেজ নেভিগেশন
              </div>
              <div className="space-y-2">
                {[
                  { href: "/", icon: <Layers className="w-4 h-4" />, label: "মূল ড্যাশবোর্ড", desc: "ল্যান্ডিং পেজ", color: "#10b981" },
                  { href: "/presentation/", icon: <Tv className="w-4 h-4" />, label: "স্লাইডশো স্ক্রিন", desc: "প্রেজেন্টেশন", color: "#3b82f6" },
                  { href: "/assistant/", icon: <Sparkles className="w-4 h-4" />, label: "AI ভয়েস অ্যাসিস্ট্যান্ট", desc: "ট্যাবলেট পেজ", color: "#8b5cf6" },
                  { href: "/presentation/vote/", icon: <BarChart3 className="w-4 h-4" />, label: "লাইভ ভোট স্ক্রিন", desc: "দর্শক ভোটিং", color: "#f97316" },
                ].map((link, i) => (
                  <a key={i} href={link.href} target="_blank" className="page-link-card group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${link.color}15`, color: link.color }}>
                      {link.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{link.label}</div>
                      <div className="text-[10px] text-slate-500">{link.desc}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            {/* Live Vote Stats */}
            <div className="glass-card p-5">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                লাইভ মতামত পরিসংখ্যান
              </div>

              {/* Donut Chart */}
              <div className="flex items-center gap-5 mb-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" strokeWidth="7" stroke="rgba(255,255,255,0.06)" fill="transparent" />
                    <circle cx="40" cy="40" r="32" strokeWidth="7"
                      stroke="url(#emeraldGrad)"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 - (approvalRate / 100) * (2 * Math.PI * 32)}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white leading-none">{approvalRate}%</span>
                    <span className="text-[8px] text-slate-500 font-bold mt-0.5">সমর্থন</span>
                  </div>
                </div>

                <div className="flex-grow space-y-3">
                  {[
                    { label: "হ্যাঁ", count: votes.yes, pct: totalVotes > 0 ? Math.round(votes.yes/totalVotes*100) : 0, color: "#10b981" },
                    { label: "না", count: votes.no, pct: totalVotes > 0 ? Math.round(votes.no/totalVotes*100) : 0, color: "#f87171" },
                  ].map((v, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold" style={{ color: v.color }}>{v.label}</span>
                        <span className="text-slate-400 font-mono">{v.count} ({v.pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${v.pct}%`, background: v.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <button onClick={resetVotes} disabled={resetting}
                className="danger-btn w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
                {resetting ? "মুছে ফেলা হচ্ছে..." : "সব ভোট রিসেট করুন"}
              </button>

              <div className="mt-3 space-y-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">টেস্ট ভোট ইনজেক্ট</div>
                <div className="flex gap-2">
                  <input type="text" value={injectName} onChange={(e) => setInjectName(e.target.value)}
                    placeholder="ভোটারের নাম (ঐচ্ছিক)"
                    className="input-dark flex-grow text-xs px-3 py-2" />
                  <button onClick={() => injectVote("yes")} disabled={injecting}
                    className="neon-btn px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> হ্যাঁ
                  </button>
                  <button onClick={() => injectVote("no")} disabled={injecting}
                    className="px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <Plus className="w-3.5 h-3.5" /> না
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Panel */}
          <div className="lg:col-span-8 space-y-4">

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "tab-active"
                      : "bg-white/3 border-white/07 text-slate-500 hover:text-slate-300 hover:bg-white/05"
                  }`}
                  style={{ borderColor: activeTab === tab.id ? undefined : "rgba(255,255,255,0.07)" }}>
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                      style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Slide Control */}
            {activeTab === "control" && (
              <div className="glass-card p-5 space-y-5">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5 text-emerald-500" />
                  স্লাইড রিমোট কন্ট্রোল
                </div>

                {!isConnected ? (
                  <div className="max-w-sm mx-auto space-y-4 py-4">
                    <div className="text-center text-sm text-slate-400 leading-relaxed">
                      প্রেজেন্টেশন স্লাইডশোতে প্রদর্শিত <br />
                      <strong className="text-white">৪-ডিজিট পিন</strong> দিয়ে কানেক্ট করুন
                    </div>
                    <input type="text" pattern="\d*" maxLength={4} value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="0000"
                      className="input-dark w-full text-center text-4xl font-black py-5 tracking-widest"
                      onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    />
                    <button onClick={handleConnect} disabled={pin.length < 4}
                      className="neon-btn w-full py-3.5 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                      <Wifi className="w-4 h-4" /> প্রেজেন্টেশনের সাথে সংযুক্ত করুন
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Connection Banner */}
                    <div className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="pulse-dot" />
                        <span className="text-xs font-bold text-emerald-400">সংযুক্ত • পিন: {pin}</span>
                      </div>
                      <button onClick={handleDisconnect}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1">
                        <LogOut className="w-3.5 h-3.5" /> বিচ্ছিন্ন
                      </button>
                    </div>

                    {/* Current Slide Preview */}
                    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">বর্তমান স্লাইড</div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getSlideInfo(currentSlide).emoji}</span>
                        <div>
                          <div className="text-sm font-extrabold text-white">
                            স্লাইড {currentSlide}: {getSlideInfo(currentSlide).title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {currentSlide}/{totalSlides} • {isPlaying ? "▶ অটো-প্লে চলছে" : "⏸ বিরতিতে আছে"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prev/Next & Play/Loop */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex gap-2">
                        <button onClick={() => sendCommand("prev")}
                          className="flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
                          <ChevronLeft className="w-4 h-4" /> আগে
                        </button>
                        <button onClick={() => sendCommand("next")}
                          className="flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
                          পরে <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => isPlaying ? sendCommand("pause") : sendCommand("play")}
                          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all ${
                            isPlaying ? "tab-active" : ""
                          }`}
                          style={isPlaying ? {} : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying ? "থামান" : "অটো-প্লে"}
                        </button>
                        <button onClick={() => sendCommand("toggle_loop")}
                          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all ${
                            isLooping ? "tab-active" : ""
                          }`}
                          style={isLooping ? {} : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
                          <RefreshCw className="w-4 h-4" />
                          {isLooping ? "লুপ চলছে" : "লুপ"}
                        </button>
                      </div>
                    </div>

                    {/* Slide Grid */}
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">সরাসরি স্লাইডে যান</div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: totalSlides }, (_, i) => i + 1).map((num) => (
                          <button key={num} onClick={() => sendCommand("goto", num)}
                            className={`aspect-square rounded-xl text-sm font-black flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all border ${
                              currentSlide === num ? "slide-btn-active" : ""
                            }`}
                            style={currentSlide !== num ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)", color: "#64748b" } : {}}>
                            <span>{num}</span>
                            <span className="text-[7px] leading-none opacity-60">{getSlideInfo(num).emoji}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Jump */}
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">⚡ দ্রুত জাম্প</div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { slide: 6, label: "লাইভ ৩D কেমিক্যাল সিমুলেশন" },
                          { slide: 9, label: "পরিবেশ ইমপ্যাক্ট ক্যালকুলেটর" },
                          { slide: 11, label: "লাইভ মতামত পোল গ্রাফ" },
                        ].map((j) => (
                          <button key={j.slide} onClick={() => sendCommand("goto", j.slide)}
                            className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer transition-all group"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#94a3b8" }}>
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{getSlideInfo(j.slide).emoji}</span>
                              <span className="group-hover:text-white transition-colors">স্লাইড {j.slide}: {j.label}</span>
                            </div>
                            <Zap className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" /> লাইভ টাইমলাইন
                      </div>
                      <div className="space-y-3 max-h-44 overflow-y-auto scrollbar-dark">
                        {timelineEvents.length === 0 ? (
                          <div className="text-center text-xs text-slate-600 py-4">কোনো কার্যকলাপ নেই।</div>
                        ) : timelineEvents.map((ev) => (
                          <div key={ev.id} className="timeline-line">
                            <div className={`timeline-dot ${
                              ev.type === "slide" ? "timeline-dot-slide"
                              : ev.type === "vote" ? "timeline-dot-vote"
                              : "timeline-dot-system"
                            }`} />
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs text-slate-300 font-semibold">{ev.event}</span>
                              <span className="text-[10px] text-slate-600 font-mono shrink-0">{ev.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Votes Log */}
            {activeTab === "votes" && (
              <div className="glass-card p-5">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  সাম্প্রতিক মতামত ভোট
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-dark pr-1">
                  {votes.feed.length === 0 ? (
                    <div className="text-center py-16 text-slate-600">
                      <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <div className="text-sm font-semibold">এখনও কোনো ভোট জমা পড়েনি।</div>
                    </div>
                  ) : votes.feed.map((vote, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-base"
                          style={{ background: vote.type === "yes" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}>
                          {vote.type === "yes" ? "👍" : "👎"}
                        </div>
                        <span className="text-slate-300">{vote.name}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                        vote.type === "yes"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                        style={{ background: vote.type === "yes" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}>
                        {vote.type === "yes" ? "সমর্থন" : "দ্বিমত"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: AI Logs */}
            {activeTab === "ai" && (
              <div className="glass-card p-5">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  AI কথোপকথন লগ
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-dark pr-1">
                  {aiLogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-600">
                      <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <div className="text-sm font-semibold">কোনো কথোপকথন রেকর্ড নেই।</div>
                    </div>
                  ) : aiLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl space-y-2.5"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                          👤 দর্শক প্রশ্ন
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">{log.timestamp}</span>
                      </div>
                      <div className="text-xs font-bold text-white p-2.5 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.05)" }}>{log.query}</div>
                      <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI উত্তর
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed">{log.response}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === "settings" && (
              <div className="glass-card p-5 space-y-5">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-emerald-500" />
                  AI মডেল ও ট্রেনিং কনসোল
                </div>

                {/* API Key Status */}
                <div className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">OpenRouter API কী স্ট্যাটাস:</span>
                  </div>
                  {hasKey ? (
                    <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400"
                      style={{ background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: "8px" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> সক্রিয়
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-black text-amber-400"
                      style={{ background: "rgba(245,158,11,0.1)", padding: "4px 10px", borderRadius: "8px" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> সেট করুন
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">OpenRouter API Key</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="input-dark w-full text-xs px-4 py-3 font-mono" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI মডেল নির্বাচন</label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                      className="select-dark w-full text-xs px-4 py-3 font-bold">
                      <option value="google/gemini-2.5-flash">Gemini 2.5 Flash — সুপার ফাস্ট (মেলা ডেমো)</option>
                      <option value="google/gemini-2.5-pro">Gemini 2.5 Pro — জটিল প্রশ্ন</option>
                      <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet — উন্নত বুদ্ধিমত্তা</option>
                      <option value="openai/gpt-4o">GPT-4o — হাই পারফরম্যান্স</option>
                      <option value="openai/gpt-4o-mini">GPT-4o Mini — ফাস্ট লাইট</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">AI ট্রেনিং প্রম্পট (Knowledge Base)</label>
                      <span className="text-[9px] text-slate-600">{systemPrompt.length} অক্ষর</span>
                    </div>
                    <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={10}
                      placeholder="এখানে AI-এর সম্পূর্ণ নলেজ ও নির্দেশনা লিখুন..."
                      className="input-dark w-full text-xs px-4 py-3 font-medium leading-relaxed resize-y scrollbar-dark" />
                  </div>

                  <button onClick={saveConfigSettings} disabled={savingConfig}
                    className="neon-btn w-full py-3 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                    {savingConfig ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> সংরক্ষণ হচ্ছে...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> কনফিগারেশন সেভ করুন</>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-5 text-center relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          © 2026 এ্যারোস্টোন • যশোর পলিটেকনিক ইনস্টিটিউট • Science Fair Admin Console
        </div>
      </footer>
    </div>
  );
}
