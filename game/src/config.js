// The Midnight Vault — tuning constants for the whole game.
// Every number lives here so a single file sets the feel of the heist.

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 600;

// Thief movement.
export const THIEF_RADIUS = 12;
export const THIEF_WALK_SPEED = 150;
export const THIEF_SNEAK_SPEED = 88;
export const THIEF_SPRINT_SPEED = 205;

// Guards.
export const GUARD_RADIUS = 13;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_ALERT_SPEED = 118;
export const GUARD_CONE_RANGE = 185;
export const GUARD_CONE_HALF_ANGLE = 0.61; // ~35 degrees each side
export const GUARD_INVESTIGATE_SECONDS = 4;

// Cameras.
export const CAMERA_RANGE = 215;
export const CAMERA_HALF_ANGLE = 0.42; // ~24 degrees each side
export const CAMERA_SWEEP_SPEED = 0.55; // radians per second

// The alarm meter runs 0..100. Being seen fills it; hiding drains it.
export const ALARM_GUARD_RATE = 42;
export const ALARM_CAMERA_RATE = 58;
export const ALARM_SNEAK_FACTOR = 0.5;
export const ALARM_DECAY_RATE = 9;
export const ALARM_ALERT_THRESHOLD = 55; // guards start hunting above this

// Tools. Each costs a charge; charges are the heist's budget.
export const SMOKE_START_COUNT = 3;
export const SMOKE_RADIUS = 78;
export const SMOKE_SECONDS = 4;
export const EMP_START_COUNT = 2;
export const EMP_SECONDS = 6;
export const COIN_START_COUNT = 6;

// The diamond's display case: stand close and hold the key to crack it.
export const LOCKPICK_SECONDS = 2.0;
export const LOCKPICK_RANGE = 46;

// Scoring.
export const SCORE_DIAMOND = 500;
export const SCORE_GEM = 100;
export const SCORE_WIN_BONUS = 250;

// Colours: night gallery — warm floor, cold danger, bright loot.
export const COLORS = {
  floor: '#40301f',
  floorAlt: '#4a3826',
  marble: '#54432f',
  wall: '#17120e',
  wallTop: '#4a3a2a',
  pedestal: '#241a12',
  pedestalTop: '#5c4632',
  caseGlass: '#9fd8e8',
  diamond: '#7fe7ff',
  gem: '#ffd75e',
  exit: '#39d98a',
  exitDark: '#1d7a4c',
  thief: '#e8e4da',
  thiefHood: '#23202b',
  guard: '#3f6fb5',
  guardCap: '#dfe6f2',
  coneGuard: 'rgba(255, 214, 90, 0.24)',
  coneGuardEdge: 'rgba(255, 214, 90, 0.5)',
  coneCamera: 'rgba(255, 84, 84, 0.24)',
  coneCameraEdge: 'rgba(255, 84, 84, 0.55)',
  smoke: 'rgba(200, 200, 210, 0.55)',
  alarmLow: '#39d98a',
  alarmMid: '#ffd75e',
  alarmHigh: '#ff5252',
  text: '#f2ead9',
  textDim: '#b8a98c',
};
