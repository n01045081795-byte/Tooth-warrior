// ===============================
// 치아 용사 RPG - 게임 로직
// ===============================

const SAVE_KEY = "toothWarriorSaveV1";

// DOM 참조
const gameArea = document.getElementById("game-area");
const playerEl = document.getElementById("player");
const groundEl = document.getElementById("ground");
const flashEl = document.getElementById("screen-flash");

// 스탯 표시
const hpEl = document.getElementById("stat-hp");
const atkEl = document.getElementById("stat-atk");
const defEl = document.getElementById("stat-def");
const levelEl = document.getElementById("stat-level");
const goldEl = document.getElementById("stat-gold");
const distEl = document.getElementById("stat-distance");
const stageEl = document.getElementById("stat-stage");
const msgEl = document.getElementById("stat-message");

// 버튼
const btnShopWeapon = document.getElementById("btn-shop-weapon");
const btnShopArmor = document.getElementById("btn-shop-armor");
const btnShopFluoride = document.getElementById("btn-shop-fluoride");
const btnSkill = document.getElementById("btn-skill");
const btnPause = document.getElementById("btn-pause");

const overlay = document.getElementById("overlay-gameover");
const gameoverSummary = document.getElementById("gameover-summary");
const btnRestart = document.getElementById("btn-restart");

// ------------ 게임 상태 ------------
const state = {
  hp: 100,
  maxHp: 100,
  atk: 10,
  weaponLevel: 1,
  armorLevel: 1,
  fluLevel: 1,
  level: 1,
  exp: 0,
  expToNext: 40,
  gold: 0,
  distance: 0,
  stage: 1,
  alive: true,
  paused: false,
  skillCooldown: 0,
  saveTimer: 0
};

const RUN_SPEED = 40; // 거리 증가 속도
let spawnTimer = 0;
let fireTimer = 0;

let enemies = [];
let projectiles = [];

// ------------ 사운드(Web Audio) ------------
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
}

function playTone(freq, duration, type = "sine") {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration
  );
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxHit() {
  playTone(620, 0.05, "square");
}

function sfxLevelUp() {
  playTone(880, 0.1, "sine");
  setTimeout(() => playTone(1200, 0.1, "sine"), 90);
}

function sfxSkill() {
  playTone(220, 0.15, "sawtooth");
  setTimeout(() => playTone(440, 0.15, "sawtooth"), 120);
}

// 첫 터치에서 오디오 허용
document.body.addEventListener(
  "pointerdown",
  () => {
    ensureAudio();
  },
  { once: true }
);

// ------------ 저장/불러오기 ------------
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.assign(state, {
      hp: data.hp ?? state.hp,
      maxHp: data.maxHp ?? state.maxHp,
      atk: data.atk ?? state.atk,
      weaponLevel: data.weaponLevel ?? state.weaponLevel,
      armorLevel: data.armorLevel ?? state.armorLevel,
      fluLevel: data.fluLevel ?? state.fluLevel,
      level: data.level ?? state.level,
      exp: data.exp ?? state.exp,
      expToNext: data.expToNext ?? state.expToNext,
      gold: data.gold ?? state.gold,
      distance: data.distance ?? 0,
      stage: data.stage ?? state.stage
    });
  } catch (e) {
    console.warn("save load fail", e);
  }
}

