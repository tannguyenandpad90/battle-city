// ============================================
// BATTLE CITY - Game Constants
// ============================================

export const TILE_SIZE = 32;
export const GRID_COLS = 26;
export const GRID_ROWS = 26;
export const CANVAS_WIDTH = TILE_SIZE * GRID_COLS;
export const CANVAS_HEIGHT = TILE_SIZE * GRID_ROWS;

// Tile types
export const TILE = {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  GRASS: 3,
  WATER: 4,
  BASE: 5,
};

// Directions
export const DIR = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
};

// Direction vectors
export const DIR_VECTOR = {
  [DIR.UP]: { dx: 0, dy: -1 },
  [DIR.DOWN]: { dx: 0, dy: 1 },
  [DIR.LEFT]: { dx: -1, dy: 0 },
  [DIR.RIGHT]: { dx: 1, dy: 0 },
};

// Tank speeds
export const PLAYER_SPEED = 2;
export const ENEMY_SPEED = 1.5;
export const BULLET_SPEED = 5;

// Bullet size
export const BULLET_SIZE = 6;

// Colors (retro 8-bit style)
export const COLORS = {
  BRICK: '#8B4513',
  BRICK_LIGHT: '#A0522D',
  BRICK_DARK: '#5C3317',
  BRICK_MORTAR: '#3E2210',
  STEEL: '#808080',
  STEEL_LIGHT: '#A9A9A9',
  STEEL_DARK: '#555555',
  STEEL_HIGHLIGHT: '#D0D0D0',
  GRASS: '#228B22',
  GRASS_LIGHT: '#32CD32',
  GRASS_DARK: '#1B6B1B',
  GRASS_BLADE: '#3AE03A',
  WATER: '#1E90FF',
  WATER_DARK: '#0000CD',
  WATER_LIGHT: '#40B0FF',
  WATER_FOAM: 'rgba(255,255,255,0.4)',
  PLAYER: '#FFD700',
  PLAYER_BODY: '#DAA520',
  PLAYER_TURRET: '#FFEC8B',
  PLAYER_TRACK: '#444444',
  PLAYER_TRACK_LINK: '#666666',
  ENEMY_BASIC: '#C0C0C0',
  ENEMY_BASIC_BODY: '#999999',
  ENEMY_FAST: '#FF4500',
  ENEMY_FAST_BODY: '#CC3300',
  ENEMY_ARMOR: '#8B0000',
  ENEMY_ARMOR_BODY: '#660000',
  ENEMY_ARMOR_PLATE: '#AA2222',
  BULLET: '#FFFFFF',
  BULLET_CORE: '#FFFF88',
  BULLET_TRAIL: 'rgba(255, 200, 100, 0.4)',
  BASE: '#FFD700',
  EAGLE_BODY: '#DAA520',
  EAGLE_WING: '#FFD700',
  EAGLE_BEAK: '#FF8C00',
  EAGLE_DESTROYED: '#555555',
  BG: '#000000',
  GLOW_PLAYER: 'rgba(255, 215, 0, 0.3)',
  GLOW_ENEMY: 'rgba(255, 0, 0, 0.3)',
  GLOW_BULLET: 'rgba(255, 255, 255, 0.5)',
  HUD_TEXT: '#FFFFFF',
  HUD_BG: 'rgba(0, 0, 0, 0.7)',
};

// Enemy spawn points (grid coordinates)
export const ENEMY_SPAWNS = [
  { col: 0, row: 0 },
  { col: 12, row: 0 },
  { col: 25, row: 0 },
];

// Player spawn point
export const PLAYER_SPAWN = { col: 8, row: 24 };

// Base position
export const BASE_POS = { col: 12, row: 24 };

// Game states
export const GAME_STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  STAGE_INTRO: 'STAGE_INTRO',
};

// Enemy config per level
export const ENEMIES_PER_LEVEL = 20;
export const MAX_ACTIVE_ENEMIES = 4;
export const ENEMY_SPAWN_INTERVAL = 3000; // ms

// Player config
export const PLAYER_MAX_LIVES = 3;
export const PLAYER_MAX_BULLETS = 1; // upgradeable to 2

// Power-ups
export const POWERUP = {
  STAR: 'STAR',       // speed + double bullet
  SHIELD: 'SHIELD',   // temporary invincibility
  BOMB: 'BOMB',       // destroy all enemies on screen
  LIFE: 'LIFE',       // extra life
};

export const POWERUP_DURATION = 10000; // ms for shield
export const POWERUP_SPAWN_CHANCE = 0.3; // 30% chance on enemy kill
export const SHIELD_DURATION_FRAMES = 600; // 10 seconds at 60fps

// Particle / visual effect constants
export const PARTICLE_COUNT = 12;        // sparks per explosion
export const PARTICLE_SPEED = 3;         // pixels per frame
export const PARTICLE_LIFE = 20;         // frames
export const SCREEN_SHAKE_DURATION = 12; // frames
export const SCREEN_SHAKE_MAGNITUDE = 4; // pixels
export const SPAWN_ANIM_DURATION = 90;   // frames (~1.5 sec at 60fps)
export const STAGE_INTRO_DURATION = 120; // frames (~2 sec at 60fps)

// Difficulty scaling function
export function getLevelConfig(level) {
  const l = Math.min(level, 9); // cap scaling at level 10
  return {
    enemyCount: Math.min(15 + l * 2, 30),
    maxActive: Math.min(4 + Math.floor(l / 2), 8),
    spawnInterval: Math.max(3500 - l * 200, 1500),
    fastRatio: Math.min(0.1 + l * 0.05, 0.4),   // % of fast enemies
    armorRatio: Math.min(0.05 + l * 0.05, 0.3),  // % of armor enemies
  };
}
