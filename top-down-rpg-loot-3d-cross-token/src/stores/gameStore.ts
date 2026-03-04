import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ─── Game entity types ────────────────────────────────────────────────────────

export type GamePhase = 'title' | 'playing' | 'gameover' | 'wallet' | 'crossramp';
export type EnemyType = 'skeleton' | 'zombie' | 'golem' | 'boss';
export type GemType = 'gem' | 'rareGem' | 'epicGem';

export interface EnemyData {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  spawnPosition: [number, number, number];
  speed: number;
  color: string;
  size: number;
}

export interface GemData {
  id: string;
  type: GemType;
  position: [number, number, number];
  value: number;
  isLife?: boolean;
}

// ─── Enemy configs per type ───────────────────────────────────────────────────

const ENEMY_CONFIGS: Record<EnemyType, { baseHp: number; speed: number; color: string; size: number }> = {
  skeleton: { baseHp: 2, speed: 3.0, color: '#ccccbb', size: 1.4 },
  zombie:   { baseHp: 3, speed: 2.0, color: '#4a7c4a', size: 1.5 },
  golem:    { baseHp: 5, speed: 1.5, color: '#8B8680', size: 1.8 },
  boss:     { baseHp: 15, speed: 2.5, color: '#8B0000', size: 2.2 },
};

// ─── Spawn helpers ────────────────────────────────────────────────────────────

const ROOM_HALF = 8; // enemies spawn within this radius from center

function randomSpawnPos(): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  const dist = 4 + Math.random() * 4; // 4–8 units from center
  return [Math.cos(angle) * dist, 0.9, Math.sin(angle) * dist];
}

function createEnemy(id: string, type: EnemyType, floor: number): EnemyData {
  const cfg = ENEMY_CONFIGS[type];
  const hpScale = 1 + (floor - 1) * 0.3;
  const hp = Math.round(cfg.baseHp * hpScale);
  const speedScale = 1 + (floor - 1) * 0.05;
  return {
    id,
    type,
    hp,
    maxHp: hp,
    spawnPosition: randomSpawnPos(),
    speed: cfg.speed * speedScale,
    color: cfg.color,
    size: cfg.size,
  };
}

function buildEnemyWave(floor: number): EnemyData[] {
  const enemies: EnemyData[] = [];
  const isBoss = floor % 5 === 0;

  if (isBoss) {
    enemies.push(createEnemy(`boss-${floor}-0`, 'boss', floor));
    enemies.push(createEnemy(`skele-${floor}-0`, 'skeleton', floor));
    enemies.push(createEnemy(`skele-${floor}-1`, 'skeleton', floor));
  } else {
    const count = Math.min(3 + floor, 9); // 4–9 enemies
    const typePool: EnemyType[] = floor <= 2
      ? ['skeleton']
      : floor <= 4
        ? ['skeleton', 'zombie']
        : ['skeleton', 'zombie', 'golem'];

    for (let i = 0; i < count; i++) {
      const type = typePool[Math.floor(Math.random() * typePool.length)];
      enemies.push(createEnemy(`${type}-${floor}-${i}`, type, floor));
    }
  }

  return enemies;
}

function spawnGemAtPosition(pos: [number, number, number]): GemData {
  const roll = Math.random();
  // 5% life, 10% epic, 25% rare, 60% common
  if (roll < 0.05) {
    return { id: `life-${Date.now()}-${Math.random()}`, type: 'gem', position: pos, value: 0, isLife: true };
  } else if (roll < 0.15) {
    return { id: `epic-${Date.now()}-${Math.random()}`, type: 'epicGem', position: pos, value: 20 };
  } else if (roll < 0.40) {
    return { id: `rare-${Date.now()}-${Math.random()}`, type: 'rareGem', position: pos, value: 5 };
  }
  return { id: `gem-${Date.now()}-${Math.random()}`, type: 'gem', position: pos, value: 1 };
}

// ─── Store definition ─────────────────────────────────────────────────────────

interface GameStore {
  // Physics init
  isMapPhysicsReady: boolean;
  setMapPhysicsReady: (ready: boolean) => void;

  // Game phase
  gamePhase: GamePhase;
  setGamePhase: (phase: GamePhase) => void;

