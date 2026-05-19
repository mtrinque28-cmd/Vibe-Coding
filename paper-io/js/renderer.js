import { GRID_W, GRID_H, BORDER } from "./constants.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.cellSize = 4;
    this.offsetX = 0;
    this.offsetY = 0;
    this.territoryCanvas = document.createElement("canvas");
    this.territoryCtx = this.territoryCanvas.getContext("2d", { alpha: false });
    this.trailCanvas = document.createElement("canvas");
    this.trailCtx = this.trailCanvas.getContext("2d", { alpha: true });
    this.territoryDirty = true;
    this.trailDirty = true;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scaleX = (w - 40) / GRID_W;
    const scaleY = (h - 40) / GRID_H;
    this.cellSize = Math.max(3, Math.min(scaleX, scaleY));
    const mapW = GRID_W * this.cellSize;
    const mapH = GRID_H * this.cellSize;
    this.offsetX = (w - mapW) / 2;
    this.offsetY = (h - mapH) / 2;

    this.territoryCanvas.width = GRID_W;
    this.territoryCanvas.height = GRID_H;
    this.trailCanvas.width = GRID_W;
    this.trailCanvas.height = GRID_H;
    this.territoryDirty = true;
    this.trailDirty = true;
  }

  worldToScreen(x, y) {
    return {
      x: this.offsetX + x * this.cellSize,
      y: this.offsetY + y * this.cellSize,
    };
  }

  markTerritoryDirty() {
    this.territoryDirty = true;
  }

  markTrailDirty() {
    this.trailDirty = true;
  }

  rebuildTerritory(map, players) {
    const ctx = this.territoryCtx;
    const img = ctx.createImageData(GRID_W, GRID_H);
    const data = img.data;
    const colorCache = {};

    for (const p of players) {
      colorCache[p.id] = hexToRgb(p.color);
    }

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const i = (y * GRID_W + x) * 4;
        if (x < BORDER || y < BORDER || x >= GRID_W - BORDER || y >= GRID_H - BORDER) {
          data[i] = 30;
          data[i + 1] = 32;
          data[i + 2] = 48;
          data[i + 3] = 255;
          continue;
        }
        const owner = map.territory[y * GRID_W + x];
        if (owner === -1) {
          data[i] = 242;
          data[i + 1] = 244;
          data[i + 2] = 248;
          data[i + 3] = 255;
        } else {
          const c = colorCache[owner];
          data[i] = Math.min(255, c.r * 0.55 + 100);
          data[i + 1] = Math.min(255, c.g * 0.55 + 100);
          data[i + 2] = Math.min(255, c.b * 0.55 + 100);
          data[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    this.territoryDirty = false;
  }

  rebuildTrails(map, players) {
    const ctx = this.trailCtx;
    ctx.clearRect(0, 0, GRID_W, GRID_H);

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const owner = map.trail[y * GRID_W + x];
        if (owner === -1) continue;
        const p = players.find((pl) => pl.id === owner);
        if (!p) continue;
        ctx.fillStyle = p.color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    this.trailDirty = false;
  }

  draw(map, players, human) {
    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    let camX = 0;
    let camY = 0;
    if (human?.alive) {
      const center = this.worldToScreen(human.x, human.y);
      camX = w / 2 - center.x;
      camY = h / 2 - center.y;
    }

    ctx.save();
    ctx.translate(camX, camY);

    ctx.fillStyle = "#12121f";
    ctx.fillRect(-camX, -camY, w + Math.abs(camX), h + Math.abs(camY));

    if (this.territoryDirty) this.rebuildTerritory(map, players);
    if (this.trailDirty) this.rebuildTrails(map, players);

    const mapW = GRID_W * this.cellSize;
    const mapH = GRID_H * this.cellSize;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.territoryCanvas,
      this.offsetX,
      this.offsetY,
      mapW,
      mapH
    );

    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(this.trailCanvas, this.offsetX, this.offsetY, mapW, mapH);
    ctx.globalAlpha = 1;

    for (const p of players) {
      if (!p.alive || !p.drawingTrail || p.trail.length < 2) continue;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(3, this.cellSize * 0.35);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const first = this.worldToScreen(p.trail[0].gx + 0.5, p.trail[0].gy + 0.5);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < p.trail.length; i++) {
        const pt = this.worldToScreen(p.trail[i].gx + 0.5, p.trail[i].gy + 0.5);
        ctx.lineTo(pt.x, pt.y);
      }
      const head = this.worldToScreen(p.x, p.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (const p of players) {
      if (!p.alive) continue;
      const { x: sx, y: sy } = this.worldToScreen(p.x, p.y);
      const r = this.cellSize * 0.55;

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.78, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (!p.isHuman) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.font = `bold ${Math.max(9, this.cellSize * 0.32)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(p.name, sx, sy - r - 4);
      }
    }

    ctx.restore();
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
