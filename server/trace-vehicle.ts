import { SimulationEngine } from './src/SimulationEngine';

const engine = new SimulationEngine();
engine.setControlMode('INTELLIGENT');

const testCar = engine.vehicleManager.createVehicle({
  origin: 'A_North',
  destination: 'Corridor_Exit',
  currentIntersection: 'A',
  direction: 'North',
  maxSpeed: 12,
  vehicleType: 'car',
});

console.log('Created test car:', testCar.id);

for (let t = 0; t < 2500; t++) {
  engine.update(0.1);
  const simTime = Math.round(t * 0.1 * 10) / 10;

  if (t % 50 === 0 || testCar.state === 'COMPLETED') {
    console.log(`[t=${simTime}s] Loc=${testCar.currentIntersection} Dist=${Math.round(testCar.distanceAlongRoad)}m Spd=${Math.round(testCar.speed)} State=${testCar.state} Wait=${Math.round(testCar.waitingTime)}s Signal=${engine.intersections[testCar.currentIntersection as 'A'|'B'|'C'|'D']?.approaches?.North?.signalState || 'LINK'}`);
  }

  if (testCar.state === 'COMPLETED') {
    console.log(`\n🎉 VEHICLE COMPLETED ENTIRE CORRIDOR A → B → C → D at t=${simTime}s!`);
    break;
  }
}
