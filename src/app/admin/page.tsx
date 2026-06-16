"use client";
/************************************************************************
 * AeroStone World-Class Admin Dashboard Panel
 * Coordinates slide transitions via Pusher channels and presents
 * real-time voter statistics & AI dialogue transcripts.
 * Designed with a high-end glassmorphic visual language, 
 * rotating aurora graphics, and responsive grid panels.
 ************************************************************************/

import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
import { 
  Sliders, 
  Layers, 
  ArrowRight, 
  Tv, 
  Smartphone, 
  Vote, 
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Plus,
  CheckCircle2,
  Users,
  Key,
  Database,
  ArrowUpRight,
  MessageSquare
} from "lucide-react";

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

  // Load configuration details on load
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/assistant.php?action=get_config");
        const data = await res.json();
        if (data.status === "success") {
          setHasKey(data.has_key);
          if (data.masked_key) {
            setApiKey(data.masked_key);
          }
          if (data.model) {
            setSelectedModel(data.model);
          }
          if (data.system_prompt) {
            setSystemPrompt(data.system_prompt);
          }
        }
      } catch (e) {
        console.error("Failed to load configs", e);
      }
    };
    fetchConfig();
  }, []);

  const saveConfigSettings = async () => {
    try {
      const res = await fetch("/api/assistant.php?action=save_config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          key: apiKey,
          model: selectedModel,
          prompt: systemPrompt
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("এআই মডেল এবং কাস্টম ট্রেনিং কনফিগারেশন সফলভাবে সংরক্ষণ করা হয়েছে!");
        // Refresh key status
        const resConfig = await fetch("/api/assistant.php?action=get_config");
        const dataConfig = await resConfig.json();
        if (dataConfig.status === "success") {
          setHasKey(dataConfig.has_key);
          if (dataConfig.masked_key) {
            setApiKey(dataConfig.masked_key);
          }
        }
      } else {
        alert("কনফিগারেশন সংরক্ষণ করা সম্ভব হয়নি।");
      }
    } catch (e) {
      alert("সার্ভার ত্রুটি। দয়া করে আবার চেষ্টা করুন।");
    }
  };

  // Fetch live votes and AI conversation logs on mount & poll every 3s
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const res = await fetch("/api/vote.php?action=fetch&t=" + Date.now());
        const data = await res.json();
        setVotes(data);
      } catch (e) {
        console.error("Failed to fetch votes", e);
      }
    };

    const fetchAiLogs = async () => {
      try {
        const res = await fetch("/api/assistant.php?action=fetch_logs&t=" + Date.now());
        const data = await res.json();
        if (data.status === "success") {
          setAiLogs(data.logs);
        }
      } catch (e) {
        console.error("Failed to fetch AI logs", e);
      }
    };

    fetchVotes();
    fetchAiLogs();

    const timer = setInterval(() => {
      fetchVotes();
      fetchAiLogs();
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Pusher coordination when connected
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

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [isConnected, pin]);

  const sendCommand = async (action: string, slideNum: number | null = null, extra: any = {}) => {
    if (!pin) return;
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
      console.error("Failed to send remote command", e);
    }
  };

  const handleConnect = () => {
    if (pin.trim().length >= 4) {
      setIsConnected(true);
    } else {
      alert("দয়া করে প্রেজেন্টেশন স্লাইডশো পেজে প্রদর্শিত ৪-ডিজিট পিন নাম্বারটি লিখুন।");
    }
  };

  const handleDisconnect = () => {
    sendCommand("disconnect");
    setIsConnected(false);
  };

  const resetVotes = async () => {
    if (!confirm("আপনি কি নিশ্চিতভাবে সকল লাইভ ভোট মুছে দিতে চান? এর ফলে স্লাইডের মতামত গ্রাফ শূন্য হয়ে যাবে।")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/vote.php?action=reset");
      const result = await res.json();
      if (result.status === "success") {
        setVotes({ yes: 0, no: 0, feed: [] });
        alert("ভোট ডেটা সফলভাবে মুছে ফেলা হয়েছে।");
      }
    } catch (e) {
      alert("ভোট ডেটা মুছতে ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setResetting(false);
    }
  };

  const injectVote = async (type: "yes" | "no") => {
    const voterName = injectName.trim() || "ভোটদাতা " + Math.floor(Math.random() * 100);
    setInjecting(true);
    try {
      const res = await fetch("/api/vote.php?action=vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: voterName, type })
      });
      const result = await res.json();
      if (result.status === "success") {
        setInjectName("");
        // Re-fetch votes immediately
        const resFetch = await fetch("/api/vote.php?action=fetch&t=" + Date.now());
        const data = await resFetch.json();
        setVotes(data);
      }
    } catch (e) {
      alert("টেস্ট ভোট ইনজেক্ট করা সম্ভব হয়নি।");
    } finally {
      setInjecting(false);
    }
  };

  const totalVotes = votes.yes + votes.no;
  const approvalRate = totalVotes > 0 ? Math.round((votes.yes / totalVotes) * 100) : 0;

  return (
    <div 
      className="min-h-screen flex flex-col aurora-bg" 
      style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
    >
      {/* Background Aurora Glows */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />
      
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 rounded-none border-t-0 border-x-0 border-b bg-white/70 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center icon-container-glow">
              <Sliders className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-wider text-glow-primary" style={{ color: 'var(--color-primary)' }}>
                অ্যারোস্টোন কন্ট্রোল প্যানেল
              </div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                Science Fair 2026 • Live Admin Console
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="/assistant" 
              target="_blank"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-purple-500/20 mr-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> ভয়েস অ্যাসিস্ট্যান্ট পেজ
            </a>
            <div className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
              অ্যাডমিন লাইভ সেশন
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Navigation, Keys, and Voting DB Management */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Section 1: Navigation Shortcuts */}
          <div className="glass-panel p-6 bg-white/80 border-white/40 shadow-lg">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
              পেজ নেভিগেশন ও প্রদর্শনী শর্টকাট
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed mb-1">
              প্রদর্শনী চলাকালীন সময়ে বিচারক ও বিজ্ঞানমেলার দর্শকদের সুবিধার্থে পৃষ্ঠাগুলো সরাসরি খুলুন:
            </p>
            
            <div className="grid grid-cols-1 gap-2.5">
              <a href="/" target="_blank" className="flex items-center justify-between p-3.5 bg-slate-50/60 hover:bg-emerald-50/20 border border-slate-200/80 hover:border-emerald-400 rounded-2xl group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-800">মূল প্রজেক্ট ড্যাশবোর্ড (ল্যান্ডিং পেজ)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">অ্যারোস্টোন সিমুলেশন ও প্রযুক্তিগত তথ্য</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
              </a>

              <a href="/presentation/" target="_blank" className="flex items-center justify-between p-3.5 bg-slate-50/60 hover:bg-sky-50/20 border border-slate-200/80 hover:border-sky-400 rounded-2xl group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100/70 text-sky-600 flex items-center justify-center font-bold shrink-0">
                    <Tv className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-800">প্রেজেন্টেশন স্লাইড শো স্ক্রিন</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">বিজ্ঞান মেলা প্রদর্শনীর জন্য পূর্ণাঙ্গ স্লাইড</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition-colors" />
              </a>

              <a href="/assistant/" target="_blank" className="flex items-center justify-between p-3.5 bg-slate-50/60 hover:bg-purple-50/20 border border-slate-200/80 hover:border-purple-400 rounded-2xl group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-800">এআই ভয়েস অ্যাসিস্ট্যান্ট (ট্যাবলেট পেজ)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">দর্শকদের ভয়েস প্রশ্নের উত্তর প্রদানের ট্যাব স্ক্রিন</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
              </a>
            </div>
          </div>

          {/* Section 2: AeroStone AI Training & Settings Console */}
          <div className="glass-panel p-6 bg-white/80 border-white/40 shadow-lg space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              এআই মডেল ও ট্রেইনিং কনসোল
            </h2>

            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              {/* API Key Connection Status */}
              <div className="flex justify-between items-center">
                <span>ওপেনরাউটার এপিআই কী স্ট্যাটাস:</span>
                {hasKey ? (
                  <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> এপিআই সক্রিয়
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> কী সেট করুন
                  </span>
                )}
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">OpenRouter API Key:</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800 transition-all font-mono"
                />
              </div>

              {/* Model Dropdown Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">সক্রিয় এআই মডেল (AI Model):</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800 transition-all cursor-pointer font-bold animate-fade-in"
                >
                  <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (সুপার ফাস্ট, মেলা ডেমো)</option>
                  <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (জটিল প্রশ্ন ও গভীর ব্যাখ্যা)</option>
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (উন্নত বুদ্ধিমত্তা ও কোডিং)</option>
                  <option value="openai/gpt-4o">GPT-4o (হাই পারফরম্যান্স)</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini (ফাস্ট লাইট মডেল)</option>
                </select>
              </div>

              {/* Prompt Training Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">এআই অ্যাসিস্ট্যান্ট নলেজ ট্রেনিং (Prompt):</label>
                  <span className="text-[10px] text-slate-400 font-normal">এডিটযোগ্য নলেজ বেস</span>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  placeholder="এখানে এআই এর সম্পূর্ণ নলেজ ও ডেমো নির্দেশনাগুলো লিখুন..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800 transition-all font-medium leading-relaxed resize-y scrollbar-thin"
                />
              </div>

              <button
                onClick={saveConfigSettings}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md hover:shadow-emerald-600/25 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> কনফিগারেশন ও ট্রেইনিং সেভ করুন
              </button>
            </div>
          </div>

          {/* Section 3: Live Poll & Database Management */}
          <div className="glass-panel p-6 bg-white/80 border-white/40 shadow-lg">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              লাইভ মতামত ডাটা কন্ট্রোলার
            </h2>
            
            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 shadow-inner">
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">মোট সংগৃহীত ভোট</div>
                <div className="text-3xl font-black text-slate-800 mt-1">{totalVotes} <span className="text-sm font-bold text-slate-400">টি</span></div>
              </div>
              <div className="text-center border-l border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">জনপ্রিয়তা হার</div>
                <div className="text-3xl font-black text-emerald-600 mt-1">{approvalRate}%</div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Reset votes button */}
              <button 
                onClick={resetVotes}
                disabled={resetting}
                className="w-full py-3 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-600 hover:bg-rose-100/60 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> 
                {resetting ? "মুছে ফেলা হচ্ছে..." : "ডাটাবেজের সকল মতামত ভোট রিসেট করুন"}
              </button>

              <hr className="border-slate-100" />

              {/* Inject mock votes */}
              <div className="space-y-2.5">
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider">টেস্ট ভোট ইনজেক্ট (সিমুলেশন)</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={injectName}
                    onChange={(e) => setInjectName(e.target.value)}
                    placeholder="ভোটারের নাম (ঐচ্ছিক)"
                    className="flex-grow text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
                  />
                  <button
                    onClick={() => injectVote("yes")}
                    disabled={injecting}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                  >
                    <Plus className="w-3.5 h-3.5" /> হ্যাঁ
                  </button>
                  <button
                    onClick={() => injectVote("no")}
                    disabled={injecting}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
                  >
                    <Plus className="w-3.5 h-3.5" /> না
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Slide Control Deck & Conversation Logger feeds */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          
          {/* Main Slide controller card */}
          <div className="glass-panel p-6 bg-white/80 border-white/40 shadow-lg flex-grow">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              স্লাইড রিমোট কন্ট্রোল কনসোল
            </h2>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              প্রেজেন্টেশন স্লাইডের সাথে লিংক করতে স্ক্রিনে দৃশ্যমান ৪-ডিজিট পিন নাম্বারটি দিয়ে কানেক্ট করুন:
            </p>

            {!isConnected ? (
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
                    সক্রিয় প্রেজেন্টেশন পিন টাইপ করুন
                  </label>
                  <input
                    type="text"
                    pattern="\d*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="XXXX"
                    className="w-full text-center text-3xl font-black p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800 tracking-widest shadow-inner focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
                <button
                  onClick={handleConnect}
                  disabled={pin.length < 4}
                  className="btn-primary w-full justify-center py-3.5 text-xs tracking-wider uppercase font-bold cursor-pointer shadow-md hover:shadow-emerald-600/25"
                >
                  প্রেজেন্টেশন লিংক করুন
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Connection Status Banner */}
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100/60 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    সংযুক্ত সেশন পিন: {pin}
                  </div>
                  <button 
                    onClick={handleDisconnect}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    সংযোগ বিচ্ছিন্ন করুন
                  </button>
                </div>

                {/* Autoplay Remote Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => isPlaying ? sendCommand("pause") : sendCommand("play")}
                    className={`py-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isPlaying 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100/50"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "অটো-প্লে থামান" : "অটো-প্লে শুরু করুন"}
                  </button>

                  <button
                    onClick={() => sendCommand("toggle_loop")}
                    className={`py-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isLooping 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100/50"
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" /> {isLooping ? "লুপ সচল আছে" : "লুপ নিষ্ক্রিয়"}
                  </button>
                </div>

                {/* Slides Grid selector */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    সরাসরি স্লাইডে জাম্প করুন (গ্রিড সিলেক্টর)
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: totalSlides }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => sendCommand("goto", num)}
                        className={`py-3 font-extrabold text-sm rounded-xl border transition-all cursor-pointer slide-matrix-card ${
                          currentSlide === num
                            ? "active"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presentation Interactive Jumps */}
                <div className="space-y-2 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-200/70 text-xs">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    গুরুত্বপূর্ণ স্লাইড জাম্প (লাইভ ডেমো সেশন)
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => sendCommand("goto", 6)} 
                      className="w-full text-left p-3.5 bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-xl flex justify-between items-center font-bold text-slate-700 cursor-pointer transition-all hover:translate-x-1"
                    >
                      <div>স্লাইড ৬: লাইভ থ্রি-ডি কেমিক্যাল রিঅ্যাকশন সিমুলেশন</div>
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </button>
                    
                    <button 
                      onClick={() => sendCommand("goto", 9)} 
                      className="w-full text-left p-3.5 bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-xl flex justify-between items-center font-bold text-slate-700 cursor-pointer transition-all hover:translate-x-1"
                    >
                      <div>স্লাইড ৯: পরিবেশগত ইমপ্যাক্ট ক্যালকুলেটর ডেমো</div>
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button 
                      onClick={() => sendCommand("goto", 11)} 
                      className="w-full text-left p-3.5 bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-xl flex justify-between items-center font-bold text-slate-700 cursor-pointer transition-all hover:translate-x-1"
                    >
                      <div>স্লাইড ১১: লাইভ মতামত পোল ফলাফল স্ক্রিন (গ্রাফ)</div>
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Voting Log Feed Preview */}
          <div className="glass-panel p-6 bg-white/80 border-white/40 shadow-lg">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              সাম্প্রতিক লাইভ ভোটের তালিকা (সর্বশেষ ১০টি)
            </h2>

            <div className="overflow-y-auto max-h-48 space-y-2 pr-1 scrollbar-thin">
              {votes.feed.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">এখনও কোনো মতামত ভোট জমা পড়েনি। মতামত নেওয়ার কিউআর কোডটি দেখান।</div>
              ) : (
                votes.feed.slice(0, 10).map((vote, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs font-bold audit-log-item shadow-sm">
                    <span className="text-slate-700">{vote.name}</span>
                    {vote.type === "yes" ? (
                      <span className="text-emerald-600 font-black uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">হ্যাঁ সমর্থন করেছেন</span>
                    ) : (
                      <span className="text-rose-600 font-black uppercase tracking-wide bg-rose-50 px-2 py-1 rounded-md border border-rose-100">দ্বিমত পোষণ করেছেন</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Conversation History Log */}
          <div className="glass-panel p-6 bg-white/80 border-white/40 shadow-lg">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              এআই ভয়েস অ্যাসিস্ট্যান্ট চ্যাট লগ (সর্বশেষ ৫০টি)
            </h2>

            <div className="overflow-y-auto max-h-80 space-y-3.5 pr-1 scrollbar-thin">
              {aiLogs.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">এখনও কোনো কথোপকথন রেকর্ড করা হয়নি। ভয়েস অ্যাসিস্ট্যান্ট পেজটি ব্যবহার করুন।</div>
              ) : (
                aiLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs shadow-sm audit-log-item">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      <span>দর্শক প্রশ্ন</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="font-extrabold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-150 shadow-inner">{log.query}</div>
                    <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest pt-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> অ্যাসিস্ট্যান্ট উত্তর
                    </div>
                    <div className="text-slate-600 pl-1 leading-relaxed">{log.response}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-slate-400 font-bold border-t border-slate-200/50 bg-white/50 backdrop-blur-sm relative z-10">
        © 2026 অ্যারোস্টোন সায়েন্স ফেয়ার অ্যাসিস্ট্যান্ট • যশোর পলিটেকনিক ইনস্টিটিউট
      </footer>
    </div>
  );
}
