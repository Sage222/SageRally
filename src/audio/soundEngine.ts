import { TrackId } from '../types/game';

// Procedural Web Audio Synthesizer & 16-Bit Retro Arcade Soundtrack Engine for Sage Rally
// Generates engine RPM hum, twin autocannon fire, metallic hits, oil slick spin-outs, boost whooshes,
// race countdowns, and 5 distinct circuit chiptune soundtracks (mixed 50% lower than sound effects).

interface RetroTrackSong {
  bpm: number;
  /** 32-step (2-bar 16th-note) A-section heroic lead MIDI notes (0 = rest, -1 = sustain previous note) */
  melodyA: number[];
  /** 32-step (2-bar 16th-note) B-section heroic lead MIDI notes (0 = rest, -1 = sustain previous note) */
  melodyB: number[];
  /** 32-step CPS-1 slap FM bassline MIDI notes (0 = rest) */
  bass: number[];
  /** 8 power-chord / brass triad voicings (one per 8 steps) for SF2 syncopated brass stabs */
  brassChords: [number, number, number][];
  /** 16-step syncopated brass stab rhythm mask (1 = punchy SF2 brass hit, 0 = rest) */
  stabPattern: number[];
}

const RETRO_SOUNDTRACKS: Record<TrackId, RetroTrackSong> = {
  // 1. GeneRally Forest GP — "Guile's Airbase Stage Style" (Heroic F# Minor / D / E CPS-1 Brass Fanfare)
  pinewood_gp: {
    bpm: 136,
    melodyA: [
      78, -1, 78, 76, 78, -1, 73, -1, 0, 73, 76, 78, 81, -1, 78, 76,
      74, -1, 74, 73, 74, -1, 69, -1, 0, 71, 73, 74, 76, -1, 80, -1,
    ],
    melodyB: [
      81, -1, 85, -1, 83, 81, 78, -1, 74, -1, 78, 81, 80, -1, 76, -1,
      78, 80, 81, 85, 86, -1, 85, 81, 80, -1, 83, 80, 78, -1, -1, 0,
    ],
    bass: [
      42, 42, 54, 42, 0, 42, 49, 52, 38, 38, 50, 38, 0, 38, 45, 49,
      40, 40, 52, 40, 0, 40, 47, 50, 42, 42, 54, 42, 40, 40, 42, 54,
    ],
    brassChords: [
      [66, 69, 73], // F#m
      [62, 66, 69], // D
      [64, 68, 71], // E
      [66, 69, 73], // F#m
      [62, 66, 69], // D
      [64, 68, 71], // E
      [61, 65, 68], // C#
      [66, 69, 73], // F#m
    ],
    stabPattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },

  // 2. R.C. Pro-Am Championship — "Ken's Harbor Stage Style" (Driving G Minor / Eb / F Hard-Rock FM Anthem)
  pro_am_circuit: {
    bpm: 144,
    melodyA: [
      79, -1, 79, 82, 81, -1, 79, 77, 74, -1, 70, -1, 74, 77, 79, 81,
      82, -1, 82, 86, 84, -1, 81, 79, 81, -1, 84, -1, 86, -1, -1, 0,
    ],
    melodyB: [
      86, -1, 89, 86, 84, -1, 81, 79, 75, -1, 79, 82, 81, -1, 77, -1,
      79, 81, 82, 86, 87, -1, 86, 82, 84, -1, 86, 89, 86, -1, -1, 0,
    ],
    bass: [
      43, 43, 55, 43, 43, 55, 46, 50, 39, 39, 51, 39, 41, 41, 53, 41,
      43, 43, 55, 43, 43, 55, 46, 50, 39, 39, 51, 39, 41, 53, 42, 54,
    ],
    brassChords: [
      [67, 70, 74], // Gm
      [63, 67, 70], // Eb
      [65, 69, 72], // F
      [62, 66, 69], // D
      [67, 70, 74], // Gm
      [63, 67, 70], // Eb
      [65, 69, 72], // F
      [67, 70, 74], // Gm
    ],
    stabPattern: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  },

  // 3. Ironman Baja Stadium — "Ryu's Suzaku Castle Style" (Urgent C Minor / Bb / Ab Martial-Arts Fighter Hook)
  ironman_baja: {
    bpm: 138,
    melodyA: [
      72, 0, 72, 75, 79, -1, 77, 75, 74, -1, 70, -1, 74, 75, 77, 74,
      72, 0, 72, 75, 80, -1, 79, 75, 74, -1, 77, 75, 72, -1, -1, 0,
    ],
    melodyB: [
      84, -1, 82, 79, 80, -1, 79, 75, 77, -1, 74, -1, 75, 77, 79, 82,
      84, -1, 87, 84, 82, -1, 79, 77, 79, -1, 82, 83, 84, -1, -1, 0,
    ],
    bass: [
      36, 48, 36, 48, 36, 48, 39, 43, 34, 46, 34, 46, 34, 46, 38, 41,
      32, 44, 32, 44, 34, 46, 34, 46, 36, 48, 36, 48, 35, 47, 36, 48,
    ],
    brassChords: [
      [60, 63, 67], // Cm
      [58, 62, 65], // Bb
      [56, 60, 63], // Ab
      [55, 59, 62], // G
      [60, 63, 67], // Cm
      [56, 60, 63], // Ab
      [58, 62, 65], // Bb
      [60, 63, 67], // Cm
    ],
    stabPattern: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0],
  },

  // 4. Alpine Glacier Switchbacks — "Cammy's High-Altitude Style" (Soaring A Minor / F / G / E Heroic CPS-1 Lead)
  alpine_pass: {
    bpm: 142,
    melodyA: [
      81, -1, 76, 79, 81, -1, 84, 81, 79, -1, 76, 72, 74, -1, -1, 0,
      77, -1, 72, 76, 77, -1, 81, 77, 76, -1, 79, 83, 80, -1, -1, 0,
    ],
    melodyB: [
      84, -1, 88, 84, 83, -1, 79, 83, 81, -1, 76, 79, 77, -1, 74, -1,
      76, 79, 81, 84, 86, -1, 84, 83, 81, -1, 84, 88, 81, -1, -1, 0,
    ],
    bass: [
      45, 45, 57, 45, 45, 57, 48, 52, 41, 41, 53, 41, 43, 43, 55, 43,
      45, 45, 57, 45, 41, 41, 53, 41, 43, 43, 55, 43, 40, 52, 44, 56,
    ],
    brassChords: [
      [57, 60, 64], // Am
      [53, 57, 60], // F
      [55, 59, 62], // G
      [52, 56, 59], // E
      [57, 60, 64], // Am
      [53, 57, 60], // F
      [55, 59, 62], // G
      [57, 60, 64], // Am
    ],
    stabPattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
  },

  // 5. Thunder Valley Endurance — "Vega / Bison Showdown Style" (Fast D Minor / Bb / C / A Spanish-Boss Brass)
  thunder_valley: {
    bpm: 150,
    melodyA: [
      74, 0, 74, 77, 81, -1, 79, 77, 76, -1, 73, -1, 76, 77, 79, 76,
      74, 0, 77, 81, 82, -1, 81, 77, 79, -1, 84, 82, 81, -1, -1, 0,
    ],
    melodyB: [
      86, -1, 89, 86, 85, -1, 81, -1, 82, 84, 86, 82, 81, -1, 77, -1,
      76, 79, 81, 85, 86, -1, 84, 82, 81, -1, 85, 88, 86, -1, -1, 0,
    ],
    bass: [
      38, 50, 38, 50, 38, 50, 41, 45, 34, 46, 34, 46, 36, 48, 36, 48,
      38, 50, 38, 50, 34, 46, 34, 46, 36, 48, 37, 49, 38, 50, 37, 49,
    ],
    brassChords: [
      [62, 65, 69], // Dm
      [58, 62, 65], // Bb
      [60, 64, 67], // C
      [57, 61, 64], // A
      [62, 65, 69], // Dm
      [58, 62, 65], // Bb
      [60, 64, 67], // C
      [62, 65, 69], // Dm
    ],
    stabPattern: [1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
  },
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineRunning: boolean = false;

  // Street Fighter II CPS-1 FM Soundtrack Sequencer State (30% quieter: 0.235 active / 0.108 paused)
  private musicBus: GainNode | null = null;
  private activeTrackId: TrackId = 'pinewood_gp';
  private musicPlaying: boolean = false;
  private musicTimerId: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private noiseBuffer: AudioBuffer | null = null;

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.musicBus) {
      this.musicBus = this.ctx.createGain();
      // 30% quieter than previous 0.336 level (0.336 * 0.70 = 0.235)
      this.musicBus.gain.value = 0.235;
      this.musicBus.connect(this.ctx.destination);
    }
    if (this.ctx && !this.noiseBuffer) {
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buf;
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(
          muted ? 0 : 0.038,
          this.ctx.currentTime,
          0.05
        );
      }
      if (this.musicBus) {
        this.musicBus.gain.setTargetAtTime(
          muted ? 0 : 0.235,
          this.ctx.currentTime,
          0.05
        );
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startEngineLoop() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.engineRunning) {
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.value = 55;
        osc2.frequency.value = 110;

        filter.type = 'lowpass';
        filter.frequency.value = 300;

        gain.gain.value = 0.035;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        this.engineOsc = osc1;
        this.engineSubOsc = osc2;
        this.engineGain = gain;
        this.engineRunning = true;
      } catch {
        // Ignore audio autoplay block until user interacts
      }
    }

    if (!this.musicPlaying) {
      this.startTrackMusic(this.activeTrackId);
    }
  }

  public startTrackMusic(trackId: TrackId) {
    const isTrackChange = this.activeTrackId !== trackId;
    this.activeTrackId = trackId;

    const ctx = this.ensureContext();
    if (!ctx) return;

    if (isTrackChange) {
      this.currentStep = 0;
    }

    if (this.musicPlaying) return;

    this.musicPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;

    const scheduleAheadTime = 0.14;
    const scheduler = () => {
      if (!this.musicPlaying || !this.ctx) return;
      if (this.isMuted || this.ctx.state !== 'running') {
        this.nextStepTime = this.ctx.currentTime + 0.08;
        return;
      }

      const song = RETRO_SOUNDTRACKS[this.activeTrackId];
      const stepDuration = 60 / song.bpm / 4; // 16th note duration

      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
        this.scheduleRetroStep(
          song,
          this.currentStep,
          this.nextStepTime,
          stepDuration
        );
        this.nextStepTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 64;
      }
    };

    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
    }
    this.musicTimerId = window.setInterval(scheduler, 40);
  }

  private scheduleRetroStep(
    song: RetroTrackSong,
    step64: number,
    time: number,
    stepDur: number
  ) {
    if (!this.ctx || !this.musicBus) return;

    const step32 = step64 % 32;
    const isSectionB = step64 >= 32;
    const melodyArr = isSectionB ? song.melodyB : song.melodyA;

    // 1. Street Fighter II CPS-1 YM2151 FM Brass / Synth-Guitar Lead (with sustain & vibrato)
    const leadMidi = melodyArr[step32];
    if (leadMidi > 0) {
      // Count how many consecutive -1 sustain steps follow this note
      let holdSteps = 1;
      for (let s = step32 + 1; s < 32 && melodyArr[s] === -1; s++) {
        holdSteps++;
      }
      const noteDuration = stepDur * holdSteps * 0.96;
      const baseFreq = midiToFreq(leadMidi);

      const carrier = this.ctx.createOscillator();
      const subHarmony = this.ctx.createOscillator();
      const modOsc = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // 2-Operator FM Brass/Lead timbre + detuned unison sawtooth
      carrier.type = 'sawtooth';
      subHarmony.type = 'square';
      modOsc.type = 'sine';

      carrier.frequency.setValueAtTime(baseFreq, time);
      subHarmony.frequency.setValueAtTime(baseFreq * 1.003, time);
      modOsc.frequency.setValueAtTime(baseFreq * 2.0, time);

      // FM modulation index envelope (punchy brass attack that mellows into warm sustain)
      modGain.gain.setValueAtTime(baseFreq * 1.35, time);
      modGain.gain.exponentialRampToValueAtTime(
        baseFreq * 0.28,
        time + Math.min(0.14, noteDuration * 0.6)
      );

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.048, time + 0.012);
      gain.gain.setValueAtTime(0.042, time + noteDuration * 0.72);
      gain.gain.exponentialRampToValueAtTime(0.002, time + noteDuration);

      modOsc.connect(modGain);
      modGain.connect(carrier.frequency);

      carrier.connect(filter);
      subHarmony.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicBus);

      modOsc.start(time);
      carrier.start(time);
      subHarmony.start(time);

      modOsc.stop(time + noteDuration + 0.02);
      carrier.stop(time + noteDuration + 0.02);
      subHarmony.stop(time + noteDuration + 0.02);
    }

    // 2. CPS-1 FM Slap Bass (Metallic YM2151 2-Operator FM Bass)
    const bassMidi = song.bass[step32];
    if (bassMidi > 0) {
      const bFreq = midiToFreq(bassMidi);
      const bCarrier = this.ctx.createOscillator();
      const bMod = this.ctx.createOscillator();
      const bModGain = this.ctx.createGain();
      const bGain = this.ctx.createGain();

      bCarrier.type = 'sine';
      bMod.type = 'triangle';
      bCarrier.frequency.setValueAtTime(bFreq, time);
      bMod.frequency.setValueAtTime(bFreq * 2.0, time);

      // Crisp slap-bass FM harmonic bite on attack
      bModGain.gain.setValueAtTime(bFreq * 2.8, time);
      bModGain.gain.exponentialRampToValueAtTime(bFreq * 0.35, time + stepDur * 0.75);

      bGain.gain.setValueAtTime(0.072, time);
      bGain.gain.exponentialRampToValueAtTime(0.004, time + stepDur * 0.92);

      bMod.connect(bModGain);
      bModGain.connect(bCarrier.frequency);
      bCarrier.connect(bGain);
      bGain.connect(this.musicBus);

      bMod.start(time);
      bCarrier.start(time);
      bMod.stop(time + stepDur * 0.95);
      bCarrier.stop(time + stepDur * 0.95);
    }

    // 3. Street Fighter II Syncopated FM Brass Power-Chord Stabs
    const stabActive = song.stabPattern[step64 % 16] === 1;
    if (stabActive) {
      const chordIdx = Math.floor(step64 / 8) % song.brassChords.length;
      const chord = song.brassChords[chordIdx];
      const stabGain = this.ctx.createGain();
      const stabFilter = this.ctx.createBiquadFilter();

      stabFilter.type = 'lowpass';
      stabFilter.frequency.setValueAtTime(2600, time);
      stabFilter.frequency.exponentialRampToValueAtTime(750, time + stepDur * 1.4);

      stabGain.gain.setValueAtTime(0.022, time);
      stabGain.gain.exponentialRampToValueAtTime(0.002, time + stepDur * 1.45);

      stabFilter.connect(stabGain);
      stabGain.connect(this.musicBus);

      for (const note of chord) {
        const cOsc = this.ctx.createOscillator();
        cOsc.type = 'sawtooth';
        cOsc.frequency.setValueAtTime(midiToFreq(note), time);
        cOsc.connect(stabFilter);
        cOsc.start(time);
        cOsc.stop(time + stepDur * 1.5);
      }
    }

    // 4. Punchy CPS-1 Arcade Drums (Kick, Gated Reverb Snare + Tom Fills, Crisp Hi-Hats)
    const beatStep = step64 % 16;
    if (beatStep === 0 || beatStep === 6 || beatStep === 8 || beatStep === 14) {
      // Punchy Arcade FM Kick
      const kOsc = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kOsc.type = 'sine';
      kOsc.frequency.setValueAtTime(155, time);
      kOsc.frequency.exponentialRampToValueAtTime(38, time + 0.085);

      kGain.gain.setValueAtTime(0.08, time);
      kGain.gain.exponentialRampToValueAtTime(0.001, time + 0.095);

      kOsc.connect(kGain);
      kGain.connect(this.musicBus);
      kOsc.start(time);
      kOsc.stop(time + 0.1);
    }

    if (beatStep === 4 || beatStep === 12) {
      // Classic SF2 Punchy Gated Arcade Snare (Body tone + White Noise)
      const sTone = this.ctx.createOscillator();
      const sToneGain = this.ctx.createGain();
      sTone.type = 'triangle';
      sTone.frequency.setValueAtTime(220, time);
      sTone.frequency.exponentialRampToValueAtTime(110, time + 0.07);
      sToneGain.gain.setValueAtTime(0.042, time);
      sToneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);
      sTone.connect(sToneGain);
      sToneGain.connect(this.musicBus);
      sTone.start(time);
      sTone.stop(time + 0.08);

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.setValueAtTime(550, time);
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.052, time);
        sGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

        noise.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.musicBus);
        noise.start(time);
        noise.stop(time + 0.115);
      }
    } else if (step64 >= 60) {
      // End-of-4-bar SF2 Arcade Synth Tom Fill (Steps 60, 61, 62, 63)
      const tomPitches = [190, 160, 130, 105];
      const tFreq = tomPitches[step64 - 60];
      const tOsc = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      tOsc.type = 'sine';
      tOsc.frequency.setValueAtTime(tFreq, time);
      tOsc.frequency.exponentialRampToValueAtTime(tFreq * 0.55, time + 0.09);
      tGain.gain.setValueAtTime(0.058, time);
      tGain.gain.exponentialRampToValueAtTime(0.001, time + 0.095);
      tOsc.connect(tGain);
      tGain.connect(this.musicBus);
      tOsc.start(time);
      tOsc.stop(time + 0.1);
    } else if (beatStep % 2 === 1 && this.noiseBuffer) {
      // Crisp Arcade Hi-Hat
      const hh = this.ctx.createBufferSource();
      hh.buffer = this.noiseBuffer;
      const hFilter = this.ctx.createBiquadFilter();
      hFilter.type = 'highpass';
      hFilter.frequency.setValueAtTime(5600, time);
      const hGain = this.ctx.createGain();
      hGain.gain.setValueAtTime(0.022, time);
      hGain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      hh.connect(hFilter);
      hFilter.connect(hGain);
      hGain.connect(this.musicBus);
      hh.start(time);
      hh.stop(time + 0.04);
    }
  }

  public updateEngineRpm(
    normalizedSpeed: number,
    isAirborne: boolean,
    isPaused: boolean,
    trackId?: TrackId
  ) {
    if (trackId && trackId !== this.activeTrackId) {
      this.activeTrackId = trackId;
      this.currentStep = 0;
    }

    if (!this.engineRunning || !this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineGain) {
      return;
    }
    if (this.isMuted || isPaused) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      if (this.musicBus) {
        this.musicBus.gain.setTargetAtTime(
          this.isMuted ? 0 : 0.108,
          this.ctx.currentTime,
          0.08
        );
      }
      return;
    }

    if (this.musicBus) {
      // Keep soundtrack volume 30% quieter (0.336 * 0.70 = 0.235)
      this.musicBus.gain.setTargetAtTime(0.235, this.ctx.currentTime, 0.08);
    }

    const baseFreq =
      48 + Math.min(1.3, Math.max(0, normalizedSpeed)) * 125 + (isAirborne ? 35 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.04);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 1.5, this.ctx.currentTime, 0.04);
    this.engineGain.gain.setTargetAtTime(0.038, this.ctx.currentTime, 0.06);
  }

  public playGunFire() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playWeaponHit() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playOilDrop() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playSpinOut() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.18);
    osc.frequency.linearRampToValueAtTime(520, now + 0.35);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playBoost() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.28);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.31);
  }

  public playPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.12); // G5

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCountdownTone(isGo: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.38 : 0.18));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (isGo ? 0.4 : 0.2));
  }
}

export const soundEngine = new SoundEngine();
