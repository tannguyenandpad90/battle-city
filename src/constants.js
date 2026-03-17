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

// Colors (retro 8-bit style)
export const COLORS = {
  BRICK: '#8B4513',
  BRICK_LIGHT: '#A0522D',
  STEEL: '#808080',
  STEEL_LIGHT: '#A9A9A9',
  GRASS: '#228B22',
  GRASS_LIGHT: '#32CD32',
  WATER: '#1E90FF',
  WATER_DARK: '#0000CD',
  PLAYER: '#FFD700',
  PLAYER_BODY: '#DAA520',
  ENEMY_BASIC: '#C0C0C0',
  ENEMY_FAST: '#FF4500',
  ENEMY_ARMOR: '#8B0000',
  BULLET: '#FFFFFF',
  BASE: '#FFD700',
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
  GAME_OVER: 'GAME_OVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
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
