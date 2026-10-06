import type { DuelGameState, DuelParticle } from "./types";
import { getTheme, type Theme } from "../themes";

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

export function drawDuel(
  ctx: CanvasRenderingContext2D,
  state: DuelGameState,
  sizePx: number,
  dpr: number,
  particles: DuelParticle[] = [],
  shake = 0,
  p1Theme?: Theme,
  p2Theme?: Theme
) {
  const th1 = p1Theme ?? getTheme("cyberpunk");
  const th2 = p2Theme ?? getTheme("synthwave");

  const cell = sizePx / state.cols;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, sizePx, sizePx);

  // Screen shake on death
  if (shake > 0.2) {
    const s = shake * 0.45;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  // Board background
  ctx.fillStyle = "#07130d";
  ctx.fillRect(0, 0, sizePx, sizePx);

  // Checkerboard grid pattern
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillStyle = "#0c1d15";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  // Subgrid lines
  ctx.strokeStyle = "rgba(141, 255, 87, 0.04)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < state.cols; i++) {
    ctx.moveTo(i * cell + 0.5, 0);
    ctx.lineTo(i * cell + 0.5, sizePx);
    ctx.moveTo(0, i * cell + 0.5);
    ctx.lineTo(sizePx, i * cell + 0.5);
  }
  ctx.stroke();

  // Danger outer perimeter
  ctx.strokeStyle = "rgba(255, 93, 93, 0.25)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, sizePx - 2, sizePx - 2);

  // Draw Food items
  for (const food of state.food) {
    const fx = (food.x + 0.5) * cell;
    const fy = (food.y + 0.5) * cell;
    const r = cell * 0.4;

    // Outer glow
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 1.9);
    glow.addColorStop(0, "rgba(255, 93, 93, 0.85)");
    glow.addColorStop(1, "rgba(255, 93, 93, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, r * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Apple core
    const appleGrad = ctx.createRadialGradient(fx - r * 0.25, fy - r * 0.25, 1, fx, fy, r);
    appleGrad.addColorStop(0, "#ffd166");
    appleGrad.addColorStop(0.4, "#ff5d5d");
    appleGrad.addColorStop(1, "#c01525");
    ctx.fillStyle = appleGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();

    // Stem / leaf
    ctx.fillStyle = "#8dff57";
    ctx.beginPath();
    ctx.arc(fx + r * 0.35, fy - r * 0.65, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Snakes: P1 and P2
  drawSnakeBody(ctx, state.snakes.p1.body, cell, th1.palette.head, th1.palette.mid, th1.palette.tail, state.snakes.p1.dir, "P1");
  drawSnakeBody(ctx, state.snakes.p2.body, cell, th2.palette.head, th2.palette.mid, th2.palette.tail, state.snakes.p2.dir, "P2");

  // Draw Particles
  for (const p of particles) {
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x * cell, p.y * cell, p.size * cell, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Overlays for countdown & end of round
  if (state.status === "countdown") {
    ctx.fillStyle = "rgba(4, 13, 8, 0.65)";
    ctx.fillRect(0, 0, sizePx, sizePx);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(cell * 3.5)}px 'Silkscreen', monospace`;
    ctx.fillStyle = "#ffd166";
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 18;
    ctx.fillText(String(state.countdown), sizePx / 2, sizePx / 2);

    ctx.font = `bold ${Math.round(cell * 0.9)}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = "#7fae92";
    ctx.shadowBlur = 0;
    ctx.fillText(`ROUND ${state.round} OF BEST OF ${state.targetWins * 2 - 1}`, sizePx / 2, sizePx / 2 + cell * 2.2);
    ctx.restore();
  }
}

function drawSnakeBody(
  ctx: CanvasRenderingContext2D,
  body: { x: number; y: number }[],
  cell: number,
  headColor: string,
  midColor: string,
  tailColor: string,
  dir: string,
  playerTag: string
) {
  if (body.length === 0) return;

  const len = body.length;
  for (let i = len - 1; i >= 0; i--) {
    const seg = body[i];
    const px = seg.x * cell;
    const py = seg.y * cell;
    const t = len <= 1 ? 0 : i / (len - 1);
    const color = t < 0.5 ? mixHex(headColor, midColor, t * 2) : mixHex(midColor, tailColor, (t - 0.5) * 2);

    if (i === 0) {
      // Head
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(px + 1.5, py + 1.5, cell - 3, cell - 3, 5);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#000";
      const eyeR = cell * 0.12;
      let e1x = px + cell * 0.3,
        e1y = py + cell * 0.3,
        e2x = px + cell * 0.7,
        e2y = py + cell * 0.3;

      if (dir === "left") {
        e1x = px + cell * 0.3;
        e1y = py + cell * 0.3;
        e2x = px + cell * 0.3;
        e2y = py + cell * 0.7;
      } else if (dir === "right") {
        e1x = px + cell * 0.7;
        e1y = py + cell * 0.3;
        e2x = px + cell * 0.7;
        e2y = py + cell * 0.7;
      } else if (dir === "down") {
        e1x = px + cell * 0.3;
        e1y = py + cell * 0.7;
        e2x = px + cell * 0.7;
        e2y = py + cell * 0.7;
      }

      ctx.beginPath();
      ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2);
      ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Small player tag above head
      ctx.save();
      ctx.font = `bold ${Math.round(cell * 0.45)}px 'Silkscreen', monospace`;
      ctx.fillStyle = headColor;
      ctx.textAlign = "center";
      ctx.fillText(playerTag, px + cell * 0.5, py - 4);
      ctx.restore();
    } else {
      // Body segment
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, cell - 4, cell - 4, 3);
      ctx.fill();
    }
  }
}
