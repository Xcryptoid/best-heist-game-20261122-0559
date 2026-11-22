// Keyboard and mouse state, read fresh every frame by the game loop.

export function createInput() {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    sprint: false,
    interact: false,
    // A click becomes a one-shot coin toss: the loop consumes it.
    click: null,
    // One-shot tool keys: the loop consumes each press once.
    toolQueue: [],
  };

  const keys = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    KeyE: 'interact',
  };

  window.addEventListener('keydown', (event) => {
    const field = keys[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'Digit1' || event.code === 'Digit2') {
      input.toolQueue.push(event.code === 'Digit1' ? 'smoke' : 'emp');
    }
    if (event.code === 'Enter' || event.code === 'Space') {
      input.toolQueue.push('confirm');
    }
  });

  window.addEventListener('keyup', (event) => {
    const field = keys[event.code];
    if (field) input[field] = false;
  });

  window.addEventListener('mousedown', (event) => {
    input.click = { x: event.clientX, y: event.clientY };
  });

  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
    input.sneak = input.sprint = input.interact = false;
  });

  return input;
}
