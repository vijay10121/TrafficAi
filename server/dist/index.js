"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const SimulationEngine_1 = require("./SimulationEngine");
const PORT = process.env.PORT || 3001;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
const engine = new SimulationEngine_1.SimulationEngine();
// REST API routes
app.get('/api/status', (req, res) => {
    res.json(engine.getState());
});
app.post('/api/control/start', (req, res) => {
    engine.start();
    io.emit('simulation:update', engine.getState());
    res.json({ success: true, isRunning: engine.isRunning });
});
app.post('/api/control/pause', (req, res) => {
    engine.pause();
    io.emit('simulation:update', engine.getState());
    res.json({ success: true, isRunning: engine.isRunning });
});
app.post('/api/control/reset', (req, res) => {
    engine.reset();
    io.emit('simulation:update', engine.getState());
    res.json({ success: true });
});
app.post('/api/control/mode', (req, res) => {
    const { mode } = req.body;
    if (mode === 'FIXED' || mode === 'INTELLIGENT') {
        engine.setControlMode(mode);
        io.emit('simulation:update', engine.getState());
        res.json({ success: true, controlMode: engine.controlMode });
    }
    else {
        res.status(400).json({ error: 'Invalid mode' });
    }
});
app.post('/api/control/demand', (req, res) => {
    const { mode } = req.body;
    if (mode === 'NORMAL' || mode === 'RUSH' || mode === 'HEAVY') {
        engine.setTrafficDemandMode(mode);
        io.emit('simulation:update', engine.getState());
        res.json({ success: true, trafficDemandMode: engine.trafficDemandMode });
    }
    else {
        res.status(400).json({ error: 'Invalid demand mode' });
    }
});
app.post('/api/control/speed', (req, res) => {
    const { speed } = req.body;
    if (typeof speed === 'number') {
        engine.setSimulationSpeed(speed);
        io.emit('simulation:update', engine.getState());
        res.json({ success: true, simulationSpeed: engine.simulationSpeed });
    }
    else {
        res.status(400).json({ error: 'Invalid speed value' });
    }
});
app.post('/api/control/platoon', (req, res) => {
    engine.spawnPlatoon();
    res.json({ success: true, message: 'Platoon dispatched from A' });
});
app.post('/api/control/demo', (req, res) => {
    engine.triggerDemoMode();
    io.emit('simulation:update', engine.getState());
    res.json({ success: true, message: 'Deterministic Demo Mode triggered' });
});
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    // Immediately send initial state
    socket.emit('simulation:update', engine.getState());
    socket.on('control:start', () => {
        engine.start();
        io.emit('simulation:update', engine.getState());
    });
    socket.on('control:pause', () => {
        engine.pause();
        io.emit('simulation:update', engine.getState());
    });
    socket.on('control:reset', () => {
        engine.reset();
        io.emit('simulation:update', engine.getState());
    });
    socket.on('control:mode', (mode) => {
        engine.setControlMode(mode);
        io.emit('simulation:update', engine.getState());
    });
    socket.on('control:demand', (mode) => {
        engine.setTrafficDemandMode(mode);
        io.emit('simulation:update', engine.getState());
    });
    socket.on('control:speed', (speed) => {
        engine.setSimulationSpeed(speed);
        io.emit('simulation:update', engine.getState());
    });
    socket.on('control:platoon', () => {
        engine.spawnPlatoon();
    });
    socket.on('control:demo', () => {
        engine.triggerDemoMode();
        io.emit('simulation:update', engine.getState());
    });
    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});
// High-resolution simulation loop: 20 ticks per second (dt = 0.05s) for smooth physics
// Broadcast state 10 times per second (every 100ms)
const TICK_RATE_MS = 50; // 20 updates per second
let lastTickTime = Date.now();
let lastBroadcastTime = Date.now();
setInterval(() => {
    const now = Date.now();
    const rawDt = (now - lastTickTime) / 1000.0;
    lastTickTime = now;
    // Cap dt to prevent massive jumps during CPU pauses
    const safeDt = Math.min(rawDt, 0.2);
    engine.update(safeDt);
    // Broadcast state at 10 Hz
    if (now - lastBroadcastTime >= 100) {
        lastBroadcastTime = now;
        io.emit('simulation:update', engine.getState());
    }
}, TICK_RATE_MS);
httpServer.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  Intelligent Traffic Signal Coordination Backend Server`);
    console.log(`  Listening on http://localhost:${PORT}`);
    console.log(`  Connected Corridor: A -> B -> C -> D`);
    console.log(`=======================================================`);
});
