"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleManager = void 0;
let nextVehicleId = 1000;
class VehicleManager {
    vehicles = [];
    completedCount = 0;
    totalDepartures = 0;
    cumulativeStops = 0;
    spawnCooldowns = {};
    // Vehicle colors for rich UI
    colors = [
        '#38bdf8', // sky-400
        '#34d399', // emerald-400
        '#fbbf24', // amber-400
        '#f87171', // red-400
        '#a78bfa', // purple-400
        '#ec4899', // pink-400
        '#f97316', // orange-400
        '#22d3ee', // cyan-400
    ];
    constructor() { }
    /**
     * Spawns new vehicles according to traffic demand mode
     */
    generateTraffic(dt, demandMode, now) {
        // Interval factors based on demand
        let corridorInterval = 3.5; // seconds per vehicle at A_North
        let crossInterval = 5.0; // seconds per vehicle at cross streets
        if (demandMode === 'RUSH') {
            corridorInterval = 1.6;
            crossInterval = 3.2;
        }
        else if (demandMode === 'HEAVY') {
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
        const intersections = ['A', 'B', 'C', 'D'];
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
    checkAndSpawn(key, interval, dt, spawnFn) {
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
    spawnPlatoonAtA(count = 12) {
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
    createVehicle(params) {
        const vehicle = {
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
    getIntersectionMetrics(intersectionId) {
        const metrics = {
            North: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
            South: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
            East: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
            West: { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 },
        };
        const approachVehicles = this.vehicles.filter((v) => v.currentIntersection === intersectionId && v.state !== 'COMPLETED');
        for (const dir of ['North', 'South', 'East', 'West']) {
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
    reset() {
        this.vehicles = [];
        this.completedCount = 0;
        this.totalDepartures = 0;
        this.cumulativeStops = 0;
        this.spawnCooldowns = {};
    }
}
exports.VehicleManager = VehicleManager;
