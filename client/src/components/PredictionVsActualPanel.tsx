import React from 'react';
import { IntersectionId, FullSimulationState } from '../types';
import { Radio, ArrowDown, Activity, CheckCircle2, TrendingUp } from 'lucide-react';

interface PredictionVsActualPanelProps {
  selectedNode: IntersectionId;
  simulationState: FullSimulationState;
}

export const PredictionVsActualPanel: React.FC<PredictionVsActualPanelProps> = ({
  selectedNode,
  simulationState,
}) => {
  // Determine relevant upstream link for selected node
  let linkId: 'TRANSIT_AB' | 'TRANSIT_BC' | 'TRANSIT_CD' | null = null;
  let upstreamNode: 'A' | 'B' | 'C' | null = null;

  if (selectedNode === 'B') {
    linkId = 'TRANSIT_AB';
    upstreamNode = 'A';
  } else if (selectedNode === 'C') {
    linkId = 'TRANSIT_BC';
    upstreamNode = 'B';
  } else if (selectedNode === 'D') {
    linkId = 'TRANSIT_CD';
    upstreamNode = 'C';
  }

  const linkData = linkId ? simulationState.transitLinks[linkId] : null;
  const msg = linkData?.lastFlowMessage;

  // Node B is the primary corridor demonstration node specified in requirement 6
  return (
    <div className="bg-slate-950/80 border border-cyan-800/60 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Node {selectedNode} Incoming Traffic Telemetry
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Propagation Basis • No Simulated Guessing
        </span>
      </div>

      {upstreamNode && linkData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Currently Travelling */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Currently Travelling ({upstreamNode} → {selectedNode})
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-sky-300">
                {linkData.vehiclesInTransit ?? 0}
              </span>
              <span className="text-xs text-slate-400">vehicles</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              Active on transit segment
            </span>
          </div>

          {/* Predicted Next 20 sec */}
          <div className="bg-slate-900/90 border border-cyan-900/60 rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-cyan-300 uppercase tracking-wider flex items-center justify-between">
              <span>Predicted Next 20 sec</span>
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {linkData.predictedArrivals ?? 0}
              </span>
              <span className="text-xs text-slate-400">vehicles</span>
            </div>
            <span className="text-[10px] text-cyan-400/80 mt-1">
              In-transit + upstream green flow
            </span>
          </div>

          {/* Actually Arrived */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Actually Arrived</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {linkData.actuallyArrived ?? 0}
              </span>
              <span className="text-xs text-slate-400">vehicles</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1">
              Physically crossed into stop line
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
          Node A is the Gateway Entry Point. Select <strong>Intersection B, C, or D</strong> to view incoming propagation telemetry from upstream.
        </div>
      )}

      {/* Upstream communication packet metadata */}
      {upstreamNode && msg && (
        <div className="mt-3 pt-2 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
          <span>Source: <strong className="text-slate-200">Node {msg.sourceIntersection}</strong></span>
          <span>Target: <strong className="text-slate-200">Node {msg.targetIntersection}</strong></span>
          <span>Departure Rate: <strong className="text-emerald-300">{msg.recentFlowRate} veh/min</strong></span>
          <span>Platoon ETA: <strong className="text-amber-300">{msg.estimatedTravelTime}s</strong></span>
        </div>
      )}
    </div>
  );
};
