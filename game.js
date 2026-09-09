const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const endScreen = document.getElementById('endScreen');
const soloBtn = document.getElementById('soloBtn');
const coopBtn = document.getElementById('coopBtn');
const restartBtn = document.getElementById('restartBtn');
const toast = document.getElementById('toast');
const flashEl = document.getElementById('dimensionFlash');

let W = innerWidth;
let H = innerHeight;
let DPR = Math.min(devicePixelRatio || 1, 2);

function resize() {
  W = innerWidth;
  H = innerHeight;
  DPR = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  seedStars();
}
addEventListener('resize', resize);

const keys = {};
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape' && state !== 'menu') returnToMenu();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });

const DIMENSIONS = [
  { name: 'NEON CITY', skyA: '#040515', skyB: '#18062e', accent: '#22d3ee', accent2: '#8b5cf6', alien: '#86efac', terrain: 'city' },
  { name: 'CRYSTAL VOID', skyA: '#071426', skyB: '#260d3c', accent: '#67e8f9', accent2: '#e879f9', alien: '#a7f3d0', terrain: 'crystal' },
  { name: 'CYBER JUNGLE', skyA: '#03120f', skyB: '#10233c', accent: '#34d399', accent2: '#22d3ee', alien: '#bef264', terrain: 'jungle' },
  { name: 'SOLAR GRAVE', skyA: '#170707', skyB: '#28113f', accent: '#fb7185', accent2: '#f59e0b', alien: '#f0abfc', terrain: 'solar' },
  { name: 'THE RIFT', skyA: '#06020f', skyB: '#101438', accent: '#c084fc', accent2: '#22d3ee', alien: '#67e8f9', terrain: 'rift' }
];

let state = 'menu';
let lastMode = 1;
let lastTime = performance.now();
let distance = 0;
let level = 1;
let dimensionIndex = 0;
let nextPortalAt = 560;
let score = 0;
let kills = 0;
let spawnTimer = 0;
let bossTimer = -1;
let portal = null;
let shake = 0;
let screenGlow = 0;
let players = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let splats = [];
let stars = [];
let scenery = [];
let audioCtx = null;

function seedStars() {
  stars = Array.from({ length: Math.max(90, Math.floor(W / 10)) }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    s: Math.random() * 1.8 + 0.35,
    z: Math.random() * 0.9 + 0.1,
    tw: Math.random() * Math.PI * 2
  }));
  scenery = Array.from({ length: 16 }, (_, i) => ({
    x: i * (W / 7) + Math.random() * 110,
    y: H * (0.5 + Math.random() * 0.34),
    s: 30 + Math.random() * 100,
    kind: i % 4
  }));
}

function createPlayer(id) {
  const p1 = id === 1;
  return {
    id,
    x: Math.max(120, W * 0.2),
    y: H * (p1 ? 0.42 : 0.61),
    r: 17,
    hp: 100,
    maxHp: 100,
    alive: true,
    inv: 0,
    shotCd: 0,
    thrust: 0,
    color: p1 ? '#22d3ee' : '#ec4899',
    glow: p1 ? '#67e8f9' : '#f472b6',
    controls: p1
      ? { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', shoot: 'KeyF' }
      : { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'Enter' }
  };
}

function startGame(mode) {
  lastMode = mode;
  state = 'play';
  distance = 0;
  level = 1;
  dimensionIndex = 0;
  nextPortalAt = 560;
  score = 0;
  kills = 0;
  spawnTimer = 0.7;
  bossTimer = -1;
  portal = null;
  shake = 0;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  particles = [];
  splats = [];
  players = [createPlayer(1)];
  if (mode === 2) players.push(createPlayer(2));
  menu.classList.add('hidden');
  endScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  document.getElementById('p2Card').classList.toggle('hidden', mode !== 2);
  ensureAudio();
  showToast(mode === 2 ? 'CO-OP LINK ESTABLISHED' : 'NOVA-01 LAUNCHED');
  updateHUD();
}

function returnToMenu() {
  state = 'menu';
  hud.classList.add('hidden');
  endScreen.classList.add('hidden');
  menu.classList.remove('hidden');
  enemies = [];
  bullets = [];
  enemyBullets = [];
  portal = null;
}

soloBtn.onclick = () => startGame(1);
coopBtn.onclick = () => startGame(2);
restartBtn.onclick = () => startGame(lastMode);

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function sfx(freq = 440, duration = 0.05, type = 'sine', volume = 0.025) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1500);
}

