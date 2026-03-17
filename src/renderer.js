// ============================================
// BATTLE CITY - Rendering System (8-bit Retro + Glow)
// ============================================
import {
  TILE, TILE_SIZE, GRID_COLS, GRID_ROWS, DIR, COLORS,
  CANVAS_WIDTH, CANVAS_HEIGHT,
  PARTICLE_COUNT, PARTICLE_SPEED, PARTICLE_LIFE,
  SCREEN_SHAKE_DURATION, SCREEN_SHAKE_MAGNITUDE,
  SPAWN_ANIM_DURATION,
  ENEMIES_PER_LEVEL,
} from './constants';

// ---- Particle System ----
const particles = [];

export function spawnParticles(cx, cy) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * PARTICLE_SPEED * (0.5 + Math.random()),
      vy: Math.sin(angle) * PARTICLE_SPEED * (0.5 + Math.random()),
      life: PARTICLE_LIFE,
      maxLife: PARTICLE_LIFE,
      color: Math.random() > 0.5 ? '#FFD700' : '#FF4500',
    });
  }
}

function updateAndDrawParticles(ctx) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    const alpha = p.life / p.maxLife;
    const size = 2 + 2 * alpha;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    ctx.restore();
  }
}

// ---- Screen Shake ----
let shakeFrames = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;

export function triggerScreenShake() {
  shakeFrames = SCREEN_SHAKE_DURATION;
}

function applyScreenShake(ctx) {
  if (shakeFrames > 0) {
    shakeFrames--;
    shakeOffsetX = (Math.random() - 0.5) * SCREEN_SHAKE_MAGNITUDE * 2;
    shakeOffsetY = (Math.random() - 0.5) * SCREEN_SHAKE_MAGNITUDE * 2;
    ctx.translate(shakeOffsetX, shakeOffsetY);
  } else {
    shakeOffsetX = 0;
    shakeOffsetY = 0;
  }
}

