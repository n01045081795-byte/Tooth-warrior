// ─────────────────────────────────────
// 기본 설정 및 DOM 요소
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

// 강화 버튼 DOM
const btnWeaponUpgrade = document.getElementById("btnWeaponUpgrade"); // 무기 강화 (ATK)
const btnArmorUpgrade = document.getElementById("btnArmorUpgrade"); // 갑옷 강화 (DEF)
const btnFluorUpgrade = document.getElementById("btnFluorUpgrade"); // 치실 강화 (스킬)
const btnHpUpgrade = document.getElementById("btnHpUpgrade"); // NEW! HP 강화

// 유틸리티 버튼
const btnSkill = document.getElementById("btnSkill");
const btnPause = document.getElementById("btnPause");
const btnRestart = document.getElementById("btnRestart");

// 상점 카드 DOM (구매 버튼으로 사용)
const shopWeaponCard = document.querySelector(".shop-grid .shop-card:nth-child(1)");
const shopArmorCard = document.querySelector(".shop-grid .shop-card:nth-child(2)");
const shopFlossCard = document.querySelector(".shop-grid .shop-card:nth-child(3)");

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
const SAVE_KEY = "toothWarriorSaveV4"; 

// ─────────────────────────────────────
// 장비 데이터 (구매 가능 아이템)
// ─────────────────────────────────────
const WEAPON_TIERS = [
    { name: "나무 칫솔", baseAtk: 10, icon: "🪥" },
    { name: "플라스틱 칫솔", baseAtk: 18, icon: "🪥" },
    { name: "고급 칫솔", baseAtk: 30, icon: "🪥✨" },
    { name: "미세모 칫솔", baseAtk: 50, icon: "🪥💫" },
    { name: "전동 칫솔", baseAtk: 80, icon: "⚡🪥" },
    { name: "티타늄 칫솔", baseAtk: 120, icon: "🪥🛡️" },
    { name: "황금 칫솔", baseAtk: 180, icon: "🪥💛" },
    { name: "다이아 칫솔", baseAtk: 260, icon: "💎🪥" }
];

const ARMOR_TIERS = [
    { name: "일반 치약", baseDef: 0, icon: "🧴" },
    { name: "시린이 치약", baseDef: 2, icon: "🧴❄️" },
    { name: "저불소 치약", baseDef: 4, icon: "🧴" },
    { name: "고불소 치약", baseDef: 6, icon: "🧴✨" },
    { name: "잇몸 케어 치약", baseDef: 8, icon: "🧴🌿" },
    { name: "프리미엄 치약", baseDef: 10, icon: "🧴💎" },
    { name: "황금 치약", baseDef: 13, icon: "🧴💛" },
    { name: "다이아 치약", baseDef: 16, icon: "🧴💠" }
];

const FLOSS_TIERS = [
    { name: "일반 치실", basePower: 40, baseCooldown: 20, icon: "🧵" },
    { name: "왁스 치실", basePower: 60, baseCooldown: 18, icon: "🧵✨" },
    { name: "스펀지 치실", basePower: 90, baseCooldown: 16, icon: "🧵💫" },
    { name: "고급 치실", basePower: 130, baseCooldown: 14, icon: "🧵💎" },
    { name: "프리미엄 치실", basePower: 180, baseCooldown: 12, icon: "🧵🔥" },
    { name: "황금 치실", basePower: 250, baseCooldown: 8, icon: "🧵💛" },
    { name: "다이아 치실", basePower: 350, baseCooldown: 5, icon: "🧵💠" }
];


// ─────────────────────────────────────
// 게임 상태 및 플레이어
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
    bannerTimer: 0,
    attackDelay: 0, 
};