function currentDimension() { return DIMENSIONS[dimensionIndex % DIMENSIONS.length]; }
function scrollSpeed() { return Math.min(410, 205 + level * 9); }
function livingPlayers() { return players.filter(p => p.alive); }
function targetPlayer() {
  const alive = livingPlayers();
  return alive.length ? alive[Math.floor(Math.random() * alive.length)] : null;
}

function spawnAlien(forceBoss = false) {
  const d = currentDimension();
  let type;
  if (forceBoss) type = 'BEHEMOTH';
  else {
    const roll = Math.random();
    if (level < 2) type = roll < 0.72 ? 'SKITTER' : 'MANTA';
    else if (level < 4) type = roll < 0.45 ? 'SKITTER' : roll < 0.78 ? 'MANTA' : 'EYE';
    else type = roll < 0.28 ? 'SKITTER' : roll < 0.56 ? 'MANTA' : roll < 0.82 ? 'EYE' : 'BRUTE';
  }

  const base = {
    SKITTER: { r: 15, hp: 22, speed: 115, damage: 12, score: 80, shooter: false },
    MANTA: { r: 24, hp: 48, speed: 72, damage: 17, score: 130, shooter: false },
    EYE: { r: 19, hp: 38, speed: 56, damage: 13, score: 155, shooter: true },
    BRUTE: { r: 34, hp: 105, speed: 43, damage: 25, score: 240, shooter: false },
    BEHEMOTH: { r: 67, hp: 520, speed: 32, damage: 32, score: 1600, shooter: true, boss: true }
  }[type];

  const hpScale = 1 + (level - 1) * (base.boss ? 0.16 : 0.11);
  enemies.push({
    ...base,
    type,
    x: W + base.r + Math.random() * 180,
    y: 130 + Math.random() * Math.max(120, H - 230),
    hp: Math.round(base.hp * hpScale),
    maxHp: Math.round(base.hp * hpScale),
    speed: base.speed + level * 2.4,
    damage: base.damage + Math.floor(level * 1.2),
    phase: Math.random() * Math.PI * 2,
    shootCd: 0.6 + Math.random(),
    color: d.alien,
    accent: d.accent2
  });

  if (forceBoss) {
    showToast('⚠ RIFT BEHEMOTH DETECTED');
    sfx(95, 0.45, 'sawtooth', 0.045);
  }
}

function spawnPortal() {
  if (portal) return;
  portal = { x: W + 180, y: H * 0.5, r: Math.min(135, H * 0.19), angle: 0, triggered: false };
  showToast('MULTIDIMENSIONAL PORTAL INBOUND');
  sfx(180, 0.28, 'sine', 0.035);
}

function enterPortal() {
  if (!portal || portal.triggered) return;
  portal.triggered = true;
  level++;
  dimensionIndex = (dimensionIndex + 1) % DIMENSIONS.length;
  nextPortalAt = distance + 560 + Math.min(240, level * 18);
  score += 900 + level * 80;
  screenGlow = 1;
  flashEl.classList.remove('flash');
  void flashEl.offsetWidth;
  flashEl.classList.add('flash');

  players.forEach((p, i) => {
    if (!p.alive && livingPlayers().length) {
      p.alive = true;
      p.hp = 55;
      p.x = Math.max(120, W * 0.2);
      p.y = H * (i === 0 ? 0.42 : 0.61);
      burst(p.x, p.y, p.color, 28, 250);
    } else if (p.alive) {
      p.hp = Math.min(p.maxHp, p.hp + 14);
    }
  });

  if (level % 4 === 0) bossTimer = 2.7;
  showToast(`LEVEL ${level} // ${currentDimension().name}`);
  sfx(520, 0.42, 'triangle', 0.05);
  setTimeout(() => { portal = null; }, 500);
}

function shoot(p) {
  if (!p.alive || p.shotCd > 0) return;
  p.shotCd = 0.14;
  bullets.push({ x: p.x + 29, y: p.y, vx: 760 + level * 5, r: 4, life: 1.7, damage: 19 + level * 0.8, owner: p.id, color: p.color });
  p.thrust = 1;
  burst(p.x + 28, p.y, p.glow, 4, 70);
  sfx(p.id === 1 ? 620 : 520, 0.035, 'square', 0.014);
}

