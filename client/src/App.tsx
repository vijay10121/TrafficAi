import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  FullSimulationState,
  IntersectionId,
  ControlMode,
  TrafficDemandMode,
} from './types';
import { Header } from './components/Header';
import { ControlToolbar } from './components/ControlToolbar';
import { CorridorVisualizer } from './components/CorridorVisualizer';
import { IntersectionInspector } from './components/IntersectionInspector';
import { CoordinationChainFlow } from './components/CoordinationChainFlow';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PredictionVsActualPanel } from './components/PredictionVsActualPanel';
import { Sparkles, Radio } from 'lucide-react';

interface MetricPoint {
  time: string;
  avgQueue: number;
  avgWait: number;
  predicted: number;
  actualArrivals: number;
  priorityScore: number;
}

export function App() {
  const [simulationState, setSimulationState] = useState<FullSimulationState | null>(null);
  const [selectedIntersection, setSelectedIntersection] = useState<IntersectionId>('B');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const lastHistorySampleRef = useRef<number>(0);

  useEffect(() => {
    // Connect to Socket.IO backend
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to Traffic Coordination Engine');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from engine');
      setIsConnected(false);
    });

    socket.on('simulation:update', (state: FullSimulationState) => {
      setSimulationState(state);

      // Sample every 2 seconds for analytics charts
      const now = Date.now();
      if (now - lastHistorySampleRef.current >= 2000) {
        lastHistorySampleRef.current = now;
        const timeLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        // Compute actual arrivals and active priority score from authoritative state
        let totalActualArrivals = 0;
        for (const linkKey in state.transitLinks) {
          totalActualArrivals += state.transitLinks[linkKey as 'TRANSIT_AB' | 'TRANSIT_BC' | 'TRANSIT_CD']?.actuallyArrived || 0;
        }

        const bNorth = state.intersections.B?.approaches?.North;
        const currentScore = bNorth ? bNorth.trafficPriorityScore : 0;

        setMetricsHistory((prev) => {
          const next = [
            ...prev,
            {
              time: timeLabel,
              avgQueue: state.systemStatus.averageQueue,
              avgWait: state.systemStatus.averageWaitingTime,
              predicted: state.systemStatus.predictedIncomingTraffic,
              actualArrivals: totalActualArrivals,
              priorityScore: currentScore,
            },
          ];
          return next.slice(-30);
        });
      }
    });

    // Fallback initial HTTP fetch
    fetch('http://localhost:3001/api/status')
      .then((res) => res.json())
      .then((data) => setSimulationState(data))
      .catch((err) => console.warn('Initial fetch waiting for socket...', err));

    return () => {
      socket.disconnect();
    };
  }, []);

  // Controls
  const handleStart = () => {
    socketRef.current?.emit('control:start');
  };

  const handlePause = () => {
    socketRef.current?.emit('control:pause');
  };

  const handleReset = () => {
    socketRef.current?.emit('control:reset');
    setMetricsHistory([]);
  };

  const handleSetControlMode = (mode: ControlMode) => {
    socketRef.current?.emit('control:mode', mode);
  };

  const handleSetDemandMode = (mode: TrafficDemandMode) => {
    socketRef.current?.emit('control:demand', mode);
  };

  const handleSetSpeed = (speed: number) => {
    socketRef.current?.emit('control:speed', speed);
  };

  const handleTriggerPlatoon = () => {
    socketRef.current?.emit('control:platoon');
  };

  const handleTriggerDemo = () => {
    socketRef.current?.emit('control:demo');
  };

  if (!simulationState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="relative w-16 h-16 mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-cyan-400">
            A→B
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          Connecting to Intelligent Traffic Signal Coordination Server...
        </h2>
        <p className="text-sm text-slate-400 max-w-md text-center">
          Initializing in-memory coordination engine, approach sensors, and transit link messaging.
        </p>
      </div>
    );
  }

  const selectedData = simulationState.intersections[selectedIntersection];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-white">
      {/* Real-time System Status Header */}
      <Header status={simulationState.systemStatus} isConnected={isConnected} />

      {/* Control Toolbar */}
      <ControlToolbar
        isRunning={simulationState.systemStatus.isRunning}
        controlMode={simulationState.systemStatus.controlMode}
        demandMode={simulationState.systemStatus.trafficDemandMode}
        simulationSpeed={simulationState.systemStatus.simulationSpeed}
        isDemoMode={simulationState.systemStatus.isDemoMode}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onSetControlMode={handleSetControlMode}
        onSetDemandMode={handleSetDemandMode}
        onSetSpeed={handleSetSpeed}
        onTriggerPlatoon={handleTriggerPlatoon}
        onTriggerDemo={handleTriggerDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 flex flex-col gap-5 max-w-[1700px] w-full mx-auto">
        {/* Coordination Chain Pipeline Banner */}
        <CoordinationChainFlow />

        {/* DEMO MODE LIVE STATUS BANNER (Requirement 9) */}
        {simulationState.systemStatus.isDemoMode && (
          <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-slate-900 border border-cyan-500/60 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <span>DETERMINISTIC DEMO SCENARIO ACTIVE (A → B → C → D)</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {simulationState.systemStatus.demoPhaseText}
                </div>
              </div>
            </div>
            <div className="text-right text-xs font-mono text-cyan-300 hidden md:block">
              Continuous Live Coordination
            </div>
          </div>
        )}

        {/* Core Layout: Left Corridor Visualizer, Right Detail Inspector & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Corridor Visualizer (A -> B -> C -> D) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-4">
            <CorridorVisualizer
              simulationState={simulationState}
              selectedIntersection={selectedIntersection}
              onSelectIntersection={(id) => setSelectedIntersection(id)}
            />

            {/* PREDICTION VS ACTUAL PANEL (Requirement 6) */}
            <PredictionVsActualPanel
              selectedNode={selectedIntersection}
              simulationState={simulationState}
            />
          </div>

          {/* RIGHT: Detail Inspector + Performance Charts */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-5">
            {/* Selected Intersection Details */}
            {selectedData && (
              <IntersectionInspector
                selectedId={selectedIntersection}
                onSelectId={(id) => setSelectedIntersection(id)}
                intersectionData={selectedData}
              />
            )}

            {/* Performance Charts & Measured Comparison */}
            <AnalyticsCharts
              history={metricsHistory}
              status={simulationState.systemStatus}
            />
          </div>
        </div>

        {/* Footer Technical Note */}
        <footer className="mt-4 border-t border-slate-800/80 pt-4 pb-8 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>
              Intelligent Traffic Signal Coordination System • 100% Closed-Loop Ground Truth Engine
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Formula: Priority = 0.40 × (Queue/30) + 0.30 × (Wait/60s) + 0.30 × (Predicted/30) (0–100)
          </div>
        </footer>
      </main>
    </div>
  );
}
export default App;
