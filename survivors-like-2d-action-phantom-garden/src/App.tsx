import React, { useEffect, useState } from "react";
import GameComponent from "./components/GameComponent";
import { useGameServer, useAsset } from "@agent8/gameserver";
import {
  Zap, Wallet, Play, RotateCcw, Heart, LogOut, X, Check, Shield,
} from "lucide-react";
import { GAME_CONFIG } from "./config/gameConfig";
import { ABILITIES, type Ability } from "./config/abilities";
import { getAbilityIcon } from "./components/AbilityIcon";

export const gameEvents = new EventTarget();

const COLOR_CLASSES: Record<string, { border: string; bg: string; hoverBg: string; text: string; shadow: string }> = {
  purple: { border: 'border-violet-500', bg: 'from-violet-900/50', hoverBg: 'hover:bg-violet-900/80', text: 'text-violet-400', shadow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]' },
  green: { border: 'border-emerald-500', bg: 'from-emerald-900/50', hoverBg: 'hover:bg-emerald-900/80', text: 'text-emerald-400', shadow: 'shadow-[0_0_30px_rgba(52,211,153,0.3)]' },
  red: { border: 'border-rose-500', bg: 'from-rose-900/50', hoverBg: 'hover:bg-rose-900/80', text: 'text-rose-400', shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
  orange: { border: 'border-amber-500', bg: 'from-amber-900/50', hoverBg: 'hover:bg-amber-900/80', text: 'text-amber-400', shadow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
  cyan: { border: 'border-teal-500', bg: 'from-teal-900/50', hoverBg: 'hover:bg-teal-900/80', text: 'text-teal-400', shadow: 'shadow-[0_0_30px_rgba(20,184,166,0.3)]' },
  blue: { border: 'border-indigo-500', bg: 'from-indigo-900/50', hoverBg: 'hover:bg-indigo-900/80', text: 'text-indigo-400', shadow: 'shadow-[0_0_30px_rgba(99,102,241,0.3)]' },
};

function App() {
  const { connected, server } = useGameServer();
  const { assets } = useAsset();
  const [sessionGold, setSessionGold] = useState(0);
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'GAMEOVER'>('TITLE');
  const [health, setHealth] = useState({
    current: GAME_CONFIG.player.maxHealth,
    max: GAME_CONFIG.player.maxHealth,
  });

  const [xp, setXp] = useState({
    current: 0,
    max: GAME_CONFIG.xp.initialNextLevelXp,
    level: 1,
  });
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [offeredAbilities, setOfferedAbilities] = useState<Ability[]>([]);
  const [goldBounce, setGoldBounce] = useState(false);
  const [xpPulse, setXpPulse] = useState(false);

  // Floating Joystick State
  const [joystick, setJoystick] = useState<{ active: boolean; originX: number; originY: number; currentX: number; currentY: number } | null>(null);
  const JOYSTICK_RADIUS = 60;

  // Quit Modal State
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  useEffect(() => {
    const handleAddGold = () => {
      setSessionGold(prev => prev + 1);
      setGoldBounce(true);
      if (connected && server) {
        server.remoteFunction('addGold', [1], { throttle: 500, throttleKey: 'gold' });
      }
    };

    const handleShowTitle = () => setGameState('TITLE');

    const handleGameStart = () => {
      setGameState('PLAYING');
      setSessionGold(0);
    };

    const handleShowGameOver = () => setGameState('GAMEOVER');

    const handleUpdateHealth = (e: Event) => {
      const customEvent = e as CustomEvent;
      setHealth({ current: customEvent.detail.health, max: customEvent.detail.max });
    };

    const handleUpdateXp = (e: Event) => {
      const customEvent = e as CustomEvent;
      setXp({ current: customEvent.detail.xp, max: customEvent.detail.max, level: customEvent.detail.level });
      setXpPulse(true);
    };

    const handleShowLevelUp = () => {
      const shuffled = [...ABILITIES].sort(() => Math.random() - 0.5);
      setOfferedAbilities(shuffled.slice(0, 3));
      setIsLevelUp(true);
      setJoystick(null);
      gameEvents.dispatchEvent(new Event('joystickStop'));
    };

    gameEvents.addEventListener('addGold', handleAddGold);
    gameEvents.addEventListener('showTitle', handleShowTitle);
    gameEvents.addEventListener('gameStart', handleGameStart);
    gameEvents.addEventListener('showGameOver', handleShowGameOver);
    gameEvents.addEventListener('updateHealth', handleUpdateHealth);
    gameEvents.addEventListener('updateXp', handleUpdateXp);
    gameEvents.addEventListener('showLevelUp', handleShowLevelUp);

    return () => {
      gameEvents.removeEventListener('addGold', handleAddGold);
      gameEvents.removeEventListener('showTitle', handleShowTitle);
      gameEvents.removeEventListener('gameStart', handleGameStart);
      gameEvents.removeEventListener('showGameOver', handleShowGameOver);
      gameEvents.removeEventListener('updateHealth', handleUpdateHealth);
      gameEvents.removeEventListener('updateXp', handleUpdateXp);
      gameEvents.removeEventListener('showLevelUp', handleShowLevelUp);
    };
  }, [connected, server]);

  useEffect(() => {
    if (!goldBounce) return;
    const t = setTimeout(() => setGoldBounce(false), 250);
    return () => clearTimeout(t);
  }, [goldBounce]);

  useEffect(() => {
    if (!xpPulse) return;
    const t = setTimeout(() => setXpPulse(false), 150);
    return () => clearTimeout(t);
  }, [xpPulse]);

  const openShop = async () => {
    if (!connected || !server) return;
    try {
      const url = await server.getCrossRampShopUrl("en");
      window.open(url, "CrossRampShop", "width=1024,height=768");
    } catch (error) {
      console.error("Failed to open shop", error);
    }
  };

  const handleStartGame = () => {
    gameEvents.dispatchEvent(new Event('startGameFromUI'));
    setGameState('PLAYING');
    setIsLevelUp(false);
    setOfferedAbilities([]);
    setIsQuitModalOpen(false);
  };

  const handleRestartGame = () => {
    gameEvents.dispatchEvent(new Event('restartGameFromUI'));
  };

  const selectAbility = (ability: string) => {
    gameEvents.dispatchEvent(new CustomEvent('selectAbility', { detail: { ability } }));
    setIsLevelUp(false);
    setOfferedAbilities([]);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'PLAYING' || isLevelUp || isQuitModalOpen) return;
    if ((e.target as HTMLElement).closest('.hud-ui')) return;

    setJoystick({
      active: true,
      originX: e.clientX,
      originY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'PLAYING' || !joystick?.active || isLevelUp || isQuitModalOpen) return;

    let dx = e.clientX - joystick.originX;
    let dy = e.clientY - joystick.originY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > JOYSTICK_RADIUS) {
      const ratio = JOYSTICK_RADIUS / distance;
      dx *= ratio;
      dy *= ratio;
    }

    setJoystick(prev => prev ? {
      ...prev,
      currentX: prev.originX + dx,
      currentY: prev.originY + dy
    } : null);

    gameEvents.dispatchEvent(new CustomEvent('joystickMove', { detail: { x: dx, y: -dy } }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!joystick?.active) return;
    setJoystick(null);
    gameEvents.dispatchEvent(new Event('joystickStop'));
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleOpenQuitModal = () => {
    setIsQuitModalOpen(true);
    setJoystick(null);
    gameEvents.dispatchEvent(new Event('joystickStop'));
    gameEvents.dispatchEvent(new Event('pauseGame'));
  };

  const handleCloseQuitModal = () => {
    setIsQuitModalOpen(false);
    gameEvents.dispatchEvent(new Event('resumeGame'));
  };

  const handleConfirmQuit = () => {
    setIsQuitModalOpen(false);
    gameEvents.dispatchEvent(new Event('forceGameOver'));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white" style={{ fontFamily: "'MedievalSharp', cursive, serif" }}>
      {/* HUD - Playing State */}
      {gameState === 'PLAYING' && (
        <div
          className="absolute inset-0 z-10 touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
            {/* Top Left: Hearts/Health */}
            <div className="absolute left-4 top-4 flex flex-col gap-2 pointer-events-auto hud-ui z-20">
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-600/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                {[...Array(health.max)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 transition-all duration-300 ${
                      i < health.current
                        ? 'fill-emerald-400 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)] scale-100'
                        : 'text-gray-700 scale-90'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Top Center: Petals (Currency) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col gap-2 items-center pointer-events-auto hud-ui z-20">
              <div className={`flex items-center gap-2 bg-black/60 backdrop-blur-sm px-5 py-2 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] ${goldBounce ? 'scale-110' : ''} transition-transform duration-150`}>
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <span className="text-amber-300 font-bold text-xl" style={{ fontFamily: "'Cinzel', serif" }}>{sessionGold}</span>
                <span className="text-amber-600 text-xs uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>Petals</span>
              </div>
            </div>

            {/* Top Right: Leave Garden */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 pointer-events-auto hud-ui z-20">
              <button
                onClick={handleOpenQuitModal}
                className="flex items-center justify-center bg-black/60 hover:bg-rose-900/70 backdrop-blur-sm p-3 rounded-xl border border-violet-500/20 hover:border-rose-500/40 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Bottom: XP Bar */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-72 md:w-[560px] pointer-events-auto hud-ui z-20 ${xpPulse ? 'scale-105' : ''} transition-transform duration-150`}>
            <div className="flex items-center justify-between text-xs font-bold mb-2 px-1">
              <span className="text-emerald-400 tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Grove {xp.level}</span>
              <span className="text-emerald-200/70" style={{ fontFamily: "'Cinzel', serif" }}>{xp.current} / {xp.max} Essence</span>
            </div>
            <div className="w-full bg-black/50 backdrop-blur-md rounded-full h-3 border border-emerald-600/30 overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((xp.current / xp.max) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #059669, #34d399, #a7f3d0)',
                  boxShadow: '0 0 12px rgba(52, 211, 153, 0.8)',
                }}
              />
            </div>
          </div>

          {/* Dynamic Floating Joystick */}
          {joystick?.active && !isLevelUp && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: joystick.originX,
                top: joystick.originY,
                transform: 'translate(-50%, -50%)',
                width: JOYSTICK_RADIUS * 2,
                height: JOYSTICK_RADIUS * 2,
              }}
            >
              {/* Base ring */}
              <div className="absolute inset-0 rounded-full border-2 border-violet-400/40 bg-violet-900/10 backdrop-blur-sm shadow-[0_0_20px_rgba(139,92,246,0.2)]" />
              {/* Stick */}
              <div
                className="absolute rounded-full"
                style={{
                  width: JOYSTICK_RADIUS * 0.8,
                  height: JOYSTICK_RADIUS * 0.8,
                  left: JOYSTICK_RADIUS,
                  top: JOYSTICK_RADIUS,
                  background: 'radial-gradient(circle, rgba(139,92,246,0.9) 0%, rgba(52,211,153,0.4) 100%)',
                  boxShadow: '0 0 15px rgba(139,92,246,0.7)',
                  transform: `translate(calc(-50% + ${joystick.currentX - joystick.originX}px), calc(-50% + ${joystick.currentY - joystick.originY}px))`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Quit Confirmation Modal */}
      {isQuitModalOpen && gameState === 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md px-4 pointer-events-auto hud-ui">
          <div className="bg-gray-950 border-2 border-violet-500/40 rounded-2xl p-8 max-w-sm w-full flex flex-col items-center shadow-[0_0_60px_rgba(139,92,246,0.15)]">
            {/* Decorative top bar */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent mb-6" />
            <LogOut className="w-14 h-14 text-rose-400 mb-4 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
            <h2 className="text-2xl font-black text-white mb-2 text-center tracking-wider" style={{ fontFamily: "'Cinzel Decorative', serif" }}>{GAME_CONFIG.ui.quitConfirmTitle}</h2>
            <p className="text-gray-400 text-center mb-8 text-sm leading-relaxed">{GAME_CONFIG.ui.quitConfirmMessage}</p>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleCloseQuitModal}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors border border-gray-600"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <X className="w-4 h-4" /> Stay
              </button>
              <button
                onClick={handleConfirmQuit}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-800 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <Check className="w-4 h-4" /> Leave
              </button>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent mt-6" />
          </div>
        </div>
      )}

      {/* Upgrade/Level Up Overlay */}
      {isLevelUp && gameState === 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md px-4">
          <div className="text-xs text-emerald-500 tracking-[0.4em] uppercase mb-2 font-bold" style={{ fontFamily: "'Cinzel', serif" }}>Ancient Power Awakens</div>
          <h2
            className="text-5xl md:text-7xl font-black mb-10 text-center tracking-wider animate-pulse"
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              color: '#A78BFA',
              textShadow: '0 0 30px rgba(139,92,246,0.8), 0 0 60px rgba(52,211,153,0.4)',
            }}
          >
            {GAME_CONFIG.ui.levelUpTitle}
          </h2>
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl justify-center">
            {offeredAbilities.map((ability) => {
              const Icon = getAbilityIcon(ability.icon);
              const colors = COLOR_CLASSES[ability.colorScheme] ?? COLOR_CLASSES.purple;
              return (
                <button
                  key={ability.key}
                  onClick={() => selectAbility(ability.key)}
                  className={`group flex-1 flex flex-col items-center p-5 bg-gradient-to-b ${colors.bg} to-black border ${colors.border} rounded-xl ${colors.hoverBg} hover:scale-105 transition-all ${colors.shadow}`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 border ${colors.border} bg-black/40`}>
                    <Icon className={`w-8 h-8 ${colors.text} group-hover:scale-110 transition-transform`} />
                  </div>
                  <h3 className="text-lg font-black text-white mb-1 tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>{ability.name}</h3>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                    ability.rarity === 'epic' ? 'text-fuchsia-400' :
                    ability.rarity === 'rare' ? 'text-violet-400' : 'text-gray-400'
                  }`} style={{ fontFamily: "'Cinzel', serif" }}>{ability.rarity}</div>
                  <p className={`${colors.text} text-center text-xs leading-relaxed opacity-80`}>{ability.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Title Screen */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at center, rgba(26,10,46,0.85) 0%, rgba(5,2,8,0.9) 100%)' }}>
          {/* Vines overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(52,211,153,0.05) 10px, rgba(52,211,153,0.05) 12px)',
            }}
          />

          {/* Total Petals Display */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Wallet className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 font-black text-xl" style={{ fontFamily: "'Cinzel', serif" }}>{assets?.credits || 0}</span>
            <span className="text-amber-600 text-xs uppercase tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>Petals</span>
          </div>

          {/* Title */}
          <div className="text-center mb-10 relative">
            <div className="text-xs text-emerald-500 tracking-[0.5em] uppercase mb-3 font-bold" style={{ fontFamily: "'Cinzel', serif" }}>The Cursed Awakening</div>
            <h1
              className="text-5xl sm:text-7xl md:text-9xl font-black select-none animate-float-glow"
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                background: 'linear-gradient(180deg, #e9d5ff 0%, #a78bfa 40%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.5))',
              }}
            >
              Phantom
            </h1>
            <h1
              className="text-5xl sm:text-7xl md:text-9xl font-black select-none -mt-4"
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.5))',
              }}
            >
              Garden
            </h1>
            <div className="text-xs text-gray-500 tracking-[0.4em] uppercase mt-3" style={{ fontFamily: "'Cinzel', serif" }}>Defend the Enchanted Grove</div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <button
              onClick={handleStartGame}
              className="group flex items-center justify-center gap-3 w-full py-4 font-black text-xl uppercase tracking-widest rounded-xl transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 border-2"
              style={{
                fontFamily: "'Cinzel', serif",
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(52,211,153,0.1) 100%)',
                borderColor: '#a78bfa',
                color: '#a78bfa',
                boxShadow: '0 0 30px rgba(139,92,246,0.3), inset 0 0 30px rgba(139,92,246,0.05)',
              }}
            >
              <Play className="w-6 h-6 fill-current" />
              Enter
            </button>

            <button
              onClick={openShop}
              className="flex items-center justify-center gap-3 w-full py-3 font-bold text-base uppercase tracking-widest rounded-xl transition-all transform hover:scale-105 active:scale-95 border"
              style={{
                fontFamily: "'Cinzel', serif",
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)',
                borderColor: 'rgba(245,158,11,0.4)',
                color: '#fbbf24',
                boxShadow: '0 0 20px rgba(245,158,11,0.1)',
              }}
            >
              <Wallet className="w-5 h-5" />
              CROSS Exchange
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at center, rgba(26,10,46,0.9) 0%, rgba(5,2,8,0.95) 100%)' }}>
          <div className="text-xs text-rose-400 tracking-[0.5em] uppercase mb-2 font-bold animate-pulse" style={{ fontFamily: "'Cinzel', serif" }}>The Garden Falls Silent</div>
          <h1
            className="text-5xl md:text-8xl font-black select-none mb-2 text-center animate-pulse"
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              color: '#f87171',
              textShadow: '0 0 30px rgba(244,63,94,0.8), 0 0 60px rgba(244,63,94,0.4)',
            }}
          >
            {GAME_CONFIG.ui.gameOverTitle}
          </h1>
          <div className="text-gray-500 text-xs tracking-widest mb-8 uppercase" style={{ fontFamily: "'Cinzel', serif" }}>The spirit fades into the mist</div>

          <div
            className="flex items-center gap-3 mb-10 px-8 py-4 rounded-xl border font-bold text-lg tracking-widest"
            style={{
              fontFamily: "'Cinzel', serif",
              background: 'rgba(0,0,0,0.6)',
              borderColor: 'rgba(245,158,11,0.3)',
              color: '#fbbf24',
              boxShadow: '0 0 20px rgba(245,158,11,0.1)',
            }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
            </svg>
            <span>{sessionGold}</span>
            <span className="text-amber-600 text-sm">Petals Gathered</span>
          </div>

          <button
            onClick={handleRestartGame}
            className="flex items-center justify-center gap-3 px-8 py-4 font-black text-xl uppercase tracking-widest rounded-xl transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 border-2"
            style={{
              fontFamily: "'Cinzel', serif",
              borderColor: '#a78bfa',
              color: '#a78bfa',
              background: 'rgba(139,92,246,0.1)',
              boxShadow: '0 0 25px rgba(139,92,246,0.2)',
            }}
          >
            <RotateCcw className="w-6 h-6" />
            {GAME_CONFIG.ui.tryAgainLabel}
          </button>
        </div>
      )}

      {/* Phaser Canvas Container */}
      <div className="absolute inset-0 z-0">
        <GameComponent />
      </div>
    </div>
  );
}

export default App;
