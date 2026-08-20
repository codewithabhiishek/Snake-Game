export type ThemeId = "cyberpunk" | "gameboy" | "synthwave" | "matrix";

export interface Theme {
  id: ThemeId;
  name: string;
  shortName: string;
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
  };
}

export const THEMES: Theme[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    shortName: "CYBERPUNK",
    subtitle: "High voltage neon lime",
    tag: "DEFAULT",
    unlockScore: 0,
    palette: {
      accent: "#8dff57",
      accentHot: "#c0ff7a",
      accentGlow: "rgba(141, 255, 87, 0.45)",
      bg: "#0a1a12",
      bgAlt: "#0d2117",
      grid: "rgba(141, 255, 87, 0.045)",
      wallGradStart: "rgba(141, 255, 87, 0.14)",
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
    name: "Game Boy",
    shortName: "GAME BOY",
    subtitle: "1989 classic 4-shade LCD",
    tag: "60 PTS",
    unlockScore: 60,
    palette: {
      accent: "#9bbc0f",
      accentHot: "#c8e632",
      accentGlow: "rgba(155, 188, 15, 0.45)",
      bg: "#1a2614",
      bgAlt: "#22331b",
      grid: "rgba(155, 188, 15, 0.08)",
      wallGradStart: "rgba(155, 188, 15, 0.25)",
      wallGradEnd: "rgba(155, 188, 15, 0.05)",
      head: "#9bbc0f",
      mid: "#8bac0f",
      tail: "#306230",
      foodCore: "#ffffff",
      foodGradMid: "#9bbc0f",
      foodGradOuter: "#306230",
      foodGlow: "rgba(155, 188, 15, 0.7)",
      foodLeaf: "#8bac0f",
      popupColor: "#c8e632",
      particleColors: ["#c8e632", "#9bbc0f", "#8bac0f", "#306230"],
      eyeColor: "#0f380f",
      eyeGlint: "#ffffff",
      tongue: "#9bbc0f",
      vignetteOuter: "rgba(10, 18, 8, 0.55)",
    },
    ui: {
      pitBg: "#101a0c",
      borderColor: "#306230",
      ambientGlow: "radial-gradient(52rem 34rem at 12% -8%, rgba(155, 188, 15, 0.14), transparent 62%), radial-gradient(46rem 30rem at 96% 12%, rgba(200, 230, 50, 0.08), transparent 60%), radial-gradient(60rem 44rem at 50% 118%, rgba(48, 98, 48, 0.22), transparent 64%)",
    },
  },
  {
    id: "synthwave",
    name: "Synthwave",
    shortName: "SYNTHWAVE",
    subtitle: "Neon magenta & electric cyan",
    tag: "150 PTS",
    unlockScore: 150,
    palette: {
      accent: "#ff2a85",
      accentHot: "#00f0ff",
      accentGlow: "rgba(255, 42, 133, 0.55)",
      bg: "#120924",
      bgAlt: "#1c0e38",
      grid: "rgba(255, 42, 133, 0.09)",
      wallGradStart: "rgba(255, 42, 133, 0.25)",
      wallGradEnd: "rgba(0, 240, 255, 0.08)",
      head: "#00f0ff",
      mid: "#d946ef",
      tail: "#ff2a85",
      foodCore: "#ffffff",
      foodGradMid: "#ff007f",
      foodGradOuter: "#a21caf",
      foodGlow: "rgba(255, 42, 133, 0.85)",
      foodLeaf: "#00f0ff",
      popupColor: "#00f0ff",
      particleColors: ["#ff2a85", "#00f0ff", "#d946ef", "#ffd166"],
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
    name: "Matrix",
    shortName: "MATRIX",
    subtitle: "Digital phosphor cyber green",
    tag: "300 PTS",
    unlockScore: 300,
    palette: {
      accent: "#00ff66",
      accentHot: "#66ff99",
      accentGlow: "rgba(0, 255, 102, 0.55)",
      bg: "#020d06",
      bgAlt: "#061a0d",
      grid: "rgba(0, 255, 102, 0.08)",
      wallGradStart: "rgba(0, 255, 102, 0.22)",
      wallGradEnd: "rgba(0, 255, 102, 0.04)",
      head: "#66ff99",
      mid: "#00ff66",
      tail: "#005924",
      foodCore: "#ffffff",
      foodGradMid: "#00ff66",
      foodGradOuter: "#008f39",
      foodGlow: "rgba(0, 255, 102, 0.9)",
      foodLeaf: "#66ff99",
      popupColor: "#66ff99",
      particleColors: ["#66ff99", "#00ff66", "#00b347", "#ffffff"],
      eyeColor: "#020d06",
      eyeGlint: "#66ff99",
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
