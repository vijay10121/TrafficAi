"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationEngine = void 0;
const Intersection_1 = require("./Intersection");
const TransitLink_1 = require("./TransitLink");
const VehicleManager_1 = require("./VehicleManager");
class SimulationEngine {
    intersections;
    transitLinks;
    vehicleManager;
    isRunning = true;
    simulationTime = 0; // seconds
    simulationSpeed = 1.0; // multiplier (1.0x, 2.0x, etc.)
    trafficDemandMode = 'NORMAL';
    controlMode = 'INTELLIGENT';
    isDemoMode = false;
    demoPhaseText = 'Demo Mode Inactive';
    demoStartTime = 0;
    lastFlowMessages = [];
    constructor() {
        this.intersections = {
            A: new Intersection_1.Intersection('A', 'Corridor Gateway A'),
            B: new Intersection_1.Intersection('B', 'Mid-Corridor Node B'),
            C: new Intersection_1.Intersection('C', 'Commercial Hub C'),
            D: new Intersection_1.Intersection('D', 'Corridor Exit Node D'),
        };
        this.transitLinks = {
            TRANSIT_AB: new TransitLink_1.TransitLink('TRANSIT_AB', 'A', 'B', 240),
            TRANSIT_BC: new TransitLink_1.TransitLink('TRANSIT_BC', 'B', 'C', 240),
            TRANSIT_CD: new TransitLink_1.TransitLink('TRANSIT_CD', 'C', 'D', 240),
        };
        this.vehicleManager = new VehicleManager_1.VehicleManager();
    }
    setControlMode(mode) {
        this.controlMode = mode;
    }
    setTrafficDemandMode(mode) {
        this.trafficDemandMode = mode;
    }
    setSimulationSpeed(speed) {
        this.simulationSpeed = Math.max(0.25, Math.min(5.0, speed));
    }
    start() {
        this.isRunning = true;
    }
    pause() {
        this.isRunning = false;
    }
    reset() {
        this.simulationTime = 0;
        this.isDemoMode = false;
        this.demoPhaseText = 'Demo Mode Inactive';
        this.vehicleManager.reset();
        this.intersections = {
            A: new Intersection_1.Intersection('A', 'Corridor Gateway A'),
            B: new Intersection_1.Intersection('B', 'Mid-Corridor Node B'),
            C: new Intersection_1.Intersection('C', 'Commercial Hub C'),
            D: new Intersection_1.Intersection('D', 'Corridor Exit Node D'),
        };
        this.transitLinks = {
            TRANSIT_AB: new TransitLink_1.TransitLink('TRANSIT_AB', 'A', 'B', 240),
            TRANSIT_BC: new TransitLink_1.TransitLink('TRANSIT_BC', 'B', 'C', 240),
            TRANSIT_CD: new TransitLink_1.TransitLink('TRANSIT_CD', 'C', 'D', 240),
        };
        this.lastFlowMessages = [];
    }
    spawnPlatoon() {
        this.vehicleManager.spawnPlatoonAtA(14);
    }
    triggerDemoMode() {
        this.isDemoMode = true;
        this.controlMode = 'INTELLIGENT';
        this.demoStartTime = this.simulationTime;
        this.demoPhaseText = 'STAGE 1/4: High-volume platoon released from Node A heading toward B';
        this.vehicleManager.spawnPlatoonAtA(14);
    }
    /**
     * Main simulation step (called with delta seconds dt, e.g. dt = 0.05s)
     */
    update(rawDt) {
        if (!this.isRunning)
            return;
        const dt = rawDt * this.simulationSpeed;
        this.simulationTime += dt;
        const now = this.simulationTime;
        // 1. Generate incoming vehicles
        this.vehicleManager.generateTraffic(dt, this.trafficDemandMode, now);
        // 2. Physics & Vehicle Movement
        this.updateVehiclePositions(dt, now);
        // 3. Update Inter-Intersection Transit Links & Flow Messages
        this.updateCoordinationAndFlow(now);
        // 4. Update Intersection Metrics, Priority Scores, and Signal Controllers
        for (const interId of ['A', 'B', 'C', 'D']) {
            const inter = this.intersections[interId];
            const metrics = this.vehicleManager.getIntersectionMetrics(interId);
            inter.updateMetricsAndScores(now, metrics);
            inter.tick(dt, this.controlMode, now);
        }
        // 5. Update Demo Mode progression text if active
        if (this.isDemoMode) {
            this.updateDemoProgression();
        }
    }
    updateDemoProgression() {
        const vAB = this.transitLinks.TRANSIT_AB.getState([], this.lastFlowMessages[0] || {}).vehiclesInTransit;
        const vBC = this.transitLinks.TRANSIT_BC.getState([], this.lastFlowMessages[1] || {}).vehiclesInTransit;
        const vCD = this.transitLinks.TRANSIT_CD.getState([], this.lastFlowMessages[2] || {}).vehiclesInTransit;
        const bApp = this.intersections.B.approaches.North;
        const cApp = this.intersections.C.approaches.North;
        const dApp = this.intersections.D.approaches.North;
        if (vCD > 0 || dApp.queue > 0) {
            this.demoPhaseText = `STAGE 4/4: Corridor wave at Node D (${vCD} in transit). Signal: ${dApp.signalState} (Priority: ${dApp.trafficPriorityScore}/100, Green: ${dApp.recommendedGreen}s) → Clearing Corridor Exit!`;
        }
        else if (vBC > 0 || cApp.queue > 0) {
            this.demoPhaseText = `STAGE 3/4: Wave cleared Node B into Link B→C (${vBC} in transit). Node C received upstream packet (Predicted: ${cApp.predictedArrivingVehicles} veh) → Score: ${cApp.trafficPriorityScore}/100!`;
        }
        else if (vAB > 0 || bApp.queue > 0) {
            this.demoPhaseText = `STAGE 2/4: Link A→B In Transit (${vAB} veh). Node B received upstream prediction (${bApp.predictedArrivingVehicles} veh) BEFORE arrival → Priority increased to ${bApp.trafficPriorityScore}/100, Dynamic Green: ${bApp.recommendedGreen}s!`;
        }
        else if (this.simulationTime - this.demoStartTime < 8) {
            this.demoPhaseText = `STAGE 1/4: Vehicles clearing Node A into Link A→B...`;
        }
        else if (this.simulationTime - this.demoStartTime > 45) {
            this.demoPhaseText = `DEMO COMPLETE: Platoon wave successfully coordinated through all 4 intersections (A → B → C → D)!`;
        }
    }
    /**
     * Physics simulation of all vehicles
     */
    updateVehiclePositions(dt, now) {
        const activeVehicles = this.vehicleManager.vehicles.filter((v) => v.state !== 'COMPLETED');
        const segmentMap = {};
        for (const v of activeVehicles) {
            const key = `${v.currentIntersection}_${v.direction}_${v.lane}`;
            if (!segmentMap[key]) {
                segmentMap[key] = [];
            }
            segmentMap[key].push(v);
        }
        for (const key in segmentMap) {
            const roadVehicles = segmentMap[key];
            roadVehicles.sort((a, b) => b.distanceAlongRoad - a.distanceAlongRoad);
            for (let i = 0; i < roadVehicles.length; i++) {
                const vehicle = roadVehicles[i];
                const leader = i > 0 ? roadVehicles[i - 1] : null;
                if (vehicle.currentIntersection === 'A' ||
                    vehicle.currentIntersection === 'B' ||
                    vehicle.currentIntersection === 'C' ||
                    vehicle.currentIntersection === 'D') {
                    this.updateApproachVehicle(vehicle, leader, dt, now);
                }
                else {
                    this.updateTransitVehicle(vehicle, leader, dt, now);
                }
                vehicle.progress = Math.min(1.0, vehicle.distanceAlongRoad / vehicle.roadLength);
            }
        }
        // Clean up completed vehicles older than 5 seconds
        const cutoff = now - 5;
        this.vehicleManager.vehicles = this.vehicleManager.vehicles.filter((v) => {
            if (v.state === 'COMPLETED' && v.completedAt && v.completedAt < cutoff) {
                return false;
            }
            return true;
        });
    }
    /**
     * Updates a vehicle on an intersection approach
     */
    updateApproachVehicle(vehicle, leader, dt, now) {
        const inter = this.intersections[vehicle.currentIntersection];
        const signal = inter.approaches[vehicle.direction].signalState;
        const stopLine = 94; // meters
        let maxAllowedDistance = vehicle.roadLength + 20;
        if (leader) {
            maxAllowedDistance = leader.distanceAlongRoad - 6.5;
        }
        if (signal === 'RED' || signal === 'YELLOW') {
            if (vehicle.distanceAlongRoad < stopLine) {
                maxAllowedDistance = Math.min(maxAllowedDistance, stopLine);
            }
        }
        const distanceToConstraint = maxAllowedDistance - vehicle.distanceAlongRoad;
        if (distanceToConstraint <= 0.5) {
            vehicle.speed = 0;
            if (vehicle.state !== 'WAITING') {
                vehicle.state = 'WAITING';
                vehicle.stopCount++;
                this.vehicleManager.cumulativeStops++;
            }
            vehicle.waitingTime += dt;
            vehicle.currentWaitTime += dt;
        }
        else {
            let desiredSpeed = vehicle.maxSpeed;
            if (distanceToConstraint < 30) {
                desiredSpeed = Math.min(vehicle.maxSpeed, Math.sqrt(2 * 2.5 * distanceToConstraint));
            }
            if (vehicle.speed < desiredSpeed) {
                vehicle.speed = Math.min(desiredSpeed, vehicle.speed + 3.0 * dt);
            }
            else {
                vehicle.speed = Math.max(desiredSpeed, vehicle.speed - 4.5 * dt);
            }
            vehicle.distanceAlongRoad += vehicle.speed * dt;
            if (vehicle.distanceAlongRoad >= maxAllowedDistance) {
                vehicle.distanceAlongRoad = maxAllowedDistance;
            }
            if (vehicle.speed > 0.5) {
                if (vehicle.distanceAlongRoad >= stopLine) {
                    vehicle.state = 'CROSSING';
                }
                else {
                    vehicle.state = 'MOVING';
                }
            }
        }
        // Clear intersection box (distance >= 105m)
        if (vehicle.distanceAlongRoad >= 105) {
            inter.recordDeparture(vehicle.direction, now);
            this.vehicleManager.totalDepartures++;
            if (vehicle.direction === 'North') {
                if (vehicle.currentIntersection === 'A') {
                    vehicle.currentIntersection = 'TRANSIT_AB';
                    vehicle.distanceAlongRoad = 0;
                    vehicle.roadLength = 240;
                    vehicle.state = 'MOVING';
                    vehicle.speed = vehicle.maxSpeed;
                    this.transitLinks.TRANSIT_AB.recordDeparture(now);
                }
                else if (vehicle.currentIntersection === 'B') {
                    vehicle.currentIntersection = 'TRANSIT_BC';
                    vehicle.distanceAlongRoad = 0;
                    vehicle.roadLength = 240;
                    vehicle.state = 'MOVING';
                    vehicle.speed = vehicle.maxSpeed;
                    this.transitLinks.TRANSIT_BC.recordDeparture(now);
                }
                else if (vehicle.currentIntersection === 'C') {
                    vehicle.currentIntersection = 'TRANSIT_CD';
                    vehicle.distanceAlongRoad = 0;
                    vehicle.roadLength = 240;
                    vehicle.state = 'MOVING';
                    vehicle.speed = vehicle.maxSpeed;
                    this.transitLinks.TRANSIT_CD.recordDeparture(now);
                }
                else if (vehicle.currentIntersection === 'D') {
                    vehicle.state = 'COMPLETED';
                    vehicle.completedAt = now;
                    this.vehicleManager.completedCount++;
                }
            }
            else {
                vehicle.state = 'COMPLETED';
                vehicle.completedAt = now;
                this.vehicleManager.completedCount++;
            }
        }
    }
    /**
     * Updates a vehicle traveling on an inter-intersection transit link
     */
    updateTransitVehicle(vehicle, leader, dt, now) {
        if (leader) {
            const distanceToLeader = leader.distanceAlongRoad - 7.0 - vehicle.distanceAlongRoad;
            if (distanceToLeader <= 1.0) {
                vehicle.speed = leader.speed;
            }
            else {
                let desiredSpeed = vehicle.maxSpeed;
                if (distanceToLeader < 20) {
                    desiredSpeed = Math.min(vehicle.maxSpeed, leader.speed + 1);
                }
                if (vehicle.speed < desiredSpeed) {
                    vehicle.speed = Math.min(desiredSpeed, vehicle.speed + 2.5 * dt);
                }
                else {
                    vehicle.speed = Math.max(desiredSpeed, vehicle.speed - 3.5 * dt);
                }
            }
        }
        else {
            if (vehicle.speed < vehicle.maxSpeed) {
                vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + 3.0 * dt);
            }
        }
        vehicle.distanceAlongRoad += vehicle.speed * dt;
        vehicle.state = 'MOVING';
        // Reach downstream intersection
        if (vehicle.distanceAlongRoad >= vehicle.roadLength) {
            let targetInter = 'B';
            if (vehicle.currentIntersection === 'TRANSIT_AB') {
                targetInter = 'B';
                this.transitLinks.TRANSIT_AB.recordArrival();
            }
            else if (vehicle.currentIntersection === 'TRANSIT_BC') {
                targetInter = 'C';
                this.transitLinks.TRANSIT_BC.recordArrival();
            }
            else if (vehicle.currentIntersection === 'TRANSIT_CD') {
                targetInter = 'D';
                this.transitLinks.TRANSIT_CD.recordArrival();
            }
            vehicle.currentIntersection = targetInter;
            vehicle.direction = 'North';
            vehicle.distanceAlongRoad = 0;
            vehicle.roadLength = 100;
            vehicle.state = 'MOVING';
            this.intersections[targetInter].recordArrival('North', now);
        }
    }
    /**
     * Multi-intersection coordination and flow message propagation
     */
    updateCoordinationAndFlow(now) {
        const messages = [];
        // Link AB: A -> B
        const vehiclesAB = this.vehicleManager.vehicles.filter((v) => v.currentIntersection === 'TRANSIT_AB' && v.state !== 'COMPLETED');
        const flowMsgAB = this.transitLinks.TRANSIT_AB.updateFlowMessage(now, vehiclesAB, this.intersections.A.approaches.North.departureRate);
        this.intersections.B.receiveUpstreamMessage(flowMsgAB);
        messages.push(flowMsgAB);
        // Link BC: B -> C
        const vehiclesBC = this.vehicleManager.vehicles.filter((v) => v.currentIntersection === 'TRANSIT_BC' && v.state !== 'COMPLETED');
        const flowMsgBC = this.transitLinks.TRANSIT_BC.updateFlowMessage(now, vehiclesBC, this.intersections.B.approaches.North.departureRate);
        this.intersections.C.receiveUpstreamMessage(flowMsgBC);
        messages.push(flowMsgBC);
        // Link CD: C -> D
        const vehiclesCD = this.vehicleManager.vehicles.filter((v) => v.currentIntersection === 'TRANSIT_CD' && v.state !== 'COMPLETED');
        const flowMsgCD = this.transitLinks.TRANSIT_CD.updateFlowMessage(now, vehiclesCD, this.intersections.C.approaches.North.departureRate);
        this.intersections.D.receiveUpstreamMessage(flowMsgCD);
        messages.push(flowMsgCD);
        this.lastFlowMessages = messages;
    }
    /**
     * Gathers full simulation state for client broadcast
     */
    getState() {
        const activeVehicles = this.vehicleManager.vehicles.filter((v) => v.state !== 'COMPLETED');
        const waitingVehicles = activeVehicles.filter((v) => v.state === 'WAITING');
        const totalQueue = waitingVehicles.length;
        let totalWait = 0;
        for (const wv of waitingVehicles) {
            totalWait += wv.waitingTime;
        }
        const avgWait = waitingVehicles.length > 0 ? Math.round((totalWait / waitingVehicles.length) * 10) / 10 : 0;
        let totalTransit = 0;
        let totalPredicted = 0;
        for (const msg of this.lastFlowMessages) {
            totalTransit += msg.vehiclesInTransit;
            totalPredicted += msg.predictedArrivals;
        }
        const congestedIntersections = [];
        for (const id of ['A', 'B', 'C', 'D']) {
            const inter = this.intersections[id];
            let interQueue = 0;
            for (const dir in inter.approaches) {
                interQueue += inter.approaches[dir].queue;
            }
            if (interQueue >= 10) {
                congestedIntersections.push(`Node ${id} (${interQueue} queued)`);
            }
        }
        const throughput = this.simulationTime > 0 ? Math.round((this.vehicleManager.completedCount / this.simulationTime) * 60) : 0;
        const systemStatus = {
            activeVehicles: activeVehicles.length,
            vehiclesInTransit: totalTransit,
            averageQueue: Math.round((totalQueue / 4) * 10) / 10,
            averageWaitingTime: avgWait,
            predictedIncomingTraffic: totalPredicted,
            currentCongestedIntersections: congestedIntersections,
            vehiclesCompleted: this.vehicleManager.completedCount,
            totalVehicleDepartures: this.vehicleManager.totalDepartures,
            totalStops: this.vehicleManager.cumulativeStops,
            systemThroughputPerMin: throughput,
            simulationTime: Math.round(this.simulationTime * 10) / 10,
            trafficDemandMode: this.trafficDemandMode,
            controlMode: this.controlMode,
            isRunning: this.isRunning,
            simulationSpeed: this.simulationSpeed,
            isDemoMode: this.isDemoMode,
            demoPhaseText: this.demoPhaseText,
        };
        const linkStates = {
            TRANSIT_AB: this.transitLinks.TRANSIT_AB.getState(this.vehicleManager.vehicles.filter((v) => v.currentIntersection === 'TRANSIT_AB' && v.state !== 'COMPLETED'), this.lastFlowMessages[0] || {}),
            TRANSIT_BC: this.transitLinks.TRANSIT_BC.getState(this.vehicleManager.vehicles.filter((v) => v.currentIntersection === 'TRANSIT_BC' && v.state !== 'COMPLETED'), this.lastFlowMessages[1] || {}),
            TRANSIT_CD: this.transitLinks.TRANSIT_CD.getState(this.vehicleManager.vehicles.filter((v) => v.currentIntersection === 'TRANSIT_CD' && v.state !== 'COMPLETED'), this.lastFlowMessages[2] || {}),
        };
        return {
            intersections: {
                A: this.intersections.A.getData(),
                B: this.intersections.B.getData(),
                C: this.intersections.C.getData(),
                D: this.intersections.D.getData(),
            },
            transitLinks: linkStates,
            vehicles: activeVehicles,
            flowMessages: this.lastFlowMessages,
            systemStatus,
        };
    }
}
exports.SimulationEngine = SimulationEngine;
