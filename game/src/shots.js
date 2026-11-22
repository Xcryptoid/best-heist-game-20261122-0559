// Deterministic staged states for screenshots: ?shot=start, ?shot=play,
// ?shot=end. Each one sets the world to a fixed, readable moment so the
// screenshots are the same every run.

export function applyShot(world, shot) {
  if (shot === 'start') {
    // The title moment: the whole room in one frame, guards mid-patrol,
    // the diamond glowing, the alarm at zero.
    world.phase = 'title';
    world.thief.x = 70;
    world.thief.y = 540;
    world.thief.facing = -Math.PI / 2;
    world.alarm = 0;
    world.time = 0;
    positionGuards(world, 0);
    return;
  }
  if (shot === 'play') {
    // Mid-heist: the thief slips past the hall guard's cone, one gem in
    // the bag, the alarm climbing, a smoke cloud fading behind them.
    world.phase = 'play';
    world.thief.x = 430;
    world.thief.y = 380;
    world.thief.facing = Math.PI / 4;
    world.thief.sneaking = true;
    world.thief.gems = 1;
    world.gems[0].taken = true;
    world.alarm = 42;
    world.time = 96;
    world.smokeClouds.push({ x: 380, y: 430, radius: 78, ttl: 2.5 });
    positionGuards(world, 2.4);
    return;
  }
  if (shot === 'end') {
    // The getaway: diamond in hand, thief at the service door, alarm hot.
    world.phase = 'play';
    world.thief.x = 905;
    world.thief.y = 48;
    world.thief.facing = -Math.PI / 2;
    world.thief.hasDiamond = true;
    world.thief.gems = 3;
    for (const gem of world.gems) gem.taken = true;
    world.alarm = 78;
    world.time = 214;
    positionGuards(world, 5.1);
  }
}

// Put the guards at the positions their patrols reach at a given time.
function positionGuards(world, t) {
  for (const guard of world.guards) {
    const wps = guard.waypoints;
    // Walk the loop at patrol speed for t seconds from the first waypoint.
    let remaining = t * 62;
    let idx = 0;
    let x = wps[0].x;
    let y = wps[0].y;
    let guardTime = 0;
    while (guardTime < 40) {
      const next = wps[(idx + 1) % wps.length];
      const seg = Math.hypot(next.x - x, next.y - y);
      if (remaining <= seg) {
        const f = remaining / seg;
        guard.x = x + (next.x - x) * f;
        guard.y = y + (next.y - y) * f;
        guard.facing = Math.atan2(next.y - y, next.x - x);
        guard.waypointIndex = (idx + 1) % wps.length;
        return;
      }
      remaining -= seg;
      x = next.x;
      y = next.y;
      idx = (idx + 1) % wps.length;
      guardTime += 1;
    }
    guard.x = x;
    guard.y = y;
    guard.facing = 0;
    guard.waypointIndex = idx;
  }
}
