// Everything the player sees: the gallery, the cones, the crew, the HUD,
// and the title / caught / win screens. All art is drawn in code.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE,
  CAMERA_RANGE,
  CAMERA_HALF_ANGLE,
  THIEF_RADIUS,
  GUARD_RADIUS,
  LOCKPICK_SECONDS,
} from './config.js';
import { WALLS, PEDESTALS, DIAMOND_CASE, GEMS, EXIT, pointBlocked } from './level.js';
import { makeRng } from './random.js';

// A vision cone clipped by walls: march each ray out until it hits
// something solid, so the light stops at the wall like real light does.
function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  const rays = 36;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    let reach = range;
    const step = 7;
    for (let d = step; d <= range; d += step) {
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      if (px < 0 || px > CANVAS_WIDTH || py < 0 || py > CANVAS_HEIGHT || pointBlocked(px, py)) {
        reach = d;
        break;
      }
    }
    ctx.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFloor(ctx, rng) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Parquet planks.
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (let y = 16; y < CANVAS_HEIGHT; y += 30) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(CANVAS_WIDTH - 16, y);
    ctx.stroke();
  }
  for (let x = 16; x < CANVAS_WIDTH; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 16);
    ctx.lineTo(x, CANVAS_HEIGHT - 16);
    ctx.stroke();
  }
  // The marble hall in the middle of the room.
  ctx.fillStyle = COLORS.marble;
  ctx.fillRect(314, 16, 346, 568);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(314, 60 + i * 64);
    ctx.lineTo(660, 60 + i * 64);
    ctx.stroke();
  }
  // A worn rug by the entrance, and one under the diamond case.
  ctx.fillStyle = 'rgba(122, 30, 30, 0.5)';
  ctx.fillRect(40, 470, 150, 90);
  ctx.fillRect(410, 100, 140, 80);
  ctx.strokeStyle = 'rgba(255, 215, 94, 0.5)';
  ctx.strokeRect(40, 470, 150, 90);
  ctx.strokeRect(410, 100, 140, 80);
  // Dust motes: fixed specks so the room feels lived in.
  ctx.fillStyle = 'rgba(255, 240, 200, 0.10)';
  for (let i = 0; i < 40; i++) {
    const px = 20 + rng() * (CANVAS_WIDTH - 40);
    const py = 20 + rng() * (CANVAS_HEIGHT - 40);
    ctx.fillRect(px, py, 2, 2);
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    if (w.h <= 16) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
  }
}

