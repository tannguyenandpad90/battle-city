// ============================================
// BATTLE CITY - Enemy AI System
// ============================================
import { DIR, DIR_VECTOR } from './constants';
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

/**
 * Update a single enemy tank AI
 * - Move in current direction
 * - On wall hit, pick new random direction
 * - Occasionally change direction randomly
 * - Shoot periodically
 */
export function updateEnemyAI(enemy, grid, allTanks, bullets) {
  if (!enemy.alive) return;

  enemy.dirChangeTimer++;
  enemy.shootTimer++;
  enemy.animFrame++;

  // Occasionally change direction (every 2-4 seconds at 60fps)
  const changeInterval = 120 + Math.floor(Math.random() * 120);
  if (enemy.dirChangeTimer > changeInterval) {
    enemy.dir = randomDir(enemy.dir);
    enemy.dirChangeTimer = 0;
  }

  // Try to move in current direction
  const vec = DIR_VECTOR[enemy.dir];
  const dx = vec.dx * enemy.speed;
  const dy = vec.dy * enemy.speed;

  if (canTankMove(enemy, dx, dy, grid, allTanks)) {
    enemy.x += dx;
    enemy.y += dy;
  } else {
    // Hit a wall: change direction
    enemy.dir = randomDir(enemy.dir);
    enemy.dirChangeTimer = 0;
  }

  // Snap to grid to prevent sub-pixel drift
  if (enemy.dir === DIR.LEFT || enemy.dir === DIR.RIGHT) {
    enemy.y = Math.round(enemy.y / 2) * 2;
  } else {
    enemy.x = Math.round(enemy.x / 2) * 2;
  }

  // Shoot periodically (every ~1.5 seconds)
  if (enemy.shootTimer > 90 && enemy.activeBullets < enemy.maxBullets) {
    const bullet = createBullet(enemy);
    bullets.push(bullet);
    enemy.activeBullets++;
    enemy.shootTimer = Math.floor(Math.random() * 30);
  }
}
