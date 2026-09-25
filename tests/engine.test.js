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

test('themes are unlocked according to score thresholds', () => {
  const cyberpunk = getTheme('cyberpunk');
  const gameboy = getTheme('gameboy');
  const matrix = getTheme('matrix');

  assert.equal(isThemeUnlocked(cyberpunk, 0), true);
  assert.equal(isThemeUnlocked(gameboy, 59), false);
  assert.equal(isThemeUnlocked(gameboy, 60), true);
  assert.equal(isThemeUnlocked(matrix, 299), false);
  assert.equal(isThemeUnlocked(matrix, 300), true);
});
