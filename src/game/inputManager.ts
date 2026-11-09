import { ConnectedGamepadInfo, ControlType } from '../types/game';

export interface VehicleControlInput {
  steer: number; // -1 (left) to +1 (right)
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  fireGun: boolean;
  dropOil: boolean;
  useNitro: boolean;
}

const DEADZONE = 0.14;

function applyDeadzone(val: number): number {
  if (Math.abs(val) < DEADZONE) return 0;
  const sign = Math.sign(val);
  return sign * ((Math.abs(val) - DEADZONE) / (1 - DEADZONE));
}

const GAME_CONTROL_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyE',
  'KeyQ',
  'KeyF',
  'KeyC',
  'KeyN',
  'KeyM',
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftRight',
  'ShiftLeft',
  'ControlRight',
  'Enter',
  'Slash',
  'Period',
]);

export class InputManager {
  private keys = new Set<string>();
  private prevGamepadButtons: Record<number, boolean[]> = {};
  private prevKeys = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDown, { passive: false });
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('blur', this.onBlur);
    }
  }

  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.onBlur);
    }
  }

  private onBlur = () => {
    this.keys.clear();
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isFormField =
      target &&
      (target.tagName === 'SELECT' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA');

    if (!isFormField && GAME_CONTROL_KEYS.has(e.code)) {
      e.preventDefault();
      if (target && target.tagName === 'BUTTON') {
        target.blur();
      }
    }
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  public isKeyPressed(code: string): boolean {
    return this.keys.has(code);
  }

  public isKeyJustPressed(code: string): boolean {
    return this.keys.has(code) && !this.prevKeys.has(code);
  }

  public endFrame() {
    this.prevKeys = new Set(this.keys);
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (pad) {
          this.prevGamepadButtons[pad.index] = pad.buttons.map((b) => b.pressed);
        }
      }
    }
  }

  /**
   * Scans all connected Xbox / standard HTML5 gamepads for the Lobby & HUD
   */
  public getConnectedGamepads(): ConnectedGamepadInfo[] {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
    const pads = navigator.getGamepads();
    const list: ConnectedGamepadInfo[] = [];

    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (!pad || !pad.connected) continue;

      const rawSteer = pad.axes[0] ?? 0;
      const dpadLeft = pad.buttons[14]?.pressed ? -1 : 0;
      const dpadRight = pad.buttons[15]?.pressed ? 1 : 0;
      const steer = dpadLeft || dpadRight || applyDeadzone(rawSteer);

      // Xbox RT (button 7) or Up (button 12)
      const throttle = Math.max(
        pad.buttons[7]?.value ?? 0,
        pad.buttons[12]?.pressed ? 1 : 0
      );
      // Xbox LT (button 6) or Down (button 13)
      const brake = Math.max(
        pad.buttons[6]?.value ?? 0,
        pad.buttons[13]?.pressed ? 1 : 0
      );

      // Fire Gun (3/lap): RB (5) or X (2) or A (0)
      const fireButton = Boolean(
        pad.buttons[5]?.pressed || pad.buttons[2]?.pressed || pad.buttons[0]?.pressed
      );
      // Drop Oil Slick (2/lap): LB (4) or B (1)
      const oilButton = Boolean(
        pad.buttons[4]?.pressed || pad.buttons[1]?.pressed
      );
      // Nitro Boost (3/lap): Y (3) or L3 (10)
      const nitroButton = Boolean(
        pad.buttons[3]?.pressed || pad.buttons[10]?.pressed
      );

      list.push({
        index: pad.index,
        id: pad.id,
        steer,
        throttle,
        brake,
        fireButton,
        oilButton,
        nitroButton,
        aButton: Boolean(pad.buttons[0]?.pressed),
      });
    }
    return list;
  }

  private sampleGamepadByIndex(gamepadIndex: number): VehicleControlInput | null {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    const pad = navigator.getGamepads()[gamepadIndex];
    if (!pad || !pad.connected) return null;

    const prev = this.prevGamepadButtons[gamepadIndex] || [];
    const rawSteer = pad.axes[0] ?? 0;
    const dpadLeft = pad.buttons[14]?.pressed ? -1 : 0;
    const dpadRight = pad.buttons[15]?.pressed ? 1 : 0;
    const steer = dpadLeft || dpadRight || applyDeadzone(rawSteer);

    const throttle = Math.max(
      pad.buttons[7]?.value ?? 0,
      pad.buttons[12]?.pressed ? 1 : 0
    );
    const brake = Math.max(
      pad.buttons[6]?.value ?? 0,
      pad.buttons[13]?.pressed ? 1 : 0
    );

    const fireNow = Boolean(
      pad.buttons[5]?.pressed || pad.buttons[2]?.pressed || pad.buttons[0]?.pressed
    );
    const firePrev = Boolean(prev[5] || prev[2] || prev[0]);

    const oilNow = Boolean(pad.buttons[4]?.pressed || pad.buttons[1]?.pressed);
    const oilPrev = Boolean(prev[4] || prev[1]);

    const nitroNow = Boolean(pad.buttons[3]?.pressed || pad.buttons[10]?.pressed);
    const nitroPrev = Boolean(prev[3] || prev[10]);

    return {
      steer,
      throttle,
      brake,
      fireGun: fireNow && !firePrev,
      dropOil: oilNow && !oilPrev,
      useNitro: nitroNow && !nitroPrev,
    };
  }

  public sampleInput(
    controlType: ControlType,
    gamepadIndex: number | null,
    allowUnifiedFallback: boolean = false
  ): VehicleControlInput {
    if (controlType === 'keyboard_wasd') {
      let left = this.keys.has('KeyA') ? -1 : 0;
      let right = this.keys.has('KeyD') ? 1 : 0;
      let throttle = this.keys.has('KeyW') ? 1 : 0;
      let brake = this.keys.has('KeyS') ? 1 : 0;
      let fireGun =
        this.isKeyJustPressed('Space') || this.isKeyJustPressed('KeyF');
      let dropOil =
        this.isKeyJustPressed('KeyE') || this.isKeyJustPressed('KeyQ');
      let useNitro =
        this.isKeyJustPressed('ShiftLeft') ||
        this.isKeyJustPressed('KeyC') ||
        this.isKeyJustPressed('KeyN');

      if (allowUnifiedFallback) {
        if (left === 0 && right === 0) {
          left = this.keys.has('ArrowLeft') ? -1 : 0;
          right = this.keys.has('ArrowRight') ? 1 : 0;
        }
        if (throttle === 0) throttle = this.keys.has('ArrowUp') ? 1 : 0;
        if (brake === 0) brake = this.keys.has('ArrowDown') ? 1 : 0;
        if (!fireGun) {
          fireGun =
            this.isKeyJustPressed('ShiftRight') ||
            this.isKeyJustPressed('Slash');
        }
        if (!dropOil) {
          dropOil =
            this.isKeyJustPressed('Enter') || this.isKeyJustPressed('Period');
        }
        if (!useNitro) {
          useNitro =
            this.isKeyJustPressed('ControlRight') ||
            this.isKeyJustPressed('KeyM');
        }

        const pad0 = this.sampleGamepadByIndex(0);
        if (pad0) {
          if (Math.abs(pad0.steer) > Math.abs(left + right)) {
            left = pad0.steer;
            right = 0;
          }
          if (pad0.throttle > throttle) throttle = pad0.throttle;
          if (pad0.brake > brake) brake = pad0.brake;
          if (pad0.fireGun) fireGun = true;
          if (pad0.dropOil) dropOil = true;
          if (pad0.useNitro) useNitro = true;
        }
      }

      return {
        steer: THREE_MathUtils_clamp(left + right, -1, 1),
        throttle,
        brake,
        fireGun,
        dropOil,
        useNitro,
      };
    }

    if (controlType === 'keyboard_arrows') {
      const left = this.keys.has('ArrowLeft') ? -1 : 0;
      const right = this.keys.has('ArrowRight') ? 1 : 0;
      const throttle = this.keys.has('ArrowUp') ? 1 : 0;
      const brake = this.keys.has('ArrowDown') ? 1 : 0;
      const fireGun =
        this.isKeyJustPressed('ShiftRight') ||
        this.isKeyJustPressed('Slash') ||
        this.isKeyJustPressed('Numpad0');
      const dropOil =
        this.isKeyJustPressed('Enter') ||
        this.isKeyJustPressed('Period');
      const useNitro =
        this.isKeyJustPressed('ControlRight') ||
        this.isKeyJustPressed('KeyM') ||
        this.isKeyJustPressed('NumpadDecimal');

      return {
        steer: left + right,
        throttle,
        brake,
        fireGun,
        dropOil,
        useNitro,
      };
    }

    if (controlType === 'gamepad' && gamepadIndex !== null) {
      const gpInput = this.sampleGamepadByIndex(gamepadIndex);
      if (gpInput) return gpInput;
    }

    return {
      steer: 0,
      throttle: 0,
      brake: 0,
      fireGun: false,
      dropOil: false,
      useNitro: false,
    };
  }

  public triggerRumble(
    gamepadIndex: number | null,
    durationMs: number = 120,
    strongMagnitude: number = 0.6,
    weakMagnitude: number = 0.4
  ) {
    if (
      gamepadIndex === null ||
      typeof navigator === 'undefined' ||
      !navigator.getGamepads
    ) {
      return;
    }
    const pad = navigator.getGamepads()[gamepadIndex] as Gamepad & {
      vibrationActuator?: {
        playEffect?: (
          type: string,
          params: {
            startDelay: number;
            duration: number;
            weakMagnitude: number;
            strongMagnitude: number;
          }
        ) => Promise<void>;
      };
    };

    if (pad?.vibrationActuator?.playEffect) {
      pad.vibrationActuator
        .playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude,
          strongMagnitude,
        })
        .catch(() => {});
    }
  }
}

function THREE_MathUtils_clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
