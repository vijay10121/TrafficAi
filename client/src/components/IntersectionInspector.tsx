import React, { useState } from 'react';
import {
  IntersectionId,
  IntersectionData,
  Direction,
  SignalState,
} from '../types';
import {
  Clock,
  ShieldCheck,
  Zap,
  Info,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface IntersectionInspectorProps {
  selectedId: IntersectionId;
  onSelectId: (id: IntersectionId) => void;
  intersectionData: IntersectionData;
}

const DIRECTIONS: Direction[] = ['North', 'South', 'East', 'West'];

export const IntersectionInspector: React.FC<IntersectionInspectorProps> = ({
  selectedId,
  onSelectId,
  intersectionData,
}) => {
  const { approaches, activeDirection, signalPhase } = intersectionData;
  const [inspectedDirection, setInspectedDirection] = useState<Direction>(activeDirection);

  const currentDir = inspectedDirection || activeDirection;
  const approach = approaches[currentDir] || approaches['North'];
  const activeApproach = approaches[activeDirection] || approaches['North'];

  const getPriorityTier = (score: number): 'HIGH' | 'MEDIUM' | 'LOW' => {
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  };

  const priorityTier = getPriorityTier(approach.trafficPriorityScore);

  const getSignalBadge = (state: SignalState) => {
    switch (state) {
      case 'GREEN':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 glow-green inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GREEN
          </span>
        );
      case 'YELLOW':
        return (
          <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-amber inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            YELLOW
          </span>
        );
      case 'RED':
      default:
        return (
          <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            RED
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col gap-5">
      {/* Node Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Node:
          </span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            {(['A', 'B', 'C', 'D'] as IntersectionId[]).map((id) => (
              <button
                key={id}
                onClick={() => {
                  onSelectId(id);
                  setInspectedDirection('North');
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedId === id
                    ? 'bg-cyan-600 text-white shadow-md glow-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Intersection {id}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black text-white uppercase tracking-wider">
            INTERSECTION {selectedId}
          </span>
          <span className="block text-[11px] text-cyan-400 font-mono">
            {intersectionData.name}
          </span>
        </div>
      </div>

      {/* LIVE DECISION PANEL: 4 DIRECTIONS (Exact prompt format) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            LIVE DECISION PANEL — INTERSECTION {selectedId}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Click direction to inspect formula
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DIRECTIONS.map((dir) => {
            const app = approaches[dir];
            const isActive = activeDirection === dir;
            const isSelectedDir = currentDir === dir;

            return (
              <div
                key={dir}
                onClick={() => setInspectedDirection(dir)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelectedDir
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md glow-cyan'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-400 animate-ping' : isSelectedDir ? 'bg-cyan-400' : 'bg-slate-600'
                      }`}
                    />
                    {dir.toUpperCase()}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Queue:</span>
                    <strong className="text-amber-300 font-mono">{app.queue}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Waiting:</span>
                    <strong className="text-rose-300 font-mono">{app.waitingTime}s</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Predicted:</span>
                    <strong className="text-cyan-300 font-mono">{app.predictedArrivingVehicles}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                    <span className="text-slate-300 font-semibold">Priority:</span>
                    <strong className="text-cyan-400 font-mono text-sm">{app.trafficPriorityScore}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIGNAL STATUS STRIP: Current Signal, Green Remaining, Recommended Green */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
        {/* Current Signal */}
        <div className="flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Current Signal
          </span>
          <div className="mt-2 flex items-center gap-3">
            <div>{getSignalBadge(signalPhase)}</div>
            <span className="text-xs font-medium text-slate-300">
              Serving: <strong className="text-cyan-300">{activeDirection}</strong>
            </span>
          </div>
        </div>

        {/* Green Remaining */}
        <div className="flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Green Remaining</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-300">
              {activeApproach.remainingSignalTime ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">sec</span>
          </div>
        </div>

        {/* Recommended Green */}
        <div className="flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Recommended Green</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {activeApproach.recommendedGreen ?? 10}
            </span>
            <span className="text-xs text-slate-400 font-mono">sec (continuous)</span>
          </div>
        </div>
      </div>

      {/* PRIORITY EXPLANATION FOR CURRENTLY SELECTED DIRECTION (Most important for judges) */}
      <div className="bg-slate-950/90 border border-cyan-800/80 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              PRIORITY EXPLANATION — {selectedId} {currentDir.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Selected Direction: <strong className="text-cyan-300">{currentDir}</strong>
          </span>
        </div>

        {/* TRAFFIC PRIORITY SCORE BREAKDOWN */}
        <div className="mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
            TRAFFIC PRIORITY SCORE
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Queue contribution</span>
              <span className="text-base font-bold font-mono text-amber-300 mt-0.5 block">
                {approach.scoreBreakdown.queueComponent} / 40
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Queue: {approach.queue} veh
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Waiting contribution</span>
              <span className="text-base font-bold font-mono text-rose-300 mt-0.5 block">
                {approach.scoreBreakdown.waitingComponent} / 30
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Wait: {approach.waitingTime}s
              </span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Predicted-arrival contribution</span>
              <span className="text-base font-bold font-mono text-cyan-300 mt-0.5 block">
                {approach.scoreBreakdown.predictedComponent} / 30
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Predicted: {approach.predictedArrivingVehicles} veh
              </span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-cyan-800 flex flex-col justify-between">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block">Total</span>
              <div className="text-xl font-black font-mono text-cyan-300 mt-0.5">
                {approach.trafficPriorityScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Normalized Sum</span>
            </div>
          </div>
        </div>

        {/* SIGNAL DECISION */}
        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
            SIGNAL DECISION
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            {/* Priority Tier */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Priority:</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  priorityTier === 'HIGH'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : priorityTier === 'MEDIUM'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {priorityTier}
                </span>
                <span className="text-xs font-mono text-slate-400">({approach.trafficPriorityScore}/100)</span>
              </div>
            </div>

            {/* Green Duration */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Green:</span>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
                {approach.recommendedGreen} <span className="text-xs font-normal text-slate-400">seconds</span>
              </div>
            </div>

            {/* Action State */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Controller Action:</span>
              <div className="text-sm font-bold text-white mt-1">
                {approach.signalState === 'GREEN' ? 'SERVING GREEN' : currentDir === activeDirection ? 'ACTIVE PHASE' : 'HOLD RED'}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Reason: Queue + Waiting Time + Predicted Arriving Vehicles
            </span>
            <div className="text-xs font-medium text-slate-200 leading-relaxed font-mono">
              Queue: <strong className="text-amber-300">{approach.queue} veh</strong> ({approach.scoreBreakdown.queueComponent}/40) +
              Waiting Time: <strong className="text-rose-300">{approach.waitingTime}s</strong> ({approach.scoreBreakdown.waitingComponent}/30) +
              Predicted: <strong className="text-cyan-300">{approach.predictedArrivingVehicles} veh</strong> ({approach.scoreBreakdown.predictedComponent}/30)
              <div className="mt-1 text-slate-400 text-[11px] not-italic">
                Evaluated Action: {approach.decisionReason}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
