import React from 'react';
import { Flame } from 'lucide-react';

export default function MacroCard({
  title = "Energía & Macros",
  currentCalories = 1840,
  targetCalories = 2150,
  protein = 142,
  targetProtein = 150,
  carbs = 185,
  targetCarbs = 225,
  fats = 52,
  targetFats = 67,
  className = ""
}) {
  const calsRemaining = Math.max(0, targetCalories - currentCalories);
  const pctCalories = Math.min(100, Math.round((currentCalories / targetCalories) * 100));

  const pPct = Math.min(100, Math.round((protein / targetProtein) * 100));
  const cPct = Math.min(100, Math.round((carbs / targetCarbs) * 100));
  const gPct = Math.min(100, Math.round((fats / targetFats) * 100));

  // Circular ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pctCalories / 100) * circumference;

  return (
    <div className={`bg-[#111827] border border-[#1F2937] rounded-3xl p-5 flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <span className="text-[10px] font-bold text-[#00F0A8] px-2 py-0.5 rounded-full bg-[#00F0A8]/10 border border-[#00F0A8]/30">
            {pctCalories}% Meta
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{currentCalories.toLocaleString()}</span>
              <span className="text-xs text-slate-400">/ {targetCalories.toLocaleString()} kcal</span>
            </div>
            <p className="text-[11px] text-[#00F0A8] font-semibold mt-0.5">
              {calsRemaining.toLocaleString()} kcal restantes hoy
            </p>
          </div>

          {/* SVG ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-[#1F2937]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-[#00F0A8] transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-white">{pctCalories}%</span>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2 pt-1">
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-semibold">
              <span className="text-slate-400">Proteínas</span>
              <span className="text-rose-400 font-bold">{protein}g / {targetProtein}g ({pPct}%)</span>
            </div>
            <div className="h-1.5 w-full bg-[#090D14] rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${pPct}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1 font-semibold">
              <span className="text-slate-400">Carbohidratos</span>
              <span className="text-amber-400 font-bold">{carbs}g / {targetCarbs}g ({cPct}%)</span>
            </div>
            <div className="h-1.5 w-full bg-[#090D14] rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${cPct}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1 font-semibold">
              <span className="text-slate-400">Grasas</span>
              <span className="text-cyan-400 font-bold">{fats}g / {targetFats}g ({gPct}%)</span>
            </div>
            <div className="h-1.5 w-full bg-[#090D14] rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${gPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

