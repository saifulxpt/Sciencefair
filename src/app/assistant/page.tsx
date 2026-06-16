"use client";
/************************************************************************
 * AeroStone World-Class Bangla AI Voice Assistant
 * Incorporates a real-time Web Audio API Canvas Visualizer
 * that reacts to microphone input and features Siri-style animated waves
 * during voice reply playbacks.
 * Designed with a premium glassmorphic visual language and aurora gradients.
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

const sampleQuestions = [
  "এ্যারোস্টোন প্রজেক্টটি কী এবং এটি কীভাবে কাজ করে?",
  "এই ব্লকের উপাদানসমূহ ও মিক্স রেশিও কী?",
  "ফটোক্যাটালাইসিস কেমিক্যাল রিঅ্যাকশন সম্পর্কে বলুন।",
  "এ্যারোস্টোন ব্লক কতটুকু দূষণ কমাতে পারে?",
  "এরকম সায়েন্টিফিক ব্লক ব্যবহারে কী খরচ বাড়বে?"
];

export default function VoiceAssistant() {
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Canvas & Web Audio references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize Welcome Message, Speech Recognition & Synthesis on mount
  useEffect(() => {
    setChatHistory([
      {
        sender: "ai",
        text: "আসসালামু আলাইকুম! আমি Air Purifying Concrete Block প্রজেক্টের এআই ভয়েস অ্যাসিস্ট্যান্ট। এই পরিবেশবান্ধব প্রজেক্ট সম্পর্কে যেকোনো বৈজ্ঞানিক তথ্য বা প্রশ্ন জানার জন্য গোলকের ওপর ক্লিক করে কথা বলুন অথবা নিচে টাইপ করুন."
      }
    ]);

    if (typeof window !== "undefined") {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = "bn-BD";
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

      synthRef.current = window.speechSynthesis;
    }

    return () => {
      stopSpeaking();
      stopAudioVisualizer();
    };
  }, []);

  // Web Audio Visualizer Setup & Loop trigger
  useEffect(() => {
    if (status === "listening") {
      startMicVisualizer();
    } else {
      stopAudioVisualizer();
      renderCanvasLoop(status);
    }
    return () => stopAudioVisualizer();
  }, [status]);

  // Scroll to bottom of conversation feed
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Start Web Audio API visualizer using microphone data
  const startMicVisualizer = async () => {
    stopAudioVisualizer();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      renderCanvasLoop("listening");
    } catch (e) {
      console.warn("Microphone access failed for visualizer, falling back to simulation:", e);
      renderCanvasLoop("listening", true);
    }
  };

  // Stop visualizer and clear audio contexts
  const stopAudioVisualizer = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Main Canvas Rendering Engine
  const renderCanvasLoop = (currentStatus: AssistantStatus, simulateListening = false) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    let phase = 0;

    const draw = () => {
      if (!canvasRef.current || !ctx) return;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      ctx.clearRect(0, 0, w, h);

      if (currentStatus === "listening") {
        if (analyserRef.current && !simulateListening) {
          // Real Mic Frequencies
          const analyser = analyserRef.current;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          const barWidth = (w / bufferLength) * 1.5;
          let x = 0;

          // Draw neon glowing frequency bars mirrored
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * h * 0.85 + 2;

            const gradient = ctx.createLinearGradient(0, h, 0, 0);
            gradient.addColorStop(0, "rgba(37, 99, 235, 0.15)");
            gradient.addColorStop(0.5, "rgba(37, 99, 235, 0.7)");
            gradient.addColorStop(1, "rgba(14, 165, 233, 0.95)");

            ctx.fillStyle = gradient;
            ctx.shadowColor = "rgba(37, 99, 235, 0.4)";
            ctx.shadowBlur = 8;

            const drawY = h / 2 - barHeight / 2;
            ctx.beginPath();
            ctx.roundRect(x, drawY, barWidth - 3, barHeight, 4);
            ctx.fill();

            x += barWidth;
          }
        } else {
          // Simulated Mic Waves
          phase += 0.15;
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(37, 99, 235, 0.75)";
          ctx.shadowColor = "rgba(37, 99, 235, 0.5)";
          ctx.shadowBlur = 10;

          for (let x = 0; x < w; x++) {
            const amplitude = 15 + Math.sin(phase * 0.2) * 10;
            const y = h / 2 + Math.sin(x * 0.05 + phase) * amplitude;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } 
      else if (currentStatus === "speaking") {
        // Siri-Style fluid multi-sine-waves
        phase += 0.2;
        ctx.shadowBlur = 4;

        const waves = [
          { amp: 22, freq: 0.015, color: "rgba(37, 99, 235, 0.65)", speed: 0.07 },
          { amp: 16, freq: 0.025, color: "rgba(14, 165, 233, 0.65)", speed: -0.04 },
          { amp: 10, freq: 0.035, color: "rgba(139, 92, 246, 0.5)", speed: 0.09 }
        ];

        waves.forEach((wave) => {
          ctx.beginPath();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = wave.color;
          ctx.shadowColor = wave.color;

          for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin(x * wave.freq + phase * wave.speed) * wave.amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      } 
      else if (currentStatus === "processing") {
        // Sweeping light beams or particles
        phase += 0.08;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "rgba(139, 92, 246, 0.65)";
        ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 2.5;

        const count = 4;
        const maxRadius = Math.min(w, h) * 0.35;
        const center = w / 2;

        for (let i = 0; i < count; i++) {
          const t = ((phase + i / count) % 1);
          const radius = t * maxRadius;
          ctx.beginPath();
          ctx.arc(center, h / 2, radius, 0, Math.PI * 2);
          ctx.globalAlpha = 1 - t;
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      } 
      else {
        // Idle calming flat-breathing center line
        phase += 0.03;
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(37, 99, 235, 0.35)";
        ctx.shadowColor = "rgba(37, 99, 235, 0.2)";
        ctx.shadowBlur = 6;

        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.01 + phase) * 2.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Keep animation looping
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  // Speak text output
  const speakText = (text: string) => {
    stopSpeaking();
    if (isMuted || !synthRef.current || !voiceEnabled) return;
    
    const cleanedText = text.replace(/[*#_\-`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = "bn-BD";
    
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
        recognition?.stop();
        setTimeout(() => recognition?.start(), 100);
      }
    }
  };

  // Query API endpoint
  const askAI = async (query: string, alreadyAppended = false) => {
    setStatus("processing");
    setErrorMessage("");
    
    let currentHistory = chatHistory;
    if (!alreadyAppended) {
      currentHistory = [...chatHistory, { sender: "user", text: query }];
      setChatHistory(currentHistory);
    }
    
    const historyPayload = currentHistory.slice(0, -1).slice(-6);
    
    try {
      const res = await fetch("/api/assistant/ask", {
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
        if (voiceEnabled && !isMuted) {
          setStatus("speaking");
          speakText(data.response);
        } else {
          setStatus("idle");
        }
      } else {
        setErrorMessage(data.message || "দুঃখিত, এআই সার্ভার থেকে কোনো উত্তর পাওয়া যায়নি।");
        setStatus("idle");
      }
    } catch (e) {
      setErrorMessage("ইন্টারনেট সংযোগ বিচ্ছিন্ন। দয়া করে কানেকশন চেক করুন।");
      setStatus("idle");
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || status === "processing") return;
    
    const query = inputText.trim();
    setInputText("");
    askAI(query, false);
  };

  const handleSampleClick = (question: string) => {
    stopSpeaking();
    setChatHistory((prev) => [...prev, { sender: "user", text: question }]);
    askAI(question, true);
  };

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

  return (
    <div 
      className="min-h-screen flex flex-col aurora-bg select-none"
      style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
    >
      {/* Background Aurora Orbs */}
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />

      {/* Header */}
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
              <div className="text-sm font-extrabold text-slate-800 tracking-wide">Air Purifying Concrete Block AI</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Air Purifying Concrete Block</div>
            </div>
          </div>

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

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left: Holographic Core & Real-time Canvas Wave */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-8 py-4">
          
          {/* Concentric rotating elements */}
          <div className={`holo-orb-container ${status}`}>
            <div className="holo-ring-outer" />
            <div className="holo-ring-middle" />
            <div className="holo-ring-inner" />
            
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

          <div className="text-center space-y-1.5">
            <div className="text-sm font-extrabold text-slate-800 tracking-wide">{getStatusMessage()}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {status === "listening" ? "Listening..." : status === "processing" ? "Processing..." : status === "speaking" ? "Speaking..." : "Tap Core to Ask"}
            </div>
          </div>

          {/* HTML5 Canvas visualizer container */}
          <div className="canvas-visualizer-container w-full max-w-sm">
            <canvas ref={canvasRef} className="canvas-visualizer" />
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-rose-500 max-w-sm text-center shadow-sm">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right: Dialogue Box Chat Feed */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-center">
          
          <div className="chat-container glass-panel bg-white/80 border-white/40 shadow-xl">
            <div className="chat-feed-header flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-800">অ্যাসিস্ট্যান্ট কথোপকথন ফিড</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Air Purifying Concrete Block Dialogue History</div>
                </div>
              </div>
              
              {/* Voice Readout Toggle Switch */}
              <div className="flex items-center gap-2 bg-slate-100/60 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/50 transition-all shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ভয়েস রিডআউট</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !voiceEnabled;
                    setVoiceEnabled(nextVal);
                    if (!nextVal) {
                      stopSpeaking();
                      if (status === "speaking") setStatus("idle");
                    }
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center`}
                  style={{ backgroundColor: voiceEnabled ? '#2563eb' : '#cbd5e1' }}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform duration-200 ease-in-out ${
                      voiceEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

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

          {/* Preset Questions */}
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

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-slate-400 font-bold border-t border-slate-200/50 bg-white/50 backdrop-blur-sm relative z-10">
        © 2026 Air Purifying Concrete Block • যশোর পলিটেকনিক ইনস্টিটিউট
      </footer>

    </div>
  );
}
