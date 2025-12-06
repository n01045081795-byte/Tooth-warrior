// ===========================
// Tooth Warrior - GAME LOGIC
// DABOM Dental Clinic Edition
// ===========================

// ----- PLAYER STATE -----
let player = {
    x: 100,
    y: 0,
    hp: 100,
    maxHp: 100,
    atk: 10,
    weaponLv: 1,
    armorLv: 1,
    fluorideLv: 1,
    cooldownLv: 1,
};

// ----- GAME STATE -----
let gold = 0;
let distance = 0;
let running = true;
let projectileSpeed = 8;

let enemies = [];
let projectiles = [];

let skillActive = false;
let skillTimer = 0;
let nextEnemy = 0;
let spawnInterval = 1600;
let bossInterval = 15000;

// DOM
const gameArea = document.getElementById("game-area");
const flash = document.getElementById("flash");
const shopAtk = document.getElementById("shop-atk");
const shopDef = document.getElementById("shop-def");
const shopFlu = document.getElementById("shop-flu");
const skillBtn = document.getElementById("skill-btn");
const goScreen = document.getElementById("gameover");
const btnRestart = document.getElementById("go-restart");

// UI Elements
let uiHp, uiAtk, uiArmor, uiFlu, uiCooldown, uiGold, uiDistance;

// Load Save
function loadGame() {
    const save = localStorage.getItem("tooth-save");
    if (save) {
        let s = JSON.parse(save);
        Object.assign(player, s.player);
        gold = s.gold;
        distance = s.distance;
    }
}
loadGame();

// Save
function saveGame() {
    localStorage.setItem("tooth-save", JSON.stringify({
        player, gold, distance
    }));
}

// ----- PROJECTILE SETTINGS -----
const PROJECTILES = [
    "·","•","✦","✸","✨","💥","🌟","💫","🌈","☄️"
];
function getProjectileIcon() {
    let idx = Math.min(Math.floor((player.weaponLv - 1) / 10), 9);
    return PROJECTILES[idx];
}

// ----- ENEMY -----
function spawnEnemy() {
    let boss = distance > 0 && distance % 200 === 0;
    let hp = boss ? 150 + distance / 30 : 30 + distance / 80;
    let e = document.createElement("div");
    e.classList.add("entity", "enemy");
    e.textContent = boss ? "🦠" : "🦠";
    e.style.left = "100vw";
    e.style.bottom = "28%";
    gameArea.appendChild(e);
    enemies.push({el: e, hp, maxHp: hp, boss});
}

// ----- ATTACK -----
function fireProjectile() {
    let p = document.createElement("div");
    p.classList.add("entity", "projectile");
    p.textContent = getProjectileIcon();
    p.style.left = player.x + 30 + "px";
    p.style.bottom = "30%";
    gameArea.appendChild(p);
    projectiles.push({el: p, x: player.x + 30});
}

// ----- UI UPDATE -----
function initUI() {
    uiHp = document.getElementById("ui-hp");
    uiAtk = document.getElementById("ui-atk");
    uiArmor = document.getElementById("ui-armor");
    uiFlu = document.getElementById("ui-flu");
    uiCooldown = document.getElementById("ui-cd");
    uiGold = document.getElementById("ui-gold");
    uiDistance = document.getElementById("ui-dist");
    updateUI();
}
initUI();

function updateUI() {
    uiHp.textContent = `HP: ${Math.round(player.hp)} / ${player.maxHp}`;
    uiAtk.textContent = `ATK: ${player.atk} (Lv.${player.weaponLv})`;
    uiArmor.textContent = `DEF Lv.${player.armorLv}`;
    uiFlu.textContent = `Flu Lv.${player.fluorideLv}`;
    uiCooldown.textContent = `CD Lv.${player.cooldownLv}`;
    uiGold.textContent = `${gold} Gold`;
    uiDistance.textContent = `${Math.round(distance)} m`;
}

// ----- SKILL -----
function skillDamage() {
    return player.atk * (1.3 + player.fluorideLv * 0.25);
}

function useSkill() {
    if (skillActive) return;
    skillActive = true;
    skillTimer = 0;
    skillBtn.classList.add("cooldown");
}

function skillCooldownMs() {
    let base = 18000;
    let min = 2000;
    return Math.max(min, base - player.cooldownLv * 2000);
}

// ----- SHOP -----
function buyWeapon() {
    let cost = player.weaponLv * 200;
    if (gold < cost) return;
    gold -= cost;
    player.weaponLv++;
    player.atk += 4;
    updateUI();
}
function buyArmor() {
    let cost = player.armorLv * 180;
    if (gold < cost) return;
    gold -= cost;
    player.armorLv++;
    player.maxHp += 25;
    player.hp = player.maxHp;
    updateUI();
}
function buyFlu() {
    let cost = player.fluorideLv * 200;
    if (gold < cost) return;
    gold -= cost;
    player.fluorideLv++;
    updateUI();
}

shopAtk.onclick = buyWeapon;
shopDef.onclick = buyArmor;
shopFlu.onclick = buyFlu;
skillBtn.onclick = useSkill;

// ----- DAMAGE -----
function takeDamage(dmg) {
    dmg *= (1 - player.armorLv * 0.02);
    player.hp -= dmg;
    if (player.hp <= 0) {
        gameOver();
    }
}

// ----- GAME LOOP -----
let last = performance.now();
function loop(t) {
    if (!running) return;

    let dt = t - last; last = t;
    distance += dt * 0.02;

    if (t >= nextEnemy) {
        spawnEnemy();
        nextEnemy = t + spawnInterval;
    }

    // move enemies
    enemies.forEach((e, i) => {
        let x = e.el.offsetLeft - 1.3;
        e.el.style.left = x + "px";
        if (x < player.x + 20) {
            takeDamage(0.4);
        }
        if (e.hp <= 0) {
            gold += e.boss ? 30 : 8;
            if (e.boss) {
                flash.classList.add("flash");
                setTimeout(()=>flash.classList.remove("flash"),1000);
            }
            gameArea.removeChild(e.el);
            enemies.splice(i,1);
        }
    });

    // projectile movement
    projectiles.forEach((p,i)=>{
        p.x += projectileSpeed;
        p.el.style.left = p.x + "px";
        enemies.forEach((e,j)=>{
            if (p.x > e.el.offsetLeft-10 && p.x < e.el.offsetLeft+30) {
                e.hp -= player.atk;
                gameArea.removeChild(p.el);
                projectiles.splice(i,1);
            }
        });
        if (p.x > innerWidth) {
            gameArea.removeChild(p.el);
            projectiles.splice(i,1);
        }
    });

    // auto fire
    if (t % 200 < 17) fireProjectile();

    // skill tick
    if (skillActive) {
        skillTimer += dt;
        if (skillTimer > 300) {
            enemies.forEach(e=> e.hp -= skillDamage());
            skillActive = false;
            setTimeout(()=>skillBtn.classList.remove("cooldown"), skillCooldownMs());
        }
    }

    updateUI();
    saveGame();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ----- GAME OVER -----
function gameOver() {
    running = false;
    goScreen.style.display = "flex";
}

btnRestart.onclick = () => location.reload();
