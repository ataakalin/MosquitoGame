const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Karakter özellikleri
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height / 2 - 20,
  width: 40,
  height: 40,
  color: '#388e3c',
  speed: 2.0, // Daha hızlı
  dx: 0,
  dy: 0,
  lives: 3
};

// Canvas boyutu değişirse karakteri ortala (oyun başında ve resize'da)
function centerPlayer() {
  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height / 2 - player.height / 2;
}
window.addEventListener('resize', centerPlayer);
centerPlayer();

// Sinekler
let flies = [];
const flySize = 24;
const flyColor = '#222';
const flySpeed = 0.9; // Daha hızlı
let flySpawnInterval = 1200; // ms
let lastFlySpawn = 0;

// Saldırılar
let attacks = [];
const attackLength = 60;
const attackThickness = 18;
const attackColor = '#f44336';
const attackSpeed = 16; // daha hızlı ve belirgin
const attackDuration = 180; // ms
const attackCooldown = 300; // ms
let lastAttackTime = 0;
let lastDirection = 'right'; // Son yön

// Kalp (can) sistemi
let heart = null;
const heartSize = 28;
const heartColor = '#e53935';
let lastHeartSpawn = 0;
const heartSpawnInterval = 30000; // 30 saniye

// GOLD ve SKOR
let golds = [];
let goldCount = 0;
let score = 0;
const goldSize = 18;
const goldColor = '#FFD700';

// GÜÇLENDİRMELER
let upgrades = {
  immune: false,
  tongue: false,
  slow: false
};
let immuneTimeout = 0;
let slowTimeout = 0;
let tongueTimeout = 0;

// Saldırı alanı
const baseAttackRadius = 80;
const bigAttackRadius = 160;

let paused = false;
let pauseFrame = null;

let highScore = Number(localStorage.getItem('highScore') || 0);

let tongueLevel = 1; // Başlangıç seviyesi
const maxTongueLevel = 5;

let pressedKeys = {};

// Immune ve Slow için cooldown
let immuneCooldown = 0;
let slowCooldown = 0;
const immuneCooldownTime = 6000; // 6 saniye
const slowCooldownTime = 10000; // 10 saniye
const immuneSkillDuration = 3000; // 3 saniye
const slowSkillDuration = 5000; // 5 saniye

const dashFlyColor = '#ffb300';
const dashFlyChargeColor = '#e53935';
const dashFlySize = 28;
const dashFlySpeed = 0.5; // Dash sineklerin normal hızı daha yavaş
const dashFlyDashSpeed = 3.5; // Dash sineklerin dash hızı daha yavaş
const dashFlyChargeTime = 900; // ms
const dashFlyDashTime = 350; // ms
const dashFlySpawnChance = 0.3; // %30 dash sinek

const tankFlyColor = '#607d8b';
const tankFlySize = 38;
const tankFlyMaxHp = 2;
const tankFlySpawnChance = 0.2; // %20 tank sinek

let flyIdCounter = 1;

let magnetLevel = 0;
const maxMagnetLevel = 5;
const magnetRadius = [0, 100, 180, 300, 500, 99999]; // seviye 0-5

let strengthLevel = 0;
const maxStrengthLevel = 3;

// Boss
let boss = null;
let bossProjectiles = [];
const bossSize = 100;
const bossBaseHp = 30;
const bossColor = '#880e4f';
const bossProjectileColor = '#ff1744';
const bossSpecialProjectileColor = '#00e5ff'; // Özel mermi rengi
const bossBaseProjectileSpeed = 4.2;
const bossProjectileSize = 18;
const bossAttackInterval = 1200; // ms
let bossLastAttack = 0;
let inBossFight = false;
let nextBossTime = Date.now() + 120000; // 2 dakika sonra ilk boss
let bossAttackCount = 0; // Kaçıncı atışta özel mermi atılacak

// Mermi sistemi
let bullets = [];
const bulletSpeed = 6; // Daha yavaş mermi
const bulletSize = 16;
const bulletColor = '#f44336';

let atkspeedLevel = 1;
const maxAtkspeedLevel = 10;
const atkspeedCooldowns = [0, 350, 300, 250, 200, 160, 120, 100, 80, 70, 60]; // ms, seviye 1-10
let lastShotTime = 0;

let dmgLevel = 0;
let dmgValue = 0;
let dmgCost = 10;
const dmgCostIncrease = 5;
const dmgPerLevel = 0.5;

const atkspeedCostIncrease = 3;
let atkspeedCost = 10;

let startTime = Date.now();

// === YENİ: Zamanla artan sinek spawnı ===
let fliesPerSpawn = 1;
let lastDifficultyIncrease = Date.now();
const maxFliesPerSpawn = 10;

// === YENİ: Multi-Shot (Atış Sayısı) güçlendirmesi ===
let multishotLevel = 1;
let multishotCost = 25; // Başlangıç maliyeti 25 gold
const maxMultishotLevel = 3;

// === YENİ: Boss güçlendirme sayaçları ===
let bossCount = 0;

// === YENİ: Mouse auto-fire ===
let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;

// === YENİ: Freeze efekti ===
let freezeTimeout = 0;
let isFrozen = false;
const freezeDuration = 2000; // 2 saniye

// === YENİ: Movement Speed güçlendirmesi ===
let movespeedLevel = 1;
const maxMovespeedLevel = 5;
let movespeedCost = 10;
const movespeedCostIncrease = 5;
let movespeedPerLevel = 0.3;

// === YENİ: Damage textleri ===
let damageTexts = [];
const damageTextDuration = 500; // ms

