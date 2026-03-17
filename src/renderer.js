// ============================================
// BATTLE CITY - Rendering System (Enhanced Pixel Art)
// ============================================
import {
  TILE, TILE_SIZE, GRID_COLS, GRID_ROWS, DIR, COLORS,
  CANVAS_WIDTH, CANVAS_HEIGHT, BASE_POS,
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

export function triggerScreenShake() {
  shakeFrames = SCREEN_SHAKE_DURATION;
}

function applyScreenShake(ctx) {
  if (shakeFrames > 0) {
    shakeFrames--;
    const shakeOffsetX = (Math.random() - 0.5) * SCREEN_SHAKE_MAGNITUDE * 2;
    const shakeOffsetY = (Math.random() - 0.5) * SCREEN_SHAKE_MAGNITUDE * 2;
    ctx.translate(shakeOffsetX, shakeOffsetY);
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
 * Draw the eagle sprite at the base position
 */
function drawEagle(ctx, x, y, destroyed) {
  const s = TILE_SIZE; // each cell is TILE_SIZE, eagle is 2x2
  ctx.save();

  if (destroyed) {
    // Destroyed eagle - gray broken version
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 4, y + 4, s * 2 - 8, s * 2 - 8);

    // Cracked lines
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + s, y + 6);
    ctx.lineTo(x + s - 4, y + s);
    ctx.lineTo(x + s + 6, y + s * 2 - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 8, y + s);
    ctx.lineTo(x + s + 2, y + s + 4);
    ctx.lineTo(x + s * 2 - 8, y + s - 2);
    ctx.stroke();

    // Rubble pieces
    ctx.fillStyle = '#444444';
    ctx.fillRect(x + 6, y + s * 2 - 12, 8, 6);
    ctx.fillRect(x + s * 2 - 16, y + s * 2 - 10, 10, 5);
    ctx.fillRect(x + s - 4, y + s * 2 - 8, 6, 4);
  } else {
    // Alive eagle - golden phoenix

    // Base pedestal
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x + 8, y + s * 2 - 12, s * 2 - 16, 10);
    ctx.fillStyle = '#A07818';
    ctx.fillRect(x + 12, y + s * 2 - 14, s * 2 - 24, 4);

    // Body center
    ctx.fillStyle = COLORS.EAGLE_BODY;
    ctx.fillRect(x + s - 8, y + s - 8, 16, 20);

    // Head
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.fillRect(x + s - 6, y + 8, 12, 12);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + s - 4, y + 12, 3, 3);
    ctx.fillRect(x + s + 1, y + 12, 3, 3);

    // Beak
    ctx.fillStyle = COLORS.EAGLE_BEAK;
    ctx.fillRect(x + s - 2, y + 18, 4, 4);

    // Left wing
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.fillRect(x + 6, y + s - 4, s - 14, 14);
    ctx.fillStyle = COLORS.EAGLE_BODY;
    ctx.fillRect(x + 6, y + s, s - 18, 6);
    // Wing tip feathers (left)
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.fillRect(x + 4, y + s - 2, 4, 10);
    ctx.fillRect(x + 2, y + s, 4, 6);

    // Right wing
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.fillRect(x + s + 8, y + s - 4, s - 14, 14);
    ctx.fillStyle = COLORS.EAGLE_BODY;
    ctx.fillRect(x + s + 12, y + s, s - 18, 6);
    // Wing tip feathers (right)
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.fillRect(x + s * 2 - 8, y + s - 2, 4, 10);
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.fillRect(x + s * 2 - 6, y + s, 4, 6);

    // Tail feathers
    ctx.fillStyle = COLORS.EAGLE_BODY;
    ctx.fillRect(x + s - 6, y + s + 12, 12, 8);
    ctx.fillStyle = COLORS.EAGLE_WING;
    ctx.fillRect(x + s - 8, y + s + 16, 4, 6);
    ctx.fillRect(x + s - 2, y + s + 18, 4, 6);
    ctx.fillRect(x + s + 4, y + s + 16, 4, 6);

    // Crown / crest on head
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(x + s - 4, y + 6, 2, 4);
    ctx.fillRect(x + s, y + 4, 2, 4);
    ctx.fillRect(x + s + 2, y + 6, 2, 4);

    // Glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.fillRect(x + 2, y + 2, s * 2 - 4, s * 2 - 4);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/**
 * Draw the entire game frame
 */
export function draw(ctx, gameState) {
  const { grid, player, enemies, bullets, explosions, powerUps, baseAlive } = gameState;

  ctx.save();
  applyScreenShake(ctx);

  drawBackground(ctx);

  // Draw tiles (except grass - drawn later on top)
  drawTiles(ctx, grid, false);

  // Draw eagle at base position (after tiles, before tanks)
  const eagleX = BASE_POS.col * TILE_SIZE;
  const eagleY = BASE_POS.row * TILE_SIZE;
  drawEagle(ctx, eagleX, eagleY, baseAlive === false);

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
 */
function drawTiles(ctx, grid, grassOnly) {
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const tile = grid[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      if (grassOnly) {
        if (tile === TILE.GRASS) drawGrass(ctx, x, y, col, row);
        continue;
      }

      switch (tile) {
        case TILE.BRICK: drawBrick(ctx, x, y, col, row); break;
        case TILE.STEEL: drawSteel(ctx, x, y); break;
        case TILE.WATER: drawWater(ctx, x, y, col, row); break;
        case TILE.BASE: drawBase(ctx, x, y); break;
        default: break;
      }
    }
  }
}

/**
 * Draw brick tile with realistic brick pattern
 */
function drawBrick(ctx, x, y, col, row) {
  const s = TILE_SIZE;

  // Background mortar color
  ctx.fillStyle = COLORS.BRICK_MORTAR;
  ctx.fillRect(x, y, s, s);

  // Brick dimensions: 4 columns, 4 rows with alternating offset
  const brickW = s / 4;
  const brickH = s / 4;
  const mortarGap = 1;

  // Seed for slight color variation per brick
  const seed = col * 31 + row * 17;

  for (let br = 0; br < 4; br++) {
    const offset = (br % 2 === 0) ? 0 : brickW / 2;
    for (let bc = 0; bc < 4; bc++) {
      let bx = x + bc * brickW + offset;
      let bw = brickW - mortarGap;

      // Clamp bricks that go past the tile
      if (bx + bw > x + s) {
        bw = x + s - bx;
      }
      if (bx < x) {
        bw -= (x - bx);
        bx = x;
      }
      if (bw <= 0) continue;

      const by = y + br * brickH;
      const bh = brickH - mortarGap;

      // Slight color variation
      const variation = ((seed + br * 7 + bc * 13) % 5) * 3;
      const r = 139 + variation;
      const g = 69 + Math.floor(variation * 0.5);
      const b = 19 + Math.floor(variation * 0.3);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(bx, by, bw, bh);

      // Lighter top edge
      ctx.fillStyle = COLORS.BRICK_LIGHT;
      ctx.fillRect(bx, by, bw, 1);

      // Darker bottom edge
      ctx.fillStyle = COLORS.BRICK_DARK;
      ctx.fillRect(bx, by + bh - 1, bw, 1);
    }
  }
}

/**
 * Draw steel tile with metallic appearance
 */
function drawSteel(ctx, x, y) {
  const s = TILE_SIZE;

  // Base steel
  ctx.fillStyle = COLORS.STEEL;
  ctx.fillRect(x, y, s, s);

  // Gradient effect (lighter top-left to darker bottom-right)
  ctx.fillStyle = COLORS.STEEL_LIGHT;
  ctx.fillRect(x + 1, y + 1, s - 2, s / 2 - 1);
  ctx.fillStyle = COLORS.STEEL_DARK;
  ctx.fillRect(x + 1, y + s / 2, s - 2, s / 2 - 1);

  // Inner panel
  ctx.fillStyle = COLORS.STEEL;
  ctx.fillRect(x + 3, y + 3, s - 6, s - 6);

  // Diamond plate cross-hatch pattern
  ctx.strokeStyle = 'rgba(180,180,180,0.3)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < s; i += 6) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + s, y + s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + i, y + s);
    ctx.lineTo(x + i + s, y);
    ctx.stroke();
  }

  // Corner rivets with highlight
  const rivetPositions = [
    [x + 4, y + 4],
    [x + s - 7, y + 4],
    [x + 4, y + s - 7],
    [x + s - 7, y + s - 7],
  ];
  for (const [rx, ry] of rivetPositions) {
    ctx.fillStyle = COLORS.STEEL_DARK;
    ctx.fillRect(rx, ry, 3, 3);
    ctx.fillStyle = COLORS.STEEL_HIGHLIGHT;
    ctx.fillRect(rx, ry, 1, 1);
  }

  // Metallic sheen highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x + 2, y + 2, s / 2 - 2, s / 3);
}

