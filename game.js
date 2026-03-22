(() => {
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameWrap = document.getElementById("gameWrap");

const startScreen = document.getElementById("startScreen");
const stageScreen = document.getElementById("stageScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startForm = document.getElementById("startForm");
const restartBtn = document.getElementById("restartBtn");
const stageConfirmBtn = document.getElementById("stageConfirmBtn");
const stageTitle = document.getElementById("stageTitle");
const stageDesc = document.getElementById("stageDesc");
const stageToolText = document.getElementById("stageToolText");
const recommendedItemText = document.getElementById("recommendedItemText");
const stagePreview = document.getElementById("stagePreview");
const stagePreviewCtx = stagePreview.getContext("2d");

const departmentInput = document.getElementById("departmentInput");
const nameInput = document.getElementById("nameInput");
const scoreText = document.getElementById("scoreText");
const hpText = document.getElementById("hpText");
const waveText = document.getElementById("waveText");
const weaponText = document.getElementById("weaponText");
const playerInfo = document.getElementById("playerInfo");
const helperText = document.getElementById("helperText");
const enemyNameText = document.getElementById("enemyNameText");
const preventionText = document.getElementById("preventionText");
const finalInfo = document.getElementById("finalInfo");

const W = 420, H = 760;
canvas.width = W; canvas.height = H;

const images = {
  playerSheet: new Image(),
  enemySheet: new Image(),
  startMascot: new Image()
};
images.playerSheet.src = "./assets/player_sheet.png";
images.enemySheet.src = "./assets/enemy_sheet.png";
images.startMascot.src = "./assets/start_mascot.png";

const PLAYER_FRAMES = {
  idle:   {x: 70,  y: 120, w: 250, h: 260},
  move1:  {x: 420, y: 145, w: 250, h: 240},
  move2:  {x: 610, y: 145, w: 250, h: 240},
  attack: {x: 920, y: 145, w: 230, h: 235},
  bubbleIdle:   {x: 75,  y: 420, w: 250, h: 220},
  bubbleAttack: {x: 1070, y: 410, w: 250, h: 240}
};

const ENEMY_FRAMES = {
  bacteriaGreen:  {x: 175, y: 470, w: 150, h: 165},
  bacteriaOrange: {x: 340, y: 470, w: 150, h: 165},
  virusGreen:     {x: 570, y: 455, w: 155, h: 180},
  virusPurple:    {x: 735, y: 460, w: 160, h: 180},
  superbugBeige:  {x: 1025, y: 450, w: 185, h: 210},
  superbugPurple: {x: 1185, y: 455, w: 180, h: 210}
};

const BULLET_FRAMES = {
  small: {x: 500, y: 170, w: 70, h: 85},
  medium:{x: 620, y: 155, w: 85, h: 100},
  large: {x: 740, y: 145, w: 110, h: 120}
};

const STAGES = [
  {
    id: 1,
    name: "Stage 1 · 손위생 스테이지",
    enemyName: "일반 세균",
    description: "환자 접촉 전후와 청결/오염 처치 전후에는 손위생이 가장 기본적인 예방 수단입니다.",
    prevention: "손소독제 사용 또는 비누와 물로 손씻기",
    recommended: "추천 도구: 손소독제 · 비누 손씻기",
    scoreToAdvance: 120,
    enemyFrames: ["bacteriaGreen", "bacteriaOrange"],
    bulletLabel: "손소독제"
  },
  {
    id: 2,
    name: "Stage 2 · 비말주의 스테이지",
    enemyName: "호흡기 바이러스",
    description: "기침, 재채기, 호흡기 증상이 있는 상황에서는 마스크 착용과 기침 예절이 중요합니다.",
    prevention: "마스크 착용 · 기침 예절 · 손위생",
    recommended: "추천 도구: 마스크 보호막",
    scoreToAdvance: 320,
    enemyFrames: ["virusGreen", "virusPurple"],
    bulletLabel: "비말 차단 소독탄"
  },
  {
    id: 3,
    name: "Stage 3 · 접촉주의 스테이지",
    enemyName: "다제내성균",
    description: "접촉주의가 필요한 균은 장갑·가운 착용과 환경 소독, 전용 물품 사용이 중요합니다.",
    prevention: "장갑 · 가운 · 환경소독 · 접촉주의",
    recommended: "추천 도구: 보호구 세트 + 환경소독",
    scoreToAdvance: 999999,
    enemyFrames: ["superbugBeige", "superbugPurple"],
    bulletLabel: "강화 소독 분사"
  }
];

const state = {
  running: false,
  paused: false,
  pendingStageIndex: 0,
  score: 0,
  stageIndex: 0,
  lastTime: 0,
  enemyTimer: 0,
  itemTimer: 0,
  shotTimer: 0,
  animationTime: 0,
  touchActive: false,
  touchX: 0,
  stars: [],
  bullets: [],
  enemies: [],
  items: [],
  floatingTexts: [],
  keys: {},
  playerName: "",
  department: "",
  player: null
};

function currentStage() { return STAGES[state.stageIndex]; }

function resetState() {
  state.running = false;
  state.paused = false;
  state.pendingStageIndex = 0;
  state.score = 0;
  state.stageIndex = 0;
  state.lastTime = 0;
  state.enemyTimer = 0;
  state.itemTimer = 0;
  state.shotTimer = 0;
  state.animationTime = 0;
  state.touchActive = false;
  state.touchX = 0;
  state.bullets = [];
  state.enemies = [];
  state.items = [];
  state.floatingTexts = [];
  state.player = {
    x: W / 2,
    y: H - 110,
    w: 34,
    h: 34,
    speed: 285,
    hp: 5,
    maxHp: 5,
    weapon: "기본",
    weaponLevel: 1,
    shield: 0,
    bubbleActive: false,
    fireCooldown: 0.22,
    hitFlash: 0,
    attackTimer: 0
  };
  makeStars();
  updateHud();
}

function makeStars() {
  state.stars = Array.from({ length: 44 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.8 + 0.5,
    v: Math.random() * 30 + 16
  }));
}

function lockScroll(locked) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  document.body.style.overflow = locked ? "hidden" : "";
}

function updateHud() {
  const stage = currentStage();
  scoreText.textContent = String(state.score);
  hpText.textContent = `${state.player.hp}${state.player.shield > 0 ? " +실드" : ""}`;
  waveText.textContent = String(stage.id);
  weaponText.textContent = state.player.weapon;
  enemyNameText.textContent = stage.enemyName;
  preventionText.textContent = stage.prevention;
  helperText.textContent = state.player.bubbleActive ? "버블이 활성화 · 보조 공격 중" : "버블이 비활성화";
  playerInfo.textContent = state.playerName ? `${state.department || "부서 미입력"} · ${state.playerName}` : "플레이어 미입력";
}

function showStageGuide(stageIndex) {
  state.paused = true;
  const stage = STAGES[stageIndex];
  stageTitle.textContent = stage.name;
  stageDesc.textContent = stage.description;
  stageToolText.textContent = stage.prevention;
  recommendedItemText.textContent = stage.recommended;
  stageScreen.classList.remove("hidden");
  drawStagePreview(stageIndex);
}

function hideStageGuideAndResume() {
  stageScreen.classList.add("hidden");
  state.paused = false;
  if (!state.running) {
    state.running = true;
    requestAnimationFrame(loop);
  }
}

function drawStagePreview(stageIndex) {
  const stage = STAGES[stageIndex];
  stagePreviewCtx.clearRect(0, 0, stagePreview.width, stagePreview.height);
  stagePreviewCtx.imageSmoothingEnabled = false;
  stagePreviewCtx.fillStyle = "#0f2348";
  stagePreviewCtx.fillRect(0, 0, stagePreview.width, stagePreview.height);

  if (!images.enemySheet.complete) return;

  const left = ENEMY_FRAMES[stage.enemyFrames[0]];
  const right = ENEMY_FRAMES[stage.enemyFrames[1]];
  drawSprite(stagePreviewCtx, images.enemySheet, left, 20, 30, 52, 52);
  drawSprite(stagePreviewCtx, images.enemySheet, right, 86, 30, 54, 54);

  stagePreviewCtx.fillStyle = "#6ec6ff";
  stagePreviewCtx.font = "bold 12px sans-serif";
  stagePreviewCtx.textAlign = "center";
  stagePreviewCtx.fillText(stage.enemyName, 80, 120);
}

function startGame() {
  resetState();
  state.playerName = (nameInput.value || "").trim();
  state.department = (departmentInput.value || "").trim();
  updateHud();
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  lockScroll(true);
  showStageGuide(0);
}

function finishGame() {
  state.running = false;
  state.paused = false;
  lockScroll(false);
  finalInfo.textContent = `${state.department || "부서 미입력"} ${state.playerName || "익명"} · 최종 점수 ${state.score}점`;
  gameOverScreen.classList.remove("hidden");
}

function maybeAdvanceStage() {
  const current = currentStage();
  if (state.score >= current.scoreToAdvance && state.stageIndex < STAGES.length - 1) {
    state.stageIndex += 1;
    updateHud();
    spawnFloating(`Stage ${state.stageIndex + 1}`, W / 2, H / 2, "#6ec6ff");
    showStageGuide(state.stageIndex);
  }
}

function spawnFloating(text, x, y, color = "#ffffff") {
  state.floatingTexts.push({ text, x, y, color, life: 0.9 });
}

function getGameX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return (clientX - rect.left) * (canvas.width / rect.width);
}