// === YENİ: Ultimate Skill sistemi ===
let killCount = 0;
const ultimateKillRequirement = 50;
let ultimateReady = false;

// === YENİ: Sinek görselleri ===
const imgMosquitoNormal = new Image();
imgMosquitoNormal.src = 'mosquito_normal.png';
const imgMosquitoTank = new Image();
imgMosquitoTank.src = 'mosquito_tank.png';
const imgMosquitoDash = new Image();
imgMosquitoDash.src = 'mosquito_dash.png';

// === YENİ: Karakter görseli ===
const imgPlayer = new Image();
imgPlayer.src = 'karakter.png';

// === YENİ: H tuşuna basınca teemoSesi.mp3 çal ===
const teemoAudio = new Audio('teemoSesi.mp3');
teemoAudio.volume = 1;

// === YENİ: Ölünce atffi.mp3 çal ===
const atffiAudio = new Audio('atffi.mp3');
atffiAudio.volume = 1;

let audioUnlocked = false;
function unlockAudio() {
  if (!audioUnlocked) {
    teemoAudio.play().then(() => {
      teemoAudio.pause();
      teemoAudio.currentTime = 0;
      audioUnlocked = true;
    }).catch(()=>{});
  }
}
window.addEventListener('mousedown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

function drawPlayer() {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.drawImage(imgPlayer, player.x, player.y, player.width, player.height);
  // === YENİ: Karakterin üstüne can labelı ===
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.strokeText(player.lives, player.x + player.width/2, player.y - 8);
  ctx.fillText(player.lives, player.x + player.width/2, player.y - 8);
  ctx.restore();
}

function drawFlies() {
  for (const fly of flies) {
    if (fly.type === 'tank') {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(imgMosquitoTank, fly.x, fly.y, tankFlySize, tankFlySize);
      // === YENİ: Tank sineğin üstüne can labelı ===
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3;
      ctx.strokeText(fly.hp, fly.x + tankFlySize/2, fly.y - 6);
      ctx.fillText(fly.hp, fly.x + tankFlySize/2, fly.y - 6);
      ctx.restore();
    } else if (fly.type === 'dash') {
      ctx.save();
      ctx.globalAlpha = 1;
      // === YENİ: Dash state'inde animasyonlu atlama ===
      if (fly.state === 'dashing') {
        const scale = 1.18;
        const offsetY = -10;
        ctx.translate(fly.x + dashFlySize/2, fly.y + dashFlySize/2 + offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(imgMosquitoDash, -dashFlySize/2, -dashFlySize/2, dashFlySize, dashFlySize);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      } else {
        ctx.drawImage(imgMosquitoDash, fly.x, fly.y, dashFlySize, dashFlySize);
      }
      // === Dash sinek chargelarken kırmızı overlay ===
      if (fly.state === 'charging') {
        ctx.globalAlpha = 0.13;
        ctx.beginPath();
        ctx.arc(fly.x + dashFlySize/2, fly.y + dashFlySize/2, dashFlySize/2, 0, Math.PI * 2);
        ctx.fillStyle = '#e53935';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // === Dash sineğin üstüne can labelı ===
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3;
      ctx.strokeText(fly.hp, fly.x + dashFlySize/2, fly.y - 6);
      ctx.fillText(fly.hp, fly.x + dashFlySize/2, fly.y - 6);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(imgMosquitoNormal, fly.x, fly.y, flySize, flySize);
      // === YENİ: Normal sineğin üstüne can labelı ===
      ctx.font = 'bold 15px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3;
      ctx.strokeText(fly.hp, fly.x + flySize/2, fly.y - 6);
      ctx.fillText(fly.hp, fly.x + flySize/2, fly.y - 6);
      ctx.restore();
    }
    // === YENİ: Sinek üstünde damage text çiz ===
    for (const dt of damageTexts) {
      if (dt.type === 'fly' && dt.id === fly.id) {
        const alpha = Math.max(0, 1 - (Date.now() - dt.created) / damageTextDuration);
        ctx.save();
        ctx.globalAlpha = 0.5 * alpha;
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#f44336';
        ctx.textAlign = 'center';
        let cx, cy;
        if (fly.type === 'tank') {
          cx = fly.x + 0.5 * tankFlySize;
          cy = fly.y - 8;
        } else if (fly.type === 'dash') {
          cx = fly.x + 0.5 * dashFlySize;
          cy = fly.y - 8;
        } else {
          cx = fly.x + 0.5 * flySize;
          cy = fly.y - 8;
        }
        ctx.fillText(dt.value, cx, cy);
        ctx.restore();
      }
    }
  }
}

function drawAttackCircle() {
  if (!attacks.length) return;
  for (const atk of attacks) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(atk.x, atk.y, atk.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f44336';
    ctx.fill();
    ctx.restore();
  }
}

function drawHeart() {
  if (heart) {
    ctx.save();
    ctx.translate(heart.x + heartSize/2, heart.y + heartSize/2);
    ctx.scale(1.2, 1.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0, -10, -15, -10, -15, 5);
    ctx.bezierCurveTo(-15, 20, 0, 20, 0, 30);
    ctx.bezierCurveTo(0, 20, 15, 20, 15, 5);
    ctx.bezierCurveTo(15, -10, 0, -10, 0, 0);
    ctx.closePath();
    ctx.fillStyle = heartColor;
    ctx.fill();
    ctx.restore();
  }
}

function drawGolds() {
  for (const g of golds) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(g.x + goldSize/2, g.y + goldSize/2, goldSize/2, 0, Math.PI * 2);
    ctx.fillStyle = goldColor;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }
}

function drawLives() {
  ctx.font = '20px Arial';
  ctx.fillStyle = '#222';
  ctx.fillText('Can: ' + player.lives, 20, 30);
  ctx.fillText('Skor: ' + score, 20, 60);
  ctx.fillText('Altın: ' + goldCount, 20, 90);
  ctx.fillText('High Score: ' + highScore, 20, 120);
  // Sağ üstte hayatta kalma süresi
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  ctx.textAlign = 'right';
  ctx.fillText('Süre: ' + min + ':' + (sec < 10 ? '0' : '') + sec, canvas.width - 20, 30);
  ctx.textAlign = 'left';
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
  player.x += player.dx;
  player.y += player.dy;
  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

function getCurrentFlyHp(type) {
  // Zaman geçtikçe sineklerin canı artsın (her 60 saniyede bir +1)
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const hpBonus = Math.floor(elapsed / 60);
  if (type === 'tank') return 3 + hpBonus;
  if (type === 'dash') return 2 + hpBonus;
  return 1 + hpBonus;
}

function spawnFly() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = Math.random() * (canvas.width - flySize); y = 0; }
  else if (edge === 1) { x = canvas.width - flySize; y = Math.random() * (canvas.height - flySize); }
  else if (edge === 2) { x = Math.random() * (canvas.width - flySize); y = canvas.height - flySize; }
  else { x = 0; y = Math.random() * (canvas.height - flySize); }
  const r = Math.random();
  if (r < tankFlySpawnChance) {
    const hp = getCurrentFlyHp('tank');
    flies.push({
      id: flyIdCounter++,
      type: 'tank',
      x, y,
      hp: hp,
      maxHp: hp
    });
  } else if (r < tankFlySpawnChance + dashFlySpawnChance) {
    const hp = getCurrentFlyHp('dash');
    flies.push({
      id: flyIdCounter++,
      type: 'dash',
      x, y,
      state: 'normal',
      chargeStart: 0,
      dashStart: 0,
      vx: 0,
      vy: 0,
      hp: hp,
      maxHp: hp
    });
  } else {
    const hp = getCurrentFlyHp('normal');
    flies.push({ id: flyIdCounter++, x, y, type: 'normal', hp: hp, maxHp: hp });
  }
}

function updateFlies() {
  for (const fly of flies) {
    if (fly.type === 'dash') {
      updateDashFly(fly);
    } else {
      const px = player.x + player.width/2;
      const py = player.y + player.height/2;
      let fx, fy, speed;
      if (fly.type === 'tank') {
        fx = fly.x + tankFlySize/2;
        fy = fly.y + tankFlySize/2;
        speed = getFlySpeed() * 0.5; // tank sinekler daha yavaş
      } else {
        fx = fly.x + flySize/2;
        fy = fly.y + flySize/2;
        speed = getFlySpeed();
      }
      const dx = px - fx;
      const dy = py - fy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 0) {
        fly.x += (dx / dist) * speed;
        fly.y += (dy / dist) * speed;
        // Sinekler canvas dışına çıkmasın
        if (fly.type === 'tank') {
          fly.x = Math.max(0, Math.min(fly.x, canvas.width - tankFlySize));
          fly.y = Math.max(0, Math.min(fly.y, canvas.height - tankFlySize));
        } else {
          fly.x = Math.max(0, Math.min(fly.x, canvas.width - flySize));
          fly.y = Math.max(0, Math.min(fly.y, canvas.height - flySize));
        }
      }
    }
  }
}

