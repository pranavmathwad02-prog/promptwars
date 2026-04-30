/**
 * @file worker.js
 * @description Web Worker for Live Analytics Simulation
 *
 * Offloads data simulation and computation from the main browser thread
 * to prevent UI jank. Demonstrates multi-threaded architecture.
 *
 * Messages posted to main thread:
 *   { type: 'ANALYTICS_UPDATE', data: { turnout: number[], issues: number[] } }
 */
'use strict';

/** @type {number[]} Voter turnout baselines by demographic group (%) */
let baseTurnout = [60, 45, 55, 70, 50, 65];

/** @type {number[]} Issue priority baselines (0–100 index) */
let baseIssues = [85, 70, 60, 90, 50];

/** @type {number|null} Reference to the interval, enabling cleanup. */
let intervalId = null;

/**
 * Clamps a value between min and max (inclusive).
 * @param {number} val - The value to clamp.
 * @param {number} min - Minimum boundary.
 * @param {number} max - Maximum boundary.
 * @returns {number}
 */
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * Generates a small random delta to simulate live polling shifts.
 * @param {number} amplitude - Half-range of the noise (e.g. 2 → ±2).
 * @returns {number}
 */
const noise = (amplitude) => (Math.random() * amplitude * 2) - amplitude;

/**
 * Calculates new randomized data points based on current baselines and
 * posts the result back to the main thread.
 * @returns {void}
 */
function simulateAnalyticsUpdate() {
    const newTurnout = baseTurnout.map((val) => clamp(val + noise(2.5), 0, 100));
    const newIssues  = baseIssues.map((val)  => clamp(val + noise(4),   0, 100));

    // Update baselines for the next tick (random walk simulation)
    baseTurnout = newTurnout;
    baseIssues  = newIssues;

    self.postMessage({
        type: 'ANALYTICS_UPDATE',
        data: {
            turnout: newTurnout.map((v) => Math.round(v * 10) / 10),
            issues:  newIssues.map((v)  => Math.round(v * 10) / 10)
        }
    });
}

/**
 * Handles messages from the main thread.
 * Supports: { type: 'START' } | { type: 'STOP' }
 */
self.addEventListener('message', (event) => {
    const { type } = event.data || {};

    if (type === 'STOP' && intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }

    if (type === 'START' && intervalId === null) {
        simulateAnalyticsUpdate(); // Immediate first broadcast
        intervalId = setInterval(simulateAnalyticsUpdate, 3000);
    }
});

// Auto-start on load (default behaviour when no START message is sent)
simulateAnalyticsUpdate();
intervalId = setInterval(simulateAnalyticsUpdate, 3000);
