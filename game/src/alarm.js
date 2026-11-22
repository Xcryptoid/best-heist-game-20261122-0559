// The alarm meter: the game's heartbeat. Being seen fills it, hiding
// drains it, and at 100 the gallery locks down and the heist is over.

import {
  ALARM_GUARD_RATE,
  ALARM_CAMERA_RATE,
  ALARM_SNEAK_FACTOR,
  ALARM_DECAY_RATE,
} from './config.js';

export function updateAlarm(world, thief, dt) {
  let seen = false;
  let rate = 0;
  for (const guard of world.guards) {
    if (guard.seenNow) {
      seen = true;
      rate = Math.max(rate, ALARM_GUARD_RATE);
    }
  }
  for (const cam of world.cameras) {
    if (cam.seenNow) {
      seen = true;
      rate = Math.max(rate, ALARM_CAMERA_RATE);
    }
  }
  if (seen) {
    if (thief.sneaking) rate *= ALARM_SNEAK_FACTOR;
    world.alarm = Math.min(100, world.alarm + rate * dt);
    world.beingSeen = true;
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM_DECAY_RATE * dt);
    world.beingSeen = false;
  }
  return world.alarm >= 100;
}