function updateDashFly(fly) {
  const px = player.x + player.width/2;
  const py = player.y + player.height/2;
  const fx = fly.x + dashFlySize/2;
  const fy = fly.y + dashFlySize/2;
  const dist = Math.sqrt((px - fx) ** 2 + (py - fy) ** 2);
  const now = Date.now();
  if (fly.state === 'normal') {
    if (dist < 180) {
      fly.state = 'charging';
      fly.chargeStart = now;
    } else {
      // Normal yaklaşma
      if (dist > 0) {
        fly.x += ((px - fx) / dist) * dashFlySpeed;
        fly.y += ((py - fy) / dist) * dashFlySpeed;
        // Dash sinek canvas dışına çıkmasın
        fly.x = Math.max(0, Math.min(fly.x, canvas.width - dashFlySize));
        fly.y = Math.max(0, Math.min(fly.y, canvas.height - dashFlySize));
      }
    }
  } else if (fly.state === 'charging') {
    if (now - fly.chargeStart > dashFlyChargeTime) {
      // Dash başlat
      fly.state = 'dashing';
      fly.dashStart = now;
      const dx = px - fx;
      const dy = py - fy;
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      fly.vx = (dx / d) * dashFlyDashSpeed;
      fly.vy = (dy / d) * dashFlyDashSpeed;
    }
  } else if (fly.state === 'dashing') {
    fly.x += fly.vx;
    fly.y += fly.vy;
    // Dash sinek canvas dışına çıkmasın
    fly.x = Math.max(0, Math.min(fly.x, canvas.width - dashFlySize));
    fly.y = Math.max(0, Math.min(fly.y, canvas.height - dashFlySize));
    if (now - fly.dashStart > dashFlyDashTime) {
      fly.state = 'normal';
      fly.vx = 0;
      fly.vy = 0;
    }
  }
}

function updateAttacks() {
  const now = Date.now();
  // Saldırı animasyonu için süre kontrolü
  attacks = attacks.filter(atk => now - atk.created < attackDuration);
}

function getAttackRadius() {
  let base = baseAttackRadius;
  if (tongueLevel > 1) base += (tongueLevel - 1) * 20;
  if (upgrades.tongue) base += 20; // geçici güçlendirme
  return base;
}

