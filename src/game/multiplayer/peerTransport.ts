import Peer, { type DataConnection } from "peerjs";
import type { ClientDuelMsg, HostDuelMsg } from "./types";
import type { DuelEngine } from "./duelEngine";

const PEER_PREFIX = "serpent-duel-v1-";

const PEER_CONFIG = {
  debug: 0,
  config: {
    iceCandidatePoolSize: 10,
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
    ],
  },
};

export function randomDuelCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused chars like 0, 1, I, O
  let res = "";
  for (let i = 0; i < 4; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

export function peerIdForDuel(code: string): string {
  return `${PEER_PREFIX}${code.trim().toLowerCase()}`;
}

/**
 * Host-side bridge: exposes local DuelEngine to guest over PeerJS WebRTC data channel.
 */
export class DuelHostBridge {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private engine: DuelEngine;
  private code: string;
  private closed = false;
  private pendingQueue: HostDuelMsg[] = [];

  private onUnload = () => {
    this.close();
  };

  constructor(engine: DuelEngine, code: string) {
    this.engine = engine;
    this.code = code;
    this.init();
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", this.onUnload);
      window.addEventListener("beforeunload", this.onUnload);
    }
  }

  getCode(): string {
    return this.code;
  }

  private init() {
    if (this.closed) return;
    try {
      const id = peerIdForDuel(this.code);
      this.peer = new Peer(id, PEER_CONFIG);

      this.peer.on("connection", (conn) => {
        // Only accept 1 guest in 1v1 duel
        if (this.conn && this.conn.open) {
          conn.close();
          return;
        }

        this.conn = conn;

        conn.on("open", () => {
          this.flushPending();
          // Immediately send current lobby / game state
          this.broadcast({
            type: "state_sync",
            state: this.engine.state,
            players: Object.values(this.engine.players),
          });
        });

        conn.on("data", (raw) => {
          try {
            const msg = (typeof raw === "string" ? JSON.parse(raw) : raw) as ClientDuelMsg;
            this.handleGuestMessage(msg);
          } catch {
            /* ignore invalid */
          }
        });

        const drop = () => {
          if (this.conn === conn) {
            this.conn = null;
            this.engine.setGuest({
              id: "p2",
              name: "Disconnected",
              themeId: "synthwave",
              ready: false,
              score: 0,
              connected: false,
            });
          }
        };

        conn.on("close", drop);
        conn.on("error", drop);
      });

      this.peer.on("disconnected", () => {
        if (!this.closed) {
          try {
            this.peer?.reconnect();
          } catch {
            /* ignore */
          }
        }
      });

      this.peer.on("error", (err) => {
        if ((err as { type?: string }).type === "unavailable-id" && !this.closed) {
          try {
            this.peer?.destroy();
          } catch {
            /* ignore */
          }
          this.peer = null;
          // Re-attempt after short backoff
          setTimeout(() => {
            if (!this.closed) this.init();
          }, 1500);
        }
      });
    } catch {
      /* PeerJS unavailable */
    }
  }

  private handleGuestMessage(msg: ClientDuelMsg) {
    switch (msg.type) {
      case "join": {
        this.engine.setGuest({
          id: "p2",
          name: msg.name.slice(0, 16) || "Player 2",
          themeId: msg.themeId || "synthwave",
          ready: true,
          score: 0,
          connected: true,
        });
        break;
      }
      case "steer": {
        this.engine.queueTurn("p2", msg.dir);
        break;
      }
      case "rematch": {
        this.engine.rematch();
        break;
      }
      case "ping": {
        this.broadcast({ type: "pong", t: msg.t });
        break;
      }
      case "leave": {
        this.engine.setGuest({
          id: "p2",
          name: "Waiting...",
          themeId: "synthwave",
          ready: false,
          score: 0,
          connected: false,
        });
        break;
      }
    }
  }

  broadcast(msg: HostDuelMsg) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(msg);
      } catch {
        /* drop */
      }
    } else if (this.conn) {
      this.pendingQueue.push(msg);
    }
  }

  private flushPending() {
    if (!this.conn || !this.conn.open) return;
    while (this.pendingQueue.length > 0) {
      const m = this.pendingQueue.shift();
      if (m) {
        try {
          this.conn.send(m);
        } catch {
          break;
        }
      }
    }
  }

  close() {
    this.closed = true;
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.onUnload);
      window.removeEventListener("beforeunload", this.onUnload);
    }
    this.pendingQueue = [];
    try {
      this.conn?.close();
    } catch {
      /* ignore */
    }
    this.conn = null;
    try {
      this.peer?.destroy();
    } catch {
      /* ignore */
    }
    this.peer = null;
  }
}

export interface DuelGuestLink {
  send: (msg: ClientDuelMsg) => void;
  onMessage: (cb: (msg: HostDuelMsg) => void) => () => void;
  onDisconnect: (cb: () => void) => () => void;
  close: () => void;
}

/**
 * Guest-side link: dials host peer directly over WebRTC DataChannel.
 */
export function tryDuelGuestLink(roomCode: string, timeoutMs = 10000): Promise<DuelGuestLink> {
  return new Promise((resolve, reject) => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length !== 4) {
      reject(new Error("Please enter a valid 4-letter room code."));
      return;
    }
    const targetId = peerIdForDuel(cleanCode);
    let settled = false;
    let peer: Peer | null = null;
    let conn: DataConnection | null = null;
    let manuallyClosed = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          conn?.close();
          peer?.destroy();
        } catch {
          /* ignore */
        }
        reject(new Error("Connection timed out. Check the room code and try again."));
      }
    }, timeoutMs);

    const listeners = new Set<(msg: HostDuelMsg) => void>();
    const disconnectListeners = new Set<() => void>();

    const link: DuelGuestLink = {
      send: (msg: ClientDuelMsg) => {
        if (conn && conn.open) {
          try {
            conn.send(msg);
          } catch {
            /* ignore */
          }
        }
      },
      onMessage: (cb: (msg: HostDuelMsg) => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      onDisconnect: (cb: () => void) => {
        disconnectListeners.add(cb);
        return () => disconnectListeners.delete(cb);
      },
      close: () => {
        manuallyClosed = true;
        clearTimeout(timer);
        try {
          conn?.close();
          peer?.destroy();
        } catch {
          /* ignore */
        }
      },
    };

    try {
      peer = new Peer(PEER_CONFIG);
    } catch (err) {
      clearTimeout(timer);
      return reject(err);
    }

    peer.on("open", () => {
      try {
        conn = peer!.connect(targetId, { reliable: true });

        conn.on("open", () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(link);
          }
        });

        conn.on("data", (raw) => {
          try {
            const msg = (typeof raw === "string" ? JSON.parse(raw) : raw) as HostDuelMsg;
            listeners.forEach((cb) => cb(msg));
          } catch {
            /* ignore malformed */
          }
        });

        conn.on("close", () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(new Error("Host closed the room."));
          } else if (!manuallyClosed) {
            disconnectListeners.forEach((cb) => cb());
          }
        });

        conn.on("error", (err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          } else if (!manuallyClosed) {
            disconnectListeners.forEach((cb) => cb());
          }
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });

    peer.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        const type = (err as { type?: string }).type;
        if (type === "peer-unavailable") {
          reject(new Error("Room not found. Check the 4-letter code and ensure host is live."));
        } else {
          reject(err);
        }
      }
    });
  });
}
