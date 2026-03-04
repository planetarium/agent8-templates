import * as THREE from 'three';

/**
 * Lightweight singleton registry for enemy world positions.
 * Enemies update their position each frame (via useFrame).
 * Player reads this registry for melee attack distance detection.
 * Uses a plain Map (no React state) to avoid re-render overhead.
 */
export const enemyPositionRegistry = new Map<string, THREE.Vector3>();