function attack() {
  const now = Date.now();
  if (now - lastAttackTime < attackCooldown) return;
  lastAttackTime = now;
  let radius = getAttackRadius();
  let atkX = player.x + player.width / 2;
  let atkY = player.y + player.height / 2;
  attacks.push({ x: atkX, y: atkY, radius, created: now });
}

function checkCollisions() {
  // Boss'a mermi ile çarpışma
  if (boss) {
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const bx = boss.x + bossSize/2;
      const by = boss.y + bossSize/2;
      const dist = Math.sqrt((bx - b.x) ** 2 + (by - b.y) ** 2);
      if (dist < bossSize/2 + bulletSize/2) {
        let dmg = 1 + strengthLevel + dmgValue;
        boss.hp -= dmg;
        addDamageText('boss', null, '-' + dmg);
        bullets.splice(j, 1);
        if (boss.hp <= 0) {
          boss = null;
          inBossFight = false;
          nextBossTime = Date.now() + 120000; // Sonraki boss 2 dakika sonra
          score += 5;
        }
        break;
      }
    }
    return;
  }
  // Sinek ve tanklara mermi ile çarpışma
  for (let i = flies.length - 1; i >= 0; i--) {
    const fly = flies[i];
    let centerX, centerY, radius;
    if (fly.type === 'dash') {
      centerX = fly.x + dashFlySize/2;
      centerY = fly.y + dashFlySize/2;
      radius = dashFlySize/2;
    } else if (fly.type === 'tank') {
      centerX = fly.x + tankFlySize/2;
      centerY = fly.y + tankFlySize/2;
      radius = tankFlySize/2;
    } else {
      centerX = fly.x + flySize/2;
      centerY = fly.y + flySize/2;
      radius = flySize/2;
    }
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dist = Math.sqrt((centerX - b.x) ** 2 + (centerY - b.y) ** 2);
      if (dist < radius + bulletSize/2) {
        let dmg = 1 + strengthLevel + dmgValue;
        fly.hp -= dmg;
        addDamageText('fly', fly.id, '-' + dmg);
        bullets.splice(j, 1);
        if (fly.hp <= 0) {
          // Sinek baştaki canı kadar gold düşürsün
          for (let g = 0; g < fly.maxHp; g++) {
            golds.push({ x: fly.x, y: fly.y });
          }
          flies.splice(i, 1);
          score++;
          killCount++;
          if (killCount >= ultimateKillRequirement) {
            ultimateReady = true;
          }
          try { teemoAudio.currentTime = 0; teemoAudio.play(); } catch(e){}
        }
        break;
      }
    }
  }
  // Sinek ile karakter çarpışması
  for (let i = flies.length - 1; i >= 0; i--) {
    const fly = flies[i];
    let fx, fy, size;
    if (fly.type === 'dash') {
      fx = fly.x;
      fy = fly.y;
      size = dashFlySize;
    } else if (fly.type === 'tank') {
      fx = fly.x;
      fy = fly.y;
      size = tankFlySize;
    } else {
      fx = fly.x;
      fy = fly.y;
      size = flySize;
    }
    if (
      player.x < fx + size &&
      player.x + player.width > fx &&
      player.y < fy + size &&
      player.y + player.height > fy
    ) {
      if (!upgrades.immune) {
        flies.splice(i, 1);
        try { teemoAudio.currentTime = 0; teemoAudio.play(); } catch(e){}
        player.lives--;
        if (player.lives <= 0) {
          try { atffiAudio.currentTime = 0; atffiAudio.play(); } catch(e){}
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
          }
          setTimeout(() => { alert('Oyun Bitti!'); window.location.reload(); }, 100);
        }
      }
    }
  }
  // Kalp ile karakter çarpışması
  if (heart) {
    if (
      player.x < heart.x + heartSize &&
      player.x + player.width > heart.x &&
      player.y < heart.y + heartSize &&
      player.y + player.height > heart.y &&
      player.lives < 3
    ) {
      player.lives = Math.min(player.lives + 1, 3);
      heart = null;
    }
  }
  // Gold ile karakter çarpışması
  for (let i = golds.length - 1; i >= 0; i--) {
    const g = golds[i];
    if (
      player.x < g.x + goldSize &&
      player.x + player.width > g.x &&
      player.y < g.y + goldSize &&
      player.y + player.height > g.y
    ) {
      golds.splice(i, 1);
      goldCount++;
    }
  }
}

function spawnHeart() {
  // Kalp haritada rastgele bir yere spawn olur
  const x = Math.random() * (canvas.width - heartSize);
  const y = Math.random() * (canvas.height - heartSize);
  heart = { x, y };
}

function setPaused(val) {
  paused = val;
  const menu = document.getElementById('pauseMenu');
  if (paused) {
    menu.style.display = 'flex';
  } else {
    menu.style.display = 'none';
    if (pauseFrame) {
      cancelAnimationFrame(pauseFrame);
      pauseFrame = null;
    }
    requestAnimationFrame(update);
  }
}

function updateMovement() {
  if (isFrozen) {
    player.dx = 0;
    player.dy = 0;
    return;
  }
  player.dx = 0;
  player.dy = 0;
  if (pressedKeys['ArrowRight'] || pressedKeys['d']) player.dx += player.speed;
  if (pressedKeys['ArrowLeft']  || pressedKeys['a']) player.dx -= player.speed;
  if (pressedKeys['ArrowUp']    || pressedKeys['w']) player.dy -= player.speed;
  if (pressedKeys['ArrowDown']  || pressedKeys['s']) player.dy += player.speed;
}

