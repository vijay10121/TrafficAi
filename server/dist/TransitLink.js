"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransitLink = void 0;
class TransitLink {
    id;
    source;
    target;
    length = 240; // meters between intersections
    recentDepartures = 0; // count of departures into link in last 20s
    actuallyArrivedCount = 0; // cumulative vehicles that traversed and physically entered downstream node
    departureTimestamps = [];
    constructor(id, source, target, length = 240) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.length = length;
    }
    recordDeparture(now) {
        this.departureTimestamps.push(now);
    }
    recordArrival() {
        this.actuallyArrivedCount++;
    }
    updateFlowMessage(now, vehiclesOnLink, sourceDepartureRate) {
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
        const message = {
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
    getState(vehiclesOnLink, lastMessage) {
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
exports.TransitLink = TransitLink;
