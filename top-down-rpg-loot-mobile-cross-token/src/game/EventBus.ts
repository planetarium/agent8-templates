/**
 * Global event bus for Phaser <-> React communication.
 * Phaser scenes emit events here, React components subscribe.
 */
import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

// ── Event names ──────────────────────────────────────────────
export const EVENTS = {
  // Scene lifecycle
  SCENE_CHANGE: 'scene:change',       // payload: { scene: string }
  BOOT_PROGRESS: 'boot:progress',     // payload: { value: number }

  // HUD
  HUD_UPDATE: 'hud:update',           // payload: HUDData

  // Game Over
  GAME_OVER: 'game:over',             // payload: GameOverData

  // CrossRamp
  OPEN_CROSS_RAMP: 'crossramp:open',

  // Gem balance sync (React → React, emitted after claimGems)
  GEM_BALANCE: 'gem:balance',         // payload: { balance: number }
} as const;

export interface HUDData {
  score: number;
  floor: number;
  gems: number;
  hp: number;
  maxHp: number;
}

export interface GameOverData {
  score: number;
  floor: number;
  gems: number;
  gemsPending: number;
}
