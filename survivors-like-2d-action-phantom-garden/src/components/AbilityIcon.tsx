import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  Sparkles,
  Heart,
  Target,
  Wind,
  Coins,
  Wallet,
  Play,
  RotateCcw,
  LogOut,
  X,
  Check,
  Shield,
  Flame,
  Crosshair,
  Bomb,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Sparkles,
  Heart,
  Target,
  Wind,
  Coins,
  Wallet,
  Play,
  RotateCcw,
  LogOut,
  X,
  Check,
  Shield,
  Flame,
  Crosshair,
  Bomb,
};

export function getAbilityIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Zap;
}
