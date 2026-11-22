// Security cameras: fixed to the walls, sweeping their cones.
// An EMP burst freezes them; smoke hides the thief from them too.

import {
  CAMERA_RANGE,
  CAMERA_HALF_ANGLE,
  CAMERA_SWEEP_SPEED,
} from './config.js';
import { CAMERAS, lineOfSight } from './level.js';
import { segmentThroughCircle } from './guard.js';

export function createCameras() {
  return CAMERAS.map((def) => ({
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    phase: def.phase,
    angle: def.baseAngle,
    disabled: 0, // seconds left of EMP shutdown
    seenNow: false,
  }));
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function updateCameras(cameras, thief, time, dt, world) {
  for (const cam of cameras) {
    if (cam.disabled > 0) {
      cam.disabled -= dt;
      cam.seenNow = false;
      continue;
    }
    cam.angle = cam.baseAngle + Math.sin(time * CAMERA_SWEEP_SPEED + cam.phase) * cam.sweep;
    const dx = thief.x - cam.x;
    const dy = thief.y - cam.y;
    const dist = Math.hypot(dx, dy);
    let seen = false;
    if (dist <= CAMERA_RANGE) {
      const angle = Math.atan2(dy, dx);
      if (Math.abs(angleDifference(angle, cam.angle)) <= CAMERA_HALF_ANGLE) {
        if (lineOfSight(cam.x, cam.y, thief.x, thief.y)) {
          seen = true;
          for (const cloud of world.smokeClouds) {
            if (segmentThroughCircle(cam.x, cam.y, thief.x, thief.y, cloud)) {
              seen = false;
              break;
            }
          }
        }
      }
    }
    cam.seenNow = seen;
  }
}
