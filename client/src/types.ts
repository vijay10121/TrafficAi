export type Direction = 'North' | 'South' | 'East' | 'West';

export type SignalState = 'RED' | 'YELLOW' | 'GREEN';

export type VehicleState = 'MOVING' | 'WAITING' | 'CROSSING' | 'COMPLETED';

export type IntersectionId = 'A' | 'B' | 'C' | 'D';

export type TransitLinkId = 'TRANSIT_AB' | 'TRANSIT_BC' | 'TRANSIT_CD';

export type TrafficDemandMode = 'NORMAL' | 'RUSH' | 'HEAVY';

export type ControlMode = 'FIXED' | 'INTELLIGENT';

export interface Vehicle {
  id: string;
  origin: string;
  destination: string;
  currentIntersection: IntersectionId | TransitLinkId;
  direction: Direction;
  speed: number;
  maxSpeed: number;
  state: VehicleState;
  waitingTime: number;
  currentWaitTime: number;
  stopCount: number;
  progress: number;
  distanceAlongRoad: number;
  roadLength: number;
  lane: number;
  color: string;
  vehicleType: 'car' | 'bus' | 'truck' | 'emergency';
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
  queue: number;
  waitingTime: number;
  maxWaitingTime: number;
  vehicleCount: number;
  arrivalRate: number;
  departureRate: number;
  predictedArrivingVehicles: number;
  trafficPriorityScore: number;
  scoreBreakdown: {
    queueComponent: number;
    waitingComponent: number;
    predictedComponent: number;
  };
  normalizedValues: {
    queueNorm: number;
    waitingNorm: number;
    predictedNorm: number;
  };
  signalState: SignalState;
  greenDuration: number;
  remainingSignalTime: number;
  recommendedGreen: number;
  decisionReason: string;
  decisionExplanation: DecisionExplanation;
  lastServedTime: number;
}

export interface TrafficFlowMessage {
  id: string;
  sourceIntersection: IntersectionId;
  targetIntersection: IntersectionId;
  direction: Direction;
  vehiclesInTransit: number;
  recentFlowRate: number;
  estimatedTravelTime: number;
  predictedArrivals: number;
  timestamp: number;
}

export interface TransitLinkState {
  id: TransitLinkId;
  source: IntersectionId;
  target: IntersectionId;
  length: number;
  vehiclesInTransit: number;
  averageSpeed: number;
  estimatedTravelTime: number;
  predictedArrivals: number;
  actuallyArrived: number;
  recentDepartures: number;
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
  totalStops: number;
  systemThroughputPerMin: number;
  simulationTime: number;
  trafficDemandMode: TrafficDemandMode;
  controlMode: ControlMode;
  isRunning: boolean;
  simulationSpeed: number;
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
