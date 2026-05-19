import {
  AI_COUNT,
  AI_NAMES,
  PLAYER_COLORS,
  RESPAWN_DELAY,
  GRID_W,
  GRID_H,
} from "./constants.js";
import { GameMap } from "./map.js";
import { Player } from "./player.js";
import { updateAI } from "./ai.js";
import { Renderer } from "./renderer.js";

const canvas = document.getElementById("game");
const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const deathScreen = document.getElementById("death-screen");
const playBtn = document.getElementById("play-btn");
const respawnBtn = document.getElementById("respawn-btn");
const nameInput = document.getElementById("name-input");
const playerPctEl = document.getElementById("player-pct");
const leaderboardEl = document.getElementById("leaderboard");
const deathMsgEl = document.getElementById("death-msg");
const finalPctEl = document.getElementById("final-pct");

const map = new GameMap();
const renderer = new Renderer(canvas);
const players = [];
let human = null;
let running = false;
let lastTime = 0;
let mouseX = GRID_W / 2;
let mouseY = GRID_H / 2;
const keys = { left: false, right: false };

function initPlayers() {
  players.length = 0;
  const name = (nameInput.value.trim() || "You").slice(0, 12);
  human = new Player(0, name, PLAYER_COLORS[0], true);
  players.push(human);

  for (let i = 0; i < AI_COUNT; i++) {
    players.push(
      new Player(
        i + 1,
        AI_NAMES[i % AI_NAMES.length],
        PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length]
      )
    );
  }
}

function spawnPlayer(p) {
  const { cx, cy } = map.findSpawn(players);
  map.clearPlayerTrail(p.id);
  if (!p.isHuman) map.clearPlayerTerritory(p.id);
  map.claimCircle(cx, cy, 5, p.id);
  p.spawnAt(cx + 0.5, cy + 0.5, Math.random() * Math.PI * 2);
  renderer.markTerritoryDirty();
  renderer.markTrailDirty();
}

function spawnAll() {
  for (const p of players) spawnPlayer(p);
}

function startGame() {
  initPlayers();
  map.territory.fill(-1);
  map.trail.fill(-1);
  spawnAll();
  running = true;
  menu.classList.add("hidden");
  deathScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function killPlayer(victimId, killerId) {
  const victim = players.find((p) => p.id === victimId);
  if (!victim || !victim.alive) return;

  map.clearPlayerTrail(victimId);
  victim.die(
    victim.isHuman
      ? killerId === victimId
        ? "You crossed your own trail!"
        : `Eliminated by ${players.find((p) => p.id === killerId)?.name || "an opponent"}!`
      : ""
  );

  if (killerId !== victimId) {
    const killer = players.find((p) => p.id === killerId);
    if (killer) killer.kills++;
  }

  victim.respawnAt = performance.now() / 1000 + RESPAWN_DELAY;
  renderer.markTerritoryDirty();
  renderer.markTrailDirty();

  if (victim.isHuman) {
    running = false;
    finalPctEl.textContent = `${victim.getPercent(map).toFixed(1)}%`;
    deathMsgEl.textContent = victim.deathMessage || "You were eliminated!";
    deathScreen.classList.remove("hidden");
    hud.classList.add("hidden");
  }
}

function updateHumanInput() {
  if (!human?.alive) return;

  if (keys.left) human.turnInput = -1;
  else if (keys.right) human.turnInput = 1;
  else human.turnInput = 0;

  const rect = canvas.getBoundingClientRect();
  const mx = ((mouseX - rect.left) / rect.width) * (window.innerWidth);
  const my = ((mouseY - rect.top) / rect.height) * (window.innerHeight);
  const worldX = (mx - renderer.offsetX) / renderer.cellSize;
  const worldY = (my - renderer.offsetY) / renderer.cellSize;

  if (Number.isFinite(worldX) && Number.isFinite(worldY)) {
    human.targetAngle = Math.atan2(worldY - human.y, worldX - human.x);
    human.turnInput = 0;
  }

  if (keys.left || keys.right) {
    human.targetAngle = undefined;
  }
}

function updateLeaderboard() {
  const ranked = players
    .map((p) => ({
      ...p,
      pct: p.alive ? p.getPercent(map) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  if (human?.alive) {
    playerPctEl.textContent = `${human.getPercent(map).toFixed(1)}%`;
    playerPctEl.style.color = human.color;
  }

  let html = "<h3>Leaderboard</h3>";
  ranked.forEach((p, i) => {
    const you = p.isHuman ? " is-you" : "";
    const dead = !p.alive ? " dead" : "";
    html += `<div class="lb-row${you}${dead}">
      <span class="lb-rank">${i + 1}</span>
      <span class="lb-swatch" style="background:${p.color}"></span>
      <span class="lb-name">${escapeHtml(p.name)}</span>
      <span class="lb-pct">${p.pct.toFixed(1)}%</span>
    </div>`;
  });
  leaderboardEl.innerHTML = html;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tick(dt) {
  const now = performance.now() / 1000;
  let territoryChanged = false;

  updateHumanInput();

  for (const p of players) {
    if (!p.alive) {
      if (p.respawnAt > 0 && now >= p.respawnAt) {
        spawnPlayer(p);
        p.respawnAt = 0;
        territoryChanged = true;
      }
      continue;
    }

    if (!p.isHuman) updateAI(p, map, players, dt);

    const result = p.update(dt, map);
    if (p.claimedLand) {
      territoryChanged = true;
      p.claimedLand = false;
    }
    if (result?.killId !== undefined) {
      killPlayer(result.killId, p.id);
    }
  }

  if (territoryChanged) renderer.markTerritoryDirty();
  renderer.markTrailDirty();
  updateLeaderboard();
}

function loop(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  tick(dt);
  renderer.draw(map, players, human);
  requestAnimationFrame(loop);
}

playBtn.addEventListener("click", startGame);
respawnBtn.addEventListener("click", startGame);

window.addEventListener("resize", () => renderer.resize());

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") keys.left = true;
  if (e.key === "d" || e.key === "ArrowRight") keys.right = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") keys.left = false;
  if (e.key === "d" || e.key === "ArrowRight") keys.right = false;
});

renderer.resize();