/**
 * Draw grass tile with lush vegetation
 */
function drawGrass(ctx, x, y, col, row) {
  const s = TILE_SIZE;

  // Base dark green
  ctx.fillStyle = COLORS.GRASS_DARK;
  ctx.fillRect(x, y, s, s);

  // Medium green fill
  ctx.fillStyle = COLORS.GRASS;
  ctx.fillRect(x + 1, y + 1, s - 2, s - 2);

  // Individual grass blades - pseudo-random based on position
  const seed = col * 37 + row * 23;
  for (let i = 0; i < 12; i++) {
    const hash = (seed + i * 47) % 100;
    const gx = x + (hash % 10) * (s / 10) + 1;
    const gy = y + Math.floor(hash / 10) * (s / 10) + 2;

    // Blade of grass (small triangle)
    const shade = (hash % 3);
    if (shade === 0) {
      ctx.fillStyle = COLORS.GRASS_LIGHT;
    } else if (shade === 1) {
      ctx.fillStyle = COLORS.GRASS_BLADE;
    } else {
      ctx.fillStyle = '#2AAA2A';
    }

    // Draw a tiny blade shape
    ctx.beginPath();
    ctx.moveTo(gx, gy + 5);
    ctx.lineTo(gx + 1, gy);
    ctx.lineTo(gx + 2, gy + 5);
    ctx.closePath();
    ctx.fill();
  }

  // A few lighter spots
  ctx.fillStyle = 'rgba(50, 205, 50, 0.3)';
  ctx.fillRect(x + 4, y + 4, 3, 2);
  ctx.fillRect(x + s - 10, y + s - 8, 3, 2);
}

