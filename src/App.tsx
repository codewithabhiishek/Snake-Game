import { useCallback, useEffect, useRef, useState } from "react";
import {
  COLS,
  DIFFICULTIES,
  createGame,
  queueDir,
  step,
  updateFx,
  type DifficultyId,
  type Dir,
  type Game,
  type Status,
} from "./game/engine";
import { draw } from "./game/render";
import { sfx } from "./game/audio";
import { THEMES, getTheme, isThemeUnlocked, type ThemeId } from "./game/themes";

/* ---------------- inline SVG icons ---------------- */

const IconPlay = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M7 4.5v15l13-7.5-13-7.5z" />
  </svg>
);

const IconPause = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);

const IconRestart = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

const IconHome = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10.5V20h13v-9.5" />
  </svg>
);

const IconTrophy = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5" />
  </svg>
);

const IconSoundOn = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
  </svg>
);

const IconSoundOff = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
    <path d="m16 9 6 6M22 9l-6 6" />
  </svg>
);

const IconChevron = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 15 6-6 6 6" />
  </svg>
);

const IconGamepad = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="6" width="20" height="12" rx="4" />
    <path d="M6 12h4M8 10v4M16 11h.01M18 13h.01" />
  </svg>
);

const IconMaximize = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const IconMinimize = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 14h6v6m10-10h-6V4m0 6 7-7M9 15l-7 7" />
  </svg>
);

const IconPalette = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z" />
  </svg>
);

