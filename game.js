// ─────────────────────────────────────
// 기본 설정
// ─────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hpText = document.getElementById("hpText");
const levelText = document.getElementById("levelText");
const atkText = document.getElementById("atkText");
const goldText = document.getElementById("goldText");
const defText = document.getElementById("defText");
const distanceText = document.getElementById("distanceText");
const messageText = document.getElementById("messageText");

const weaponNameText = document.getElementById("weaponName");
const armorNameText = document.getElementById("armorName");
const flossNameText = document.getElementById("flossName");

const btnWeaponUpgrade = document.getElementById("btnWeaponUpgrade");
const btnArmorUpgrade = document.getElementById("btnArmorUpgrade");
const btnFluorUpgrade = document.getElementById("btnFluorUpgrade");
const btnSkill = document.getElementById("btnSkill");
const btnPause = document.getElementById("btnPause");
const btnRestart = document.getElementById("btnRestart");

const shopWeaponNext = document.getElementById("shopWeaponNext");
const shopWeaponCost = document.getElementById("shopWeaponCost");
const shopArmorNext = document.getElementById("shopArmorNext");
const shopArmorCost = document.getElementById("shopArmorCost");
const shopFlossNext = document.getElementById("shopFlossNext");
const shopFlossCost = document.getElementById("shopFlossCost");

const bgm = document.getElementById("bgm");
const sfxHit = document.getElementById("sfxHit");
const sfxSkill = document.getElementById("sfxSkill");

let audioActivated = false;

// 저장 키 (버전 올려서 이전 세이브와 분리)
const SAVE_KEY = "toothWarriorSaveV3";

// ─────────────────────────────────────
// 장비 데이터
// ─────────────────────────────────────
const WEAPONS = [
  { name: "나무 칫솔", atk: 10, icon: "🪥" },
  { name: "플라스틱 칫솔", atk: 15, icon: "🪥" },
  { name: "고급 칫솔", atk: 22, icon: "🪥✨" },
  { name: "미세모 칫솔", atk: 30, icon: "🪥💫" },
  { name: "전동 칫솔", atk: 40, icon: "⚡🪥" },
  { name: "티타늄 칫솔", atk: 55, icon: "🪥🛡️" },
  { name: "황금 칫솔", atk: 75, icon: "🪥💛" },
  { name: "다이아 칫솔", atk: 100, icon: "💎🪥" }
];

const ARMORS = [
  { name: "일반 치약", def: 0, icon: "🧴" },
  { name: "시린이 치약", def: 1, icon: "🧴❄️" },
  { name: "저불소 치약", def: 2, icon: "🧴" },
  { name: "고불소 치약", def: 3, icon: "🧴✨" },
  { name: "잇몸 케어 치약", def: 4, icon: "🧴🌿" },
  { name: "프리미엄 치약", def: 5, icon: "🧴💎" },
  { name: "황금 치약", def: 7, icon: "🧴💛" },
  { name: "다이아 치약", def: 10, icon: "🧴💠" }
];

const FLOSS = [
  { name: "일반 치실", skillPower: 40, cooldown: 20, icon: "🧵" },
  { name: "왁스 치실", skillPower: 60, cooldown: 18, icon: "🧵✨" },
  { name: "스펀지 치실", skillPower: 90, cooldown: 16, icon: "🧵💫" },
  { name: "고급 치실", skillPower: 130, cooldown: 14, icon: "🧵💎" },
  { name: "프리미엄 치실", skillPower: 180, cooldown: 12, icon: "🧵🔥" },
  { name: "황금 치실", skillPower: 250, cooldown: 8, icon: "🧵💛" },
  { name: "다이아 치실", skillPower: 350, cooldown: 5, icon: "🧵💠" }
];