function enemyShoot(e) {
  const t = targetPlayer();
  if (!t) return;
  const a = Math.atan2(t.y - e.y, t.x - e.x);
  const count = e.boss ? 5 : 1;
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * (e.boss ? 0.16 : 0);
    const sp = e.boss ? 330 : 280 + level * 4;
    enemyBullets.push({
      x: e.x - e.r * 0.5,
      y: e.y,
      vx: Math.cos(a + offset) * sp,
      vy: Math.sin(a + offset) * sp,
      r: e.boss ? 7 : 5,
      damage: e.boss ? 18 + level : 11 + Math.floor(level * 0.7),
      life: 4,
      color: e.color
    });
  }
  sfx(e.boss ? 120 : 210, 0.08, 'sawtooth', 0.012);
}

function burst(x, y, color, count = 12, power = 150) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * power + power * 0.15;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: Math.random() * 0.5 + 0.28,
      max: 0.78,
      r: Math.random() * 3.4 + 1,
      color
    });
  }
}

function alienSplash(e) {
  const palette = [e.color, currentDimension().accent, '#b7ff63'];
  for (let i = 0; i < (e.boss ? 42 : 16); i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 60 + Math.random() * (e.boss ? 320 : 190);
    particles.push({
      x: e.x, y: e.y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.45 + Math.random() * 0.55,
      max: 1,
      r: 2 + Math.random() * (e.boss ? 7 : 4),
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }
  splats.push({ x: e.x, y: e.y, r: e.r * 0.9, life: 1.15, max: 1.15, color: e.color, seed: Math.random() * 10 });
}

function damagePlayer(p, amount) {
  if (!p.alive || p.inv > 0) return;
  p.hp -= amount;
  p.inv = 0.55;
  shake = Math.max(shake, 8);
  burst(p.x, p.y, '#f8fafc', 10, 180);
  burst(p.x - 10, p.y, p.color, 8, 140);
  sfx(105, 0.16, 'sawtooth', 0.035);
  if (p.hp <= 0) destroyShip(p);
}

function destroyShip(p) {
  p.hp = 0;
  p.alive = false;
  shake = 15;
  burst(p.x, p.y, '#ffffff', 22, 330);
  burst(p.x, p.y, p.color, 34, 360);
  sfx(70, 0.5, 'sawtooth', 0.055);
  showToast(`NAVE ${p.id} DESTRUIDA`);
  if (!livingPlayers().length) finishGame();
}

function killAlien(e, index) {
  enemies.splice(index, 1);
  kills++;
  score += e.score + level * 9;
  shake = Math.max(shake, e.boss ? 14 : 4);
  alienSplash(e);
  sfx(e.boss ? 80 : 250, e.boss ? 0.5 : 0.07, 'triangle', e.boss ? 0.045 : 0.016);
}

function finishGame() {
  state = 'end';
  hud.classList.add('hidden');
  endScreen.classList.remove('hidden');
  document.getElementById('finalDistance').textContent = `${Math.floor(distance)} m`;
  document.getElementById('finalLevel').textContent = level;
  document.getElementById('finalKills').textContent = kills;
}

function circleHit(a, b, padding = 0) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + padding;
}

function update(dt) {
  const speed = scrollSpeed();
  const d = currentDimension();

  stars.forEach(s => {
    s.x -= speed * (0.04 + s.z * 0.16) * dt;
    s.tw += dt * (0.5 + s.z);
    if (s.x < -4) { s.x = W + Math.random() * 60; s.y = Math.random() * H; }
  });
  scenery.forEach(o => {
    o.x -= speed * 0.14 * dt;
    if (o.x < -o.s * 2) { o.x = W + Math.random() * W * 0.3; o.y = H * (0.52 + Math.random() * 0.32); }
  });

  if (state !== 'play') return;

  distance += speed * dt * 0.11;
  score += Math.floor(dt * 12 * level);
  screenGlow = Math.max(0, screenGlow - dt * 1.5);
  shake = Math.max(0, shake - dt * 28);

  if (!portal && distance >= nextPortalAt - 100) spawnPortal();
  if (portal) {
    portal.angle += dt * 2.4;
    portal.x -= speed * 0.62 * dt;
    const gateX = Math.max(...livingPlayers().map(p => p.x), W * 0.2);
    if (!portal.triggered && portal.x <= gateX + 20) enterPortal();
  }

  bossTimer -= dt;
  if (bossTimer > -1 && bossTimer <= 0) {
    spawnAlien(true);
    bossTimer = -1;
  }

  spawnTimer -= dt;
  const maxEnemies = Math.min(18, 5 + Math.floor(level * 1.15));
  if (spawnTimer <= 0 && enemies.length < maxEnemies && !portal?.triggered) {
    spawnAlien(false);
    spawnTimer = Math.max(0.27, 1.08 - level * 0.045) * (0.72 + Math.random() * 0.65);
  }

  players.forEach(p => {
    if (!p.alive) return;
    p.inv -= dt;
    p.shotCd -= dt;
    p.thrust = Math.max(0, p.thrust - dt * 5);
    const c = p.controls;
    let dx = (keys[c.right] ? 1 : 0) - (keys[c.left] ? 1 : 0);
    let dy = (keys[c.down] ? 1 : 0) - (keys[c.up] ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    const moveSpeed = 270;
    p.x += dx / len * moveSpeed * dt;
    p.y += dy / len * moveSpeed * dt;
    p.x = Math.max(76, Math.min(W * 0.68, p.x));
    p.y = Math.max(118, Math.min(H - 52, p.y));
    if (keys[c.shoot]) shoot(p);
  });

  bullets.forEach(b => { b.x += b.vx * dt; b.life -= dt; });
  bullets = bullets.filter(b => b.life > 0 && b.x < W + 80);

  enemyBullets.forEach(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  });

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    let hit = false;
    for (const p of players) {
      if (p.alive && circleHit(b, p)) {
        damagePlayer(p, b.damage);
        burst(b.x, b.y, b.color, 6, 110);
        hit = true;
        break;
      }
    }
    if (hit || b.life <= 0 || b.x < -50 || b.y < -50 || b.y > H + 50) enemyBullets.splice(i, 1);
  }

  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    e.phase += dt * (e.type === 'SKITTER' ? 5 : 2.2);
    const target = targetPlayer();
    const worldPull = speed * (e.boss ? 0.12 : 0.24);
    e.x -= (worldPull + e.speed) * dt;

    if (target) {
      const yDiff = target.y - e.y;
      const steer = e.type === 'SKITTER' ? 0.7 : e.type === 'MANTA' ? 0.38 : 0.22;
      e.y += Math.sign(yDiff) * Math.min(Math.abs(yDiff), e.speed * steer * dt * 2.2);
      e.y += Math.sin(e.phase) * (e.type === 'MANTA' ? 42 : 11) * dt;
    }

    if (e.shooter) {
      e.shootCd -= dt;
      if (e.shootCd <= 0 && e.x < W - 40) {
        enemyShoot(e);
        e.shootCd = e.boss ? 1.05 : Math.max(0.72, 1.7 - level * 0.045) + Math.random() * 0.55;
      }
    }

    let alienRemoved = false;
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (circleHit(b, e, -2)) {
        e.hp -= b.damage;
        bullets.splice(bi, 1);
        burst(b.x, b.y, b.color, 5, 90);
        if (e.hp <= 0) {
          killAlien(e, ei);
          alienRemoved = true;
          break;
        }
      }
    }
    if (alienRemoved) continue;

    for (const p of players) {
      if (p.alive && circleHit(e, p, -3)) {
        damagePlayer(p, e.damage);
        e.hp -= 24;
        e.x += 45;
        if (e.hp <= 0) {
          killAlien(e, ei);
          alienRemoved = true;
          break;
        }
      }
    }
    if (alienRemoved) continue;

    if (e.x < -e.r * 2) enemies.splice(ei, 1);
  }

  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.975;
    p.vy *= 0.975;
    p.life -= dt;
  });
  particles = particles.filter(p => p.life > 0);

  splats.forEach(s => { s.x -= speed * 0.22 * dt; s.life -= dt; });
  splats = splats.filter(s => s.life > 0 && s.x > -100);

  updateHUD();
}

