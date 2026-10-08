import React from 'react';
import { SystemStatus } from '../types';
import { Activity, Car, Clock, Zap, AlertTriangle, CheckCircle2, Radio, Octagon } from 'lucide-react';

interface HeaderProps {
  status: SystemStatus;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ status, isConnected }) => {
  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Branding & Exact Title / Subtitle */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-950/60 border border-cyan-400/40">
            <Radio className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                INTELLIGENT TRAFFIC SIGNAL COORDINATION
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                CORRIDOR A → B → C → D
              </span>
            </div>
            <p className="text-xs text-cyan-200/90 font-medium mt-0.5 tracking-wide">
              Using current and predicted traffic to coordinate connected intersections
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1 font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isConnected ? 'Telemetry Active (10 Hz)' : 'Disconnected'}
              </span>
              <span>•</span>
              <span>Clock: <strong className="text-slate-200">{formatTime(status.simulationTime)}</strong></span>
              <span>•</span>
              <span>Mode: <strong className={status.controlMode === 'INTELLIGENT' ? 'text-cyan-400' : 'text-amber-400'}>{status.controlMode}</strong></span>
            </div>
          </div>
        </div>

        {/* Real-time System Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 w-full lg:w-auto">
          {/* Active Vehicles */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>Active Vehicles</span>
              <Car className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-sky-300 font-mono mt-1">
              {status.activeVehicles ?? 0}
            </div>
          </div>

          {/* Average Queue */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>Average Queue</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono mt-1">
              {status.averageQueue ?? 0} <span className="text-xs font-normal text-slate-400">veh</span>
            </div>
          </div>

          {/* Average Waiting Time */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>Average Waiting Time</span>
              <Clock className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-300 font-mono mt-1">
              {status.averageWaitingTime ?? 0} <span className="text-xs font-normal text-slate-400">s</span>
            </div>
          </div>

          {/* Predicted Incoming Vehicles */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>Predicted Incoming Vehicles</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-300 font-mono mt-1">
              {status.predictedIncomingTraffic ?? 0} <span className="text-xs font-normal text-slate-400">veh</span>
            </div>
          </div>

          {/* Total Stops */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>Total Stops</span>
              <Octagon className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl font-bold text-orange-300 font-mono mt-1">
              {status.totalStops ?? 0}
            </div>
          </div>

          {/* Vehicles Completed */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>Vehicles Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-300 font-mono mt-1">
              {status.vehiclesCompleted ?? 0}
            </div>
          </div>

          {/* Congested Intersections */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
              <span>Congested Intersections</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${status.currentCongestedIntersections?.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div className="text-sm font-bold mt-1 truncate">
              {status.currentCongestedIntersections?.length > 0 ? (
                <span className="text-rose-400">{status.currentCongestedIntersections.join(', ')}</span>
              ) : (
                <span className="text-emerald-400 font-normal">Nominal Flow</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