function drawSprite(targetCtx, img, frame, x, y, w, h) {
  targetCtx.drawImage(img, frame.x, frame.y, frame.w, frame.h, x, y, w, h);
}

function randomEnemyFrameName() {
  const list = currentStage().enemyFrames;
  return list[Math.floor(Math.random() * list.length)];
}

function shoot() {
  const p = state.player;
  p.attackTimer = 0.12;
  if (p.weaponLevel <= 1) {
    state.bullets.push({ x: p.x, y: p.y - 28, vx: 0, vy: -430, r: 7, power: 1, frame: "small" });
  } else if (p.weaponLevel === 2) {
    state.bullets.push({ x: p.x - 10, y: p.y - 28, vx: -30, vy: -430, r: 7, power: 1, frame: "small" });
    state.bullets.push({ x: p.x + 10, y: p.y - 28, vx: 30, vy: -430, r: 7, power: 1, frame: "small" });
    if (p.bubbleActive) {
      state.bullets.push({ x: p.x + 32, y: p.y - 34, vx: 0, vy: -400, r: 9, power: 1, frame: "medium", fromBubble: true });
    }
  } else {
    state.bullets.push({ x: p.x, y: p.y - 28, vx: 0, vy: -450, r: 9, power: 2, frame: "large" });
    state.bullets.push({ x: p.x - 16, y: p.y - 26, vx: -70, vy: -430, r: 7, power: 1, frame: "small" });
    state.bullets.push({ x: p.x + 16, y: p.y - 26, vx: 70, vy: -430, r: 7, power: 1, frame: "small" });
    if (p.bubbleActive) {
      state.bullets.push({ x: p.x + 30, y: p.y - 36, vx: 18, vy: -410, r: 10, power: 1, frame: "medium", fromBubble: true });
    }
  }
}

