import {
  TransitLinkId,
  IntersectionId,
  TrafficFlowMessage,
  TransitLinkState,
  Vehicle,
} from './types';

export class TransitLink {
  public id: TransitLinkId;
  public source: IntersectionId;
  public target: IntersectionId;
  public length: number = 240; // meters between intersections

  public recentDepartures: number = 0; // count of departures into link in last 20s
  public actuallyArrivedCount: number = 0; // cumulative vehicles that traversed and physically entered downstream node
  private departureTimestamps: number[] = [];

  constructor(id: TransitLinkId, source: IntersectionId, target: IntersectionId, length: number = 240) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.length = length;
  }

  public recordDeparture(now: number): void {
    this.departureTimestamps.push(now);
  }

  public recordArrival(): void {
    this.actuallyArrivedCount++;
  }

  public updateFlowMessage(now: number, vehiclesOnLink: Vehicle[], sourceDepartureRate: number): TrafficFlowMessage {
    // Purge departure timestamps older than 20 seconds
    const cutoff = now - 20;
    this.departureTimestamps = this.departureTimestamps.filter((t) => t >= cutoff);
    this.recentDepartures = this.departureTimestamps.length;

    const inTransitCount = vehiclesOnLink.length;

    // Calculate average speed and remaining travel time
    let totalSpeed = 0;
    let totalEta = 0;

    for (const v of vehiclesOnLink) {
      const remainingDist = Math.max(0, this.length - v.distanceAlongRoad);
      const effectiveSpeed = Math.max(2, v.speed || v.maxSpeed);
      const eta = remainingDist / effectiveSpeed;
      totalSpeed += effectiveSpeed;
      totalEta += eta;
    }

    const avgSpeed = inTransitCount > 0 ? totalSpeed / inTransitCount : 12;
    const avgTravelTime = inTransitCount > 0 ? Math.round(totalEta / inTransitCount) : Math.round(this.length / 12);

    // In-transit vehicles heading toward downstream target
    // Plus expected departures from upstream recent flow rate
    // sourceDepartureRate is in vehicles/minute
    const safeRate = Number.isFinite(sourceDepartureRate) ? Math.max(0, sourceDepartureRate) : 0;
    const expectedFromFlow = Math.round((safeRate / 60) * 20);

    // Predicted arriving vehicles = vehicles currently travelling from upstream + expected flow
    const predictedArrivals = Math.max(0, inTransitCount + expectedFromFlow);

    const message: TrafficFlowMessage = {
      id: `FLOW_${this.source}_TO_${this.target}_${Math.floor(now)}`,
      sourceIntersection: this.source,
      targetIntersection: this.target,
      direction: 'South',
      vehiclesInTransit: inTransitCount,
      recentFlowRate: safeRate,
      estimatedTravelTime: avgTravelTime,
      predictedArrivals,
      timestamp: now,
    };

    return message;
  }

  public getState(vehiclesOnLink: Vehicle[], lastMessage: TrafficFlowMessage): TransitLinkState {
    const inTransitCount = vehiclesOnLink.length;
    let totalSpeed = 0;
    for (const v of vehiclesOnLink) {
      totalSpeed += v.speed || v.maxSpeed;
    }
    const avgSpeed = inTransitCount > 0 ? Math.round((totalSpeed / inTransitCount) * 10) / 10 : 12;

    return {
      id: this.id,
      source: this.source,
      target: this.target,
      length: this.length,
      vehiclesInTransit: inTransitCount,
      averageSpeed: avgSpeed,
      estimatedTravelTime: lastMessage?.estimatedTravelTime || 20,
      predictedArrivals: lastMessage?.predictedArrivals || 0,
      actuallyArrived: this.actuallyArrivedCount,
      recentDepartures: this.recentDepartures,
      lastFlowMessage: lastMessage,
    };
  }
}
