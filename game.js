(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const gameWrap = document.getElementById("gameWrap");
  const stagePreview = document.getElementById("stagePreview");
  const spctx = stagePreview.getContext("2d");

  const el = (id) => document.getElementById(id);

  const startScreen = el("startScreen");
  const stageScreen = el("stageScreen");
  const gameOverScreen = el("gameOverScreen");
  const startForm = el("startForm");
  const restartBtn = el("restartBtn");
  const stageConfirmBtn = el("stageConfirmBtn");

  const stageTitle = el("stageTitle");
  const stageDesc = el("stageDesc");
  const stageToolText = el("stageToolText");
  const recommendedItemText = el("recommendedItemText");

  const departmentInput = el("departmentInput");
  const nameInput = el("nameInput");
  const scoreText = el("scoreText");
  const hpText = el("hpText");
  const waveText = el("waveText");
  const weaponText = el("weaponText");
  const playerInfo = el("playerInfo");
  const helperText = el("helperText");
  const enemyNameText = el("enemyNameText");
  const preventionText = el("preventionText");
  const finalInfo = el("finalInfo");

  const W = 420;
  const H = 760;
  canvas.width = W;
  canvas.height = H;

  const images = {
    player: new Image(),
    enemy: new Image(),
    bg: new Image(),
  };
  images.player.src = "./assets/player_sheet.png";
  images.enemy.src = "./assets/enemy_sheet.png";
  images.bg.src = "./assets/ward_bg.png";

  const PLAYER_FRAMES = {
    idle: { x: 70, y: 120, w: 250, h: 260 },
    move1: { x: 420, y: 145, w: 210, h: 240 },
    move2: { x: 650, y: 145, w: 210, h: 240 },
    attack: { x: 920, y: 145, w: 150, h: 235 },
    bubbleIdle: { x: 1030, y: 150, w: 150, h: 155 },
    bubbleAttack: { x: 1070, y: 410, w: 250, h: 200 },
  };

  const ENEMY_FRAMES = {
    bacteriaGreen: { x: 175, y: 470, w: 150, h: 165 },
    bacteriaOrange: { x: 340, y: 470, w: 150, h: 165 },
    virusGreen: { x: 570, y: 455, w: 155, h: 180 },
    virusPurple: { x: 735, y: 460, w: 160, h: 180 },
    superbugBeige: { x: 1025, y: 450, w: 185, h: 210 },
    superbugPurple: { x: 1185, y: 455, w: 180, h: 210 },
  };

  const BULLET_FRAMES = {
    small: { x: 500, y: 170, w: 70, h: 85 },
    medium: { x: 620, y: 155, w: 85, h: 100 },
    large: { x: 740, y: 145, w: 110, h: 120 },
  };

  const STAGES = [
    {
      id: 1,
      name: "Stage 1 · 손위생 스테이지",
      enemyName: "일반 세균",
      description:
        "환자 접촉 전후와 청결/오염 처치 전후에는 손위생이 가장 기본적인 예방 수단입니다.",
      prevention: "손소독제 사용 또는 비누와 물로 손씻기",
      recommended: "추천 도구: 손소독제 · 비누 손씻기",
      scoreToAdvance: 120,
      enemyFrames: ["bacteriaGreen", "bacteriaOrange"],
    },
    {
      id: 2,
      name: "Stage 2 · 비말주의 스테이지",
      enemyName: "호흡기 바이러스",
      description:
        "기침, 재채기, 호흡기 증상이 있는 상황에서는 마스크 착용과 기침 예절이 중요합니다.",
      prevention: "마스크 착용 · 기침 예절 · 손위생",
      recommended: "추천 도구: 마스크 보호막",
      scoreToAdvance: 320,
      enemyFrames: ["virusGreen", "virusPurple"],
    },
    {
      id: 3,
      name: "Stage 3 · 접촉주의 스테이지",
      enemyName: "다제내성균",
      description:
        "접촉주의가 필요한 균은 장갑·가운 착용과 환경 소독, 전용 물품 사용이 중요합니다.",
      prevention: "장갑 · 가운 · 환경소독 · 접촉주의",
      recommended: "추천 도구: 보호구 세트 + 환경소독",
      scoreToAdvance: 999999,
      enemyFrames: ["superbugBeige", "superbugPurple"],
    },
  ];

  const state = {
    running: false,
    paused: false,
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
    playerName: "",
    department: "",
    player: null,
  };

  const keys = {
    left: false,
    right: false,
  };

  const currentStage = () => STAGES[state.stageIndex];

  function drawSprite(targetCtx, img, frame, x, y, w, h) {
    if (!img.complete) return;
    targetCtx.drawImage(img, frame.x, frame.y, frame.w, frame.h, x, y, w, h);
  }

  function lockScroll(locked) {
    document.documentElement.style.overflow = locked ? "hidden" : "";
    document.body.style.overflow = locked ? "hidden" : "";
  }

  function getGameX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) * (canvas.width / rect.width);
  }

  function resetState() {
    state.running = false;
    state.paused = false;
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
      attackTimer: 0,
    };
    state.stars = Array.from({ length: 30 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      v: Math.random() * 18 + 10,
    }));
    updateHud();
  }

  function updateHud() {
    const st = currentStage();
    const p = state.player;
    scoreText.textContent = String(state.score);
    hpText.textContent = `${p.hp}${p.shield > 0 ? " +실드" : ""}`;
    waveText.textContent = String(st.id);
    weaponText.textContent = p.weapon;
    enemyNameText.textContent = st.enemyName;
    preventionText.textContent = st.prevention;
    helperText.textContent = p.bubbleActive
      ? "버블이 활성화 · 보조 공격 중"
      : "버블이 비활성화";
    playerInfo.textContent = state.playerName
      ? `${state.department || "부서 미입력"} · ${state.playerName}`
      : "플레이어 미입력";
  }

  function drawStagePreview(i) {
    const st = STAGES[i];
    spctx.clearRect(0, 0, 160, 160);
    spctx.fillStyle = "#102244";
    spctx.fillRect(0, 0, 160, 160);

    if (images.enemy.complete) {
      drawSprite(
        spctx,
        images.enemy,
        ENEMY_FRAMES[st.enemyFrames[0]],
        18,
        30,
        54,
        54
      );
      drawSprite(
        spctx,
        images.enemy,
        ENEMY_FRAMES[st.enemyFrames[1]],
        88,
        30,
        54,
        54
      );
    }

    spctx.fillStyle = "#dcecff";
    spctx.font = "bold 12px sans-serif";
    spctx.textAlign = "center";
    spctx.fillText(st.enemyName, 80, 122);
  }

  function showStageGuide(i) {
    state.paused = true;
    const st = STAGES[i];
    stageTitle.textContent = st.name;
    stageDesc.textContent = st.description;
    stageToolText.textContent = st.prevention;
    recommendedItemText.textContent = st.recommended;
    stageScreen.classList.remove("hidden");
    drawStagePreview(i);
  }

  function hideStageGuideAndResume() {
    stageScreen.classList.add("hidden");
    state.paused = false;
    if (!state.running) {
      state.running = true;
      requestAnimationFrame(loop);
    }
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
    finalInfo.textContent = `${state.department || "부서 미입력"} ${
      state.playerName || "익명"
    } · 최종 점수 ${state.score}점`;
    gameOverScreen.classList.remove("hidden");
  }

  function maybeAdvanceStage() {
    const st = currentStage();
    if (state.score >= st.scoreToAdvance && state.stageIndex < STAGES.length - 1) {
      state.stageIndex += 1;
      updateHud();
      spawnFloating(`Stage ${state.stageIndex + 1}`, W / 2, H / 2, "#6ec6ff");
      showStageGuide(state.stageIndex);
    }
  }

  function spawnFloating(text, x, y, color = "#fff") {
    state.floatingTexts.push({ text, x, y, color, life: 0.9 });
  }

  function shoot() {
    const p = state.player;
    p.attackTimer = 0.12;

    if (p.weaponLevel <= 1) {
      state.bullets.push({
        x: p.x,
        y: p.y - 28,
        vx: 0,
        vy: -430,
        r: 7,
        power: 1,
        frame: "small",
      });
    } else if (p.weaponLevel === 2) {
      state.bullets.push({
        x: p.x - 10,
        y: p.y - 28,
        vx: -30,
        vy: -430,
        r: 7,
        power: 1,
        frame: "small",
      });
      state.bullets.push({
        x: p.x + 10,
        y: p.y - 28,
        vx: 30,
        vy: -430,
        r: 7,
        power: 1,
        frame: "small",
      });
      if (p.bubbleActive) {
        state.bullets.push({
          x: p.x + 30,
          y: p.y - 34,
          vx: 0,
          vy: -400,
          r: 9,
          power: 1,
          frame: "medium",
        });
      }
    } else {
      state.bullets.push({
        x: p.x,
        y: p.y - 28,
        vx: 0,
        vy: -450,
        r: 9,
        power: 2,
        frame: "large",
      });
      state.bullets.push({
        x: p.x - 16,
        y: p.y - 26,
        vx: -70,
        vy: -430,
        r: 7,
        power: 1,
        frame: "small",
      });
      state.bullets.push({
        x: p.x + 16,
        y: p.y - 26,
        vx: 70,
        vy: -430,
        r: 7,
        power: 1,
        frame: "small",
      });
      if (p.bubbleActive) {
        state.bullets.push({
          x: p.x + 30,
          y: p.y - 36,
          vx: 18,
          vy: -410,
          r: 10,
          power: 1,
          frame: "medium",
        });
      }
    }
  }

  function spawnEnemy() {
    const st = currentStage();
    const list = st.enemyFrames;
    state.enemies.push({
      frameName: list[Math.floor(Math.random() * list.length)],
      x: 40 + Math.random() * (W - 80),
      y: -40,
      w: st.id === 3 ? 54 : 46,
      h: st.id === 3 ? 54 : 46,
      vx: st.id === 2 ? (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 35) : 0,
      vy: 70 + st.id * 10 + Math.random() * 25,
      hp: st.id === 1 ? 1 : st.id === 2 ? 2 : 4,
      value: st.id === 1 ? 10 : st.id === 2 ? 20 : 40,
      wobble: Math.random() * Math.PI * 2,
    });
  }

  function spawnItem() {
    const defs = [
      {
        kind: "shield",
        label:
          currentStage().id === 1
            ? "손위생 배지"
            : currentStage().id === 2
            ? "마스크"
            : "보호구 세트",
      },
      {
        kind: "weapon",
        label: state.player.bubbleActive ? "소독 강화" : "버블이 활성화",
      },
      { kind: "heal", label: "회복 키트" },
    ];
    const item = defs[Math.floor(Math.random() * defs.length)];
    state.items.push({
      kind: item.kind,
      label: item.label,
      x: 35 + Math.random() * (W - 70),
      y: -24,
      w: 24,
      h: 24,
      vy: 110,
    });
  }

  function circleRectHit(cx, cy, r, o) {
    const tx = Math.max(o.x - o.w / 2, Math.min(cx, o.x + o.w / 2));
    const ty = Math.max(o.y - o.h / 2, Math.min(cy, o.y + o.h / 2));
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

    if (keys.left) p.x -= p.speed * dt;
    if (keys.right) p.x += p.speed * dt;
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
    const gap = Math.max(0.42, 0.95 - currentStage().id * 0.08);
    if (state.enemyTimer >= gap) {
      state.enemyTimer = 0;
      spawnEnemy();
    }

    state.itemTimer += dt;
    if (state.itemTimer >= 6.8) {
      state.itemTimer = 0;
      spawnItem();
    }

    state.stars.forEach((st) => {
      st.y += st.v * dt;
      if (st.y > H) {
        st.y = -3;
        st.x = Math.random() * W;
      }
    });

    state.bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    });
    state.bullets = state.bullets.filter((b) => b.y > -40 && b.x > -40 && b.x < W + 40);

    state.enemies.forEach((e) => {
      e.y += e.vy * dt;
      if (currentStage().id === 2) {
        e.x += Math.sin(e.y * 0.03 + e.wobble) * e.vx * dt;
      }
    });
    state.enemies = state.enemies.filter((e) => e.y < H + 70);

    state.items.forEach((i) => {
      i.y += i.vy * dt;
    });
    state.items = state.items.filter((i) => i.y < H + 40);

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

    state.floatingTexts.forEach((f) => {
      f.y -= 24 * dt;
      f.life -= dt;
    });
    state.floatingTexts = state.floatingTexts.filter((f) => f.life > 0);
  }

  function drawBackground() {
    if (images.bg.complete) {
      const img = images.bg;
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.fillStyle = "rgba(8,18,38,0.62)";
      ctx.fillRect(0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#102244");
      g.addColorStop(1, "#091226");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    state.stars.forEach((st) => {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlayer() {
    const p = state.player;
    const moving = keys.left || keys.right || state.touchActive;

    let frame = PLAYER_FRAMES.idle;
    if (p.attackTimer > 0) frame = PLAYER_FRAMES.attack;
    else if (moving) frame = Math.sin(state.animationTime * 10) > 0 ? PLAYER_FRAMES.move1 : PLAYER_FRAMES.move2;

    drawSprite(ctx, images.player, frame, p.x - 29, p.y - 32, 58, 64);

    if (p.bubbleActive) {
      const bubbleFrame = p.attackTimer > 0 ? PLAYER_FRAMES.bubbleAttack : PLAYER_FRAMES.bubbleIdle;
      const bx = p.x + 28 + Math.sin(state.animationTime * 5) * 3;
      const by = p.y - 8 + Math.cos(state.animationTime * 4) * 3;
      const bw = p.attackTimer > 0 ? 42 : 34;
      const bh = p.attackTimer > 0 ? 36 : 34;
      drawSprite(ctx, images.player, bubbleFrame, bx - bw / 2, by - bh / 2, bw, bh);
    }

    if (p.shield > 0) {
      ctx.strokeStyle = "rgba(127,240,185,.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEnemy(e) {
    drawSprite(ctx, images.enemy, ENEMY_FRAMES[e.frameName], e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
  }

  function drawBullet(b) {
    const frame = BULLET_FRAMES[b.frame];
    const size = b.frame === "large" ? 20 : b.frame === "medium" ? 16 : 12;
    drawSprite(ctx, images.enemy, frame, b.x - size / 2, b.y - size / 2, size, size);
  }

  function drawItem(i) {
    ctx.save();
    ctx.translate(i.x, i.y);
    ctx.fillStyle = i.kind === "weapon" ? "#6ec6ff" : i.kind === "heal" ? "#ff8f8f" : "#7ff0b9";
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    if (i.kind === "shield") {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, -2);
      ctx.lineTo(5, 9);
      ctx.lineTo(0, 12);
      ctx.lineTo(-5, 9);
      ctx.lineTo(-8, -2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-2, -7, 4, 14);
      ctx.fillRect(-7, -2, 14, 4);
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
    drawBackground();

    ctx.fillStyle = "rgba(8,15,30,0.55)";
    ctx.fillRect(12, 12, 190, 44);
    ctx.fillStyle = "#dcecff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(currentStage().name, 22, 30);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#b8c6e8";
    ctx.fillText(currentStage().recommended, 22, 48);

    state.items.forEach(drawItem);
    state.bullets.forEach(drawBullet);
    state.enemies.forEach(drawEnemy);
    drawPlayer();
    state.floatingTexts.forEach(drawFloatingText);
  }

  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTime) state.lastTime = ts;
    const dt = Math.min(0.033, (ts - state.lastTime) / 1000);
    state.lastTime = ts;
    update(dt);
    render();
    if (state.running) requestAnimationFrame(loop);
  }

  startForm.addEventListener("submit", (e) => {
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

  window.addEventListener(
    "keydown",
    (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keys.left = true;
      if (k === "arrowright" || k === "d") keys.right = true;
      if (["arrowleft", "arrowright", "a", "d", " "].includes(k)) e.preventDefault();
    },
    { passive: false }
  );

  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a") keys.left = false;
    if (k === "arrowright" || k === "d") keys.right = false;
  });

  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (!state.running || state.paused) return;
      e.preventDefault();
      state.touchActive = true;
      state.touchX = getGameX(e.clientX);
    },
    { passive: false }
  );

  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (!state.touchActive || !state.running || state.paused) return;
      e.preventDefault();
      state.touchX = getGameX(e.clientX);
    },
    { passive: false }
  );

  window.addEventListener("pointerup", () => {
    state.touchActive = false;
  });

  canvas.addEventListener(
    "touchstart",
    (e) => {
      if (!state.running || state.paused) return;
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      state.touchActive = true;
      state.touchX = getGameX(t.clientX);
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (!state.touchActive || !state.running || state.paused) return;
      e.preventDefault();
      const t = e.touches[0];
      if (!t) return;
      state.touchX = getGameX(t.clientX);
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      if (state.running) e.preventDefault();
      state.touchActive = false;
    },
    { passive: false }
  );

  ["touchstart", "touchmove"].forEach((type) => {
    gameWrap.addEventListener(
      type,
      (e) => {
        if (state.running) e.preventDefault();
      },
      { passive: false }
    );
  });

  resetState();
  render();
  images.enemy.onload = () => drawStagePreview(0);
  images.bg.onload = () => render();
})();