function spawnEnemy() {
  const frameName = randomEnemyFrameName();
  const stage = currentStage();
  const enemy = {
    frameName,
    x: 40 + Math.random() * (W - 80),
    y: -40,
    w: stage.id === 3 ? 54 : 46,
    h: stage.id === 3 ? 54 : 46,
    vx: stage.id === 2 ? (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 35) : 0,
    vy: 70 + stage.id * 10 + Math.random() * 25,
    hp: stage.id === 1 ? 1 : stage.id === 2 ? 2 : 4,
    value: stage.id === 1 ? 10 : stage.id === 2 ? 20 : 40,
    wobble: Math.random() * Math.PI * 2
  };
  state.enemies.push(enemy);
}

function spawnItem() {
  const stage = currentStage();
  const items = [
    { kind: "shield", label: stage.id === 1 ? "손위생 배지" : stage.id === 2 ? "마스크" : "보호구 세트" },
    { kind: "weapon", label: state.player.bubbleActive ? "소독 강화" : "버블이 활성화" },
    { kind: "heal", label: "회복 키트" }
  ];
  const item = items[Math.floor(Math.random() * items.length)];
  state.items.push({
    kind: item.kind,
    label: item.label,
    x: 35 + Math.random() * (W - 70),
    y: -24,
    w: 24,
    h: 24,
    vy: 110
  });
}