function updateHUD() {
  document.getElementById('distanceText').textContent = `${String(Math.floor(distance)).padStart(4, '0')} m`;
  document.getElementById('levelText').textContent = String(level).padStart(2, '0');
  document.getElementById('dimensionText').textContent = currentDimension().name;
  document.getElementById('dimensionName').textContent = `DIMENSION // ${currentDimension().name}`;
  document.getElementById('scoreText').textContent = String(score).padStart(6, '0');
  document.getElementById('killsText').textContent = String(kills).padStart(3, '0');
  const remaining = Math.max(0, Math.ceil(nextPortalAt - distance));
  document.getElementById('portalDistance').textContent = portal ? 'PORTAL OPEN // HOLD COURSE' : `PORTAL IN ${remaining} m`;

  players.forEach((p, i) => {
    const bar = document.getElementById(i === 0 ? 'p1Hp' : 'p2Hp');
    const text = document.getElementById(i === 0 ? 'p1HpText' : 'p2HpText');
    if (bar) bar.style.width = `${Math.max(0, p.hp)}%`;
    if (text) text.textContent = p.alive ? Math.max(0, Math.ceil(p.hp)) : 'DOWN';
  });
}

function drawBackground(time) {
  const d = currentDimension();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, d.skyA);
  grad.addColorStop(0.72, d.skyB);
  grad.addColorStop(1, '#03040c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const nebula = ctx.createRadialGradient(W * 0.72, H * 0.36, 30, W * 0.72, H * 0.36, W * 0.55);
  nebula.addColorStop(0, hexAlpha(d.accent2, 0.18));
  nebula.addColorStop(0.42, hexAlpha(d.accent, 0.045));
  nebula.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, W, H);

  stars.forEach((s, i) => {
    ctx.globalAlpha = 0.25 + s.z * 0.6 + Math.sin(s.tw) * 0.08;
    ctx.fillStyle = i % 8 === 0 ? d.accent : '#e9f7ff';
    ctx.fillRect(s.x, s.y, s.s, s.s);
  });
  ctx.globalAlpha = 1;

  drawScenery(d, time);

  const horizon = H * 0.76;
  ctx.strokeStyle = hexAlpha(d.accent, 0.075);
  ctx.lineWidth = 1;
  for (let y = horizon; y < H; y += 27) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const shift = (distance * 8) % 78;
  for (let x = -100 - shift; x < W + 100; x += 78) {
    ctx.beginPath();
    ctx.moveTo(W * 0.5 + (x - W * 0.5) * 0.15, horizon);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
}