function update(timestamp) {
  if (paused) {
    pauseFrame = requestAnimationFrame(() => update(timestamp));
    return;
  }
  // Boss fight kontrolü (2 dakikada bir)
  if (!inBossFight && Date.now() >= nextBossTime) {
    flies.length = 0; // tüm sinekleri temizle
    while (flies.length > 0) flies.pop(); // kesin temizle
    spawnBoss();
  }
  // === YENİ: Zorluk artışı ===
  if (Date.now() - lastDifficultyIncrease > 30000) { // 30 saniyede bir
    fliesPerSpawn = Math.min(fliesPerSpawn + 1, maxFliesPerSpawn);
    flySpawnInterval = Math.max(flySpawnInterval - 100, 500); // spawn aralığı da azalsın
    lastDifficultyIncrease = Date.now();
  }
  clear();
  drawPlayer();
  drawFlies();
  drawHeart();
  drawGolds();
  drawLives();
  drawPowerBars();
  drawBoss();
  drawBossProjectiles();
  drawBullets();
  drawUltimateIndicator();
  updateMovement();
  newPos();
  updateFlies();
  updateAttacks();
  updateGolds();
  updateBoss();
  updateBullets();
  updateDamageTexts();
  checkCollisions();
  // Sinek spawn
  if (!inBossFight && (!lastFlySpawn || timestamp - lastFlySpawn > flySpawnInterval)) {
    for (let i = 0; i < fliesPerSpawn; i++) {
      spawnFly();
    }
    lastFlySpawn = timestamp;
    // Zorluk: spawn interval minimumu daha düşük
    flySpawnInterval = Math.max(flySpawnInterval - 1, 350);
  }
  // Kalp spawn
  if (!lastHeartSpawn || timestamp - lastHeartSpawn > heartSpawnInterval) {
    spawnHeart();
    lastHeartSpawn = timestamp;
  }
  // Güçlendirme süreleri
  if (upgrades.immune && Date.now() > immuneTimeout) upgrades.immune = false;
  if (upgrades.slow && Date.now() > slowTimeout) upgrades.slow = false;
  if (upgrades.tongue && Date.now() > tongueTimeout) upgrades.tongue = false;
  // === YENİ: Freeze kontrolü ===
  if (isFrozen && Date.now() > freezeTimeout) {
    isFrozen = false;
  }
  if (mouseDown) tryAutoFire();
  requestAnimationFrame(update);
}

function moveRight() { player.dx = player.speed; }
function moveLeft() { player.dx = -player.speed; }
function moveUp() { player.dy = -player.speed; }
function moveDown() { player.dy = player.speed; }
function stopX() { player.dx = 0; }
function stopY() { player.dy = 0; }

// === YENİ: Canvas tam ekran ayarı ===
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerPlayer();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Klavye kontrolleri
window.addEventListener('keydown', (e) => {
  pressedKeys[e.key] = true;
  if (e.key === 'Escape') {
    if (paused) setPaused(false);
    else setPaused(true);
    return;
  }
  if (paused) return;
  if (e.key === 'ArrowRight' || e.key === 'd') lastDirection = 'right';
  if (e.key === 'ArrowLeft'  || e.key === 'a') lastDirection = 'left';
  if (e.key === 'ArrowUp'    || e.key === 'w') lastDirection = 'up';
  if (e.key === 'ArrowDown'  || e.key === 's') lastDirection = 'down';
  if (e.code === 'Space') attack();
  if ((e.key === 'e' || e.key === 'E') && upgrades.immuneBought) {
    const now = Date.now();
    if (immuneCooldown <= now) {
      upgrades.immune = true;
      immuneTimeout = now + immuneSkillDuration;
      immuneCooldown = now + immuneCooldownTime;
    }
  }
  if ((e.key === 'r' || e.key === 'R') && upgrades.slowBought) {
    const now = Date.now();
    if (slowCooldown <= now) {
      upgrades.slow = true;
      slowTimeout = now + slowSkillDuration;
      slowCooldown = now + slowCooldownTime;
    }
  }
  // === YENİ: Ultimate skill aktivasyonu ===
  if ((e.key === 'f' || e.key === 'F') && ultimateReady) {
    // Tüm sinekleri öldür
    for (const fly of flies) {
      // Her sinek için gold düşür
      for (let g = 0; g < fly.maxHp; g++) {
        golds.push({ x: fly.x, y: fly.y });
      }
      score++;
      try { teemoAudio.currentTime = 0; teemoAudio.play(); } catch(e){}
    }
    flies.length = 0;
    killCount = 0;
    ultimateReady = false;
  }
});
window.addEventListener('keyup', (e) => {
  pressedKeys[e.key] = false;
});