function circleRectHit(cx, cy, r, obj) {
  const tx = Math.max(obj.x - obj.w / 2, Math.min(cx, obj.x + obj.w / 2));
  const ty = Math.max(obj.y - obj.h / 2, Math.min(cy, obj.y + obj.h / 2));
  const dx = cx - tx;
  const dy = cy - ty;
  return dx * dx + dy * dy <= r * r;
}

function rectHit(a, b) {
  return (
    a.x - a.w / 2 < b.x + b.w / 2 &&
    a.x + a.w / 2 > b.x - b.w / 2 &&
    a.y - a.h / 2 < b.y + b.h / 2 &&
    a.y + a.h / 2 > b.y - b.h / 2
  );
}

function damagePlayer() {
  const p = state.player;
  if (p.shield > 0) {
    p.shield--;
    spawnFloating("예방 성공!", p.x, p.y - 12, "#7ff0b9");
  } else {
    p.hp--;
    p.hitFlash = 0.18;
    spawnFloating("-1", p.x, p.y - 12, "#ff7d7d");
  }
  updateHud();
  if (p.hp <= 0) finishGame();
}

function handleItem(item) {
  const p = state.player;
  if (item.kind === "shield") {
    p.shield = Math.min(2, p.shield + 1);
    spawnFloating(item.label + " 획득", item.x, item.y, "#7ff0b9");
  } else if (item.kind === "heal") {
    p.hp = Math.min(p.maxHp, p.hp + 1);
    spawnFloating("회복", item.x, item.y, "#7ff0b9");
  } else {
    if (!p.bubbleActive) {
      p.bubbleActive = true;
      p.weaponLevel = Math.max(2, p.weaponLevel);
      p.weapon = "버블이 협동";
      spawnFloating("버블이 활성화!", item.x, item.y, "#6ec6ff");
    } else {
      p.weaponLevel = 3;
      p.weapon = "강화 분사";
      spawnFloating("소독 분사 강화", item.x, item.y, "#6ec6ff");
    }
  }
  updateHud();
}