function saveGame() {
  try {
    const data = {
      hp: state.maxHp, // 저장 시 풀피로 저장
      maxHp: state.maxHp,
      atk: state.atk,
      weaponLevel: state.weaponLevel,
      armorLevel: state.armorLevel,
      fluLevel: state.fluLevel,
      level: state.level,
      exp: state.exp,
      expToNext: state.expToNext,
      gold: state.gold,
      distance: state.distance,
      stage: state.stage
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("save error", e);
  }
}

loadSave();

// ------------ 유틸 ------------
function formatNumber(n) {
  return n.toLocaleString("ko-KR");
}

function getProjectileIcon() {
  const idx = Math.floor((state.weaponLevel - 1) / 10);
  const table = ["·", "•", "✦", "✸", "✨", "🌟", "💫", "🔥", "⚡", "🌈"];
  return table[Math.min(idx, table.length - 1)];
}

function getProjectileClass() {
  const step = Math.floor((state.weaponLevel - 1) / 10);
  return ["", "p1", "p2", "p3", "p4"][Math.min(step, 4)];
}

function getFireInterval() {
  // 무기 레벨에 따라 공격 속도 소폭 증가
  return Math.max(0.18, 0.6 - (state.weaponLevel - 1) * 0.02);
}

function getSkillCooldown() {
  // 불소 레벨이 올라갈수록 쿨타임 감소 (최소 2초)
  return Math.max(2, 20 - (state.fluLevel - 1) * 1.5);
}

function updateUI() {
  hpEl.textContent = `HP: ${Math.round(state.hp)} / ${state.maxHp}`;
  atkEl.textContent = `ATK: ${state.atk} (Lv.${state.weaponLevel})`;
  defEl.textContent = `DEF Lv.${state.armorLevel}`;
  levelEl.textContent = `Lv.${state.level}`;
  goldEl.textContent = `${formatNumber(state.gold)} Gold`;
  distEl.textContent = `${Math.round(state.distance)} m`;
  stageEl.textContent = `스테이지: ${state.stage}`;
  if (state.skillCooldown > 0) {
    btnSkill.textContent = `💥 불소 폭발 (${state.skillCooldown.toFixed(1)}s)`;
    btnSkill.classList.add("cooldown");
  } else {
    btnSkill.textContent = "💥 불소 폭발 (준비완료)";
    btnSkill.classList.remove("cooldown");
  }
}

// ------------ 적 & 투사체 ------------
function spawnEnemy(isBoss = false) {
  const el = document.createElement("div");
  el.className = "entity enemy" + (isBoss ? " boss" : "");
  el.textContent = isBoss ? "🦠" : "🦠";
  el.style.left = gameArea.clientWidth + 40 + "px";
  gameArea.appendChild(el);

  const hpBase = isBoss ? 180 : 40;
  const hpScale = isBoss ? state.stage * 40 : state.stage * 10;
  const hp = hpBase + hpScale;

  const speed = isBoss ? 40 + state.stage * 4 : 60 + state.stage * 3;

  // HP 바
  const bar = document.createElement("div");
  bar.className = "hp-bar";
  const fill = document.createElement("div");
  fill.className = "hp-fill";
  bar.appendChild(fill);
  gameArea.appendChild(bar);

  enemies.push({
    el,
    bar,
    fill,
    x: gameArea.clientWidth + 40,
    hp,
    maxHp: hp,
    speed,
    isBoss
  });
}

function spawnProjectile() {
  const el = document.createElement("div");
  el.className = "entity projectile";
  const cls = getProjectileClass();
  if (cls) el.classList.add(cls);
  el.textContent = getProjectileIcon();
  const bottom = 30;
  el.style.bottom = bottom + "%";
  el.style.left = playerEl.offsetLeft + 40 + "px";
  gameArea.appendChild(el);

  projectiles.push({
    el,
    x: playerEl.offsetLeft + 40,
    speed: 230 + state.weaponLevel * 8,
    damage: state.atk
  });
}

// ------------ 전투 ------------
function damageEnemy(e, dmg) {
  e.hp -= dmg;
  const ratio = Math.max(0, e.hp / e.maxHp);
  e.fill.style.width = ratio * 100 + "%";
  sfxHit();

  if (e.hp <= 0) {
    // 골드, 경험치
    const g = e.isBoss ? 80 + state.stage * 20 : 15 + state.stage * 4;
    state.gold += g;
    const expGain = e.isBoss ? 40 : 10;
    state.exp += expGain;

    // 보스 처치 플래시
    if (e.isBoss) {
      flashEl.classList.add("flash");
      setTimeout(() => flashEl.classList.remove("flash"), 1000);
    }

    // 레벨업 체크
    while (state.exp >= state.expToNext) {
      state.exp -= state.expToNext;
      state.level += 1;
      state.maxHp += 18;
      state.atk += 3;
      state.hp = state.maxHp;
      state.expToNext = Math.round(state.expToNext * 1.25);
      sfxLevelUp();
      msgEl.textContent = `🎉 레벨 ${state.level} 달성! HP+18 ATK+3`;
    }

    removeEnemy(e);
  }
}

function removeEnemy(e) {
  if (e.el.parentNode) e.el.parentNode.removeChild(e.el);
  if (e.bar.parentNode) e.bar.parentNode.removeChild(e.bar);
  const idx = enemies.indexOf(e);
  if (idx >= 0) enemies.splice(idx, 1);
}

function takeDamage(dps, dt) {
  const reduced = dps * dt * (1 - state.armorLevel * 0.02);
  state.hp -= reduced;
  if (state.hp <= 0) {
    state.hp = 0;
    gameOver();
  }
}

// ------------ 게임 루프 ------------
let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (!state.paused && state.alive) {
    stepGame(dt);
  }

  updateUI();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

function stepGame(dt) {
  const width = gameArea.clientWidth || window.innerWidth;

  // 이동 거리
  state.distance += RUN_SPEED * dt;

  // 스폰 타이머
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const boss = state.distance > 0 && Math.round(state.distance) % 400 === 0;
    spawnEnemy(boss);
    const baseInterval = boss ? 4 : 1.4;
    spawnTimer = baseInterval - Math.min(0.6, (state.stage - 1) * 0.08);
  }

  // 자동 공격
  fireTimer -= dt;
  if (fireTimer <= 0) {
    spawnProjectile();
    fireTimer = getFireInterval();
  }

  // 스킬 쿨타임
  if (state.skillCooldown > 0) {
    state.skillCooldown = Math.max(0, state.skillCooldown - dt);
  }

  // 적 이동
  enemies.forEach(e => {
    e.x -= e.speed * dt;
    e.el.style.left = e.x + "px";

    const px = e.x + e.el.offsetWidth / 2;
    const py = gameArea.offsetTop + gameArea.clientHeight * 0.7;
    e.bar.style.left = px - 24 + "px";
    e.bar.style.top = gameArea.clientHeight * 0.55 + "px";

    // 플레이어에 닿았으면 지속 피해
    const playerX = playerEl.offsetLeft + playerEl.offsetWidth / 2;
    if (e.x < playerX + 10) {
      const dps = e.isBoss ? 35 : 15;
      takeDamage(dps, dt);
    }

    // 화면 밖으로 나가면 제거
    if (e.x < -80) {
      removeEnemy(e);
    }
  });

  // 투사체 이동 + 충돌
  projectiles.forEach((p, idx) => {
    p.x += p.speed * dt;
    p.el.style.left = p.x + "px";

    // 적과 충돌 체크(간단히 x좌표만)
    for (const e of enemies) {
      if (p.x > e.x - 20 && p.x < e.x + 30) {
        damageEnemy(e, p.damage);
        // 투사체 제거
        if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
        projectiles.splice(idx, 1);
        return;
      }
    }

    if (p.x > width + 60) {
      if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
      projectiles.splice(idx, 1);
    }
  });

  // 스테이지 상승
  const newStage = 1 + Math.floor(state.distance / 800);
  if (newStage !== state.stage) {
    state.stage = newStage;
    msgEl.textContent = `✨ 스테이지 ${state.stage} 시작!`;
  }

  // 자동 저장 (3초마다)
  state.saveTimer += dt;
  if (state.saveTimer >= 3) {
    state.saveTimer = 0;
    saveGame();
  }
}

