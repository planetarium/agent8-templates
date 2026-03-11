import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MeshStandardMaterial, SphereGeometry, Mesh, Vector3 } from 'three';

// ─────────────────────────────────────────────────────────────
// All shared resources are created ONCE at module load time.
// This prevents shader recompilation / GPU upload stalls on
// the first collect event (which caused the PC lag spike).
// ─────────────────────────────────────────────────────────────
const SHARED_GEO = new SphereGeometry(0.08, 5, 5);

// Single shared material – we only change opacity per-particle
// by temporarily cloning it when needed.  Actually the simplest
// approach that avoids per-instance material overhead: one
// material, update per-particle opacity via a uniform override
// is complex, so we keep one material clone per pool slot but
// create them ALL upfront so the GPU compiles shaders once.
const PARTICLE_COUNT = 12; // reduced from 18 → less draw calls

// Pre-build all materials upfront
const SHARED_MATS: MeshStandardMaterial[] = Array.from({ length: PARTICLE_COUNT }, () =>
  new MeshStandardMaterial({
    color: '#ff88cc',
    emissive: '#ff44aa',
    emissiveIntensity: 2,
    transparent: true,
    opacity: 1,
  })
);

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

// Build the pool once using pre-created materials
const particlePool: Particle[] = SHARED_MATS.map((mat) => ({
  mesh: new Mesh(SHARED_GEO, mat),
  velocity: new Vector3(),
  life: 0,
  maxLife: 1,
  active: false,
}));
// Hide all initially
particlePool.forEach((p) => (p.mesh.visible = false));

function acquireParticles(count: number): Particle[] {
  // Grow pool if needed (rare path – materials still pre-created)
  while (particlePool.length < count) {
    const mat = new MeshStandardMaterial({
      color: '#ff88cc',
      emissive: '#ff44aa',
      emissiveIntensity: 2,
      transparent: true,
      opacity: 1,
    });
    const mesh = new Mesh(SHARED_GEO, mat);
    mesh.visible = false;
    particlePool.push({ mesh, velocity: new Vector3(), life: 0, maxLife: 1, active: false });
  }
  return particlePool.splice(0, count);
}

function releaseParticles(particles: Particle[]) {
  particles.forEach((p) => {
    p.mesh.visible = false;
    p.active = false;
    p.life = 0;
    (p.mesh.material as MeshStandardMaterial).opacity = 1;
    particlePool.push(p);
  });
}

// ─────────────────────────────────────────────────────────────
// Pre-baked random values to avoid Math.random() in useFrame
// ─────────────────────────────────────────────────────────────
interface ParticleSeed {
  theta: number;
  phi: number;
  speed: number;
  maxLife: number;
  initScale: number;
}

function generateSeeds(count: number): ParticleSeed[] {
  return Array.from({ length: count }, () => ({
    theta: Math.random() * Math.PI * 2,
    phi: Math.random() * Math.PI,
    speed: 2.5 + Math.random() * 3,
    maxLife: 0.6 + Math.random() * 0.4,
    initScale: 0.5 + Math.random() * 1,
  }));
}

// ─────────────────────────────────────────────────────────────
// CollectEffect – NO pointLight to avoid shader recompilation
// ─────────────────────────────────────────────────────────────
interface CollectEffectProps {
  position: [number, number, number];
  onComplete: () => void;
}

const CollectEffect: React.FC<CollectEffectProps> = ({ position, onComplete }) => {
  const groupRef = useRef<Group>(null);
  const startTimeRef = useRef(0);
  const completedRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const seedsRef = useRef<ParticleSeed[]>([]);

  const init = useCallback(() => {
    if (!groupRef.current) return;

    // Generate seeds (random calls happen here, not in useFrame)
    const seeds = generateSeeds(PARTICLE_COUNT);
    seedsRef.current = seeds;

    const particles = acquireParticles(PARTICLE_COUNT);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const s = seeds[i];

      p.life = 0;
      p.maxLife = s.maxLife;
      p.active = true;
      p.mesh.position.set(0, 0, 0);
      p.mesh.scale.setScalar(s.initScale);
      p.mesh.visible = true;
      (p.mesh.material as MeshStandardMaterial).opacity = 1;

      p.velocity.set(
        Math.sin(s.phi) * Math.cos(s.theta) * s.speed,
        Math.cos(s.phi) * s.speed * 0.5 + 2,
        Math.sin(s.phi) * Math.sin(s.theta) * s.speed,
      );

      groupRef.current.add(p.mesh);
    }

    particlesRef.current = particles;
    startTimeRef.current = performance.now();
    completedRef.current = false;
  }, []);

  useEffect(() => {
    init();
    return () => {
      if (particlesRef.current.length) {
        particlesRef.current.forEach((p) => groupRef.current?.remove(p.mesh));
        releaseParticles(particlesRef.current);
        particlesRef.current = [];
      }
    };
  }, [init]);

  useFrame((_, delta) => {
    if (completedRef.current) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    let allDead = true;

    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      const s = seedsRef.current[i];
      if (!p.active) continue;

      p.life += delta;
      const t = p.life / p.maxLife;

      if (t < 1) {
        allDead = false;
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.velocity.y -= 4 * delta; // gravity
        (p.mesh.material as MeshStandardMaterial).opacity = 1 - t;
        // Use seed-based scale (no Math.random in frame loop)
        p.mesh.scale.setScalar(s.initScale * (1 - t * 0.5));
      } else {
        p.mesh.visible = false;
        p.active = false;
      }
    }

    if (allDead && elapsed > 0.8) {
      completedRef.current = true;
      particlesRef.current.forEach((p) => groupRef.current?.remove(p.mesh));
      releaseParticles(particlesRef.current);
      particlesRef.current = [];
      onComplete();
    }
  });

  // No pointLight here – adding a pointLight causes Three.js to
  // recompile shaders for all lit objects the first time it appears,
  // which is the main cause of the frame spike on first collect.
  return <group ref={groupRef} position={position} />;
};

export default CollectEffect;
