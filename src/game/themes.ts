export type ThemeId = "cyberpunk" | "gameboy" | "synthwave" | "matrix";

export interface Theme {
  id: ThemeId;
  name: string;
  subtitle: string;
  tag: string;
  unlockScore: number;
  palette: {
    accent: string;
    accentHot: string;
    accentGlow: string;
    bg: string;
    bgAlt: string;
    grid: string;
    wallGradStart: string;
    wallGradEnd: string;
    head: string;
    mid: string;
    tail: string;
    foodCore: string;
    foodGradMid: string;
    foodGradOuter: string;
    foodGlow: string;
    foodLeaf: string;
    popupColor: string;
    particleColors: string[];
    eyeColor: string;
    eyeGlint: string;
    tongue: string;
    vignetteOuter: string;
  };
  ui: {
    pitBg: string;
    borderColor: string;
    ambientGlow: string;
    fontClass?: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    subtitle: "High voltage lime & dark emerald",
    tag: "DEFAULT",
    unlockScore: 0,
    palette: {
      accent: "#8dff57",
      accentHot: "#c0ff7a",
      accentGlow: "rgba(141, 255, 87, 0.45)",
      bg: "#0a1a12",
      bgAlt: "#0d2117",
      grid: "rgba(141, 255, 87, 0.045)",
      wallGradStart: "rgba(141, 255, 87, 0.12)",
      wallGradEnd: "rgba(141, 255, 87, 0.02)",
      head: "#c0ff7a",
      mid: "#3fd97b",
      tail: "#116b43",
      foodCore: "#ffb38a",
      foodGradMid: "#ff5d5d",
      foodGradOuter: "#d92638",
      foodGlow: "rgba(255, 93, 93, 0.85)",
      foodLeaf: "#3fd97b",
      popupColor: "#ffd166",
      particleColors: ["#ff5d5d", "#ff8a5c", "#ffd166", "#c0ff7a"],
      eyeColor: "#062b18",
      eyeGlint: "#ffffff",
      tongue: "#ff5d7a",
      vignetteOuter: "rgba(2, 9, 5, 0.5)",
    },
    ui: {
      pitBg: "#06110c",
      borderColor: "#1e4a33",
      ambientGlow: "radial-gradient(52rem 34rem at 12% -8%, rgba(47, 191, 113, 0.16), transparent 62%), radial-gradient(46rem 30rem at 96% 12%, rgba(255, 209, 102, 0.08), transparent 60%), radial-gradient(60rem 44rem at 50% 118%, rgba(20, 122, 75, 0.22), transparent 64%)",
    },
  },
  {
    id: "gameboy",
    name: "Game Boy Classic",
    subtitle: "1989 4-shade greenish LCD pixel matrix",
    tag: "60 PTS",
    unlockScore: 60,
    palette: {
      accent: "#8bac0f",
      accentHot: "#9bbc0f",
      accentGlow: "rgba(155, 188, 15, 0.45)",
      bg: "#7a8a58",
      bgAlt: "#8b9b68",
      grid: "rgba(15, 56, 15, 0.12)",
      wallGradStart: "rgba(15, 56, 15, 0.35)",
      wallGradEnd: "rgba(15, 56, 15, 0.1)",
      head: "#0f380f",
      mid: "#306230",
      tail: "#8bac0f",
      foodCore: "#9bbc0f",
      foodGradMid: "#306230",
      foodGradOuter: "#0f380f",
      foodGlow: "rgba(15, 56, 15, 0.5)",
      foodLeaf: "#0f380f",
      popupColor: "#0f380f",
      particleColors: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
      eyeColor: "#9bbc0f",
      eyeGlint: "#9bbc0f",
      tongue: "#306230",
      vignetteOuter: "rgba(15, 56, 15, 0.45)",
    },
    ui: {
      pitBg: "#172010",
      borderColor: "#306230",
      ambientGlow: "radial-gradient(52rem 34rem at 12% -8%, rgba(139, 172, 15, 0.14), transparent 62%), radial-gradient(46rem 30rem at 96% 12%, rgba(155, 188, 15, 0.08), transparent 60%), radial-gradient(60rem 44rem at 50% 118%, rgba(48, 98, 48, 0.2), transparent 64%)",
    },
  },
  {
    id: "synthwave",
    name: "Synthwave Horizon",
    subtitle: "Neon magenta, electric cyan & retro sunset",
    tag: "150 PTS",
    unlockScore: 150,
    palette: {
      accent: "#ff2a85",
      accentHot: "#00f0ff",
      accentGlow: "rgba(255, 42, 133, 0.55)",
      bg: "#120924",
      bgAlt: "#1a0f33",
      grid: "rgba(255, 42, 133, 0.09)",
      wallGradStart: "rgba(255, 42, 133, 0.22)",
      wallGradEnd: "rgba(0, 240, 255, 0.08)",
      head: "#00f0ff",
      mid: "#c435ff",
      tail: "#ff2a85",
      foodCore: "#fff3a3",
      foodGradMid: "#ffd166",
      foodGradOuter: "#ff7700",
      foodGlow: "rgba(255, 209, 102, 0.85)",
      foodLeaf: "#00f0ff",
      popupColor: "#00f0ff",
      particleColors: ["#ff2a85", "#00f0ff", "#c435ff", "#ffd166"],
      eyeColor: "#090414",
      eyeGlint: "#ffffff",
      tongue: "#ff2a85",
      vignetteOuter: "rgba(11, 5, 24, 0.6)",
    },
    ui: {
      pitBg: "#0b0518",
      borderColor: "#4a196e",
      ambientGlow: "radial-gradient(52rem 34rem at 12% -8%, rgba(255, 42, 133, 0.18), transparent 62%), radial-gradient(46rem 30rem at 96% 12%, rgba(0, 240, 255, 0.12), transparent 60%), radial-gradient(60rem 44rem at 50% 118%, rgba(138, 43, 226, 0.25), transparent 64%)",
    },
  },
  {
    id: "matrix",
    name: "Matrix Terminal",
    subtitle: "Digital rain & phosphor green cyber terminal",
    tag: "300 PTS",
    unlockScore: 300,
    palette: {
      accent: "#00ff66",
      accentHot: "#a3ffcc",
      accentGlow: "rgba(0, 255, 102, 0.55)",
      bg: "#020d06",
      bgAlt: "#04170b",
      grid: "rgba(0, 255, 102, 0.07)",
      wallGradStart: "rgba(0, 255, 102, 0.2)",
      wallGradEnd: "rgba(0, 255, 102, 0.04)",
      head: "#a3ffcc",
      mid: "#00ff66",
      tail: "#005221",
      foodCore: "#ffffff",
      foodGradMid: "#00ff66",
      foodGradOuter: "#008f39",
      foodGlow: "rgba(0, 255, 102, 0.9)",
      foodLeaf: "#a3ffcc",
      popupColor: "#a3ffcc",
      particleColors: ["#a3ffcc", "#00ff66", "#00b347", "#ffffff"],
      eyeColor: "#020d06",
      eyeGlint: "#a3ffcc",
      tongue: "#00ff66",
      vignetteOuter: "rgba(1, 8, 4, 0.65)",
    },
    ui: {
      pitBg: "#010804",
      borderColor: "#083e1d",
      ambientGlow: "radial-gradient(52rem 34rem at 12% -8%, rgba(0, 255, 102, 0.16), transparent 62%), radial-gradient(46rem 30rem at 96% 12%, rgba(0, 255, 102, 0.08), transparent 60%), radial-gradient(60rem 44rem at 50% 118%, rgba(0, 82, 33, 0.28), transparent 64%)",
    },
  },
];

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isThemeUnlocked(theme: Theme, maxLifetimeScore: number): boolean {
  return maxLifetimeScore >= theme.unlockScore;
}
