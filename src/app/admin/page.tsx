"use client";

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
  Users
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

  // Check if OpenRouter key is set on load
  useEffect(() => {
    const checkKey = async () => {
      try {
        const res = await fetch("/api/assistant.php?action=has_key");
        const data = await res.json();
        if (data.status === "success") {
          setHasKey(data.has_key);
        }
      } catch (e) {}
    };
    checkKey();
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) {
      alert("দয়া করে একটি বৈধ ওপেনরাউটার কী লিখুন।");
      return;
    }
    try {
      const res = await fetch("/api/assistant.php?action=set_key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey })
      });
      const data = await res.json();
      if (data.status === "success") {
        setHasKey(true);
        setApiKey("");
        alert("ওপেনরাউটার এপিআই কী সফলভাবে সংরক্ষণ করা হয়েছে!");
      } else {
        alert("কী সংরক্ষণ করা সম্ভব হয়নি।");
      }
    } catch (e) {
      alert("সার্ভার ত্রুটি। দয়া করে আবার চেষ্টা করুন।");
    }
  };

  // 1. Fetch live votes and AI conversation logs on mount & poll every 3s
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

  // 2. Pusher coordination when connected
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
      alert("দয়া করে প্রেজেন্টেশন স্ক্রিনে প্রদর্শিত ৪-ডিজিট পিন নাম্বারটি লিখুন।");
    }
  };

  const handleDisconnect = () => {
    sendCommand("disconnect");
    setIsConnected(false);
  };

  const resetVotes = async () => {
    if (!confirm("আপনি কি নিশ্চিতভাবে সকল লাইভ ভোট মুছে দিতে চান? এর ফলে প্রদর্শনী স্ক্রিনের গ্রাফ শূন্য হয়ে যাবে।")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/vote.php?action=reset");
      const result = await res.json();
      if (result.status === "success") {
        setVotes({ yes: 0, no: 0, feed: [] });
        alert("ভোট ডেটা সফলভাবে রিসেট করা হয়েছে।");
      }
    } catch (e) {
      alert("ভোট রিসেট করা সম্ভব হয়নি। সার্ভার পারমিশন চেক করুন।");
    } finally {
      setResetting(false);
    }
  };

  const injectVote = async (type: "yes" | "no") => {
    const voterName = injectName.trim() || "দর্শক " + Math.floor(Math.random() * 100);
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
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
      
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 rounded-none border-t-0 border-x-0 border-b bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center bg-glow-primary">
              <Sliders className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-wider text-glow-primary" style={{ color: 'var(--color-primary)' }}>
                অ্যারোস্টোন কন্ট্রোল প্যানেল
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                সায়েন্স ফেয়ার ২০২৬ • অ্যাডমিন ড্যাশবোর্ড
              </div>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              অ্যাডমিন মোড সচল
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Navigation Links & Data Management */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Section 1: Navigation shortcuts */}
          <div className="glass-panel p-6 bg-white space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <ArrowRight className="w-4 h-4 text-emerald-500" /> পেজ নেভিগেশন ও শর্টকাট
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              বিচারক ও দর্শকদের সামনে দ্রুত পেজ পরিবর্তন করার জন্য নিচের লিংকগুলো ব্যবহার করুন:
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <a href="/" target="_blank" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-2xl group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-800">মূল প্রজেক্ট ড্যাশবোর্ড</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">অ্যারোস্টোন পরিচিতি ও লাইভ সিমুলেশন</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  যান <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              <a href="/presentation/" target="_blank" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:border-sky-500 rounded-2xl group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold shrink-0">
                    <Tv className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-800">প্রেজেন্টেশন স্লাইড শো</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">পূর্ণাঙ্গ ১৪-স্লাইডের স্লাইডশো স্ক্রিন</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-sky-600 flex items-center gap-1">
                  যান <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              <a href="/presentation/remote/" target="_blank" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:border-purple-500 rounded-2xl group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-800">মোবাইল রিমোট কন্ট্রোল</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">মোবাইল দিয়ে স্লাইড চেঞ্জ করার রিমোট</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-purple-600 flex items-center gap-1">
                  যান <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>

              <a href="/presentation/vote/" target="_blank" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:border-amber-500 rounded-2xl group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Vote className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-800">পাবলিক মতামত ফর্ম</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">দর্শকদের ভোট জমা নেওয়ার ফর্ম পেজ</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  যান <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>
          </div>

          {/* Section 1.5: OpenRouter API Key Setup */}
          <div className="glass-panel p-6 bg-white space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sliders className="w-4 h-4 text-emerald-500" /> ওপেনরাউটার এপিআই কী সেটআপ
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              বাংলা এআই ভয়েস অ্যাসিস্ট্যান্ট সচল করার জন্য আপনার ওপেনরাউটার API কী সেটআপ করুন:
            </p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">স্ট্যাটাস:</span>
                {hasKey ? (
                  <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> কনফিগার করা আছে
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> কী প্রয়োজন
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800"
                />
                <button
                  onClick={saveKey}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  কী সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Voting & Database Management */}
          <div className="glass-panel p-6 bg-white space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Vote className="w-4 h-4 text-emerald-500" /> লাইভ মতামত ডাটা কন্ট্রোলার
            </h2>
            
            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide">মোট জমা ভোট</div>
                <div className="text-3xl font-black text-slate-800 mt-1">{totalVotes} টি</div>
              </div>
              <div className="text-center border-l border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide">সমর্থনের হার</div>
                <div className="text-3xl font-black text-emerald-600 mt-1">{approvalRate}%</div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Reset votes */}
              <button 
                onClick={resetVotes}
                disabled={resetting}
                className="w-full py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> 
                {resetting ? "রিসেট করা হচ্ছে..." : "সকল লাইভ ভোট মুছে ফেলুন (রিসেট)"}
              </button>

              <hr className="border-slate-100" />

              {/* Inject mock votes */}
              <div className="space-y-2.5">
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider">টেস্ট ভোট ইনজেক্ট করুন</div>
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
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> হ্যাঁ
                  </button>
                  <button
                    onClick={() => injectVote("no")}
                    disabled={injecting}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> না
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Presenter Remote Controller Panel */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          
          <div className="glass-panel p-6 bg-white space-y-5 flex-grow">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Tv className="w-4 h-4 text-emerald-500" /> স্লাইড রিমোট কন্ট্রোল কনসোল
            </h2>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              স্লাইড শো পেজের ৪-ডিজিট রুম পিনটি এখানে লিখে সংযুক্ত করুন। এর ফলে বিচারকদের সামনে আপনি সরাসরি এখান থেকেই বড় স্ক্রিনের স্লাইড পরিবর্তন করতে পারবেন:
            </p>

            {!isConnected ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-center">
                    সক্রিয় প্রেজেন্টেশন পিন নাম্বার লিখুন
                  </label>
                  <input
                    type="text"
                    pattern="\d*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="XXXX"
                    className="w-full text-center text-3xl font-extrabold p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-slate-800 tracking-widest"
                  />
                </div>
                <button
                  onClick={handleConnect}
                  disabled={pin.length < 4}
                  className="btn-primary w-full justify-center py-3.5 text-xs tracking-wider uppercase font-bold cursor-pointer"
                >
                  প্রেজেন্টেশন লিংক করুন
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Connection Status Banner */}
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    সংযুক্ত রুম পিন: {pin}
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
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isPlaying 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "অটো-প্লে থামান" : "অটো-প্লে শুরু করুন"}
                  </button>

                  <button
                    onClick={() => sendCommand("toggle_loop")}
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isLooping 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" /> {isLooping ? "লুপ সচল" : "লুপ নিষ্ক্রিয়"}
                  </button>
                </div>

                {/* Slides Grid selector */}
                <div className="space-y-2.5">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    সরাসরি স্লাইড নির্বাচন করুন (ক্লিক করুন)
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: totalSlides }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => sendCommand("goto", num)}
                        className={`py-3.5 font-extrabold text-sm rounded-xl border transition-all cursor-pointer ${
                          currentSlide === num
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-md scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presentation Interactive Jumps */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    গুরুত্বপূর্ণ স্লাইড জাম্প (সরাসরি ডেমো)
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => sendCommand("goto", 6)} 
                      className="w-full text-left p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg flex justify-between items-center font-bold text-slate-700 cursor-pointer"
                    >
                      <div>স্লাইড ৬: লাইভ কেমিক্যাল রিঅ্যাকশন সিমুলেশন</div>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    
                    <button 
                      onClick={() => sendCommand("goto", 9)} 
                      className="w-full text-left p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg flex justify-between items-center font-bold text-slate-700 cursor-pointer"
                    >
                      <div>স্লাইড ৯: লাইভ পরিবেশগত ক্যালকুলেটর ডেমো</div>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </button>

                    <button 
                      onClick={() => sendCommand("goto", 11)} 
                      className="w-full text-left p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg flex justify-between items-center font-bold text-slate-700 cursor-pointer"
                    >
                      <div>স্লাইড ১১: লাইভ মতামত পোল গ্রাফ স্ক্রিন</div>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Voting Log Feed Preview */}
          <div className="glass-panel p-6 bg-white space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="w-4 h-4 text-emerald-500" /> সাম্প্রতিক লাইভ ভোটের তালিকা (সর্বশেষ ১০টি)
            </h2>

            <div className="overflow-y-auto max-h-48 space-y-2 pr-1 scrollbar-thin">
              {votes.feed.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">এখনও কোনো ভোট জমা পড়েনি। দর্শকদের মতামত কিউআর কোডটি দেখান।</div>
              ) : (
                votes.feed.slice(0, 10).map((vote, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
                    <span className="text-slate-700">{vote.name}</span>
                    {vote.type === "yes" ? (
                      <span className="text-emerald-600 font-extrabold uppercase tracking-wide">হ্যাঁ সমর্থন করেছেন</span>
                    ) : (
                      <span className="text-rose-600 font-extrabold uppercase tracking-wide">দ্বিমত পোষণ করেছেন</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Conversation History Log */}
          <div className="glass-panel p-6 bg-white space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> এআই ভয়েস অ্যাসিস্ট্যান্ট চ্যাট লগ (সর্বশেষ ৫০টি)
            </h2>

            <div className="overflow-y-auto max-h-80 space-y-3 pr-1 scrollbar-thin">
              {aiLogs.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">এখনও কোনো কথোপকথন রেকর্ড করা হয়নি। ভয়েস অ্যাসিস্ট্যান্ট পেজটি ব্যবহার করুন।</div>
              ) : (
                aiLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>দর্শক প্রশ্ন</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="font-extrabold text-slate-800 bg-white p-2 rounded-lg border border-slate-100">{log.query}</div>
                    <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">অ্যাসিস্ট্যান্ট উত্তর</div>
                    <div className="text-slate-600 pl-1 leading-relaxed">{log.response}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
