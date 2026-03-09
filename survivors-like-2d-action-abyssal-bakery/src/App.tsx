import React, { useEffect, useState } from "react";
import GameComponent from "./components/GameComponent";
import { useGameServer, useAsset } from "@agent8/gameserver";
import { Sparkles, Wallet, Play, RotateCcw, Heart, LogOut, X, Check } from "lucide-react";
import { GAME_CONFIG } from "./config/gameConfig";
import { ABILITIES, type Ability } from "./config/abilities";
import { getAbilityIcon } from "./components/AbilityIcon";

export const gameEvents = new EventTarget();

const COLOR_CLASSES: Record<string, { border: string; bg: string; hoverBg: string; text: string; shadow: string }> = {
  blue: { border: 'border-blue-400', bg: 'from-blue-900/60', hoverBg: 'hover:bg-blue-800/80', text: 'text-blue-200', shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.4)]' },
  green: { border: 'border-green-400', bg: 'from-green-900/60', hoverBg: 'hover:bg-green-800/80', text: 'text-green-200', shadow: 'shadow-[0_0_30px_rgba(34,197,94,0.4)]' },
  red: { border: 'border-pink-500', bg: 'from-pink-900/60', hoverBg: 'hover:bg-pink-800/80', text: 'text-pink-200', shadow: 'shadow-[0_0_30px_rgba(236,72,153,0.4)]' },
  orange: { border: 'border-orange-400', bg: 'from-orange-900/60', hoverBg: 'hover:bg-orange-800/80', text: 'text-orange-200', shadow: 'shadow-[0_0_30px_rgba(249,115,22,0.4)]' },
  cyan: { border: 'border-cyan-400', bg: 'from-cyan-900/60', hoverBg: 'hover:bg-cyan-800/80', text: 'text-cyan-200', shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]' },
  purple: { border: 'border-purple-400', bg: 'from-purple-900/60', hoverBg: 'hover:bg-purple-800/80', text: 'text-purple-200', shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]' },
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
    <div className="relative w-full h-screen overflow-hidden bg-pink-950 font-sans text-white">
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
            {/* Top Left: Health */}
            <div className="absolute left-4 top-4 flex flex-col gap-2 pointer-events-auto hud-ui z-20">
              <div className="flex items-center gap-1 bg-pink-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-pink-400/30">
                {[...Array(health.max)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`w-6 h-6 transition-all duration-300 ${i < health.current ? 'fill-red-400 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] scale-100' : 'text-pink-900 scale-90'}`} 
                  />
                ))}
              </div>
            </div>

            {/* Top Center: Flour (Gold) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col gap-2 items-center pointer-events-auto hud-ui z-20">
              <div className={`flex items-center gap-2 bg-pink-900/60 backdrop-blur-md px-6 py-2 rounded-full border border-pink-400/40 shadow-[0_0_15px_rgba(244,114,182,0.3)] ${goldBounce ? 'scale-110' : 'scale-100'} transition-transform`}>
                <Sparkles className="w-6 h-6 text-pink-300" />
                <span className="text-pink-100 font-bold text-2xl">{sessionGold}</span>
              </div>
            </div>

            {/* Top Right: Quit Button */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 pointer-events-auto hud-ui z-20">
              <button 
                onClick={handleOpenQuitModal}
                className="flex items-center justify-center bg-pink-900/60 hover:bg-pink-700/80 backdrop-blur-md p-3 rounded-full border border-pink-400/30 hover:border-pink-300 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.3)]"
              >
                <LogOut className="w-6 h-6 text-pink-200" />
              </button>
            </div>
          </div>

          {/* Bottom Center: XP Bar */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-64 md:w-96 md:w-[600px] pointer-events-auto hud-ui z-20 ${xpPulse ? 'scale-105' : 'scale-100'} transition-transform`}>
            <div className="flex items-center justify-between text-pink-100 text-xs font-bold mb-2 drop-shadow-md px-2">
              <span className="text-pink-300 tracking-wider">LEVEL {xp.level}</span>
              <span className="text-pink-200">{xp.current} / {xp.max} XP</span>
            </div>
            <div className="w-full bg-pink-950/80 backdrop-blur-md rounded-full h-5 border border-pink-500/40 overflow-hidden shadow-[0_0_15px_rgba(236,72,153,0.3)] p-0.5">
              <div 
                className="bg-gradient-to-r from-pink-600 via-pink-400 to-white h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(244,114,182,0.8)]"
                style={{ width: `${Math.min((xp.current / xp.max) * 100, 100)}%` }}
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
              {/* Base */}
              <div className="absolute inset-0 rounded-full bg-pink-500/10 border-2 border-pink-400/30 shadow-[0_0_20px_rgba(244,114,182,0.2)] backdrop-blur-sm" />
              {/* Stick */}
              <div 
                className="absolute rounded-full bg-pink-100 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                style={{
                  width: JOYSTICK_RADIUS * 0.8,
                  height: JOYSTICK_RADIUS * 0.8,
                  left: JOYSTICK_RADIUS,
                  top: JOYSTICK_RADIUS,
                  transform: `translate(calc(-50% + ${joystick.currentX - joystick.originX}px), calc(-50% + ${joystick.currentY - joystick.originY}px))`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Quit Confirmation Modal */}
      {isQuitModalOpen && gameState === 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md px-4 pointer-events-auto hud-ui">
          <div className="bg-pink-950 border-4 border-pink-500 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center shadow-[0_0_50px_rgba(236,72,153,0.4)]">
            <LogOut className="w-16 h-16 text-pink-400 mb-6" />
            <h2 className="text-3xl font-black text-pink-100 mb-2 text-center">{GAME_CONFIG.ui.quitConfirmTitle}</h2>
            <p className="text-pink-300 text-center mb-8">{GAME_CONFIG.ui.quitConfirmMessage}</p>
            
            <div className="flex gap-4 w-full">
              <button 
                onClick={handleCloseQuitModal}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-pink-900 hover:bg-pink-800 text-pink-100 font-bold rounded-xl transition-colors"
              >
                <X className="w-5 h-5" /> Back to Kitchen
              </button>
              <button 
                onClick={handleConfirmQuit}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-colors"
              >
                <Check className="w-5 h-5" /> Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Overlay */}
      {isLevelUp && gameState === 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-pink-950/80 backdrop-blur-md px-4">
          <h2
            className="text-6xl md:text-8xl font-black mb-10 drop-shadow-[0_0_20px_rgba(244,114,182,0.8)] animate-bounce text-center"
            style={{ color: GAME_CONFIG.ui.accentColor, WebkitTextStroke: '2px #831843' }}
          >
            {GAME_CONFIG.ui.levelUpTitle}
          </h2>
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center">
            {offeredAbilities.map((ability) => {
              const Icon = getAbilityIcon(ability.icon);
              const colors = COLOR_CLASSES[ability.colorScheme] ?? COLOR_CLASSES.red;
              return (
                <button
                  key={ability.key}
                  onClick={() => selectAbility(ability.key)}
                  className={`group flex-1 flex flex-col items-center p-6 bg-gradient-to-b ${colors.bg} to-pink-950 border-4 ${colors.border} rounded-3xl ${colors.hoverBg} hover:-translate-y-2 transition-all ${colors.shadow} hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]`}
                >
                  <Icon className={`w-12 h-12 md:w-16 md:h-16 ${colors.text} mb-4 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-xl md:text-2xl font-black text-pink-50 mb-2">{ability.name}</h3>
                  <p className={`text-pink-200 text-center text-sm font-medium leading-snug`}>{ability.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Title Overlay */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
          {/* Total Gold Display */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-pink-900/80 backdrop-blur-md px-6 py-2 md:px-8 md:py-3 rounded-full border-2 border-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.4)]">
            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-pink-300" />
            <span className="text-pink-100 font-black text-xl md:text-2xl">{assets?.magic_flour || 0}</span>
          </div>

          <h1
            className={`text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${GAME_CONFIG.ui.titleGradient} drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mb-8 md:mb-12 text-center select-none w-full`}
            style={{ WebkitTextStroke: '2px #831843' }}
          >
            {GAME_CONFIG.name.replace(GAME_CONFIG.subtitle, '').trim() || GAME_CONFIG.name.split(' ')[0]}
            <br />
            <span className="text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,0.8)]">{GAME_CONFIG.subtitle}</span>
          </h1>
          <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-xs md:max-w-none">
            <button
              onClick={handleStartGame}
              className="group flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-pink-500 text-white font-black text-xl md:text-2xl rounded-full shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:shadow-[0_0_50px_rgba(236,72,153,0.8)] hover:bg-pink-400 transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 w-full justify-center"
            >
              <Play className="w-6 h-6 md:w-8 md:h-8 fill-white" />
              START BAKING
            </button>
            <button
              onClick={openShop}
              className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-pink-900 border-2 border-pink-400 hover:bg-pink-800 text-pink-100 font-extrabold text-lg md:text-xl rounded-full shadow-[0_0_20px_rgba(244,114,182,0.3)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider w-full justify-center"
            >
              <Wallet className="w-5 h-5 md:w-6 md:h-6" />
              CROSS EXCHANGE
            </button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'GAMEOVER' && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center px-4 ${GAME_CONFIG.ui.gameOverBgClass} backdrop-blur-md`}>
          <h1 className="text-5xl md:text-8xl font-black text-pink-400 tracking-widest drop-shadow-[0_0_20px_rgba(244,114,182,0.8)] mb-4 select-none animate-pulse text-center">
            {GAME_CONFIG.ui.gameOverTitle}
          </h1>
          <div
            className="flex items-center gap-2 md:gap-3 mb-6 md:mb-12 text-lg md:text-2xl font-bold bg-pink-950/80 px-4 md:px-8 py-2 md:py-4 rounded-full border shadow-[0_0_15px_rgba(244,114,182,0.2)]"
            style={{ color: GAME_CONFIG.ui.accentColor, borderColor: `${GAME_CONFIG.ui.accentColor}40` }}
          >
            <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
            <span>Harvested {GAME_CONFIG.ui.currencyLabel}: {sessionGold}</span>
          </div>
          <button
            onClick={handleRestartGame}
            className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-transparent border-4 border-pink-400 text-pink-200 hover:bg-pink-400 hover:text-pink-950 font-black text-lg md:text-2xl rounded-full transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-6 h-6 md:w-8 md:h-8" />
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