function update(dt) {
  if (state.paused) return;

  const p = state.player;
  state.animationTime += dt;
  p.hitFlash = Math.max(0, p.hitFlash - dt);
  p.attackTimer = Math.max(0, p.attackTimer - dt);

  if (state.keys["arrowleft"] || state.keys["a"]) p.x -= p.speed * dt;
  if (state.keys["arrowright"] || state.keys["d"]) p.x += p.speed * dt;
  if (state.touchActive) {
    const dx = state.touchX - p.x;
    p.x += dx * Math.min(1, dt * 9);
  }
  p.x = Math.max(30, Math.min(W - 30, p.x));

  state.shotTimer += dt;
  if (state.shotTimer >= p.fireCooldown) {
    state.shotTimer = 0;
    shoot();
  }

  state.enemyTimer += dt;
  const enemyGap = Math.max(0.42, 0.95 - currentStage().id * 0.08);
  if (state.enemyTimer >= enemyGap) {
    state.enemyTimer = 0;
    spawnEnemy();
  }

  state.itemTimer += dt;
  if (state.itemTimer >= 6.8) {
    state.itemTimer = 0;
    spawnItem();
  }

  state.stars.forEach(s => {
    s.y += s.v * dt;
    if (s.y > H) { s.y = -3; s.x = Math.random() * W; }
  });

  state.bullets.forEach(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  });
  state.bullets = state.bullets.filter(b => b.y > -40 && b.x > -40 && b.x < W + 40);

  state.enemies.forEach(e => {
    e.y += e.vy * dt;
    if (currentStage().id === 2) e.x += Math.sin(e.y * 0.03 + e.wobble) * e.vx * dt;
  });
  state.enemies = state.enemies.filter(e => e.y < H + 70);

  state.items.forEach(i => i.y += i.vy * dt);
  state.items = state.items.filter(i => i.y < H + 40);

  for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
    const b = state.bullets[bi];
    for (let ei = state.enemies.length - 1; ei >= 0; ei--) {
      const e = state.enemies[ei];
      if (circleRectHit(b.x, b.y, b.r, e)) {
        state.bullets.splice(bi, 1);
        e.hp -= b.power;
        if (e.hp <= 0) {
          state.score += e.value;
          spawnFloating(`+${e.value}`, e.x, e.y, "#7ff0b9");
          state.enemies.splice(ei, 1);
          updateHud();
          maybeAdvanceStage();
        }
        break;
      }
    }
  }

  for (let ei = state.enemies.length - 1; ei >= 0; ei--) {
    if (rectHit(p, state.enemies[ei])) {
      state.enemies.splice(ei, 1);
      damagePlayer();
    }
  }

  for (let ii = state.items.length - 1; ii >= 0; ii--) {
    const item = state.items[ii];
    if (rectHit(p, item)) {
      state.items.splice(ii, 1);
      handleItem(item);
    }
  }

  state.floatingTexts.forEach(f => {
    f.y -= 24 * dt;
    f.life -= dt;
  });
  state.floatingTexts = state.floatingTexts.filter(f => f.life > 0);
}

