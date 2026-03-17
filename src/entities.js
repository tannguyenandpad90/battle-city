// ============================================
// BATTLE CITY - Entity Factories
// ============================================
import {
  DIR, TILE_SIZE, PLAYER_SPEED, ENEMY_SPEED,
  BULLET_SPEED, PLAYER_SPAWN, PLAYER_MAX_BULLETS,
} from './constants';

let nextId = 1;

/**
 * Create a player tank
 */
export function createPlayer() {
  return {
    id: nextId++,
    x: PLAYER_SPAWN.col * TILE_SIZE,
    y: PLAYER_SPAWN.row * TILE_SIZE,
    size: TILE_SIZE,
    dir: DIR.UP,
    speed: PLAYER_SPEED,
    alive: true,
    isPlayer: true,
    maxBullets: PLAYER_MAX_BULLETS,
    activeBullets: 0,
    shielded: false,
    shieldTimer: 0,
    upgraded: false,
    spawnTimer: 60, // invulnerability frames on spawn
    spawnAnimTimer: 0,
    animFrame: 0,
  };
}

/**
 * Create an enemy tank
 * type: 'basic' | 'fast' | 'armor'
 */
export function createEnemy(spawnCol, spawnRow, type = 'basic') {
  const config = {
    basic: { speed: ENEMY_SPEED, hp: 1, points: 100 },
    fast: { speed: ENEMY_SPEED * 1.5, hp: 1, points: 200 },
    armor: { speed: ENEMY_SPEED * 0.8, hp: 3, points: 300 },
  };

  const c = config[type] || config.basic;

  return {
    id: nextId++,
    x: spawnCol * TILE_SIZE,
    y: spawnRow * TILE_SIZE,
    size: TILE_SIZE,
    dir: DIR.DOWN,
    speed: c.speed,
    alive: true,
    isPlayer: false,
    type,
    hp: c.hp,
    points: c.points,
    maxBullets: 1,
    activeBullets: 0,
    moveTimer: 0,
    shootTimer: 0,
    dirChangeTimer: 0,
    spawnAnimTimer: 0,
    animFrame: 0,
  };
}

/**
 * Create a bullet
 */
export function createBullet(tank) {
  const halfTank = tank.size / 2;
  const bulletSize = 4;
  let bx, by;

  switch (tank.dir) {
    case DIR.UP:
      bx = tank.x + halfTank - bulletSize / 2;
      by = tank.y - bulletSize;
      break;
    case DIR.DOWN:
      bx = tank.x + halfTank - bulletSize / 2;
      by = tank.y + tank.size;
      break;
    case DIR.LEFT:
      bx = tank.x - bulletSize;
      by = tank.y + halfTank - bulletSize / 2;
      break;
    case DIR.RIGHT:
      bx = tank.x + tank.size;
      by = tank.y + halfTank - bulletSize / 2;
      break;
    default:
      bx = tank.x;
      by = tank.y;
  }

  return {
    id: nextId++,
    x: bx,
    y: by,
    size: bulletSize,
    dir: tank.dir,
    speed: BULLET_SPEED,
    ownerId: tank.id,
    isPlayerBullet: tank.isPlayer,
    alive: true,
  };
}

/**
 * Create a power-up
 */
export function createPowerUp(x, y, type) {
  return {
    id: nextId++,
    x,
    y,
    size: TILE_SIZE,
    type,
    alive: true,
    blinkTimer: 0,
  };
}

/**
 * Create an explosion effect
 */
export function createExplosion(x, y, size = TILE_SIZE) {
  return {
    id: nextId++,
    x: x - size / 2,
    y: y - size / 2,
    size,
    frame: 0,
    maxFrames: 15,
    alive: true,
  };
}
