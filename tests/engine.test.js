import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS,
  ROWS,
  DIFFICULTIES,
  createGame,
  queueDir,
  step,
  speedLevel,
  updateFx,
} from '../src/game/engine.ts';
import { THEMES, getTheme, isThemeUnlocked } from '../src/game/themes.ts';

test('createGame initializes game board, snake, and initial parameters', () => {
  const diff = DIFFICULTIES[0]; // chill
  const g = createGame(diff);

  assert.equal(g.cols, COLS);
  assert.equal(g.rows, ROWS);
  assert.equal(g.status, 'menu');
  assert.equal(g.dir, 'right');
  assert.equal(g.score, 0);
  assert.equal(g.eaten, 0);
  assert.equal(g.snake.length, 4);

  // Snake starts horizontally near center
  const head = g.snake[0];
  const neck = g.snake[1];
  assert.equal(head.y, neck.y);
  assert.equal(head.x, neck.x + 1);

  // Food should not spawn on top of snake
  assert.equal(g.snake.some(s => s.x === g.food.x && s.y === g.food.y), false);
});

test('queueDir allows 90-degree turns and strictly rejects 180-degree reversals', () => {
  const g = createGame(DIFFICULTIES[0]);
  g.dir = 'right';

  // Opposite of right is left -> must be rejected
  queueDir(g, 'left');
  assert.equal(g.queue.length, 0);

  // Same direction -> rejected
  queueDir(g, 'right');
  assert.equal(g.queue.length, 0);

  // 90-degree turn -> accepted
  queueDir(g, 'up');
  assert.equal(g.queue.length, 1);
  assert.equal(g.queue[0], 'up');

  // Next turn relative to 'up' -> 'down' (reversal) rejected, 'left' accepted
  queueDir(g, 'down');
  assert.equal(g.queue.length, 1);

  queueDir(g, 'left');
  assert.equal(g.queue.length, 2);

  // Queue is capped at 2 moves to avoid stale buffer lag
  queueDir(g, 'down');
  assert.equal(g.queue.length, 2);
});

test('step advances snake in current direction and pops tail when not eating', () => {
  const g = createGame(DIFFICULTIES[0]);
  g.dir = 'right';
  g.status = 'playing';

  // Move food far away so it does not eat immediately
  g.food = { x: 0, y: 0 };
  const prevHeadX = g.snake[0].x;
  const initialLength = g.snake.length;

  step(g);

  assert.equal(g.snake.length, initialLength);
  assert.equal(g.snake[0].x, prevHeadX + 1);
});

test('step detects wall collision and transitions to dying', () => {
  const g = createGame(DIFFICULTIES[0]);
  // Place snake at the right boundary
  g.snake = [
    { x: COLS - 1, y: 5 },
    { x: COLS - 2, y: 5 },
    { x: COLS - 3, y: 5 },
  ];
  g.dir = 'right';
  g.food = { x: 0, y: 0 };

  step(g);

  assert.equal(g.status, 'dying');
  assert.equal(g.deathT > 0, true);
  assert.equal(g.shake > 0, true);
});

test('step detects self collision and transitions to dying', () => {
  const g = createGame(DIFFICULTIES[0]);
  // Snake looped into itself
  g.snake = [
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
    { x: 4, y: 5 },
    { x: 4, y: 4 },
  ];
  g.dir = 'left'; // stepping left hits (4, 5)
  g.food = { x: 0, y: 0 };

  step(g);

  assert.equal(g.status, 'dying');
});

test('step eats food, grows snake, awards score, and updates eaten counter', () => {
  const g = createGame(DIFFICULTIES[1]); // classic, mult = 2
  g.dir = 'right';
  const head = g.snake[0];
  g.food = { x: head.x + 1, y: head.y }; // directly ahead

  const initialScore = g.score;
  const initialEaten = g.eaten;
  const initialLength = g.snake.length;

  step(g);

  assert.equal(g.snake.length, initialLength + 1);
  assert.equal(g.eaten, initialEaten + 1);
  assert.equal(g.score, initialScore + 10 * g.mult);
  assert.equal(g.foodAge, 0);
});

