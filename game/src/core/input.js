// Entrada: teclado + gamepad → botones lógicos estilo Essentials.
// Convención de direcciones RMXP: 2 abajo, 4 izquierda, 6 derecha, 8 arriba.

export const BUTTONS = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B', 'START', 'SELECT', 'RUN', 'L', 'R'];

const DEFAULT_KEYMAP = {
  ArrowUp: 'UP', KeyW: 'UP',
  ArrowDown: 'DOWN', KeyS: 'DOWN',
  ArrowLeft: 'LEFT', KeyA: 'LEFT',
  ArrowRight: 'RIGHT', KeyD: 'RIGHT',
  KeyZ: 'A', Space: 'A', Enter: 'A', NumpadEnter: 'A',
  KeyX: 'B', Escape: 'B', Backspace: 'B',
  KeyC: 'START', Tab: 'START',
  KeyV: 'SELECT',
  ShiftLeft: 'RUN', ShiftRight: 'RUN',
  KeyQ: 'L', KeyE: 'R',
};

// Gamepad estándar (https://w3c.github.io/gamepad/#remapping)
const PAD_MAP = { 0: 'A', 1: 'B', 2: 'RUN', 3: 'START', 8: 'SELECT', 9: 'START', 4: 'L', 5: 'R', 12: 'UP', 13: 'DOWN', 14: 'LEFT', 15: 'RIGHT' };

const REPEAT_DELAY = 15; // frames antes del auto-repeat
const REPEAT_RATE = 4; // frames entre repeticiones

export class Input {
  constructor(target = window) {
    this.keymap = { ...DEFAULT_KEYMAP };
    this.keyDown = new Set();
    this.state = Object.fromEntries(BUTTONS.map((b) => [b, { down: false, frames: 0 }]));
    this.dirOrder = []; // última dirección pulsada tiene prioridad
    this.enabled = true;
    target.addEventListener('keydown', (e) => {
      const b = this.keymap[e.code];
      if (b) {
        e.preventDefault();
        this.keyDown.add(e.code);
      }
    });
    target.addEventListener('keyup', (e) => {
      if (this.keymap[e.code]) e.preventDefault();
      this.keyDown.delete(e.code);
    });
    target.addEventListener('blur', () => this.keyDown.clear());
  }

  /** Llamar una vez por frame lógico. */
  update() {
    const now = new Set();
    for (const code of this.keyDown) now.add(this.keymap[code]);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      pad.buttons.forEach((btn, i) => { if (btn.pressed && PAD_MAP[i]) now.add(PAD_MAP[i]); });
      const [ax, ay] = pad.axes;
      if (ax < -0.5) now.add('LEFT');
      if (ax > 0.5) now.add('RIGHT');
      if (ay < -0.5) now.add('UP');
      if (ay > 0.5) now.add('DOWN');
    }
    for (const b of BUTTONS) {
      const st = this.state[b];
      const isDown = this.enabled && now.has(b);
      st.frames = isDown ? (st.down ? st.frames + 1 : 1) : 0;
      st.down = isDown;
    }
    for (const d of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
      const idx = this.dirOrder.indexOf(d);
      if (this.state[d].frames === 1 && idx < 0) this.dirOrder.push(d);
      if (!this.state[d].down && idx >= 0) this.dirOrder.splice(idx, 1);
    }
  }

  held(b) { return this.state[b].down; }
  pressed(b) { return this.state[b].frames === 1; }
  repeat(b) {
    const f = this.state[b].frames;
    return f === 1 || (f > REPEAT_DELAY && (f - REPEAT_DELAY) % REPEAT_RATE === 0);
  }
  framesHeld(b) { return this.state[b].frames; }

  /** Dirección de 4 vías (la última pulsada gana). */
  dir4() {
    const d = this.dirOrder[this.dirOrder.length - 1];
    return d === 'DOWN' ? 2 : d === 'LEFT' ? 4 : d === 'RIGHT' ? 6 : d === 'UP' ? 8 : 0;
  }

  /** Olvida pulsaciones actuales (tras cerrar un menú para que no se propaguen). */
  flush() {
    for (const b of BUTTONS) this.state[b].frames = this.state[b].down ? 2 : 0;
  }
}
