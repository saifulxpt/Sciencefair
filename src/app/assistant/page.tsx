"use client";
/************************************************************************
 * AeroStone World-Class Bangla AI Voice Assistant
 * Displays scrolling chat bubbles, custom audio wave visualizers,
 * and handles fallbacks like direct text input and preset questions.
 * Includes a premium light theme layout with glassmorphic cards, 
 * rotating holographic rings, and aurora glow background details.
 ************************************************************************/

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Sparkles, 
  MessageSquare,
  HelpCircle,
  Send,
  User,
  Activity,
  Headphones
} from "lucide-react";

type Message = {
  sender: "user" | "ai";
  text: string;
};

type AssistantStatus = "idle" | "listening" | "processing" | "speaking";

export default function VoiceAssistant() {
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Welcome Message, Speech Recognition & Synthesis on mount
  useEffect(() => {
    // Welcome message
    setChatHistory([
      {
        sender: "ai",
        text: "আসসালামু আলাইকুম! আমি অ্যারোস্টোন এআই ভয়েস অ্যাসিস্ট্যান্ট। পরিবেশবান্ধব অ্যারোস্টোন প্রজেক্ট সম্পর্কে যেকোনো বৈজ্ঞানিক তথ্য বা প্রশ্ন জানার জন্য গোলকের ওপর ক্লিক করে কথা বলুন অথবা নিচে টাইপ করুন।"
      }
    ]);

    if (typeof window !== "undefined") {
      // 1. Speech Recognition Setup
      const SpeechRecognition = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = "bn-BD"; // Bangla voice input language
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        
        rec.onstart = () => {
          setStatus("listening");
          setErrorMessage("");
        };
        
        rec.onresult = (e: any) => {
          const resultText = e.results[0][0].transcript;
          if (resultText) {
            askAI(resultText, false);
          }
        };
        
        rec.onerror = (e: any) => {
          console.error("Speech Recognition Error", e);
          if (e.error === "not-allowed") {
            setErrorMessage("মাইক্রোফোন ব্যবহারের অনুমতি নেই। দয়া করে ব্রাউজার সেটিংস চেক করুন।");
          } else {
            setErrorMessage("দুঃখিত, কথা বুঝতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
          }
          setStatus("idle");
        };
        
        rec.onend = () => {
          setStatus((prev) => (prev === "listening" ? "processing" : prev));
        };
        
        setRecognition(rec);
      } else {
        setErrorMessage("আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট করে না। ক্রোম ব্রাউজার ব্যবহার করুন।");
      }

      // 2. Speech Synthesis Setup
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      stopSpeaking();
    };
  }, []);

  // Scroll to bottom of conversation feed on change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Stop speaking logic
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  // Speak AI reply in Bangla
  const speakText = (text: string) => {
    stopSpeaking();
    if (isMuted || !synthRef.current) return;
    
    // Clear any markdown/formatting symbols
    const cleanedText = text.replace(/[*#_\-`]/g, "");
    
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "bn-BD"; // Bangla voice readout
    
    // Try to find native Bangla voice if available
    const voices = synthRef.current.getVoices();
    const bnVoice = voices.find(v => v.lang.includes("bn-BD") || v.lang.includes("bn-IN"));
    if (bnVoice) {
      utterance.voice = bnVoice;
    }
    
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Toggle voice recognition
  const toggleListening = () => {
    stopSpeaking();
    if (status === "listening") {
      recognition?.stop();
    } else {
      setErrorMessage("");
      try {
        recognition?.start();
      } catch (e) {
        // In case recognition is already running
        recognition?.stop();
        setTimeout(() => recognition?.start(), 100);
      }
    }
  };

  // Ask AI endpoint
  const askAI = async (query: string, alreadyAppended = false) => {
    setStatus("processing");
    setErrorMessage("");
    
    let currentHistory = chatHistory;
    if (!alreadyAppended) {
      currentHistory = [...chatHistory, { sender: "user", text: query }];
      setChatHistory(currentHistory);
    }
    
    // Pass the last 6 messages as chat history context (excluding the active query)
    const historyPayload = currentHistory.slice(0, -1).slice(-6);
    
    try {
      const res = await fetch("/api/assistant.php?action=ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query,
          history: historyPayload
        })
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        setChatHistory((prev) => [...prev, { sender: "ai", text: data.response }]);
        setStatus("speaking");
        speakText(data.response);
      } else {
        setErrorMessage(data.message || "দুঃখিত, এআই সার্ভার থেকে কোনো উত্তর পাওয়া যায়নি।");
        setStatus("idle");
      }
    } catch (e) {
      setErrorMessage("ইন্টারনেট সংযোগ বিচ্ছিন্ন। দয়া করে কানেকশন চেক করুন।");
      setStatus("idle");
    }
  };

  // Text submit handler
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || status === "processing") return;
    
    const query = inputText.trim();
    setInputText("");
    askAI(query, false);
  };

  // Sample questions click handler
  const handleSampleClick = (question: string) => {
    stopSpeaking();
    setChatHistory((prev) => [...prev, { sender: "user", text: question }]);
    askAI(question, true);
  };

  // Status message in Bangla
  const getStatusMessage = () => {
    switch (status) {
      case "listening":
        return "আপনার প্রশ্ন শুনছি... কথা বলা শেষ হলে থামুন";
      case "processing":
        return "আপনার প্রশ্ন বিশ্লেষণ করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন";
      case "speaking":
        return "উত্তর প্রদান করা হচ্ছে...";
      default:
        return "কথা বলতে গোলকের ওপর ক্লিক করুন";
    }
  };

  const sampleQuestions = [
    "অ্যারোস্টোন প্রজেক্টটি কী এবং এটি কীভাবে কাজ করে?",
    "এই ব্লকের উপাদানসমূহ ও মিক্স রেশিও কী?",
    "ফটোক্যাটালাইসিস কেমিক্যাল রিঅ্যাকশন সম্পর্কে বলুন।",
    "অ্যারোস্টোন ব্লক কতটুকু দূষণ কমাতে পারে?",
    "এরকম সায়েন্টিফিক ব্লক ব্যবহারে কী খরচ বাড়বে?"
  ];

  return (
    <div 
      className="min-h-screen flex flex-col aurora-bg select-none"
      style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
    >
      {/* Background Aurora Orbs */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />

      {/* Header Overlay */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 rounded-none border-t-0 border-x-0 border-b bg-white/70 shadow-sm backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/admin" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> কন্ট্রোল প্যানেল
          </a>
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 icon-container-glow">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-sm font-extrabold text-slate-800 tracking-wide">অ্যারোস্টোন এআই ভয়েস অ্যাসিস্ট্যান্ট</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">AeroStone Interactive System</div>
            </div>
          </div>

          {/* Sound Mute Toggle */}
          <button 
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (nextMuted) {
                stopSpeaking();
                if (status === "speaking") setStatus("idle");
              }
            }}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isMuted 
                ? "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100" 
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
            title={isMuted ? "শব্দ সচল করুন" : "শব্দ বন্ধ করুন"}
          >
            {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left: Concentric Rotating Holographic Voice Orb & Wave */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6 py-4">
          
          <div className={`holo-orb-container ${status}`}>
            {/* Concentric outer rotating rings */}
            <div className="holo-ring-outer" />
            <div className="holo-ring-middle" />
            <div className="holo-ring-inner" />
            
            {/* Main pulsing core button */}
            <button
              onClick={toggleListening}
              disabled={status === "processing"}
              className="holo-core-orb"
            >
              <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100 transition-transform hover:scale-105">
                {status === "listening" ? (
                  <Mic className="w-9 h-9 text-rose-500 animate-pulse" />
                ) : status === "speaking" ? (
                  <Headphones className="w-9 h-9 text-emerald-600 animate-bounce" />
                ) : (
                  <Mic className="w-9 h-9 text-emerald-600" />
                )}
              </div>
            </button>
          </div>

          {/* Prompt Message and status */}
          <div className="text-center space-y-1">
            <div className="text-sm font-extrabold text-slate-800 tracking-wide">{getStatusMessage()}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {status === "listening" ? "Listening..." : status === "processing" ? "Processing..." : status === "speaking" ? "Speaking..." : "Tap to Ask"}
            </div>
          </div>

          {/* Interactive Fluid Audio Wave */}
          <div className={`audio-wave-container ${status === "listening" ? "listening" : ""} ${status === "speaking" ? "speaking" : ""}`}>
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "6px" }} />
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "12px" }} />
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "8px" }} />
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "14px" }} />
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "10px" }} />
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "12px" }} />
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "6px" }} />
            <div className="audio-wave-bar" style={{ height: status !== "idle" && status !== "processing" ? undefined : "8px" }} />
          </div>

          {/* Speech error indicator */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-rose-500 max-w-sm text-center shadow-sm">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right: Dialogue Box Chat Feed and Preset Questions */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
          
          {/* Conversation chat-container */}
          <div className="chat-container glass-panel bg-white/80 border-white/40 shadow-xl">
            {/* Header of Feed */}
            <div className="chat-feed-header">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-800">অ্যাসিস্ট্যান্ট কথোপকথন ফিড</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AeroStone Dialogue History</div>
              </div>
            </div>

            {/* Scrollable feed */}
            <div className="chat-feed scrollbar-thin">
              {chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-bubble ${msg.sender === "user" ? "user" : "ai"}`}
                >
                  {msg.sender === "user" ? (
                    <div className="flex items-start gap-2.5">
                      <span className="flex-grow">{msg.text}</span>
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black text-white shrink-0 mt-0.5">
                        ME
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span>{msg.text}</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Bottom Keyboard Text Input Bar */}
            <form onSubmit={handleTextSubmit} className="chat-input-container bg-white/95">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="এখানে বাংলায় আপনার প্রশ্নটি লিখুন..."
                disabled={status === "processing"}
                className="chat-input border-slate-200/80 bg-slate-50/50"
              />
              <button
                type="submit"
                disabled={status === "processing" || !inputText.trim()}
                className="chat-send-btn shadow-md shadow-emerald-500/25"
                title="বার্তা পাঠান"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>

          {/* Preset Sample Questions */}
          <div className="glass-panel p-6 bg-white/80 shadow-lg border-emerald-500/10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <HelpCircle className="w-4.5 h-4.5 text-emerald-500" /> সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              মাইক্রোফোনের পাশাপাশি সরাসরি নিচের প্রশ্নগুলোতে ক্লিক করেও আপনি এআই অ্যাসিস্ট্যান্টের সাহায্য নিতে পারেন:
            </p>

            <div className="flex flex-col gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleClick(q)}
                  disabled={status === "processing"}
                  className="w-full text-left p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/40 hover:border-emerald-300 transition-all flex items-center justify-between cursor-pointer preset-capsule"
                >
                  <span>{q}</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-300 hover:text-emerald-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* Footer Info */}
      <footer className="py-6 text-center text-[10px] text-slate-400 font-bold border-t border-slate-200/50 bg-white/50 backdrop-blur-sm relative z-10">
        © 2026 অ্যারোস্টোন সায়েন্স ফেয়ার অ্যাসিস্ট্যান্ট • যশোর পলিটেকনিক ইনস্টিটিউট
      </footer>

    </div>
  );
}
