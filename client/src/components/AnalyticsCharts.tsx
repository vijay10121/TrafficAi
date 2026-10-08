import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart2, Activity, Clock, CheckCircle2, Octagon, Zap } from 'lucide-react';
import { SystemStatus } from '../types';

export interface MetricPoint {
  time: string;
  avgQueue: number;
  avgWait: number;
  predicted: number;
  actualArrivals: number;
  priorityScore: number;
}

interface AnalyticsChartsProps {
  history: MetricPoint[];
  status: SystemStatus;
}

type ChartView = 'ALL' | 'QUEUE' | 'WAITING' | 'PREDICTED_VS_ACTUAL' | 'PRIORITY';

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  history,
  status,
}) => {
  const [activeChart, setActiveChart] = useState<ChartView>('ALL');

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col gap-4">
      {/* Header & Chart Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-Time Historical Telemetry Charts
          </span>
        </div>

        {/* Chart View Selector Buttons (Exact 4 charts from prompt) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-[11px]">
          <button
            onClick={() => setActiveChart('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeChart === 'ALL' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 4 Charts
          </button>
          <button
            onClick={() => setActiveChart('QUEUE')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeChart === 'QUEUE' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Queue
          </button>
          <button
            onClick={() => setActiveChart('WAITING')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeChart === 'WAITING' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Waiting Time
          </button>
          <button
            onClick={() => setActiveChart('PREDICTED_VS_ACTUAL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeChart === 'PREDICTED_VS_ACTUAL' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Predicted vs Actual
          </button>
          <button
            onClick={() => setActiveChart('PRIORITY')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeChart === 'PRIORITY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Priority Score
          </button>
        </div>
      </div>

      {/* Chart Display Area */}
      {history.length > 1 ? (
        <div className="space-y-4">
          {/* Chart 1: Queue Over Time */}
          {(activeChart === 'ALL' || activeChart === 'QUEUE') && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-2">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Queue Over Time (veh)
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  Current: {status.averageQueue} veh
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="avgQueue" name="Average Queue (veh)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 2: Waiting Time Over Time */}
          {(activeChart === 'ALL' || activeChart === 'WAITING') && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-rose-300 font-bold mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  Waiting Time Over Time (seconds)
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  Current: {status.averageWaitingTime}s
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="avgWait" name="Average Wait (sec)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 3: Predicted vs Actual Incoming Traffic */}
          {(activeChart === 'ALL' || activeChart === 'PREDICTED_VS_ACTUAL') && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-teal-300 font-bold mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  Predicted vs Actual Incoming Traffic (vehicles)
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  Predicted: {status.predictedIncomingTraffic} • Completed: {status.vehiclesCompleted}
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Line type="monotone" dataKey="predicted" name="Predicted Inflow (20s)" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="actualArrivals" name="Actual Cumulative Arrivals" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 4: Priority Score Over Time */}
          {(activeChart === 'ALL' || activeChart === 'PRIORITY') && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-bold mb-2">
                <span className="flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                  Priority Score Over Time (0–100)
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  Active Phase Score
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="priorityScore" name="Traffic Priority Score" stroke="#818cf8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-xs text-slate-500 font-mono bg-slate-950/50 rounded-xl border border-slate-800">
          Accumulating live historical telemetry from simulation engine...
        </div>
      )}

      {/* Real-time Measured Baseline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Queue</div>
          <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
            {status.averageQueue} veh
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Average Delay</div>
          <div className="text-base font-bold text-rose-300 font-mono mt-0.5">
            {status.averageWaitingTime}s
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Vehicle Stops</div>
          <div className="text-base font-bold text-orange-300 font-mono mt-0.5">
            {status.totalStops}
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Vehicles Cleared</div>
          <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
            {status.vehiclesCompleted}
          </div>
        </div>
      </div>
    </div>
  );
};
