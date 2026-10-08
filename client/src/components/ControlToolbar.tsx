import React from 'react';
import { ControlMode, TrafficDemandMode } from '../types';
import { Play, Pause, RotateCcw, Waves, Gauge, Cpu, Sliders, Zap, Sparkles } from 'lucide-react';

interface ControlToolbarProps {
  isRunning: boolean;
  controlMode: ControlMode;
  demandMode: TrafficDemandMode;
  simulationSpeed: number;
  isDemoMode: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetControlMode: (mode: ControlMode) => void;
  onSetDemandMode: (mode: TrafficDemandMode) => void;
  onSetSpeed: (speed: number) => void;
  onTriggerPlatoon: () => void;
  onTriggerDemo: () => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  isRunning,
  controlMode,
  demandMode,
  simulationSpeed,
  isDemoMode,
  onStart,
  onPause,
  onReset,
  onSetControlMode,
  onSetDemandMode,
  onSetSpeed,
  onTriggerPlatoon,
  onTriggerDemo,
}) => {
  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Simulation Playback Controls */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
            title="Pause Simulation"
          >
            <Pause className="w-4 h-4 fill-amber-300" />
            <span>PAUSE</span>
          </button>
        ) : (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-emerald-950 active:scale-95 glow-green"
            title="Start Simulation"
          >
            <Play className="w-4 h-4 fill-emerald-300" />
            <span>START</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm font-medium transition-all active:scale-95"
          title="Reset System"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET</span>
        </button>

        {/* Speed Multiplier */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 ml-2">
          {[0.5, 1, 2, 3].map((speed) => (
            <button
              key={speed}
              onClick={() => onSetSpeed(speed)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
                simulationSpeed === speed
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Control Mode: INTELLIGENT vs FIXED */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Control Mode:
        </span>
        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => onSetControlMode('INTELLIGENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              controlMode === 'INTELLIGENT'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>INTELLIGENT</span>
            <span className="text-[10px] opacity-75 font-normal capitalize">(Priority Score)</span>
          </button>

          <button
            onClick={() => onSetControlMode('FIXED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              controlMode === 'FIXED'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>FIXED</span>
            <span className="text-[10px] opacity-75 font-normal capitalize">(Pretimed)</span>
          </button>
        </div>
      </div>

      {/* Traffic Demand Mode: NORMAL vs RUSH vs HEAVY */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          Demand:
        </span>
        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
          {(['NORMAL', 'RUSH', 'HEAVY'] as TrafficDemandMode[]).map((mode) => {
            const isSelected = demandMode === mode;
            let activeClass = 'bg-slate-700 text-white';
            if (mode === 'NORMAL') activeClass = 'bg-emerald-600 text-white';
            if (mode === 'RUSH') activeClass = 'bg-amber-600 text-white';
            if (mode === 'HEAVY') activeClass = 'bg-rose-600 text-white';

            return (
              <button
                key={mode}
                onClick={() => onSetDemandMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  isSelected ? `${activeClass} shadow-md` : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* DEMO MODE BUTTON (Requirement 9) & Platoon Trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTriggerDemo}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-xl shadow-lg border transition-all active:scale-95 ${
            isDemoMode
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-cyan-950 glow-cyan animate-pulse'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/40 shadow-emerald-950/60'
          }`}
          title="Start Deterministic Demo Mode: Dispatches wave from A and demonstrates full A -> B -> C -> D prediction & signal adjustments in real time"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isDemoMode ? 'DEMO RUNNING' : 'DEMO MODE'}</span>
        </button>

        <button
          onClick={onTriggerPlatoon}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl transition-all active:scale-95"
          title="Inject an upstream wave of 14 vehicles at Node A"
        >
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span>BURST WAVE</span>
        </button>
      </div>
    </div>
  );
};
