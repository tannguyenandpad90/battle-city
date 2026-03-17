// ============================================
// BATTLE CITY - Enemy AI System (Smart)
// ============================================
import { DIR, DIR_VECTOR, BASE_POS, TILE_SIZE } from './constants';
import { canTankMove } from './collision';
import { createBullet } from './entities';

const DIRS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

/**
 * Pick a random direction different from current
 */
function randomDir(currentDir) {
  const dirs = DIRS.filter(d => d !== currentDir);
  return dirs[Math.floor(Math.random() * dirs.length)];
}

// Get direction toward a target position
function dirToward(enemy, targetX, targetY) {
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? DIR.RIGHT : DIR.LEFT;
  }
  return dy > 0 ? DIR.DOWN : DIR.UP;
}

// Check if enemy has line of sight to target in current facing direction
function hasLineOfSight(enemy, targetX, targetY, targetSize) {
  const vec = DIR_VECTOR[enemy.dir];
  if (vec.dx === 0) {
    // Vertical facing - check if target is in same column band
    const inColumn = targetX < enemy.x + enemy.size && targetX + targetSize > enemy.x;
    if (!inColumn) return false;
    if (vec.dy < 0) return targetY < enemy.y; // facing up, target above
    return targetY > enemy.y; // facing down, target below
  } else {
    // Horizontal facing
    const inRow = targetY < enemy.y + enemy.size && targetY + targetSize > enemy.y;
    if (!inRow) return false;
    if (vec.dx < 0) return targetX < enemy.x;
    return targetX > enemy.x;
  }
}

/**
 * Update a single enemy tank AI
 * - Smart direction choices based on enemy type
 * - Shoot more often when player/base is in line of sight
 */
export function updateEnemyAI(enemy, grid, allTanks, bullets, playerRef) {
  if (!enemy.alive) return;

  enemy.dirChangeTimer++;
  enemy.shootTimer++;
  enemy.animFrame++;

  const player = playerRef ? playerRef.current || playerRef : null;
  const baseX = BASE_POS.col * TILE_SIZE;
  const baseY = BASE_POS.row * TILE_SIZE;

  // Direction change logic based on type
  const changeInterval = 120 + Math.floor(Math.random() * 120);
  if (enemy.dirChangeTimer > changeInterval) {
    if (enemy.type === 'fast' && player && player.alive && Math.random() < 0.35) {
      // Fast enemies: 35% chance to turn toward player
      enemy.dir = dirToward(enemy, player.x, player.y);
    } else if (enemy.type === 'armor' && Math.random() < 0.5) {
      // Armor enemies: 50% chance to move toward base
      enemy.dir = dirToward(enemy, baseX, baseY);
    } else {
      enemy.dir = randomDir(enemy.dir);
    }
    enemy.dirChangeTimer = 0;
  }

  // Movement
  const vec = DIR_VECTOR[enemy.dir];
  const dx = vec.dx * enemy.speed;
  const dy = vec.dy * enemy.speed;

  if (canTankMove(enemy, dx, dy, grid, allTanks)) {
    enemy.x += dx;
    enemy.y += dy;
  } else {
    // On wall hit, smart direction choice
    if (enemy.type === 'armor' && Math.random() < 0.4) {
      enemy.dir = dirToward(enemy, baseX, baseY);
    } else if (enemy.type === 'fast' && player && player.alive && Math.random() < 0.3) {
      enemy.dir = dirToward(enemy, player.x, player.y);
    } else {
      enemy.dir = randomDir(enemy.dir);
    }
    enemy.dirChangeTimer = 0;
  }

  // Snap to grid
  if (enemy.dir === DIR.LEFT || enemy.dir === DIR.RIGHT) {
    enemy.y = Math.round(enemy.y / 2) * 2;
  } else {
    enemy.x = Math.round(enemy.x / 2) * 2;
  }

  // Shooting - shoot more often when player/base is in line of sight
  let shootInterval = 90;
  if (player && player.alive && hasLineOfSight(enemy, player.x, player.y, player.size)) {
    shootInterval = 30; // Shoot much faster when player in sight
  } else if (hasLineOfSight(enemy, baseX, baseY, TILE_SIZE * 2)) {
    shootInterval = 40; // Shoot faster when base in sight
  }

  if (enemy.shootTimer > shootInterval && enemy.activeBullets < enemy.maxBullets) {
    const bullet = createBullet(enemy);
    bullets.push(bullet);
    enemy.activeBullets++;
    enemy.shootTimer = Math.floor(Math.random() * 30);
  }
}
