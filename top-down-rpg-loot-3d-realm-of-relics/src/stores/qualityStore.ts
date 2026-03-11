import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityConfig {
  dpr: number;
  shadows: boolean;
  shadowMapSize: number;
  environmentResolution: number;
  antialias: boolean;
  waterEnabled: boolean;
  maxCrystals: number;
}

export const QUALITY_CONFIGS: Record<QualityLevel, QualityConfig> = {
  low: {
    dpr: 0.75,
    shadows: false,
    shadowMapSize: 512,
    environmentResolution: 64,
    antialias: false,
    waterEnabled: false,
    maxCrystals: 12,
  },
  medium: {
    dpr: 1.0,
    shadows: true,
    shadowMapSize: 1024,
    environmentResolution: 128,
    antialias: false,
    waterEnabled: true,
    maxCrystals: 16,
  },
  high: {
    dpr: Math.min(window.devicePixelRatio, 1.5),
    shadows: true,
    shadowMapSize: 2048,
    environmentResolution: 256,
    antialias: false,
    waterEnabled: true,
    maxCrystals: 20,
  },
};

// Auto-detect initial quality based on device
function detectInitialQuality(): QualityLevel {
  // Use navigator.hardwareConcurrency as a proxy for device power
  const cores = navigator.hardwareConcurrency ?? 4;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const dpr = window.devicePixelRatio ?? 1;

  if (isMobile) {
    // Always start with low quality on mobile for best performance
    return 'low';
  }
  return 'high';
}

interface QualityState {
  quality: QualityLevel;
  config: QualityConfig;
  setQuality: (level: QualityLevel) => void;
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set) => ({
      quality: detectInitialQuality(),
      config: QUALITY_CONFIGS[detectInitialQuality()],
      setQuality: (level) =>
        set({ quality: level, config: QUALITY_CONFIGS[level] }),
    }),
    {
      name: 'realm-quality',
    },
  ),
);