// ─────────────────────────────────────
// 게임 상태
// ─────────────────────────────────────
const STATE = {
  running: true,
  lastTime: 0,
  distance: 0,
  enemies: [],
  projectiles: [],
  spawnTimer: 0,
  spawnInterval: 1300,
  stage: 1,
  skillTimer: 0,
  bannerTimer: 0
};

const PLAYER = {
  x: 0,
  y: 0,
  radius: 20,
  maxHp: 100,
  hp: 100,
  level: 1,
  exp: 0,
  gold: 0,

  weaponLevel: 0, // index in WEAPONS
  armorLevel: 0, // index in ARMORS
  flossLevel: 0, // index in FLOSS

  get atk() {
    return WEAPONS[this.weaponLevel].atk;
  },
  get def() {
    return ARMORS[this.armorLevel].def;
  }
};

// ─────────────────────────────────────
// 캔버스 크기 세팅
// ─────────────────────────────────────
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  PLAYER.x = rect.width * 0.18;
  PLAYER.y = rect.height * 0.55;
}
window.addEventListener("resize", resizeCanvas);

// ─────────────────────────────────────
// 유틸
// ─────────────────────────────────────
function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function playOnce(audio) {
  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {}
}

function showMessage(text) {
  messageText.textContent = text;
}

function showBanner(text) {
  STATE.bannerTimer = 2; // 초 단위 (대략적인 느낌)
  showMessage(text);
}

// ─────────────────────────────────────
// 엔티티 생성
// ─────────────────────────────────────
function spawnEnemy() {
  const rect = canvas.getBoundingClientRect();
  const isBoss = Math.random() < 0.12;

  const baseHp = 40 + STATE.stage * 10;
  const hp = isBoss ? baseHp * 4 : baseHp;

  STATE.enemies.push({
    x: rect.width + 40,
    y: PLAYER.y,
    radius: isBoss ? 22 : 18,
    hp,
    maxHp: hp,
    speed: isBoss ? 40 : 65,
    isBoss
  });
}

function shootProjectile() {
  // 공격 속도는 고정, 데미지는 무기 기준
  STATE.projectiles.push({
    x: PLAYER.x + PLAYER.radius + 6,
    y: PLAYER.y - 3,
    speed: 260,
    power: PLAYER.atk
  });
}

