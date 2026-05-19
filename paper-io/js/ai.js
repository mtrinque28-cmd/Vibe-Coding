import { dist } from "./utils.js";
import { GRID_W, GRID_H, BORDER } from "./constants.js";

const TRAIL_RETURN = 42;
const DANGER_RADIUS = 6;

export function updateAI(player, map, players, dt) {
  if (!player.alive) return;

  const cx = player.gx;
  const cy = player.gy;
  const inside = map.isInsideTerritory(cx, cy, player.id);

  let targetAngle = player.angle;
  let danger = 0;
  let turn = 0;

  for (const other of players) {
    if (other.id === player.id || !other.alive || !other.drawingTrail) continue;
    for (let i = Math.max(0, other.trail.length - 24); i < other.trail.length; i++) {
      const t = other.trail[i];
      const d = dist(cx, cy, t.gx, t.gy);
      if (d < DANGER_RADIUS) {
        danger += (DANGER_RADIUS - d) / DANGER_RADIUS;
        const away = Math.atan2(cy - t.gy, cx - t.gx);
        targetAngle = away;
      }
    }
  }

  if (player.drawingTrail && player.trail.length > TRAIL_RETURN) {
    let tx = 0;
    let ty = 0;
    let n = 0;
    const step = 4;
    for (let y = BORDER; y < GRID_H - BORDER; y += step) {
      for (let x = BORDER; x < GRID_W - BORDER; x += step) {
        if (map.getOwner(x, y) === player.id) {
          tx += x;
          ty += y;
          n++;
        }
      }
    }
    if (n > 0) {
      tx /= n;
      ty /= n;
      targetAngle = Math.atan2(ty - cy, tx - cx);
    }
  } else {
    let bestScore = -1;
    let bestX = cx;
    let bestY = cy;
    const probes = 16;
    for (let i = 0; i < probes; i++) {
      const a = (i / probes) * Math.PI * 2 + player.id * 0.7;
      const px = cx + Math.cos(a) * 18;
      const py = cy + Math.sin(a) * 18;
      const gx = Math.floor(px);
      const gy = Math.floor(py);
      if (!map.inBounds(gx, gy)) continue;
      const owner = map.getOwner(gx, gy);
      let score = owner === -1 ? 3 : owner === player.id ? 0.2 : 1.5;
      if (map.getTrailOwner(gx, gy) !== -1) score -= 4;
      if (score > bestScore) {
        bestScore = score;
        bestX = gx;
        bestY = gy;
      }
    }
    targetAngle = Math.atan2(bestY - cy, bestX - cx);
    targetAngle += (Math.random() - 0.5) * 0.35;
  }

  if (danger > 0.3) {
    let diff = targetAngle - player.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    turn = Math.sign(diff) * Math.min(1, Math.abs(diff) * 2.5);
  } else {
    let diff = targetAngle - player.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    turn = clampTurn(diff * 3.2);
  }

  player.turnInput = turn;
}

function clampTurn(v) {
  return Math.max(-1, Math.min(1, v));
}
