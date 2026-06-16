"use client";

import React, { useState, useMemo } from "react";
import { Trees, Car, Zap, RefreshCw, BarChart2, Check } from "lucide-react";

export default function Calculator() {
  const [area, setArea] = useState(150); // m2
  const [uvIndex, setUvIndex] = useState(6); // 1-11
  const [windSpeed, setWindSpeed] = useState(2.5); // m/s
  const [initialAqi, setInitialAqi] = useState(180); // AQI scale
  const [sunHours, setSunHours] = useState(8); // hours/day

  // Scientific Calculator Logic
  const stats = useMemo(() => {
    // 1. Calculate base NOx degradation rate (mg / m2 / h)
    // Photocatalytic concrete average rates: 15-35 mg/m2/h under strong solar UV (UV Index = 10)
    // We scale this linearly with UV Index.
    const baseRatePerUv = 2.5; // mg/m2/h per UV index unit
    const rawRate = baseRatePerUv * uvIndex;

    // 2. Wind Speed Adjustment Factor
    // Moderate wind increases mass transfer of pollutants to surface, but very high wind
    // reduces contact time. Let's model an optimal curve (highest efficiency around 1-3 m/s)
    let windFactor = 1.0;
    if (windSpeed < 1.0) {
      windFactor = 0.5 + windSpeed * 0.5; // less air movement = less contact
    } else {
      windFactor = Math.max(0.4, 1.2 / (0.8 + 0.4 * (windSpeed - 1))); // high wind = blows past too fast
    }

    const netRate = rawRate * windFactor; // mg/m2/h
    
    // 3. Totals
    const hourlyDegradation = netRate * area; // total mg NOx degraded per hour of sunlight
    const dailyDegradation = hourlyDegradation * sunHours; // mg per day

    // 4. Equivalence Metrics
    // - Cars: Average modern car emits ~80 mg NOx per km. Driven 20 km/day = 1600 mg NOx/day.
    const carEquivalence = dailyDegradation / 1600;

    // - Trees: A mature tree filters about 60 mg of gaseous NOx per day.
    const treeEquivalence = dailyDegradation / 60;

    // 5. Final AQI calculation (simulation)
    // Let's assume the air in the immediate boundary layer (approx 1000m3 volume per m2 area) is treated.
    // High surface area drops AQI significantly.
    const aqiReductionFactor = Math.min(0.85, (dailyDegradation / (initialAqi * 500)));
    const finalAqi = Math.max(12, Math.round(initialAqi * (1 - aqiReductionFactor)));
    
    return {
      hourlyDegradation: Math.round(hourlyDegradation),
      dailyDegradation: Math.round(dailyDegradation),
      carEquivalence: carEquivalence.toFixed(1),
      treeEquivalence: Math.round(treeEquivalence),
      finalAqi,
      aqiPercentDrop: Math.round(aqiReductionFactor * 100),
      rawRate: netRate.toFixed(2),
    };
  }, [area, uvIndex, windSpeed, initialAqi, sunHours]);

  // Generate 24h timeline data points for Custom SVG chart
  // Sun is active during middle hours (e.g. 8 AM to 4 PM)
  const chartPoints = useMemo(() => {
    const points = [];
    const peakSunHour = 12;
    
    for (let hour = 0; hour <= 24; hour += 2) {
      // Base pollution diurnal pattern (peaks at morning 8 AM and evening 6 PM commute)
      let basePollution = 100 + 40 * Math.sin((hour - 4) * Math.PI / 6);
      if (initialAqi > 100) {
        // scale base pollution curve to user's initial AQI setting
        basePollution = (initialAqi / 150) * basePollution;
      }
      
      // Calculate how much is reduced if sunlight is active
      let treated = basePollution;
      const sunStart = 12 - sunHours / 2;
      const sunEnd = 12 + sunHours / 2;
      
      if (hour >= sunStart && hour <= sunEnd) {
        // peak reduction is at noon
        const timeFactor = Math.sin((hour - sunStart) * Math.PI / (sunEnd - sunStart));
        const reduction = basePollution * (stats.aqiPercentDrop / 100) * timeFactor * 0.9;
        treated = Math.max(10, basePollution - reduction);
      }
      
      points.push({
        hour: `${hour === 12 ? "12 PM" : hour === 0 ? "12 AM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}`,
        raw: Math.round(basePollution),
        treated: Math.round(treated),
      });
    }
    return points;
  }, [initialAqi, sunHours, stats.aqiPercentDrop]);

  // SVG chart sizing helper variables
  const padding = 35;
  const chartWidth = 450;
  const chartHeight = 180;

  // Map data values to SVG coordinates
  const svgCoordinates = useMemo(() => {
    const maxVal = Math.max(...chartPoints.map(p => p.raw)) * 1.15;
    
    const rawCoords = chartPoints.map((p, i) => {
      const x = padding + (i * (chartWidth - padding * 2)) / (chartPoints.length - 1);
      const y = chartHeight - padding - ((p.raw) * (chartHeight - padding * 2)) / maxVal;
      return { x, y };
    });

    const treatedCoords = chartPoints.map((p, i) => {
      const x = padding + (i * (chartWidth - padding * 2)) / (chartPoints.length - 1);
      const y = chartHeight - padding - ((p.treated) * (chartHeight - padding * 2)) / maxVal;
      return { x, y };
    });

    return { rawCoords, treatedCoords, maxVal };
  }, [chartPoints]);

  // Path generator helper
  const makePath = (coords: {x: number, y: number}[]) => {
    if (coords.length === 0) return "";
    return `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
  };

  const aqiColors = (aqi: number) => {
    if (aqi <= 50) return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "Good" };
    if (aqi <= 100) return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", label: "Moderate" };
    if (aqi <= 150) return { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", label: "Unhealthy for Sensitive Groups" };
    if (aqi <= 200) return { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", label: "Unhealthy" };
    return { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", label: "Very Unhealthy" };
  };

  const initialAqiDetails = aqiColors(initialAqi);
  const finalAqiDetails = aqiColors(stats.finalAqi);

  return (
    <div className="glass-panel p-6 md:p-8" style={{ border: '1px solid var(--border-card)' }}>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-black text-glow-primary" style={{ color: 'var(--color-primary)' }}>
          Ecological Impact Calculator
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Adjust environmental variables to estimate nitrogen oxide (NOx) removal rates and AQI improvement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders Input Panel */}
        <div className="lg:col-span-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
            Environmental Inputs
          </h3>
          
          <div className="slider-container">
            <div className="slider-label">
              <span>Concrete Surface Area</span>
              <span className="slider-value">{area} m²</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="custom-slider"
            />
            <span className="text-[10px] text-slate-500">Total area of concrete blocks exposed to air.</span>
          </div>

          <div className="slider-container">
            <div className="slider-label">
              <span>Sunlight Hours / Day</span>
              <span className="slider-value">{sunHours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={sunHours}
              onChange={(e) => setSunHours(Number(e.target.value))}
              className="custom-slider"
            />
            <span className="text-[10px] text-slate-500">Duration of high UV sunlight availability.</span>
          </div>

          <div className="slider-container">
            <div className="slider-label">
              <span>UV Intensity (Sunlight)</span>
              <span className="slider-value">UV Index {uvIndex}</span>
            </div>
            <input
              type="range"
              min="1"
              max="11"
              value={uvIndex}
              onChange={(e) => setUvIndex(Number(e.target.value))}
              className="custom-slider"
            />
            <span className="text-[10px] text-slate-500">UV radiation strength (photocatalysis catalyst driver).</span>
          </div>

          <div className="slider-container">
            <div className="slider-label">
              <span>Ambient Wind Speed</span>
              <span className="slider-value">{windSpeed} m/s</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="custom-slider"
            />
            <span className="text-[10px] text-slate-500">
              Optimal speed (1-3 m/s) maximizes contact. High speed limits contact duration.
            </span>
          </div>

          <div className="slider-container">
            <div className="slider-label">
              <span>Initial Ambient AQI (NOx base)</span>
              <span className="slider-value">{initialAqi} AQI</span>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
              value={initialAqi}
              onChange={(e) => setInitialAqi(Number(e.target.value))}
              className="custom-slider"
            />
            <span className="text-[10px] text-slate-500">Initial air quality level prior to concrete treatment.</span>
          </div>
        </div>

        {/* Outputs Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Key Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                <Trees className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Tree Equivalent Filter
                </p>
                <p className="text-xl font-extrabold text-glow-primary text-emerald-400">
                  {stats.treeEquivalence} Mature Trees
                </p>
                <p className="text-[10px] text-slate-500">Daily pollution filtering match.</p>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400 shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Vehicle NOx Offset
                </p>
                <p className="text-xl font-extrabold text-glow-secondary text-sky-400">
                  {stats.carEquivalence} Cars / Day
                </p>
                <p className="text-[10px] text-slate-500">Offsets vehicle NOx emissions.</p>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Purification Output
                </p>
                <p className="text-xl font-extrabold text-glow-accent text-amber-400">
                  {stats.dailyDegradation.toLocaleString()} mg
                </p>
                <p className="text-[10px] text-slate-500">NOx destroyed per day.</p>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800/40 border border-white/10 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Degradation Efficiency
                </p>
                <p className="text-xl font-extrabold text-slate-200">
                  {stats.rawRate} <span className="text-xs font-semibold text-slate-400">mg/m²/h</span>
                </p>
                <p className="text-[10px] text-slate-500">Calculated kinetic rate constant.</p>
              </div>
            </div>

          </div>

          {/* AQI Improvement Summary Card */}
          <div className="bg-slate-950/80 border border-white/5 rounded-xl p-5">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/5 pb-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">Air Quality Index (AQI) Impact</p>
                <p className="text-xs text-slate-500">Estimated micro-climate local AQI drop.</p>
              </div>
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-glow-primary">
                -{stats.aqiPercentDrop}% NOx Levels
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 py-2">
              <div className="flex-1 text-center bg-slate-900/50 p-3 rounded-lg border border-white/5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Untreated Air</span>
                <span className={`block text-2xl font-black ${initialAqiDetails.text}`}>{initialAqi}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${initialAqiDetails.bg} ${initialAqiDetails.border} ${initialAqiDetails.text}`}>
                  {initialAqiDetails.label}
                </span>
              </div>
              
              <div className="text-slate-600 font-black text-lg">➜</div>

              <div className="flex-1 text-center bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Purified Air</span>
                <span className={`block text-2xl font-black ${finalAqiDetails.text}`}>{stats.finalAqi}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${finalAqiDetails.bg} ${finalAqiDetails.border} ${finalAqiDetails.text}`}>
                  {finalAqiDetails.label}
                </span>
              </div>
            </div>
          </div>

          {/* Line Chart comparing 24 hour AQI */}
          <div className="bg-slate-900/20 border border-white/5 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                24h Local AQI Curve Analysis
              </p>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span> Untreated City Air
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block"></span> Purified Concrete Zone
                </span>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="relative w-full">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                {/* Horizontal Grid lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(0,0,0,0.05)" />
                <line x1={padding} y1={(chartHeight - padding * 2) / 2 + padding} x2={chartWidth - padding} y2={(chartHeight - padding * 2) / 2 + padding} stroke="rgba(0,0,0,0.05)" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(0,0,0,0.15)" />

                {/* X Axis Labels */}
                {chartPoints.map((p, i) => {
                  if (i % 2 !== 0 && i !== chartPoints.length - 1) return null; // skip some labels for space
                  const x = padding + (i * (chartWidth - padding * 2)) / (chartPoints.length - 1);
                  return (
                    <text key={i} x={x} y={chartHeight - padding + 15} fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="semibold">
                      {p.hour}
                    </text>
                  );
                })}

                {/* Left Y Axis Label */}
                <text x={padding - 5} y={padding + 3} fill="#64748b" fontSize="8" textAnchor="end">
                  {Math.round(svgCoordinates.maxVal)}
                </text>
                <text x={padding - 5} y={chartHeight - padding} fill="#64748b" fontSize="8" textAnchor="end">
                  0
                </text>

                {/* Untreated line (Rose) */}
                <path d={makePath(svgCoordinates.rawCoords)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                {svgCoordinates.rawCoords.map((c, i) => (
                  <circle key={`raw-${i}`} cx={c.x} cy={c.y} r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                ))}

                {/* Treated line (Emerald) */}
                <path d={makePath(svgCoordinates.treatedCoords)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                {svgCoordinates.treatedCoords.map((c, i) => (
                  <circle key={`tr-${i}`} cx={c.x} cy={c.y} r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                ))}
              </svg>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Note: Sunlight filter active from 8 AM to 4 PM (simulated peak UV at 12 PM).
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
