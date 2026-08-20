import type { Game } from "./engine";
import type { Theme } from "./themes";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255,
    ag = (pa >> 8) & 255,
    ab = pa & 255;
  const br = (pb >> 16) & 255,
    bg = (pb >> 8) & 255,
    bb = pb & 255;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `rgb(${r},${g},${bl})`;
}

function segmentColor(i: number, len: number, headCol: string, midCol: string, tailCol: string): string {
  const t = len <= 1 ? 0 : i / (len - 1);
  return t < 0.5 ? mixHex(headCol, midCol, t * 2) : mixHex(midCol, tailCol, (t - 0.5) * 2);
}

export function draw(
  ctx: CanvasRenderingContext2D,
  g: Game,
  sizePx: number,
  dpr: number,
  t: number,
  theme?: Theme
) {
  const pal = theme?.palette ?? {
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
  };

  const cell = sizePx / g.cols;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, sizePx, sizePx);

  // screen shake
  if (g.shake > 0.2) {
    const s = g.shake * 0.5;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  // ---- board ----
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, sizePx, sizePx);
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillStyle = pal.bgAlt;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  // faint grid
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < g.cols; i++) {
    ctx.moveTo(i * cell + 0.5, 0);
    ctx.lineTo(i * cell + 0.5, sizePx);
    ctx.moveTo(0, i * cell + 0.5);
    ctx.lineTo(sizePx, i * cell + 0.5);
  }
  ctx.stroke();

  // danger walls glow
  const wallGrad = ctx.createLinearGradient(0, 0, 0, sizePx);
  wallGrad.addColorStop(0, pal.wallGradStart);
  wallGrad.addColorStop(0.5, pal.wallGradEnd);
  wallGrad.addColorStop(1, pal.wallGradStart);
  ctx.strokeStyle = wallGrad;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, sizePx - 3, sizePx - 3);

  // ---- food (pulsing item) ----
  {
    const fx = (g.food.x + 0.5) * cell;
    const fy = (g.food.y + 0.5) * cell;
    const pulse = 1 + Math.sin(g.time * 5.2) * 0.09;
    const r = cell * 0.34 * pulse;

    // spawn ring
    if (g.foodAge < 0.45) {
      const p = g.foodAge / 0.45;
      ctx.strokeStyle = pal.accentHot;
      ctx.globalAlpha = 0.7 * (1 - p);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx, fy, cell * (0.4 + p * 0.9), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.shadowColor = pal.foodGlow;
    ctx.shadowBlur = cell * 0.6;
    const grad = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.15, fx, fy, r);
    grad.addColorStop(0, pal.foodCore);
    grad.addColorStop(0.45, pal.foodGradMid);
    grad.addColorStop(1, pal.foodGradOuter);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // stem + leaf
    ctx.strokeStyle = theme?.id === "gameboy" ? "#0f380f" : "#8a5a2b";
    ctx.lineWidth = Math.max(1.5, cell * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(fx, fy - r * 0.9);
    ctx.lineTo(fx + r * 0.15, fy - r * 1.3);
    ctx.stroke();
    ctx.fillStyle = pal.foodLeaf;
    ctx.save();
    ctx.translate(fx + r * 0.55, fy - r * 1.15);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // shine
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.arc(fx - r * 0.32, fy - r * 0.35, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- snake (interpolated) ----
  const pts: { x: number; y: number }[] = [];
  const len = g.snake.length;
  for (let i = 0; i < len; i++) {
    const cur = g.snake[i];
    const prev = g.prevSnake[i] ?? g.prevSnake[g.prevSnake.length - 1] ?? cur;
    pts.push({
      x: lerp(prev.x, cur.x, t) + 0.5,
      y: lerp(prev.y, cur.y, t) + 0.5,
    });
  }

  const dying = g.status === "dying" || g.status === "over";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // body: taper from head to tail
  for (let i = pts.length - 1; i > 0; i--) {
    const frac = i / Math.max(1, pts.length - 1);
    const w = cell * lerp(0.82, 0.5, frac);
    let col = segmentColor(i, len, pal.head, pal.mid, pal.tail);
    if (dying && Math.floor(g.time * 14) % 2 === 0) col = mixHex("#ff5d5d", "#7a1f2b", frac);
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(pts[i].x * cell, pts[i].y * cell);
    ctx.lineTo(pts[i - 1].x * cell, pts[i - 1].y * cell);
    ctx.stroke();
  }

  // head
  if (pts.length > 0) {
    const h = pts[0];
    const hx = h.x * cell;
    const hy = h.y * cell;
    const hr = cell * 0.46;
    const dirVec =
      g.dir === "up"
        ? { x: 0, y: -1 }
        : g.dir === "down"
          ? { x: 0, y: 1 }
          : g.dir === "left"
            ? { x: -1, y: 0 }
            : { x: 1, y: 0 };
    const perp = { x: -dirVec.y, y: dirVec.x };

    ctx.save();
    if (!dying) {
      ctx.shadowColor = pal.accentGlow;
      ctx.shadowBlur = cell * 0.7;
    }
    ctx.fillStyle = dying ? "#ff5d5d" : pal.head;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // tongue flick
    if (!dying && g.time % 2.6 < 0.22) {
      const tp = (g.time % 2.6) / 0.22;
      const ext = Math.sin(tp * Math.PI) * cell * 0.55;
      ctx.strokeStyle = pal.tongue;
      ctx.lineWidth = Math.max(1.5, cell * 0.06);
      const bx = hx + dirVec.x * (hr + ext);
      const by = hy + dirVec.y * (hr + ext);
      ctx.beginPath();
      ctx.moveTo(hx + dirVec.x * hr * 0.7, hy + dirVec.y * hr * 0.7);
      ctx.lineTo(bx, by);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + (perp.x * 0.5 + dirVec.x * 0.6) * cell * 0.16, by + (perp.y * 0.5 + dirVec.y * 0.6) * cell * 0.16);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + (-perp.x * 0.5 + dirVec.x * 0.6) * cell * 0.16, by + (-perp.y * 0.5 + dirVec.y * 0.6) * cell * 0.16);
      ctx.stroke();
    }

    // eyes
    const blink = g.time % 3.1 < 0.12 ? 0.15 : 1;
    for (const s of [-1, 1]) {
      const ex = hx + dirVec.x * hr * 0.32 + perp.x * s * hr * 0.45;
      const ey = hy + dirVec.y * hr * 0.32 + perp.y * s * hr * 0.45;
      ctx.fillStyle = dying ? "#3a0d14" : pal.eyeColor;
      ctx.beginPath();
      ctx.ellipse(ex, ey, hr * 0.24, hr * 0.24 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!dying) {
        ctx.fillStyle = pal.eyeGlint;
        ctx.beginPath();
        ctx.arc(ex + dirVec.x * hr * 0.08, ey + dirVec.y * hr * 0.08 - hr * 0.05, hr * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ---- particles (additive) ----
  if (g.particles.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = theme?.id === "gameboy" ? "source-over" : "lighter";
    for (const p of g.particles) {
      const a = 1 - p.life / p.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const s = p.size * cell * (0.5 + a * 0.7);
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ---- score popups ----
  for (const p of g.popups) {
    const a = 1 - p.life / p.maxLife;
    const rise = p.life * 1.6;
    ctx.font = `700 ${Math.round(cell * 0.62)}px "Silkscreen", monospace`;
    ctx.textAlign = "center";
    ctx.globalAlpha = Math.min(1, a * 1.6);
    ctx.fillStyle = pal.bg;
    ctx.fillText(p.text, p.x * cell + 1.5, (p.y - rise) * cell + 1.5);
    ctx.fillStyle = pal.popupColor;
    ctx.fillText(p.text, p.x * cell, (p.y - rise) * cell);
    ctx.globalAlpha = 1;
  }

  // ---- vignette ----
  const vg = ctx.createRadialGradient(
    sizePx / 2,
    sizePx / 2,
    sizePx * 0.35,
    sizePx / 2,
    sizePx / 2,
    sizePx * 0.74
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, pal.vignetteOuter);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, sizePx, sizePx);

  // ---- death flash ----
  if (g.flash > 0) {
    ctx.fillStyle = `rgba(255,64,64,${g.flash * 0.32})`;
    ctx.fillRect(0, 0, sizePx, sizePx);
  }
}
