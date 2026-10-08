"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Intersection = exports.STARVATION_MAX_WAIT = exports.YELLOW_DURATION = exports.MAX_GREEN = exports.MIN_GREEN = exports.PREDICTED_REF = exports.WAITING_REF = exports.QUEUE_REF = void 0;
const DIRECTIONS = ['North', 'East', 'South', 'West'];
// Configurable normalization reference limits (as specified by user)
exports.QUEUE_REF = 30; // 30 vehicles reference limit
exports.WAITING_REF = 60; // 60 seconds reference limit
exports.PREDICTED_REF = 30; // 30 vehicles reference limit
// Continuous green bounds
exports.MIN_GREEN = 10; // 10 seconds minimum
exports.MAX_GREEN = 45; // 45 seconds maximum
exports.YELLOW_DURATION = 3; // 3 seconds yellow clearance
exports.STARVATION_MAX_WAIT = 40; // 40 seconds max wait before starvation override
function sanitize(val, min = 0, max = 100) {
    if (typeof val !== 'number' || !Number.isFinite(val) || Number.isNaN(val)) {
        return min;
    }
    return Math.max(min, Math.min(max, Math.round(val * 10) / 10));
}
function getLevel(val, highThresh, modThresh) {
    if (val >= highThresh)
        return 'HIGH';
    if (val >= modThresh)
        return 'MODERATE';
    return 'LOW';
}
class Intersection {
    id;
    name;
    activeDirection = 'North';
    signalPhase = 'GREEN';
    phaseDuration = 20; // seconds for current phase
    phaseElapsed = 0; // seconds elapsed in current phase
    totalServedVehicles = 0;
    currentCycleTime = 0;
    upstreamMessageReceived;
    approaches;
    departuresHistory = [];
    arrivalsHistory = [];
    constructor(id, name) {
        this.id = id;
        this.name = name;
        const initialApproaches = {};
        for (const dir of DIRECTIONS) {
            initialApproaches[dir] = {
                direction: dir,
                queue: 0,
                waitingTime: 0,
                maxWaitingTime: 0,
                vehicleCount: 0,
                arrivalRate: 0,
                departureRate: 0,
                predictedArrivingVehicles: 0,
                trafficPriorityScore: 0,
                scoreBreakdown: {
                    queueComponent: 0,
                    waitingComponent: 0,
                    predictedComponent: 0,
                },
                normalizedValues: {
                    queueNorm: 0,
                    waitingNorm: 0,
                    predictedNorm: 0,
                },
                signalState: dir === 'North' ? 'GREEN' : 'RED',
                greenDuration: 20,
                remainingSignalTime: 20,
                recommendedGreen: 20,
                decisionReason: 'Initial startup phase',
                decisionExplanation: {
                    action: dir === 'North' ? 'GRANT GREEN' : 'HOLD RED',
                    priorityScore: 0,
                    recommendedGreen: 20,
                    queueLevel: 'LOW',
                    waitingLevel: 'LOW',
                    predictedLevel: 'LOW',
                    summaryText: 'Initial baseline startup phase',
                },
                lastServedTime: 0,
            };
        }
        this.approaches = initialApproaches;
    }
    receiveUpstreamMessage(message) {
        this.upstreamMessageReceived = message;
        // Primary corridor feeds North approach of downstream node
        if (this.approaches['North']) {
            this.approaches['North'].predictedArrivingVehicles = sanitize(message.predictedArrivals, 0, 100);
        }
    }
    recordArrival(direction, now) {
        this.arrivalsHistory.push({ timestamp: now, direction });
    }
    recordDeparture(direction, now) {
        this.departuresHistory.push({ timestamp: now, direction });
        this.totalServedVehicles++;
    }
    updateFlowRates(now) {
        const cutoff = now - 30;
        this.arrivalsHistory = this.arrivalsHistory.filter((item) => item.timestamp >= cutoff);
        this.departuresHistory = this.departuresHistory.filter((item) => item.timestamp >= cutoff);
        for (const dir of DIRECTIONS) {
            const dirArrivals = this.arrivalsHistory.filter((item) => item.direction === dir).length;
            const dirDepartures = this.departuresHistory.filter((item) => item.direction === dir).length;
            this.approaches[dir].arrivalRate = sanitize((dirArrivals / 30) * 60, 0, 500);
            this.approaches[dir].departureRate = sanitize((dirDepartures / 30) * 60, 0, 500);
        }
    }
    /**
     * Recalculates metrics, normalization, priority score, and continuous green duration per direction
     */
    updateMetricsAndScores(now, queuesByDirection) {
        this.updateFlowRates(now);
        for (const dir of DIRECTIONS) {
            const stats = queuesByDirection[dir] || { queueCount: 0, avgWait: 0, maxWait: 0, totalCount: 0 };
            const approach = this.approaches[dir];
            approach.queue = sanitize(stats.queueCount, 0, 100);
            approach.waitingTime = sanitize(stats.avgWait, 0, 300);
            approach.maxWaitingTime = sanitize(stats.maxWait, 0, 300);
            approach.vehicleCount = sanitize(stats.totalCount, 0, 100);
            // 1. Parameter Normalization (between 0 and 1) with configurable reference limits
            const queueNorm = Math.min(1.0, Math.max(0, approach.queue / exports.QUEUE_REF));
            const waitingNorm = Math.min(1.0, Math.max(0, approach.waitingTime / exports.WAITING_REF));
            const predictedNorm = Math.min(1.0, Math.max(0, approach.predictedArrivingVehicles / exports.PREDICTED_REF));
            // 2. Weighted components
            // Queue = 40%, Waiting Time = 30%, Predicted Arriving Vehicles = 30%
            const queueComponent = sanitize(queueNorm * 40, 0, 40);
            const waitingComponent = sanitize(waitingNorm * 30, 0, 30);
            const predictedComponent = sanitize(predictedNorm * 30, 0, 30);
            const totalScore = sanitize(queueComponent + waitingComponent + predictedComponent, 0, 100);
            approach.trafficPriorityScore = totalScore;
            approach.scoreBreakdown = {
                queueComponent,
                waitingComponent,
                predictedComponent,
            };
            approach.normalizedValues = {
                queueNorm: Math.round(queueNorm * 1000) / 1000,
                waitingNorm: Math.round(waitingNorm * 1000) / 1000,
                predictedNorm: Math.round(predictedNorm * 1000) / 1000,
            };
            // 3. Continuous dynamic green calculation derived from priority
            // greenDuration = minimumGreen + priorityNormalized * (maximumGreen - minimumGreen)
            const priorityNormalized = totalScore / 100.0;
            const continuousGreen = exports.MIN_GREEN + priorityNormalized * (exports.MAX_GREEN - exports.MIN_GREEN);
            const clampedGreen = sanitize(continuousGreen, exports.MIN_GREEN, exports.MAX_GREEN);
            approach.recommendedGreen = clampedGreen;
            // 4. Per-direction explainability
            const qLevel = getLevel(approach.queue, 12, 5);
            const wLevel = getLevel(approach.waitingTime, 30, 15);
            const pLevel = getLevel(approach.predictedArrivingVehicles, 10, 4);
            let action = 'HOLD RED';
            if (dir === this.activeDirection) {
                action = approach.signalState === 'GREEN' ? 'EXTEND GREEN' : 'GRANT GREEN';
            }
            const reasonParts = [];
            if (qLevel === 'HIGH')
                reasonParts.push(`Queue: HIGH (${approach.queue} veh)`);
            if (wLevel === 'HIGH')
                reasonParts.push(`Waiting: HIGH (${approach.waitingTime}s)`);
            if (pLevel === 'HIGH')
                reasonParts.push(`Predicted: HIGH (${approach.predictedArrivingVehicles} veh)`);
            if (reasonParts.length === 0) {
                reasonParts.push('Nominal approach demand');
            }
            approach.decisionReason = reasonParts.join(', ');
            approach.decisionExplanation = {
                action,
                priorityScore: totalScore,
                recommendedGreen: clampedGreen,
                queueLevel: qLevel,
                waitingLevel: wLevel,
                predictedLevel: pLevel,
                summaryText: reasonParts.join(' • '),
            };
        }
    }
    /**
     * Main signal controller tick
     */
    tick(dt, controlMode, now) {
        this.phaseElapsed += dt;
        this.currentCycleTime += dt;
        // INTELLIGENT MODE ACTIVE GREEN ADAPTATION:
        // If active direction is GREEN, and incoming predicted platoon arrives,
        // allow green duration to dynamically adapt up to recommendedGreen (capped by MAX_GREEN)
        if (controlMode === 'INTELLIGENT' && this.signalPhase === 'GREEN') {
            const activeApp = this.approaches[this.activeDirection];
            if (activeApp.recommendedGreen > this.phaseDuration && this.phaseDuration < exports.MAX_GREEN) {
                this.phaseDuration = Math.min(exports.MAX_GREEN, activeApp.recommendedGreen);
                activeApp.greenDuration = this.phaseDuration;
            }
        }
        const remaining = Math.max(0, Math.ceil(this.phaseDuration - this.phaseElapsed));
        this.approaches[this.activeDirection].remainingSignalTime = remaining;
        if (this.phaseElapsed >= this.phaseDuration) {
            if (this.signalPhase === 'GREEN') {
                // GREEN -> YELLOW (3 sec)
                this.signalPhase = 'YELLOW';
                this.phaseElapsed = 0;
                this.phaseDuration = exports.YELLOW_DURATION;
                this.approaches[this.activeDirection].signalState = 'YELLOW';
                this.approaches[this.activeDirection].remainingSignalTime = exports.YELLOW_DURATION;
            }
            else if (this.signalPhase === 'YELLOW') {
                // YELLOW -> RED, then switch to next best direction
                this.signalPhase = 'RED';
                this.approaches[this.activeDirection].signalState = 'RED';
                const nextDirection = this.determineNextDirection(controlMode, now);
                this.switchDirection(nextDirection, controlMode, now);
            }
        }
        else {
            this.approaches[this.activeDirection].signalState = this.signalPhase;
        }
        // Inactive directions must remain RED
        for (const dir of DIRECTIONS) {
            if (dir !== this.activeDirection) {
                this.approaches[dir].signalState = 'RED';
                this.approaches[dir].remainingSignalTime = 0;
            }
        }
    }
    /**
     * Choose eligible direction with highest priority score (or starvation override)
     */
    determineNextDirection(controlMode, now) {
        if (controlMode === 'FIXED') {
            const currentIndex = DIRECTIONS.indexOf(this.activeDirection);
            return DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
        }
        // 1. Starvation prevention safeguard
        let starvedDirection = null;
        let maxStarveTime = -1;
        for (const dir of DIRECTIONS) {
            if (dir === this.activeDirection)
                continue;
            const app = this.approaches[dir];
            const waitSinceServed = now - app.lastServedTime;
            if ((app.queue > 0 && app.maxWaitingTime >= exports.STARVATION_MAX_WAIT) || (app.queue > 0 && waitSinceServed > 55)) {
                if (app.maxWaitingTime > maxStarveTime) {
                    maxStarveTime = app.maxWaitingTime;
                    starvedDirection = dir;
                }
            }
        }
        if (starvedDirection) {
            this.approaches[starvedDirection].decisionExplanation.action = 'GRANT GREEN';
            this.approaches[starvedDirection].decisionExplanation.summaryText = `Starvation override triggered (waiting ${Math.round(maxStarveTime)}s)`;
            return starvedDirection;
        }
        // 2. Select eligible direction with highest Priority Score
        const candidates = DIRECTIONS.filter((d) => d !== this.activeDirection);
        candidates.sort((a, b) => {
            return this.approaches[b].trafficPriorityScore - this.approaches[a].trafficPriorityScore;
        });
        if (this.approaches[candidates[0]].trafficPriorityScore === 0) {
            const currentIndex = DIRECTIONS.indexOf(this.activeDirection);
            return DIRECTIONS[(currentIndex + 1) % DIRECTIONS.length];
        }
        return candidates[0];
    }
    switchDirection(newDirection, controlMode, now) {
        this.activeDirection = newDirection;
        this.signalPhase = 'GREEN';
        this.phaseElapsed = 0;
        let greenDuration = 20;
        if (controlMode === 'FIXED') {
            greenDuration = newDirection === 'North' ? 25 : 18;
        }
        else {
            // Continuous derivation from priority score
            const priority = this.approaches[newDirection].trafficPriorityScore;
            const priorityNormalized = priority / 100.0;
            greenDuration = Math.round(exports.MIN_GREEN + priorityNormalized * (exports.MAX_GREEN - exports.MIN_GREEN));
            greenDuration = sanitize(greenDuration, exports.MIN_GREEN, exports.MAX_GREEN);
        }
        this.phaseDuration = greenDuration;
        this.approaches[newDirection].greenDuration = greenDuration;
        this.approaches[newDirection].remainingSignalTime = greenDuration;
        this.approaches[newDirection].signalState = 'GREEN';
        this.approaches[newDirection].lastServedTime = now;
        this.approaches[newDirection].decisionExplanation.action = 'GRANT GREEN';
    }
    getData() {
        return {
            id: this.id,
            name: this.name,
            activeDirection: this.activeDirection,
            signalPhase: this.signalPhase,
            phaseElapsed: Math.round(this.phaseElapsed * 10) / 10,
            phaseDuration: this.phaseDuration,
            approaches: JSON.parse(JSON.stringify(this.approaches)),
            totalServedVehicles: this.totalServedVehicles,
            currentCycleTime: Math.round(this.currentCycleTime * 10) / 10,
            upstreamMessageReceived: this.upstreamMessageReceived,
        };
    }
}
exports.Intersection = Intersection;