// ---- Background grid ----
function drawBackground(ctx) {
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(30, 30, 60, 0.4)';
  ctx.lineWidth = 0.5;
  const spacing = TILE_SIZE;
  for (let x = 0; x <= CANVAS_WIDTH; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

// ---- Scanline + Vignette overlay ----
function drawScanlines(ctx) {
  ctx.save();
  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
    ctx.fillRect(0, y, CANVAS_WIDTH, 1);
  }
  ctx.restore();
}

function drawVignette(ctx) {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const radius = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.7;
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/**
 * Draw the entire game frame
 */
export function draw(ctx, gameState) {
  const { grid, player, enemies, bullets, explosions, powerUps } = gameState;

  ctx.save();
  applyScreenShake(ctx);

  // Background with grid instead of pure black
  drawBackground(ctx);

  // Draw tiles (except grass - drawn later on top)
  drawTiles(ctx, grid, false);

  // Draw power-ups
  drawPowerUps(ctx, powerUps);

  // Draw spawn animations for enemies
  for (const enemy of enemies) {
    if (enemy.alive && enemy.spawnAnimTimer > 0) {
      drawSpawnAnimation(ctx, enemy);
    }
  }

  // Draw player
  if (player.alive) {
    if (player.spawnAnimTimer > 0) {
      drawSpawnAnimation(ctx, player);
    } else {
      drawTank(ctx, player);
    }
  }

  // Draw enemies (skip those still in spawn anim)
  for (const enemy of enemies) {
    if (enemy.alive && (!enemy.spawnAnimTimer || enemy.spawnAnimTimer <= 0)) {
      drawTank(ctx, enemy);
    }
  }

  // Draw bullets
  for (const bullet of bullets) {
    if (bullet.alive) drawBullet(ctx, bullet);
  }

  // Draw grass on top (tanks hide under grass)
  drawTiles(ctx, grid, true);

  // Draw explosions
  for (const exp of explosions) {
    if (exp.alive) drawExplosion(ctx, exp);
  }

  // Particles
  updateAndDrawParticles(ctx);

  // Player shield effect
  if (player.alive && (player.shielded || player.spawnTimer > 0)) {
    drawShield(ctx, player);
  }

  // Overlays
  drawScanlines(ctx);
  drawVignette(ctx);

  ctx.restore();
}

/**
 * Draw spawn animation (flashing/materializing effect)
 */
function drawSpawnAnimation(ctx, tank) {
  const progress = 1 - (tank.spawnAnimTimer / SPAWN_ANIM_DURATION);
  const flash = Math.floor(tank.spawnAnimTimer / 4) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = flash ? 0.7 : 0.2;

  // Rotating cross pattern
  const cx = tank.x + tank.size / 2;
  const cy = tank.y + tank.size / 2;
  const size = tank.size * (0.3 + progress * 0.7);

  ctx.strokeStyle = tank.isPlayer ? '#FFD700' : '#FF4444';
  ctx.lineWidth = 2;
  ctx.shadowColor = tank.isPlayer ? '#FFD700' : '#FF4444';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.moveTo(cx - size / 2, cy);
  ctx.lineTo(cx + size / 2, cy);
  ctx.moveTo(cx, cy - size / 2);
  ctx.lineTo(cx, cy + size / 2);
  ctx.stroke();

  // Diamond outline
  ctx.beginPath();
  ctx.moveTo(cx, cy - size / 2);
  ctx.lineTo(cx + size / 2, cy);
  ctx.lineTo(cx, cy + size / 2);
  ctx.lineTo(cx - size / 2, cy);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw map tiles
 * grassOnly: true = only grass, false = everything except grass
 */
function drawTiles(ctx, grid, grassOnly) {
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const tile = grid[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      if (grassOnly) {
        if (tile === TILE.GRASS) drawGrass(ctx, x, y);
        continue;
      }

      switch (tile) {
        case TILE.BRICK: drawBrick(ctx, x, y); break;
        case TILE.STEEL: drawSteel(ctx, x, y); break;
        case TILE.WATER: drawWater(ctx, x, y); break;
        case TILE.BASE: drawBase(ctx, x, y); break;
        default: break;
      }
    }
  }
}

function drawBrick(ctx, x, y) {
  const s = TILE_SIZE;
  ctx.fillStyle = COLORS.BRICK;
  ctx.fillRect(x, y, s, s);
  // Brick pattern
  ctx.fillStyle = COLORS.BRICK_LIGHT;
  ctx.fillRect(x, y, s / 2, s / 4);
  ctx.fillRect(x + s / 2, y + s / 4, s / 2, s / 4);
  ctx.fillRect(x, y + s / 2, s / 2, s / 4);
  ctx.fillRect(x + s / 2, y + s * 3 / 4, s / 2, s / 4);
  // Grid lines
  ctx.strokeStyle = '#5C3317';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, s, s);
}

function drawSteel(ctx, x, y) {
  const s = TILE_SIZE;
  ctx.fillStyle = COLORS.STEEL;
  ctx.fillRect(x, y, s, s);
  // Steel pattern - rivets
  ctx.fillStyle = COLORS.STEEL_LIGHT;
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  ctx.fillStyle = COLORS.STEEL;
  ctx.fillRect(x + 4, y + 4, s - 8, s - 8);
  // Glow
  ctx.shadowColor = '#A9A9A9';
  ctx.shadowBlur = 3;
  ctx.fillStyle = COLORS.STEEL_LIGHT;
  ctx.fillRect(x + s / 4, y + s / 4, 3, 3);
  ctx.fillRect(x + s * 3 / 4 - 3, y + s / 4, 3, 3);
  ctx.fillRect(x + s / 4, y + s * 3 / 4 - 3, 3, 3);
  ctx.fillRect(x + s * 3 / 4 - 3, y + s * 3 / 4 - 3, 3, 3);
  ctx.shadowBlur = 0;
}

function drawGrass(ctx, x, y) {
  const s = TILE_SIZE;
  ctx.fillStyle = COLORS.GRASS;
  ctx.fillRect(x, y, s, s);
  // Grass texture
  ctx.fillStyle = COLORS.GRASS_LIGHT;
  for (let i = 0; i < 8; i++) {
    const gx = x + (i % 4) * (s / 4) + 2;
    const gy = y + Math.floor(i / 4) * (s / 2) + 4;
    ctx.fillRect(gx, gy, 2, 6);
  }
}

let waterFrame = 0;
function drawWater(ctx, x, y) {
  const s = TILE_SIZE;
  ctx.fillStyle = COLORS.WATER_DARK;
  ctx.fillRect(x, y, s, s);

  // Improved wave effect - multiple layers
  const time = waterFrame * 0.08;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const wx = x + col * (s / 4);
      const wy = y + row * (s / 4);
      const wave = Math.sin(time + col * 1.2 + row * 0.8) * 0.5 + 0.5;
      const r = 30;
      const g = Math.floor(100 + wave * 80);
      const b = Math.floor(200 + wave * 55);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(wx + 1, wy + 1, s / 4 - 2, s / 4 - 2);
    }
  }

  // Highlights
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  const hx = x + ((Math.sin(time * 0.7) + 1) * s / 3);
  const hy = y + ((Math.cos(time * 0.5) + 1) * s / 4);
  ctx.fillRect(hx, hy, 4, 2);
}

