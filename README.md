# Intelligent Traffic Signal Coordination System

A fully functional prototype of an **Intelligent Traffic Signal Coordination System** built on a connected 4-intersection corridor: **A → B → C → D**.

---

## 🚦 System Architecture & Core Concept

This system is an **adaptive closed-loop decision and coordination engine** where traffic simulation serves as the ground-truth data source:

```
TRAFFIC DATA SOURCE
        ↓
INTERSECTION A
        ↓
TRAFFIC FLOW MESSAGE
        ↓
INTERSECTION B
        ↓
TRAFFIC ANALYSIS
        ↓
PREDICTION
        ↓
TRAFFIC PRIORITY SCORE
        ↓
SIGNAL DECISION
        ↓
GREEN DURATION
        ↓
VEHICLES MOVE
        ↓
NEXT INTERSECTION (C → D)
```

---

## 📐 Mathematical Formulation

### 1. Three Core Parameters
For every intersection node ($A, B, C, D$) and approach direction ($North, South, East, West$):
- **Parameter 1: Queue ($Q$)** — Real-time count of physically stopped vehicles waiting at the stop line ($speed = 0$, $state = WAITING$).
- **Parameter 2: Waiting Time ($W$)** — Cumulative average waiting time (in seconds) of queued vehicles.
- **Parameter 3: Predicted Arriving Vehicles ($P$)** — Received from upstream traffic flow messages based on in-transit platoons + rolling departure rates.

### 2. Traffic Priority Score Formula
$$\text{Traffic Priority Score} = 0.40 \times \text{Norm}(Q) + 0.30 \times \text{Norm}(W) + 0.30 \times \text{Norm}(P)$$

- **Normalized Queue Contribution** (Max 40 points):
  $$\text{Queue Component} = \min\left(1.0, \frac{Q}{20}\right) \times 40$$
- **Normalized Waiting Contribution** (Max 30 points):
  $$\text{Waiting Component} = \min\left(1.0, \frac{W}{35\text{s}}\right) \times 30$$
- **Normalized Prediction Contribution** (Max 30 points):
  $$\text{Prediction Component} = \min\left(1.0, \frac{P}{20}\right) \times 30$$
- **Final Traffic Priority Score**: $0 \le \text{Score} \le 100$.

### 3. Dynamic Green Duration
$$\text{Green Duration} = \text{MinGreen} + \left(\frac{\text{Score}}{100}\right) \times (\text{MaxGreen} - \text{MinGreen})$$
- $\text{MinGreen} = 10\text{ sec}$
- $\text{MaxGreen} = 45\text{ sec}$
- $\text{Yellow Clearance} = 3\text{ sec}$
- $\text{Starvation Safeguard}$: Directions waiting $\ge 40\text{ sec}$ receive guaranteed priority.

---

## 📡 Inter-Intersection Communication Model

When vehicles clear Intersection A heading South:
```typescript
interface TrafficFlowMessage {
  id: string;
  sourceIntersection: 'A';
  targetIntersection: 'B';
  direction: 'South';
  vehiclesInTransit: number;
  recentFlowRate: number;      // vehicles/min
  estimatedTravelTime: number; // platoon ETA in seconds
  predictedArrivals: number;   // expected within 20s window
  timestamp: number;
}
```
Downstream Intersection B receives this packet, updates its North approach prediction, adjusts its Traffic Priority Score, and proactively awards Green time to greet the oncoming platoon.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express, TypeScript, Socket.IO, tsx
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, SVG Canvas
- **State**: In-memory high-precision simulation engine (20 Hz physics, 10 Hz broadcast)

---

## 🚀 Running the System

### 1. Unified Run (Frontend + Backend)
```bash
npm run dev
```

### 2. Backend Only
```bash
cd server
npm run dev
# Running on http://localhost:3001
```

### 3. Frontend Only
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

### 4. Automated E2E Propagation Test
```bash
cd server
npx tsx test-e2e.ts
```
Verifies the complete corridor sequence:
$$\text{Spawn at A} \longrightarrow A \rightarrow B \longrightarrow B \rightarrow C \longrightarrow C \rightarrow D \longrightarrow \text{Completed}$$

---

## 🖥 User Interface Features

1. **Corridor Visualizer ($A \rightarrow B \rightarrow C \rightarrow D$)**: Real animated vehicles, signal heads with active countdowns, queue counts, and connecting link telemetry badges.
2. **Intersection Inspector**:
   - Directional Breakdown Table: `Direction | Queue | Wait | Predicted | Priority`
   - Active Signal state, Green Remaining, Recommended Green, Decision Reason
   - Exact mathematical formula breakdown bar
   - Received upstream flow packet inspector
3. **Control Center Toolbar**:
   - `START`, `PAUSE`, `RESET`
   - Demand: `NORMAL`, `RUSH`, `HEAVY`
   - Control Mode: `INTELLIGENT (Score-Driven)` vs `FIXED (Pretimed)`
   - Speed multipliers: `0.5x`, `1.0x`, `2.0x`, `3.0x`
   - `TRIGGER PLATOON FROM A` button to manually inject a wave and observe propagation.
4. **Live Analytics**: Real-time Recharts time series charting Queue, Delay, and Inflow trends.