function drawPlayer() {
  if (!images.playerSheet.complete) return;
  const p = state.player;
  const moving = (state.keys["arrowleft"] || state.keys["arrowright"] || state.touchActive);
  let frame = PLAYER_FRAMES.idle;
  if (p.attackTimer > 0) frame = PLAYER_FRAMES.attack;
  else if (moving) frame = Math.sin(state.animationTime * 10) > 0 ? PLAYER_FRAMES.move1 : PLAYER_FRAMES.move2;

  const drawW = 64, drawH = 66;
  const x = p.x - drawW / 2;
  const y = p.y - drawH / 2;

  ctx.save();
  if (p.hitFlash > 0) ctx.globalAlpha = 0.75;
  drawSprite(ctx, images.playerSheet, frame, x, y, drawW, drawH);

  if (p.bubbleActive) {
    const bubbleFrame = p.attackTimer > 0 ? PLAYER_FRAMES.bubbleAttack : PLAYER_FRAMES.bubbleIdle;
    const bx = p.x + 18 + Math.sin(state.animationTime * 5) * 4;
    const by = p.y - 8 + Math.cos(state.animationTime * 4) * 3;
    drawSprite(ctx, images.playerSheet, bubbleFrame, bx - 28, by - 28, 56, 56);
  }

  if (p.shield > 0) {
    ctx.strokeStyle = "rgba(127,240,185,0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemy(enemy) {
  if (!images.enemySheet.complete) return;
  const frame = ENEMY_FRAMES[enemy.frameName];
  drawSprite(ctx, images.enemySheet, frame, enemy.x - enemy.w / 2, enemy.y - enemy.h / 2, enemy.w, enemy.h);
}

function drawBullet(bullet) {
  if (!images.enemySheet.complete) return;
  const frame = BULLET_FRAMES[bullet.frame];
  const size = bullet.frame === "large" ? 20 : bullet.frame === "medium" ? 16 : 12;
  drawSprite(ctx, images.enemySheet, frame, bullet.x - size / 2, bullet.y - size / 2, size, size);
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = item.kind === "weapon" ? "#6ec6ff" : item.kind === "heal" ? "#ff8f8f" : "#7ff0b9";
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  if (item.kind === "weapon") {
    ctx.fillRect(-2, -7, 4, 14);
    ctx.fillRect(-7, -2, 14, 4);
  } else if (item.kind === "heal") {
    ctx.fillRect(-2, -7, 4, 14);
    ctx.fillRect(-7, -2, 14, 4);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(8, -2); ctx.lineTo(5, 9); ctx.lineTo(0, 12); ctx.lineTo(-5, 9); ctx.lineTo(-8, -2); ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFloatingText(f) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
  ctx.fillStyle = f.color;
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(f.text, f.x, f.y);
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, W, H);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#102244");
  g.addColorStop(1, "#091226");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  state.stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  for (let y = -20; y < H + 30; y += 48) {
    const offset = state.lastTime * 0.18 % 48;
    ctx.beginPath();
    ctx.moveTo(W / 2, y + offset);
    ctx.lineTo(W / 2, y + 22 + offset);
    ctx.stroke();
  }

  state.items.forEach(drawItem);
  state.bullets.forEach(drawBullet);
  state.enemies.forEach(drawEnemy);
  drawPlayer();
  state.floatingTexts.forEach(drawFloatingText);

  ctx.fillStyle = "rgba(110,198,255,0.12)";
  ctx.fillRect(12, 12, 180, 44);
  ctx.fillStyle = "#dcecff";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(currentStage().name, 22, 30);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#b8c6e8";
  ctx.fillText(currentStage().recommended, 22, 48);
}

function loop(timestamp) {
  if (!state.running) return;
  if (!state.lastTime) state.lastTime = timestamp;
  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  update(dt);
  render();
  if (state.running) requestAnimationFrame(loop);
}

startForm.addEventListener("submit", e => {
  e.preventDefault();
  startGame();
});

stageConfirmBtn.addEventListener("click", () => {
  hideStageGuideAndResume();
});

restartBtn.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  lockScroll(false);
});

window.addEventListener("keydown", e => {
  state.keys[e.key.toLowerCase()] = true;
  if (["arrowleft", "arrowright", " ", "a", "d"].includes(e.key.toLowerCase())) e.preventDefault();
}, { passive: false });

window.addEventListener("keyup", e => {
  state.keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("pointerdown", e => {
  if (!state.running || state.paused) return;
  e.preventDefault();
  state.touchActive = true;
  state.touchX = getGameX(e.clientX);
}, { passive: false });

canvas.addEventListener("pointermove", e => {
  if (!state.touchActive || !state.running || state.paused) return;
  e.preventDefault();
  state.touchX = getGameX(e.clientX);
}, { passive: false });

window.addEventListener("pointerup", () => {
  state.touchActive = false;
});

canvas.addEventListener("touchstart", e => {
  if (!state.running || state.paused) return;
  e.preventDefault();
  const t = e.touches[0];
  if (!t) return;
  state.touchActive = true;
  state.touchX = getGameX(t.clientX);
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (!state.touchActive || !state.running || state.paused) return;
  e.preventDefault();
  const t = e.touches[0];
  if (!t) return;
  state.touchX = getGameX(t.clientX);
}, { passive: false });

canvas.addEventListener("touchend", e => {
  if (state.running) e.preventDefault();
  state.touchActive = false;
}, { passive: false });

["touchstart", "touchmove"].forEach(type => {
  gameWrap.addEventListener(type, e => {
    if (state.running) e.preventDefault();
  }, { passive: false });
});

resetState();
render();

images.enemySheet.onload = () => drawStagePreview(0);
})();
