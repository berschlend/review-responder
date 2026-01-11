/**
 * Demo Actions Sequence - 45 Seconds Version
 * Focused on: Page Scan → Batch Mode → Single Review
 */

const S = require('./selectors');

/**
 * Demo Actions Array (45 seconds)
 * Markers are relative (0-1 = 0%-100% of video duration)
 */
const DEMO_ACTIONS = [
  // ===== HOOK & PAGE SCAN (0:00 - 0:10) =====
  {
    marker: 0,
    type: 'navigate',
    url: 'https://www.google.com/maps/place/Selvático+Sushi+%26+Grill/@52.5086614,13.3289321,17z',
    description: 'Load restaurant page',
  },
  {
    marker: 0.07,
    type: 'wait',
    duration: 3000,
    description: 'Wait for page + extension to load',
  },
  {
    marker: 0.11,
    type: 'scroll',
    target: 'reviews',
    description: 'Scroll to reviews section',
  },
  {
    marker: 0.13,
    type: 'highlight',
    selector: S.respondBtn,
    duration: 2000,
    description: 'Highlight all Respond buttons',
  },

  // ===== BATCH MODE (0:10 - 0:25) =====
  {
    marker: 0.22,
    type: 'click',
    selector: S.batchBtn,
    description: 'Click Batch Mode button',
  },
  {
    marker: 0.24,
    type: 'wait',
    duration: 1000,
    description: 'Wait for batch overlay',
  },
  {
    marker: 0.27,
    type: 'highlight',
    selector: S.batchStatus,
    duration: 1500,
    description: 'Highlight "X reviews found"',
  },
  {
    marker: 0.33,
    type: 'click',
    selector: S.batchGenerateAll,
    description: 'Click Generate All',
  },
  {
    marker: 0.35,
    type: 'wait',
    duration: 6000,
    description: 'Wait for batch generation',
  },
  {
    marker: 0.49,
    type: 'highlight',
    selector: S.batchTabs,
    duration: 2000,
    description: 'Show generated response tabs',
  },
  {
    marker: 0.53,
    type: 'wait',
    duration: 1000,
    description: 'Pause on results',
  },
  {
    marker: 0.56,
    type: 'close',
    selector: S.batchOverlay,
    description: 'Close batch overlay',
  },

  // ===== SINGLE REVIEW (0:25 - 0:40) =====
  {
    marker: 0.60,
    type: 'wait',
    duration: 500,
    description: 'Brief pause',
  },
  {
    marker: 0.62,
    type: 'click',
    selector: `${S.respondBtn}:first-of-type`,
    description: 'Click first Respond button',
  },
  {
    marker: 0.64,
    type: 'wait',
    duration: 1500,
    description: 'Wait for panel to open',
  },
  {
    marker: 0.67,
    type: 'highlight',
    selector: S.aiRecommendation,
    duration: 1000,
    description: 'Show AI recommendation',
  },
  {
    marker: 0.71,
    type: 'click',
    selector: S.aiRecUse,
    description: 'Click Generate with AI recommendation',
  },
  {
    marker: 0.73,
    type: 'wait',
    duration: 3000,
    description: 'Wait for response generation',
  },
  {
    marker: 0.80,
    type: 'highlight',
    selector: S.qualityBadge,
    duration: 1000,
    description: 'Show quality score',
  },
  {
    marker: 0.84,
    type: 'click',
    selector: S.copyBtn,
    description: 'Click Copy button',
  },
  {
    marker: 0.86,
    type: 'wait',
    duration: 1500,
    description: 'Show toast notification',
  },
  {
    marker: 0.89,
    type: 'close',
    selector: S.panel,
    description: 'Close panel',
  },

  // ===== END (0:40 - 0:45) =====
  {
    marker: 0.93,
    type: 'wait',
    duration: 1000,
    description: 'Final pause',
  },
  {
    marker: 1.0,
    type: 'wait',
    duration: 500,
    description: 'End',
  },
];

/**
 * Get actual timestamp in seconds from marker
 */
function getTimestamp(marker, totalDuration) {
  return marker * totalDuration;
}

/**
 * Get all actions with calculated timestamps
 */
function getActionsWithTimestamps(totalDuration) {
  return DEMO_ACTIONS.map((action) => ({
    ...action,
    timestamp: getTimestamp(action.marker, totalDuration),
  }));
}

module.exports = {
  DEMO_ACTIONS,
  getTimestamp,
  getActionsWithTimestamps,
};