// GÜÇLENDİRME BUTONLARI
function buyUpgrade(type) {
  if (type === 'atkspeed') {
    if (goldCount < atkspeedCost || atkspeedLevel >= maxAtkspeedLevel) return;
    goldCount -= atkspeedCost;
    atkspeedLevel++;
    atkspeedCost += atkspeedCostIncrease;
    document.getElementById('atkspeed-level').textContent = atkspeedLevel;
    document.getElementById('btn-atkspeed').innerHTML = `Attack Speed (${atkspeedCost} altın) - Seviye: <span id="atkspeed-level">${atkspeedLevel}</span>/10`;
    if (atkspeedLevel >= maxAtkspeedLevel) {
      document.getElementById('btn-atkspeed').disabled = true;
    }
  }
  if (type === 'dmg') {
    if (goldCount < dmgCost) return;
    goldCount -= dmgCost;
    dmgLevel++;
    dmgValue = dmgLevel * dmgPerLevel;
    dmgCost += dmgCostIncrease;
    document.getElementById('dmg-level').textContent = dmgLevel;
    document.getElementById('dmg-cost').textContent = dmgCost;
  }
  if (type === 'magnet') {
    if (goldCount < 10 || magnetLevel >= maxMagnetLevel) return;
    goldCount -= 10;
    magnetLevel++;
    document.getElementById('magnet-level').textContent = magnetLevel;
    if (magnetLevel >= maxMagnetLevel) {
      document.getElementById('btn-magnet').disabled = true;
    }
  }
  if (type === 'immune') {
    if (goldCount < 10 || upgrades.immuneBought) return;
    goldCount -= 10;
    upgrades.immuneBought = true;
    document.getElementById('btn-immune').disabled = true;
  }
  if (type === 'slow') {
    if (goldCount < 10 || upgrades.slowBought) return;
    goldCount -= 10;
    upgrades.slowBought = true;
    document.getElementById('btn-slow').disabled = true;
  }
}
document.getElementById('btn-magnet').onclick = () => buyUpgrade('magnet');
document.getElementById('btn-atkspeed').onclick = () => buyUpgrade('atkspeed');
document.getElementById('btn-dmg').onclick = () => buyUpgrade('dmg');

// Saldırı menzili ve sinek hızı güçlendirmelere göre ayarlanacak
// attackLength ve flySpeed fonksiyonel hale getiriliyor
function getAttackLength() {
  return upgrades.tongue ? 120 : attackLength;
}
function getFlySpeed() {
  if (upgrades.slow && Date.now() < slowTimeout) return flySpeed * 0.5;
  return flySpeed;
}

document.getElementById('btn-resume').onclick = () => setPaused(false);
document.getElementById('btn-restart').onclick = () => window.location.reload();