// ------------ 스킬 사용 ------------
function useSkill() {
  if (!state.alive || state.paused) return;
  if (state.skillCooldown > 0) return;

  // 전체 적에게 큰 피해
  const base = state.atk * (1.4 + state.fluLevel * 0.5);
  enemies.slice().forEach(e => {
    damageEnemy(e, base);
  });

  state.skillCooldown = getSkillCooldown();
  msgEl.textContent = `💥 불소 폭발! (쿨타임 ${state.skillCooldown.toFixed(
    1
  )}초)`;
  sfxSkill();
}

// ------------ 일시정지 ------------
function togglePause() {
  state.paused = !state.paused;
  btnPause.textContent = state.paused ? "▶ 재시작" : "⏸ 일시정지";
  msgEl.textContent = state.paused
    ? "⏸ 일시정지 중"
    : "자동 사냥 재개!";
}

// ------------ 상점 ------------
function buyWeapon() {
  if (!state.alive) return;
  const cost = state.weaponLevel * 80;
  if (state.gold < cost) {
    msgEl.textContent = `골드가 부족합니다 (필요: ${cost}G)`;
    return;
  }
  state.gold -= cost;
  state.weaponLevel += 1;
  state.atk += 5;
  msgEl.textContent = `🪥 무기 강화! ATK +5 (Lv.${state.weaponLevel})`;
}

function buyArmor() {
  if (!state.alive) return;
  const cost = state.armorLevel * 80;
  if (state.gold < cost) {
    msgEl.textContent = `골드가 부족합니다 (필요: ${cost}G)`;
    return;
  }
  state.gold -= cost;
  state.armorLevel += 1;
  state.maxHp += 25;
  state.hp = state.maxHp;
  msgEl.textContent = `🧴 갑옷 강화! HP +25 (Lv.${state.armorLevel})`;
}

function buyFluoride() {
  if (!state.alive) return;
  const cost = state.fluLevel * 120;
  if (state.gold < cost) {
    msgEl.textContent = `골드가 부족합니다 (필요: ${cost}G)`;
    return;
  }
  state.gold -= cost;
  state.fluLevel += 1;
  msgEl.textContent = `🧵 불소 레벨 업! (Lv.${state.fluLevel})`;
}

// ------------ 게임 오버 ------------
function gameOver() {
  if (!state.alive) return;
  state.alive = false;
  overlay.classList.remove("hidden");
  const dist = Math.round(state.distance);
  gameoverSummary.textContent = `최종 거리 ${dist} m, 골드 ${formatNumber(
    state.gold
  )}G, 레벨 ${state.level}`;
  saveGame();
}

// ------------ 재시작 ------------
function restartGame() {
  overlay.classList.add("hidden");
  // 업그레이드는 유지, 진행만 리셋
  state.hp = state.maxHp;
  state.distance = 0;
  state.stage = 1;
  state.exp = 0;
  state.alive = true;
  state.paused = false;
  btnPause.textContent = "⏸ 일시정지";
  msgEl.textContent = "새로운 자동 사냥 시작!";
  enemies.forEach(removeEnemy);
  enemies = [];
  projectiles.forEach(p => {
    if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
  });
  projectiles = [];
}

// ------------ 이벤트 바인딩 ------------
btnShopWeapon.addEventListener("click", buyWeapon);
btnShopArmor.addEventListener("click", buyArmor);
btnShopFluoride.addEventListener("click", buyFluoride);
btnSkill.addEventListener("click", useSkill);
btnPause.addEventListener("click", togglePause);
btnRestart.addEventListener("click", restartGame);

// 첫 UI 갱신
updateUI();
msgEl.textContent = "자동 사냥 시작! 상점에서 칫솔/치약/치실을 강화해보세요 🪥";
