/**
 * Web Worker for Live Analytics Simulation
 * 
 * Offloads heavy computational tasks (simulating live polling data)
 * from the main browser thread to prevent UI freezing.
 * Demonstrates advanced multi-threading architecture.
 */
'use strict';

/** @type {number[]} Initial voter turnout baselines by demographic */
let baseTurnout = [60, 45, 55, 70, 50, 65];

/** @type {number[]} Initial issue priority baselines */
let baseIssues = [85, 70, 60, 90, 50];

/**
 * Calculates new randomized data points and simulates a heavy computational load.
 * Posts the resulting dataset back to the main thread via postMessage.
 * 
 * @returns {void}
 */
function simulateData() {
    // Add random noise to simulate live polling shifts
    const newTurnout = baseTurnout.map(val => Math.max(0, Math.min(100, val + (Math.random() * 4 - 2))));
    const newIssues = baseIssues.map(val => Math.max(0, Math.min(100, val + (Math.random() * 6 - 3))));
    
    // Simulate heavy calculation
    let dummy = 0;
    for(let i=0; i<1000000; i++) { dummy += Math.sqrt(i); }

    postMessage({
        type: 'ANALYTICS_UPDATE',
        data: {
            turnout: newTurnout,
            issues: newIssues
        }
    });

    baseTurnout = newTurnout;
    baseIssues = newIssues;
}

// Start simulation loop
setInterval(simulateData, 3000);
simulateData(); // Initial broadcast
