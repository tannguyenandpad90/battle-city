// ============================================
// BATTLE CITY - Collision Detection System
// ============================================
import { TILE, TILE_SIZE, GRID_COLS, GRID_ROWS } from './constants';

/**
 * Check if a rectangle overlaps with a solid tile
 * Returns true if blocked
 */
export function checkTileCollision(x, y, width, height, grid, ignoreTiles = []) {
  const left = Math.floor(x / TILE_SIZE);
  const right = Math.floor((x + width - 1) / TILE_SIZE);
  const top = Math.floor(y / TILE_SIZE);
  const bottom = Math.floor((y + height - 1) / TILE_SIZE);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
        return true; // Out of bounds = collision
      }
      const tile = grid[row][col];
      if (ignoreTiles.includes(tile)) continue;
      if (tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.WATER || tile === TILE.BASE) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if two rectangles overlap (AABB)
 */
export function rectOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Check bullet-tile collision and destroy bricks
 * Checks ALL cells the bullet overlaps (up to 2x2)
 * Returns: { hit: boolean, destroyed: boolean, baseHit: boolean }
 */
export function bulletTileCollision(bullet, grid) {
  const left = Math.floor(bullet.x / TILE_SIZE);
  const right = Math.floor((bullet.x + bullet.size - 1) / TILE_SIZE);
  const top = Math.floor(bullet.y / TILE_SIZE);
  const bottom = Math.floor((bullet.y + bullet.size - 1) / TILE_SIZE);

  let hit = false;
  let destroyed = false;
  let baseHit = false;

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
        hit = true;
        continue;
      }
      const tile = grid[row][col];
      if (tile === TILE.BRICK) {
        grid[row][col] = TILE.EMPTY;
        hit = true;
        destroyed = true;
      } else if (tile === TILE.STEEL) {
        hit = true;
      } else if (tile === TILE.BASE) {
        hit = true;
        baseHit = true;
      }
    }
  }
  return { hit, destroyed, baseHit };
}

/**
 * Check bullet-tank collision
 * Returns the hit tank or null
 */
export function bulletTankCollision(bullet, tanks) {
  for (const tank of tanks) {
    if (!tank.alive) continue;
    if (
      rectOverlap(
        { x: bullet.x, y: bullet.y, w: bullet.size, h: bullet.size },
        { x: tank.x, y: tank.y, w: tank.size, h: tank.size }
      )
    ) {
      return tank;
    }
  }
  return null;
}

/**
 * Check tank-tank collision
 */
export function tankTankCollision(tank, otherTanks) {
  const tankRect = { x: tank.x, y: tank.y, w: tank.size, h: tank.size };
  for (const other of otherTanks) {
    if (other.id === tank.id || !other.alive) continue;
    const otherRect = { x: other.x, y: other.y, w: other.size, h: other.size };
    if (rectOverlap(tankRect, otherRect)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if tank movement is blocked by walls or other tanks
 * Grass is passable, Water is not
 */
export function canTankMove(tank, dx, dy, grid, allTanks) {
  const newX = tank.x + dx;
  const newY = tank.y + dy;

  // Bounds check
  if (newX < 0 || newX + tank.size > GRID_COLS * TILE_SIZE) return false;
  if (newY < 0 || newY + tank.size > GRID_ROWS * TILE_SIZE) return false;

  // Tile collision (grass is ignored for tanks)
  if (checkTileCollision(newX, newY, tank.size, tank.size, grid, [TILE.GRASS])) {
    return false;
  }

  // Tank-tank collision
  const tempTank = { ...tank, x: newX, y: newY };
  if (tankTankCollision(tempTank, allTanks)) {
    return false;
  }

  return true;
}
