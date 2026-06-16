"use client";

import React, { useState } from "react";
import Simulation from "@/components/Simulation";
import Calculator from "@/components/Calculator";
import { 
  Wind, 
  Layers, 
  Settings, 
  FileText, 
  Activity, 
  TrendingDown, 
  Compass, 
  Award,
  BookOpen,
  MapPin,
  ChevronRight,
  Droplet
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 rounded-none border-t-0 border-x-0 bg-slate-950/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center bg-glow-primary">
              <Layers className="w-5.5 h-5.5 text-slate-950" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-glow-primary" style={{ color: 'var(--color-primary)' }}>
                AEROSTONE
              </span>
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                Science Fair 2026
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="#overview" className="hover:text-emerald-400 transition-colors">Overview</a>
            <a href="#simulation" className="hover:text-emerald-400 transition-colors">Molecular Simulation</a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">Impact Calculator</a>
            <a href="#specifications" className="hover:text-emerald-400 transition-colors">Technical Specs</a>
          </nav>

          <div>
            <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-glow-primary">
              Project active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-8 space-y-12">
        
        {/* Section 1: Hero Banner */}
        <section id="overview" className="glass-panel p-8 md:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
          
          <div className="space-y-6 flex-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-xs text-emerald-400 font-semibold">
              <Award className="w-3.5 h-3.5" /> High School Science Fair Project Showcase
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-slate-100">
              Photocatalytic <br/>
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                Air-Purifying
              </span> Concrete Block
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
              Dhaka ranks among the most polluted cities in the world, with toxic vehicle emission gases (NOx) posing grave health risks. 
              <strong> AeroStone</strong> is an innovative, cost-effective construction block embedded with 
              Anatase Titanium Dioxide (TiO₂) nanoparticles that degrades airborne nitrogen oxides into safe nitrates using sunlight.
            </p>

            <div className="flex gap-4 flex-wrap pt-2">
              <a href="#simulation" className="btn-primary">
                <Activity className="w-4 h-4" /> Live Simulation
              </a>
              <a href="#calculator" className="btn-secondary">
                <Compass className="w-4 h-4" /> Run Calculations
              </a>
            </div>
          </div>

          <div className="flex-1 w-full max-w-[420px] lg:max-w-none relative z-10 grid grid-cols-2 gap-4">
            
            <div className="bg-slate-950/70 border border-white/5 p-5 rounded-2xl space-y-2">
              <div className="text-emerald-400 text-2xl font-black">Up to 85%</div>
              <div className="text-xs font-bold text-slate-200">NOx Reduction</div>
              <p className="text-[10px] text-slate-500">Observed under simulated peak solar UV index inside a closed test reactor.</p>
            </div>

            <div className="bg-slate-950/70 border border-white/5 p-5 rounded-2xl space-y-2">
              <div className="text-sky-400 text-2xl font-black">100% Passive</div>
              <div className="text-xs font-bold text-slate-200">Eco-Friendly</div>
              <p className="text-[10px] text-slate-500">Requires no power grid, battery, or chemical consumables. Driven strictly by sunlight.</p>
            </div>

            <div className="bg-slate-950/70 border border-white/5 p-5 rounded-2xl space-y-2">
              <div className="text-amber-400 text-2xl font-black">TiO₂ Anatase</div>
              <div className="text-xs font-bold text-slate-200">Photocatalyst</div>
              <p className="text-[10px] text-slate-500">Nano-powder mix (5-7% dry weight cement) cures securely without washing off.</p>
            </div>

            <div className="bg-slate-950/70 border border-white/5 p-5 rounded-2xl space-y-2">
              <div className="text-purple-400 text-2xl font-black">Wash & Rain</div>
              <div className="text-xs font-bold text-slate-200">Self-Cleaning</div>
              <p className="text-[10px] text-slate-500">Nitrates are stored safely on the surface and wash away during precipitation.</p>
            </div>

          </div>
        </section>

        {/* Section 2: Molecular Simulation */}
        <section id="simulation" className="space-y-4">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
            <h2 className="text-lg font-extrabold uppercase tracking-widest text-slate-300">
              Photocatalysis Chemistry
            </h2>
          </div>
          <Simulation />
        </section>

        {/* Section 3: Impact Calculator */}
        <section id="calculator" className="space-y-4">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-6 bg-emerald-500 rounded-full"></span>
            <h2 className="text-lg font-extrabold uppercase tracking-widest text-slate-300">
              Environmental Impact Calculator
            </h2>
          </div>
          <Calculator />
        </section>

        {/* Section 4: Technical Specs & Fabrication */}
        <section id="specifications" className="grid-cols-2-responsive">
          
          {/* Concrete Mix & Composition */}
          <div className="glass-panel p-6 md:p-8" style={{ border: '1px solid var(--border-card)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-200">Mix Design & Specs</h3>
                <p className="text-xs text-slate-500">Detailed chemical mix ratio of AeroStone block.</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                The concrete blocks utilize standard aggregate binding with a custom additive layer of Titanium Dioxide (TiO₂) 
                in the anatase crystalline structure to guarantee photocatalytic activity.
              </p>

              {/* Ratios Table */}
              <div className="bg-slate-950/60 rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/50">
                      <th className="p-3 font-bold text-slate-300">Material</th>
                      <th className="p-3 font-bold text-slate-300">Ratio %</th>
                      <th className="p-3 font-bold text-slate-300">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-400">
                    <tr>
                      <td className="p-3 font-bold text-slate-200">Portland Cement</td>
                      <td className="p-3">15.0%</td>
                      <td className="p-3">Base hydraulic binder</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-200">Fine Aggregate (Sand)</td>
                      <td className="p-3">30.0%</td>
                      <td className="p-3">Ensures micro-structural stability</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-200">Coarse Aggregate (Gravel)</td>
                      <td className="p-3">45.0%</td>
                      <td className="p-3">Core structural block load support</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-400">TiO₂ (Anatase Nano)</td>
                      <td className="p-3 font-bold text-emerald-400">1.0% (Total Weight)</td>
                      <td className="p-3 text-emerald-400/90 font-medium">Catalyst agent (5-7% of Cement)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-200">Water / Admixture</td>
                      <td className="p-3">9.0%</td>
                      <td className="p-3">Hydration & flow enhancement</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-3.5 bg-slate-900/30 border border-white/5 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Compressive Strength</span>
                  <span className="text-sm font-bold text-slate-300">22.5 MPa (28 Days)</span>
                </div>
                <div className="p-3.5 bg-slate-900/30 border border-white/5 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">TiO₂ Particle Size</span>
                  <span className="text-sm font-bold text-slate-300">~25nm (Anatase Phase)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fabrication Steps & Lab Results */}
          <div className="glass-panel p-6 md:p-8" style={{ border: '1px solid var(--border-card)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-200">Fabrication & Testing</h3>
                <p className="text-xs text-slate-500">Methodology and real-world science fair validation.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-400">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">1</div>
                  <p className="leading-relaxed">
                    <strong>Mechanical Mixing:</strong> Aggregates, cement, and Anatase TiO₂ nanoparticles are thoroughly dry-mixed to prevent catalyst clumping before introducing water.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">2</div>
                  <p className="leading-relaxed">
                    <strong>Vibratory Compaction:</strong> The mixture is placed in block molds and compressed using a vibratory compaction table to eliminate air voids and secure catalyst encapsulation.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">3</div>
                  <p className="leading-relaxed">
                    <strong>Curing & Activation:</strong> The blocks undergo a 28-day water curing process. Post-curing, the block surface is lightly washed with weak acid to expose the TiO₂ nanoparticles.
                  </p>
                </div>
              </div>

              {/* Lab verification banner */}
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 flex gap-3 mt-4">
                <Droplet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">Exhibition Laboratory Results:</p>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    We tested the AeroStone block inside a custom 50L acrylic chamber using a simulated gas input (800 ppb NO₂). 
                    Under a 150W UV bulb, the concentration dropped below 150 ppb (Good air quality limit) in just <strong>35 minutes</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="glass-panel mt-12 px-6 py-8 rounded-none border-b-0 border-x-0 bg-slate-950/90 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <p className="text-sm font-black tracking-wider text-slate-200">
              AEROSTONE PROJECT
            </p>
            <p className="text-[11px] text-slate-500">
              Developing Sustainable Environmental Infrastructure Solutions.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            &copy; 2026 Science Fair Division. Competent with Confidence.
          </div>
        </div>
      </footer>

    </div>
  );
}