// ─────────────────────────────────────
// 외형 관련
// ─────────────────────────────────────
function drawPlayer() {
  const rect = canvas.getBoundingClientRect();

  // 그림자
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(
    PLAYER.x,
    rect.height * 0.7,
    PLAYER.radius * 0.8,
    PLAYER.radius * 0.4,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // 캐릭터 (치아)
  ctx.font = `${PLAYER.radius * 1.8}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🦷", PLAYER.x, PLAYER.y);

  // 무기 / 갑옷 / 치실 아이콘 (장비 레벨 따라서 변화)
  ctx.font = "16px serif";
  const weaponIcon = WEAPONS[PLAYER.weaponLevel].icon;
  const armorIcon = ARMORS[PLAYER.armorLevel].icon;
  const flossIcon = FLOSS[PLAYER.flossLevel].icon;

  ctx.fillText(weaponIcon, PLAYER.x - 28, PLAYER.y - 26);
  ctx.fillText(armorIcon, PLAYER.x + 28, PLAYER.y - 26);
  ctx.fillText(flossIcon, PLAYER.x, PLAYER.y + 30);
}

function getProjectileStyle() {
  const lv = PLAYER.weaponLevel;
  if (lv <= 1) return { color: "#ffcc00", size: 4, char: "•" };
  if (lv <= 3) return { color: "#ffa726", size: 5, char: "✦" };
  if (lv <= 5) return { color: "#ff4081", size: 6, char: "✶" };
  if (lv <= 7) return { color: "#b388ff", size: 7, char: "✺" };
  return { color: "#ffffff", size: 8, char: "✵" };
}

// ─────────────────────────────────────
// 그리기
// ─────────────────────────────────────
function drawBackground() {
  const rect = canvas.getBoundingClientRect();

  // 하늘
  const skyHeight = rect.height * 0.55;
  const groundHeight = rect.height - skyHeight;

  const grad = ctx.createLinearGradient(0, 0, 0, skyHeight);
  grad.addColorStop(0, "#c2f1ff");
  grad.addColorStop(1, "#e3fbff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, rect.width, skyHeight);

  // 땅 (대각선 스트라이프)
  const groundTop = skyHeight;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, groundTop, rect.width, groundHeight);
  ctx.clip();

  const stripeHeight = 60;
  for (let i = -2; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#1b9c8d" : "#1aa394";
    ctx.beginPath();
    ctx.moveTo(-rect.width, groundTop + i * stripeHeight);
    ctx.lineTo(rect.width * 2, groundTop + (i - 1) * stripeHeight);
    ctx.lineTo(rect.width * 2, groundTop + i * stripeHeight);
    ctx.lineTo(-rect.width, groundTop + (i + 1) * stripeHeight);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemies() {
  const rect = canvas.getBoundingClientRect();

  for (const e of STATE.enemies) {
    // 적 본체
    ctx.font = `${e.radius * 1.4}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🦠", e.x, e.y);

    // HP바
    const barWidth = 40;
    const barHeight = 5;
    const hpRatio = Math.max(e.hp / e.maxHp, 0);
    const barX = e.x - barWidth / 2;
    const barY = rect.height * 0.72;

    ctx.fillStyle = "#ffcccc";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = "#4caf50";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}

function drawProjectiles() {
  const style = getProjectileStyle();
  ctx.font = `${style.size * 3}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = style.color;

  for (const p of STATE.projectiles) {
    ctx.fillText(style.char, p.x, p.y);
  }
}

// ─────────────────────────────────────
// 업데이트
// ─────────────────────────────────────
function update(delta) {
  if (!STATE.running) return;

  const rect = canvas.getBoundingClientRect();
  const dt = delta / 1000;

  // 거리 증가
  STATE.distance += 60 * dt;
  distanceText.textContent = `${Math.floor(STATE.distance)} m`;

  // 스테이지 조정 (거리 기준)
  const newStage = 1 + Math.floor(STATE.distance / 600);
  if (newStage !== STATE.stage) {
    STATE.stage = newStage;
    showBanner(`✨ 스테이지 ${STATE.stage} 시작!`);
  }

  // 몬스터 스폰
  STATE.spawnTimer += delta;
  const interval = Math.max(600, STATE.spawnInterval - STATE.stage * 40);
  if (STATE.spawnTimer >= interval) {
    STATE.spawnTimer = 0;
    spawnEnemy();
  }

  // 플레이어 자동 공격 (간단하게 거리 기준으로)
  if (STATE.enemies.length > 0) {
    const nearest = STATE.enemies[0];
    if (nearest.x - PLAYER.x < 260) {
      // 일정 거리 안에 적이 있으면 발사
      if (Math.random() < dt * 3) {
        shootProjectile();
      }
    } else {
      if (Math.random() < dt * 1.5) {
        shootProjectile();
      }
    }
  } else if (Math.random() < dt) {
    shootProjectile();
  }

  // 투사체 이동
  for (const p of STATE.projectiles) {
    p.x += p.speed * dt;
  }

  // 적 이동
  for (const e of STATE.enemies) {
    e.x -= e.speed * dt;
  }

  // 충돌 판정 (단순 거리)
  for (const p of STATE.projectiles) {
    for (const e of STATE.enemies) {
      if (Math.abs(p.x - e.x) < 20 && Math.abs(p.y - e.y) < 20) {
        e.hp -= p.power;
        p.hit = true;
        playOnce(sfxHit);

        if (e.hp <= 0 && !e.dead) {
          e.dead = true;
          const gain = e.isBoss ? 60 : 20;
          PLAYER.gold += gain;
          goldText.textContent = `${PLAYER.gold} Gold`;
          showMessage(`충치균 처치! +${gain}G`);
        }
        break;
      }
    }
  }

  // 죽은 적 제거
  STATE.enemies = STATE.enemies.filter((e) => e.x + e.radius > 0 && !e.dead);
  // 화면 밖 투사체 제거
  STATE.projectiles = STATE.projectiles.filter(
    (p) => p.x - 10 < rect.width && !p.hit
  );

  // 적이 플레이어에 닿았는지 체크
  for (const e of STATE.enemies) {
    if (e.x - e.radius < PLAYER.x + PLAYER.radius * 0.5) {
      const damage = Math.max(
        (e.isBoss ? 18 : 8) - PLAYER.def * 1.5,
        2
      );
      PLAYER.hp -= damage * dt;
      if (PLAYER.hp <= 0) {
        PLAYER.hp = 0;
        gameOver();
        return;
      }
    }
  }

  // 스킬 쿨타임
  STATE.skillTimer += dt;

  // 배너 타이머
  if (STATE.bannerTimer > 0) {
    STATE.bannerTimer -= dt;
    if (STATE.bannerTimer <= 0) {
      showMessage("");
    }
  }

  updateUI();
}

// ─────────────────────────────────────
// 스킬 (불소 폭발)
// ─────────────────────────────────────
function useSkill() {
  const floss = FLOSS[PLAYER.flossLevel];
  if (STATE.skillTimer < floss.cooldown) return;
  STATE.skillTimer = 0;

  if (STATE.enemies.length === 0) {
    showMessage("공격할 몬스터가 없습니다.");
    return;
  }

  playOnce(sfxSkill);

  const dmg = floss.skillPower;
  for (const e of STATE.enemies) {
    e.hp -= dmg;
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      const gain = e.isBoss ? 60 : 20;
      PLAYER.gold += gain;
    }
  }
  showBanner(`💥 불소 폭발! 모든 충치균에게 ${dmg} 대미지!`);
  STATE.enemies = STATE.enemies.filter((e) => e.x + e.radius > 0 && !e.dead);
  updateUI();
}

// ─────────────────────────────────────
// UI / 상점
// ─────────────────────────────────────
function updateGearTexts() {
  const w = WEAPONS[PLAYER.weaponLevel];
  const a = ARMORS[PLAYER.armorLevel];
  const f = FLOSS[PLAYER.flossLevel];

  weaponNameText.textContent = `${w.name} (Lv.${PLAYER.weaponLevel + 1})`;
  armorNameText.textContent = `${a.name} (Lv.${
    PLAYER.armorLevel + 1
  })`;
  flossNameText.textContent = `${f.name} (Lv.${PLAYER.flossLevel + 1})`;
}

function updateShopTexts() {
  // 무기
  if (PLAYER.weaponLevel + 1 < WEAPONS.length) {
    const next = WEAPONS[PLAYER.weaponLevel + 1];
    const cost = 80 + PLAYER.weaponLevel * 80;
    shopWeaponNext.textContent = `다음: ${next.name}`;
    shopWeaponCost.textContent = `필요 골드: ${cost}G`;
  } else {
    shopWeaponNext.textContent = "최고 무기입니다.";
    shopWeaponCost.textContent = "-";
  }

  // 갑옷
  if (PLAYER.armorLevel + 1 < ARMORS.length) {
    const next = ARMORS[PLAYER.armorLevel + 1];
    const cost = 80 + PLAYER.armorLevel * 80;
    shopArmorNext.textContent = `다음: ${next.name}`;
    shopArmorCost.textContent = `필요 골드: ${cost}G`;
  } else {
    shopArmorNext.textContent = "최고 갑옷입니다.";
    shopArmorCost.textContent = "-";
  }

  // 치실
  if (PLAYER.flossLevel + 1 < FLOSS.length) {
    const next = FLOSS[PLAYER.flossLevel + 1];
    const cost = 120 + PLAYER.flossLevel * 120;
    shopFlossNext.textContent = `다음: ${next.name}`;
    shopFlossCost.textContent = `필요 골드: ${cost}G`;
  } else {
    shopFlossNext.textContent = "최고 치실입니다.";
    shopFlossCost.textContent = "-";
  }
}

function upgradeWeapon() {
  if (PLAYER.weaponLevel + 1 >= WEAPONS.length) {
    showMessage("이미 최고 무기입니다.");
    return;
  }
  const cost = 80 + PLAYER.weaponLevel * 80;
  if (PLAYER.gold < cost) {
    showMessage(`골드가 부족합니다. (필요: ${cost}G)`);
    return;
  }
  PLAYER.gold -= cost;
  PLAYER.weaponLevel++;
  showBanner(`🪥 ${WEAPONS[PLAYER.weaponLevel].name} 장착!`);
  updateUI();
}

function upgradeArmor() {
  if (PLAYER.armorLevel + 1 >= ARMORS.length) {
    showMessage("이미 최고 갑옷입니다.");
    return;
  }
  const cost = 80 + PLAYER.armorLevel * 80;
  if (PLAYER.gold < cost) {
    showMessage(`골드가 부족합니다. (필요: ${cost}G)`);
    return;
  }
  PLAYER.gold -= cost;
  PLAYER.armorLevel++;
  showBanner(`🧴 ${ARMORS[PLAYER.armorLevel].name} 장착!`);
  updateUI();
}

function upgradeFluor() {
  if (PLAYER.flossLevel + 1 >= FLOSS.length) {
    showMessage("이미 최고 치실입니다.");
    return;
  }
  const cost = 120 + PLAYER.flossLevel * 120;
  if (PLAYER.gold < cost) {
    showMessage(`골드가 부족합니다. (필요: ${cost}G)`);
    return;
  }
  PLAYER.gold -= cost;
  PLAYER.flossLevel++;
  showBanner(`🧵 ${FLOSS[PLAYER.flossLevel].name} 장착!`);
  updateUI();
}

function updateUI() {
  hpText.textContent = `${Math.round(PLAYER.hp)} / ${PLAYER.maxHp}`;
  levelText.textContent = `Lv.${PLAYER.level}`;
  atkText.textContent = `${PLAYER.atk} (무기 Lv.${PLAYER.weaponLevel + 1})`;
  goldText.textContent = `${PLAYER.gold} Gold`;
  defText.textContent = `Lv.${PLAYER.armorLevel + 1} / 불소 Lv.${
    PLAYER.flossLevel + 1
  }`;

  // 스킬 버튼 문구
  const floss = FLOSS[PLAYER.flossLevel];
  const remain = Math.max(0, floss.cooldown - STATE.skillTimer);
  if (remain <= 0) {
    btnSkill.textContent = "💥 불소 폭발 (준비완료)";
    btnSkill.classList.remove("disabled");
  } else {
    btnSkill.textContent = `💥 불소 폭발 (${remain.toFixed(1)}s)`;
    btnSkill.classList.add("disabled");
  }

  updateGearTexts();
  updateShopTexts();
  saveGame();
}

// ─────────────────────────────────────
// 세이브 / 로드
// ─────────────────────────────────────
function saveGame() {
  const data = {
    hp: PLAYER.hp,
    maxHp: PLAYER.maxHp,
    level: PLAYER.level,
    gold: PLAYER.gold,
    weaponLevel: PLAYER.weaponLevel,
    armorLevel: PLAYER.armorLevel,
    flossLevel: PLAYER.flossLevel,
    distance: STATE.distance,
    stage: STATE.stage
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    const data = JSON.parse(raw);
    PLAYER.hp = data.hp ?? PLAYER.hp;
    PLAYER.maxHp = data.maxHp ?? PLAYER.maxHp;
    PLAYER.level = data.level ?? PLAYER.level;
    PLAYER.gold = data.gold ?? PLAYER.gold;
    PLAYER.weaponLevel = data.weaponLevel ?? PLAYER.weaponLevel;
    PLAYER.armorLevel = data.armorLevel ?? PLAYER.armorLevel;
    PLAYER.flossLevel = data.flossLevel ?? PLAYER.flossLevel;
    STATE.distance = data.distance ?? STATE.distance;
    STATE.stage = data.stage ?? STATE.stage;
  } catch (e) {}
}

// ─────────────────────────────────────
// 게임 흐름 (초기화 / 재시작 / 게임오버)
// ─────────────────────────────────────
function clearAllEntities() {
  STATE.enemies.length = 0;
  STATE.projectiles.length = 0;
  // 잔상 제거용 캔버스 전체 클리어
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
}

function resetGame(fullReset = false) {
  STATE.running = true;
  STATE.lastTime = 0;
  STATE.spawnTimer = 0;
  STATE.skillTimer = 999;
  STATE.bannerTimer = 0;

  if (fullReset) {
    PLAYER.maxHp = 100;
    PLAYER.hp = 100;
    PLAYER.level = 1;
    PLAYER.gold = 0;
    PLAYER.weaponLevel = 0;
    PLAYER.armorLevel = 0;
    PLAYER.flossLevel = 0;
    STATE.distance = 0;
    STATE.stage = 1;
  }

  clearAllEntities();
  spawnEnemy();
  updateUI();
  showMessage("새로운 자동 사냥 시작!");
}

function gameOver() {
  STATE.running = false;
  showBanner("☠️ 게임 오버! '새로 시작'을 눌러 다시 도전하세요.");
}

// ─────────────────────────────────────
// 메인 루프
// ─────────────────────────────────────
function loop(timestamp) {
  if (!STATE.lastTime) STATE.lastTime = timestamp;
  const delta = timestamp - STATE.lastTime;
  STATE.lastTime = timestamp;

  // 매 프레임 캔버스 전체 지우기 → 잔상 방지
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  drawBackground();
  drawPlayer();
  drawEnemies();
  drawProjectiles();
  update(delta);

  requestAnimationFrame(loop);
}

// ─────────────────────────────────────
// 이벤트 연결
// ─────────────────────────────────────
btnWeaponUpgrade.addEventListener("click", upgradeWeapon);
btnArmorUpgrade.addEventListener("click", upgradeArmor);
btnFluorUpgrade.addEventListener("click", upgradeFluor);
btnSkill.addEventListener("click", () => useSkill());

btnPause.addEventListener("click", () => {
  STATE.running = !STATE.running;
  btnPause.textContent = STATE.running ? "⏸ 일시정지" : "▶ 다시 시작";
  if (STATE.running) showMessage("자동 사냥 재개!");
  else showMessage("일시정지 중…");
});

btnRestart.addEventListener("click", () => {
  resetGame(true);
});

// 화면 아무 곳이나 첫 탭 → BGM 시작
document.body.addEventListener(
  "touchstart",
  () => {
    if (!audioActivated) {
      audioActivated = true;
      try {
        bgm.volume = 0.5;
        bgm.play();
        showMessage("배경음악 ON 🎵");
      } catch (e) {}
    }
  },
  { once: true }
);
document.body.addEventListener(
  "mousedown",
  () => {
    if (!audioActivated) {
      audioActivated = true;
      try {
        bgm.volume = 0.5;
        bgm.play();
        showMessage("배경음악 ON 🎵");
      } catch (e) {}
    }
  },
  { once: true }
);

// ─────────────────────────────────────
// 시작
// ─────────────────────────────────────
function init() {
  resizeCanvas();
  loadGame();
  resetGame(false);
  requestAnimationFrame(loop);
}

window.addEventListener("load", init);
