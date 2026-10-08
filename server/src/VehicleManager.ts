import {
  Vehicle,
  VehicleState,
  Direction,
  IntersectionId,
  TransitLinkId,
  TrafficDemandMode,
} from './types';

let nextVehicleId = 1000;

export class VehicleManager {
  public vehicles: Vehicle[] = [];
  public completedCount: number = 0;
  public totalDepartures: number = 0;
  public cumulativeStops: number = 0;

  private spawnCooldowns: Record<string, number> = {};

  // Vehicle colors for rich UI
  private colors = [
    '#38bdf8', // sky-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#f87171', // red-400
    '#a78bfa', // purple-400
    '#ec4899', // pink-400
    '#f97316', // orange-400
    '#22d3ee', // cyan-400
  ];

  constructor() {}

  /**
   * Spawns new vehicles according to traffic demand mode
   */
  public generateTraffic(dt: number, demandMode: TrafficDemandMode, now: number): void {
    // Interval factors based on demand
    let corridorInterval = 3.5; // seconds per vehicle at A_North
    let crossInterval = 5.0; // seconds per vehicle at cross streets

    if (demandMode === 'RUSH') {
      corridorInterval = 1.6;
      crossInterval = 3.2;
    } else if (demandMode === 'HEAVY') {
      corridorInterval = 0.9;
      crossInterval = 2.0;
    }

    // Spawn sources:
    // 1. Primary Corridor Entry: Intersection A, approaching from North heading South
    this.checkAndSpawn('A_North', corridorInterval, dt, () => {
      this.createVehicle({
        origin: 'A_North',
        destination: 'Corridor_Exit',
        currentIntersection: 'A',
        direction: 'North', // entering from North, heading South
        maxSpeed: 10 + Math.random() * 2,
        vehicleType: Math.random() > 0.85 ? 'bus' : Math.random() > 0.92 ? 'truck' : 'car',
      });
    });

    // 2. Cross streets at A, B, C, D (East and West approaches)
    const intersections: IntersectionId[] = ['A', 'B', 'C', 'D'];
    for (const inter of intersections) {
      // East approach
      this.checkAndSpawn(`${inter}_East`, crossInterval, dt, () => {
        this.createVehicle({
          origin: `${inter}_East`,
          destination: `${inter}_West_Exit`,
          currentIntersection: inter,
          direction: 'East',
          maxSpeed: 9 + Math.random() * 2,
          vehicleType: 'car',
        });
      });

      // West approach
      this.checkAndSpawn(`${inter}_West`, crossInterval, dt, () => {
        this.createVehicle({
          origin: `${inter}_West`,
          destination: `${inter}_East_Exit`,
          currentIntersection: inter,
          direction: 'West',
          maxSpeed: 9 + Math.random() * 2,
          vehicleType: 'car',
        });
      });

      // South approach (local opposing traffic heading North)
      this.checkAndSpawn(`${inter}_South`, crossInterval * 1.5, dt, () => {
        this.createVehicle({
          origin: `${inter}_South`,
          destination: `${inter}_North_Exit`,
          currentIntersection: inter,
          direction: 'South',
          maxSpeed: 9 + Math.random() * 2,
          vehicleType: 'car',
        });
      });
    }
  }

  private checkAndSpawn(key: string, interval: number, dt: number, spawnFn: () => void): void {
    if (!this.spawnCooldowns[key]) {
      this.spawnCooldowns[key] = Math.random() * interval;
    }
    this.spawnCooldowns[key] -= dt;
    if (this.spawnCooldowns[key] <= 0) {
      this.spawnCooldowns[key] = interval * (0.75 + Math.random() * 0.5);
      spawnFn();
    }
  }

  /**
   * Spawns a manual platoon (burst of 10-15 vehicles) at A_North to demonstrate corridor wave
   */
  public spawnPlatoonAtA(count: number = 12): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.createVehicle({
          origin: 'A_North',
          destination: 'Corridor_Exit',
          currentIntersection: 'A',
          direction: 'North',
          maxSpeed: 11,
          vehicleType: i === 0 ? 'truck' : 'car',
        });
      }, i * 350);
    }
  }

  public createVehicle(params: {
    origin: string;
    destination: string;
    currentIntersection: IntersectionId | TransitLinkId;
    direction: Direction;
    maxSpeed: number;
    vehicleType: 'car' | 'bus' | 'truck' | 'emergency';
  }): Vehicle {
    const vehicle: Vehicle = {
      id: `V${nextVehicleId++}`,
      origin: params.origin,
      destination: params.destination,
      currentIntersection: params.currentIntersection,
      direction: params.direction,
      speed: 0,
      maxSpeed: params.maxSpeed,
      state: 'MOVING',
      waitingTime: 0,
      currentWaitTime: 0,
      stopCount: 0,
      progress: 0,
      distanceAlongRoad: 0,
      roadLength: 100, // 100m for approach road
      lane: Math.random() > 0.5 ? 0 : 1,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      vehicleType: params.vehicleType,
      createdAt: Date.now() / 1000,
    };

    this.vehicles.push(vehicle);
    return vehicle;
  }

  /**
   * Collects queue and waiting time statistics for an intersection's 4 approaches
   */
  public getIntersectionMetrics(intersectionId: IntersectionId): Record<
    Direction,
    { queueCount: number; avgWait: number; maxWait: number; totalCount: number }
  > {
    const metrics: Record<
      Direction,
      { queueCount: number; avgWait: number; maxWait: number; totalCount: number }
    > = {
      North: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
      South: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
      East: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
      West: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
    };

    const approachVehicles = this.vehicles.filter(
      (v) => v.currentIntersection === intersectionId && v.state !== 'COMPLETED'
    );

    for (const dir of ['North', 'South', 'East', 'West'] as Direction[]) {
      const dirVehicles = approachVehicles.filter((v) => v.direction === dir);
      const queuedVehicles = dirVehicles.filter((v) => v.state === 'WAITING');

      metrics[dir].totalCount = dirVehicles.length;
      metrics[dir].queueCount = queuedVehicles.length;

      if (queuedVehicles.length > 0) {
        let totalWait = 0;
        let maxWait = 0;
        for (const qv of queuedVehicles) {
          totalWait += qv.waitingTime;
          if (qv.waitingTime > maxWait) {
            maxWait = qv.waitingTime;
          }
        }
        metrics[dir].avgWait = totalWait / queuedVehicles.length;
        metrics[dir].maxWait = maxWait;
      }
    }

    return metrics;
  }

  /**
   * Reset all vehicles
   */
  public reset(): void {
    this.vehicles = [];
    this.completedCount = 0;
    this.totalDepartures = 0;
    this.cumulativeStops = 0;
    this.spawnCooldowns = {};
  }
}