/**
 * Draw water tile with animated waves
 */
let waterFrame = 0;
function drawWater(ctx, x, y, col, row) {
  const s = TILE_SIZE;

  // Deep blue base
  ctx.fillStyle = COLORS.WATER_DARK;
  ctx.fillRect(x, y, s, s);

  const time = waterFrame * 0.08;

  // Multiple layers of wave animation
  for (let wy = 0; wy < s; wy += 4) {
    for (let wx = 0; wx < s; wx += 4) {
      // Layer 1: slow large waves
      const wave1 = Math.sin(time * 0.6 + (x + wx) * 0.04 + (y + wy) * 0.03) * 0.5 + 0.5;
      // Layer 2: faster small waves
      const wave2 = Math.sin(time * 1.2 + (x + wx) * 0.08 - (y + wy) * 0.06) * 0.3 + 0.5;
      const combined = wave1 * 0.6 + wave2 * 0.4;

      const r = 20;
      const g = Math.floor(80 + combined * 100);
      const b = Math.floor(180 + combined * 75);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + wx, y + wy, 4, 4);
    }
  }

  // White foam/highlight spots that move
  ctx.fillStyle = COLORS.WATER_FOAM;
  const foamX1 = x + ((Math.sin(time * 0.7 + col) + 1) * s * 0.35);
  const foamY1 = y + ((Math.cos(time * 0.5 + row) + 1) * s * 0.3);
  ctx.fillRect(foamX1, foamY1, 5, 2);

  const foamX2 = x + ((Math.cos(time * 0.9 + col * 2) + 1) * s * 0.3);
  const foamY2 = y + ((Math.sin(time * 0.6 + row * 2) + 1) * s * 0.35);
  ctx.fillRect(foamX2, foamY2, 3, 2);

  // Shimmer highlight
  const shimmer = Math.sin(time * 2 + col * 1.5 + row * 1.3) * 0.5 + 0.5;
  if (shimmer > 0.7) {
    ctx.fillStyle = `rgba(255,255,255,${(shimmer - 0.7) * 0.5})`;
    ctx.fillRect(x + s / 2 - 1, y + s / 3, 2, 1);
  }
}

export function tickWaterAnimation() {
  waterFrame++;
}

function drawBase(ctx, x, y) {
  const s = TILE_SIZE;
  ctx.fillStyle = COLORS.BASE;
  ctx.shadowColor = COLORS.GLOW_PLAYER;
  ctx.shadowBlur = 8;
  ctx.fillRect(x + 4, y + 4, s - 8, s - 8);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(x + s / 2 - 2, y + 6, 4, s - 12);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(x + s / 2 + 2, y + 8, 8, 6);
}

/**
 * Draw a tank with detailed pixel art
 */
