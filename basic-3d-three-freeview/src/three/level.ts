import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { player } from '../game/state';
import { BOXES, FIELDS, RAMPS, rampVertices, type HeightField, type Ramp } from '../game/world';

// Wedge faces over the 6 rampVertices corners: 0,1 low edge · 2,3 high bottom · 4,5 high top.
const RAMP_FACES = [0, 1, 5, 0, 5, 4, 0, 4, 2, 1, 3, 5, 2, 4, 5, 2, 5, 3, 0, 2, 3, 0, 3, 1];

function rampMesh(ramp: Ramp) {
  const v = rampVertices(ramp);
  const pos: number[] = [];
  for (const i of RAMP_FACES) pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: ramp.color }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Grid spacing (m) of a height field's mesh. */
const FIELD_STEP = 0.5;

/** A height field drawn as a plane displaced by heightAt (the player collides with heightAt itself). */
function fieldMesh(field: HeightField) {
  const w = field.maxX - field.minX;
  const d = field.maxZ - field.minZ;
  const nx = Math.max(1, Math.ceil(w / FIELD_STEP));
  const nz = Math.max(1, Math.ceil(d / FIELD_STEP));
  const g = new THREE.PlaneGeometry(w, d, nx, nz);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + (field.minX + field.maxX) / 2;
    const z = pos.getZ(i) + (field.minZ + field.maxZ) / 2;
    pos.setXYZ(i, x, field.heightAt(x, z), z);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: field.color ?? '#7fb069' }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

/**
 * Sky, fog, lights, and the static boxes, ramps and height fields from
 * game/world.ts (any of them may be empty). `update()` moves the sun with the
 * player so the shadow camera can stay small.
 */
export function createLevel(scene: THREE.Scene) {
  const sky = new Sky();
  sky.scale.setScalar(1000);
  const u = sky.material.uniforms;
  u.sunPosition.value.set(100, 40, 80);
  u.turbidity.value = 4;
  u.rayleigh.value = 1.2;
  u.mieCoefficient.value = 0.005;
  u.mieDirectionalG.value = 0.8;
  u.cloudCoverage.value = 0; // three's Sky draws clouds by default
  // Same look as drei's <Sky> (three-stdlib): it ends with a gamma curve that three's Sky
  // dropped (1 / (1.2 + 1.2 · sunfade); sunfade = 1 for a sun above the horizon).
  sky.material.fragmentShader = sky.material.fragmentShader.replace(
    'gl_FragColor = vec4( texColor, 1.0 );',
    'gl_FragColor = vec4( pow( texColor, vec3( 1.0 / 2.4 ) ), 1.0 );',
  );
  scene.add(sky);
  scene.fog = new THREE.Fog('#cfe3f5', 40, 120);

  scene.add(new THREE.HemisphereLight('#dceeff', '#6b5a43', 0.9));
  const sun = new THREE.DirectionalLight('#fff3dc', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  BOXES.forEach((b, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...b.size), new THREE.MeshStandardMaterial({ color: b.color }));
    m.position.set(...b.pos);
    m.castShadow = i > 0;
    m.receiveShadow = true;
    scene.add(m);
  });
  for (const r of RAMPS) scene.add(rampMesh(r));
  for (const f of FIELDS) scene.add(fieldMesh(f));

  return {
    update() {
      const p = player.pos;
      sun.position.set(p.x + 10, p.y + 20, p.z + 8);
      sun.target.position.set(p.x, p.y, p.z);
    },
  };
}
