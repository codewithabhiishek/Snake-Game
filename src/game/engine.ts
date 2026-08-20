export type Vec = { x: number; y: number };
export type Dir = "up" | "down" | "left" | "right";
export type Status = "menu" | "playing" | "paused" | "dying" | "over";
export type DifficultyId = "chill" | "classic" | "insane";

export interface Difficulty {
  id: DifficultyId;
  label: string;
  tagline: string;
  tick: number; // ms per step at start
  minTick: number; // fastest allowed
  mult: number; // score multiplier
  hue: string;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "chill",
    label: "CHILL",
    tagline: "A lazy garden stroll",
    tick: 165,
    minTick: 96,
    mult: 1,
    hue: "#2fbf71",
  },
  {
    id: "classic",
    label: "CLASSIC",
    tagline: "The honest hunt",
    tick: 118,
    minTick: 66,
    mult: 2,
    hue: "#8dff57",
  },
  {
    id: "insane",
    label: "INSANE",
    tagline: "Pure reflex venom",
    tick: 82,
    minTick: 46,
    mult: 3,
    hue: "#ffd166",
  },
];

export const COLS = 21;
export const ROWS = 21;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  grav: number;
}

export interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
}

export type SfxName =
  | "eat"
  | "die"
  | "start"
  | "pause"
  | "resume"
  | "click"
  | "best"
  | "turn";

export interface Game {
  cols: number;
  rows: number;
  snake: Vec[];
  prevSnake: Vec[];
  dir: Dir;
  queue: Dir[];
  food: Vec;
  foodAge: number; // seconds since food spawned
  score: number;
  eaten: number;
  mult: number;
  tick: number;
  baseTick: number;
  minTick: number;
  acc: number;
  status: Status;
  youWin: boolean;
  particles: Particle[];
  popups: Popup[];
  shake: number;
  flash: number;
  deathT: number;
  time: number;
  sfx: SfxName[];
}

const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function randomEmptyCell(g: Pick<Game, "cols" | "rows" | "snake">): Vec | null {
  const free: Vec[] = [];
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      if (!g.snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

export function createGame(diff: Difficulty): Game {
  const midY = Math.floor(ROWS / 2);
  const midX = Math.floor(COLS / 2);
  const snake: Vec[] = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
    { x: midX - 3, y: midY },
  ];
  const g: Game = {
    cols: COLS,
    rows: ROWS,
    snake,
    prevSnake: snake.map((v) => ({ ...v })),
    dir: "right",
    queue: [],
    food: { x: midX + 6, y: midY },
    foodAge: 0,
    score: 0,
    eaten: 0,
    mult: diff.mult,
    tick: diff.tick,
    baseTick: diff.tick,
    minTick: diff.minTick,
    acc: 0,
    status: "menu",
    youWin: false,
    particles: [],
    popups: [],
    shake: 0,
    flash: 0,
    deathT: 0,
    time: 0,
    sfx: [],
  };
  const cell = randomEmptyCell(g);
  if (cell) g.food = cell;
  return g;
}

/** Push a turn into the input queue, rejecting reversals and duplicates. */
export function queueDir(g: Game, d: Dir) {
  const ref = g.queue.length > 0 ? g.queue[g.queue.length - 1] : g.dir;
  if (d === ref || d === OPPOSITE[ref]) return;
  if (g.queue.length < 2) {
    g.queue.push(d);
    g.sfx.push("turn");
  }
}

function burst(
  g: Game,
  cx: number,
  cy: number,
  count: number,
  colors: string[],
  speed: number,
  size: number,
  grav = 0
) {
  for (let i = 0; i < count; i++) {
    if (g.particles.length > 240) g.particles.shift();
    const a = Math.random() * Math.PI * 2;
    const v = (0.35 + Math.random() * 0.65) * speed;
    g.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.5,
      size: size * (0.6 + Math.random() * 0.8),
      color: colors[Math.floor(Math.random() * colors.length)],
      grav,
    });
  }
}

function die(g: Game) {
  g.status = "dying";
  g.deathT = 0.75;
  g.shake = 15;
  g.flash = 0.85;
  g.sfx.push("die");
  for (let i = 0; i < g.snake.length; i += 2) {
    const s = g.snake[i];
    burst(g, s.x + 0.5, s.y + 0.5, 5, ["#ff5d5d", "#ffd166", "#8dff57"], 6, 0.16, 8);
  }
}

/** Advance the simulation by one tick. Mutates the game. */
export function step(g: Game) {
  if (g.queue.length > 0) g.dir = g.queue.shift() as Dir;
  const d = DIRS[g.dir];
  const head = { x: g.snake[0].x + d.x, y: g.snake[0].y + d.y };

  // walls
  if (head.x < 0 || head.y < 0 || head.x >= g.cols || head.y >= g.rows) {
    die(g);
    return;
  }

  const willEat = head.x === g.food.x && head.y === g.food.y;
  // tail vacates its cell this tick unless we grow
  const checkLen = willEat ? g.snake.length : g.snake.length - 1;
  for (let i = 0; i < checkLen; i++) {
    if (g.snake[i].x === head.x && g.snake[i].y === head.y) {
      die(g);
      return;
    }
  }

  const prev = g.snake.map((v) => ({ ...v }));
  g.snake.unshift(head);

  if (willEat) {
    const pts = 10 * g.mult;
    g.score += pts;
    g.eaten += 1;
    g.foodAge = 0;
    g.sfx.push("eat");
    g.popups.push({
      x: head.x + 0.5,
      y: head.y,
      text: `+${pts}`,
      life: 0,
      maxLife: 0.8,
      color: "#ffd166",
    });
    burst(
      g,
      g.food.x + 0.5,
      g.food.y + 0.5,
      18,
      ["#ff5d5d", "#ff8a5c", "#ffd166", "#c0ff7a"],
      7,
      0.14,
      6
    );
    // speed ramp every 4 apples
    if (g.eaten % 4 === 0 && g.tick > g.minTick) {
      g.tick = Math.max(g.minTick, g.tick * 0.93);
    }
    // tail stays put -> snake grew; pad prev so indices stay aligned
    prev.push({ ...prev[prev.length - 1] });
    const next = randomEmptyCell(g);
    if (next === null) {
      g.youWin = true;
      g.status = "over";
      g.sfx.push("best");
      return;
    }
    g.food = next;
  } else {
    g.snake.pop();
  }

  g.prevSnake = prev;
}

/** Per-frame effect updates (particles, popups, shake, death timer). */
export function updateFx(g: Game, dt: number) {
  g.time += dt;
  g.foodAge += dt;
  g.shake = Math.max(0, g.shake - dt * 34);
  g.flash = Math.max(0, g.flash - dt * 2.2);

  for (let i = g.particles.length - 1; i >= 0; i--) {
    const p = g.particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      g.particles.splice(i, 1);
      continue;
    }
    p.vy += p.grav * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - 2.4 * dt;
    p.vy *= 1 - 2.4 * dt;
  }
  for (let i = g.popups.length - 1; i >= 0; i--) {
    const p = g.popups[i];
    p.life += dt;
    if (p.life >= p.maxLife) g.popups.splice(i, 1);
  }

  if (g.status === "dying") {
    g.deathT -= dt;
    if (g.deathT <= 0) g.status = "over";
  }
}

export function speedLevel(g: Game): number {
  return 1 + Math.floor(g.eaten / 4);
}
