// ============================================
// BATTLE CITY - Main Game Component
// ============================================
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE,
  DIR, DIR_VECTOR, GAME_STATE,
  ENEMIES_PER_LEVEL, MAX_ACTIVE_ENEMIES, ENEMY_SPAWN_INTERVAL,
  ENEMY_SPAWNS, BASE_POS, PLAYER_MAX_LIVES,
  POWERUP, POWERUP_DURATION, POWERUP_SPAWN_CHANCE, GRID_COLS, GRID_ROWS,
  PLAYER_SPAWN,
} from './constants';
import { cloneMap, LEVELS } from './maps';
import { createPlayer, createEnemy, createBullet, createExplosion, createPowerUp } from './entities';
import { canTankMove, bulletTileCollision, bulletTankCollision, rectOverlap } from './collision';
import { updateEnemyAI } from './ai';
import {
  draw, drawHUD, drawMenu, drawGameOver, drawLevelComplete, tickWaterAnimation,
} from './renderer';

const HUD_WIDTH = 160;

export default function BattleCity() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(PLAYER_MAX_LIVES);
  const [level, setLevel] = useState(0);
  const [gameState, setGameState] = useState(GAME_STATE.MENU);

  // Game logic refs (avoid re-renders)
  const gridRef = useRef(null);
  const playerRef = useRef(null);
  const enemiesRef = useRef([]);
  const bulletsRef = useRef([]);
  const explosionsRef = useRef([]);
  const powerUpsRef = useRef([]);
  const keysRef = useRef({});
  const scoreRef = useRef(0);
  const livesRef = useRef(PLAYER_MAX_LIVES);
  const levelRef = useRef(0);
  const gameStateRef = useRef(GAME_STATE.MENU);
  const enemiesSpawnedRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const animFrameRef = useRef(null);
  const levelCompleteTimerRef = useRef(0);
  const baseDestroyedRef = useRef(false);

  // Sync state refs
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { levelRef.current = level; }, [level]);

  // ---- INPUT HANDLING ----
  const handleKeyDown = useCallback((e) => {
    keysRef.current[e.key] = true;

    if (e.key === 'Enter') {
      if (gameStateRef.current === GAME_STATE.MENU) {
        initLevel(0);
        setGameState(GAME_STATE.PLAYING);
      } else if (gameStateRef.current === GAME_STATE.GAME_OVER) {
        setScore(0);
        scoreRef.current = 0;
        setLives(PLAYER_MAX_LIVES);
        livesRef.current = PLAYER_MAX_LIVES;
        initLevel(0);
        setGameState(GAME_STATE.PLAYING);
      }
    }

    // Prevent scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
  }, []);

  const handleKeyUp = useCallback((e) => {
    keysRef.current[e.key] = false;
  }, []);

  // ---- INIT LEVEL ----
  const initLevel = useCallback((lvl) => {
    const idx = lvl % LEVELS.length;
    gridRef.current = cloneMap(idx);
    playerRef.current = createPlayer();
    enemiesRef.current = [];
    bulletsRef.current = [];
    explosionsRef.current = [];
    powerUpsRef.current = [];
    enemiesSpawnedRef.current = 0;
    lastSpawnTimeRef.current = Date.now();
    levelCompleteTimerRef.current = 0;
    baseDestroyedRef.current = false;
    levelRef.current = lvl;
    setLevel(lvl);
  }, []);

  // ---- SPAWN ENEMIES ----
  const spawnEnemy = useCallback(() => {
    if (enemiesSpawnedRef.current >= ENEMIES_PER_LEVEL) return;
    if (enemiesRef.current.filter(e => e.alive).length >= MAX_ACTIVE_ENEMIES) return;

    const now = Date.now();
    if (now - lastSpawnTimeRef.current < ENEMY_SPAWN_INTERVAL) return;

    const spawnIdx = enemiesSpawnedRef.current % ENEMY_SPAWNS.length;
    const spawn = ENEMY_SPAWNS[spawnIdx];

    // Choose enemy type based on level and count
    const lvl = levelRef.current;
    let type = 'basic';
    if (enemiesSpawnedRef.current % 4 === 3) type = 'armor';
    else if (lvl > 0 && enemiesSpawnedRef.current % 3 === 1) type = 'fast';

    const enemy = createEnemy(spawn.col, spawn.row, type);
    enemiesRef.current.push(enemy);
    enemiesSpawnedRef.current++;
    lastSpawnTimeRef.current = now;
  }, []);

  // ---- HANDLE PLAYER INPUT ----
  const handleInput = useCallback(() => {
    const player = playerRef.current;
    if (!player || !player.alive) return;

    const keys = keysRef.current;
    const grid = gridRef.current;
    const allTanks = [player, ...enemiesRef.current];
    let moved = false;

    // Movement (WASD + Arrow keys)
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
      player.dir = DIR.UP;
      const vec = DIR_VECTOR[DIR.UP];
      if (canTankMove(player, vec.dx * player.speed, vec.dy * player.speed, grid, allTanks)) {
        player.y += vec.dy * player.speed;
        moved = true;
      }
      // Snap X to grid for smooth movement
      player.x = Math.round(player.x / 2) * 2;
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
      player.dir = DIR.DOWN;
      const vec = DIR_VECTOR[DIR.DOWN];
      if (canTankMove(player, vec.dx * player.speed, vec.dy * player.speed, grid, allTanks)) {
        player.y += vec.dy * player.speed;
        moved = true;
      }
      player.x = Math.round(player.x / 2) * 2;
    } else if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      player.dir = DIR.LEFT;
      const vec = DIR_VECTOR[DIR.LEFT];
      if (canTankMove(player, vec.dx * player.speed, vec.dy * player.speed, grid, allTanks)) {
        player.x += vec.dx * player.speed;
        moved = true;
      }
      player.y = Math.round(player.y / 2) * 2;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      player.dir = DIR.RIGHT;
      const vec = DIR_VECTOR[DIR.RIGHT];
      if (canTankMove(player, vec.dx * player.speed, vec.dy * player.speed, grid, allTanks)) {
        player.x += vec.dx * player.speed;
        moved = true;
      }
      player.y = Math.round(player.y / 2) * 2;
    }

    if (moved) player.animFrame++;

    // Shooting (Space)
    if (keys[' ']) {
      if (player.activeBullets < player.maxBullets) {
        const bullet = createBullet(player);
        bulletsRef.current.push(bullet);
        player.activeBullets++;
      }
      keys[' '] = false; // One shot per press
    }
  }, []);

  // ---- UPDATE BULLETS ----
  const updateBullets = useCallback(() => {
    const bullets = bulletsRef.current;
    const grid = gridRef.current;
    const player = playerRef.current;
    const enemies = enemiesRef.current;

    for (const bullet of bullets) {
      if (!bullet.alive) continue;

      // Move bullet
      const vec = DIR_VECTOR[bullet.dir];
      bullet.x += vec.dx * bullet.speed;
      bullet.y += vec.dy * bullet.speed;

      // Out of bounds
      if (
        bullet.x < 0 || bullet.x >= GRID_COLS * TILE_SIZE ||
        bullet.y < 0 || bullet.y >= GRID_ROWS * TILE_SIZE
      ) {
        bullet.alive = false;
        decrementBulletCount(bullet);
        continue;
      }

      // Tile collision
      const tileResult = bulletTileCollision(bullet, grid);
      if (tileResult.hit) {
        bullet.alive = false;
        decrementBulletCount(bullet);
        if (tileResult.baseHit) {
          baseDestroyedRef.current = true;
          explosionsRef.current.push(
            createExplosion(BASE_POS.col * TILE_SIZE + TILE_SIZE / 2, BASE_POS.row * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 2)
          );
        }
        if (tileResult.destroyed) {
          explosionsRef.current.push(
            createExplosion(bullet.x, bullet.y, TILE_SIZE / 2)
          );
        }
        continue;
      }

      // Bullet-tank collision
      if (bullet.isPlayerBullet) {
        const hitEnemy = bulletTankCollision(bullet, enemies);
        if (hitEnemy) {
          bullet.alive = false;
          decrementBulletCount(bullet);
          hitEnemy.hp--;
          if (hitEnemy.hp <= 0) {
            hitEnemy.alive = false;
            explosionsRef.current.push(
              createExplosion(hitEnemy.x + hitEnemy.size / 2, hitEnemy.y + hitEnemy.size / 2, TILE_SIZE * 1.5)
            );
            const newScore = scoreRef.current + hitEnemy.points;
            scoreRef.current = newScore;
            setScore(newScore);

            // Power-up chance
            if (Math.random() < POWERUP_SPAWN_CHANCE) {
              spawnPowerUp(hitEnemy.x, hitEnemy.y);
            }
          } else {
            explosionsRef.current.push(
              createExplosion(bullet.x, bullet.y, TILE_SIZE / 2)
            );
          }
          continue;
        }
      } else {
        // Enemy bullet hits player
        if (player.alive && !player.shielded && player.spawnTimer <= 0) {
          const hit = rectOverlap(
            { x: bullet.x, y: bullet.y, w: bullet.size, h: bullet.size },
            { x: player.x, y: player.y, w: player.size, h: player.size }
          );
          if (hit) {
            bullet.alive = false;
            decrementBulletCount(bullet);
            playerHit();
            continue;
          }
        }
      }

      // Bullet-bullet collision
      for (const other of bullets) {
        if (other === bullet || !other.alive) continue;
        if (bullet.isPlayerBullet !== other.isPlayerBullet) {
          if (rectOverlap(
            { x: bullet.x, y: bullet.y, w: bullet.size, h: bullet.size },
            { x: other.x, y: other.y, w: other.size, h: other.size }
          )) {
            bullet.alive = false;
            other.alive = false;
            decrementBulletCount(bullet);
            decrementBulletCount(other);
          }
        }
      }
    }

    // Clean up dead bullets
    bulletsRef.current = bullets.filter(b => b.alive);
  }, []);

  const decrementBulletCount = (bullet) => {
    const allTanks = [playerRef.current, ...enemiesRef.current];
    for (const tank of allTanks) {
      if (tank && tank.id === bullet.ownerId) {
        tank.activeBullets = Math.max(0, tank.activeBullets - 1);
        break;
      }
    }
  };

  const playerHit = useCallback(() => {
    const player = playerRef.current;
    explosionsRef.current.push(
      createExplosion(player.x + player.size / 2, player.y + player.size / 2, TILE_SIZE * 1.5)
    );

    const newLives = livesRef.current - 1;
    livesRef.current = newLives;
    setLives(newLives);

    if (newLives <= 0) {
      player.alive = false;
      setGameState(GAME_STATE.GAME_OVER);
    } else {
      // Respawn player
      player.x = PLAYER_SPAWN.col * TILE_SIZE;
      player.y = PLAYER_SPAWN.row * TILE_SIZE;
      player.dir = DIR.UP;
      player.spawnTimer = 120; // 2 seconds invulnerability
    }
  }, []);

  const spawnPowerUp = (x, y) => {
    const types = [POWERUP.STAR, POWERUP.SHIELD, POWERUP.BOMB, POWERUP.LIFE];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push(createPowerUp(x, y, type));
  };

  // ---- UPDATE POWER-UPS ----
  const updatePowerUps = useCallback(() => {
    const player = playerRef.current;
    if (!player || !player.alive) return;

    for (const pu of powerUpsRef.current) {
      if (!pu.alive) continue;
      if (rectOverlap(
        { x: player.x, y: player.y, w: player.size, h: player.size },
        { x: pu.x, y: pu.y, w: pu.size, h: pu.size }
      )) {
        pu.alive = false;
        switch (pu.type) {
          case POWERUP.STAR:
            player.speed += 0.5;
            player.maxBullets = 2;
            player.upgraded = true;
            break;
          case POWERUP.SHIELD:
            player.shielded = true;
            player.shieldTimer = POWERUP_DURATION;
            break;
          case POWERUP.BOMB:
            for (const enemy of enemiesRef.current) {
              if (enemy.alive) {
                enemy.alive = false;
                explosionsRef.current.push(
                  createExplosion(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, TILE_SIZE * 1.5)
                );
                const newScore = scoreRef.current + enemy.points;
                scoreRef.current = newScore;
                setScore(newScore);
              }
            }
            break;
          case POWERUP.LIFE:
            livesRef.current++;
            setLives(livesRef.current);
            break;
          default: break;
        }
      }
    }
    powerUpsRef.current = powerUpsRef.current.filter(p => p.alive);
  }, []);

  // ---- UPDATE EXPLOSIONS ----
  const updateExplosions = useCallback(() => {
    for (const exp of explosionsRef.current) {
      if (!exp.alive) continue;
      exp.frame++;
      if (exp.frame >= exp.maxFrames) {
        exp.alive = false;
      }
    }
    explosionsRef.current = explosionsRef.current.filter(e => e.alive);
  }, []);

  // ---- MAIN UPDATE LOOP ----
  const update = useCallback(() => {
    if (gameStateRef.current !== GAME_STATE.PLAYING) return;

    const player = playerRef.current;

    // Spawn timer for player invulnerability
    if (player && player.spawnTimer > 0) {
      player.spawnTimer--;
    }

    // Shield timer
    if (player && player.shielded) {
      player.shieldTimer -= 16;
      if (player.shieldTimer <= 0) {
        player.shielded = false;
      }
    }

    handleInput();
    spawnEnemy();

    // Update enemies
    const allTanks = [player, ...enemiesRef.current];
    for (const enemy of enemiesRef.current) {
      updateEnemyAI(enemy, gridRef.current, allTanks, bulletsRef.current);
    }

    updateBullets();
    updatePowerUps();
    updateExplosions();
    tickWaterAnimation();

    // Check base destroyed
    if (baseDestroyedRef.current) {
      setGameState(GAME_STATE.GAME_OVER);
      return;
    }

    // Check level complete
    const allEnemiesDead = enemiesRef.current.every(e => !e.alive);
    const allSpawned = enemiesSpawnedRef.current >= ENEMIES_PER_LEVEL;
    if (allSpawned && allEnemiesDead) {
      levelCompleteTimerRef.current++;
      if (levelCompleteTimerRef.current === 1) {
        setGameState(GAME_STATE.LEVEL_COMPLETE);
      }
      if (levelCompleteTimerRef.current > 180) { // 3 seconds
        const nextLevel = levelRef.current + 1;
        initLevel(nextLevel);
        setGameState(GAME_STATE.PLAYING);
      }
    }
  }, [handleInput, spawnEnemy, updateBullets, updatePowerUps, updateExplosions, initLevel]);

  // ---- MAIN DRAW LOOP ----
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const currentState = gameStateRef.current;

    if (currentState === GAME_STATE.MENU) {
      drawMenu(ctx);
    } else if (currentState === GAME_STATE.PLAYING || currentState === GAME_STATE.LEVEL_COMPLETE) {
      draw(ctx, {
        grid: gridRef.current,
        player: playerRef.current,
        enemies: enemiesRef.current,
        bullets: bulletsRef.current,
        explosions: explosionsRef.current,
        powerUps: powerUpsRef.current,
      });
      drawHUD(ctx, scoreRef.current, livesRef.current, levelRef.current,
        ENEMIES_PER_LEVEL - enemiesSpawnedRef.current + enemiesRef.current.filter(e => e.alive).length
      );

      if (currentState === GAME_STATE.LEVEL_COMPLETE) {
        drawLevelComplete(ctx, levelRef.current, scoreRef.current);
      }
    } else if (currentState === GAME_STATE.GAME_OVER) {
      if (gridRef.current) {
        draw(ctx, {
          grid: gridRef.current,
          player: playerRef.current,
          enemies: enemiesRef.current,
          bullets: bulletsRef.current,
          explosions: explosionsRef.current,
          powerUps: powerUpsRef.current,
        });
      }
      drawGameOver(ctx, scoreRef.current);
    }
  }, []);

  // ---- GAME LOOP ----
  const gameLoop = useCallback(() => {
    update();
    render();
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [update, render]);

  // ---- SETUP & TEARDOWN ----
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, gameLoop]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#111',
      fontFamily: '"Press Start 2P", monospace',
    }}>
      <div style={{
        border: '4px solid #333',
        boxShadow: '0 0 40px rgba(255, 215, 0, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)',
        borderRadius: '4px',
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH + HUD_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
