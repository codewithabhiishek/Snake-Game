import type { SfxName } from "./engine";

type OscType = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem("serpent-muted") === "1";
    } catch {
      this.muted = false;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem("serpent-muted", m ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  /** Must be called from a user gesture at least once. */
  unlock() {
    this.ensure();
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    f0: number,
    f1: number,
    dur: number,
    type: OscType,
    vol: number,
    delay = 0
  ) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f0), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  play(name: SfxName) {
    if (this.muted) return;
    switch (name) {
      case "eat":
        this.tone(520, 860, 0.09, "square", 0.055);
        this.tone(1040, 1560, 0.08, "square", 0.04, 0.055);
        break;
      case "die":
        this.tone(340, 48, 0.55, "sawtooth", 0.09);
        this.tone(180, 40, 0.7, "square", 0.05, 0.06);
        break;
      case "start":
        [392, 523, 659, 784].forEach((f, i) => this.tone(f, f, 0.09, "square", 0.05, i * 0.07));
        break;
      case "pause":
        this.tone(360, 220, 0.1, "triangle", 0.06);
        break;
      case "resume":
        this.tone(220, 420, 0.1, "triangle", 0.06);
        break;
      case "click":
        this.tone(760, 620, 0.05, "square", 0.035);
        break;
      case "turn":
        this.tone(300, 340, 0.03, "square", 0.018);
        break;
      case "best":
        [523, 659, 784, 1046, 1318].forEach((f, i) =>
          this.tone(f, f, 0.12, "square", 0.055, i * 0.09)
        );
        break;
    }
  }
}

export const sfx = new Sfx();
