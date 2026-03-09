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
  RefreshCw,
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
  RefreshCw,
};

export function getAbilityIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Zap;
}
