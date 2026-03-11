import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MeshStandardMaterial, SphereGeometry, Mesh, Vector3 } from 'three';
import { useQualityStore } from '../../stores/qualityStore';

const SHARED_GEO = new SphereGeometry(0.08, 4, 4);

const MAX_POOL = 16;
const SPIRIT_COLORS = ['#c4a265', '#6b8f4e', '#e8d5a3', '#8fba6f', '#d4aa42'];

const SHARED_MATS: MeshStandardMaterial[] = Array.from({ length: MAX_POOL }, (_, i) => {
  const color = SPIRIT_COLORS[i % SPIRIT_COLORS.length];
  return new MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 3,
    transparent: true,
    opacity: 1,
  });
});

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

const particlePool: Particle[] = SHARED_MATS.map((mat) => ({
  mesh: new Mesh(SHARED_GEO, mat),
  velocity: new Vector3(),
  life: 0,
  maxLife: 1,
  active: false,
}));
particlePool.forEach((p) => (p.mesh.visible = false));

function acquireParticles(count: number): Particle[] {
  while (particlePool.length < count) {
    const color = SPIRIT_COLORS[Math.floor(Math.random() * SPIRIT_COLORS.length)];
    const mat = new MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 3,
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
    speed: 2.5 + Math.random() * 3.0,
    maxLife: 0.6 + Math.random() * 0.5,
    initScale: 0.4 + Math.random() * 0.8,
  }));
}

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
  const pCount = useQualityStore((s) => s.config.particleCount);

  const init = useCallback(() => {
    if (!groupRef.current) return;

    const seeds = generateSeeds(pCount);
    seedsRef.current = seeds;

    const particles = acquireParticles(pCount);

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
        Math.cos(s.phi) * s.speed * 0.5 + 3.0,
        Math.sin(s.phi) * Math.sin(s.theta) * s.speed,
      );

      groupRef.current.add(p.mesh);
    }

    particlesRef.current = particles;
    startTimeRef.current = performance.now();
    completedRef.current = false;
  }, [pCount]);

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

    const particles = particlesRef.current;
    let allDone = true;

    for (const p of particles) {
      if (!p.active) continue;

      p.life += delta;
      const t = p.life / p.maxLife;

      if (t >= 1) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      allDone = false;

      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 4.0 * delta;

      const fade = 1 - t * t;
      (p.mesh.material as MeshStandardMaterial).opacity = fade;
      const scale = (1 - t) * 0.8;
      p.mesh.scale.setScalar(scale);
    }

    if (allDone) {
      completedRef.current = true;
      particles.forEach((p) => groupRef.current?.remove(p.mesh));
      releaseParticles(particles);
      particlesRef.current = [];
      onComplete();
    }
  });

  return <group ref={groupRef} position={position} />;
};

export default CollectEffect;
