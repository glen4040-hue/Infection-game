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
  const rankingList = document.getElementById("rankingList");
  const rankingStatus = document.getElementById("rankingStatus");
  const rankingRefreshBtn = document.getElementById("rankingRefreshBtn");
  const bgmCenter = document.getElementById("bgmCenter");
  const bgmBattle = document.getElementById("bgmBattle");
  const soundToggle = document.getElementById("soundToggle");
  const startCleanSpeech = document.getElementById("startCleanSpeech");
  const startBubbleSpeech = document.getElementById("startBubbleSpeech");

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
    syringe: "./assets/icon_syringe_glove.png"
  };

  const images = {};
  Object.entries(imagePaths).forEach(([key, src]) => {
    images[key] = new Image();
    images[key].src = src;
  });

  const EQUIP_MAP = {
    mask: { clean: "cleanMask", bubble: "bubbleMask" },
    n95: { clean: "cleanN95", bubble: "bubbleN95" },
    gown: { clean: "cleanGown", bubble: "bubbleGown" },
    syringe: { clean: "cleanSyringe", bubble: "bubbleSyringe" }
  };

  const PATIENTS = [
    { key: "itch", label: "CRE", answers: ["gown"], explain: "CRE는 접촉주의가 핵심이므로 가운&장갑을 선택합니다." },
    { key: "itch", label: "VRE", answers: ["gown"], explain: "VRE는 접촉주의가 핵심이므로 가운&장갑을 선택합니다." },
    { key: "itch", label: "MRSA", answers: ["gown"], explain: "MRSA는 접촉주의가 필요한 상황에서 가운&장갑을 선택합니다." },
    { key: "itch", label: "C.Difficile", answers: ["gown"], explain: "C.Difficile은 접촉주의가 핵심이므로 가운&장갑을 선택합니다." },
    { key: "itch", label: "옴", answers: ["gown"], explain: "옴은 접촉 전파 예방을 위해 가운&장갑을 선택합니다." },
    { key: "itch", label: "MRAB", answers: ["gown"], explain: "MRAB는 접촉주의가 핵심이므로 가운&장갑을 선택합니다." },
    { key: "itch", label: "MRPA", answers: ["gown"], explain: "MRPA는 접촉주의가 핵심이므로 가운&장갑을 선택합니다." },

    { key: "varicella", label: "결핵", answers: ["n95"], explain: "결핵은 공기주의가 핵심이므로 N95 마스크를 선택합니다." },
    { key: "varicella", label: "수두", answers: ["n95"], explain: "수두는 공기주의가 필요하므로 N95 마스크를 선택합니다." },
    { key: "varicella", label: "홍역", answers: ["n95"], explain: "홍역은 공기주의가 필요하므로 N95 마스크를 선택합니다." },

    { key: "flu", label: "백일해", answers: ["mask"], explain: "백일해는 비말주의가 핵심이므로 마스크를 선택합니다." },
    { key: "flu", label: "성홍열", answers: ["mask"], explain: "성홍열은 비말주의가 필요한 상황에서 마스크를 선택합니다." },
    { key: "flu", label: "코로나19", answers: ["mask"], explain: "코로나19는 호흡기 감염 예방을 위해 마스크를 선택합니다." },
    { key: "flu", label: "유행성 이하선염", answers: ["mask"], explain: "유행성 이하선염은 비말주의가 핵심이므로 마스크를 선택합니다." },
    { key: "flu", label: "인플루엔자", answers: ["mask"], explain: "인플루엔자는 비말주의가 핵심이므로 마스크를 선택합니다." },

    { key: "abdomen", label: "매독", answers: ["syringe"], explain: "매독은 혈액·체액 노출 예방을 위해 안전바늘&장갑 세트를 선택합니다." },
    { key: "abdomen", label: "HBV", answers: ["syringe"], explain: "HBV는 혈액매개감염 예방을 위해 안전바늘&장갑 세트를 선택합니다." },

    { key: "hfmd", label: "장티푸스", answers: ["gown"], explain: "장티푸스는 접촉 예방을 위해 가운&장갑을 선택합니다." },
    { key: "hfmd", label: "A형간염", answers: ["gown"], explain: "A형간염은 접촉 예방을 위해 가운&장갑을 선택합니다." },

    { key: "hfmd", label: "중증열성혈소판감소증", answers: ["gown", "mask"], explain: "중증열성혈소판감소증은 가운&장갑과 마스크를 함께 선택합니다." },
    { key: "hfmd", label: "수족구", answers: ["gown", "mask"], explain: "수족구는 접촉·비말 예방을 위해 가운&장갑과 마스크를 함께 선택합니다." }
  ];

  const BUBBLE_MESSAGES = [
    "보호구를 잘 착용하자!",
    "손소독은 필수~",
    "감염관리실 화이팅!",
    "마스크 착용 좋아요!",
    "가운&장갑도 잊지 말기!",
    "오늘도 안전하게!",
    "환자 안전 최고!",
    "사랑의 병원 화이팅!",
    "정확히 고르면 점수 UP!",
    "표준주의는 기본!",
    "클린이 힘내!",
    "사랑의 병원 화이팅!"
  ];


  const START_CLEAN_MESSAGES = [
    "난 클린이!",
    "같이 병원을 지키자!",
    "예방 도구를 골라줘!",
    "오늘도 안전하게!",
    "감염관리 시작!"
  ];

  const START_BUBBLE_MESSAGES = [
    "난 버블이!",
    "손소독 필수~",
    "보호구 착용 좋아!",
    "감염관리실 화이팅!",
    "환자 안전 최고!"
  ];

  const state = {
    running: false,
    paused: false,
    score: 0,
    hp: 3,
    combo: 0,
    selected: [],
    patient: null,
    patientY: -120,
    patientX: W / 2,
    patientSpeed: 70,
    lastTime: 0,
    feedbackTimer: 0,
    playerName: "",
    department: "",
    doorX: W / 2,
    doorY: 122,
    bubbleMessage: "감염관리실 화이팅!",
    bubbleMessageTimer: 0,
    damageFlash: 0,
    gameStartTime: 0,
    lastScoreId: null,
    scoreSaved: false,
    audioUnlocked: false,
    muted: false
  };


  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function updateStartSpeech() {
    if (startCleanSpeech) startCleanSpeech.textContent = pickRandom(START_CLEAN_MESSAGES);
    if (startBubbleSpeech) startBubbleSpeech.textContent = pickRandom(START_BUBBLE_MESSAGES);
  }



  function setupAudioVolume() {
    if (bgmCenter) bgmCenter.volume = 0.45;
    if (bgmBattle) bgmBattle.volume = 0.42;
  }

  async function safePlay(audio) {
    if (!audio || state.muted) return;
    try {
      await audio.play();
    } catch (e) {
      // 모바일/인앱 브라우저는 사용자 터치 전 자동재생이 막힐 수 있음
    }
  }

  function stopAudio(audio) {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function playCenterBgm() {
    if (state.muted) return;
    if (bgmBattle) bgmBattle.pause();
    safePlay(bgmCenter);
  }

  function playBattleBgm() {
    if (state.muted) return;
    if (bgmCenter) bgmCenter.pause();
    safePlay(bgmBattle);
  }

  function stopAllBgm() {
    if (bgmCenter) bgmCenter.pause();
    if (bgmBattle) bgmBattle.pause();
  }

  function unlockAudio() {
    if (state.audioUnlocked) return;
    state.audioUnlocked = true;
    setupAudioVolume();
    if (!state.running) playCenterBgm();
  }

  function toggleMute() {
    state.muted = !state.muted;
    if (soundToggle) {
      soundToggle.textContent = state.muted ? "🔇" : "🔊";
      soundToggle.classList.toggle("muted", state.muted);
    }

    if (state.muted) {
      stopAllBgm();
    } else {
      if (state.running) playBattleBgm();
      else playCenterBgm();
    }
  }


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

  function updateHud() {
    scoreText.textContent = String(state.score);
    hpText.textContent = "❤️".repeat(Math.max(0, state.hp));
    hpText.classList.add("heartHud");
    hpText.setAttribute("aria-label", `체력 ${state.hp}`);
  }

  function lockScroll(locked) {
    document.documentElement.style.overflow = locked ? "hidden" : "";
    document.body.style.overflow = locked ? "hidden" : "";
  }


  function itemLabel(item) {
    const map = {
      mask: "마스크",
      n95: "N95 마스크",
      gown: "가운&장갑",
      syringe: "안전바늘&장갑"
    };
    return map[item] || item;
  }

  function answerLabelText(patient = state.patient) {
    if (!patient || !Array.isArray(patient.answers)) return "";
    return patient.answers.map(itemLabel).join(" + ");
  }

  function triggerDamageEffect() {
    state.damageFlash = 0.55;
    hpText.classList.remove("heartDamage");
    // reflow로 애니메이션 재시작
    void hpText.offsetWidth;
    hpText.classList.add("heartDamage");
    window.setTimeout(() => hpText.classList.remove("heartDamage"), 650);
  }


  function randomBubbleMessage() {
    return BUBBLE_MESSAGES[Math.floor(Math.random() * BUBBLE_MESSAGES.length)];
  }

  function choosePatient() {
    return PATIENTS[Math.floor(Math.random() * PATIENTS.length)];
  }

  function requiredCount() {
    return state.patient?.answers?.length || 1;
  }

  function selectionGuideText() {
    return `${requiredCount()}개 골라줘!`;
  }

  function clearSelection() {
    state.selected = [];
    itemButtons.forEach((b) => b.classList.remove("selected"));
  }

  function sameSet(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    const aa = [...a].sort();
    const bb = [...b].sort();
    return aa.every((v, i) => v === bb[i]);
  }

  function selectedLabelText() {
    if (!state.selected.length) return "선택 없음";
    return state.selected
      .map((item) => itemButtons.find((b) => b.dataset.item === item)?.querySelector("span")?.textContent || item)
      .join(" + ");
  }

  function equipForCurrentSelection() {
    if (!state.selected.length) return null;
    if (state.selected.includes("syringe")) return "syringe";
    if (state.selected.includes("gown")) return "gown";
    if (state.selected.includes("n95")) return "n95";
    if (state.selected.includes("mask")) return "mask";
    return state.selected[0];
  }

  function spawnPatient() {
    state.patient = choosePatient();
    state.patientX = state.doorX;
    state.patientY = state.doorY - 18;
    clearSelection();
    setFeedback("환자에게 맞는 장비를 선택하세요.");
  }

  function startGame() {
    state.running = true;
    state.paused = false;
    state.score = 0;
    state.hp = 3;
    state.combo = 0;
    state.selected = [];
    state.lastTime = 0;
    state.patientSpeed = 70;
    state.gameStartTime = Date.now();
    state.lastScoreId = null;
    state.scoreSaved = false;
    state.department = deptInput.value.trim();
    state.playerName = nameInput.value.trim();
    state.bubbleMessage = randomBubbleMessage();
    state.bubbleMessageTimer = 1.2;

    itemButtons.forEach((b) => b.classList.remove("selected"));
    updateHud();
    spawnPatient();

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    lockScroll(true);
    playBattleBgm();
    render();
  }


  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setRankingStatus(text) {
    if (rankingStatus) rankingStatus.textContent = text;
  }

  function renderRanking(rows = [], myId = state.lastScoreId) {
    if (!rankingList) return;

    if (!rows.length) {
      rankingList.innerHTML = '<li class="rankingEmpty">아직 등록된 점수가 없습니다.</li>';
      return;
    }

    rankingList.innerHTML = rows.map((row, index) => {
      const rank = index + 1;
      const department = escapeHtml(row.department || "부서 미입력");
      const name = escapeHtml(row.name || "익명");
      const score = Number(row.score || 0);
      const isMe = myId && row.id === myId;

      return `
        <li class="rankingItem ${isMe ? "me" : ""}">
          <span class="rank">${rank}위</span>
          <span class="who">${department} / ${name}</span>
          <span class="score">${score}점</span>
        </li>
      `;
    }).join("");
  }

  async function refreshRanking() {
    if (!window.loadTopRanking) {
      setRankingStatus("랭킹 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      setRankingStatus("랭킹을 불러오는 중...");
      const rows = await window.loadTopRanking();
      renderRanking(rows);
      setRankingStatus(`TOP ${Math.min(100, rows.length)} 랭킹입니다. 100위 밖 점수도 서버에는 저장됩니다.`);
    } catch (error) {
      console.error(error);
      setRankingStatus("랭킹을 불러오지 못했습니다. 네트워크 또는 Firebase 규칙을 확인해주세요.");
    }
  }

  async function submitScoreAndRefreshRanking() {
    const playTime = state.gameStartTime ? Math.round((Date.now() - state.gameStartTime) / 1000) : 0;

    if (!window.saveGameScore) {
      setRankingStatus("Firebase 연결 준비 중입니다. 점수 저장에 실패하면 새로고침 후 다시 시도해주세요.");
      await refreshRanking();
      return;
    }

    if (state.scoreSaved) {
      await refreshRanking();
      return;
    }

    try {
      setRankingStatus("점수를 저장하는 중...");
      const ref = await window.saveGameScore({
        department: state.department || "부서 미입력",
        name: state.playerName || "익명",
        score: state.score,
        playTime
      });

      state.lastScoreId = ref.id;
      state.scoreSaved = true;

      setRankingStatus("점수 저장 완료! 랭킹을 불러오는 중...");
      const rows = await window.loadTopRanking();
      renderRanking(rows, state.lastScoreId);

      const inTop100 = rows.some((row) => row.id === state.lastScoreId);
      setRankingStatus(inTop100 ? "내 기록이 TOP 100에 표시되었습니다." : "점수는 저장되었습니다. 현재 기록은 TOP 100 밖입니다.");
    } catch (error) {
      console.error(error);
      setRankingStatus("점수 저장 또는 랭킹 불러오기에 실패했습니다. Firebase 설정을 확인해주세요.");
      await refreshRanking();
    }
  }


  function endGame() {
    state.running = false;
    state.paused = true;
    lockScroll(false);
    finalText.textContent = `${state.department || "부서 미입력"} ${state.playerName || "익명"}님의 최종 점수는 ${state.score}점입니다.`;
    gameOverScreen.classList.remove("hidden");
    playCenterBgm();
    submitScoreAndRefreshRanking();
  }

  function selectItem(item) {
    if (!state.patient) return;

    const max = requiredCount();
    const exists = state.selected.includes(item);

    if (max === 1) {
      state.selected = [item];
    } else if (exists) {
      state.selected = state.selected.filter((v) => v !== item);
    } else {
      if (state.selected.length >= max) {
        state.selected.shift();
      }
      state.selected.push(item);
    }

    itemButtons.forEach((b) => b.classList.toggle("selected", state.selected.includes(b.dataset.item)));

    const countText = `${state.selected.length}/${max}`;
    setFeedback(`현재 선택 ${countText} · ${selectedLabelText()}`);
  }

  function judge() {
    if (!state.patient) return;

    if (sameSet(state.selected, state.patient.answers)) {
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
      const missedPatient = state.patient;
      state.hp -= 1;
      state.combo = 0;
      updateHud();
      triggerDamageEffect();

      // 버블이가 정답을 말풍선으로 알려줌
      state.bubbleMessage = "앗 틀렸어!\\n정답: " + answerLabelText(missedPatient);
      state.bubbleMessageTimer = 3.8;

      setFeedback(`❌ 오답! ${missedPatient.explain}`, "bad");

      if (state.hp <= 0) {
        endGame();
      } else {
        spawnPatient();
        // spawnPatient에서 기본 문구로 바뀌지 않도록 다시 설정
        state.bubbleMessage = "앗 틀렸어!\\n정답: " + answerLabelText(missedPatient);
        state.bubbleMessageTimer = 3.8;
      }
    }
  }

  function update(dt) {
    if (!state.running || state.paused) return;

    state.patientY += state.patientSpeed * dt;
    state.feedbackTimer = Math.max(0, state.feedbackTimer - dt);
    state.bubbleMessageTimer -= dt;
    state.damageFlash = Math.max(0, state.damageFlash - dt);

    if (state.bubbleMessageTimer <= 0) {
      state.bubbleMessage = randomBubbleMessage();
      state.bubbleMessageTimer = 2.7 + Math.random() * 1.3;
    }

    if (state.feedbackTimer <= 0) {
      feedback.classList.remove("good", "bad", "combo");
    }

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
    const frameIndex = Math.floor(Date.now() / 1000) % 2;
    const img = frameIndex === 0 ? images.bg : images.bg2;

    const drawn = drawImageCover(img, 0, 0, W, H);
    if (!drawn) {
      ctx.fillStyle = "#87dbe8";
      ctx.fillRect(0, 0, W, H);
    }

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

  function wrapTextLines(text, maxChars = 10) {
    // 실제 줄바꿈과 문자 그대로 들어간 "\n"을 모두 줄바꿈으로 처리
    const raw = String(text).replace(/\\n/g, "\n");
    const sourceLines = raw.split("\n");
    const lines = [];

    for (const sourceLine of sourceLines) {
      if (sourceLine.length <= maxChars) {
        lines.push(sourceLine);
        continue;
      }

      let current = "";
      for (const ch of sourceLine) {
        if ((current + ch).length > maxChars) {
          lines.push(current);
          current = ch;
        } else {
          current += ch;
        }
      }
      if (current) lines.push(current);
    }

    return lines.slice(0, 4);
  }

  function drawSpeechBubble(x, y, text, options = {}) {
    const lines = wrapTextLines(text, options.maxChars || 10);
    ctx.save();

    const fontSize = options.fontSize || 17;
    ctx.font = `bold ${fontSize}px sans-serif`;

    const paddingX = 12;
    const paddingY = 9;
    const lineHeight = options.lineHeight || 20;
    const measuredWidth = Math.max(1, ...lines.map((line) => ctx.measureText(line).width));
    const width = Math.min(options.maxWidth || 170, Math.max(92, measuredWidth + paddingX * 2));
    const height = paddingY * 2 + lineHeight * lines.length;
    const r = 14;

    let bx = x - width / 2;
    let by = y - height;

    bx = Math.max(8, Math.min(W - width - 8, bx));
    by = Math.max(8, by);

    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = options.stroke || "rgba(9,31,58,0.92)";
    roundRect(bx - 3, by - 3, width + 6, height + 6, r + 3);
    ctx.fill();

    ctx.shadowColor = "transparent";
    const grad = ctx.createLinearGradient(0, by, 0, by + height);
    grad.addColorStop(0, options.fillTop || "#ffffff");
    grad.addColorStop(1, options.fillBottom || "#eaf8ff");

    ctx.fillStyle = grad;
    roundRect(bx, by, width, height, r);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    roundRect(bx + 3, by + 3, width - 6, height - 6, r - 2);
    ctx.stroke();

    // 말풍선 꼬리: 큰 삼각형 대신 작은 다이아몬드 노치로 처리
    if (options.showNotch !== false) {
      const notchX = Math.max(bx + 22, Math.min(bx + width - 22, options.tailX ?? x));
      const notchSize = 9;

      ctx.save();
      ctx.translate(notchX, by + height - 1);
      ctx.rotate(Math.PI / 4);

      ctx.fillStyle = options.stroke || "rgba(9,31,58,0.92)";
      roundRect(-notchSize / 2 - 2, -notchSize / 2 - 2, notchSize + 4, notchSize + 4, 2);
      ctx.fill();

      ctx.fillStyle = grad;
      roundRect(-notchSize / 2, -notchSize / 2, notchSize, notchSize, 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.fillStyle = options.color || "#0b2344";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((line, i) => {
      ctx.fillText(line, bx + width / 2, by + paddingY + lineHeight / 2 + i * lineHeight);
    });

    ctx.restore();
  }

  function drawPatient() {
    if (!state.patient) return;

    const shake = Math.sin(Date.now() / 80) * 4;
    const bob = Math.sin(Date.now() / 170) * 3;
    const img = images[state.patient.key];

    ctx.save();
    ctx.translate(state.patientX + shake, state.patientY + bob);

    const labelW = Math.min(300, Math.max(88, state.patient.label.length * 17));
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
    const selectedEquip = equipForCurrentSelection();
    const equip = selectedEquip ? EQUIP_MAP[selectedEquip] : null;
    const cleanImg = images[equip ? equip.clean : "cleanDefault"];
    const bubbleImg = images[equip ? equip.bubble : "bubbleDefault"];

    const baseY = H - 140;
    const float = Math.sin(Date.now() / 260) * 2.5;

    const cleanX = W / 2 - 100;
    const cleanY = baseY + float;
    const bubbleX = W / 2 + 0;
    const bubbleY = baseY - 2 - float;

    if (state.patient) {
      drawSpeechBubble(cleanX - 40, cleanY - 22, selectionGuideText(), {
        maxChars: 8,
        maxWidth: 118,
        fontSize: 17,
        fillTop: "#ffffff",
        fillBottom: "#f2fbff",
        stroke: "rgba(14,45,86,0.94)",
        color: "#0b2344"
      });
    }

    drawSpeechBubble(bubbleX + 130, bubbleY - 24, state.bubbleMessage || "손소독은 필수~", {
      maxChars: 8,
      maxWidth: 158,
      fontSize: 17,
      fillTop: "#ecfdff",
      fillBottom: "#c9f5ff",
      stroke: "rgba(0,112,165,0.94)",
      color: "#075878",
      lineHeight: 20
    });

    drawImageContain(cleanImg, cleanX, cleanY, 92, 108);
    drawImageContain(bubbleImg, bubbleX, bubbleY, 90, 108);

    if (state.selected.length) {
      const total = state.selected.length;
      state.selected.forEach((item, index) => {
        const icon = images[item];
        const offset = total === 1 ? 0 : (index === 0 ? -22 : 22);
        ctx.fillStyle = "rgba(255,227,110,.25)";
        ctx.beginPath();
        ctx.arc(W / 2 + offset, H - 152, 23, 0, Math.PI * 2);
        ctx.fill();
        drawImageContain(icon, W / 2 + offset - 19, H - 172, 38, 38);
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawWardBackground();
    drawPatient();
    drawCharacters();

    if (state.damageFlash > 0) {
      const alpha = Math.min(0.32, state.damageFlash * 0.65);
      ctx.save();
      ctx.fillStyle = `rgba(255, 40, 40, ${alpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

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

  function refreshCanvasScale() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  if (rankingRefreshBtn) {
    rankingRefreshBtn.addEventListener("click", refreshRanking);
  }

  startForm.addEventListener("submit", (e) => {
    e.preventDefault();
    startGame();
  });

  restartBtn.addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    playCenterBgm();
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

  window.addEventListener("resize", refreshCanvasScale);
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });

  if (soundToggle) {
    soundToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      unlockAudio();
      toggleMute();
    });
  }

  setupAudioVolume();

  images.bg.onload = () => render();
  images.bg2.onload = () => render();

  updateStartSpeech();
  window.setInterval(updateStartSpeech, 2400);

  updateHud();
  spawnPatient();
  requestAnimationFrame(loop);
})();
