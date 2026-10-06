import type { Dir, SfxName, Vec } from "../engine";
import type { ThemeId } from "../themes";

export type PlayerId = "p1" | "p2";

export interface RoomPlayer {
  id: PlayerId;
  name: string;
  themeId: ThemeId;
  ready: boolean;
  score: number; // rounds won
  connected: boolean;
}

export type DuelStatus = "lobby" | "countdown" | "playing" | "round_over" | "match_over";

export interface DuelSnake {
  id: PlayerId;
  body: Vec[];
  prevBody: Vec[];
  dir: Dir;
  alive: boolean;
  deathReason: "wall" | "self" | "enemy" | "head_on" | null;
  applesEaten: number;
}

export interface DuelParticle {
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

export interface DuelGameState {
  cols: number;
  rows: number;
  status: DuelStatus;
  round: number;
  targetWins: number;
  countdown: number; // 3, 2, 1, 0
  snakes: Record<PlayerId, DuelSnake>;
  food: Vec[];
  wins: Record<PlayerId, number>;
  roundWinner: PlayerId | "tie" | null;
  matchWinner: PlayerId | null;
  time: number;
  tick: number;
}

/* Client to Host messages */
export type ClientDuelMsg =
  | { type: "join"; name: string; themeId: ThemeId }
  | { type: "steer"; dir: Dir }
  | { type: "ready"; ready: boolean }
  | { type: "rematch" }
  | { type: "ping"; t: number }
  | { type: "leave" };

/* Host to Client messages */
export type HostDuelMsg =
  | { type: "lobby_update"; players: RoomPlayer[] }
  | { type: "state_sync"; state: DuelGameState; players: RoomPlayer[] }
  | { type: "sfx"; name: SfxName }
  | { type: "round_end"; winner: PlayerId | "tie"; wins: Record<PlayerId, number> }
  | { type: "match_end"; matchWinner: PlayerId; wins: Record<PlayerId, number> }
  | { type: "pong"; t: number }
  | { type: "player_left"; id: PlayerId };