test('speedLevel correctly calculates progression tiers capped at 6', () => {
  assert.equal(speedLevel(0), 1);
  assert.equal(speedLevel(3), 1);
  assert.equal(speedLevel(4), 2);
  assert.equal(speedLevel(12), 4);
  assert.equal(speedLevel(24), 6);
  assert.equal(speedLevel(100), 6); // capped at 6
});

test('step detects wall collisions in all 4 cardinal directions', () => {
  // Top boundary
  let g = createGame(DIFFICULTIES[0]);
  g.snake = [{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }];
  g.dir = 'up';
  g.food = { x: 10, y: 10 };
  step(g);
  assert.equal(g.status, 'dying');

  // Bottom boundary
  g = createGame(DIFFICULTIES[0]);
  g.snake = [{ x: 5, y: ROWS - 1 }, { x: 5, y: ROWS - 2 }, { x: 5, y: ROWS - 3 }];
  g.dir = 'down';
  g.food = { x: 10, y: 10 };
  step(g);
  assert.equal(g.status, 'dying');

  // Left boundary
  g = createGame(DIFFICULTIES[0]);
  g.snake = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
  g.dir = 'left';
  g.food = { x: 10, y: 10 };
  step(g);
  assert.equal(g.status, 'dying');

  // Right boundary
  g = createGame(DIFFICULTIES[0]);
  g.snake = [{ x: COLS - 1, y: 5 }, { x: COLS - 2, y: 5 }, { x: COLS - 3, y: 5 }];
  g.dir = 'right';
  g.food = { x: 10, y: 10 };
  step(g);
  assert.equal(g.status, 'dying');
});

test('step allows snake to chase and enter its own tail cell when not eating (tail vacates)', () => {
  const g = createGame(DIFFICULTIES[0]);
  // Snake in a 4-segment loop: head at (5,5), neck at (5,6), body at (6,6), tail at (6,5)
  // Stepping 'right' moves head into (6,5) where tail currently sits
  g.snake = [
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 6, y: 6 },
    { x: 6, y: 5 }, // tail
  ];
  g.dir = 'right';
  g.food = { x: 0, y: 0 }; // food far away

  step(g);

  // Snake should successfully move into (6,5) without dying because tail moved forward
  assert.equal(g.status !== 'dying', true);
  assert.equal(g.snake[0].x, 6);
  assert.equal(g.snake[0].y, 5);
});

test('step triggers collision if moving into tail cell while eating food (tail stays)', () => {
  const g = createGame(DIFFICULTIES[0]);
  g.snake = [
    { x: 5, y: 5 },
    { x: 5, y: 6 },
    { x: 6, y: 6 },
    { x: 6, y: 5 }, // tail
  ];
  g.dir = 'right';
  // Food is placed precisely on the tail cell
  g.food = { x: 6, y: 5 };

  step(g);

  // Since eating causes snake to grow, tail cannot vacate -> self-collision occurs
  assert.equal(g.status, 'dying');
});

test('step handles game completion / win condition when board is full', () => {
  const g = createGame(DIFFICULTIES[0]);
  // Fill almost entire board with snake except 1 cell
  const allCells = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      allCells.push({ x, y });
    }
  }

  // Last food cell is at (0, 0)
  g.food = { x: 0, y: 0 };
  // Snake fills all other cells, with head right next to food at (1, 0)
  g.snake = [{ x: 1, y: 0 }, ...allCells.filter(c => !(c.x === 0 && c.y === 0) && !(c.x === 1 && c.y === 0))];
  g.dir = 'left';

  step(g);

  // Snake ate the final food item, no empty cells remain -> WIN
  assert.equal(g.youWin, true);
  assert.equal(g.status, 'over');
});

