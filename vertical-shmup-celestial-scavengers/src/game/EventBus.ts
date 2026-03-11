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

  // Stardust balance sync (React → React, emitted after claimStardust)
  STARDUST_BALANCE: 'stardust:balance', // payload: { balance: number }
} as const;

export interface HUDData {
  score: number;
  wave: number;
  stardust: number;
  hp: number;
  maxHp: number;
}

export interface GameOverData {
  score: number;
  wave: number;
  stardust: number;
  stardustPending: number;
}