function drawScenery(d, time) {
  scenery.forEach((o, i) => {
    ctx.save();
    ctx.globalAlpha = 0.18 + (i % 3) * 0.035;
    if (d.terrain === 'city') {
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(o.x, o.y - o.s, o.s * 0.65, o.s);
      ctx.fillStyle = hexAlpha(d.accent, 0.65);
      for (let y = o.y - o.s + 12; y < o.y - 8; y += 17) ctx.fillRect(o.x + 10, y, 4, 4);
    } else if (d.terrain === 'crystal') {
      ctx.fillStyle = hexAlpha(d.accent2, 0.42);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.s * 0.22, o.y - o.s); ctx.lineTo(o.x + o.s * 0.55, o.y); ctx.closePath(); ctx.fill();
    } else if (d.terrain === 'jungle') {
      ctx.strokeStyle = hexAlpha(d.accent, 0.6); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.quadraticCurveTo(o.x - 30, o.y - o.s * 0.55, o.x + Math.sin(time * 0.001 + i) * 30, o.y - o.s); ctx.stroke();
    } else if (d.terrain === 'solar') {
      ctx.strokeStyle = hexAlpha(d.accent, 0.45); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o.x, o.y - o.s * 0.5, o.s * 0.38, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.strokeStyle = hexAlpha(d.accent2, 0.5); ctx.lineWidth = 2;
      ctx.rotate(Math.sin(time * 0.001 + i) * 0.1);
      ctx.strokeRect(o.x, o.y - o.s, o.s * 0.55, o.s * 0.55);
    }
    ctx.restore();
  });
}

