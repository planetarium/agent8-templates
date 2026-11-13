import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDER, CAMERA, PLAYER } from '../config';
import { builder, player, world } from '../game/state';
import { AIR, DIRT, GRASS, STONE, blockHitsPlayer, chunksTouching, inWorld, raycast, setBlock, type Block } from '../game/voxel';

/** Selectable blocks, in hotbar order (keys 1, 2, 3). */
export const HOTBAR: { block: Block; label: string; color: string }[] = [
  { block: GRASS, label: 'Grass', color: '#6aa84f' },
  { block: DIRT, label: 'Dirt', color: '#8b5a2b' },
  { block: STONE, label: 'Stone', color: '#8a8a8a' },
];

function edit(x: number, y: number, z: number, b: Block) {
  if (!setBlock(world, x, y, z, b)) return false;
  for (const k of chunksTouching(x, z)) builder.dirty.add(k);
  builder.edits++;
  return true;
}

/** Remove the block under the crosshair. The bottom layer (y = 0) cannot be mined, so the world has no holes. */
export function mineTarget() {
  const t = builder.target;
  if (!t || t.block[1] === 0) return false;
  return edit(t.block[0], t.block[1], t.block[2], AIR);
}

/** Put the selected block against the face under the crosshair, unless it would bury the player. */
export function placeAtTarget() {
  const t = builder.target;
  if (!t) return false;
  const [x, y, z] = [t.block[0] + t.normal[0], t.block[1] + t.normal[1], t.block[2] + t.normal[2]];
  if (!inWorld(world, x, y, z) || blockHitsPlayer(x, y, z, player.pos, PLAYER.radius, PLAYER.height)) return false;
  return edit(x, y, z, builder.selected);
}

const KEYS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2 };

/**
 * Crosshair raycast from the camera through the screen center, reaching
 * BUILDER.range past the player's eye; outlines the target block. Click
 * mines, right-click places (a click that dragged is a camera move); 1 / 2 / 3
 * pick the block.
 */
export function Builder({ onSelect }: { onSelect: (b: Block) => void }) {
  const { camera, gl } = useThree();
  const outline = useRef<THREE.LineSegments>(null);
  const v = useMemo(() => ({ dir: new THREE.Vector3(), eye: new THREE.Vector3() }), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), []);

  useEffect(() => {
    const el = gl.domElement;
    let downX = 0;
    let downY = 0;
    const down = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // touch uses the MINE / PLACE buttons
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > BUILDER.clickSlop) return;
      if (e.button === 0) mineTarget();
      else if (e.button === 2) placeAtTarget();
    };
    const menu = (e: Event) => e.preventDefault();
    const key = (e: KeyboardEvent) => {
      const i = KEYS[e.code];
      if (i === undefined) return;
      builder.selected = HOTBAR[i].block;
      onSelect(builder.selected);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('contextmenu', menu);
    window.addEventListener('keydown', key);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('contextmenu', menu);
      window.removeEventListener('keydown', key);
    };
  }, [gl, onSelect]);

  useFrame(() => {
    camera.getWorldDirection(v.dir);
    v.eye.set(player.pos.x, player.pos.y + CAMERA.free.height, player.pos.z);
    const reach = camera.position.distanceTo(v.eye) + BUILDER.range;
    const o = camera.position;
    builder.target = raycast(world, [o.x, o.y, o.z], [v.dir.x, v.dir.y, v.dir.z], reach);
    const line = outline.current;
    if (!line) return;
    line.visible = builder.target !== null;
    if (builder.target) {
      const [x, y, z] = builder.target.block;
      line.position.set(x + 0.5, y + 0.5, z + 0.5);
    }
  });

  return (
    <lineSegments ref={outline} geometry={edges} visible={false}>
      <lineBasicMaterial color="#111111" />
    </lineSegments>
  );
}