export function tickWaterAnimation() {
  waterFrame++;
}

function drawBase(ctx, x, y) {
  const s = TILE_SIZE;
  // Eagle/flag
  ctx.fillStyle = COLORS.BASE;
  ctx.shadowColor = COLORS.GLOW_PLAYER;
  ctx.shadowBlur = 8;
  ctx.fillRect(x + 4, y + 4, s - 8, s - 8);
  ctx.shadowBlur = 0;
  // Flag detail
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(x + s / 2 - 2, y + 6, 4, s - 12);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(x + s / 2 + 2, y + 8, 8, 6);
}

/**
 * Draw a tank with 8-bit retro style + glow
 */
function drawTank(ctx, tank) {
  const { x, y, size, dir, isPlayer, type } = tank;
  const s = size;

  ctx.save();

  // Glow effect
  ctx.shadowColor = isPlayer ? COLORS.GLOW_PLAYER : COLORS.GLOW_ENEMY;
  ctx.shadowBlur = 10;

  // Body color
  if (isPlayer) {
    ctx.fillStyle = COLORS.PLAYER;
  } else {
    switch (type) {
      case 'fast': ctx.fillStyle = COLORS.ENEMY_FAST; break;
      case 'armor': ctx.fillStyle = COLORS.ENEMY_ARMOR; break;
      default: ctx.fillStyle = COLORS.ENEMY_BASIC; break;
    }
  }

  // Tank body
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4);

  // Darker inner body
  ctx.shadowBlur = 0;
  const bodyColor = isPlayer ? COLORS.PLAYER_BODY : (type === 'fast' ? '#CC3300' : type === 'armor' ? '#660000' : '#999999');
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 6, y + 6, s - 12, s - 12);

  // Treads
  ctx.fillStyle = '#333333';
  if (dir === DIR.UP || dir === DIR.DOWN) {
    // Left tread
    ctx.fillRect(x, y + 2, 4, s - 4);
    // Right tread
    ctx.fillRect(x + s - 4, y + 2, 4, s - 4);
    // Tread marks
    ctx.fillStyle = '#555555';
    const treadOffset = (tank.animFrame || 0) % 8;
    for (let i = 0; i < 4; i++) {
      const ty = y + 4 + i * 7 + (dir === DIR.UP ? treadOffset : -treadOffset + 8) % 8;
      if (ty > y + 2 && ty < y + s - 4) {
        ctx.fillRect(x, ty, 4, 2);
        ctx.fillRect(x + s - 4, ty, 4, 2);
      }
    }
  } else {
    // Top tread
    ctx.fillRect(x + 2, y, s - 4, 4);
    // Bottom tread
    ctx.fillRect(x + 2, y + s - 4, s - 4, 4);
    ctx.fillStyle = '#555555';
    const treadOffset = (tank.animFrame || 0) % 8;
    for (let i = 0; i < 4; i++) {
      const tx = x + 4 + i * 7 + (dir === DIR.LEFT ? treadOffset : -treadOffset + 8) % 8;
      if (tx > x + 2 && tx < x + s - 4) {
        ctx.fillRect(tx, y, 2, 4);
        ctx.fillRect(tx, y + s - 4, 2, 4);
      }
    }
  }

  // Barrel
  ctx.fillStyle = isPlayer ? '#FFEC8B' : '#AAAAAA';
  const barrelW = 4;
  const barrelL = s / 2;
  switch (dir) {
    case DIR.UP:
      ctx.fillRect(x + s / 2 - barrelW / 2, y - 2, barrelW, barrelL);
      break;
    case DIR.DOWN:
      ctx.fillRect(x + s / 2 - barrelW / 2, y + s / 2, barrelW, barrelL + 2);
      break;
    case DIR.LEFT:
      ctx.fillRect(x - 2, y + s / 2 - barrelW / 2, barrelL, barrelW);
      break;
    case DIR.RIGHT:
      ctx.fillRect(x + s / 2, y + s / 2 - barrelW / 2, barrelL + 2, barrelW);
      break;
    default: break;
  }

  ctx.restore();
}

