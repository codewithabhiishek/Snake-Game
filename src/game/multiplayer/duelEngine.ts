import { COLS, ROWS, type Dir, type SfxName, type Vec } from "../engine.ts";
import type {
  DuelGameState,
  DuelParticle,
  DuelSnake,
  DuelStatus,
  PlayerId,
  RoomPlayer,
} from "./types.ts";

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const DUEL_COLS = COLS;
export const DUEL_ROWS = ROWS;
export const TARGET_WINS = 3;
export const DUEL_TICK = 110; // 110ms per step

export function randomEmptyDuelCell(
  snakes: Record<PlayerId, DuelSnake>,
  existingFood: Vec[] = []
): Vec {
  const occupied = new Set<string>();
  for (const s of Object.values(snakes)) {
    for (const b of s.body) {
      occupied.add(`${b.x},${b.y}`);
    }
  }
  for (const f of existingFood) {
    occupied.add(`${f.x},${f.y}`);
  }

  const free: Vec[] = [];
  for (let y = 0; y < DUEL_ROWS; y++) {
    for (let x = 0; x < DUEL_COLS; x++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return { x: 10, y: 10 };
  return free[Math.floor(Math.random() * free.length)];
}

export function createInitialDuelSnakes(): Record<PlayerId, DuelSnake> {
  const midY = Math.floor(DUEL_ROWS / 2);
  const p1Body: Vec[] = [
    { x: 4, y: midY },
    { x: 3, y: midY },
    { x: 2, y: midY },
    { x: 1, y: midY },
  ];
  const p2Body: Vec[] = [
    { x: DUEL_COLS - 5, y: midY },
    { x: DUEL_COLS - 4, y: midY },
    { x: DUEL_COLS - 3, y: midY },
    { x: DUEL_COLS - 2, y: midY },
  ];

  return {
    p1: {
      id: "p1",
      body: p1Body,
      prevBody: p1Body.map((v) => ({ ...v })),
      dir: "right",
      alive: true,
      deathReason: null,
      applesEaten: 0,
    },
    p2: {
      id: "p2",
      body: p2Body,
      prevBody: p2Body.map((v) => ({ ...v })),
      dir: "left",
      alive: true,
      deathReason: null,
      applesEaten: 0,
    },
  };
}

export class DuelEngine {
  state: DuelGameState;
  players: Record<PlayerId, RoomPlayer>;
  inputQueues: Record<PlayerId, Dir[]> = { p1: [], p2: [] };
  particles: DuelParticle[] = [];
  shake = 0;
  flash = 0;
  sfxQueue: SfxName[] = [];
  acc = 0;
  roundTimer = 0;

  private onStateChange?: (state: DuelGameState, players: RoomPlayer[]) => void;
  private onSfx?: (name: SfxName) => void;

  constructor(
    hostPlayer: RoomPlayer,
    guestPlayer?: RoomPlayer,
    callbacks?: {
      onStateChange?: (state: DuelGameState, players: RoomPlayer[]) => void;
      onSfx?: (name: SfxName) => void;
    }
  ) {
    this.players = {
      p1: hostPlayer,
      p2: guestPlayer ?? {
        id: "p2",
        name: "Waiting...",
        themeId: "synthwave",
        ready: false,
        score: 0,
        connected: false,
      },
    };
    this.onStateChange = callbacks?.onStateChange;
    this.onSfx = callbacks?.onSfx;

    const snakes = createInitialDuelSnakes();
    const food1 = randomEmptyDuelCell(snakes);
    const food2 = randomEmptyDuelCell(snakes, [food1]);

    this.state = {
      cols: DUEL_COLS,
      rows: DUEL_ROWS,
      status: "lobby",
      round: 1,
      targetWins: TARGET_WINS,
      countdown: 3,
      snakes,
      food: [food1, food2],
      wins: { p1: 0, p2: 0 },
      roundWinner: null,
      matchWinner: null,
      time: 0,
      tick: DUEL_TICK,
    };
  }

  setGuest(guest: RoomPlayer) {
    this.players.p2 = guest;
    this.emitSync();
  }

  queueTurn(id: PlayerId, dir: Dir) {
    const s = this.state.snakes[id];
    if (!s || !s.alive || this.state.status !== "playing") return;
    const q = this.inputQueues[id];
    const ref = q.length > 0 ? q[q.length - 1] : s.dir;
    if (dir === ref || dir === OPPOSITE[ref]) return;
    if (q.length < 2) {
      q.push(dir);
      this.triggerSfx("turn");
    }
  }

  startCountdown() {
    this.state.status = "countdown";
    this.state.countdown = 3;
    this.roundTimer = 0;
    this.inputQueues = { p1: [], p2: [] };
    this.state.snakes = createInitialDuelSnakes();
    const food1 = randomEmptyDuelCell(this.state.snakes);
    const food2 = randomEmptyDuelCell(this.state.snakes, [food1]);
    this.state.food = [food1, food2];
    this.state.roundWinner = null;
    this.triggerSfx("start");
    this.emitSync();
  }

  startMatch() {
    this.state.wins = { p1: 0, p2: 0 };
    this.state.round = 1;
    this.state.matchWinner = null;
    this.players.p1.score = 0;
    this.players.p2.score = 0;
    this.startCountdown();
  }

  rematch() {
    this.startMatch();
  }

  update(dt: number) {
    this.state.time += dt;
    this.shake = Math.max(0, this.shake - dt * 25);
    this.flash = Math.max(0, this.flash - dt * 2.5);

    // Particle simulation
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2.5 * dt;
      p.vy *= 1 - 2.5 * dt;
    }

    if (this.state.status === "countdown") {
      this.roundTimer += dt;
      if (this.roundTimer >= 0.65) {
        this.roundTimer = 0;
        this.state.countdown -= 1;
        if (this.state.countdown <= 0) {
          this.state.status = "playing";
          this.triggerSfx("start");
        } else {
          this.triggerSfx("click");
        }
        this.emitSync();
      }
      return;
    }

    if (this.state.status === "round_over") {
      this.roundTimer += dt;
      if (this.roundTimer >= 1.4) {
        this.roundTimer = 0;
        this.state.round += 1;
        this.startCountdown();
      }
      return;
    }

    if (this.state.status !== "playing") return;

    this.acc += dt * 1000;
    let guard = 0;
    while (this.acc >= this.state.tick && this.state.status === "playing" && guard < 5) {
      this.step();
      this.acc -= this.state.tick;
      guard++;
    }
  }

  step() {
    const p1 = this.state.snakes.p1;
    const p2 = this.state.snakes.p2;

    if (!p1.alive || !p2.alive) return;

    // Apply next turn from input queues
    if (this.inputQueues.p1.length > 0) p1.dir = this.inputQueues.p1.shift() as Dir;
    if (this.inputQueues.p2.length > 0) p2.dir = this.inputQueues.p2.shift() as Dir;

    const d1 = DIRS[p1.dir];
    const d2 = DIRS[p2.dir];

    const nextHead1 = { x: p1.body[0].x + d1.x, y: p1.body[0].y + d1.y };
    const nextHead2 = { x: p2.body[0].x + d2.x, y: p2.body[0].y + d2.y };

    // 1. Check HEAD-ON collision
    if (nextHead1.x === nextHead2.x && nextHead1.y === nextHead2.y) {
      p1.alive = false;
      p2.alive = false;
      p1.deathReason = "head_on";
      p2.deathReason = "head_on";
      this.spawnDeathBurst(nextHead1.x, nextHead1.y, ["#ffd166", "#ff5d5d"]);
      this.finishRound("tie");
      return;
    }

    // 2. Check wall collisions
    const wall1 = nextHead1.x < 0 || nextHead1.y < 0 || nextHead1.x >= DUEL_COLS || nextHead1.y >= DUEL_ROWS;
    const wall2 = nextHead2.x < 0 || nextHead2.y < 0 || nextHead2.x >= DUEL_COLS || nextHead2.y >= DUEL_ROWS;

    if (wall1) {
      p1.alive = false;
      p1.deathReason = "wall";
      this.spawnDeathBurst(p1.body[0].x, p1.body[0].y, ["#8dff57", "#ff5d5d"]);
    }
    if (wall2) {
      p2.alive = false;
      p2.deathReason = "wall";
      this.spawnDeathBurst(p2.body[0].x, p2.body[0].y, ["#ff2a85", "#ff5d5d"]);
    }

    if (wall1 && wall2) {
      this.finishRound("tie");
      return;
    } else if (wall1) {
      this.finishRound("p2");
      return;
    } else if (wall2) {
      this.finishRound("p1");
      return;
    }

    // 3. Check food consumption
    const foodIdx1 = this.state.food.findIndex((f) => f.x === nextHead1.x && f.y === nextHead1.y);
    const willEat1 = foodIdx1 !== -1;

    const foodIdx2 = this.state.food.findIndex((f) => f.x === nextHead2.x && f.y === nextHead2.y);
    const willEat2 = foodIdx2 !== -1;

    // Tail vacating rule:
    // If not eating, tail vacates cell on this tick.
    const checkLen1 = willEat1 ? p1.body.length : p1.body.length - 1;
    const checkLen2 = willEat2 ? p2.body.length : p2.body.length - 1;

    // 4. Check body collision
    let p1Died = false;
    let p1Reason: "self" | "enemy" | null = null;
    let p2Died = false;
    let p2Reason: "self" | "enemy" | null = null;

    // P1 self-collision
    for (let i = 0; i < checkLen1; i++) {
      if (p1.body[i].x === nextHead1.x && p1.body[i].y === nextHead1.y) {
        p1Died = true;
        p1Reason = "self";
        break;
      }
    }
    // P1 into P2 body collision
    for (let i = 0; i < checkLen2; i++) {
      if (p2.body[i].x === nextHead1.x && p2.body[i].y === nextHead1.y) {
        p1Died = true;
        p1Reason = "enemy";
        break;
      }
    }

    // P2 self-collision
    for (let i = 0; i < checkLen2; i++) {
      if (p2.body[i].x === nextHead2.x && p2.body[i].y === nextHead2.y) {
        p2Died = true;
        p2Reason = "self";
        break;
      }
    }
    // P2 into P1 body collision
    for (let i = 0; i < checkLen1; i++) {
      if (p1.body[i].x === nextHead2.x && p1.body[i].y === nextHead2.y) {
        p2Died = true;
        p2Reason = "enemy";
        break;
      }
    }

    if (p1Died) {
      p1.alive = false;
      p1.deathReason = p1Reason;
      this.spawnDeathBurst(nextHead1.x, nextHead1.y, ["#8dff57", "#ff5d5d"]);
    }
    if (p2Died) {
      p2.alive = false;
      p2.deathReason = p2Reason;
      this.spawnDeathBurst(nextHead2.x, nextHead2.y, ["#ff2a85", "#ff5d5d"]);
    }

    if (p1Died && p2Died) {
      this.finishRound("tie");
      return;
    } else if (p1Died) {
      this.finishRound("p2");
      return;
    } else if (p2Died) {
      this.finishRound("p1");
      return;
    }

    // 5. Advance bodies
    p1.prevBody = p1.body.map((v) => ({ ...v }));
    p1.body.unshift(nextHead1);
    if (willEat1) {
      p1.applesEaten += 1;
      this.triggerSfx("eat");
      this.spawnFoodBurst(nextHead1.x, nextHead1.y);
      this.state.food.splice(foodIdx1, 1);
      this.state.food.push(randomEmptyDuelCell(this.state.snakes, this.state.food));
    } else {
      p1.body.pop();
    }

    p2.prevBody = p2.body.map((v) => ({ ...v }));
    p2.body.unshift(nextHead2);
    if (willEat2) {
      p2.applesEaten += 1;
      this.triggerSfx("eat");
      this.spawnFoodBurst(nextHead2.x, nextHead2.y);
      // If P2 ate remaining food index
      const newIdx = this.state.food.findIndex((f) => f.x === nextHead2.x && f.y === nextHead2.y);
      if (newIdx !== -1) {
        this.state.food.splice(newIdx, 1);
        this.state.food.push(randomEmptyDuelCell(this.state.snakes, this.state.food));
      }
    } else {
      p2.body.pop();
    }

    this.emitSync();
  }

  private finishRound(winner: PlayerId | "tie") {
    this.state.roundWinner = winner;
    this.shake = 12;
    this.flash = 0.7;
    this.triggerSfx("die");

    if (winner !== "tie") {
      this.state.wins[winner] += 1;
      this.players[winner].score = this.state.wins[winner];
    }

    if (this.state.wins.p1 >= TARGET_WINS) {
      this.state.status = "match_over";
      this.state.matchWinner = "p1";
      this.triggerSfx("best");
    } else if (this.state.wins.p2 >= TARGET_WINS) {
      this.state.status = "match_over";
      this.state.matchWinner = "p2";
      this.triggerSfx("best");
    } else {
      this.state.status = "round_over";
      this.roundTimer = 0;
    }

    this.emitSync();
  }

  private spawnDeathBurst(cx: number, cy: number, colors: string[]) {
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 3 + Math.random() * 6;
      this.particles.push({
        x: cx + 0.5,
        y: cy + 0.5,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 0.18 + Math.random() * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        grav: 4,
      });
    }
  }

  private spawnFoodBurst(cx: number, cy: number) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 2.5 + Math.random() * 4.5;
      this.particles.push({
        x: cx + 0.5,
        y: cy + 0.5,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        size: 0.12 + Math.random() * 0.1,
        color: ["#ff5d5d", "#ffd166", "#c0ff7a"][Math.floor(Math.random() * 3)],
        grav: 3,
      });
    }
  }

  private triggerSfx(name: SfxName) {
    this.sfxQueue.push(name);
    this.onSfx?.(name);
  }

  private emitSync() {
    this.onStateChange?.(this.state, Object.values(this.players));
  }
}
