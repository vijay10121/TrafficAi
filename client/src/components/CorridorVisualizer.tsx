import React, { useState } from 'react';
import {
  FullSimulationState,
  IntersectionId,
  TransitLinkId,
  Vehicle,
  Direction,
  SignalState,
} from '../types';

interface CorridorVisualizerProps {
  simulationState: FullSimulationState;
  selectedIntersection: IntersectionId;
  onSelectIntersection: (id: IntersectionId) => void;
}

const INTERSECTION_POSITIONS: Record<IntersectionId, { x: number; y: number; name: string }> = {
  A: { x: 380, y: 120, name: 'Node A: Gateway' },
  B: { x: 380, y: 390, name: 'Node B: Mid-Corridor' },
  C: { x: 380, y: 660, name: 'Node C: Commercial Hub' },
  D: { x: 380, y: 930, name: 'Node D: Exit Gateway' },
};

export const CorridorVisualizer: React.FC<CorridorVisualizerProps> = ({
  simulationState,
  selectedIntersection,
  onSelectIntersection,
}) => {
  const [hoveredVehicle, setHoveredVehicle] = useState<Vehicle | null>(null);

  const { intersections, transitLinks, vehicles } = simulationState;

  // Compute SVG coordinates for each vehicle
  const getVehicleCoordinates = (v: Vehicle): { x: number; y: number; angle: number } | null => {
    // 1. Vehicles on Transit links
    if (v.currentIntersection.startsWith('TRANSIT_')) {
      const linkId = v.currentIntersection as TransitLinkId;
      let startY = 160;
      let endY = 350;

      if (linkId === 'TRANSIT_AB') {
        startY = 160;
        endY = 350;
      } else if (linkId === 'TRANSIT_BC') {
        startY = 430;
        endY = 620;
      } else if (linkId === 'TRANSIT_CD') {
        startY = 700;
        endY = 890;
      }

      const p = Math.max(0, Math.min(1, v.progress));
      const laneOffset = v.lane === 1 ? 10 : -2;
      return {
        x: 380 + 16 + laneOffset,
        y: startY + p * (endY - startY),
        angle: 180, // heading South
      };
    }

    // 2. Vehicles on Intersection approaches
    const interId = v.currentIntersection as IntersectionId;
    const interPos = INTERSECTION_POSITIONS[interId];
    if (!interPos) return null;

    const cx = interPos.x;
    const cy = interPos.y;
    const p = Math.max(0, Math.min(1.1, v.progress));
    const laneOffset = v.lane === 1 ? 6 : -6;

    if (v.direction === 'North') {
      // Approaching from North, moving South
      if (p <= 0.94) {
        // Approaching stop line
        const startY = cy - 120;
        const stopY = cy - 42;
        return {
          x: cx + 16 + laneOffset,
          y: startY + (p / 0.94) * (stopY - startY),
          angle: 180,
        };
      } else {
        // Crossing intersection box
        const crossProgress = (p - 0.94) / 0.16;
        return {
          x: cx + 16 + laneOffset,
          y: cy - 42 + crossProgress * 84,
          angle: 180,
        };
      }
    } else if (v.direction === 'South') {
      // Approaching from South, moving North
      if (p <= 0.94) {
        const startY = cy + 120;
        const stopY = cy + 42;
        return {
          x: cx - 16 + laneOffset,
          y: startY - (p / 0.94) * (startY - stopY),
          angle: 0,
        };
      } else {
        const crossProgress = (p - 0.94) / 0.16;
        return {
          x: cx - 16 + laneOffset,
          y: cy + 42 - crossProgress * 84,
          angle: 0,
        };
      }
    } else if (v.direction === 'West') {
      // Approaching from West, moving East
      if (p <= 0.94) {
        const startX = cx - 150;
        const stopX = cx - 42;
        return {
          x: startX + (p / 0.94) * (stopX - startX),
          y: cy + 16 + laneOffset,
          angle: 90,
        };
      } else {
        const crossProgress = (p - 0.94) / 0.16;
        return {
          x: cx - 42 + crossProgress * 84,
          y: cy + 16 + laneOffset,
          angle: 90,
        };
      }
    } else if (v.direction === 'East') {
      // Approaching from East, moving West
      if (p <= 0.94) {
        const startX = cx + 150;
        const stopX = cx + 42;
        return {
          x: startX - (p / 0.94) * (startX - stopX),
          y: cy - 16 + laneOffset,
          angle: 270,
        };
      } else {
        const crossProgress = (p - 0.94) / 0.16;
        return {
          x: cx + 42 - crossProgress * 84,
          y: cy - 16 + laneOffset,
          angle: 270,
        };
      }
    }

    return null;
  };

  // Signal lamp color helper
  const getSignalColor = (state: SignalState) => {
    switch (state) {
      case 'GREEN':
        return '#22c55e';
      case 'YELLOW':
        return '#f59e0b';
      case 'RED':
      default:
        return '#ef4444';
    }
  };

  return (
    <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-2xl overflow-hidden flex flex-col items-center">
      {/* Title & Legend */}
      <div className="w-full flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-xs font-bold tracking-wider uppercase text-cyan-300">
            Primary Coordinated Corridor Flow: A → B → C → D
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 glow-green" /> Green Wave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 glow-amber" /> Yellow Clearance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 glow-red" /> Red Hold
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full max-w-[760px] overflow-auto max-h-[820px] rounded-xl border border-slate-800/80 bg-slate-950/80">
        <svg
          viewBox="0 0 760 1060"
          className="w-full h-auto select-none"
          style={{ minWidth: '680px' }}
        >
          {/* Definitions for Glow Filters */}
          <defs>
            <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="road-asphalt" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="link-pulse-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
            </linearGradient>
          </defs>

          {/* Background Grid Pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="1" />
          </pattern>
          <rect width="760" height="1060" fill="url(#grid)" />

          {/* PRIMARY CENTRAL CORRIDOR ROAD (Vertical Avenue) */}
          {/* Main Corridor Surface (width 80) */}
          <rect x="340" y="20" width="80" height="1020" fill="url(#road-asphalt)" rx="6" />
          {/* Road Borders */}
          <line x1="340" y1="20" x2="340" y2="1040" stroke="#475569" strokeWidth="2" strokeDasharray="6,4" />
          <line x1="420" y1="20" x2="420" y2="1040" stroke="#475569" strokeWidth="2" strokeDasharray="6,4" />
          {/* Center Median Divider */}
          <line x1="380" y1="20" x2="380" y2="1040" stroke="#eab308" strokeWidth="2" strokeDasharray="8,6" opacity="0.8" />
          {/* Lane Dashes (Southbound Right Lane) */}
          <line x1="400" y1="20" x2="400" y2="1040" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5,10" opacity="0.3" />
          {/* Lane Dashes (Northbound Left Lane) */}
          <line x1="360" y1="20" x2="360" y2="1040" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5,10" opacity="0.3" />

          {/* CONNECTING TRANSIT LINKS & TELEMETRY HUDs */}
          {[
            { id: 'TRANSIT_AB' as TransitLinkId, src: 'A', dst: 'B', y1: 160, y2: 350 },
            { id: 'TRANSIT_BC' as TransitLinkId, src: 'B', dst: 'C', y1: 430, y2: 620 },
            { id: 'TRANSIT_CD' as TransitLinkId, src: 'C', dst: 'D', y1: 700, y2: 890 },
          ].map((link) => {
            const linkData = transitLinks[link.id];
            const msg = linkData?.lastFlowMessage;
            const midY = (link.y1 + link.y2) / 2;

            return (
              <g key={link.id}>
                {/* Active flow glow along link */}
                <rect
                  x="382"
                  y={link.y1}
                  width="36"
                  height={link.y2 - link.y1}
                  fill="url(#link-pulse-grad)"
                  opacity={msg && msg.vehiclesInTransit > 0 ? 0.7 : 0.2}
                />

                {/* Animated Directional Arrows inside the southbound lane */}
                <g opacity="0.4">
                  <path
                    d={`M 395 ${link.y1 + 35} L 400 ${link.y1 + 45} L 405 ${link.y1 + 35}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M 395 ${midY} L 400 ${midY + 10} L 405 ${midY}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M 395 ${link.y2 - 35} L 400 ${link.y2 - 25} L 405 ${link.y2 - 35}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>

                {/* TELEMETRY HUD BADGE ON CONNECTING ROAD */}
                <g transform={`translate(435, ${midY - 45})`}>
                  {/* Backdrop Card */}
                  <rect
                    x="0"
                    y="0"
                    width="190"
                    height="92"
                    rx="10"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1.5"
                    className="shadow-lg"
                  />
                  {/* Header */}
                  <rect x="0" y="0" width="190" height="24" rx="10" fill="#1e293b" />
                  <rect x="0" y="14" width="190" height="10" fill="#1e293b" />
                  <circle cx="12" cy="12" r="4" fill="#06b6d4" className="animate-pulse" />
                  <text x="24" y="16" fill="#e2e8f0" fontSize="10" fontWeight="bold" letterSpacing="0.5">
                    {link.src} ─────────→ {link.dst}
                  </text>

                  {/* Telemetry Metrics */}
                  <text x="12" y="40" fill="#94a3b8" fontSize="10">
                    Vehicles in Transit:
                  </text>
                  <text x="178" y="40" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="end">
                    {linkData?.vehiclesInTransit ?? 0} vehicles
                  </text>

                  <text x="12" y="58" fill="#94a3b8" fontSize="10">
                    Predicted:
                  </text>
                  <text x="178" y="58" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="end">
                    {msg?.predictedArrivals ?? 0}
                  </text>

                  <text x="12" y="76" fill="#94a3b8" fontSize="10">
                    ETA:
                  </text>
                  <text x="178" y="76" fill="#facc15" fontSize="11" fontWeight="bold" textAnchor="end">
                    {msg?.estimatedTravelTime ?? 0} sec
                  </text>

                  {/* Flow Pulse Indicator Line */}
                  <line
                    x1="-15"
                    y1="46"
                    x2="-2"
                    y2="46"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                </g>
              </g>
            );
          })}

          {/* FOUR CONNECTED INTERSECTIONS: A, B, C, D */}
          {(['A', 'B', 'C', 'D'] as IntersectionId[]).map((id) => {
            const pos = INTERSECTION_POSITIONS[id];
            const inter = intersections[id];
            const isSelected = selectedIntersection === id;

            return (
              <g
                key={id}
                onClick={() => onSelectIntersection(id)}
                className="cursor-pointer group"
              >
                {/* Cross Street Road Surface (East-West) */}
                <rect x="180" y={pos.y - 40} width="400" height="80" fill="url(#road-asphalt)" rx="4" />
                <line x1="180" y1={pos.y - 40} x2="580" y2={pos.y - 40} stroke="#475569" strokeWidth="2" strokeDasharray="6,4" />
                <line x1="180" y1={pos.y + 40} x2="580" y2={pos.y + 40} stroke="#475569" strokeWidth="2" strokeDasharray="6,4" />
                {/* East-West Center Median */}
                <line x1="180" y1={pos.y} x2="580" y2={pos.y} stroke="#eab308" strokeWidth="2" strokeDasharray="8,6" opacity="0.8" />

                {/* Intersection Junction Box */}
                <rect
                  x={pos.x - 40}
                  y={pos.y - 40}
                  width="80"
                  height="80"
                  fill="#0b0f19"
                  stroke={isSelected ? '#06b6d4' : '#334155'}
                  strokeWidth={isSelected ? '3' : '1.5'}
                  rx="4"
                  className="transition-all"
                />

                {/* Pedestrian Zebra Crosswalks */}
                {/* North crosswalk */}
                <line x1={pos.x - 38} y1={pos.y - 38} x2={pos.x + 38} y2={pos.y - 38} stroke="#ffffff" strokeWidth="4" strokeDasharray="4,4" opacity="0.3" />
                {/* South crosswalk */}
                <line x1={pos.x - 38} y1={pos.y + 38} x2={pos.x + 38} y2={pos.y + 38} stroke="#ffffff" strokeWidth="4" strokeDasharray="4,4" opacity="0.3" />
                {/* West crosswalk */}
                <line x1={pos.x - 38} y1={pos.y - 38} x2={pos.x - 38} y2={pos.y + 38} stroke="#ffffff" strokeWidth="4" strokeDasharray="4,4" opacity="0.3" />
                {/* East crosswalk */}
                <line x1={pos.x + 38} y1={pos.y - 38} x2={pos.x + 38} y2={pos.y + 38} stroke="#ffffff" strokeWidth="4" strokeDasharray="4,4" opacity="0.3" />

                {/* STOP LINES (Solid white stop bars) */}
                {/* North approach stop bar */}
                <line x1={pos.x} y1={pos.y - 42} x2={pos.x + 38} y2={pos.y - 42} stroke="#f8fafc" strokeWidth="3" />
                {/* South approach stop bar */}
                <line x1={pos.x - 38} y1={pos.y + 42} x2={pos.x} y2={pos.y + 42} stroke="#f8fafc" strokeWidth="3" />
                {/* West approach stop bar */}
                <line x1={pos.x - 42} y1={pos.y} x2={pos.x - 42} y2={pos.y + 38} stroke="#f8fafc" strokeWidth="3" />
                {/* East approach stop bar */}
                <line x1={pos.x + 42} y1={pos.y - 38} x2={pos.x + 42} y2={pos.y} stroke="#f8fafc" strokeWidth="3" />

                {/* Node Center Label Badge */}
                <rect
                  x={pos.x - 22}
                  y={pos.y - 14}
                  width="44"
                  height="28"
                  rx="6"
                  fill={isSelected ? '#0e7490' : '#1e293b'}
                  stroke={isSelected ? '#22d3ee' : '#475569'}
                  strokeWidth="1.5"
                />
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {id}
                </text>

                {/* 4 APPROACH TRAFFIC SIGNAL HEADS */}
                {/* NORTH SIGNAL (Facing Southbound Corridor Traffic) */}
                {inter && inter.approaches && (
                  <>
                    {/* North Signal Head */}
                    <g transform={`translate(${pos.x + 44}, ${pos.y - 60})`}>
                      <rect x="0" y="0" width="22" height="36" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                      <circle
                        cx="11"
                        cy="18"
                        r="6"
                        fill={getSignalColor(inter.approaches.North.signalState)}
                        filter={`url(#glow-${inter.approaches.North.signalState.toLowerCase()})`}
                      />
                      {inter.approaches.North.signalState === 'GREEN' && (
                        <text x="11" y="22" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">
                          {inter.approaches.North.remainingSignalTime}
                        </text>
                      )}
                      {/* Queue Tag */}
                      {inter.approaches.North.queue > 0 && (
                        <g transform="translate(-25, 6)">
                          <rect x="0" y="0" width="20" height="14" rx="3" fill="#dc2626" />
                          <text x="10" y="11" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                            {inter.approaches.North.queue}
                          </text>
                        </g>
                      )}
                    </g>

                    {/* SOUTH SIGNAL */}
                    <g transform={`translate(${pos.x - 66}, ${pos.y + 24})`}>
                      <rect x="0" y="0" width="22" height="36" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                      <circle
                        cx="11"
                        cy="18"
                        r="6"
                        fill={getSignalColor(inter.approaches.South.signalState)}
                        filter={`url(#glow-${inter.approaches.South.signalState.toLowerCase()})`}
                      />
                      {inter.approaches.South.signalState === 'GREEN' && (
                        <text x="11" y="22" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">
                          {inter.approaches.South.remainingSignalTime}
                        </text>
                      )}
                      {inter.approaches.South.queue > 0 && (
                        <g transform="translate(25, 6)">
                          <rect x="0" y="0" width="20" height="14" rx="3" fill="#dc2626" />
                          <text x="10" y="11" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                            {inter.approaches.South.queue}
                          </text>
                        </g>
                      )}
                    </g>

                    {/* WEST SIGNAL (Facing Eastbound Cross Traffic) */}
                    <g transform={`translate(${pos.x - 66}, ${pos.y - 42})`}>
                      <rect x="0" y="0" width="22" height="36" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                      <circle
                        cx="11"
                        cy="18"
                        r="6"
                        fill={getSignalColor(inter.approaches.West.signalState)}
                        filter={`url(#glow-${inter.approaches.West.signalState.toLowerCase()})`}
                      />
                      {inter.approaches.West.signalState === 'GREEN' && (
                        <text x="11" y="22" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">
                          {inter.approaches.West.remainingSignalTime}
                        </text>
                      )}
                      {inter.approaches.West.queue > 0 && (
                        <g transform="translate(0, -18)">
                          <rect x="1" y="0" width="20" height="14" rx="3" fill="#dc2626" />
                          <text x="11" y="11" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                            {inter.approaches.West.queue}
                          </text>
                        </g>
                      )}
                    </g>

                    {/* EAST SIGNAL (Facing Westbound Cross Traffic) */}
                    <g transform={`translate(${pos.x + 44}, ${pos.y + 6})`}>
                      <rect x="0" y="0" width="22" height="36" rx="4" fill="#090d16" stroke="#334155" strokeWidth="1" />
                      <circle
                        cx="11"
                        cy="18"
                        r="6"
                        fill={getSignalColor(inter.approaches.East.signalState)}
                        filter={`url(#glow-${inter.approaches.East.signalState.toLowerCase()})`}
                      />
                      {inter.approaches.East.signalState === 'GREEN' && (
                        <text x="11" y="22" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">
                          {inter.approaches.East.remainingSignalTime}
                        </text>
                      )}
                      {inter.approaches.East.queue > 0 && (
                        <g transform="translate(0, 40)">
                          <rect x="1" y="0" width="20" height="14" rx="3" fill="#dc2626" />
                          <text x="11" y="11" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                            {inter.approaches.East.queue}
                          </text>
                        </g>
                      )}
                    </g>
                  </>
                )}

                {/* Left Side Info Tag: Name & Priority Score */}
                <g transform={`translate(20, ${pos.y - 20})`}>
                  <rect
                    x="0"
                    y="0"
                    width="145"
                    height="46"
                    rx="8"
                    fill={isSelected ? '#0c4a6e' : '#0f172a'}
                    stroke={isSelected ? '#0284c7' : '#1e293b'}
                    strokeWidth="1.5"
                  />
                  <text x="12" y="18" fill="#f8fafc" fontSize="11" fontWeight="bold">
                    Intersection {id}
                  </text>
                  <text x="12" y="34" fill="#94a3b8" fontSize="10">
                    Active: <strong className="text-cyan-400">{inter?.activeDirection ?? 'North'}</strong>
                  </text>
                  <text x="135" y="26" textAnchor="end" fill="#38bdf8" fontSize="12" fontWeight="bold">
                    {inter?.approaches?.[inter?.activeDirection]?.trafficPriorityScore ?? 0}
                    <tspan fontSize="8" fill="#64748b">/100</tspan>
                  </text>
                </g>
              </g>
            );
          })}

          {/* RENDER SIMULATED VEHICLES */}
          {vehicles.map((v) => {
            const coords = getVehicleCoordinates(v);
            if (!coords) return null;

            const isWaiting = v.state === 'WAITING';
            const isCrossing = v.state === 'CROSSING';

            return (
              <g
                key={v.id}
                transform={`translate(${coords.x}, ${coords.y}) rotate(${coords.angle})`}
                onMouseEnter={() => setHoveredVehicle(v)}
                onMouseLeave={() => setHoveredVehicle(null)}
                className="cursor-pointer"
              >
                {/* Vehicle Chassis */}
                <rect
                  x="-6"
                  y="-11"
                  width="12"
                  height="22"
                  rx="3.5"
                  fill={v.color || '#38bdf8'}
                  stroke={isWaiting ? '#ef4444' : isCrossing ? '#22c55e' : '#0284c7'}
                  strokeWidth="1.5"
                  filter={isWaiting ? 'url(#glow-red)' : undefined}
                />

                {/* Windshield */}
                <rect x="-4.5" y="-7" width="9" height="4" rx="1.5" fill="#0f172a" opacity="0.8" />
                {/* Rear Window */}
                <rect x="-4.5" y="4" width="9" height="3" rx="1" fill="#0f172a" opacity="0.6" />

                {/* Brake lights when waiting */}
                {isWaiting && (
                  <>
                    <circle cx="-4" cy="10" r="1.5" fill="#ef4444" />
                    <circle cx="4" cy="10" r="1.5" fill="#ef4444" />
                  </>
                )}
                {/* Headlights */}
                <circle cx="-4" cy="-10" r="1" fill="#fef08a" />
                <circle cx="4" cy="-10" r="1" fill="#fef08a" />
              </g>
            );
          })}
        </svg>

        {/* Hovered Vehicle Tooltip Overlay */}
        {hoveredVehicle && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-cyan-500/50 p-3 rounded-xl shadow-xl text-xs text-slate-200 pointer-events-none z-30">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
              <span>Vehicle {hoveredVehicle.id}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                {hoveredVehicle.vehicleType}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
              <div>State: <strong className={hoveredVehicle.state === 'WAITING' ? 'text-rose-400' : 'text-emerald-400'}>{hoveredVehicle.state}</strong></div>
              <div>Speed: <strong>{Math.round(hoveredVehicle.speed * 3.6)} km/h</strong></div>
              <div>Wait Time: <strong className="text-amber-400">{Math.round(hoveredVehicle.waitingTime)}s</strong></div>
              <div>Stops: <strong>{hoveredVehicle.stopCount}</strong></div>
              <div>Location: <strong className="text-slate-300">{hoveredVehicle.currentIntersection}</strong></div>
              <div>Heading: <strong className="text-slate-300">{hoveredVehicle.direction}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