// Bar çizimi
function drawPowerBars() {
  const now = Date.now();
  let y = 120;
  if (isFrozen) {
    ctx.save();
    ctx.fillStyle = '#2196f3';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(20, y, 200, 18);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#1565c0';
    ctx.strokeRect(20, y, 200, 18);
    ctx.fillStyle = '#1565c0';
    ctx.font = '16px Arial';
    ctx.fillText('Donduruldun!', 25, y + 14);
    ctx.restore();
    y += 30;
  }
  if (upgrades.immune && immuneTimeout > now) {
    const pct = (immuneTimeout - now) / 2000;
    ctx.save();
    ctx.fillStyle = '#00bcd4';
    ctx.fillRect(20, y, 200 * pct, 18);
    ctx.strokeStyle = '#006064';
    ctx.strokeRect(20, y, 200, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Immune', 25, y + 14);
    ctx.restore();
    y += 30;
  }
  if (upgrades.slow && slowTimeout > now) {
    const pct = (slowTimeout - now) / 3000;
    ctx.save();
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(20, y, 200 * pct, 18);
    ctx.strokeStyle = '#b26a00';
    ctx.strokeRect(20, y, 200, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Zamanı Yavaşlat', 25, y + 14);
    ctx.restore();
    y += 30;
  }
  drawPowerStatus(y);
}

function drawPowerStatus(y) {
  // Sol üstte kutucuklar
  const now = Date.now();
  let boxY = y + 10;
  let boxX = 20;
  ctx.save();
  ctx.font = '15px Arial';
  if (upgrades.immuneBought) {
    ctx.fillStyle = '#00bcd4';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(boxX, boxY, 180, 32);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#006064';
    ctx.strokeRect(boxX, boxY, 180, 32);
    ctx.fillStyle = '#006064';
    ctx.fillText('E: Immune', boxX + 8, boxY + 20);
    if (immuneCooldown > now) {
      ctx.fillStyle = '#b71c1c';
      ctx.fillText('Bekleme: ' + ((immuneCooldown - now) / 1000).toFixed(1) + ' sn', boxX + 100, boxY + 20);
    } else {
      ctx.fillStyle = '#388e3c';
      ctx.fillText('Hazır', boxX + 120, boxY + 20);
    }
    boxY += 42;
  }
  if (upgrades.slowBought) {
    ctx.fillStyle = '#ff9800';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(boxX, boxY, 180, 32);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#b26a00';
    ctx.strokeRect(boxX, boxY, 180, 32);
    ctx.fillStyle = '#b26a00';
    ctx.fillText('R: Zamanı Yavaşlat', boxX + 8, boxY + 20);
    if (slowCooldown > now) {
      ctx.fillStyle = '#b71c1c';
      ctx.fillText('Bekleme: ' + ((slowCooldown - now) / 1000).toFixed(1) + ' sn', boxX + 100, boxY + 20);
    } else {
      ctx.fillStyle = '#388e3c';
      ctx.fillText('Hazır', boxX + 120, boxY + 20);
    }
    boxY += 42;
  }
  ctx.restore();
}

// === YENİ: Ultimate skill göstergesi ===
function drawUltimateIndicator() {
  ctx.save();
  const boxX = 20;
  const boxY = canvas.height - 60;
  const boxWidth = 280; // Kutuyu genişlettim
  
  // Arka plan
  ctx.fillStyle = ultimateReady ? '#4caf50' : '#9e9e9e';
  ctx.globalAlpha = 0.15;
  ctx.fillRect(boxX, boxY, boxWidth, 40);
  ctx.globalAlpha = 1;
  
  // Çerçeve
  ctx.strokeStyle = ultimateReady ? '#2e7d32' : '#616161';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxWidth, 40);
  
  // Metin
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = ultimateReady ? '#2e7d32' : '#616161';
  ctx.textAlign = 'left';
  ctx.fillText('F: Tüm Sinekleri Öldür', boxX + 10, boxY + 25);
  
  // Sayaç
  ctx.textAlign = 'right';
  ctx.fillText(`${killCount}/${ultimateKillRequirement}`, boxX + boxWidth - 10, boxY + 25);
  
  ctx.restore();
}

// Oyun başında butonları enable et
window.onload = function() {
  document.getElementById('btn-atkspeed').disabled = atkspeedLevel >= maxAtkspeedLevel;
  document.getElementById('atkspeed-level').textContent = atkspeedLevel;
  document.getElementById('btn-atkspeed').innerHTML = `Attack Speed (${atkspeedCost} altın) - Seviye: <span id="atkspeed-level">${atkspeedLevel}</span>/10`;
  document.getElementById('dmg-level').textContent = dmgLevel;
  document.getElementById('dmg-cost').textContent = dmgCost;
  document.getElementById('btn-magnet').disabled = magnetLevel >= maxMagnetLevel;
  document.getElementById('magnet-level').textContent = magnetLevel;
  document.getElementById('multishot-level').textContent = multishotLevel;
  document.getElementById('btn-multishot').innerHTML = `Atış Sayısı (${multishotCost} altın) - Seviye: <span id="multishot-level">${multishotLevel}</span>/5`;
  document.getElementById('movespeed-level').textContent = movespeedLevel;
  document.getElementById('btn-movespeed').innerHTML = `Movement Speed (${movespeedCost} altın) - Seviye: <span id="movespeed-level">${movespeedLevel}</span>/5`;
  setPaused(false);
};

// Gold çekme davranışı
function updateGolds() {
  if (magnetLevel === 0) return;
  let px = player.x + player.width/2;
  let py = player.y + player.height/2;
  for (const g of golds) {
    let gx = g.x + goldSize/2;
    let gy = g.y + goldSize/2;
    let dist = Math.sqrt((gx - px) ** 2 + (gy - py) ** 2);
    // Son seviye: her şeyi çek
    if (magnetLevel >= maxMagnetLevel || dist < magnetRadius[magnetLevel]) {
      const pull = 16 + magnetLevel * 3;
      g.x += ((px - gx) / dist) * pull;
      g.y += ((py - gy) / dist) * pull;
    }
  }
}

function spawnBoss() {
  bossCount++;
  bossAttackCount = 0;
  boss = {
    x: Math.random() * (canvas.width - bossSize),
    y: 60,
    hp: getBossHp(),
    maxHp: getBossHp()
  };
  bossProjectiles = [];
  bossLastAttack = Date.now();
  inBossFight = true;
  nextBossTime = Date.now() + 120000; // Sonraki boss 2 dakika sonra
}

function drawBoss() {
  if (!boss) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(boss.x + bossSize/2, boss.y + bossSize/2, bossSize/2, 0, Math.PI * 2);
  ctx.fillStyle = bossColor;
  ctx.shadowColor = bossColor;
  ctx.shadowBlur = 32;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  // HP bar
  ctx.fillStyle = '#fff';
  ctx.fillRect(boss.x, boss.y - 18, bossSize, 12);
  ctx.fillStyle = '#c51162';
  ctx.fillRect(boss.x, boss.y - 18, bossSize * (boss.hp / boss.maxHp), 12);
  ctx.strokeStyle = '#333';
  ctx.strokeRect(boss.x, boss.y - 18, bossSize, 12);
  // HP text
  ctx.fillStyle = '#222';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(boss.hp, boss.x + bossSize/2, boss.y - 4);
  ctx.restore();
  // === YENİ: Boss üstünde damage text çiz ===
  for (const dt of damageTexts) {
    if (dt.type === 'boss') {
      const alpha = Math.max(0, 1 - (Date.now() - dt.created) / damageTextDuration);
      ctx.save();
      ctx.globalAlpha = 0.5 * alpha;
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#f44336';
      ctx.textAlign = 'center';
      ctx.fillText(dt.value, boss.x + bossSize/2, boss.y - 16);
      ctx.restore();
    }
  }
}

function drawBossProjectiles() {
  for (const p of bossProjectiles) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, bossProjectileSize/2, 0, Math.PI * 2);
    ctx.fillStyle = p.special ? bossSpecialProjectileColor : bossProjectileColor;
    ctx.shadowColor = p.special ? bossSpecialProjectileColor : bossProjectileColor;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }
}