function drawTank(ctx, tank) {
  const { x, y, size, dir, isPlayer, type } = tank;
  const s = size;

  ctx.save();

  // Glow effect
  ctx.shadowColor = isPlayer ? COLORS.GLOW_PLAYER : COLORS.GLOW_ENEMY;
  ctx.shadowBlur = 10;

  // Determine colors
  let bodyColor, hullColor, turretColor, barrelColor, trackColor, trackLinkColor;
  if (isPlayer) {
    bodyColor = COLORS.PLAYER;
    hullColor = COLORS.PLAYER_BODY;
    turretColor = COLORS.PLAYER_TURRET;
    barrelColor = '#FFEC8B';
    trackColor = COLORS.PLAYER_TRACK;
    trackLinkColor = COLORS.PLAYER_TRACK_LINK;
  } else {
    switch (type) {
      case 'fast':
        bodyColor = COLORS.ENEMY_FAST;
        hullColor = COLORS.ENEMY_FAST_BODY;
        turretColor = '#FF6633';
        barrelColor = '#CC4400';
        trackColor = '#333333';
        trackLinkColor = '#555555';
        break;
      case 'armor':
        bodyColor = COLORS.ENEMY_ARMOR;
        hullColor = COLORS.ENEMY_ARMOR_BODY;
        turretColor = COLORS.ENEMY_ARMOR_PLATE;
        barrelColor = '#881111';
        trackColor = '#222222';
        trackLinkColor = '#444444';
        break;
      default: // basic
        bodyColor = COLORS.ENEMY_BASIC;
        hullColor = COLORS.ENEMY_BASIC_BODY;
        turretColor = '#DDDDDD';
        barrelColor = '#AAAAAA';
        trackColor = '#333333';
        trackLinkColor = '#555555';
        break;
    }
  }

  const treadOffset = (tank.animFrame || 0) % 8;

  // Draw based on direction
  if (dir === DIR.UP || dir === DIR.DOWN) {
    // --- Track assemblies (left and right) ---
    const trackW = 6;
    const trackH = s - 2;
    const trackY = y + 1;

    // Left track
    ctx.fillStyle = trackColor;
    ctx.fillRect(x + 1, trackY, trackW, trackH);
    // Track links (animated)
    ctx.fillStyle = trackLinkColor;
    for (let i = 0; i < 5; i++) {
      let ty = trackY + 2 + i * 6 + ((dir === DIR.UP ? treadOffset : -treadOffset + 8) % 6);
      if (ty >= trackY + 1 && ty + 3 <= trackY + trackH - 1) {
        ctx.fillRect(x + 1, ty, trackW, 2);
      }
    }
    // Track edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 1, trackY, 1, trackH);

    // Right track
    ctx.fillStyle = trackColor;
    ctx.fillRect(x + s - trackW - 1, trackY, trackW, trackH);
    ctx.fillStyle = trackLinkColor;
    for (let i = 0; i < 5; i++) {
      let ty = trackY + 2 + i * 6 + ((dir === DIR.UP ? treadOffset : -treadOffset + 8) % 6);
      if (ty >= trackY + 1 && ty + 3 <= trackY + trackH - 1) {
        ctx.fillRect(x + s - trackW - 1, ty, trackW, 2);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + s - trackW - 1, trackY, 1, trackH);

    // --- Hull body (center between tracks) ---
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + trackW + 2, y + 3, s - trackW * 2 - 4, s - 6);
    ctx.shadowBlur = 0;
    ctx.fillStyle = hullColor;
    ctx.fillRect(x + trackW + 4, y + 5, s - trackW * 2 - 8, s - 10);

    // --- Turret (square/rounded on top of hull) ---
    const turretSize = 10;
    const tcx = x + s / 2;
    const tcy = y + s / 2;
    ctx.fillStyle = turretColor;
    ctx.fillRect(tcx - turretSize / 2, tcy - turretSize / 2, turretSize, turretSize);
    // Turret highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(tcx - turretSize / 2, tcy - turretSize / 2, turretSize, 2);

    // --- Barrel ---
    const barrelW = 4;
    ctx.fillStyle = barrelColor;
    if (dir === DIR.UP) {
      ctx.fillRect(tcx - barrelW / 2, y - 2, barrelW, s / 2 + 2);
      // Muzzle
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(tcx - barrelW / 2 - 1, y - 2, barrelW + 2, 2);
    } else {
      ctx.fillRect(tcx - barrelW / 2, y + s / 2, barrelW, s / 2 + 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(tcx - barrelW / 2 - 1, y + s, barrelW + 2, 2);
    }

    // --- Details ---
    // Headlight
    if (dir === DIR.UP) {
      ctx.fillStyle = '#FFFFAA';
      ctx.fillRect(x + s / 2 - 5, y + 3, 3, 2);
      ctx.fillRect(x + s / 2 + 2, y + 3, 3, 2);
    }
    // Exhaust (opposite side of movement)
    if (dir === DIR.DOWN) {
      ctx.fillStyle = '#555555';
      ctx.fillRect(x + s / 2 + 4, y + 2, 2, 3);
    } else {
      ctx.fillStyle = '#555555';
      ctx.fillRect(x + s / 2 + 4, y + s - 5, 2, 3);
    }

  } else {
    // LEFT or RIGHT
    const trackW = s - 2;
    const trackH = 6;
    const trackX = x + 1;

    // Top track
    ctx.fillStyle = trackColor;
    ctx.fillRect(trackX, y + 1, trackW, trackH);
    ctx.fillStyle = trackLinkColor;
    for (let i = 0; i < 5; i++) {
      let tx = trackX + 2 + i * 6 + ((dir === DIR.LEFT ? treadOffset : -treadOffset + 8) % 6);
      if (tx >= trackX + 1 && tx + 3 <= trackX + trackW - 1) {
        ctx.fillRect(tx, y + 1, 2, trackH);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(trackX, y + 1, trackW, 1);

    // Bottom track
    ctx.fillStyle = trackColor;
    ctx.fillRect(trackX, y + s - trackH - 1, trackW, trackH);
    ctx.fillStyle = trackLinkColor;
    for (let i = 0; i < 5; i++) {
      let tx = trackX + 2 + i * 6 + ((dir === DIR.LEFT ? treadOffset : -treadOffset + 8) % 6);
      if (tx >= trackX + 1 && tx + 3 <= trackX + trackW - 1) {
        ctx.fillRect(tx, y + s - trackH - 1, 2, trackH);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(trackX, y + s - trackH - 1, trackW, 1);

    // Hull body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + 3, y + trackH + 2, s - 6, s - trackH * 2 - 4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = hullColor;
    ctx.fillRect(x + 5, y + trackH + 4, s - 10, s - trackH * 2 - 8);

    // Turret
    const turretSize = 10;
    const tcx = x + s / 2;
    const tcy = y + s / 2;
    ctx.fillStyle = turretColor;
    ctx.fillRect(tcx - turretSize / 2, tcy - turretSize / 2, turretSize, turretSize);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(tcx - turretSize / 2, tcy - turretSize / 2, turretSize, 2);

    // Barrel
    const barrelH = 4;
    ctx.fillStyle = barrelColor;
    if (dir === DIR.LEFT) {
      ctx.fillRect(x - 2, tcy - barrelH / 2, s / 2 + 2, barrelH);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x - 2, tcy - barrelH / 2 - 1, 2, barrelH + 2);
    } else {
      ctx.fillRect(x + s / 2, tcy - barrelH / 2, s / 2 + 2, barrelH);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + s, tcy - barrelH / 2 - 1, 2, barrelH + 2);
    }

    // Headlight
    if (dir === DIR.LEFT) {
      ctx.fillStyle = '#FFFFAA';
      ctx.fillRect(x + 3, y + s / 2 - 5, 2, 3);
      ctx.fillRect(x + 3, y + s / 2 + 2, 2, 3);
    } else if (dir === DIR.RIGHT) {
      ctx.fillStyle = '#FFFFAA';
      ctx.fillRect(x + s - 5, y + s / 2 - 5, 2, 3);
      ctx.fillRect(x + s - 5, y + s / 2 + 2, 2, 3);
    }
  }

  // Armor plates for armored enemies
  if (type === 'armor') {
    ctx.strokeStyle = COLORS.ENEMY_ARMOR_PLATE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, s - 8, s - 8);
    ctx.strokeRect(x + 6, y + 6, s - 12, s - 12);
  }

  ctx.restore();
}

/**
 * Draw a bullet with glow and trail
 */
function drawBullet(ctx, bullet) {
  const { x, y, size, dir } = bullet;

  ctx.save();

  // Trail effect (3 fading afterimages)
  const vec = { [DIR.UP]: {dx:0,dy:1}, [DIR.DOWN]: {dx:0,dy:-1}, [DIR.LEFT]: {dx:1,dy:0}, [DIR.RIGHT]: {dx:-1,dy:0} };
  const tv = vec[dir] || {dx:0,dy:0};
  for (let i = 1; i <= 3; i++) {
    const alpha = 0.3 - i * 0.08;
    const trailX = x + tv.dx * i * (size * 0.8);
    const trailY = y + tv.dy * i * (size * 0.8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.BULLET_TRAIL;
    ctx.fillRect(trailX, trailY, size, size);
  }

  ctx.globalAlpha = 1;

  // Outer glow
  ctx.shadowColor = COLORS.GLOW_BULLET;
  ctx.shadowBlur = 8;

  // Bullet body
  ctx.fillStyle = COLORS.BULLET;
  ctx.fillRect(x, y, size, size);

  // Bright core
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.BULLET_CORE;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

  ctx.restore();
}

/**
 * Draw explosion with multiple rings and gradient
 */
function drawExplosion(ctx, exp) {
  const progress = exp.frame / exp.maxFrames;
  const cx = exp.x + exp.size / 2;
  const cy = exp.y + exp.size / 2;

  ctx.save();

  // Initial flash (first few frames)
  if (progress < 0.15) {
    const flashAlpha = 1 - progress / 0.15;
    ctx.globalAlpha = flashAlpha * 0.6;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, exp.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Multiple expanding rings
  for (let ring = 0; ring < 3; ring++) {
    const ringProgress = Math.max(0, progress - ring * 0.1);
    if (ringProgress <= 0 || ringProgress > 1) continue;

    const radius = exp.size * (0.3 + ringProgress * 0.8) * (1 - ring * 0.2);
    const alpha = (1 - ringProgress) * (1 - ring * 0.25);

    ctx.globalAlpha = Math.max(0, alpha);

    // Outer ring: red
    ctx.fillStyle = ring === 0 ? '#FF2200' : ring === 1 ? '#FF6600' : '#FFAA00';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner: yellow to white
    ctx.fillStyle = ring === 0 ? '#FF8800' : ring === 1 ? '#FFCC00' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Debris particles flying outward
  ctx.globalAlpha = Math.max(0, 1 - progress * 1.2);
  const debrisCount = 6;
  for (let i = 0; i < debrisCount; i++) {
    const angle = (Math.PI * 2 * i) / debrisCount + progress * 0.5;
    const dist = exp.size * progress * 1.2;
    const dx = cx + Math.cos(angle) * dist;
    const dy = cy + Math.sin(angle) * dist;
    ctx.fillStyle = i % 2 === 0 ? '#FF6600' : '#FFD700';
    ctx.fillRect(dx - 1.5, dy - 1.5, 3, 3);
  }

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
    if (pu.blinkTimer % 20 < 10) continue;

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
 * Draw HUD
 */
export function drawHUD(ctx, score, lives, level, enemiesLeft, enemiesKilled) {
  ctx.save();
  ctx.fillStyle = COLORS.HUD_BG;
  ctx.fillRect(CANVAS_WIDTH, 0, 160, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.font = 'bold 16px "Press Start 2P", monospace';
  ctx.textAlign = 'left';

  const xPos = CANVAS_WIDTH + 16;
  ctx.fillText('SCORE', xPos, 40);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(`${score}`, xPos, 64);

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('LIVES', xPos, 110);
  ctx.fillStyle = '#FF4444';
  for (let i = 0; i < lives; i++) {
    ctx.fillText('\u2665', xPos + i * 24, 134);
  }

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('LEVEL', xPos, 180);
  ctx.fillStyle = '#00FF00';
  ctx.fillText(`${level + 1}`, xPos, 204);

  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.fillText('ENEMY', xPos, 250);
  ctx.fillStyle = '#FF4500';
  ctx.fillText(`${enemiesLeft}`, xPos, 274);

  // Enemy progress bar
  const barX = xPos;
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

  // Kill icons
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
  ctx.fillText('WASD/Arrows', xPos, CANVAS_HEIGHT - 100);
  ctx.fillText('SPACE: Fire', xPos, CANVAS_HEIGHT - 80);
  ctx.fillText('ENTER: Start', xPos, CANVAS_HEIGHT - 60);
  ctx.fillText('M: Mute', xPos, CANVAS_HEIGHT - 40);

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
 * Draw stage intro screen
 */
export function drawStageIntro(ctx, level, timer) {
  ctx.fillStyle = '#555555';
  ctx.fillRect(0, 0, CANVAS_WIDTH + 160, CANVAS_HEIGHT);

  const alpha = Math.min(1, timer / 20);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 40px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`STAGE ${level + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

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
