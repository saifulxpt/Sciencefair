"use client";

import React, { useState } from "react";
import { Sun, CloudLightning, RefreshCw, HelpCircle, Wind, CheckCircle2 } from "lucide-react";

export default function Simulation() {
  const [isSunlightOn, setIsSunlightOn] = useState(true);
  const [uvIndex, setUvIndex] = useState(6);
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "1. Photon Absorption (UV Activation)",
      formula: "TiO₂ + hν → e⁻ + h⁺",
      desc: "Solar ultraviolet (UV) radiation hits the Titanium Dioxide (TiO₂) photocatalyst embedded in the concrete. The energy from the light excites electrons, pushing them from the valence band to the conduction band, leaving behind positive holes (h⁺) and free electrons (e⁻).",
    },
    {
      id: 2,
      title: "2. Radical Creation (H₂O Interaction)",
      formula: "h⁺ + H₂O → ·OH + H⁺",
      desc: "The positive holes (h⁺) are highly reactive. They split moisture (H₂O) absorbed on the concrete surface into extremely reactive Hydroxyl Radicals (·OH), which are the primary oxidizers of air pollutants.",
    },
    {
      id: 3,
      title: "3. Superoxide Creation (O₂ Interaction)",
      formula: "e⁻ + O₂ → O₂·⁻",
      desc: "Simultaneously, the excited free electrons (e⁻) react with oxygen molecules (O₂) from the air to form Superoxide Radicals (O₂·⁻). These radicals also assist in the oxidation process.",
    },
    {
      id: 4,
      title: "4. NOx Degradation & Nitrate Capture",
      formula: "NOx + ·OH / O₂·⁻ → NO₃⁻ + H₂O",
      desc: "When harmful Nitrogen Oxides (NOx - key air pollutants from car exhaust) come into contact with the concrete block, the radicals rapidly oxidize them into stable, non-toxic Nitrates (NO₃⁻) which wash away harmlessly with rain.",
    },
  ];

  return (
    <div className="glass-panel p-6 md:p-8" style={{ border: '1px solid var(--border-card)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-glow-primary" style={{ color: 'var(--color-primary)' }}>
            TiO₂ Photocatalysis Simulation
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Interactive micro-level visualization of air purification on the concrete surface.
          </p>
        </div>
        
        {/* Controls Panel */}
        <div className="flex items-center gap-4 flex-wrap bg-slate-900/50 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSunlightOn(!isSunlightOn)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                isSunlightOn 
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 text-glow-accent"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <Sun className={`w-3.5 h-3.5 ${isSunlightOn ? "animate-pulse" : ""}`} />
              {isSunlightOn ? "UV Active" : "UV Blocked"}
            </button>
          </div>
          
          {isSunlightOn && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">UV Index:</span>
              <input
                type="range"
                min="1"
                max="11"
                value={uvIndex}
                onChange={(e) => setUvIndex(Number(e.target.value))}
                className="custom-slider"
                style={{ width: "80px" }}
              />
              <span className="text-xs font-bold text-amber-400 w-4">{uvIndex}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Visual Simulation Canvas */}
        <div className="lg:col-span-7 flex flex-col justify-between items-center bg-slate-950/80 rounded-2xl border border-white/5 p-4 relative min-h-[380px] overflow-hidden">
          
          {/* Light Rays representation */}
          {isSunlightOn && (
            <div 
              className="absolute inset-x-0 top-0 h-40 pointer-events-none transition-all duration-500"
              style={{
                background: `linear-gradient(180deg, rgba(245, 158, 11, ${0.05 * uvIndex}) 0%, transparent 100%)`,
              }}
            />
          )}

          {/* Microscopic Simulation SVG */}
          <svg viewBox="0 0 500 300" className="w-full h-full max-w-[460px]">
            {/* Definitions for gradients and shadows */}
            <defs>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="blockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* UV Light Source */}
            {isSunlightOn && (
              <g id="uv-light-source">
                {/* Golden rays */}
                <circle cx="250" cy="-20" r="80" fill="url(#sunGlow)" />
                <path d="M 200,10 L 120,100" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity={uvIndex/15} />
                <path d="M 250,10 L 250,110" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity={uvIndex/15} />
                <path d="M 300,10 L 380,100" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity={uvIndex/15} />
              </g>
            )}

            {/* Concrete Block Layer */}
            <rect x="20" y="180" width="460" height="100" rx="10" fill="url(#blockGrad)" stroke="rgba(0,0,0,0.06)" />
            <text x="250" y="240" fill="rgba(15,23,42,0.12)" fontSize="16" fontWeight="900" textAnchor="middle" letterSpacing="2">
              TiO₂ EMBEDDED CONCRETE BLOCK
            </text>

            {/* Microscopic Surface Catalyst Active Dots */}
            <g id="catalyst-layer">
              <circle cx="60" cy="180" r="6" fill="#2563eb" opacity="0.6" filter={isSunlightOn ? "url(#glowGreen)" : ""} />
              <circle cx="120" cy="180" r="6" fill="#2563eb" opacity="0.6" filter={isSunlightOn ? "url(#glowGreen)" : ""} />
              <circle cx="180" cy="180" r="6" fill="#2563eb" opacity="0.6" filter={isSunlightOn ? "url(#glowGreen)" : ""} />
              <circle cx="240" cy="180" r="6" fill="#2563eb" opacity="0.6" filter={isSunlightOn ? "url(#glowGreen)" : ""} />
              <circle cx="300" cy="180" r="6" fill="#2563eb" opacity="0.6" filter={isSunlightOn ? "url(#glowGreen)" : ""} />
              <circle cx="360" cy="180" r="6" fill="#2563eb" opacity="0.6" filter={isSunlightOn ? "url(#glowGreen)" : ""} />
              <circle cx="420" cy="180" r="6" fill="#2563eb" opacity="0.6" filter={isSunlightOn ? "url(#glowGreen)" : ""} />
            </g>

            {/* Step 1: Charge Separation Animation */}
            {isSunlightOn && activeStep >= 1 && (
              <g id="step1-electrons-holes">
                {/* Electrons escaping to conduction band */}
                <circle cx="120" cy="160" r="5" fill="#0ea5e9" filter="url(#glowBlue)" className="animate-bounce" style={{ animationDelay: '0.2s' }} />
                <text x="120" y="152" fill="#0ea5e9" fontSize="8" fontWeight="bold" textAnchor="middle">e⁻</text>

                <circle cx="240" cy="155" r="5" fill="#0ea5e9" filter="url(#glowBlue)" className="animate-bounce" style={{ animationDelay: '0.5s' }} />
                <text x="240" y="147" fill="#0ea5e9" fontSize="8" fontWeight="bold" textAnchor="middle">e⁻</text>

                <circle cx="360" cy="160" r="5" fill="#0ea5e9" filter="url(#glowBlue)" className="animate-bounce" style={{ animationDelay: '0.8s' }} />
                <text x="360" y="152" fill="#0ea5e9" fontSize="8" fontWeight="bold" textAnchor="middle">e⁻</text>

                {/* Positive holes in valence band (embedded inside dots) */}
                <circle cx="120" cy="180" r="4" fill="#ef4444" />
                <text x="120" y="183" fill="#fff" fontSize="8" fontWeight="black" textAnchor="middle">h⁺</text>

                <circle cx="240" cy="180" r="4" fill="#ef4444" />
                <text x="240" y="183" fill="#fff" fontSize="8" fontWeight="black" textAnchor="middle">h⁺</text>

                <circle cx="360" cy="180" r="4" fill="#ef4444" />
                <text x="360" y="183" fill="#fff" fontSize="8" fontWeight="black" textAnchor="middle">h⁺</text>
              </g>
            )}

            {/* Step 2: H2O reaction to Hydroxyl Radical */}
            {isSunlightOn && activeStep >= 2 && (
              <g id="step2-hydroxyl">
                {/* Water particle moving to hole */}
                <path d="M 60,110 Q 75,150 120,180" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                <circle cx="60" cy="110" r="8" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x="60" y="113" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">H₂O</text>

                {/* Hydroxyl radical forming */}
                <circle cx="145" cy="140" r="10" fill="#2563eb" filter="url(#glowGreen)" />
                <text x="145" y="143" fill="#fff" fontSize="8" fontWeight="black" textAnchor="middle">·OH</text>
                
                <path d="M 120,180 L 145,150" stroke="#2563eb" strokeWidth="1" opacity="0.6" />
              </g>
            )}

            {/* Step 3: O2 reaction to Superoxide */}
            {isSunlightOn && activeStep >= 3 && (
              <g id="step3-superoxide">
                {/* Oxygen particle interacting with conduction band electron */}
                <path d="M 300,90 Q 280,120 240,155" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                <circle cx="300" cy="90" r="8" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x="300" y="93" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">O₂</text>

                {/* Superoxide radical forming */}
                <circle cx="210" cy="130" r="10" fill="#2563eb" filter="url(#glowGreen)" />
                <text x="210" y="133" fill="#fff" fontSize="7" fontWeight="black" textAnchor="middle">O₂·⁻</text>
              </g>
            )}

            {/* Step 4: NOx Degradation and Nitrate Precipitation */}
            {activeStep >= 4 && (
              <g id="step4-nox-degradation">
                {/* Incoming NOx pollutant (dirty air) */}
                <g>
                  <circle cx="380" cy="70" r="11" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
                  <text x="380" y="73" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">NOx</text>
                  {/* Motion indicator lines */}
                  <line x1="400" y1="65" x2="415" y2="60" stroke="#64748b" strokeWidth="1" />
                  <line x1="400" y1="75" x2="415" y2="72" stroke="#64748b" strokeWidth="1" />
                </g>

                {isSunlightOn ? (
                  <>
                    {/* Interaction zone */}
                    <circle cx="350" cy="120" r="18" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.3)" strokeDasharray="2 2" />
                    
                    {/* Reaction path from NOx and Radical to Nitrates */}
                    <path d="M 380,70 L 350,120 M 360,160 L 350,120" stroke="#f59e0b" strokeWidth="1" />

                    {/* Formed Nitrate (NO3-) washing/sitting on block */}
                    <g>
                      <circle cx="330" cy="180" r="9" fill="#1e293b" stroke="#2563eb" strokeWidth="1.5" />
                      <text x="330" y="183" fill="#3b82f6" fontSize="7" fontWeight="black" textAnchor="middle">NO₃⁻</text>
                      <path d="M 330,189 L 330,205" stroke="#2563eb" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="330" y="215" fill="#64748b" fontSize="7" textAnchor="middle">Rain/Washed</text>
                    </g>
                    
                    {/* Clean air escaping */}
                    <g>
                      <circle cx="280" cy="50" r="8" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" strokeWidth="1" />
                      <text x="280" y="53" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle">Clean</text>
                      <path d="M 350,120 Q 310,80 280,50" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2 2" />
                    </g>
                  </>
                ) : (
                  <>
                    {/* No sun, NOx bounces off untreated */}
                    <path d="M 380,70 Q 320,110 260,70" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                    <circle cx="260" cy="70" r="11" fill="#78350f" stroke="#ef4444" strokeWidth="1" />
                    <text x="260" y="73" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">NOx</text>
                    <text x="320" y="130" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">No UV = Untreated</text>
                  </>
                )}
              </g>
            )}

            {/* Atmospheric Legend details if needed */}
          </svg>

          {/* Reaction Stage label overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300">
            Status: {isSunlightOn ? (
              <span className="text-emerald-400">Purification Active ({uvIndex * 8}% efficiency)</span>
            ) : (
              <span className="text-rose-400">Inactive (No sunlight / UV)</span>
            )}
          </div>
        </div>

        {/* Dynamic Chemical Reactions Explanatory Text */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Photocatalytic Reaction Process
            </h3>

            <div className="space-y-2">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    activeStep === step.id
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                      : "bg-slate-900/40 border-white/5 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-xs font-bold ${activeStep === step.id ? "text-emerald-400" : "text-slate-300"}`}>
                      {step.title}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-400/90 border border-white/5">
                      {step.formula}
                    </span>
                  </div>
                  {activeStep === step.id && (
                    <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                      {step.desc}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-200">How to use this simulation:</p>
              <p className="text-slate-400">
                Turn <span className="text-amber-400 font-bold">UV Active</span> on or off, adjust the slider to see how solar radiation speed increases electron excitement, and click the steps to view chemical actions.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