/**
 * Draw a bullet with glow
 */
function drawBullet(ctx, bullet) {
  ctx.save();
  ctx.shadowColor = COLORS.GLOW_BULLET;
  ctx.shadowBlur = 6;
  ctx.fillStyle = COLORS.BULLET;
  ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
  ctx.restore();
}

/**
 * Draw explosion animation
 */
function drawExplosion(ctx, exp) {
  const progress = exp.frame / exp.maxFrames;
  const radius = exp.size * (0.5 + progress);
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Outer glow
  ctx.shadowColor = '#FF4500';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FF6347';
  ctx.beginPath();
  ctx.arc(
    exp.x + exp.size / 2,
    exp.y + exp.size / 2,
    radius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Inner core
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(
    exp.x + exp.size / 2,
    exp.y + exp.size / 2,
    radius * 0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

/**
 * Draw shield around tank
 */
function drawShield(ctx, tank) {
  ctx.save();
  const time = Date.now() / 100;
  ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + 0.3 * Math.sin(time)})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#64C8FF';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(
    tank.x + tank.size / 2,
    tank.y + tank.size / 2,
    tank.size / 2 + 4,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw power-ups
 */
function drawPowerUps(ctx, powerUps) {
  for (const pu of powerUps) {
    if (!pu.alive) continue;
    pu.blinkTimer++;
    if (pu.blinkTimer % 20 < 10) continue; // Blink effect

    ctx.save();
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 10;

    const { x, y, size } = pu;
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.6}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = { STAR: '\u2605', SHIELD: 'S', BOMB: 'B', LIFE: '\u2665' };
    ctx.fillText(label[pu.type] || '?', x + size / 2, y + size / 2);

    ctx.restore();
  }
}

/**
 * Draw HUD (score, lives, level, kill icons, enemy progress bar)
 */
export function drawHUD(ctx, score, lives, level, enemiesLeft, enemiesKilled) {
  ctx.save();
  ctx.fillStyle = COLORS.HUD_BG;
  ctx.fillRect(CANVAS_WIDTH, 0, 160, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.font = 'bold 16px "Press Start 2P", monospace';
  ctx.textAlign = 'left';

  const x = CANVAS_WIDTH + 16;
  ctx.fillText('SCORE', x, 40);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`${score}`, x, 64);

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('LIVES', x, 110);
  ctx.fillStyle = '#FF4444';
  for (let i = 0; i < lives; i++) {
    ctx.fillText('\u2665', x + i * 24, 134);
  }

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('LEVEL', x, 180);
  ctx.fillStyle = '#00FF00';
  ctx.fillText(`${level + 1}`, x, 204);

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('ENEMY', x, 250);
  ctx.fillStyle = '#FF4500';
  ctx.fillText(`${enemiesLeft}`, x, 274);

  // Enemy progress bar
  const barX = x;
  const barY = 290;
  const barW = 128;
  const barH = 10;
  const killed = enemiesKilled || 0;
  const progress = Math.min(killed / ENEMIES_PER_LEVEL, 1);
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(barX, barY, barW * progress, barH);
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Kill icons (small tank silhouettes)
  ctx.fillStyle = '#888888';
  ctx.font = '10px monospace';
  ctx.fillText('KILLS', barX, barY + 24);
  const iconSize = 8;
  const iconsPerRow = 10;
  for (let i = 0; i < killed && i < ENEMIES_PER_LEVEL; i++) {
    const row = Math.floor(i / iconsPerRow);
    const col = i % iconsPerRow;
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(barX + col * (iconSize + 3), barY + 30 + row * (iconSize + 3), iconSize, iconSize);
  }

  // Controls hint
  ctx.fillStyle = '#888888';
  ctx.font = '10px monospace';
  ctx.fillText('WASD/Arrows', x, CANVAS_HEIGHT - 100);
  ctx.fillText('SPACE: Fire', x, CANVAS_HEIGHT - 80);
  ctx.fillText('ENTER: Start', x, CANVAS_HEIGHT - 60);
  ctx.fillText('M: Mute', x, CANVAS_HEIGHT - 40);

  ctx.restore();
}

/**
 * Draw menu screen
 */
export function drawMenu(ctx) {
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH + 160, CANVAS_HEIGHT);

  ctx.save();
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BATTLE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  ctx.fillText('CITY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  ctx.shadowBlur = 10;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px "Press Start 2P", monospace';
  ctx.fillText('MODERN EDITION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

  // Blinking "Press Enter"
  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.shadowColor = '#00FF00';
    ctx.fillStyle = '#00FF00';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  }

  // Tank art
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15;
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2 + 180;
  ctx.fillRect(cx - 16, cy - 20, 32, 32);
  ctx.fillRect(cx - 2, cy - 34, 4, 16);
  ctx.fillRect(cx - 20, cy - 18, 4, 28);
  ctx.fillRect(cx + 16, cy - 18, 4, 28);

  ctx.restore();
}

/**
 * Draw game over screen
 */
export function drawGameOver(ctx, score) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH + 160, CANVAS_HEIGHT);

  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FF0000';
  ctx.font = 'bold 48px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.fillText('OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px "Press Start 2P", monospace';
  ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);

  if (Math.floor(Date.now() / 500) % 2 === 0) {
    ctx.fillStyle = '#00FF00';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText('PRESS ENTER TO RETRY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130);
  }

  ctx.restore();
}

/**
 * Draw level complete screen
 */
export function drawLevelComplete(ctx, level, score) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH + 160, CANVAS_HEIGHT);

  ctx.shadowColor = '#00FF00';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#00FF00';
  ctx.font = 'bold 36px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL ${level + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  ctx.fillText('COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  ctx.fillStyle = '#FFD700';
  ctx.font = '18px "Press Start 2P", monospace';
  ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);

  ctx.restore();
}

/**
 * Draw stage intro screen ("STAGE X")
 */
export function drawStageIntro(ctx, level, timer) {
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, CANVAS_WIDTH + 160, CANVAS_HEIGHT);

  const alpha = Math.min(1, timer / 20); // Fade in
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 40px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`STAGE ${level + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Level name
  const names = [
    'Classic', 'Water Maze', 'Fortress', 'Labyrinth',
    'Islands', 'Steel Fortress', 'Grasslands', 'Final Battle',
  ];
  const name = names[level % names.length] || '';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px "Press Start 2P", monospace';
  ctx.fillText(name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  ctx.restore();
}
