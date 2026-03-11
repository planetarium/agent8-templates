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

  // Soul Gem balance sync (React -> React, emitted after claimSoulGems)
  SOULGEM_BALANCE: 'soulgem:balance', // payload: { balance: number }
} as const;

export interface HUDData {
  score: number;
  wave: number;
  soulgems: number;
  hp: number;
  maxHp: number;
}

export interface GameOverData {
  score: number;
  wave: number;
  soulgems: number;
  soulgemsPending: number;
}
