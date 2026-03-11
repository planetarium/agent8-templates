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
  blue: { border: 'border-blue-500', bg: 'from-blue-900/50', hoverBg: 'hover:bg-blue-900/80', text: 'text-blue-400', shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
  green: { border: 'border-green-500', bg: 'from-green-900/50', hoverBg: 'hover:bg-green-900/80', text: 'text-green-400', shadow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]' },
  red: { border: 'border-red-500', bg: 'from-red-900/50', hoverBg: 'hover:bg-red-900/80', text: 'text-red-400', shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]' },
  orange: { border: 'border-orange-500', bg: 'from-orange-900/50', hoverBg: 'hover:bg-orange-900/80', text: 'text-orange-400', shadow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]' },
  cyan: { border: 'border-cyan-500', bg: 'from-cyan-900/50', hoverBg: 'hover:bg-cyan-900/80', text: 'text-cyan-400', shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]' },
  purple: { border: 'border-purple-500', bg: 'from-purple-900/50', hoverBg: 'hover:bg-purple-900/80', text: 'text-purple-400', shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]' },
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
    <div className="relative w-full h-screen overflow-hidden bg-black font-mono text-white">
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
            {/* Top Left: Shield/Health */}
            <div className="absolute left-4 top-4 flex flex-col gap-2 pointer-events-auto hud-ui z-20">
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                {[...Array(health.max)].map((_, i) => (
                  <Shield
                    key={i}
                    className={`w-6 h-6 transition-all duration-300 ${
                      i < health.current
                        ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] scale-100'
                        : 'text-gray-700 scale-90'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Top Center: Credits */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col gap-2 items-center pointer-events-auto hud-ui z-20">
              <div className={`flex items-center gap-2 bg-black/70 backdrop-blur-sm px-5 py-2 rounded-lg border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.25)] ${goldBounce ? 'scale-110' : ''} transition-transform duration-150`}>
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-xl tracking-widest">{sessionGold}</span>
                <span className="text-yellow-600 text-xs uppercase tracking-widest">CR</span>
              </div>
            </div>

            {/* Top Right: Abort Mission */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 pointer-events-auto hud-ui z-20">
              <button
                onClick={handleOpenQuitModal}
                className="flex items-center justify-center bg-black/70 hover:bg-red-900/80 backdrop-blur-sm p-3 rounded-lg border border-cyan-500/20 hover:border-red-500/50 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Bottom: XP Bar */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-72 md:w-[560px] pointer-events-auto hud-ui z-20 ${xpPulse ? 'scale-105' : ''} transition-transform duration-150`}>
            <div className="flex items-center justify-between text-xs font-bold mb-2 px-1">
              <span className="text-cyan-400 tracking-widest uppercase">LVL {xp.level}</span>
              <span className="text-cyan-200/70">{xp.current} / {xp.max} XP</span>
            </div>
            <div className="w-full bg-black/60 backdrop-blur-md rounded-sm h-3 border border-cyan-500/30 overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${Math.min((xp.current / xp.max) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #0891b2, #22d3ee, #7dd3fc)',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.8)',
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
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 bg-cyan-900/10 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.2)]" />
              {/* Stick */}
              <div
                className="absolute rounded-full"
                style={{
                  width: JOYSTICK_RADIUS * 0.8,
                  height: JOYSTICK_RADIUS * 0.8,
                  left: JOYSTICK_RADIUS,
                  top: JOYSTICK_RADIUS,
                  background: 'radial-gradient(circle, rgba(6,182,212,0.9) 0%, rgba(6,182,212,0.4) 100%)',
                  boxShadow: '0 0 15px rgba(6,182,212,0.7)',
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
          <div className="bg-gray-950 border-2 border-cyan-500/40 rounded-2xl p-8 max-w-sm w-full flex flex-col items-center shadow-[0_0_60px_rgba(6,182,212,0.15)]">
            {/* Decorative top bar */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-6" />
            <LogOut className="w-14 h-14 text-red-400 mb-4 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
            <h2 className="text-2xl font-black text-white mb-2 text-center tracking-widest uppercase">{GAME_CONFIG.ui.quitConfirmTitle}</h2>
            <p className="text-gray-400 text-center mb-8 text-sm leading-relaxed">{GAME_CONFIG.ui.quitConfirmMessage}</p>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleCloseQuitModal}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors border border-gray-600"
              >
                <X className="w-4 h-4" /> CANCEL
              </button>
              <button
                onClick={handleConfirmQuit}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <Check className="w-4 h-4" /> QUIT
              </button>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-6" />
          </div>
        </div>
      )}

      {/* Upgrade/Level Up Overlay */}
      {isLevelUp && gameState === 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md px-4">
          <div className="text-xs text-cyan-500 tracking-[0.4em] uppercase mb-2 font-bold">SYSTEM NOTIFICATION</div>
          <h2
            className="text-5xl md:text-7xl font-black mb-10 text-center tracking-widest uppercase animate-pulse"
            style={{
              color: '#22D3EE',
              textShadow: '0 0 30px rgba(6,182,212,0.8), 0 0 60px rgba(6,182,212,0.4)',
              WebkitTextStroke: '1px rgba(6,182,212,0.5)',
            }}
          >
            {GAME_CONFIG.ui.levelUpTitle}
          </h2>
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl justify-center">
            {offeredAbilities.map((ability) => {
              const Icon = getAbilityIcon(ability.icon);
              const colors = COLOR_CLASSES[ability.colorScheme] ?? COLOR_CLASSES.cyan;
              return (
                <button
                  key={ability.key}
                  onClick={() => selectAbility(ability.key)}
                  className={`group flex-1 flex flex-col items-center p-5 bg-gradient-to-b ${colors.bg} to-black border ${colors.border} rounded-xl ${colors.hoverBg} hover:scale-105 transition-all ${colors.shadow}`}
                >
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-3 border ${colors.border} bg-black/40`}>
                    <Icon className={`w-8 h-8 ${colors.text} group-hover:scale-110 transition-transform`} />
                  </div>
                  <h3 className="text-lg font-black text-white mb-1 tracking-wider uppercase">{ability.name}</h3>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                    ability.rarity === 'epic' ? 'text-purple-400' :
                    ability.rarity === 'rare' ? 'text-cyan-400' : 'text-gray-400'
                  }`}>{ability.rarity}</div>
                  <p className={`${colors.text} text-center text-xs leading-relaxed opacity-80`}>{ability.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Title Screen */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            }}
          />

          {/* Total Credits Display */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <Wallet className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-black text-xl tracking-widest">{assets?.credits || 0}</span>
            <span className="text-yellow-600 text-xs uppercase tracking-widest">CREDITS</span>
          </div>

          {/* Title */}
          <div className="text-center mb-10 relative">
            <div className="text-xs text-cyan-500 tracking-[0.5em] uppercase mb-3 font-bold">OPERATION XENO</div>
            <h1
              className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-widest select-none"
              style={{
                background: 'linear-gradient(180deg, #e0f2fe 0%, #22d3ee 40%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 30px rgba(6,182,212,0.5))',
              }}
            >
              ALIEN
            </h1>
            <h1
              className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-widest select-none -mt-4"
              style={{
                background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(234,179,8,0.5))',
              }}
            >
              SURVIVOR
            </h1>
            <div className="text-xs text-gray-500 tracking-[0.4em] uppercase mt-3">SURVIVE THE ALIEN HORDE</div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <button
              onClick={handleStartGame}
              className="group flex items-center justify-center gap-3 w-full py-4 font-black text-xl uppercase tracking-widest rounded-lg transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 border-2"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)',
                borderColor: '#22d3ee',
                color: '#22d3ee',
                boxShadow: '0 0 30px rgba(6,182,212,0.3), inset 0 0 30px rgba(6,182,212,0.05)',
              }}
            >
              <Play className="w-6 h-6 fill-current" />
              DEPLOY
            </button>

            <button
              onClick={openShop}
              className="flex items-center justify-center gap-3 w-full py-3 font-bold text-base uppercase tracking-widest rounded-lg transition-all transform hover:scale-105 active:scale-95 border"
              style={{
                background: 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 100%)',
                borderColor: 'rgba(234,179,8,0.5)',
                color: '#fbbf24',
                boxShadow: '0 0 20px rgba(234,179,8,0.15)',
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 bg-purple-950/80 backdrop-blur-md">
          <div className="text-xs text-red-400 tracking-[0.5em] uppercase mb-2 font-bold animate-pulse">CRITICAL ALERT</div>
          <h1
            className="text-5xl md:text-8xl font-black tracking-widest select-none mb-2 text-center animate-pulse"
            style={{
              color: '#f87171',
              textShadow: '0 0 30px rgba(239,68,68,0.8), 0 0 60px rgba(239,68,68,0.4)',
            }}
          >
            {GAME_CONFIG.ui.gameOverTitle}
          </h1>
          <div className="text-gray-500 text-xs tracking-widest mb-8 uppercase">Marine unit KIA</div>

          <div
            className="flex items-center gap-3 mb-10 px-8 py-4 rounded-lg border font-bold text-lg tracking-widest"
            style={{
              background: 'rgba(0,0,0,0.6)',
              borderColor: 'rgba(234,179,8,0.3)',
              color: '#fbbf24',
              boxShadow: '0 0 20px rgba(234,179,8,0.1)',
            }}
          >
            <Zap className="w-6 h-6" />
            <span>{sessionGold}</span>
            <span className="text-yellow-600 text-sm">CREDITS EARNED</span>
          </div>

          <button
            onClick={handleRestartGame}
            className="flex items-center justify-center gap-3 px-8 py-4 font-black text-xl uppercase tracking-widest rounded-lg transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 border-2"
            style={{
              borderColor: '#22d3ee',
              color: '#22d3ee',
              background: 'rgba(6,182,212,0.1)',
              boxShadow: '0 0 25px rgba(6,182,212,0.2)',
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