const PLAYER = {
    x: 0,
    y: 0,
    radius: 20,
    baseMaxHp: 100, 
    hpBoostLevel: 0, 
    hp: 100,
    level: 1,
    exp: 0,
    gold: 0,

    weaponTier: 0, 
    armorTier: 0, 
    flossTier: 0, 
    
    weaponLevel: 1, 
    armorLevel: 1,
    flossLevel: 1,

    get atk() {
        const tier = WEAPON_TIERS[this.weaponTier];
        return Math.floor(tier.baseAtk + (this.weaponLevel - 1) * (tier.baseAtk * 0.15));
    },
    get def() {
        const tier = ARMOR_TIERS[this.armorTier];
        return Math.floor(tier.baseDef + (this.armorLevel - 1) * (tier.baseDef * 0.2));
    },
    get maxHp() {
        return this.baseMaxHp + this.hpBoostLevel * 50;
    },
    get attackInterval() {
        const baseInterval = 0.5;
        const tierBonus = this.weaponTier * 0.02;
        const levelBonus = this.weaponLevel * 0.005;
        return Math.max(0.15, baseInterval - tierBonus - levelBonus);
    },
    get skill() {
        const tier = FLOSS_TIERS[this.flossTier];
        return {
            power: Math.floor(tier.basePower + (this.flossLevel - 1) * (tier.basePower * 0.2)),
            cooldown: Math.max(5, tier.baseCooldown - this.flossLevel * 0.5)
        };
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
// 유틸 및 메시지
// ─────────────────────────────────────
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
    STATE.bannerTimer = 2; 
    showMessage(text);
}

// ─────────────────────────────────────
// 엔티티 생성 및 전투
// ─────────────────────────────────────
function spawnEnemy() {
    const rect = canvas.getBoundingClientRect();
    const bossChance = (STATE.stage % 5 === 0) ? 0.3 : 0.1;
    const isBoss = Math.random() < bossChance;

    const baseHp = 40 + STATE.stage * 12;
    const hp = isBoss ? baseHp * 5 : baseHp; 

    STATE.enemies.push({
        x: rect.width + 40,
        y: PLAYER.y,
        radius: isBoss ? 25 : 18,
        hp,
        maxHp: hp,
        speed: isBoss ? 50 : 80,
        isBoss,
        hitTimer: 0
    });
}

function shootProjectile() {
    STATE.projectiles.push({
        x: PLAYER.x + PLAYER.radius + 6,
        y: PLAYER.y - 3,
        speed: 300,
        power: PLAYER.atk
    });
}

// ─────────────────────────────────────
// 외형 관련 (Draw)
// ─────────────────────────────────────
function drawBackground() {
    const rect = canvas.getBoundingClientRect();

    const skyHeight = rect.height * 0.55;
    const grad = ctx.createLinearGradient(0, 0, 0, skyHeight);
    grad.addColorStop(0, "#c2f1ff");
    grad.addColorStop(1, "#e3fbff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, skyHeight);

    const groundTop = skyHeight;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundTop, rect.width, rect.height - groundTop);
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

function drawPlayer() {
    const rect = canvas.getBoundingClientRect();

    // 그림자
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(PLAYER.x, rect.height * 0.7, PLAYER.radius * 0.8, PLAYER.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 캐릭터 (치아)
    ctx.font = `${PLAYER.radius * 1.8}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🦷", PLAYER.x, PLAYER.y);

    // 장비 아이콘
    ctx.font = "16px serif";
    const weaponIcon = WEAPON_TIERS[PLAYER.weaponTier].icon;
    const armorIcon = ARMOR_TIERS[PLAYER.armorTier].icon;
    const flossIcon = FLOSS_TIERS[PLAYER.flossTier].icon;

    ctx.fillText(weaponIcon, PLAYER.x - 28, PLAYER.y - 26); // 무기
    ctx.fillText(armorIcon, PLAYER.x + 28, PLAYER.y - 26); // 갑옷
    ctx.fillText(flossIcon, PLAYER.x, PLAYER.y + 30); // 치실
}

function getProjectileStyle() {
    const lv = PLAYER.weaponTier;
    if (lv <= 1) return { color: "#ffcc00", size: 4, char: "•" };
    if (lv <= 3) return { color: "#ffa726", size: 5, char: "✦" };
    if (lv <= 5) return { color: "#ff4081", size: 6, char: "✶" };
    if (lv <= 7) return { color: "#b388ff", size: 7, char: "✺" };
    return { color: "#ffffff", size: 8, char: "✵" };
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

function drawEnemies(dt) {
    const rect = canvas.getBoundingClientRect();

    for (const e of STATE.enemies) {
        // 적 본체
        ctx.save();
        e.hitTimer = Math.max(0, e.hitTimer - dt);
        
        if (e.hitTimer > 0) {
            ctx.filter = "brightness(2)"; 
        }

        ctx.font = `${e.radius * 1.4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🦠", e.x, e.y);
        ctx.restore();

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

// ─────────────────────────────────────
// 업데이트
// ─────────────────────────────────────
function update(delta) {
    const rect = canvas.getBoundingClientRect();
    const dt = delta / 1000;

    // 거리 및 스테이지 증가
    STATE.distance += 60 * dt;
    distanceText.textContent = `${Math.floor(STATE.distance)} m`;
    
    const newStage = 1 + Math.floor(STATE.distance / 600);
    if (newStage !== STATE.stage) {
        STATE.stage = newStage;
        showBanner(`✨ 스테이지 ${STATE.stage} 시작!`);
    }

    // 몬스터 스폰
    STATE.spawnTimer += delta;
    const interval = Math.max(600, 1300 - STATE.stage * 40);
    if (STATE.spawnTimer >= interval) {
        STATE.spawnTimer = 0;
        spawnEnemy();
    }

    // 플레이어 자동 공격 (공격 속도 기반)
    STATE.attackDelay += dt;
    if (STATE.attackDelay >= PLAYER.attackInterval) {
        shootProjectile();
        STATE.attackDelay = 0;
    }

    // 투사체 이동 및 적 이동
    for (const p of STATE.projectiles) { p.x += p.speed * dt; }
    for (const e of STATE.enemies) { e.x -= e.speed * dt; }

    // 충돌 판정
    STATE.projectiles = STATE.projectiles.filter(p => {
        let hit = false;
        for (const e of STATE.enemies) {
            if (Math.abs(p.x - e.x) < 20 && Math.abs(p.y - e.y) < 20) {
                e.hp -= p.power;
                e.hitTimer = 0.1; 
                hit = true;
                playOnce(sfxHit);

                if (e.hp <= 0 && !e.dead) {
                    e.dead = true;
                    const gain = e.isBoss ? 150 : 30;
                    PLAYER.gold += gain;
                    showMessage(`충치균 처치! +${gain}G`);
                }
                break;
            }
        }
        return p.x - 10 < rect.width && !hit;
    });

    // 죽은 적 제거
    STATE.enemies = STATE.enemies.filter((e) => e.x + e.radius > 0 && !e.dead);

    // 적이 플레이어에 닿았는지 체크 (피격)
    for (const e of STATE.enemies) {
        if (e.x - e.radius < PLAYER.x + PLAYER.radius * 0.5) {
            const damage = Math.max(
                (e.isBoss ? 25 : 10) - PLAYER.def * 0.8,
                1
            );
            PLAYER.hp -= damage * dt;
            if (PLAYER.hp <= 0) {
                PLAYER.hp = 0;
                // 게임 오버 상태만 설정하고 로직을 중단하지 않습니다.
                gameOver(); 
            }
        }
    }

    // 스킬 쿨타임 및 배너 타이머
    STATE.skillTimer += dt;
    if (STATE.bannerTimer > 0) {
        STATE.bannerTimer -= dt;
        if (STATE.bannerTimer <= 0) { showMessage(""); }
    }

    // HP 회복 (자동 사냥 중 아주 느리게 회복)
    PLAYER.hp = Math.min(PLAYER.maxHp, PLAYER.hp + PLAYER.maxHp * 0.005 * dt);

    updateUI();
}

// ─────────────────────────────────────
// 스킬 (불소 폭발)
// ─────────────────────────────────────
function useSkill() {
    const skill = PLAYER.skill;
    if (STATE.skillTimer < skill.cooldown) return;
    STATE.skillTimer = 0;

    if (STATE.enemies.length === 0) {
        showMessage("공격할 몬스터가 없습니다.");
        return;
    }

    playOnce(sfxSkill);

    // 스킬 이펙트 (흰색 플래시)
    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();

    const dmg = skill.power;
    let goldGain = 0;
    for (const e of STATE.enemies) {
        e.hp -= dmg;
        if (e.hp <= 0 && !e.dead) {
            e.dead = true;
            goldGain += e.isBoss ? 150 : 30;
        }
    }
    PLAYER.gold += goldGain;
    showBanner(`💥 불소 폭발! 모든 충치균에게 ${dmg} 대미지!`);
    STATE.enemies = STATE.enemies.filter((e) => e.x + e.radius > 0 && !e.dead);
    updateUI();
}


// ─────────────────────────────────────
// UI 및 상점 (장비 구매 및 강화 로직)
// ─────────────────────────────────────

function updateGearTexts() {
    const w = WEAPON_TIERS[PLAYER.weaponTier];
    const a = ARMOR_TIERS[PLAYER.armorTier];
    const f = FLOSS_TIERS[PLAYER.flossTier];

    weaponNameText.textContent = `${w.icon} ${w.name} (Lv.${PLAYER.weaponLevel})`;
    armorNameText.textContent = `${a.icon} ${a.name} (Lv.${PLAYER.armorLevel})`;
    flossNameText.textContent = `${f.icon} ${f.name} (Lv.${PLAYER.flossLevel})`;
}

function updateUpgradeButtons() {
    // 무기 강화
    const wCost = 30 + PLAYER.weaponLevel * 30;
    btnWeaponUpgrade.textContent = `🪥 무기 강화 (Lv.${PLAYER.weaponLevel}) | ${wCost}G`;
    btnWeaponUpgrade.classList.toggle("disabled", PLAYER.gold < wCost);

    // 갑옷 강화
    const aCost = 30 + PLAYER.armorLevel * 30;
    btnArmorUpgrade.textContent = `🧴 갑옷 강화 (Lv.${PLAYER.armorLevel}) | ${aCost}G`;
    btnArmorUpgrade.classList.toggle("disabled", PLAYER.gold < aCost);

    // 불소 강화 (치실 스킬 강화)
    const fCost = 50 + PLAYER.flossLevel * 50;
    btnFluorUpgrade.textContent = `🧵 불소 강화 (Lv.${PLAYER.flossLevel}) | ${fCost}G`;
    btnFluorUpgrade.classList.toggle("disabled", PLAYER.gold < fCost);

    // HP 강화 (체력 강화)
    const hpCost = 100 + PLAYER.hpBoostLevel * 80;
    btnHpUpgrade.textContent = `❤️ HP 강화 (Lv.${PLAYER.hpBoostLevel}) | ${hpCost}G`;
    btnHpUpgrade.classList.toggle("disabled", PLAYER.gold < hpCost);
}

function updateShopTexts() {
    // 무기 상점
    if (PLAYER.weaponTier + 1 < WEAPON_TIERS.length) {
        const next = WEAPON_TIERS[PLAYER.weaponTier + 1];
        const cost = 200 + PLAYER.weaponTier * 300;
        shopWeaponNext.textContent = `다음: ${next.name} (ATK +${next.baseAtk})`;
        shopWeaponCost.textContent = `구매 비용: ${cost}G`;
        shopWeaponCard.onclick = () => buyTierItem('weapon', cost);
        shopWeaponCard.classList.toggle("disabled", PLAYER.gold < cost);
    } else {
        shopWeaponNext.textContent = "최고 무기입니다.";
        shopWeaponCost.textContent = "-";
        shopWeaponCard.onclick = null;
        shopWeaponCard.classList.add("disabled");
    }

    // 갑옷 상점
    if (PLAYER.armorTier + 1 < ARMOR_TIERS.length) {
        const next = ARMOR_TIERS[PLAYER.armorTier + 1];
        const cost = 200 + PLAYER.armorTier * 300;
        shopArmorNext.textContent = `다음: ${next.name} (DEF +${next.baseDef})`;
        shopArmorCost.textContent = `구매 비용: ${cost}G`;
        shopArmorCard.onclick = () => buyTierItem('armor', cost);
        shopArmorCard.classList.toggle("disabled", PLAYER.gold < cost);
    } else {
        shopArmorNext.textContent = "최고 갑옷입니다.";
        shopArmorCost.textContent = "-";
        shopArmorCard.onclick = null;
        shopArmorCard.classList.add("disabled");
    }
    
    // 치실 상점
    if (PLAYER.flossTier + 1 < FLOSS_TIERS.length) {
        const next = FLOSS_TIERS[PLAYER.flossTier + 1];
        const cost = 300 + PLAYER.flossTier * 400;
        shopFlossNext.textContent = `다음: ${next.name} (스킬 강화)`;
        shopFlossCost.textContent = `구매 비용: ${cost}G`;
        shopFlossCard.onclick = () => buyTierItem('floss', cost);
        shopFlossCard.classList.toggle("disabled", PLAYER.gold < cost);
    } else {
        shopFlossNext.textContent = "최고 치실입니다.";
        shopFlossCost.textContent = "-";
        shopFlossCard.onclick = null;
        shopFlossCard.classList.add("disabled");
    }
}

function buyTierItem(type, cost) {
    if (PLAYER.gold < cost) {
        showMessage(`골드가 부족합니다. (필요: ${cost}G)`);
        return;
    }

    PLAYER.gold -= cost;
    let itemName = "";

    if (type === 'weapon') {
        PLAYER.weaponTier++;
        PLAYER.weaponLevel = 1; // 새 장비 구매 시 강화 레벨 초기화
        itemName = WEAPON_TIERS[PLAYER.weaponTier].name;
    } else if (type === 'armor') {
        PLAYER.armorTier++;
        PLAYER.armorLevel = 1;
        itemName = ARMOR_TIERS[PLAYER.armorTier].name;
    } else if (type === 'floss') {
        PLAYER.flossTier++;
        PLAYER.flossLevel = 1;
        itemName = FLOSS_TIERS[PLAYER.flossTier].name;
    }

    showBanner(`🎉 ${itemName} 구매 완료! 외형이 변경되었습니다.`);
    updateUI();
}

function upgradeStat(statType) {
    let level, cost, max;
    
    if (statType === 'weapon') {
        level = PLAYER.weaponLevel;
        cost = 30 + level * 30;
        max = 30; 
        if (level >= max) { showMessage("무기 최대 강화 레벨입니다."); return; }
        PLAYER.weaponLevel++;
    } else if (statType === 'armor') {
        level = PLAYER.armorLevel;
        cost = 30 + level * 30;
        max = 30; 
        if (level >= max) { showMessage("갑옷 최대 강화 레벨입니다."); return; }
        PLAYER.armorLevel++;
    } else if (statType === 'floss') {
        level = PLAYER.flossLevel;
        cost = 50 + level * 50;
        max = 30; 
        if (level >= max) { showMessage("치실 최대 강화 레벨입니다."); return; }
        PLAYER.flossLevel++;
    } else if (statType === 'hp') { 
        level = PLAYER.hpBoostLevel;
        cost = 100 + level * 80;
        max = 50; 
        if (level >= max) { showMessage("HP 최대 강화 레벨입니다."); return; }
        PLAYER.hpBoostLevel++;
        PLAYER.hp = PLAYER.maxHp; 
    } else {
        return;
    }

    if (PLAYER.gold < cost) {
        showMessage(`골드가 부족합니다. (필요: ${cost}G)`);
        return;
    }
    PLAYER.gold -= cost;
    
    if (statType !== 'hp') {
        showBanner(`${statType.toUpperCase()} 강화 성공! Lv.${level + 1} 달성.`);
    } else {
        showBanner(`❤️ HP 강화 성공! Max HP +50!`);
    }
    
    updateUI();
}


function updateUI() {
    hpText.textContent = `${Math.round(PLAYER.hp)} / ${PLAYER.maxHp}`;
    levelText.textContent = `Lv.${PLAYER.level}`;
    
    const w = WEAPON_TIERS[PLAYER.weaponTier];
    atkText.textContent = `${PLAYER.atk} (Base ${w.baseAtk}) / S.Lv.${PLAYER.weaponLevel}`;
    
    const a = ARMOR_TIERS[PLAYER.armorTier];
    defText.textContent = `DEF ${PLAYER.def} (Base ${a.baseDef}) / Floss Lv.${PLAYER.flossLevel}`;
    
    goldText.textContent = `${PLAYER.gold} Gold`;

    // 스킬 버튼 문구
    const skill = PLAYER.skill;
    const remain = Math.max(0, skill.cooldown - STATE.skillTimer);
    if (remain <= 0) {
        btnSkill.textContent = "💥 불소 폭발 (준비완료)";
        btnSkill.classList.remove("disabled");
    } else {
        btnSkill.textContent = `💥 불소 폭발 (${remain.toFixed(1)}s)`;
        btnSkill.classList.add("disabled");
    }

    updateGearTexts();
    updateUpgradeButtons();
    updateShopTexts();
    saveGame();
}

// ─────────────────────────────────────
// 세이브 / 로드
// ─────────────────────────────────────
function saveGame() {
    const data = {
        hp: PLAYER.hp,
        hpBoostLevel: PLAYER.hpBoostLevel,
        level: PLAYER.level,
        gold: PLAYER.gold,
        
        weaponTier: PLAYER.weaponTier,
        armorTier: PLAYER.armorTier,
        flossTier: PLAYER.flossTier,
        
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
        PLAYER.hpBoostLevel = data.hpBoostLevel ?? 0;
        PLAYER.level = data.level ?? PLAYER.level;
        PLAYER.gold = data.gold ?? PLAYER.gold;
        
        PLAYER.weaponTier = Math.min(data.weaponTier ?? 0, WEAPON_TIERS.length - 1);
        PLAYER.armorTier = Math.min(data.armorTier ?? 0, ARMOR_TIERS.length - 1);
        PLAYER.flossTier = Math.min(data.flossTier ?? 0, FLOSS_TIERS.length - 1);
        
        PLAYER.weaponLevel = data.weaponLevel ?? 1;
        PLAYER.armorLevel = data.armorLevel ?? 1;
        PLAYER.flossLevel = data.flossLevel ?? 1;
        
        STATE.distance = data.distance ?? STATE.distance;
        STATE.stage = data.stage ?? STATE.stage;
        
        PLAYER.hp = Math.min(PLAYER.hp, PLAYER.maxHp);
    } catch (e) {}
}

// ─────────────────────────────────────
// 게임 흐름 및 이벤트 연결
// ─────────────────────────────────────
function clearAllEntities() {
    STATE.enemies.length = 0;
    STATE.projectiles.length = 0;
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
        PLAYER.hpBoostLevel = 0;
        PLAYER.level = 1;
        PLAYER.gold = 0;
        PLAYER.weaponTier = 0;
        PLAYER.armorTier = 0;
        PLAYER.flossTier = 0;
        PLAYER.weaponLevel = 1;
        PLAYER.armorLevel = 1;
        PLAYER.flossLevel = 1;
        STATE.distance = 0;
        STATE.stage = 1;
    }

    PLAYER.hp = PLAYER.maxHp; 

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
// 메인 루프 (렌더링 순서 수정)
// ─────────────────────────────────────
function loop(timestamp) {
    if (!STATE.lastTime) STATE.lastTime = timestamp;
    const delta = timestamp - STATE.lastTime;
    STATE.lastTime = timestamp;
    const dt = delta / 1000;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. 업데이트 (로직 계산)
    if (STATE.running) {
        update(delta); 
    }
    
    // 2. 렌더링 (그리기) - 로직 업데이트 상태와 관계없이 항상 화면에 그립니다.
    drawBackground();
    drawPlayer();
    drawEnemies(dt); 
    drawProjectiles();

    requestAnimationFrame(loop);
}

// ─────────────────────────────────────
// 이벤트 연결
// ─────────────────────────────────────
btnWeaponUpgrade.addEventListener("click", () => upgradeStat('weapon'));
btnArmorUpgrade.addEventListener("click", () => upgradeStat('armor'));
btnFluorUpgrade.addEventListener("click", () => upgradeStat('floss'));
btnHpUpgrade.addEventListener("click", () => upgradeStat('hp')); // HP 강화 연결

btnPause.addEventListener("click", () => {
    STATE.running = !STATE.running;
    btnPause.textContent = STATE.running ? "⏸ 일시정지" : "▶ 다시 시작";
    if (STATE.running) showMessage("자동 사냥 재개!");
    else showMessage("일시정지 중…");
});

btnRestart.addEventListener("click", () => {
    resetGame(true);
});

btnSkill.addEventListener("click", useSkill);

// 사운드 초기화 로직
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
