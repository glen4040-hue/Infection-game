(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const gameWrap = document.getElementById("gameWrap");

  const startScreen = document.getElementById("startScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const startForm = document.getElementById("startForm");
  const restartBtn = document.getElementById("restartBtn");
  const deptInput = document.getElementById("deptInput");
  const nameInput = document.getElementById("nameInput");

  const scoreText = document.getElementById("scoreText");
  const hpText = document.getElementById("hpText");
  const feedback = document.getElementById("feedback");
  const finalText = document.getElementById("finalText");
  const itemButtons = Array.from(document.querySelectorAll(".itemBtn"));

  const W = 420;
  const H = 620;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const imagePaths = {
    bg: "./assets/bg_ward.png",
    bg2: "./assets/bg_ward2.png",

    cleanDefault: "./assets/clean.png",
    cleanMask: "./assets/clean_mask.png",
    cleanN95: "./assets/clean_n95.png",
    cleanGown: "./assets/clean_gown.png",
    cleanSyringe: "./assets/clean_syringe.png",

    bubbleDefault: "./assets/bubble.png",
    bubbleMask: "./assets/bubble_mask.png",
    bubbleN95: "./assets/bubble_n95.png",
    bubbleGown: "./assets/bubble_gown.png",
    bubbleSyringe: "./assets/bubble_syringe.png",

    varicella: "./assets/patient_varicella.png",
    hfmd: "./assets/patient_hfmd.png",
    flu: "./assets/patient_flu.png",
    itch: "./assets/patient_itch.png",
    abdomen: "./assets/patient_abdomen.png",

    mask: "./assets/icon_mask.png",
    n95: "./assets/icon_n95.png",
    gown: "./assets/icon_gown.png",
    syringe: "./assets/icon_syringe.png"
  };

  const images = {};
  for (const [key, src] of Object.entries(imagePaths)) {
    images[key] = new Image();
    images[key].src = src;
  }

  const EQUIP_MAP = {
    mask: { clean: "cleanMask", bubble: "bubbleMask" },
    n95: { clean: "cleanN95", bubble: "bubbleN95" },
    gown: { clean: "cleanGown", bubble: "bubbleGown" },
    syringe: { clean: "cleanSyringe", bubble: "bubbleSyringe" }
  };

  const PATIENTS = [
    {
      key: "flu",
      label: "인플루엔자",
      answer: "mask",
      explain: "인플루엔자는 비말주의가 핵심이므로 마스크를 선택합니다."
    },
    {
      key: "hfmd",
      label: "수족구",
      answer: "gown",
      explain: "수족구는 접촉 전파 예방을 위해 가운&장갑을 선택합니다."
    },
    {
      key: "varicella",
      label: "수두",
      answer: "n95",
      explain: "수두는 공기주의가 필요하므로 N95 마스크가 핵심입니다."
    },
    {
      key: "itch",
      label: "옴 의심",
      answer: "gown",
      explain: "옴 등 접촉 전파 가능성이 있는 경우 가운&장갑을 선택합니다."
    },
    {
      key: "abdomen",
      label: "주사 처치",
      answer: "syringe",
      explain: "주사 처치에는 안전바늘 사용이 중요합니다."
    }
  ];

  const state = {
    running: false,
    paused: false,
    score: 0,
    hp: 1,
    combo: 0,
    selected: null,
    patient: null,
    patientY: -120,
    patientX: W / 2,
    patientSpeed: 150,
    lastTime: 0,
    feedbackTimer: 0,
    playerName: "",
    department: "",
    doorX: W / 2,
    doorY: 122
  };

  function safeText(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function setFeedback(text, type = "normal") {
    const lines = String(text).split("\n");
    feedback.innerHTML = lines
      .map((line, index) => `<div class="${index === 1 ? "comboLine" : ""}">${safeText(line)}</div>`)
      .join("");

    feedback.classList.remove("good", "bad", "combo");
    if (type === "good") feedback.classList.add("good");
    if (type === "bad") feedback.classList.add("bad");
    if (type === "combo") feedback.classList.add("combo");

    state.feedbackTimer = 1.5;
  }

  function clearFeedbackEffectIfExpired() {
    if (state.feedbackTimer <= 0) {
      feedback.classList.remove("good", "bad", "combo");
    }
  }

  function updateHud() {
    scoreText.textContent = String(state.score);
    hpText.textContent = String(state.hp);
  }

  function lockScroll(locked) {
    document.documentElement.style.overflow = locked ? "hidden" : "";
    document.body.style.overflow = locked ? "hidden" : "";
  }

  function choosePatient() {
    return PATIENTS[Math.floor(Math.random() * PATIENTS.length)];
  }

  function spawnPatient() {
    state.patient = choosePatient();
    state.patientX = state.doorX;
    state.patientY = state.doorY - 18;
  }

  function startGame() {
    state.running = true;
    state.paused = false;
    state.score = 0;
    state.hp = 1;
    state.combo = 0;
    state.selected = null;
    state.lastTime = 0;
    state.patientSpeed = 150;
    state.playerName = nameInput.value.trim();
    state.department = deptInput.value.trim();

    itemButtons.forEach((b) => b.classList.remove("selected"));
    function refreshCanvasScale() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  window.addEventListener("resize", refreshCanvasScale);
  updateHud();
    spawnPatient();

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    lockScroll(true);
    setFeedback("환자에게 맞는 장비를 선택하세요.");
    render();
  }

  function endGame() {
    state.running = false;
    state.paused = true;
    lockScroll(false);
    finalText.textContent = `${state.department || "부서 미입력"} ${state.playerName || "익명"}님의 최종 점수는 ${state.score}점입니다.`;
    gameOverScreen.classList.remove("hidden");
  }

  function selectItem(item) {
    state.selected = item;
    itemButtons.forEach((b) => b.classList.toggle("selected", b.dataset.item === item));
    const label = itemButtons.find((b) => b.dataset.item === item)?.querySelector("span")?.textContent || "";
    setFeedback(`${label} 선택됨`);
  }

  function judge() {
    if (!state.patient) return;

    if (state.selected === state.patient.answer) {
      state.combo += 1;
      const bonus = state.combo >= 3 ? 5 : 0;
      state.score += 10 + bonus;

      if (bonus) {
        setFeedback(`✅ 정답! ${state.patient.explain}\n✨ COMBO BONUS +5 ✨`, "combo");
      } else {
        setFeedback(`✅ 정답! ${state.patient.explain}`, "good");
      }

      updateHud();
      spawnPatient();
    } else {
      state.hp -= 1;
      state.combo = 0;
      updateHud();
      setFeedback(`❌ 오답! ${state.patient.explain}`, "bad");
      endGame();
    }
  }

  function update(dt) {
    if (!state.running || state.paused) return;

    state.patientY += state.patientSpeed * dt;
    state.feedbackTimer = Math.max(0, state.feedbackTimer - dt);
    clearFeedbackEffectIfExpired();

    if (state.patientY > H - 190) {
      judge();
    }
  }

  function drawImageContain(img, x, y, w, h) {
    if (!img.complete || !img.naturalWidth) return;
    const scale = Math.min(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawImageCover(img, x, y, w, h) {
    if (!img.complete || !img.naturalWidth) return false;
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  }

  function drawWardBackground() {
    // 모바일 전용 420x620 화면에 맞춰 배경을 비율 유지로 표시
    // 두 배경은 1초 간격으로 번갈아 표시
    const frameIndex = Math.floor(Date.now() / 1000) % 2;
    const img = frameIndex === 0 ? images.bg : images.bg2;

    const drawn = drawImageCover(img, 0, 0, W, H);
    if (!drawn) {
      ctx.fillStyle = "#87dbe8";
      ctx.fillRect(0, 0, W, H);
    }

    // 모바일 화면 기준 문 위치
    state.doorX = W / 2;
    state.doorY = 122;

    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0, 0, W, H);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPatient() {
    if (!state.patient) return;

    const shake = Math.sin(Date.now() / 80) * 4;
    const bob = Math.sin(Date.now() / 170) * 3;
    const img = images[state.patient.key];

    ctx.save();
    ctx.translate(state.patientX + shake, state.patientY + bob);

    const labelW = Math.max(88, state.patient.label.length * 17);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(9,31,58,0.85)";
    ctx.lineWidth = 3;
    roundRect(-labelW / 2, -47, labelW, 31, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0b2344";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.patient.label, 0, -25);

    drawImageContain(img, -48, -12, 96, 104);
    ctx.restore();
  }

  function drawCharacters() {
    const equip = state.selected ? EQUIP_MAP[state.selected] : null;
    const cleanImg = images[equip ? equip.clean : "cleanDefault"];
    const bubbleImg = images[equip ? equip.bubble : "bubbleDefault"];

    // 모바일 전용 비율: 하단 중앙에 compact하게 배치
    const baseY = H - 140;
    const float = Math.sin(Date.now() / 260) * 2.5;

    drawImageContain(cleanImg, W / 2 - 100, baseY + float, 92, 108);
    drawImageContain(bubbleImg, W / 2 + 0, baseY - 2 - float, 90, 108);

    if (state.selected) {
      const icon = images[state.selected];
      ctx.fillStyle = "rgba(255,227,110,.25)";
      ctx.beginPath();
      ctx.arc(W / 2, H - 152, 23, 0, Math.PI * 2);
      ctx.fill();
      drawImageContain(icon, W / 2 - 19, H - 172, 38, 38);
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawWardBackground();
    drawPatient();
    drawCharacters();

    ctx.fillStyle = "rgba(8,20,42,.70)";
    roundRect(12, 10, 205, 42, 10);
    ctx.fill();

    ctx.fillStyle = "#eff7ff";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("감염 예방 장비를 선택하세요", 22, 36);
  }

  function loop(ts) {
    if (!state.lastTime) state.lastTime = ts;
    const dt = Math.min(0.033, (ts - state.lastTime) / 1000);
    state.lastTime = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  startForm.addEventListener("submit", (e) => {
    e.preventDefault();
    startGame();
  });

  restartBtn.addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
  });

  itemButtons.forEach((btn) => {
    btn.addEventListener("click", () => selectItem(btn.dataset.item));
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      selectItem(btn.dataset.item);
    }, { passive: false });
  });

  ["touchstart", "touchmove"].forEach((type) => {
    gameWrap.addEventListener(type, (e) => {
      if (state.running) e.preventDefault();
    }, { passive: false });
  });

  // 배경 2장 로드 후 즉시 다시 그리기
  images.bg.onload = () => render();
  images.bg2.onload = () => render();

  updateHud();
  spawnPatient();
  requestAnimationFrame(loop);
})();
