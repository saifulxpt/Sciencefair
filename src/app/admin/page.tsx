"use client";

import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
import {
  Sliders, Layers, Tv, Sparkles, Play, Pause, RefreshCw, Trash2,
  Plus, CheckCircle2, Users, ArrowUpRight, MessageSquare, Activity,
  ChevronLeft, ChevronRight, Wifi, WifiOff, BarChart3, Brain,
  Zap, Settings2, LogOut, AlertCircle, Check, X, Clock, TrendingUp,
  Eye, Key, Bot, Radio, SkipForward, SkipBack
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
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 20px", borderRadius: 14,
      background: type === "success" ? "rgba(37,99,235,0.08)" : "rgba(220,38,38,0.08)",
      border: `1px solid ${type === "success" ? "rgba(37,99,235,0.2)" : "rgba(220,38,38,0.2)"}`,
      color: type === "success" ? "#2563eb" : "#dc2626",
      fontSize: 13, fontWeight: 700,
      backdropFilter: "blur(20px)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      animation: "slideUp 0.3s ease"
    }}>
      {type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
      {message}
      <button onClick={onClose} style={{ marginLeft: 8, opacity: 0.6, cursor: "pointer", background: "none", border: "none", color: "inherit", display: "flex" }}>
        <X size={13} />
      </button>
    </div>
  );
}

const SLIDES: Record<number, { title: string; emoji: string; desc: string }> = {
  1: { title: "প্রজেক্ট পরিচিতি", emoji: "🏗️", desc: "Air Purifying Concrete Block" },
  2: { title: "সমস্যা ও উদ্দেশ্য", emoji: "🌫️", desc: "ঢাকার বায়ুদূষণ" },
  3: { title: "সমাধান সূত্র", emoji: "💡", desc: "ফটোক্যাটালাইটিক ব্লক" },
  4: { title: "মিশ্রণ ও অনুপাত", emoji: "⚗️", desc: "TiO₂ নানোপার্টিকেল" },
  5: { title: "ফটোক্যাটালাইসিস", emoji: "☀️", desc: "UV রশ্মির প্রভাব" },
  6: { title: "লাইভ সিমুলেশন", emoji: "🔬", desc: "3D রিঅ্যাকশন" },
  7: { title: "নাইট্রেট রূপান্তর", emoji: "♻️", desc: "দূষণমুক্ত প্রক্রিয়া" },
  8: { title: "ল্যাব ফলাফল", emoji: "📊", desc: "৮০% NOx হ্রাস" },
  9: { title: "ইমপ্যাক্ট ক্যালকুলেটর", emoji: "🧮", desc: "পরিবেশগত প্রভাব" },
  10: { title: "বাণিজ্যিক সুবিধা", emoji: "🏙️", desc: "Sidewalk ব্যবহার" },
  11: { title: "মতামত পোল", emoji: "🗳️", desc: "দর্শক ভোট" },
  12: { title: "ভবিষ্যত পরিকল্পনা", emoji: "🚀", desc: "ব্যাপক উৎপাদন" },
  13: { title: "উপসংহার", emoji: "🎯", desc: "প্রজেক্ট সমাপ্তি" },
  14: { title: "প্রশ্নোত্তর", emoji: "❓", desc: "বিচারকদের প্রশ্ন" },
};

