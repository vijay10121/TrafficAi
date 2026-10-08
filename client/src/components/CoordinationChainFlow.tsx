import React from 'react';
import { ArrowDown, CheckCircle2, ChevronRight, Cpu } from 'lucide-react';

export const CoordinationChainFlow: React.FC = () => {
  const steps = [
    { title: 'TRAFFIC DATA SOURCE', desc: 'Real simulated vehicles generated with dynamic headway' },
    { title: 'INTERSECTION A', desc: 'Measures queue, wait time & departure flow rates' },
    { title: 'TRAFFIC FLOW MESSAGE', desc: 'Broadcasts in-transit counts, velocity & timestamped ETA' },
    { title: 'INTERSECTION B', desc: 'Downstream node receives upstream packet telemetry' },
    { title: 'TRAFFIC ANALYSIS', desc: 'Evaluates local approach queues & waiting times' },
    { title: 'PREDICTION', desc: 'Computes arriving vehicles within 20s travel window' },
    { title: 'TRAFFIC PRIORITY SCORE', desc: '40% Queue + 30% Waiting Time + 30% Predicted Arrivals' },
    { title: 'SIGNAL DECISION', desc: 'Non-conflicting phase selector with starvation safeguard' },
    { title: 'GREEN DURATION', desc: 'Dynamic timing bounded between 10s min and 45s max' },
    { title: 'VEHICLES MOVE', desc: 'Coordinated green wave clears platoon smoothly' },
    { title: 'NEXT INTERSECTION (C → D)', desc: 'Downstream handoff repeats along full corridor' },
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          End-to-End Coordination Architecture Pipeline
        </span>
        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Closed-Loop Real-Time Pipeline Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-11 gap-1.5 items-stretch">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all text-center relative group"
          >
            <div>
              <div className="text-[10px] font-mono text-cyan-400 mb-0.5">
                STEP {idx + 1}
              </div>
              <div className="text-[11px] font-bold text-slate-100 uppercase tracking-tight leading-tight">
                {step.title}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-snug">
              {step.desc}
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden xl:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-cyan-500">
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
