import test from "node:test";
import assert from "node:assert/strict";
import {
  DuelEngine,
  DUEL_COLS,
  DUEL_ROWS,
  TARGET_WINS,
  createInitialDuelSnakes,
} from "../src/game/multiplayer/duelEngine.ts";

test("DuelEngine initializes two snakes facing opposite directions with 2 food items", () => {
  const engine = new DuelEngine({
    id: "p1",
    name: "HostPlayer",
    themeId: "cyberpunk",
    ready: true,
    score: 0,
    connected: true,
  });

  assert.equal(engine.state.status, "lobby");
  assert.equal(engine.state.cols, DUEL_COLS);
  assert.equal(engine.state.rows, DUEL_ROWS);
  assert.equal(engine.state.food.length, 2);

  const { p1, p2 } = engine.state.snakes;
  assert.equal(p1.dir, "right");
  assert.equal(p2.dir, "left");
  assert.equal(p1.body[0].x < p2.body[0].x, true);
  assert.equal(p1.alive, true);
  assert.equal(p2.alive, true);
});

test("DuelEngine rejects 180-degree reversals and accepts valid 90-degree turns", () => {
  const engine = new DuelEngine({
    id: "p1",
    name: "HostPlayer",
    themeId: "cyberpunk",
    ready: true,
    score: 0,
    connected: true,
  });
  engine.state.status = "playing";

  // P1 starts moving right
  engine.queueTurn("p1", "left"); // 180 reversal
  assert.equal(engine.inputQueues.p1.length, 0);

  engine.queueTurn("p1", "up"); // valid 90-deg turn
  assert.equal(engine.inputQueues.p1.length, 1);
  assert.equal(engine.inputQueues.p1[0], "up");

  // Relative to 'up', 'down' is reversal
  engine.queueTurn("p1", "down");
  assert.equal(engine.inputQueues.p1.length, 1);

  engine.queueTurn("p1", "left");
  assert.equal(engine.inputQueues.p1.length, 2);

  // Queue is capped at 2
  engine.queueTurn("p1", "down");
  assert.equal(engine.inputQueues.p1.length, 2);
});

test("DuelEngine step handles head-on collision as a tie", () => {
  const engine = new DuelEngine({
    id: "p1",
    name: "Host",
    themeId: "cyberpunk",
    ready: true,
    score: 0,
    connected: true,
  });
  engine.state.status = "playing";

  // Position both heads 2 tiles apart moving towards each other
  engine.state.snakes.p1.body = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  engine.state.snakes.p1.dir = "right";

  engine.state.snakes.p2.body = [{ x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }];
  engine.state.snakes.p2.dir = "left";

  engine.step();

  // Both should meet at (10, 10) and die
  assert.equal(engine.state.snakes.p1.alive, false);
  assert.equal(engine.state.snakes.p2.alive, false);
  assert.equal(engine.state.roundWinner, "tie");
  assert.equal(engine.state.wins.p1, 0);
  assert.equal(engine.state.wins.p2, 0);
});

test("DuelEngine awards round win to opponent on wall collision", () => {
  const engine = new DuelEngine({
    id: "p1",
    name: "Host",
    themeId: "cyberpunk",
    ready: true,
    score: 0,
    connected: true,
  });
  engine.state.status = "playing";

  // Put P1 right at top wall facing up
  engine.state.snakes.p1.body = [{ x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }];
  engine.state.snakes.p1.dir = "up";

  // Keep P2 safely moving in center
  engine.state.snakes.p2.body = [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }];
  engine.state.snakes.p2.dir = "left";

  engine.step();

  assert.equal(engine.state.snakes.p1.alive, false);
  assert.equal(engine.state.snakes.p1.deathReason, "wall");
  assert.equal(engine.state.roundWinner, "p2");
  assert.equal(engine.state.wins.p2, 1);
});

test("DuelEngine awards round win when snake collides with opponent body", () => {
  const engine = new DuelEngine({
    id: "p1",
    name: "Host",
    themeId: "cyberpunk",
    ready: true,
    score: 0,
    connected: true,
  });
  engine.state.status = "playing";

  // P2 creates a vertical wall at x = 10
  engine.state.snakes.p2.body = [
    { x: 10, y: 8 },
    { x: 10, y: 9 },
    { x: 10, y: 10 },
    { x: 10, y: 11 },
  ];
  engine.state.snakes.p2.dir = "up";

  // P1 moves right into (10, 10)
  engine.state.snakes.p1.body = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  engine.state.snakes.p1.dir = "right";

  engine.step();

  assert.equal(engine.state.snakes.p1.alive, false);
  assert.equal(engine.state.snakes.p1.deathReason, "enemy");
  assert.equal(engine.state.roundWinner, "p2");
  assert.equal(engine.state.wins.p2, 1);
});

test("DuelEngine handles apple consumption, growth, and respawn", () => {
  const engine = new DuelEngine({
    id: "p1",
    name: "Host",
    themeId: "cyberpunk",
    ready: true,
    score: 0,
    connected: true,
  });
  engine.state.status = "playing";

  const p1 = engine.state.snakes.p1;
  const initialLen = p1.body.length;
  // Place food directly ahead of P1
  engine.state.food = [
    { x: p1.body[0].x + 1, y: p1.body[0].y },
    { x: 0, y: 0 },
  ];

  engine.step();

  assert.equal(engine.state.snakes.p1.body.length, initialLen + 1);
  assert.equal(engine.state.snakes.p1.applesEaten, 1);
  assert.equal(engine.state.food.length, 2);
});

test("DuelEngine transitions to match_over when a player reaches target wins", () => {
  const engine = new DuelEngine({
    id: "p1",
    name: "Host",
    themeId: "cyberpunk",
    ready: true,
    score: 0,
    connected: true,
  });
  engine.state.status = "playing";
  engine.state.wins.p1 = TARGET_WINS - 1; // 2 wins

  // Force P2 wall collision so P1 gets 3rd win
  engine.state.snakes.p2.body = [{ x: DUEL_COLS - 1, y: 5 }, { x: DUEL_COLS - 2, y: 5 }];
  engine.state.snakes.p2.dir = "right";

  engine.step();

  assert.equal(engine.state.wins.p1, TARGET_WINS);
  assert.equal(engine.state.status, "match_over");
  assert.equal(engine.state.matchWinner, "p1");
});