  // Stats
  score: number;
  floor: number;
  playerHp: number;
  maxHp: number;
  totalGems: number;
  gemsPending: number;

  // Active entities
  enemies: EnemyData[];
  gems: GemData[];

  // Game lifecycle
  startGame: () => void;
  restartGame: () => void;
  endGame: () => void;
  nextFloor: () => void;
  spawnEnemiesForFloor: (floor: number) => void;

  // Player actions
  damagePlayer: () => void;
  collectLife: () => void;

  // Enemy actions
  damageEnemy: (id: string, amount: number) => void;
  killEnemy: (id: string, position: [number, number, number]) => void;

  // Gem collection
  collectGem: (id: string) => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Physics init ──────────────────────────────────────────────────────────
    isMapPhysicsReady: false,
    setMapPhysicsReady: (ready) => set({ isMapPhysicsReady: ready }),

    // ── Game phase ────────────────────────────────────────────────────────────
    gamePhase: 'title',
    setGamePhase: (phase) => set({ gamePhase: phase }),

    // ── Stats ─────────────────────────────────────────────────────────────────
    score: 0,
    floor: 0,
    playerHp: 3,
    maxHp: 3,
    totalGems: 0,
    gemsPending: 0,

    // ── Active entities ───────────────────────────────────────────────────────
    enemies: [],
    gems: [],

    // ── Game lifecycle ────────────────────────────────────────────────────────
    startGame: () =>
      set({
        gamePhase: 'playing',
        floor: 1,
        score: 0,
        playerHp: 3,
        maxHp: 3,
        totalGems: 0,
        gemsPending: 0,
        enemies: buildEnemyWave(1),
        gems: [],
      }),

    restartGame: () =>
      set({
        gamePhase: 'playing',
        floor: 1,
        score: 0,
        playerHp: 3,
        maxHp: 3,
        totalGems: 0,
        gemsPending: 0,
        enemies: buildEnemyWave(1),
        gems: [],
      }),

    endGame: () => {
      const { totalGems, score, floor } = get();
      set({
        gamePhase: 'gameover',
        gemsPending: totalGems,
      });
    },

    nextFloor: () => {
      const { floor, score } = get();
      const newFloor = floor + 1;
      const floorBonus = 100 * floor;
      set({
        floor: newFloor,
        score: score + floorBonus,
        enemies: buildEnemyWave(newFloor),
        gems: [],
      });
    },

    spawnEnemiesForFloor: (floor) =>
      set({
        enemies: buildEnemyWave(floor),
        gems: [],
      }),

    // ── Player ────────────────────────────────────────────────────────────────
    damagePlayer: () => {
      const { playerHp, endGame } = get();
      const newHp = playerHp - 1;
      if (newHp <= 0) {
        set({ playerHp: 0 });
        endGame();
      } else {
        set({ playerHp: newHp });
      }
    },

    collectLife: () => {
      const { playerHp, maxHp } = get();
      set({ playerHp: Math.min(playerHp + 1, maxHp) });
    },

    // ── Enemy ─────────────────────────────────────────────────────────────────
    damageEnemy: (id, amount) =>
      set((state) => ({
        enemies: state.enemies.map((e) =>
          e.id === id ? { ...e, hp: Math.max(0, e.hp - amount) } : e
        ),
      })),

    killEnemy: (id, position) => {
      const { enemies, gems, score } = get();
      const enemy = enemies.find((e) => e.id === id);
      const killScore = enemy?.type === 'boss' ? 500 : enemy?.type === 'golem' ? 100 : 50;
      const newGem = spawnGemAtPosition(position);
      set({
        enemies: enemies.filter((e) => e.id !== id),
        gems: [...gems, newGem],
        score: score + killScore,
      });
    },

    // ── Gems ──────────────────────────────────────────────────────────────────
    collectGem: (id) => {
      const { gems, totalGems, playerHp, maxHp, collectLife } = get();
      const gem = gems.find((g) => g.id === id);
      if (!gem) return;
      if (gem.isLife) {
        set({ gems: gems.filter((g) => g.id !== id) });
        get().collectLife();
      } else {
        set({
          gems: gems.filter((g) => g.id !== id),
          totalGems: totalGems + gem.value,
        });
      }
    },
  })),
);