const IconLock = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SnakeMark = ({ className = "w-8 h-8", color = "#8dff57" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
    <path
      d="M5 18h9a4 4 0 0 0 0-8H8.5a3 3 0 0 1 0-6H15"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <circle cx="16.6" cy="4" r="2.7" fill={color} />
    <circle cx="17.4" cy="3.4" r="0.8" fill="#062513" />
  </svg>
);

/* ---------------- persistence ---------------- */

const bestKey = (id: DifficultyId) => `serpent-best-${id}`;
function loadBest(id: DifficultyId): number {
  try {
    return parseInt(localStorage.getItem(bestKey(id)) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}
function saveBest(id: DifficultyId, v: number) {
  try {
    localStorage.setItem(bestKey(id), String(v));
  } catch {
    /* ignore */
  }
}
function loadDiff(): DifficultyId {
  try {
    const d = localStorage.getItem("serpent-diff") as DifficultyId | null;
    if (d && DIFFICULTIES.some((x) => x.id === d)) return d;
  } catch {
    /* ignore */
  }
  return "classic";
}

function loadTheme(): ThemeId {
  try {
    const t = localStorage.getItem("serpent-theme") as ThemeId | null;
    if (t && THEMES.some((x) => x.id === t)) return t;
  } catch {
    /* ignore */
  }
  return "cyberpunk";
}

const getDiff = (id: DifficultyId) => DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];

/* ---------------- component ---------------- */

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game>(createGame(getDiff(loadDiff())));

  const [uiStatus, setUiStatus] = useState<Status>("menu");
  const [difficulty, setDifficulty] = useState<DifficultyId>(loadDiff);
  const [themeId, setThemeId] = useState<ThemeId>(loadTheme);
  const [menuTab, setMenuTab] = useState<"diff" | "skins">("diff");
  const [score, setScore] = useState(0);
  const [scorePulse, setScorePulse] = useState(0);
  const [best, setBest] = useState(() => loadBest(loadDiff()));
  const [eaten, setEaten] = useState(0);
  const [muted, setMuted] = useState(sfx.muted);
  const [boardSize, setBoardSize] = useState(0);
  const [isCoarse, setIsCoarse] = useState(false);
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [forceTouchControls, setForceTouchControls] = useState<boolean | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [youWin, setYouWin] = useState(false);
  const [unlockToast, setUnlockToast] = useState<string | null>(null);

  const sizeRef = useRef(0);
  const dprRef = useRef(1);
  const diffRef = useRef(difficulty);
  const themeRef = useRef(themeId);
  const scoreSeen = useRef(0);
  const eatenSeen = useRef(0);
  const statusSeen = useRef<Status>("menu");

  const activeTheme = getTheme(themeId);
  themeRef.current = themeId;

  // Maximum lifetime best score across all difficulties to check unlocks
  const maxLifetimeScore = Math.max(loadBest("chill"), loadBest("classic"), loadBest("insane"), best);

  /* ------- actions ------- */

  const startRun = useCallback((id?: DifficultyId) => {
    const diffId = id ?? diffRef.current;
    sfx.unlock();
    sfx.play("start");
    const g = createGame(getDiff(diffId));
    g.status = "playing";
    gameRef.current = g;
    scoreSeen.current = 0;
    eatenSeen.current = 0;
    statusSeen.current = "playing";
    setScore(0);
    setEaten(0);
    setIsNewBest(false);
    setYouWin(false);
    setUiStatus("playing");
  }, []);

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (g.status === "playing") {
      g.status = "paused";
      statusSeen.current = "paused";
      sfx.play("pause");
      setUiStatus("paused");
    } else if (g.status === "paused") {
      g.status = "playing";
      statusSeen.current = "playing";
      sfx.play("resume");
      setUiStatus("playing");
    }
  }, []);

  const toMenu = useCallback(() => {
    const g = gameRef.current;
    g.status = "menu";
    statusSeen.current = "menu";
    sfx.play("click");
    setUiStatus("menu");
  }, []);

  const primaryAction = useCallback(() => {
    const s = gameRef.current.status;
    if (s === "menu" || s === "over") startRun();
    else togglePause();
  }, [startRun, togglePause]);

  const steer = useCallback((d: Dir) => {
    const g = gameRef.current;
    if (g.status !== "playing") return;
    sfx.unlock();
    queueDir(g, d);
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const pickDifficulty = useCallback((id: DifficultyId) => {
    diffRef.current = id;
    setDifficulty(id);
    setBest(loadBest(id));
    sfx.unlock();
    sfx.play("click");
    try {
      localStorage.setItem("serpent-diff", id);
    } catch {
      /* ignore */
    }
  }, []);

  const pickTheme = useCallback((id: ThemeId) => {
    const targetTheme = getTheme(id);
    const unlocked = isThemeUnlocked(targetTheme, maxLifetimeScore);
    if (!unlocked) {
      sfx.unlock();
      sfx.play("die");
      return;
    }
    setThemeId(id);
    themeRef.current = id;
    sfx.unlock();
    sfx.play("click");
    try {
      localStorage.setItem("serpent-theme", id);
    } catch {
      /* ignore */
    }
  }, [maxLifetimeScore]);

  const cycleTheme = useCallback(() => {
    const currentIndex = THEMES.findIndex((t) => t.id === themeRef.current);
    for (let i = 1; i <= THEMES.length; i++) {
      const nextIndex = (currentIndex + i) % THEMES.length;
      const candidate = THEMES[nextIndex];
      if (isThemeUnlocked(candidate, maxLifetimeScore)) {
        pickTheme(candidate.id);
        break;
      }
    }
  }, [maxLifetimeScore, pickTheme]);

  const toggleMute = useCallback(() => {
    sfx.unlock();
    const m = !sfx.muted;
    sfx.setMuted(m);
    setMuted(m);
    if (!m) sfx.play("click");
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onFS = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFS);
    document.addEventListener("webkitfullscreenchange", onFS);
    return () => {
      document.removeEventListener("fullscreenchange", onFS);
      document.removeEventListener("webkitfullscreenchange", onFS);
    };
  }, []);

  const api = useRef({ startRun, togglePause, toMenu, primaryAction, steer, toggleMute, toggleFullscreen, cycleTheme });
  api.current = { startRun, togglePause, toMenu, primaryAction, steer, toggleMute, toggleFullscreen, cycleTheme };

  /* ------- keyboard ------- */

  useEffect(() => {
    const keyDir: Record<string, Dir> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === " " || k.startsWith("Arrow")) e.preventDefault();
      const dir = keyDir[k];
      if (dir) {
        api.current.steer(dir);
        return;
      }
      if (k === " " || k === "Enter") api.current.primaryAction();
      else if (k === "p" || k === "P") api.current.togglePause();
      else if (k === "r" || k === "R") api.current.startRun();
      else if (k === "m" || k === "M") api.current.toggleMute();
      else if (k === "f" || k === "F") api.current.toggleFullscreen();
      else if (k === "t" || k === "T") api.current.cycleTheme();
      else if (k === "Escape") {
        const s = gameRef.current.status;
        if (s === "playing" || s === "paused") api.current.togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------- zero-latency touch & tap gesture handling on screen ------- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let active = false;

    const handleInstantSteer = (clientX: number, clientY: number) => {
      const g = gameRef.current;
      if (g.status !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const r = canvas.getBoundingClientRect();
      const head = g.snake[0] || { x: g.cols / 2, y: g.rows / 2 };
      const headPxX = r.left + ((head.x + 0.5) / g.cols) * r.width;
      const headPxY = r.top + ((head.y + 0.5) / g.rows) * r.height;

      const tdx = clientX - headPxX;
      const tdy = clientY - headPxY;

      // If currently moving horizontally, tap above/below steers vertically
      if (g.dir === "left" || g.dir === "right") {
        if (Math.abs(tdy) > 8) {
          api.current.steer(tdy > 0 ? "down" : "up");
          return;
        }
      }
      // If currently moving vertically, tap left/right steers horizontally
      if (g.dir === "up" || g.dir === "down") {
        if (Math.abs(tdx) > 8) {
          api.current.steer(tdx > 0 ? "right" : "left");
          return;
        }
      }

      // General dominant axis
      if (Math.abs(tdx) > Math.abs(tdy)) {
        api.current.steer(tdx > 0 ? "right" : "left");
      } else {
        api.current.steer(tdy > 0 ? "down" : "up");
      }
    };

    const onStart = (e: TouchEvent) => {
      sfx.unlock();
      if (gameRef.current.status === "playing" && e.cancelable) {
        e.preventDefault();
      }
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      active = true;

      // Execute steer instantly on the first touch contact (0ms response)
      handleInstantSteer(t.clientX, t.clientY);
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      if (gameRef.current.status === "playing" && e.cancelable) {
        e.preventDefault();
      }
      const t = e.touches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

      const g = gameRef.current;
      if (g.dir === "left" || g.dir === "right") {
        if (Math.abs(dy) >= 10) {
          api.current.steer(dy > 0 ? "down" : "up");
        } else if (Math.abs(dx) >= 10) {
          api.current.steer(dx > 0 ? "right" : "left");
        }
      } else {
        if (Math.abs(dx) >= 10) {
          api.current.steer(dx > 0 ? "right" : "left");
        } else if (Math.abs(dy) >= 10) {
          api.current.steer(dy > 0 ? "down" : "up");
        }
      }

      sx = t.clientX;
      sy = t.clientY;
    };

    const onEnd = () => {
      active = false;
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  /* ------- board sizing and responsive checks ------- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateDimensions = () => {
      const r = el.getBoundingClientRect();
      const s = Math.max(160, Math.min(Math.floor(Math.min(r.width, r.height)), 680));
      sizeRef.current = s;
      setBoardSize(s);

      // Check landscape orientation for mobile/handheld screens
      const isLandscape = window.innerWidth > window.innerHeight && window.innerHeight < 540;
      setIsLandscapeMobile(isLandscape);
    };

    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    window.addEventListener("resize", updateDimensions);
    updateDimensions();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || boardSize === 0) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    dprRef.current = dpr;
    c.width = Math.round(boardSize * dpr);
    c.height = Math.round(boardSize * dpr);
  }, [boardSize]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarse(mq.matches || "ontouchstart" in window || navigator.maxTouchPoints > 0);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  /* ------- auto-pause when tab hidden ------- */

  useEffect(() => {
    const onVis = () => {
      if (document.hidden && gameRef.current.status === "playing") {
        gameRef.current.status = "paused";
        statusSeen.current = "paused";
        setUiStatus("paused");
        sfx.play("pause");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ------- main loop ------- */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const g = gameRef.current;

      if (g.status === "playing") {
        g.acc += dt * 1000;
        let guard = 0;
        while (g.acc >= g.tick && g.status === "playing" && guard < 5) {
          step(g);
          g.acc -= g.tick;
          guard++;
        }
      }
      updateFx(g, dt);

      // drain sound events
      if (g.sfx.length > 0) {
        for (const n of g.sfx.splice(0, g.sfx.length)) {
          sfx.play(n);
          if ((n === "eat" || n === "die") && "vibrate" in navigator) {
            try {
              navigator.vibrate(n === "die" ? [40, 30, 40] : 15);
            } catch {
              /* ignore */
            }
          }
        }
      }

      // sync UI state
      if (g.score !== scoreSeen.current) {
        scoreSeen.current = g.score;
        setScore(g.score);
        setScorePulse((p) => p + 1);
      }
      if (g.eaten !== eatenSeen.current) {
        eatenSeen.current = g.eaten;
        setEaten(g.eaten);
      }
      if (g.status !== statusSeen.current) {
        const prev = statusSeen.current;
        statusSeen.current = g.status;
        setUiStatus(g.status);
        if (g.status === "over" && prev !== "over") {
          setYouWin(g.youWin);
          const prevBest = loadBest(diffRef.current);
          if (g.score > prevBest && g.score > 0) {
            saveBest(diffRef.current, g.score);
            setBest(g.score);
            setIsNewBest(true);
            sfx.play("best");

            // Check if this new score unlocked any theme
            const newlyUnlocked = THEMES.find(
              (t) => t.unlockScore > 0 && prevBest < t.unlockScore && g.score >= t.unlockScore
            );
            if (newlyUnlocked) {
              setUnlockToast(`UNLOCKED: ${newlyUnlocked.name}!`);
              setTimeout(() => setUnlockToast(null), 5000);
            }
          }
        }
      }

      // render with active theme
      const canvas = canvasRef.current;
      if (canvas && sizeRef.current > 0) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const t = g.status === "playing" ? Math.min(1, g.acc / g.tick) : 1;
          draw(ctx, g, sizeRef.current, dprRef.current, t, getTheme(themeRef.current));
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ------- derived ------- */

  const diff = getDiff(difficulty);
  const speedLvl = Math.min(6, 1 + Math.floor(eaten / 4));
  const inRun = uiStatus === "playing" || uiStatus === "paused" || uiStatus === "dying";
  const showControls = forceTouchControls ?? false;

  return (
    <div
      className="relative h-[100dvh] w-full flex flex-col overflow-hidden select-none text-[#d8ffe9] safe-inset transition-colors duration-500"
      style={{ backgroundColor: activeTheme.ui.pitBg }}
    >
      {/* dynamic ambience */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{ background: activeTheme.ui.ambientGlow }}
      />
      <div className="pointer-events-none absolute inset-0 ambient-grid" />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-50 z-50" />
      <div className="pointer-events-none absolute inset-0 crt-vignette z-40" />

      {/* Unlock Toast */}
      {unlockToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 badge-wiggle bg-[rgba(255,209,102,0.95)] text-[#062513] font-display font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-[#ffd166]">
          <IconTrophy className="w-4 h-4" />
          <span>{unlockToast}</span>
        </div>
      )}

      {/* ---------- HUD ---------- */}
      {!isLandscapeMobile && (
        <header className="relative z-20 shrink-0 flex items-center justify-between gap-1 sm:gap-3 px-2.5 sm:px-6 pt-2 sm:pt-3 pb-1.5 sm:pb-2">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <SnakeMark className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 shrink-0" color={activeTheme.palette.accent} />
            <div className="hidden xs:block min-w-0">
              <div
                className="font-display font-bold text-xs sm:text-base md:text-lg leading-none truncate"
                style={{ color: activeTheme.palette.accentHot, textShadow: `0 0 12px ${activeTheme.palette.accentGlow}` }}
              >
                SERPENT
              </div>
              <div className="text-[7px] sm:text-[8px] tracking-[0.2em] text-[#7fae92] font-semibold mt-0.5 whitespace-nowrap">
                {activeTheme.name.toUpperCase()}
              </div>
            </div>
            <span
              className="font-display text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border bg-[rgba(12,33,23,0.85)] shrink-0"
              style={{ borderColor: `${diff.hue}66`, color: diff.hue }}
              title={diff.tagline}
            >
              {diff.label}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* speed meter (desktop/tablet) */}
            <div className="hidden md:flex flex-col items-end gap-1 mr-1">
              <span className="text-[9px] tracking-[0.25em] text-[#7fae92] font-semibold">SPEED</span>
              <div className="flex gap-[3px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-3.5 rounded-[2px] transition-colors duration-200"
                    style={{
                      background:
                        i < speedLvl ? (i >= 4 ? "#ffd166" : activeTheme.palette.accent) : "rgba(30,74,51,0.7)",
                      boxShadow:
                        i < speedLvl
                          ? `0 0 8px ${i >= 4 ? "rgba(255,209,102,0.6)" : activeTheme.palette.accentGlow}`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="panel rounded-md px-2 sm:px-3.5 py-0.5 sm:py-1.5 text-right min-w-[56px] sm:min-w-[90px] md:min-w-[110px]">
              <div className="text-[7px] sm:text-[9px] tracking-[0.2em] text-[#7fae92] font-semibold">SCORE</div>
              <div
                key={scorePulse}
                className="score-pulse font-display font-bold text-sm sm:text-xl md:text-2xl leading-tight"
                style={{ color: activeTheme.palette.accentHot, textShadow: `0 0 12px ${activeTheme.palette.accentGlow}` }}
              >
                {score}
              </div>
            </div>

            <div className="panel rounded-md px-2 sm:px-3.5 py-0.5 sm:py-1.5 text-right min-w-[56px] sm:min-w-[90px] md:min-w-[110px]">
              <div className="text-[7px] sm:text-[9px] tracking-[0.2em] text-[#7fae92] font-semibold flex items-center justify-end gap-1">
                <IconTrophy className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#ffd166]" /> BEST
              </div>
              <div className="font-display font-bold text-sm sm:text-xl md:text-2xl leading-tight text-[#ffd166] glow-gold">
                {best}
              </div>
            </div>

            {/* Theme switcher */}
            <button
              onClick={cycleTheme}
              className="btn-ghost rounded-md w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center shrink-0"
              style={{ color: activeTheme.palette.accent }}
              aria-label="Switch theme (T)"
              title={`Switch Theme: ${activeTheme.name} (T)`}
            >
              <IconPalette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={primaryAction}
              className="btn-ghost rounded-md w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center shrink-0"
              style={{ color: activeTheme.palette.accent }}
              aria-label={uiStatus === "playing" ? "Pause" : "Play"}
              title="Pause / resume (Space)"
            >
              {uiStatus === "playing" ? <IconPause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <IconPlay className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={toggleMute}
              className="btn-ghost rounded-md w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center shrink-0"
              style={{ color: activeTheme.palette.accent }}
              aria-label={muted ? "Unmute" : "Mute"}
              title="Sound (M)"
            >
              {muted ? <IconSoundOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <IconSoundOn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="btn-ghost rounded-md w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center shrink-0"
              style={{ color: activeTheme.palette.accent }}
              aria-label={isFullscreen ? "Exit Zoom (F)" : "Zoom Fullscreen (F)"}
              title={isFullscreen ? "Exit Fullscreen (F)" : "Zoom Fullscreen (F)"}
            >
              {isFullscreen ? <IconMinimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <IconMaximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* ---------- MAIN BOARD CONTAINER ---------- */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-1 sm:p-3 md:p-4">
        {isLandscapeMobile ? (
          /* Landscape Handheld Arcade Mode */
          <div className="w-full h-full flex items-center justify-between gap-2 px-2 max-w-5xl mx-auto">
            {/* Left D-pad */}
            <div className="flex flex-col items-center justify-center shrink-0 w-36">
              <div className="grid grid-cols-3 gap-1">
                <span />
                <button
                  className="dpad-btn rounded-md w-11 h-11 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("up");
                  }}
                  aria-label="Up"
                >
                  <IconChevron className="w-5 h-5" />
                </button>
                <span />
                <button
                  className="dpad-btn rounded-md w-11 h-11 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("left");
                  }}
                  aria-label="Left"
                >
                  <IconChevron className="w-5 h-5 -rotate-90" />
                </button>
                <button
                  className="dpad-btn rounded-md w-11 h-11 flex items-center justify-center text-[#ffd166]"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.primaryAction();
                  }}
                  aria-label="Action"
                >
                  {uiStatus === "playing" ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4" />}
                </button>
                <button
                  className="dpad-btn rounded-md w-11 h-11 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("right");
                  }}
                  aria-label="Right"
                >
                  <IconChevron className="w-5 h-5 rotate-90" />
                </button>
                <span />
                <button
                  className="dpad-btn rounded-md w-11 h-11 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("down");
                  }}
                  aria-label="Down"
                >
                  <IconChevron className="w-5 h-5 rotate-180" />
                </button>
                <span />
              </div>
            </div>

            {/* Center Board */}
            <div ref={containerRef} className="flex-1 h-full flex items-center justify-center min-w-0">
              <div
                className="board-frame relative rounded-lg"
                style={{ width: boardSize || 220, height: boardSize || 220, borderColor: activeTheme.ui.borderColor }}
              >
                <span className="corner rounded-tl -top-[2px] -left-[2px] border-t-2 border-l-2" style={{ borderColor: activeTheme.palette.accentHot }} />
                <span className="corner rounded-tr -top-[2px] -right-[2px] border-t-2 border-r-2" style={{ borderColor: activeTheme.palette.accentHot }} />
                <span className="corner rounded-bl -bottom-[2px] -left-[2px] border-b-2 border-l-2" style={{ borderColor: activeTheme.palette.accentHot }} />
                <span className="corner rounded-br -bottom-[2px] -right-[2px] border-b-2 border-r-2" style={{ borderColor: activeTheme.palette.accentHot }} />

                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-[6px] touch-none" />

                {/* Overlays rendered identically */}
                {renderOverlays()}
              </div>
            </div>

            {/* Right Info & Actions */}
            <div className="flex flex-col items-center justify-between shrink-0 w-36 h-full py-1">
              <div className="flex flex-col gap-1 w-full">
                <div className="panel rounded p-1.5 text-center">
                  <div className="text-[7px] tracking-[0.2em] text-[#7fae92] font-semibold">SCORE</div>
                  <div
                    className="font-display font-bold text-lg leading-none mt-0.5"
                    style={{ color: activeTheme.palette.accentHot }}
                  >
                    {score}
                  </div>
                </div>
                <div className="panel rounded p-1.5 text-center">
                  <div className="text-[7px] tracking-[0.2em] text-[#7fae92] font-semibold">BEST</div>
                  <div className="font-display font-bold text-lg text-[#ffd166] glow-gold leading-none mt-0.5">
                    {best}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={cycleTheme}
                  className="btn-ghost rounded py-1 text-[9px] text-[#d8ffe9] flex items-center justify-center gap-1 w-full"
                  title="Switch theme (T)"
                >
                  <IconPalette className="w-3 h-3" /> SKIN
                </button>
                <button
                  onClick={() => startRun()}
                  className="btn-chunky rounded py-1.5 text-[9px] font-bold flex items-center justify-center gap-1 w-full"
                  style={{ background: activeTheme.palette.accent, color: activeTheme.palette.bg }}
                >
                  <IconRestart className="w-3 h-3" /> RESTART
                </button>
                <button
                  onClick={toggleMute}
                  className="btn-ghost rounded py-1 text-[9px] text-[#d8ffe9] flex items-center justify-center gap-1 w-full"
                >
                  {muted ? <IconSoundOff className="w-3 h-3" /> : <IconSoundOn className="w-3 h-3" />}
                  {muted ? "MUTED" : "SOUND"}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="btn-ghost rounded py-1 text-[9px] text-[#d8ffe9] flex items-center justify-center gap-1 w-full"
                  title="Toggle Zoom / Fullscreen (F)"
                >
                  {isFullscreen ? <IconMinimize className="w-3 h-3" /> : <IconMaximize className="w-3 h-3" />}
                  {isFullscreen ? "MINIMIZE" : "ZOOM (F)"}
                </button>
                <div className="text-[7px] text-center text-[#7fae92] opacity-70 leading-tight pt-0.5">
                  by <span className="text-[#c0ff7a]">Abhishek</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard / Portrait Mode */
          <div ref={containerRef} className="w-full h-full max-w-[760px] mx-auto flex items-center justify-center">
            <div
              className="board-frame relative rounded-lg"
              style={{ width: boardSize || 280, height: boardSize || 280, borderColor: activeTheme.ui.borderColor }}
            >
              <span className="corner rounded-tl -top-[2px] -left-[2px] border-t-2 border-l-2" style={{ borderColor: activeTheme.palette.accentHot }} />
              <span className="corner rounded-tr -top-[2px] -right-[2px] border-t-2 border-r-2" style={{ borderColor: activeTheme.palette.accentHot }} />
              <span className="corner rounded-bl -bottom-[2px] -left-[2px] border-b-2 border-l-2" style={{ borderColor: activeTheme.palette.accentHot }} />
              <span className="corner rounded-br -bottom-[2px] -right-[2px] border-b-2 border-r-2" style={{ borderColor: activeTheme.palette.accentHot }} />

              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-[6px] touch-none" />

              {/* Overlays */}
              {renderOverlays()}
            </div>
          </div>
        )}
      </main>

      {/* ---------- FOOTER: HINTS / D-PAD ---------- */}
      {!isLandscapeMobile && (
        <footer className="relative z-20 shrink-0 pb-[max(env(safe-area-inset-bottom),6px)] px-2">
          {showControls ? (
            <div className="flex items-center justify-center gap-3 sm:gap-6 pt-1" onContextMenu={(e) => e.preventDefault()}>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <span />
                <button
                  className="dpad-btn rounded-lg w-13 h-11 sm:w-16 sm:h-13 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("up");
                  }}
                  aria-label="Up"
                >
                  <IconChevron className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <span />
                <button
                  className="dpad-btn rounded-lg w-13 h-11 sm:w-16 sm:h-13 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("left");
                  }}
                  aria-label="Left"
                >
                  <IconChevron className="w-5 h-5 sm:w-6 sm:h-6 -rotate-90" />
                </button>
                <button
                  className="dpad-btn rounded-lg w-13 h-11 sm:w-16 sm:h-13 flex items-center justify-center text-[#ffd166]"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.primaryAction();
                  }}
                  aria-label="Pause or play"
                >
                  {uiStatus === "playing" ? (
                    <IconPause className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <IconPlay className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                <button
                  className="dpad-btn rounded-lg w-13 h-11 sm:w-16 sm:h-13 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("right");
                  }}
                  aria-label="Right"
                >
                  <IconChevron className="w-5 h-5 sm:w-6 sm:h-6 rotate-90" />
                </button>
                <span />
                <button
                  className="dpad-btn rounded-lg w-13 h-11 sm:w-16 sm:h-13 flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    api.current.steer("down");
                  }}
                  aria-label="Down"
                >
                  <IconChevron className="w-5 h-5 sm:w-6 sm:h-6 rotate-180" />
                </button>
                <span />
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <button
                  onClick={() => startRun()}
                  className="btn-ghost rounded-md px-3 sm:px-4 py-2 sm:py-2.5 text-[9px] sm:text-[10px] text-[#d8ffe9] flex items-center gap-1.5"
                >
                  <IconRestart className="w-3 h-3" /> RESTART
                </button>
                <button
                  onClick={toggleMute}
                  className="btn-ghost rounded-md px-3 sm:px-4 py-2 sm:py-2.5 text-[9px] sm:text-[10px] text-[#d8ffe9] flex items-center gap-1.5"
                >
                  {muted ? <IconSoundOff className="w-3 h-3" /> : <IconSoundOn className="w-3 h-3" />}
                  {muted ? "SOUND OFF" : "SOUND ON"}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="btn-ghost rounded-md px-3 sm:px-4 py-2 sm:py-2.5 text-[9px] sm:text-[10px] text-[#d8ffe9] flex items-center gap-1.5"
                  title="Toggle Zoom / Fullscreen (F)"
                >
                  {isFullscreen ? <IconMinimize className="w-3 h-3" /> : <IconMaximize className="w-3 h-3" />}
                  {isFullscreen ? "EXIT ZOOM" : "ZOOM (F)"}
                </button>
                <button
                  onClick={() => setForceTouchControls(false)}
                  className="text-[9px] text-[#7fae92] underline hover:text-[#c0ff7a] text-center mt-0.5 cursor-pointer"
                >
                  Tap Mode (Hide Pad)
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center px-4 pt-1 sm:pt-2">
              <div className="inline-flex items-center flex-wrap justify-center gap-x-4 sm:gap-x-5 gap-y-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[rgba(8,22,15,0.85)] border border-[#1e4a33] text-xs sm:text-[13px] text-[#7fae92] shadow-xl">
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="kbd !px-2 !py-1 !text-[10px] sm:!text-[11px]">↑</span>
                    <span className="kbd !px-2 !py-1 !text-[10px] sm:!text-[11px]">↓</span>
                    <span className="kbd !px-2 !py-1 !text-[10px] sm:!text-[11px]">←</span>
                    <span className="kbd !px-2 !py-1 !text-[10px] sm:!text-[11px]">→</span>
                  </span>
                  <span className="text-xs text-[#b8f0cf] font-medium">Steer</span>
                </span>

                <span className="opacity-25 text-[#7fae92]">|</span>

                <span className="flex items-center gap-1.5">
                  <span className="kbd !px-2.5 !py-1 !text-[10px] sm:!text-[11px]">SPACE</span>
                  <span className="text-xs text-[#b8f0cf] font-medium">Pause</span>
                </span>

                <span className="opacity-25 text-[#7fae92]">|</span>

                <span className="flex items-center gap-1.5">
                  <span className="kbd !px-2 !py-1 !text-[10px] sm:!text-[11px]">R</span>
                  <span className="text-xs text-[#b8f0cf] font-medium">Restart</span>
                </span>

                <span className="opacity-25 text-[#7fae92]">|</span>

                <span className="flex items-center gap-1.5">
                  <span className="kbd !px-2 !py-1 !text-[10px] sm:!text-[11px]">M</span>
                  <span className="text-xs text-[#b8f0cf] font-medium">Sound</span>
                </span>

                <span className="opacity-25 text-[#7fae92]">|</span>

                <span className="flex items-center gap-1.5">
                  <span className="kbd !px-2 !py-1 !text-[10px] sm:!text-[11px]">F</span>
                  <span className="text-xs text-[#b8f0cf] font-medium">Zoom</span>
                </span>

                <span className="opacity-25 text-[#7fae92]">|</span>

                <button
                  onClick={cycleTheme}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.18)] text-xs hover:bg-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
                  style={{ color: activeTheme.palette.accentHot }}
                  title="Switch skin theme (T)"
                >
                  <IconPalette className="w-3.5 h-3.5" /> Skin: {activeTheme.name.split(" ")[0]}
                </button>

                <span className="opacity-25 text-[#7fae92]">|</span>

                <button
                  onClick={() => setForceTouchControls(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[rgba(141,255,87,0.12)] border border-[rgba(141,255,87,0.3)] text-[#c0ff7a] text-xs hover:bg-[rgba(141,255,87,0.22)] transition-colors cursor-pointer"
                  title="Show touch d-pad"
                >
                  <IconGamepad className="w-3.5 h-3.5" /> D-Pad
                </button>
              </div>
            </div>
          )}

          {/* Sarcastic Creator Credit */}
          <div className="mt-2.5 sm:mt-3 text-center text-xs sm:text-[13px] text-[#7fae92] opacity-90 select-none pb-1">
            Built by <span className="text-[#c0ff7a] font-semibold">Abhishek</span> · <span className="italic opacity-90">Eating your own tail is not a valid life strategy 🐍</span>
          </div>
        </footer>
      )}
    </div>
  );

  /* Helper to render Menu / Paused / Game Over overlays */
  function renderOverlays() {
    return (
      <>
        {/* ---- MENU ---- */}
        {uiStatus === "menu" && (
          <div className="absolute inset-0 z-30 rounded-[6px] overflow-y-auto neon-scrollbar bg-[rgba(4,13,8,0.94)] overlay-in flex flex-col">
            <div className="m-auto w-full flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-5 text-center">
              <SnakeMark className="w-9 h-9 sm:w-13 sm:h-13 slither shrink-0" color={activeTheme.palette.accent} />
              <div>
                <h1
                  className="font-display font-bold text-2xl sm:text-4xl md:text-5xl tracking-wide"
                  style={{
                    color: activeTheme.palette.accent,
                    textShadow: `0 0 16px ${activeTheme.palette.accentGlow}, 0 4px 0 #0a3d24`,
                  }}
                >
                  SERPENT
                </h1>
                <p className="mt-0.5 text-[8px] sm:text-[10px] tracking-[0.25em] text-[#ffd166] font-semibold whitespace-nowrap">
                  {activeTheme.name.toUpperCase()}
                </p>
              </div>

              {/* Tab Selector: Difficulty vs Skins */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[rgba(12,33,23,0.9)] border border-[#1e4a33]">
                <button
                  onClick={() => setMenuTab("diff")}
                  className={`px-3 py-1 rounded text-[10px] font-display font-bold transition-all cursor-pointer ${
                    menuTab === "diff"
                      ? "bg-[rgba(141,255,87,0.2)] text-[#c0ff7a] border border-[rgba(141,255,87,0.4)]"
                      : "text-[#7fae92] hover:text-[#d8ffe9]"
                  }`}
                >
                  DIFFICULTY
                </button>
                <button
                  onClick={() => setMenuTab("skins")}
                  className={`px-3 py-1 rounded text-[10px] font-display font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    menuTab === "skins"
                      ? "bg-[rgba(141,255,87,0.2)] text-[#c0ff7a] border border-[rgba(141,255,87,0.4)]"
                      : "text-[#7fae92] hover:text-[#d8ffe9]"
                  }`}
                >
                  <IconPalette className="w-3 h-3" /> SKINS & THEMES
                </button>
              </div>

              {/* Tab Content: Difficulty Mode */}
              {menuTab === "diff" && (
                <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full max-w-sm">
                  {DIFFICULTIES.map((d) => {
                    const sel = d.id === difficulty;
                    return (
                      <button
                        key={d.id}
                        onClick={() => pickDifficulty(d.id)}
                        className="rounded border sm:border-2 p-1.5 sm:p-2.5 transition-transform duration-100 active:scale-95 text-center flex flex-col items-center justify-center cursor-pointer"
                        style={{
                          borderColor: sel ? d.hue : "#245c3d",
                          color: sel ? d.hue : "#7fae92",
                          background: sel ? `${d.hue}18` : "rgba(12,33,23,0.8)",
                          boxShadow: sel ? `0 0 14px ${d.hue}44` : "none",
                        }}
                      >
                        <span className="font-display font-bold text-[10px] sm:text-xs block leading-tight">{d.label}</span>
                        <span className="hidden xs:block text-[8px] sm:text-[9px] opacity-80 mt-0.5 leading-none truncate">
                          {d.tagline}
                        </span>
                        <span className="font-display text-[8px] sm:text-[9px] block mt-0.5 opacity-90">
                          ×{d.mult} PTS
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab Content: Skins & Themes */}
              {menuTab === "skins" && (
                <div className="grid grid-cols-2 gap-1.5 w-full max-w-sm">
                  {THEMES.map((th) => {
                    const unlocked = isThemeUnlocked(th, maxLifetimeScore);
                    const sel = th.id === themeId;
                    return (
                      <button
                        key={th.id}
                        onClick={() => pickTheme(th.id)}
                        className="rounded border sm:border-2 p-1.5 text-left transition-all relative flex flex-col justify-between cursor-pointer"
                        style={{
                          borderColor: sel ? th.palette.accent : unlocked ? "#245c3d" : "#1a2e23",
                          background: sel
                            ? `${th.palette.accent}20`
                            : unlocked
                              ? "rgba(12,33,23,0.8)"
                              : "rgba(6,16,11,0.7)",
                          boxShadow: sel ? `0 0 14px ${th.palette.accentGlow}` : "none",
                          opacity: unlocked ? 1 : 0.65,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="font-display font-bold text-[10px] block leading-tight truncate"
                            style={{ color: sel ? th.palette.accentHot : unlocked ? "#d8ffe9" : "#7fae92" }}
                          >
                            {th.name}
                          </span>
                          {!unlocked && (
                            <span className="flex items-center gap-0.5 text-[8px] text-[#ffd166] shrink-0">
                              <IconLock /> {th.tag}
                            </span>
                          )}
                          {sel && (
                            <span
                              className="text-[8px] font-bold px-1 rounded"
                              style={{ background: th.palette.accent, color: th.palette.bg }}
                            >
                              EQUIPPED
                            </span>
                          )}
                        </div>

                        {/* Color Swatch Dots */}
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: th.palette.head }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: th.palette.mid }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: th.palette.tail }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: th.palette.foodGradMid }} />
                          <span className="text-[7px] text-[#7fae92] ml-auto truncate">
                            {unlocked ? th.tag : `Need ${th.unlockScore} pts`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2 text-[#ffd166]">
                <IconTrophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[8px] sm:text-[10px] tracking-[0.2em] font-semibold text-[#7fae92]">
                  BEST ON {diff.label}
                </span>
                <span className="font-display font-bold text-sm sm:text-base glow-gold">{best}</span>
              </div>

              <button
                onClick={() => startRun()}
                className="btn-chunky rounded-md px-6 sm:px-9 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                style={{
                  background: activeTheme.palette.accent,
                  color: activeTheme.palette.bg,
                  borderColor: activeTheme.palette.accentHot,
                }}
              >
                <IconPlay className="w-3.5 h-3.5" /> START RUN
              </button>

              {isCoarse ? (
                <p className="text-[8px] sm:text-[10px] text-[#7fae92] tracking-[0.15em] font-semibold">
                  TAP SCREEN OR SWIPE TO STEER
                </p>
              ) : (
                <p className="text-[8px] sm:text-[10px] text-[#7fae92] flex flex-wrap items-center justify-center gap-1">
                  <span><span className="kbd">↑↓←→</span> steer</span>
                  <span className="opacity-40">·</span>
                  <span><span className="kbd">SPACE</span> pause</span>
                  <span className="opacity-40">·</span>
                  <span><span className="kbd">T</span> skins</span>
                  <span className="opacity-40">·</span>
                  <span><span className="kbd">F</span> zoom</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---- PAUSED ---- */}
        {uiStatus === "paused" && (
          <div className="absolute inset-0 z-30 rounded-[6px] overflow-y-auto neon-scrollbar bg-[rgba(4,13,8,0.9)] overlay-in flex flex-col">
            <div className="m-auto w-full flex flex-col items-center justify-center gap-3 sm:gap-5 p-4 text-center">
              <div>
                <h2 className="font-display font-bold title-gold text-2xl sm:text-4xl">PAUSED</h2>
                <p className="mt-1 text-[9px] sm:text-xs tracking-[0.3em] text-[#7fae92] font-semibold">
                  THE SERPENT WAITS
                </p>
              </div>
              <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-3 w-full max-w-xs justify-center">
                <button
                  onClick={togglePause}
                  className="btn-chunky rounded-md px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 w-full xs:w-auto cursor-pointer"
                  style={{ background: activeTheme.palette.accent, color: activeTheme.palette.bg }}
                >
                  <IconPlay className="w-3.5 h-3.5" /> RESUME
                </button>
                <button
                  onClick={() => startRun()}
                  className="btn-ghost rounded-md px-4 py-2.5 text-xs text-[#d8ffe9] flex items-center justify-center gap-1.5 w-full xs:w-auto cursor-pointer"
                >
                  <IconRestart className="w-3.5 h-3.5" /> RESTART
                </button>
                <button
                  onClick={toMenu}
                  className="btn-ghost rounded-md px-4 py-2.5 text-xs text-[#d8ffe9] flex items-center justify-center gap-1.5 w-full xs:w-auto cursor-pointer"
                >
                  <IconHome className="w-3.5 h-3.5" /> MENU
                </button>
              </div>
              {!isCoarse && (
                <p className="text-[9px] text-[#7fae92]">
                  <span className="kbd">SPACE</span> to resume
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---- GAME OVER ---- */}
        {uiStatus === "over" && (
          <div className="absolute inset-0 z-30 rounded-[6px] overflow-y-auto neon-scrollbar bg-[rgba(4,13,8,0.92)] overlay-in flex flex-col">
            <div className="m-auto w-full flex flex-col items-center justify-center gap-2.5 sm:gap-4 p-3 sm:p-5 text-center">
              <h2
                className={`font-display font-bold text-2xl sm:text-4xl pop-in ${
                  youWin ? "title-neon" : "title-coral"
                }`}
              >
                {youWin ? "BOARD CLEARED" : "GAME OVER"}
              </h2>

              {isNewBest && (
                <div className="badge-wiggle flex items-center gap-1.5 rounded-md border border-[#ffd166] bg-[rgba(255,209,102,0.12)] px-3 py-1 text-[#ffd166]">
                  <IconTrophy className="w-3.5 h-3.5" />
                  <span className="font-display font-bold text-[10px] sm:text-xs tracking-wider">NEW BEST!</span>
                </div>
              )}

              <div>
                <div className="text-[8px] sm:text-[9px] tracking-[0.3em] text-[#7fae92] font-semibold">FINAL SCORE</div>
                <div
                  className="font-display font-bold text-4xl sm:text-5xl leading-tight mt-0.5"
                  style={{ color: activeTheme.palette.accentHot, textShadow: `0 0 16px ${activeTheme.palette.accentGlow}` }}
                >
                  {score}
                </div>
              </div>

              <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-[#7fae92] font-semibold">
                <span className="flex items-center gap-1">
                  <IconTrophy className="w-3 h-3 text-[#ffd166]" />
                  BEST <span className="font-display text-[#ffd166]">{best}</span>
                </span>
                <span className="opacity-40">|</span>
                <span>
                  LENGTH <span className="font-display" style={{ color: activeTheme.palette.accentHot }}>{4 + eaten}</span>
                </span>
                <span className="opacity-40">|</span>
                <span>
                  APPLES <span className="font-display text-[#ff8a5c]">{eaten}</span>
                </span>
              </div>

              <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-2.5 mt-1 w-full max-w-xs justify-center">
                <button
                  onClick={() => startRun()}
                  className="btn-chunky rounded-md px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 w-full xs:w-auto cursor-pointer"
                  style={{ background: activeTheme.palette.accent, color: activeTheme.palette.bg }}
                >
                  <IconRestart className="w-3.5 h-3.5" /> RUN IT BACK
                </button>
                <button
                  onClick={toMenu}
                  className="btn-ghost rounded-md px-4 py-2.5 text-xs text-[#d8ffe9] flex items-center justify-center gap-1.5 w-full xs:w-auto cursor-pointer"
                >
                  <IconHome className="w-3.5 h-3.5" /> MENU
                </button>
              </div>
              <p className="blink-soft font-display text-[8px] sm:text-[9px] text-[#7fae92]">
                {isCoarse ? "TAP TO RETRY" : "PRESS SPACE TO RETRY"}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }
}
