"use client";

import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Info, Users, BarChart3, Leaf } from "lucide-react";

export default function PublicVotePage() {
  const [name, setName] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votes, setVotes] = useState<{ yes: number; no: number; feed: Array<{ name: string; type: string }> }>({
    yes: 0,
    no: 0,
    feed: []
  });

  // Check if already voted
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("hasVoted") === "true") {
      setHasVoted(true);
    }
  }, []);

  // Poll live vote counts every 3 seconds when showing results
  useEffect(() => {
    if (!hasVoted) return;

    const fetchVotes = async () => {
      try {
        const res = await fetch("/api/vote.php?action=fetch&t=" + Date.now());
        const data = await res.json();
        setVotes(data);
      } catch (e) {
        console.error("Failed to fetch votes", e);
      }
    };

    fetchVotes();
    const timer = setInterval(fetchVotes, 3000);
    return () => clearInterval(timer);
  }, [hasVoted]);

  const submitVote = async (type: "yes" | "no") => {
    if (!name.trim()) {
      alert("আপনার নাম লিখুন!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/vote.php?action=vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type })
      });
      const result = await res.json();

      // Premium artificial delay
      setTimeout(() => {
        if (result.status === "success") {
          localStorage.setItem("hasVoted", "true");
          setHasVoted(true);
        } else {
          alert("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
          location.reload();
        }
      }, 1000);
    } catch (e) {
      alert("ইন্টারনেট সংযোগ চেক করুন।");
      setIsSubmitting(false);
    }
  };

  const totalVotes = votes.yes + votes.no;
  const approvalRate = totalVotes > 0 ? Math.round((votes.yes / totalVotes) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(16,185,129,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="glass-panel w-full max-w-sm rounded-[35px] flex flex-col overflow-hidden border-white/5 shadow-2xl relative min-h-[500px]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="w-4.5 h-4.5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-200 text-sm">AEROSTONE</h1>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider leading-none mt-1">Science Fair 2026</p>
            </div>
          </div>
          <a href="/" className="w-9 h-9 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center">
            <Info className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {isSubmitting && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="font-bold text-slate-200 text-sm">প্রসেসিং হচ্ছে...</h3>
          </div>
        )}

        {!hasVoted ? (
          /* Form Screen */
          <div className="flex-grow flex flex-col p-6 justify-between space-y-6">
            <div className="flex-grow flex flex-col justify-center items-center text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-200">আপনার মতামত দিন</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                  পরিবেশ রক্ষায় এই আধুনিক প্রযুক্তির ব্যবহার সম্পর্কে আপনি কি একমত?
                </p>
              </div>
            </div>

            <div className="space-y-4 pb-2">
              <div>
                <label className="block text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 ml-1">
                  Voter Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার নাম লিখুন..."
                  className="w-full p-3.5 bg-slate-950 border border-white/5 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  onClick={() => submitVote("yes")}
                  className="btn-primary w-full justify-center py-3.5 text-xs tracking-wider uppercase font-bold"
                >
                  হ্যাঁ, আমি সমর্থন করি
                </button>
                <button
                  onClick={() => submitVote("no")}
                  className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-slate-300 transition-colors text-xs font-bold"
                >
                  না, দ্বিমত পোষণ করছি
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Results Screen */
          <div className="flex-grow flex flex-col p-6 justify-between space-y-6 animate-enter">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="font-extrabold text-sm text-slate-200">লাইভ পোল রেজাল্ট</h2>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
              </div>
            </div>

            {/* Doughnut SVG progress */}
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth="4" />
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="transparent" 
                    stroke="#10b981" 
                    strokeWidth="4" 
                    strokeDasharray={`${approvalRate} ${100 - approvalRate}`} 
                    strokeDashoffset="25"
                  />
                </svg>
                <span className="text-base font-black text-slate-100">{approvalRate}%</span>
              </div>
              <div className="flex-grow space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">হ্যাঁ / সমর্থন</span>
                  <span className="font-bold text-emerald-400">{votes.yes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">না / দ্বিমত</span>
                  <span className="font-bold text-rose-500">{votes.no}</span>
                </div>
              </div>
            </div>

            {/* Feed list */}
            <div className="flex-grow flex flex-col min-h-0">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                <span>সাম্প্রতিক ভোটসমূহ</span>
                <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-slate-400">Total: {totalVotes}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                {votes.feed.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">Waiting for votes...</div>
                ) : (
                  votes.feed.map((vote, idx) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center p-2.5 border rounded-xl text-[11px] font-semibold ${
                        vote.type === "yes" 
                          ? "bg-emerald-500/5 border-emerald-500/15" 
                          : "bg-rose-500/5 border-rose-500/15"
                      }`}
                    >
                      <span className="text-slate-200 truncate max-w-[200px]">{vote.name}</span>
                      {vote.type === "yes" ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> হ্যাঁ</span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> না</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