function drawPedestal(ctx, p) {
  ctx.fillStyle = COLORS.pedestal;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = COLORS.pedestalTop;
  ctx.fillRect(p.x + 3, p.y + 3, p.w - 6, p.h - 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(p.x + 3.5, p.y + 3.5, p.w - 7, p.h - 7);
}

function drawDiamondCase(ctx, world, time) {
  const c = DIAMOND_CASE;
  drawPedestal(ctx, c);
  // The glass case.
  ctx.fillStyle = 'rgba(159, 216, 232, 0.25)';
  ctx.fillRect(c.x + 6, c.y - 16, c.w - 12, 22);
  ctx.strokeStyle = COLORS.caseGlass;
  ctx.strokeRect(c.x + 6.5, c.y - 15.5, c.w - 13, 21);
  if (!world.thief.hasDiamond) {
    // The Aurora Diamond, pulsing so the eye finds it.
    const pulse = 0.7 + 0.3 * Math.sin(time * 3);
    const cx = c.x + c.w / 2;
    const cy = c.y - 4;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx, cy + 10);
    ctx.lineTo(cx - 9, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURORA DIAMOND', cx, c.y + c.h + 14);
  } else {
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('empty case', c.x + c.w / 2, c.y + c.h + 14);
  }
}

function drawGem(ctx, gem, time) {
  if (gem.taken) return;
  const bob = Math.sin(time * 2 + gem.x) * 2;
  ctx.fillStyle = COLORS.gem;
  ctx.beginPath();
  ctx.arc(gem.x, gem.y + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(gem.x - 2, gem.y + bob - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawExit(ctx, time) {
  const pulse = 0.55 + 0.35 * Math.sin(time * 2.5);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.restore();
  ctx.fillStyle = COLORS.exitDark;
  ctx.fillRect(EXIT.x, EXIT.y + EXIT.h - 8, EXIT.w, 8);
  ctx.fillStyle = '#062b18';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 4);
}

function drawCamera(ctx, cam) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.fillStyle = cam.disabled > 0 ? '#555' : '#222';
  ctx.fillRect(-9, -6, 18, 12);
  ctx.rotate(cam.angle);
  ctx.fillStyle = cam.disabled > 0 ? '#777' : '#ff5252';
  ctx.beginPath();
  ctx.arc(8, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(9, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (cam.disabled > 0) {
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFF ' + Math.ceil(cam.disabled) + 's', cam.x, cam.y + 22);
  }
}

function drawGuard(ctx, guard) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.facing);
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(0, 0, GUARD_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(3, 0, GUARD_RADIUS - 5, 0, Math.PI * 2);
  ctx.fill();
  // The nose shows which way the guard looks.
  ctx.fillStyle = '#0e1a2e';
  ctx.beginPath();
  ctx.moveTo(GUARD_RADIUS - 1, 0);
  ctx.lineTo(GUARD_RADIUS - 8, -5);
  ctx.lineTo(GUARD_RADIUS - 8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, guard.x, guard.y - GUARD_RADIUS - 6);
}

function drawThief(ctx, thief, time) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  // A soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(2, 4, THIEF_RADIUS, THIEF_RADIUS * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // A pale ring so the thief reads at a glance against the dark floor.
  ctx.strokeStyle = 'rgba(242, 234, 217, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, THIEF_RADIUS + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(thief.facing);
  ctx.fillStyle = COLORS.thiefHood;
  ctx.beginPath();
  ctx.arc(0, 0, THIEF_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(2, 0, THIEF_RADIUS - 4, 0, Math.PI * 2);
  ctx.fill();
  // The hood point shows the facing.
  ctx.fillStyle = COLORS.thiefHood;
  ctx.beginPath();
  ctx.moveTo(THIEF_RADIUS + 3, 0);
  ctx.lineTo(THIEF_RADIUS - 6, -5);
  ctx.lineTo(THIEF_RADIUS - 6, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (thief.sneaking) {
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', thief.x, thief.y - THIEF_RADIUS - 6);
  }
}

function drawSmoke(ctx, cloud) {
  ctx.save();
  ctx.globalAlpha = Math.min(0.6, 0.3 + (cloud.ttl / 4) * 0.3);
  ctx.fillStyle = COLORS.smoke;
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cloud.x - cloud.radius * 0.4, cloud.y + 8, cloud.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cloud.x + cloud.radius * 0.4, cloud.y - 6, cloud.radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWorld(ctx, world, time) {
  const rng = makeRng(7);
  drawFloor(ctx, rng);
  // Vision cones first, so walls and furniture sit on top of them.
  for (const guard of world.guards) {
    drawCone(ctx, guard.x, guard.y, guard.facing, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, COLORS.coneGuard, COLORS.coneGuardEdge);
  }
  for (const cam of world.cameras) {
    if (cam.disabled > 0) continue;
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, COLORS.coneCamera, COLORS.coneCameraEdge);
  }
  for (const cloud of world.smokeClouds) drawSmoke(ctx, cloud);
  for (const p of PEDESTALS) drawPedestal(ctx, p);
  drawDiamondCase(ctx, world, time);
  for (const gem of world.gems) drawGem(ctx, gem, time);
  drawExit(ctx, time);
  drawWalls(ctx);
  for (const cam of world.cameras) drawCamera(ctx, cam);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawThief(ctx, world.thief, time);
  if (world.coinToss) {
    ctx.fillStyle = COLORS.gem;
    ctx.beginPath();
    ctx.arc(world.coinToss.x, world.coinToss.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lockpick progress ring over the case.
  if (world.thief.lockpicking) {
    const cx = DIAMOND_CASE.x + DIAMOND_CASE.w / 2;
    const cy = DIAMOND_CASE.y - 26;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, -Math.PI / 2, -Math.PI / 2 + world.thief.lockpick * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRACKING…', cx, cy - 18);
  }
}

function alarmColor(alarm) {
  if (alarm < 40) return COLORS.alarmLow;
  if (alarm < 70) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

function drawHud(ctx, world, width, height) {
  const thief = world.thief;
  const loot = thief.gems * 100 + (thief.hasDiamond ? 500 : 0);
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
  ctx.fillRect(0, 0, width, 44);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(thief.hasDiamond ? 'Get to the EXIT!' : 'Steal the Aurora Diamond', 12, 18);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('Loot $' + loot + '  ·  Gems ' + thief.gems + '/3', 12, 35);
  // Alarm meter, centre top.
  const barW = 260;
  const barX = width / 2 - barW / 2;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const flashing = world.alarm >= 70 && Math.floor(world.time * 4) % 2 === 0;
  ctx.fillStyle = flashing ? COLORS.alarmHigh : COLORS.text;
  ctx.fillText('ALARM ' + Math.round(world.alarm) + '%', width / 2, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(barX, 22, barW, 12);
  ctx.fillStyle = alarmColor(world.alarm);
  ctx.fillRect(barX, 22, (barW * world.alarm) / 100, 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.strokeRect(barX + 0.5, 22.5, barW, 12);
  // Timer, top right.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  const t = Math.max(0, Math.floor(world.time));
  ctx.fillText(String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'), width - 12, 18);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(world.phase === 'play' ? 'heist in progress' : world.phase, width - 12, 35);
  // Bottom bar: tools and controls.
  ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
  ctx.fillRect(0, height - 30, width, 30);
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    '1 Smoke ×' + thief.smoke + '    2 EMP ×' + thief.emp + '    Click: toss coin ×' + thief.coins,
    12,
    height - 11,
  );
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = 'right';
  ctx.fillText('WASD move · Shift sneak · E crack case · P pause', width - 12, height - 11);
  ctx.restore();
}

function drawPanel(ctx, width, height, title, titleColor, lines, footer) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 5, 0.62)';
  ctx.fillRect(0, 0, width, height);
  const pw = Math.min(560, width - 80);
  const ph = 92 + lines.length * 24;
  const px = (width - pw) / 2;
  const py = (height - ph) / 2 - 30;
  ctx.fillStyle = 'rgba(20, 14, 10, 0.94)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = titleColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, py + 42);
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, py + 74 + i * 24);
  });
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(footer, width / 2, py + ph - 16);
  ctx.restore();
}

export function render(ctx, world, width, height) {
  const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);
  const offsetX = (width - CANVAS_WIDTH * scale) / 2;
  const offsetY = (height - CANVAS_HEIGHT * scale) / 2;
  world.viewScale = scale;
  world.viewOffsetX = offsetX;
  world.viewOffsetY = offsetY;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  drawWorld(ctx, world, world.time);
  ctx.restore();
  drawHud(ctx, world, width, height);

  if (world.phase === 'title') {
    drawPanel(ctx, width, height, 'THE MIDNIGHT VAULT', COLORS.diamond, [
      'A one-night heist at the Aurelia Gallery.',
      'Cross the room. Dodge the cones. Crack the case.',
      'Take the Aurora Diamond — and walk out the service door.',
    ], 'Press Enter or click to begin');
  } else if (world.phase === 'caught') {
    drawPanel(ctx, width, height, 'CAUGHT', COLORS.alarmHigh, [
      'The alarm hit 100% and the gallery locked down.',
      'Loot kept: $' + (world.thief.gems * 100 + (world.thief.hasDiamond ? 500 : 0)),
      'The crew is already planning the next run.',
    ], 'Press Enter to try again');
  } else if (world.phase === 'win') {
    const loot = world.thief.gems * 100 + 500 + 250;
    drawPanel(ctx, width, height, 'CLEAN GETAWAY', COLORS.exit, [
      'The Aurora Diamond is yours. The crew is already gone.',
      'Diamond $500  ·  Gems $' + world.thief.gems * 100 + '  ·  Getaway bonus $250',
      'Total take: $' + loot,
    ], 'Press Enter to run it again');
  } else if (world.phase === 'paused') {
    drawPanel(ctx, width, height, 'PAUSED', COLORS.textDim, [
      'The gallery holds its breath.',
    ], 'Press P to keep going');
  }
}
