// The thief: movement, the three tools, and the lockpick channel.
// The thief is a circle that slides along walls and hides behind cover.

import {
  THIEF_RADIUS,
  THIEF_WALK_SPEED,
  THIEF_SNEAK_SPEED,
  THIEF_SPRINT_SPEED,
  SMOKE_START_COUNT,
  SMOKE_RADIUS,
  SMOKE_SECONDS,
  EMP_START_COUNT,
  EMP_SECONDS,
  COIN_START_COUNT,
  LOCKPICK_SECONDS,
  LOCKPICK_RANGE,
} from './config.js';
import { SPAWN, DIAMOND_CASE, resolveCircle } from './level.js';

export function createThief() {
  return {
    x: SPAWN.x,
    y: SPAWN.y,
    facing: -Math.PI / 2, // starts looking up the room
    moving: false,
    sneaking: false,
    smoke: SMOKE_START_COUNT,
    emp: EMP_START_COUNT,
    coins: COIN_START_COUNT,
    lockpick: 0, // 0..1 progress on the diamond case
    lockpicking: false,
    hasDiamond: false,
    gems: 0,
  };
}

export function resetThief(thief) {
  const fresh = createThief();
  Object.assign(thief, fresh);
}

export function thiefSpeed(thief) {
  if (thief.sneaking) return THIEF_SNEAK_SPEED;
  return THIEF_WALK_SPEED;
}

export function updateThief(thief, input, dt, world) {
  thief.sneaking = input.sneak;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const moving = dx !== 0 || dy !== 0;
  thief.moving = moving;
  if (moving) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    const speed = thiefSpeed(thief);
    thief.x += dx * speed * dt;
    thief.y += dy * speed * dt;
    thief.facing = Math.atan2(dy, dx);
    resolveCircle(thief, THIEF_RADIUS);
  }

  // Tools are one-shot: a smoke cloud, an EMP burst, a tossed coin.
  for (const tool of input.toolQueue) {
    if (tool === 'smoke' && thief.smoke > 0) {
      thief.smoke -= 1;
      world.smokeClouds.push({
        x: thief.x,
        y: thief.y,
        radius: SMOKE_RADIUS,
        ttl: SMOKE_SECONDS,
      });
      world.events.push('smoke');
    } else if (tool === 'emp' && thief.emp > 0) {
      thief.emp -= 1;
      world.empTimer = EMP_SECONDS;
      world.events.push('emp');
    }
  }
  input.toolQueue.length = 0;

  // A mouse click tosses a coin: the nearest guard walks over to look.
  if (input.click && thief.coins > 0) {
    const scale = world.viewScale;
    const wx = (input.click.x - world.viewOffsetX) / scale;
    const wy = (input.click.y - world.viewOffsetY) / scale;
    thief.coins -= 1;
    world.coinToss = { x: wx, y: wy, ttl: 0.8 };
    world.events.push('coin');
    const guard = nearestGuard(world.guards, wx, wy);
    if (guard) {
      guard.investigate = { x: wx, y: wy, ttl: 4 };
      guard.alerted = true;
    }
  }
  input.click = null;

  // The lockpick channel: stand by the case and hold E.
  const caseCx = DIAMOND_CASE.x + DIAMOND_CASE.w / 2;
  const caseCy = DIAMOND_CASE.y + DIAMOND_CASE.h / 2;
  const nearCase = Math.hypot(thief.x - caseCx, thief.y - caseCy) <= LOCKPICK_RANGE + 18;
  if (!thief.hasDiamond && nearCase && input.interact && !moving) {
    thief.lockpicking = true;
    thief.lockpick += dt / LOCKPICK_SECONDS;
    if (thief.lockpick >= 1) {
      thief.hasDiamond = true;
      thief.lockpick = 0;
      world.events.push('diamond');
    }
  } else {
    thief.lockpicking = false;
    if (!thief.hasDiamond) thief.lockpick = Math.max(0, thief.lockpick - dt * 0.5);
  }

  // Gems are picked up by walking over their pedestals.
  for (const gem of world.gems) {
    if (!gem.taken && Math.hypot(thief.x - gem.x, thief.y - gem.y) < 40) {
      gem.taken = true;
      thief.gems += 1;
      world.events.push('gem');
    }
  }
}

function nearestGuard(guards, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  return best;
}
