const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let score = 0;
let hp = 3;
let selected = null;

const bg = new Image();
bg.src = "assets/bg.png";

const clean = new Image();
clean.src = "assets/clean.png";

const bubble = new Image();
bubble.src = "assets/bubble.png";

// 환자 이미지
const patients = [
  { img: "assets/patient1.png", answer: "gown" },   // 수두
  { img: "assets/patient2.png", answer: "gown" },   // 수족구
  { img: "assets/patient3.png", answer: "mask" },   // 인플루
  { img: "assets/patient4.png", answer: "gown" },   // 가려움
  { img: "assets/patient5.png", answer: "needle" }  // 복통
];

let current = null;
let patientImg = new Image();

let y = -100;

function spawn() {
  current = patients[Math.floor(Math.random() * patients.length)];
  patientImg.src = current.img;
  y = -100;
}

spawn();

function selectItem(item) {
  selected = item;
}

function update() {
  y += 2;

  if (y > 550) {
    if (selected === current.answer) {
      score += 10;
    } else {
      hp--;
    }

    document.getElementById("score").innerText = score;
    document.getElementById("hp").innerText = hp;

    if (hp <= 0) {
      alert("게임 종료");
      location.reload();
    }

    spawn();
  }
}

function draw() {
  ctx.clearRect(0,0,420,700);

  // 배경
  ctx.drawImage(bg, 0, 0, 420, 700);

  // 환자
  ctx.drawImage(patientImg, 150, y, 120, 120);

  // 클린이
  ctx.drawImage(clean, 140, 560, 120, 120);

  // 버블이 (항상 같이 표시)
  ctx.drawImage(bubble, 250, 580, 60, 60);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();