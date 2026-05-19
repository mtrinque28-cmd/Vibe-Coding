import { GRID_W, GRID_H, BORDER } from "./constants.js";
import { pointInPolygon, polygonBounds, forEachCellOnLine } from "./utils.js";

export class GameMap {
  constructor() {
    this.territory = new Int16Array(GRID_W * GRID_H).fill(-1);
    this.trail = new Int16Array(GRID_W * GRID_H).fill(-1);
    this.totalCells = (GRID_W - BORDER * 2) * (GRID_H - BORDER * 2);
  }

  idx(x, y) {
    return y * GRID_W + x;
  }

  inBounds(x, y) {
    return x >= BORDER && x < GRID_W - BORDER && y >= BORDER && y < GRID_H - BORDER;
  }

  getOwner(x, y) {
    return this.territory[this.idx(x, y)];
  }

  getTrailOwner(x, y) {
    return this.trail[this.idx(x, y)];
  }

  setTerritory(x, y, playerId) {
    if (this.inBounds(x, y)) this.territory[this.idx(x, y)] = playerId;
  }

  setTrail(x, y, playerId) {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    this.trail[i] = playerId;
  }

  clearTrailCell(x, y) {
    if (this.inBounds(x, y)) this.trail[this.idx(x, y)] = -1;
  }

  isInsideTerritory(x, y, playerId) {
    return this.getOwner(x, y) === playerId;
  }

  /** Seed starting territory as a filled circle. */
  claimCircle(cx, cy, radius, playerId) {
    const r2 = radius * radius;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (!this.inBounds(x, y)) continue;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) this.setTerritory(x, y, playerId);
      }
    }
  }

  markTrailSegment(x0, y0, x1, y1, playerId) {
    forEachCellOnLine(x0, y0, x1, y1, (x, y) => {
      if (this.inBounds(x, y)) this.setTrail(x, y, playerId);
    });
  }

  clearPlayerTrail(playerId) {
    for (let i = 0; i < this.trail.length; i++) {
      if (this.trail[i] === playerId) this.trail[i] = -1;
    }
  }

  clearPlayerTerritory(playerId) {
    for (let i = 0; i < this.territory.length; i++) {
      if (this.territory[i] === playerId) this.territory[i] = -1;
    }
  }

  /**
   * Close loop: fill polygon from trail + claim trail cells.
   * Can capture neutral land and steal enclosed enemy territory.
   */
  claimFromTrail(playerId, trailPoints) {
    if (trailPoints.length < 2) return false;

    const poly = trailPoints.map((p) => ({ x: p.gx, y: p.gy }));
    const { minX, minY, maxX, maxY } = polygonBounds(poly);

    for (let y = minY - 1; y <= maxY + 1; y++) {
      for (let x = minX - 1; x <= maxX + 1; x++) {
        if (!this.inBounds(x, y)) continue;
        if (pointInPolygon(x + 0.5, y + 0.5, poly)) {
          this.setTerritory(x, y, playerId);
        }
      }
    }

    for (const p of trailPoints) {
      this.setTerritory(p.gx, p.gy, playerId);
      this.clearTrailCell(p.gx, p.gy);
    }

    this.clearPlayerTrail(playerId);
    return true;
  }

  countTerritory(playerId) {
    let n = 0;
    for (let i = 0; i < this.territory.length; i++) {
      if (this.territory[i] === playerId) n++;
    }
    return n;
  }

  /** Find random spawn away from others. */
  findSpawn(existing, minDist = 28) {
    for (let attempt = 0; attempt < 120; attempt++) {
      const cx =
        BORDER +
        8 +
        Math.floor(Math.random() * (GRID_W - BORDER * 2 - 16));
      const cy =
        BORDER +
        8 +
        Math.floor(Math.random() * (GRID_H - BORDER * 2 - 16));
      let ok = true;
      for (const p of existing) {
        if (!p.alive) continue;
        const d = Math.hypot(p.gx - cx, p.gy - cy);
        if (d < minDist) {
          ok = false;
          break;
        }
      }
      if (ok) return { cx, cy };
    }
    return {
      cx: Math.floor(GRID_W / 2),
      cy: Math.floor(GRID_H / 2),
    };
  }
}
