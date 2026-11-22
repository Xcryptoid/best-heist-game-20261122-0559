// Guards: patrol loops, vision cones, and the hunt when the alarm climbs.
// A guard looks where it walks. When the alarm passes the threshold it
// leaves its patrol and walks to the last place it saw the thief.

import {
  GUARD_RADIUS,
  GUARD_PATROL_SPEED,
  GUARD_ALERT_SPEED,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE,
  GUARD_INVESTIGATE_SECONDS,
  ALARM_ALERT_THRESHOLD,
} from './config.js';
import { GUARDS, lineOfSight } from './level.js';

export function createGuards() {
  return GUARDS.map((def) => ({
    name: def.name,
    waypoints: def.waypoints,
    waypointIndex: 0,
    x: def.waypoints[0].x,
    y: def.waypoints[0].y,
    facing: 0,
    alerted: false,
    investigate: null,
    lastSeen: null,
    seenNow: false,
  }));
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the thief right now? Inside the cone, in range,
// with a clear line of sight, and not hidden by smoke.
export function guardSeesThief(guard, thief, world) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_CONE_RANGE) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angle, guard.facing)) > GUARD_CONE_HALF_ANGLE) return false;
  if (!lineOfSight(guard.x, guard.y, thief.x, thief.y)) return false;
  for (const cloud of world.smokeClouds) {
    if (segmentThroughCircle(guard.x, guard.y, thief.x, thief.y, cloud)) return false;
  }
  return true;
}

export function segmentThroughCircle(x1, y1, x2, y2, circle) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) {
    t = Math.max(0, Math.min(1, ((circle.x - x1) * dx + (circle.y - y1) * dy) / len2));
  }
  const cx = x1 + dx * t;
  const cy = y1 + dy * t;
  return Math.hypot(cx - circle.x, cy - circle.y) < circle.radius;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  return dist - step < 1;
}

export function updateGuards(guards, thief, alarm, dt, world) {
  for (const guard of guards) {
    guard.seenNow = guardSeesThief(guard, thief, world);
    if (guard.seenNow) {
      guard.lastSeen = { x: thief.x, y: thief.y };
      if (alarm >= ALARM_ALERT_THRESHOLD) guard.alerted = true;
    }

    if (guard.investigate) {
      guard.investigate.ttl -= dt;
      const arrived = moveToward(guard, guard.investigate.x, guard.investigate.y, GUARD_ALERT_SPEED, dt);
      if (arrived || guard.investigate.ttl <= 0) {
        guard.investigate = null;
        if (!guard.seenNow && alarm < ALARM_ALERT_THRESHOLD) guard.alerted = false;
      }
      continue;
    }

    if (guard.alerted && guard.lastSeen) {
      const arrived = moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_ALERT_SPEED, dt);
      if (arrived) {
        // Look around for a moment, then give up and go back to patrol.
        guard.alerted = false;
        guard.lastSeen = null;
      }
      continue;
    }

    // Patrol: walk to the next waypoint, then turn to the next one.
    const target = guard.waypoints[guard.waypointIndex];
    const arrived = moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt);
    if (arrived) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    }
  }
}
