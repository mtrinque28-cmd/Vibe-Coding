import { PLAYER_SPEED, TURN_SPEED, TRAIL_WIDTH } from "./constants.js";
import { clamp, lerpAngle } from "./utils.js";

export class Player {
  constructor(id, name, color, isHuman = false) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isHuman = isHuman;
    this.alive = false;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.turnInput = 0;
    this.speed = PLAYER_SPEED;
    this.trail = [];
    this.drawingTrail = false;
    this.lastGx = -1;
    this.lastGy = -1;
    this.wasInside = true;
    this.respawnAt = 0;
    this.kills = 0;
    this.deathMessage = "";
  }

  get gx() {
    return Math.floor(this.x);
  }

  get gy() {
    return Math.floor(this.y);
  }

  spawnAt(cx, cy, angle = Math.random() * Math.PI * 2) {
    this.x = cx + 0.5;
    this.y = cy + 0.5;
    this.angle = angle;
    this.alive = true;
    this.trail = [];
    this.drawingTrail = false;
    this.lastGx = this.gx;
    this.lastGy = this.gy;
    this.wasInside = true;
    this.respawnAt = 0;
    this.turnInput = 0;
  }

  update(dt, map) {
    if (!this.alive) return;

    if (this.targetAngle !== undefined) {
      this.angle = lerpAngle(this.angle, this.targetAngle, Math.min(1, TURN_SPEED * dt * 2.2));
    } else {
      this.angle += this.turnInput * TURN_SPEED * dt;
    }

    const prevX = this.x;
    const prevY = this.y;
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    const gx = this.gx;
    const gy = this.gy;

    if (!map.inBounds(gx, gy)) {
      this.die("You hit the border!");
      return;
    }

    const inside = map.isInsideTerritory(gx, gy, this.id);

    if (!inside) {
      if (!this.drawingTrail) {
        this.drawingTrail = true;
        this.trail = [{ gx, gy }];
        map.setTrail(gx, gy, this.id);
        this.lastGx = gx;
        this.lastGy = gy;
      } else {
        if (gx !== this.lastGx || gy !== this.lastGy) {
          map.markTrailSegment(this.lastGx, this.lastGy, gx, gy, this.id);
          this.trail.push({ gx, gy });
          this.lastGx = gx;
          this.lastGy = gy;
        }
      }
    } else if (this.drawingTrail && this.trail.length >= 3) {
      this.claimedLand = map.claimFromTrail(this.id, this.trail);
      this.trail = [];
      this.drawingTrail = false;
    } else if (this.drawingTrail && this.trail.length < 3) {
      map.clearPlayerTrail(this.id);
      this.trail = [];
      this.drawingTrail = false;
    }

    this.wasInside = inside;

    const trailOwner = map.getTrailOwner(gx, gy);
    if (trailOwner !== -1) {
      if (trailOwner === this.id && this.drawingTrail) {
        const safe = this.trail.slice(-4);
        if (safe.some((p) => p.gx === gx && p.gy === gy)) return null;
      }
      return { killId: trailOwner };
    }

    return null;
  }

  die(msg = "") {
    this.alive = false;
    this.deathMessage = msg;
    this.drawingTrail = false;
    this.trail = [];
  }

  getPercent(map) {
    const cells = map.countTerritory(this.id);
    return (cells / map.totalCells) * 100;
  }
}
