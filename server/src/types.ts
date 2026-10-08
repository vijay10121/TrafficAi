export type Direction = 'North' | 'South' | 'East' | 'West';

export type SignalState = 'RED' | 'YELLOW' | 'GREEN';

export type VehicleState = 'MOVING' | 'WAITING' | 'CROSSING' | 'COMPLETED';

export type IntersectionId = 'A' | 'B' | 'C' | 'D';

export type TransitLinkId = 'TRANSIT_AB' | 'TRANSIT_BC' | 'TRANSIT_CD';

export type TrafficDemandMode = 'NORMAL' | 'RUSH' | 'HEAVY';

export type ControlMode = 'FIXED' | 'INTELLIGENT';

export interface Vehicle {
  id: string;
  origin: string; // e.g. 'A_North', 'B_West'
  destination: string; // e.g. 'Corridor_Exit', 'C_East'
  currentIntersection: IntersectionId | TransitLinkId;
  direction: Direction; // current heading
  speed: number; // current speed in m/s (0 to 12 m/s)
  maxSpeed: number; // target max speed (10-12 m/s)
  state: VehicleState;
  waitingTime: number; // total cumulative seconds waiting
  currentWaitTime: number; // current stop seconds
  stopCount: number; // times stopped
  progress: number; // 0.0 to 1.0 along current road segment
  distanceAlongRoad: number; // meters along current segment
  roadLength: number; // total meters of current segment
  lane: number;
  color: string;
  vehicleType: 'car' | 'bus' | 'truck' | 'emergency';
  departureTimeFromUpstream?: number;
  targetIntersection?: IntersectionId;
  createdAt?: number;
  completedAt?: number;
}

export interface DecisionExplanation {
  action: 'GRANT GREEN' | 'EXTEND GREEN' | 'HOLD RED';
  priorityScore: number;
  recommendedGreen: number;
  queueLevel: 'HIGH' | 'MODERATE' | 'LOW';
  waitingLevel: 'HIGH' | 'MODERATE' | 'LOW';
  predictedLevel: 'HIGH' | 'MODERATE' | 'LOW';
  summaryText: string;
}

export interface ApproachState {
  direction: Direction;
  queue: number; // actual count of waiting vehicles
  waitingTime: number; // average waiting time of queued vehicles in seconds
  maxWaitingTime: number; // maximum waiting time among queued vehicles
  vehicleCount: number; // total vehicles on this approach (waiting + moving)
  arrivalRate: number; // vehicles per minute arriving
  departureRate: number; // vehicles per minute departing
  predictedArrivingVehicles: number; // predicted from upstream message
  trafficPriorityScore: number; // 0 to 100
  scoreBreakdown: {
    queueComponent: number; // max 40
    waitingComponent: number; // max 30
    predictedComponent: number; // max 30
  };
  normalizedValues: {
    queueNorm: number; // 0 to 1
    waitingNorm: number; // 0 to 1
    predictedNorm: number; // 0 to 1
  };
  signalState: SignalState;
  greenDuration: number; // seconds
  remainingSignalTime: number; // countdown in seconds
  recommendedGreen: number; // dynamic continuous recommendation
  decisionReason: string;
  decisionExplanation: DecisionExplanation;
  lastServedTime: number; // timestamp when last turned green (for starvation prevention)
}

export interface TrafficFlowMessage {
  id: string;
  sourceIntersection: IntersectionId;
  targetIntersection: IntersectionId;
  direction: Direction;
  vehiclesInTransit: number;
  recentFlowRate: number; // vehicles per min departed in last 30s
  estimatedTravelTime: number; // seconds until platoon reaches target
  predictedArrivals: number; // predicted within 20s window
  timestamp: number;
}

export interface TransitLinkState {
  id: TransitLinkId;
  source: IntersectionId;
  target: IntersectionId;
  length: number; // meters (e.g. 240m)
  vehiclesInTransit: number;
  averageSpeed: number;
  estimatedTravelTime: number;
  predictedArrivals: number;
  actuallyArrived: number; // vehicles that traversed this link and physically entered downstream node
  recentDepartures: number; // departures in last 20s
  lastFlowMessage: TrafficFlowMessage;
}

export interface IntersectionData {
  id: IntersectionId;
  name: string;
  activeDirection: Direction;
  signalPhase: SignalState;
  phaseElapsed: number;
  phaseDuration: number;
  approaches: Record<Direction, ApproachState>;
  totalServedVehicles: number;
  currentCycleTime: number;
  upstreamMessageReceived?: TrafficFlowMessage;
}

export interface SystemStatus {
  activeVehicles: number;
  vehiclesInTransit: number;
  averageQueue: number;
  averageWaitingTime: number;
  predictedIncomingTraffic: number;
  currentCongestedIntersections: string[];
  vehiclesCompleted: number;
  totalVehicleDepartures: number;
  totalStops: number; // measured cumulative stop count
  systemThroughputPerMin: number;
  simulationTime: number; // seconds elapsed
  trafficDemandMode: TrafficDemandMode;
  controlMode: ControlMode;
  isRunning: boolean;
  simulationSpeed: number; // 1x, 2x, etc.
  isDemoMode: boolean;
  demoPhaseText?: string;
}

export interface FullSimulationState {
  intersections: Record<IntersectionId, IntersectionData>;
  transitLinks: Record<TransitLinkId, TransitLinkState>;
  vehicles: Vehicle[];
  flowMessages: TrafficFlowMessage[];
  systemStatus: SystemStatus;
}