function updateBoss() {
  if (!boss) return;
  // Boss hareketi: yavaşça sağa-sola
  boss.x += Math.sin(Date.now() / 800) * 2;
  // Boss canvas dışına çıkmasın
  boss.x = Math.max(0, Math.min(boss.x, canvas.width - bossSize));
  // Boss saldırısı
  const now = Date.now();
  if (now - bossLastAttack > bossAttackInterval) {
    bossLastAttack = now;
    bossAttackCount++;
    // Karaktere doğru mermi fırlat
    const px = player.x + player.width/2;
    const py = player.y + player.height/2;
    const bx = boss.x + bossSize/2;
    const by = boss.y + bossSize/2;
    const dx = px - bx;
    const dy = py - by;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    // Her 4. atışta bir özel mermi at
    if (bossAttackCount % 4 === 0) {
      bossProjectiles.push({
        x: bx,
        y: by,
        vx: (dx / dist) * getBossProjectileSpeed(),
        vy: (dy / dist) * getBossProjectileSpeed(),
        special: true
      });
    } else {
      bossProjectiles.push({
        x: bx,
        y: by,
        vx: (dx / dist) * getBossProjectileSpeed(),
        vy: (dy / dist) * getBossProjectileSpeed(),
        special: false
      });
    }
  }
  // Mermileri güncelle
  for (const p of bossProjectiles) {
    p.x += p.vx;
    p.y += p.vy;
  }
  // Mermiler karaktere çarparsa can azalt
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const p = bossProjectiles[i];
    if (
      player.x < p.x + bossProjectileSize/2 &&
      player.x + player.width > p.x - bossProjectileSize/2 &&
      player.y < p.y + bossProjectileSize/2 &&
      player.y + player.height > p.y - bossProjectileSize/2
    ) {
      bossProjectiles.splice(i, 1);
      if (!upgrades.immune) {
        player.lives--;
        // Sadece özel mermi dondurur
        if (p.special) {
          isFrozen = true;
          freezeTimeout = Date.now() + freezeDuration;
        }
        if (player.lives <= 0) {
          try { atffiAudio.currentTime = 0; atffiAudio.play(); } catch(e){}
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
          }
          setTimeout(() => { alert('Oyun Bitti!'); window.location.reload(); }, 100);
        }
      }
    }
    // Mermi ekran dışına çıkarsa sil
    else if (
      p.x < -30 || p.x > canvas.width + 30 ||
      p.y < -30 || p.y > canvas.height + 30
    ) {
      bossProjectiles.splice(i, 1);
    }
  }
}

function drawBullets() {
  for (const b of bullets) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, bulletSize/2, 0, Math.PI * 2);
    ctx.fillStyle = bulletColor;
    ctx.shadowColor = bulletColor;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

function updateBullets() {
  for (const b of bullets) {
    b.x += b.vx;
    b.y += b.vy;
  }
  // Canvas dışına çıkan mermileri sil
  bullets = bullets.filter(b =>
    b.x > -30 && b.x < canvas.width + 30 &&
    b.y > -30 && b.y < canvas.height + 30
  );
}

// === YENİ: Multi-Shot güçlendirme butonu ===
document.getElementById('btn-multishot').onclick = () => {
  if (goldCount >= multishotCost && multishotLevel < maxMultishotLevel) {
    goldCount -= multishotCost;
    multishotLevel++;
    multishotCost = Math.floor(multishotCost * 1.8);
    document.getElementById('multishot-level').textContent = multishotLevel;
    document.getElementById('btn-multishot').innerHTML = `Atış Sayısı (${multishotCost} altın) - Seviye: <span id="multishot-level">${multishotLevel}</span>/5`;
    if (multishotLevel >= maxMultishotLevel) {
      document.getElementById('btn-multishot').disabled = true;
    }
  }
};

// === YENİ: Otomatik ateş fonksiyonu ===
function tryAutoFire() {
  if (
    paused || (inBossFight && !boss) ||
    lastMouseX === null || lastMouseY === null
  ) return;
  const now = Date.now();
  if (now - lastShotTime < atkspeedCooldowns[atkspeedLevel]) return;
  lastShotTime = now;
  const px = player.x + player.width/2;
  const py = player.y + player.height/2;
  const dx = lastMouseX - px;
  const dy = lastMouseY - py;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
  const baseAngle = Math.atan2(dy, dx);
  const spread = 0.18;
  for (let i = 0; i < multishotLevel; i++) {
    let angle = baseAngle + (i - (multishotLevel - 1) / 2) * spread;
    bullets.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * bulletSpeed,
      vy: Math.sin(angle) * bulletSpeed
    });
  }
}

// === YENİ: Mouse eventleri ===
canvas.addEventListener('mousedown', (e) => {
  mouseDown = true;
  const rect = canvas.getBoundingClientRect();
  lastMouseX = e.clientX - rect.left;
  lastMouseY = e.clientY - rect.top;
  tryAutoFire();
});
canvas.addEventListener('mouseup', () => {
  mouseDown = false;
});
canvas.addEventListener('mousemove', (e) => {
  if (mouseDown) {
    const rect = canvas.getBoundingClientRect();
    lastMouseX = e.clientX - rect.left;
    lastMouseY = e.clientY - rect.top;
  }
});

// === YENİ: Movement Speed butonu ===
document.getElementById('btn-movespeed').onclick = () => {
  if (goldCount >= movespeedCost && movespeedLevel < maxMovespeedLevel) {
    goldCount -= movespeedCost;
    movespeedLevel++;
    player.speed = 2.0 + (movespeedLevel - 1) * movespeedPerLevel;
    movespeedCost += movespeedCostIncrease;
    document.getElementById('movespeed-level').textContent = movespeedLevel;
    document.getElementById('btn-movespeed').innerHTML = `Movement Speed (${movespeedCost} altın) - Seviye: <span id="movespeed-level">${movespeedLevel}</span>/5`;
    if (movespeedLevel >= maxMovespeedLevel) {
      document.getElementById('btn-movespeed').disabled = true;
    }
  }
};

// === YENİ: Damage text ekleme ===
function addDamageText(type, id, value) {
  damageTexts.push({ type, id, value, created: Date.now() });
}

// === YENİ: Damage text temizleme ===
function updateDamageTexts() {
  const now = Date.now();
  damageTexts = damageTexts.filter(dt => now - dt.created < damageTextDuration);
}

// === YENİ: Boss güçlendirme fonksiyonu ===
function getBossHp() {
  return bossBaseHp + bossCount * 40; // Her boss gelişinde +40 can
}
function getBossProjectileSpeed() {
  return bossBaseProjectileSpeed + bossCount * 0.7; // Her boss gelişinde mermi hızı artar
}

requestAnimationFrame(update); 