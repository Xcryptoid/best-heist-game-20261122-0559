// The Midnight Vault — boot, game loop, and the state machine.
// Phases: title -> play -> caught | win, with pause on top of play.

import { CANVAS_WIDTH, CANVAS_HEIGHT, SCORE_DIAMOND, SCORE_GEM, SCORE_WIN_BONUS } from './config.js';
import { GEMS, DIAMOND_CASE, insideExit } from './level.js';
import { createInput } from './input.js';
import { createThief, updateThief, resetThief } from './thief.js';
import { createGuards, updateGuards } from './guard.js';
import { createCameras, updateCameras } from './camera.js';
import { updateAlarm } from './alarm.js';
import { createAudio, playCue, setAlarmTone } from './audio.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

function createWorld() {
  return {
    phase: 'title',
    time: 0,
    alarm: 0,
    beingSeen: false,
    thief: createThief(),
    guards: createGuards(),
    cameras: createCameras(),
    gems: GEMS.map((g) => ({ x: g.x, y: g.y, taken: false })),
    smokeClouds: [],
    coinToss: null,
    empTimer: 0,
    events: [],
    audio: createAudio(),
    viewScale: 1,
    viewOffsetX: 0,
    viewOffsetY: 0,
  };
}

const world = createWorld();
const input = createInput();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) applyShot(world, shot);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function resetRun() {
  const fresh = createWorld();
  Object.assign(world, fresh);
  world.phase = 'play';
  if (shot) applyShot(world, shot);
}

function score() {
  return world.thief.gems * SCORE_GEM + (world.thief.hasDiamond ? SCORE_DIAMOND : 0);
}

function announce(text) {
  statusLine.textContent = text;
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Confirm keys start or restart a run from any end screen.
  for (const tool of input.toolQueue) {
    if (tool === 'confirm') {
      if (world.phase === 'title' || world.phase === 'caught' || world.phase === 'win') {
        resetRun();
        announce('The heist is on. Steal the Aurora Diamond, then reach the exit.');
      }
    }
  }
  input.toolQueue = input.toolQueue.filter((t) => t !== 'confirm');

  if (input.click && (world.phase === 'title' || world.phase === 'caught' || world.phase === 'win')) {
    input.click = null;
    resetRun();
    announce('The heist is on. Steal the Aurora Diamond, then reach the exit.');
  }

  if (world.phase === 'play') {
    world.time += dt;
    if (world.empTimer > 0) {
      world.empTimer -= dt;
      for (const cam of world.cameras) cam.disabled = Math.max(cam.disabled, world.empTimer);
    }
    updateThief(world.thief, input, dt, world);
    updateGuards(world.guards, world.thief, world.alarm, dt, world);
    updateCameras(world.cameras, world.thief, world.time, dt, world);
    const caught = updateAlarm(world, world.thief, dt);
    for (const cloud of world.smokeClouds) cloud.ttl -= dt;
    world.smokeClouds = world.smokeClouds.filter((c) => c.ttl > 0);
    if (world.coinToss) {
      world.coinToss.ttl -= dt;
      if (world.coinToss.ttl <= 0) world.coinToss = null;
    }

    // Sound cues for what just happened.
    for (const event of world.events) {
      if (event === 'gem') playCue(world.audio, 'gem');
      else if (event === 'diamond') playCue(world.audio, 'diamond');
      else if (event === 'smoke') playCue(world.audio, 'smoke');
      else if (event === 'emp') playCue(world.audio, 'emp');
      else if (event === 'coin') playCue(world.audio, 'coin');
    }
    world.events.length = 0;
    setAlarmTone(world.audio, world.beingSeen);

    if (caught) {
      world.phase = 'caught';
      playCue(world.audio, 'caught');
      setAlarmTone(world.audio, false);
      announce('Caught. The alarm hit 100 percent and the gallery locked down.');
    } else if (world.thief.hasDiamond && insideExit(world.thief.x, world.thief.y)) {
      world.phase = 'win';
      playCue(world.audio, 'win');
      setAlarmTone(world.audio, false);
      announce('Clean getaway. Total take $' + (score() + SCORE_WIN_BONUS) + '.');
    }
  }

  render(ctx, world, canvas.width, canvas.height);
  requestAnimationFrame(frame);
}

announce('The Midnight Vault. Press Enter to begin the heist.');
requestAnimationFrame(frame);

// P pauses the run. It is checked here, outside the loop, so the key
// works the same on every keyboard layout.
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyP') {
    if (world.phase === 'play') world.phase = 'paused';
    else if (world.phase === 'paused') world.phase = 'play';
  }
});
