// The Aurelia Gallery floor plan: walls, cover, loot, cameras, patrols.
// One room the thief must cross, with three ways through it:
// the guarded west door, the camera-watched hall, and the quiet east vent run.

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

const BORDER = 16;

// Walls are solid rectangles. They block movement and line of sight.
export const WALLS = [
  // Outer border.
  { x: 0, y: 0, w: CANVAS_WIDTH, h: BORDER },
  { x: 0, y: CANVAS_HEIGHT - BORDER, w: CANVAS_WIDTH, h: BORDER },
  { x: 0, y: 0, w: BORDER, h: CANVAS_HEIGHT },
  { x: CANVAS_WIDTH - BORDER, y: 0, w: BORDER, h: CANVAS_HEIGHT },
  // West wall between the entrance wing and the hall: south door only.
  { x: 300, y: BORDER, w: 14, h: 384 },
  { x: 300, y: 480, w: 14, h: 104 },
  // East wall between the hall and the vent run: north door only.
  { x: 660, y: 120, w: 14, h: 464 },
  // A short divider in the middle of the hall: cover, not a seal.
  { x: 380, y: 300, w: 100, h: 14 },
];

// Pedestals are low cover blocks. They block movement and sight, and the
// thief can hide behind them.
export const PEDESTALS = [
  { x: 420, y: 220, w: 64, h: 44 },
  { x: 540, y: 380, w: 64, h: 44 },
  { x: 170, y: 170, w: 56, h: 56 },
  { x: 760, y: 420, w: 64, h: 44 },
  { x: 536, y: 496, w: 48, h: 48 },
  { x: 96, y: 96, w: 48, h: 48 },
  { x: 856, y: 446, w: 48, h: 48 },
];

// The loot. The diamond sits in a locked glass case in the north hall;
// the three gems sit on open pedestals.
export const DIAMOND_CASE = { x: 448, y: 120, w: 64, h: 44, value: 500 };
export const GEMS = [
  { x: 120, y: 120, taken: false },
  { x: 880, y: 470, taken: false },
  { x: 560, y: 520, taken: false },
];

export const SPAWN = { x: 70, y: 540 };

// The service door in the north-east corner: reach it with the diamond.
export const EXIT = { x: 872, y: BORDER, w: 72, h: 64 };

// Cameras are fixed to the walls and sweep their cones back and forth.
export const CAMERAS = [
  { x: 480, y: 22, baseAngle: Math.PI / 2, sweep: 0.9, phase: 0 },
  { x: 938, y: 300, baseAngle: Math.PI, sweep: 0.8, phase: 1.7 },
  { x: 22, y: 300, baseAngle: 0, sweep: 0.7, phase: 3.1 },
];

// Guards walk patrol loops and look where they walk.
export const GUARDS = [
  {
    name: 'Mara',
    waypoints: [
      { x: 150, y: 150 },
      { x: 150, y: 450 },
    ],
  },
  {
    name: 'Bram',
    waypoints: [
      { x: 370, y: 210 },
      { x: 590, y: 210 },
      { x: 590, y: 410 },
      { x: 370, y: 410 },
    ],
  },
];

function rects() {
  return WALLS.concat(PEDESTALS).concat([DIAMOND_CASE]);
}

export function pointBlocked(x, y) {
  for (const r of rects()) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  }
  return false;
}

// Push a circle out of every solid rectangle it overlaps.
// Returns true when any push happened.
export function resolveCircle(pos, radius) {
  let pushed = false;
  for (const r of rects()) {
    const cx = Math.max(r.x, Math.min(pos.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(pos.y, r.y + r.h));
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      pushed = true;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        pos.x = cx + (dx / d) * radius;
        pos.y = cy + (dy / d) * radius;
      } else {
        // Centre is inside the rectangle: push out along the smallest side.
        const left = pos.x - r.x;
        const right = r.x + r.w - pos.x;
        const top = pos.y - r.y;
        const bottom = r.y + r.h - pos.y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) pos.x = r.x - radius;
        else if (m === right) pos.x = r.x + r.w + radius;
        else if (m === top) pos.y = r.y - radius;
        else pos.y = r.y + r.h + radius;
      }
    }
  }
  return pushed;
}

// Line-of-sight test between two points. Walls, pedestals and the glass
// case all block sight. Smoke clouds are checked by the caller.
export function lineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointBlocked(x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

export function insideExit(x, y) {
  return x >= EXIT.x && x <= EXIT.x + EXIT.w && y >= EXIT.y && y <= EXIT.y + EXIT.h;
}
