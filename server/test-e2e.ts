import { SimulationEngine } from './src/SimulationEngine';

async function runE2ETest() {
  console.log('====================================================');
  console.log('STARTING END-TO-END CORRIDOR PROPAGATION TEST: A → B → C → D');
  console.log('====================================================');

  const engine = new SimulationEngine();
  engine.setControlMode('INTELLIGENT');
  engine.setTrafficDemandMode('RUSH');

  console.log('\n[TEST 1] Initializing Engine & Approach Sensors...');
  for (const id of ['A', 'B', 'C', 'D'] as const) {
    const inter = engine.intersections[id];
    console.log(`  ✓ Node ${id}: 4 Approaches ready (N, S, E, W), initial priority: ${inter.approaches.North.trafficPriorityScore}`);
  }

  console.log('\n[TEST 2] Injecting Platoon of 14 vehicles at Node A (North Entry)...');
  engine.spawnPlatoon();

  let recordedAB = false;
  let recordedBC = false;
  let recordedCD = false;
  let corridorVehiclesCompleted = false;

  console.log('\n[TEST 3] Running Simulation Loop across corridor timeline...');

  // Run up to 2500 steps (250s simulation time)
  for (let step = 0; step < 2500; step++) {
    engine.update(0.1);
    const state = engine.getState();

    // Check Link AB
    const flowAB = state.flowMessages.find(m => m.sourceIntersection === 'A' && m.targetIntersection === 'B');
    if (flowAB && flowAB.vehiclesInTransit >= 1 && !recordedAB) {
      console.log(`  ✓ [Wave Stage 1: A → B] Platoon detected in transit from A to B!`);
      console.log(`    - Vehicles In Transit: ${flowAB.vehiclesInTransit} veh`);
      console.log(`    - Estimated Travel Time: ${flowAB.estimatedTravelTime}s`);
      console.log(`    - Predicted Arrivals at Node B: ${flowAB.predictedArrivals} veh`);
      console.log(`    - Node B North Priority Score: ${state.intersections.B.approaches.North.trafficPriorityScore}/100`);
      console.log(`    - Score breakdown: Q=${state.intersections.B.approaches.North.scoreBreakdown.queueComponent}/40, W=${state.intersections.B.approaches.North.scoreBreakdown.waitingComponent}/30, P=${state.intersections.B.approaches.North.scoreBreakdown.predictedComponent}/30`);
      console.log(`    - Node B Dynamic Recommended Green: ${state.intersections.B.approaches.North.recommendedGreen}s`);
      console.log(`    - Node B Decision Reason: "${state.intersections.B.approaches.North.decisionReason}"`);
      recordedAB = true;
    }

    // Check Link BC
    const flowBC = state.flowMessages.find(m => m.sourceIntersection === 'B' && m.targetIntersection === 'C');
    if (flowBC && flowBC.vehiclesInTransit >= 1 && !recordedBC) {
      console.log(`  ✓ [Wave Stage 2: B → C] Platoon traversed B and entered Link B → C!`);
      console.log(`    - Vehicles In Transit: ${flowBC.vehiclesInTransit} veh`);
      console.log(`    - Estimated Travel Time: ${flowBC.estimatedTravelTime}s`);
      console.log(`    - Predicted Arrivals at Node C: ${flowBC.predictedArrivals} veh`);
      console.log(`    - Node C North Priority Score: ${state.intersections.C.approaches.North.trafficPriorityScore}/100`);
      console.log(`    - Node C Dynamic Recommended Green: ${state.intersections.C.approaches.North.recommendedGreen}s`);
      console.log(`    - Node C Decision Reason: "${state.intersections.C.approaches.North.decisionReason}"`);
      recordedBC = true;
    }

    // Check Link CD
    const flowCD = state.flowMessages.find(m => m.sourceIntersection === 'C' && m.targetIntersection === 'D');
    if (flowCD && flowCD.vehiclesInTransit >= 1 && !recordedCD) {
      console.log(`  ✓ [Wave Stage 3: C → D] Platoon traversed C and entered Link C → D!`);
      console.log(`    - Vehicles In Transit: ${flowCD.vehiclesInTransit} veh`);
      console.log(`    - Estimated Travel Time: ${flowCD.estimatedTravelTime}s`);
      console.log(`    - Predicted Arrivals at Node D: ${flowCD.predictedArrivals} veh`);
      console.log(`    - Node D North Priority Score: ${state.intersections.D.approaches.North.trafficPriorityScore}/100`);
      console.log(`    - Node D Dynamic Recommended Green: ${state.intersections.D.approaches.North.recommendedGreen}s`);
      console.log(`    - Node D Decision Reason: "${state.intersections.D.approaches.North.decisionReason}"`);
      recordedCD = true;
    }

    // Check if vehicles completed corridor
    if (recordedCD && state.systemStatus.vehiclesCompleted > 10) {
      corridorVehiclesCompleted = true;
      if (recordedAB && recordedBC && recordedCD) {
        break;
      }
    }
  }

  console.log('\n[TEST 4] Verification Summary:');
  console.log(`  ✓ Propagation A → B: ${recordedAB ? 'PASSED (Flow Packet + Prediction Active)' : 'FAILED'}`);
  console.log(`  ✓ Propagation B → C: ${recordedBC ? 'PASSED (Flow Packet + Prediction Active)' : 'FAILED'}`);
  console.log(`  ✓ Propagation C → D: ${recordedCD ? 'PASSED (Flow Packet + Prediction Active)' : 'FAILED'}`);
  console.log(`  ✓ Full Corridor Completion at D: ${corridorVehiclesCompleted ? 'PASSED' : 'FAILED'}`);
  console.log(`  ✓ Total Completed Vehicles: ${engine.vehicleManager.completedCount}`);

  if (recordedAB && recordedBC && recordedCD && corridorVehiclesCompleted) {
    console.log('\n====================================================');
    console.log('SUCCESS: ALL 4 STAGES OF A → B → C → D VERIFIED END-TO-END!');
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error('Test incomplete or did not meet criteria.');
    process.exit(1);
  }
}

runE2ETest().catch((err) => {
  console.error(err);
  process.exit(1);
});