export default function AdminPanel() {
  const [pin, setPin] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 14;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
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

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/assistant/config").then(r => r.json()).then(d => {
      if (d.status === "success") {
        setHasKey(d.has_key);
        if (d.masked_key) setApiKey(d.masked_key);
        if (d.model) setSelectedModel(d.model);
        if (d.system_prompt) setSystemPrompt(d.system_prompt);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAll = () => {
      fetch("/api/vote/fetch?t=" + Date.now()).then(r => r.json()).then(d => setVotes(d)).catch(() => {});
      fetch("/api/assistant/logs?t=" + Date.now()).then(r => r.json()).then(d => { if (d.status === "success") setAiLogs(d.logs); }).catch(() => {});
    };
    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isConnected || !pin) return;
    const pusher = new Pusher("e9724bd6db7ccd51f076", { cluster: "ap2" });
    const ch = pusher.subscribe(`ecoblock-${pin}`);
    ch.bind("slide-update", (d: any) => {
      if (d.action === "sync_remote") { setCurrentSlide(d.current); setIsPlaying(d.isPlaying); setIsLooping(d.isLooping); }
      else if (d.action === "disconnect") setIsConnected(false);
    });
    sendCmd("status");
    return () => { ch.unbind_all(); ch.unsubscribe(); pusher.disconnect(); };
  }, [isConnected, pin]);

  const logEvent = (msg: string, type: "slide" | "vote" | "system") => {
    setTimelineEvents(prev => [{ id: Math.random().toString(), event: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type }, ...prev].slice(0, 12));
  };

  useEffect(() => { if (isConnected) logEvent(`স্লাইড ${currentSlide}: ${SLIDES[currentSlide]?.title}`, "slide"); }, [currentSlide]);
  const totalVotes = votes.yes + votes.no;
  const approvalRate = totalVotes > 0 ? Math.round((votes.yes / totalVotes) * 100) : 0;
  useEffect(() => { if (totalVotes > 0) logEvent(`নতুন ভোট — মোট: ${totalVotes}`, "vote"); }, [totalVotes]);
  useEffect(() => { if (isConnected) logEvent(`পিন ${pin} দিয়ে সংযুক্ত`, "system"); else setTimelineEvents([]); }, [isConnected]);

  const sendCmd = async (action: string, slideNum?: number | null, extra: any = {}) => {
    if (!pin) return;
    try { await fetch("/api/pusher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, action, slide: slideNum, ...extra }) }); } catch {}
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const r = await fetch("/api/assistant/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: apiKey, model: selectedModel, prompt: systemPrompt }) });
      const d = await r.json();
      if (d.status === "success") { showToast("কনফিগারেশন সংরক্ষিত হয়েছে!", "success"); logEvent("AI কনফিগ আপডেট হয়েছে", "system"); }
      else showToast("সংরক্ষণ ব্যর্থ হয়েছে।", "error");
    } catch { showToast("সার্ভার ত্রুটি।", "error"); }
    finally { setSavingConfig(false); }
  };

  const resetVotes = async () => {
    if (!confirm("সকল ভোট মুছে দেবেন?")) return;
    setResetting(true);
    try {
      const r = await fetch("/api/vote/reset");
      const d = await r.json();
      if (d.status === "success") { setVotes({ yes: 0, no: 0, feed: [] }); showToast("সব ভোট মুছে গেছে।", "success"); }
    } catch { showToast("ত্রুটি হয়েছে।", "error"); }
    finally { setResetting(false); }
  };

  const injectVote = async (type: "yes" | "no") => {
    const name = injectName.trim() || "টেস্ট ভোটার " + Math.floor(Math.random() * 99);
    setInjecting(true);
    try {
      await fetch("/api/vote/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type }) });
      setInjectName("");
      const r = await fetch("/api/vote/fetch?t=" + Date.now());
      setVotes(await r.json());
      showToast(`"${name}" ভোট (${type === "yes" ? "হ্যাঁ" : "না"}) যোগ হয়েছে`, "success");
    } catch { showToast("ভোট যোগ করা গেল না।", "error"); }
    finally { setInjecting(false); }
  };

  const C = {
    bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0", borderHover: "#cbd5e1",
    text: "#0f172a", muted: "#475569", dim: "#64748b",
    green: "#2563eb", greenBg: "rgba(37,99,235,0.08)", greenBorder: "rgba(37,99,235,0.25)",
    blue: "#0ea5e9", blueBg: "rgba(14,165,233,0.08)", blueBorder: "rgba(14,165,233,0.2)",
    purple: "#7c3aed", purpleBg: "rgba(124,58,237,0.08)", purpleBorder: "rgba(124,58,237,0.2)",
    orange: "#ea580c", orangeBg: "rgba(234,88,12,0.08)", orangeBorder: "rgba(234,88,12,0.2)",
    red: "#dc2626", redBg: "rgba(220,38,38,0.08)", redBorder: "rgba(220,38,38,0.2)",
  };

  const s: Record<string, React.CSSProperties> = {
    root: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', 'Hind Siliguri', system-ui, sans-serif", fontSize: 14 },
    header: { background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#2563eb,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center" },
    logoText: { fontSize: 14, fontWeight: 700, color: C.text },
    logoSub: { fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" },
    pill: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: "1px solid", cursor: "default" },
    hdrLink: { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", textDecoration: "none", transition: "all .15s", background: "transparent" },
    main: { maxWidth: 1280, margin: "0 auto", padding: "24px 24px", display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 },
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" },
    cardHead: { padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" },
    cardBody: { padding: 16 },
    sectionLabel: { fontSize: 11, fontWeight: 600, color: C.dim, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 },
    navLink: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, border: `1px solid transparent`, fontSize: 13, fontWeight: 500, color: C.muted, textDecoration: "none", cursor: "pointer", transition: "all .15s", marginBottom: 2 },
    stat: { padding: "14px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#f8fafc" },
    tab: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, cursor: "pointer", color: C.muted, transition: "all .15s", background: "transparent", whiteSpace: "nowrap" as const },
    tabActive: { background: C.greenBg, borderColor: C.greenBorder, color: C.green },
    input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color .15s" },
    textarea: { width: "100%", padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical" as const, lineHeight: 1.6, transition: "border-color .15s" },
    select: { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#ffffff", color: C.text, fontSize: 13, outline: "none", cursor: "pointer" },
    btnGreen: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: C.green, color: "#ffffff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", width: "100%" },
    btnRed: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%", transition: "all .15s" },
    btnGhost: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" },
    btnGhostActive: { borderColor: C.greenBorder, background: C.greenBg, color: C.green },
    slideGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 },
    slideBtn: { aspectRatio: "1", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", borderRadius: 6, border: `1px solid ${C.border}`, background: "#f8fafc", cursor: "pointer", fontSize: 12, fontWeight: 700, color: C.muted, transition: "all .15s" },
    slideBtnActive: { borderColor: C.greenBorder, background: C.greenBg, color: C.green, boxShadow: `0 0 0 2px ${C.greenBg}` },
    voteBar: { height: 6, borderRadius: 3, overflow: "hidden", background: "rgba(15,23,42,0.06)" },
    logItem: { padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#f8fafc", marginBottom: 8 },
    badge: { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" },
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .spin { animation: spin 1s linear infinite; }
        a:hover .nav-lnk-inner, button.nav-hover:hover { background: rgba(15,23,42,0.04) !important; color: #0f172a !important; }
        .hdr-link:hover { background: rgba(15,23,42,0.06) !important; color: #0f172a !important; }
        .slide-btn:hover:not(.slide-btn-active) { border-color: #cbd5e1 !important; background: rgba(15,23,42,0.03) !important; color: #0f172a !important; }
        .tab-btn:hover:not(.tab-active) { background: rgba(15,23,42,0.04) !important; color: #0f172a !important; }
        .input-field:focus { border-color: #2563eb !important; }
        .btn-gh:hover { background: rgba(15,23,42,0.05) !important; color: #0f172a !important; }
        .btn-red:hover { background: rgba(220,38,38,0.12) !important; }
        .btn-green:hover { opacity: 0.9; }
        .quick-jump:hover { background: rgba(15,23,42,0.04) !important; border-color: #cbd5e1 !important; }
        .nav-link-item:hover { background: rgba(15,23,42,0.04) !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
        input, textarea, select { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        
        .hidden-mobile { display: inline-block; }
        .visible-mobile { display: none; }
        
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: inline !important; }
        }
        
        @media (max-width: 900px) {
          .admin-grid { 
            display: flex !important; 
            flex-direction: column !important; 
            gap: 16px !important; 
          }
          .admin-sidebar { 
            order: 2 !important; 
            display: flex !important; 
            flex-direction: column !important; 
            gap: 16px !important; 
          }
          .admin-main-content { 
            order: 1 !important; 
          }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}><Sliders size={15} color="#ffffff" /></div>
          <div>
            <div style={s.logoText}>
              <span className="hidden-mobile">Air Purifying Concrete Block</span>
              <span className="visible-mobile">AeroStone Admin</span>
            </div>
            <div className="hidden-mobile" style={s.logoSub}>Admin Console • Science Fair 2026</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="hidden-mobile" style={{ fontSize: 11, color: C.muted, fontFamily: "monospace", fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.03)" }}>
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div style={{ ...s.pill, ...(isConnected ? { background: C.greenBg, borderColor: C.greenBorder, color: C.green } : { background: "rgba(255,255,255,0.04)", borderColor: C.border, color: C.dim }) }}>
            {isConnected ? <><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "blink 2s infinite", display: "inline-block" }} /> পিন {pin}</> : <><WifiOff size={10} /> সংযুক্ত নেই</>}
          </div>
          <a href="/assistant/" target="_blank" className="hdr-link" style={s.hdrLink}>
            <Sparkles size={12} color={C.purple} /> 
            <span className="hidden-mobile">AI অ্যাসিস্ট্যান্ট</span>
          </a>
          <a href="/presentation/" target="_blank" className="hdr-link" style={s.hdrLink}>
            <Tv size={12} color={C.blue} /> 
            <span className="hidden-mobile">স্লাইডশো</span>
          </a>
        </div>
      </header>

      {/* Body */}
      <div className="admin-grid" style={s.main}>

        {/* ─── Left Sidebar ─── */}
        <div className="admin-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "মোট ভোট", value: totalVotes, color: C.green, icon: <BarChart3 size={13} /> },
              { label: "সমর্থন", value: `${approvalRate}%`, color: C.blue, icon: <TrendingUp size={13} /> },
              { label: "AI লগ", value: aiLogs.length, color: C.purple, icon: <Brain size={13} /> },
              { label: "স্লাইড", value: `${currentSlide}/${totalSlides}`, color: C.orange, icon: <Eye size={13} /> },
            ].map((st, i) => (
              <div key={i} style={s.stat}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.dim, fontWeight: 600 }}>{st.label}</div>
                  <div style={{ color: st.color }}>{st.icon}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>{st.value}</div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div style={s.card}>
            <div style={s.cardHead}><Layers size={12} /> পেজ নেভিগেশন</div>
            <div style={{ padding: "8px" }}>
              {[
                { href: "/", color: C.green, icon: <Layers size={14} />, label: "মূল ড্যাশবোর্ড", sub: "Landing Page" },
                { href: "/presentation/", color: C.blue, icon: <Tv size={14} />, label: "স্লাইডশো স্ক্রিন", sub: "Presentation" },
                { href: "/assistant/", color: C.purple, icon: <Bot size={14} />, label: "AI ভয়েস অ্যাসিস্ট্যান্ট", sub: "Tablet Screen" },
                { href: "/presentation/vote/", color: C.orange, icon: <BarChart3 size={14} />, label: "লাইভ ভোট স্ক্রিন", sub: "Audience Voting" },
              ].map((lnk, i) => (
                <a key={i} href={lnk.href} target="_blank" className="nav-link-item" style={{ ...s.navLink }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${lnk.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: lnk.color, flexShrink: 0 }}>{lnk.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{lnk.label}</div>
                    <div style={{ fontSize: 10, color: C.dim }}>{lnk.sub}</div>
                  </div>
                  <ArrowUpRight size={12} color={C.dim} />
                </a>
              ))}
            </div>
          </div>

          {/* Vote Stats */}
          <div style={s.card}>
            <div style={s.cardHead}><BarChart3 size={12} /> লাইভ মতামত</div>
            <div style={s.cardBody}>
              {/* SVG Ring */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={36} cy={36} r={28} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                    <circle cx={36} cy={36} r={28} fill="none"
                      stroke={C.green} strokeWidth={6} strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - approvalRate / 100)}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{approvalRate}%</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[{ label: "হ্যাঁ", val: votes.yes, pct: totalVotes > 0 ? Math.round(votes.yes / totalVotes * 100) : 0, color: C.green },
                    { label: "না", val: votes.no, pct: totalVotes > 0 ? Math.round(votes.no / totalVotes * 100) : 0, color: C.red }].map((v, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: v.color }}>{v.label}</span>
                        <span style={{ color: C.muted, fontFamily: "monospace" }}>{v.val} ({v.pct}%)</span>
                      </div>
                      <div style={s.voteBar}><div style={{ height: "100%", width: `${v.pct}%`, background: v.color, borderRadius: 3, transition: "width 0.5s ease" }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={resetVotes} disabled={resetting} className="btn-red" style={s.btnRed}>
                <Trash2 size={12} />{resetting ? "মুছছে..." : "সব ভোট রিসেট করুন"}
              </button>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={s.sectionLabel}>টেস্ট ভোট ইনজেক্ট</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={injectName} onChange={e => setInjectName(e.target.value)} placeholder="ভোটারের নাম" className="input-field" style={{ ...s.input, flex: 1, fontSize: 12 }} />
                  <button onClick={() => injectVote("yes")} disabled={injecting} style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.greenBorder}`, background: C.greenBg, color: C.green, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><Plus size={11} />হ্যাঁ</button>
                  <button onClick={() => injectVote("no")} disabled={injecting} style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><Plus size={11} />না</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Main ─── */}
        <div className="admin-main-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tab Bar */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {([
              { id: "control" as TabType, label: "স্লাইড কন্ট্রোল", icon: <Radio size={12} /> },
              { id: "votes" as TabType, label: "ভোট ফিড", icon: <Users size={12} />, badge: totalVotes },
              { id: "ai" as TabType, label: "AI কথোপকথন", icon: <MessageSquare size={12} />, badge: aiLogs.length },
              { id: "settings" as TabType, label: "সেটিংস", icon: <Settings2 size={12} /> },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
                style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}>
                {tab.icon}{tab.label}
                {"badge" in tab && tab.badge > 0 && (
                  <span style={{ padding: "1px 6px", borderRadius: 20, background: activeTab === tab.id ? "rgba(63,185,80,0.2)" : "rgba(255,255,255,0.07)", fontSize: 10, fontWeight: 700, color: activeTab === tab.id ? C.green : C.muted }}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: Control ── */}
          {activeTab === "control" && (
            <div style={s.card}>
              <div style={s.cardHead}><Radio size={12} color={C.green} /> স্লাইড রিমোট কন্ট্রোল</div>
              <div style={s.cardBody}>
                {!isConnected ? (
                  <div style={{ maxWidth: 340, margin: "20px auto" }}>
                    <div style={{ textAlign: "center", color: C.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.8 }}>
                      প্রেজেন্টেশন স্লাইডশোতে প্রদর্শিত<br />
                      <span style={{ color: C.text, fontWeight: 700 }}>৪-ডিজিট পিন</span> দিয়ে কানেক্ট করুন
                    </div>
                    <input type="text" pattern="\d*" maxLength={4} value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={e => e.key === "Enter" && pin.length >= 4 && setIsConnected(true)}
                      placeholder="0000" className="input-field"
                      style={{ ...s.input, textAlign: "center", fontSize: 32, fontWeight: 800, letterSpacing: "0.3em", padding: "16px", marginBottom: 12, fontFamily: "monospace" }} />
                    <button onClick={() => pin.length >= 4 ? setIsConnected(true) : showToast("৪-ডিজিট পিন দিন", "error")}
                      style={{ ...s.btnGreen, gap: 8, fontSize: 14 }} className="btn-green">
                      <Wifi size={15} /> কানেক্ট করুন
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Connection bar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: C.greenBg, border: `1px solid ${C.greenBorder}`, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: C.green }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "blink 2s infinite", display: "inline-block" }} />
                        লাইভ • পিন: <strong>{pin}</strong>
                      </div>
                      <button onClick={() => { sendCmd("disconnect"); setIsConnected(false); }} style={{ fontSize: 11, fontWeight: 600, color: C.red, cursor: "pointer", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4 }}>
                        <LogOut size={11} /> বিচ্ছিন্ন
                      </button>
                    </div>

                    {/* Current slide preview */}
                    <div style={{ padding: "14px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ fontSize: 32 }}>{SLIDES[currentSlide]?.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>বর্তমান স্লাইড ({currentSlide}/{totalSlides})</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{SLIDES[currentSlide]?.title}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{SLIDES[currentSlide]?.desc}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: isPlaying ? C.green : C.dim, fontWeight: 600 }}>{isPlaying ? "▶ Auto-play" : "⏸ Paused"}</div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
                      {[
                        { action: "prev", icon: <SkipBack size={14} />, label: "আগে", active: false },
                        { action: "next", icon: <SkipForward size={14} />, label: "পরে", active: false },
                        { action: isPlaying ? "pause" : "play", icon: isPlaying ? <Pause size={14} /> : <Play size={14} />, label: isPlaying ? "থামান" : "Play", active: isPlaying },
                        { action: "toggle_loop", icon: <RefreshCw size={14} />, label: isLooping ? "লুপ চলছে" : "লুপ", active: isLooping },
                      ].map((ctrl, i) => (
                        <button key={i} onClick={() => sendCmd(ctrl.action)} className="btn-gh"
                          style={{ ...s.btnGhost, ...(ctrl.active ? s.btnGhostActive : {}), flexDirection: "column", gap: 4, padding: "10px 6px", fontSize: 11, fontWeight: 600 }}>
                          {ctrl.icon}{ctrl.label}
                        </button>
                      ))}
                    </div>

                    {/* Slide grid */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ ...s.sectionLabel, marginBottom: 8 }}>스슬라이ড 선택</div>
                      <div style={s.slideGrid}>
                        {Array.from({ length: totalSlides }, (_, i) => i + 1).map(n => (
                          <button key={n} onClick={() => sendCmd("goto", n)} className={`slide-btn ${currentSlide === n ? "slide-btn-active" : ""}`}
                            style={{ ...s.slideBtn, ...(currentSlide === n ? s.slideBtnActive : {}) }}>
                            <span style={{ fontSize: 9, lineHeight: 1 }}>{SLIDES[n]?.emoji}</span>
                            <span style={{ fontSize: 11 }}>{n}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick jumps */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={s.sectionLabel}>⚡ গুরুত্বপূর্ণ স্লাইড</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {[
                          { s: 6, label: "লাইভ 3D কেমিক্যাল সিমুলেশন" },
                          { s: 9, label: "পরিবেশ ইমপ্যাক্ট ক্যালকুলেটর" },
                          { s: 11, label: "লাইভ মতামত পোল গ্রাফ" },
                        ].map(j => (
                          <button key={j.s} onClick={() => sendCmd("goto", j.s)} className="quick-jump"
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "left", transition: "all .15s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span>{SLIDES[j.s]?.emoji}</span>
                              <span>স্লাইড {j.s}: {j.label}</span>
                            </div>
                            <Zap size={11} color={C.green} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <div style={{ ...s.sectionLabel, display: "flex", alignItems: "center", gap: 6 }}><Activity size={10} /> লাইভ টাইমলাইন</div>
                      <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {timelineEvents.length === 0 ? (
                          <div style={{ textAlign: "center", color: C.dim, fontSize: 12, padding: "20px 0" }}>কোনো কার্যকলাপ নেই।</div>
                        ) : timelineEvents.map(ev => (
                          <div key={ev.id} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: ev.type === "slide" ? C.green : ev.type === "vote" ? C.orange : C.purple, flexShrink: 0, marginTop: 5 }} />
                            <div style={{ flex: 1, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{ev.event}</div>
                            <span style={{ fontSize: 10, color: C.dim, fontFamily: "monospace", flexShrink: 0 }}>{ev.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Votes ── */}
          {activeTab === "votes" && (
            <div style={s.card}>
              <div style={s.cardHead}><Users size={12} color={C.green} /> সাম্প্রতিক মতামত ভোট</div>
              <div style={{ ...s.cardBody, maxHeight: 540, overflowY: "auto" }}>
                {votes.feed.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: C.dim }}>
                    <BarChart3 size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>এখনও কোনো ভোট জমা পড়েনি।</div>
                  </div>
                ) : votes.feed.map((v, i) => (
                  <div key={i} style={{ ...s.logItem }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{v.type === "yes" ? "👍" : "👎"}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v.name}</span>
                      </div>
                      <span style={{ ...s.badge, background: v.type === "yes" ? C.greenBg : C.redBg, color: v.type === "yes" ? C.green : C.red, border: `1px solid ${v.type === "yes" ? C.greenBorder : C.redBorder}` }}>
                        {v.type === "yes" ? "সমর্থন" : "দ্বিমত"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: AI ── */}
          {activeTab === "ai" && (
            <div style={s.card}>
              <div style={s.cardHead}><Brain size={12} color={C.purple} /> AI কথোপকথন লগ</div>
              <div style={{ ...s.cardBody, maxHeight: 540, overflowY: "auto" }}>
                {aiLogs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: C.dim }}>
                    <MessageSquare size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>কোনো কথোপকথন লগ নেই।</div>
                  </div>
                ) : aiLogs.map(log => (
                  <div key={log.id} style={{ ...s.logItem, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>👤 দর্শক প্রশ্ন</span>
                      <span style={{ fontSize: 10, color: C.dim, fontFamily: "monospace" }}>{log.timestamp}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, padding: "8px 10px", borderRadius: 6, background: "rgba(255,255,255,0.04)", marginBottom: 8 }}>{log.query}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> AI উত্তর</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{log.response}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Settings ── */}
          {activeTab === "settings" && (
            <div style={s.card}>
              <div style={s.cardHead}><Settings2 size={12} color={C.orange} /> AI মডেল ও ট্রেনিং কনসোল</div>
              <div style={s.cardBody}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.muted }}>
                    <Key size={12} /> OpenRouter API Key
                  </div>
                  <span style={{ ...s.badge, ...(hasKey ? { background: C.greenBg, borderColor: C.greenBorder, color: C.green } : { background: "rgba(227,179,65,0.1)", borderColor: "rgba(227,179,65,0.25)", color: C.orange }), border: "1px solid" }}>
                    {hasKey ? "✓ সক্রিয়" : "⚠ সেট করুন"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ ...s.sectionLabel, display: "block" }}>API Key</label>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-or-v1-..." className="input-field" style={{ ...s.input, fontFamily: "monospace" }} />
                  </div>
                  <div>
                    <label style={{ ...s.sectionLabel, display: "block" }}>AI মডেল</label>
                    <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={s.select}>
                      <option value="google/gemini-2.5-flash">Gemini 2.5 Flash — দ্রুত (মেলা ডেমো)</option>
                      <option value="google/gemini-2.5-pro">Gemini 2.5 Pro — জটিল প্রশ্ন</option>
                      <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                      <option value="openai/gpt-4o">GPT-4o</option>
                      <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ ...s.sectionLabel, margin: 0 }}>AI ট্রেনিং প্রম্পট</label>
                      <span style={{ fontSize: 10, color: C.dim }}>{systemPrompt.length} অক্ষর</span>
                    </div>
                    <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={12} placeholder="AI-এর সম্পূর্ণ নলেজ ও নির্দেশনা লিখুন..." className="input-field" style={s.textarea} />
                  </div>
                  <button onClick={saveConfig} disabled={savingConfig} style={s.btnGreen} className="btn-green">
                    {savingConfig ? <><RefreshCw size={13} className="spin" /> সংরক্ষণ হচ্ছে...</> : <><CheckCircle2 size={13} /> কনফিগারেশন সেভ করুন</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 0 32px", fontSize: 11, color: C.dim, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
        © 2026 Air Purifying Concrete Block • যশোর পলিটেকনিক ইনস্টিটিউট • Science Fair 2026
      </div>
    </div>
  );
}