function drawPortal(p) {
  if (!p) return;
  const d = currentDimension();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalCompositeOperation = 'lighter';

  const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, p.r * 1.4);
  glow.addColorStop(0, 'rgba(255,255,255,.7)');
  glow.addColorStop(0.16, hexAlpha(d.accent, 0.72));
  glow.addColorStop(0.48, hexAlpha(d.accent2, 0.28));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, p.r * 1.45, 0, Math.PI * 2); ctx.fill();

  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate(p.angle * (i % 2 ? -1 : 1) + i * 0.72);
    ctx.strokeStyle = i % 2 ? d.accent : d.accent2;
    ctx.globalAlpha = 0.65 - i * 0.07;
    ctx.lineWidth = 2 + (i % 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * (0.55 + i * 0.09), p.r * (1.02 - i * 0.06), 0, 0.15, Math.PI * 1.72);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(4,2,18,.82)';
  ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.32, p.r * 0.84, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.78;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, 0, p.r * 0.34, p.r * 0.85, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawShip(p, time) {
  if (!p.alive) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.inv > 0 && Math.floor(time / 70) % 2 === 0) ctx.globalAlpha = 0.38;

  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = hexAlpha(p.color, 0.28 + p.thrust * 0.25);
  ctx.beginPath();
  ctx.moveTo(-25, 0); ctx.lineTo(-50 - p.thrust * 13, -7); ctx.lineTo(-50 - p.thrust * 13, 7); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = '#dbe8f5';
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 0); ctx.lineTo(-7, -16); ctx.lineTo(-27, -11); ctx.lineTo(-17, 0); ctx.lineTo(-27, 11); ctx.lineTo(-7, 16); ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#111936';
  ctx.beginPath(); ctx.ellipse(7, 0, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.ellipse(10, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = p.color; ctx.shadowBlur = 16;
  ctx.fillRect(-20, -2, 8, 4);
  ctx.restore();
}

function drawAlien(e, time) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(Math.sin(e.phase) * 0.08);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = e.boss ? 30 : 14;

  if (e.type === 'SKITTER') {
    ctx.strokeStyle = e.color; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath(); ctx.moveTo(-5, i * 7); ctx.quadraticCurveTo(-20, i * 19, -27, i * 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, i * 7); ctx.quadraticCurveTo(20, i * 19, 27, i * 10); ctx.stroke();
    }
    ctx.fillStyle = '#192429'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 12, 0, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'MANTA') {
    ctx.fillStyle = '#17232b'; ctx.strokeStyle = e.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-28, 0); ctx.quadraticCurveTo(0, -27, 31, 0); ctx.quadraticCurveTo(0, 25, -28, 0); ctx.fill(); ctx.stroke();
  } else if (e.type === 'EYE') {
    ctx.fillStyle = '#202132'; ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.color; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = e.color; ctx.beginPath(); ctx.ellipse(-3, 0, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#071015'; ctx.beginPath(); ctx.arc(-1, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'BRUTE') {
    ctx.fillStyle = '#20262c'; ctx.strokeStyle = e.color; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2; const r = i % 2 ? e.r * 0.78 : e.r;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = e.color; ctx.fillRect(-7, -3, 17, 6);
  } else {
    ctx.fillStyle = '#21162d'; ctx.strokeStyle = e.color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 0, e.r * 0.82, e.r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(-10, i * 12); ctx.quadraticCurveTo(-65, i * 19 + Math.sin(time * .004 + i) * 15, -78, i * 17); ctx.stroke();
    }
    ctx.fillStyle = e.color; ctx.beginPath(); ctx.ellipse(9, 0, 22, 29, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#080915'; ctx.beginPath(); ctx.ellipse(13, 0, 9, 15, 0, 0, Math.PI * 2); ctx.fill();
  }

  if (e.hp < e.maxHp || e.boss) {
    const w = e.boss ? 105 : e.r * 2;
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(-w/2, -e.r - 16, w, 4);
    ctx.fillStyle = e.color; ctx.fillRect(-w/2, -e.r - 16, w * Math.max(0, e.hp/e.maxHp), 4);
  }
  ctx.restore();
}

function drawSplats() {
  splats.forEach(s => {
    const alpha = Math.max(0, s.life / s.max) * 0.36;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    for (let i = 0; i < 6; i++) {
      const a = s.seed + i * 1.04;
      const rr = s.r * (0.25 + (i % 3) * 0.14);
      ctx.beginPath();
      ctx.ellipse(s.x + Math.cos(a) * s.r * 0.7, s.y + Math.sin(a) * s.r * 0.5, rr, rr * 0.55, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawProjectiles() {
  ctx.globalCompositeOperation = 'lighter';
  bullets.forEach(b => {
    ctx.strokeStyle = b.color; ctx.lineWidth = 3; ctx.shadowColor = b.color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(b.x - 19, b.y); ctx.lineTo(b.x + 5, b.y); ctx.stroke();
  });
  enemyBullets.forEach(b => {
    ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
}

function drawParticles() {
  ctx.globalCompositeOperation = 'lighter';
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function hexAlpha(hex, alpha) {
  if (!hex || hex[0] !== '#') return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function draw(time) {
  ctx.save();
  if (shake > 0 && state === 'play') ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  drawBackground(time);
  drawSplats();
  if (portal) drawPortal(portal);
  enemies.forEach(e => drawAlien(e, time));
  drawProjectiles();
  players.forEach(p => drawShip(p, time));
  drawParticles();
  ctx.restore();

  if (screenGlow > 0) {
    ctx.fillStyle = hexAlpha(currentDimension().accent, screenGlow * 0.10);
    ctx.fillRect(0, 0, W, H);
  }
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  draw(now);
  requestAnimationFrame(loop);
}

resize();
updateHUD();
requestAnimationFrame(loop);