test('updateFx transitions status from dying to over after death duration', () => {
  const g = createGame(DIFFICULTIES[0]);
  g.status = 'dying';
  g.deathT = 0.5;
  g.shake = 10;
  g.flash = 0.8;

  // Partial update
  updateFx(g, 0.2);
  assert.equal(g.status, 'dying');
  assert.equal(g.deathT < 0.5, true);
  assert.equal(g.shake < 10, true);

  // Exceed remaining death duration
  updateFx(g, 0.4);
  assert.equal(g.status, 'over');
});

test('updateFx prunes expired particles and popups to prevent memory leaks', () => {
  const g = createGame(DIFFICULTIES[0]);
  g.particles.push({
    x: 5,
    y: 5,
    vx: 1,
    vy: 1,
    life: 0.1,
    maxLife: 0.3,
    size: 2,
    color: '#fff',
    grav: 0,
  });
  g.popups.push({
    x: 5,
    y: 5,
    text: '+10',
    life: 0.1,
    maxLife: 0.3,
    color: '#fff',
  });

  assert.equal(g.particles.length, 1);
  assert.equal(g.popups.length, 1);

  // Advance by 0.3s -> both should expire and be removed
  updateFx(g, 0.3);
  assert.equal(g.particles.length, 0);
  assert.equal(g.popups.length, 0);
});

test('score multiplier scales correctly for all difficulty modes', () => {
  const chill = createGame(DIFFICULTIES[0]); // mult: 1
  chill.food = { x: chill.snake[0].x + 1, y: chill.snake[0].y };
  step(chill);
  assert.equal(chill.score, 10);

  const classic = createGame(DIFFICULTIES[1]); // mult: 2
  classic.food = { x: classic.snake[0].x + 1, y: classic.snake[0].y };
  step(classic);
  assert.equal(classic.score, 20);

  const insane = createGame(DIFFICULTIES[2]); // mult: 3
  insane.food = { x: insane.snake[0].x + 1, y: insane.snake[0].y };
  step(insane);
  assert.equal(insane.score, 30);
});

test('speed progression accelerates tick and is clamped at minTick', () => {
  const g = createGame(DIFFICULTIES[1]); // classic: tick 118, minTick 66
  const initialTick = g.tick;

  // Simulate eating 4 apples to trigger speed ramp
  g.eaten = 3;
  g.food = { x: g.snake[0].x + 1, y: g.snake[0].y };
  step(g); // eaten becomes 4
  assert.equal(g.eaten, 4);
  assert.equal(g.tick < initialTick, true);

  // Simulate reaching minimum tick cap
  g.eaten = 7;
  g.tick = g.minTick + 0.5; // near minTick
  g.food = { x: g.snake[0].x + 1, y: g.snake[0].y };
  step(g); // eaten becomes 8 -> ramp triggered
  assert.equal(g.tick, g.minTick);

  // Subsequent eating does not reduce below minTick
  g.eaten = 11;
  g.food = { x: g.snake[0].x + 1, y: g.snake[0].y };
  step(g); // eaten becomes 12 -> ramp checked
  assert.equal(g.tick, g.minTick);
});

test('all themes are unlocked according to score thresholds', () => {
  const cyberpunk = getTheme('cyberpunk');
  const gameboy = getTheme('gameboy');
  const synthwave = getTheme('synthwave');
  const matrix = getTheme('matrix');

  assert.equal(isThemeUnlocked(cyberpunk, 0), true);
  assert.equal(isThemeUnlocked(gameboy, 59), false);
  assert.equal(isThemeUnlocked(gameboy, 60), true);
  assert.equal(isThemeUnlocked(synthwave, 149), false);
  assert.equal(isThemeUnlocked(synthwave, 150), true);
  assert.equal(isThemeUnlocked(matrix, 299), false);
  assert.equal(isThemeUnlocked(matrix, 300), true);
});
