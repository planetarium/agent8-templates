import React, { useEffect, useState } from "react";
import GameComponent from "./components/GameComponent";
import { useGameServer, useAsset } from "@agent8/gameserver";
import { Coins, Wallet, Play, RotateCcw, Heart, LogOut, X, Check, Zap, Shield, Cpu } from "lucide-react";
import { GAME_CONFIG } from "./config/gameConfig";
import { ABILITIES, type Ability } from "./config/abilities";
import { getAbilityIcon } from "./components/AbilityIcon";

export const gameEvents = new EventTarget();

const COLOR_CLASSES: Record<string, { border: string; bg: string; hoverBg: string; text: string; shadow: string }> = {
  blue: { border: 'border-blue-500', bg: 'from-blue-900/50', hoverBg: 'hover:bg-blue-900/80', text: 'text-blue-400', shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]' },
  green: { border: 'border-green-500', bg: 'from-green-900/50', hoverBg: 'hover:bg-green-900/80', text: 'text-green-400', shadow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]' },
  red: { border: 'border-red-500', bg: 'from-red-900/50', hoverBg: 'hover:bg-red-900/80', text: 'text-red-400', shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]' },
  orange: { border: 'border-orange-500', bg: 'from-orange-900/50', hoverBg: 'hover:bg-orange-900/80', text: 'text-orange-400', shadow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]' },
  cyan: { border: 'border-cyan-400', bg: 'from-cyan-900/50', hoverBg: 'hover:bg-cyan-900/80', text: 'text-cyan-300', shadow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]' },
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
  const JOYSTICK_RADIUS = 70;

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
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white select-none">
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
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-5 py-3 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                {[...Array(health.max)].map((_, i) => (
                  <Shield 
                    key={i} 
                    className={`w-6 h-6 transition-all duration-300 ${i < health.current ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] scale-100' : 'text-gray-800 scale-90'}`} 
                  />
                ))}
              </div>
            </div>

            {/* Top Center: Cores */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col gap-2 items-center pointer-events-auto hud-ui z-20">
              <div className={`flex items-center gap-3 bg-black/80 backdrop-blur-md px-8 py-3 rounded-full border border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.3)] ${goldBounce ? 'scale-110' : 'scale-100'} transition-transform duration-100`}>
                <Cpu className="w-7 h-7 text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 font-black text-3xl tracking-tighter italic">{sessionGold}</span>
              </div>
            </div>

            {/* Top Right: Quit Button */}
            <div className="absolute right-4 top-4 flex flex-col gap-2 pointer-events-auto hud-ui z-20">
              <button 
                onClick={handleOpenQuitModal}
                className="flex items-center justify-center bg-black/80 hover:bg-red-950/80 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:border-red-500/50 transition-all shadow-lg active:scale-95"
              >
                <LogOut className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Bottom Center: Data XP Bar */}
          <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-[85%] max-w-2xl pointer-events-auto hud-ui z-20 ${xpPulse ? 'scale-105' : 'scale-100'} transition-transform duration-100`}>
            <div className="flex items-end justify-between mb-2 px-1">
              <div className="flex flex-col">
                <span className="text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase">Security Level</span>
                <span className="text-white text-2xl font-black italic -mt-1">SYS.L {xp.level}</span>
              </div>
              <span className="text-cyan-200/60 text-xs font-mono">{xp.current} / {xp.max} BITS</span>
            </div>
            <div className="w-full bg-black/80 backdrop-blur-xl rounded-sm h-3 border border-cyan-500/20 p-[2px] overflow-hidden">
              <div 
                className="h-full rounded-sm bg-gradient-to-r from-cyan-600 via-cyan-400 to-white transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.6)]"
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
              <div className="absolute inset-0 rounded-full bg-cyan-900/20 border-2 border-cyan-400/30 shadow-[0_0_30px_rgba(0,240,255,0.1)] backdrop-blur-[2px]" />
              <div className="absolute inset-4 rounded-full border border-cyan-400/10" />
              {/* Stick */}
              <div 
                className="absolute rounded-full bg-gradient-to-br from-white to-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.8)]"
                style={{
                  width: JOYSTICK_RADIUS * 0.7,
                  height: JOYSTICK_RADIUS * 0.7,
                  left: JOYSTICK_RADIUS,
                  top: JOYSTICK_RADIUS,
                  transform: `translate(calc(-50% + ${joystick.currentX - joystick.originX}px), calc(-50% + ${joystick.currentY - joystick.originY}px))`,
                }}
              >
                 <div className="absolute inset-1 rounded-full border-2 border-white/40" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quit Confirmation Modal */}
      {isQuitModalOpen && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl px-4 pointer-events-auto">
          <div className="bg-gray-950 border border-cyan-500/40 rounded-sm p-10 max-w-sm w-full flex flex-col items-center shadow-[0_0_60px_rgba(0,240,255,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <LogOut className="w-20 h-20 text-cyan-400 mb-6 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
            <h2 className="text-4xl font-black text-white mb-2 text-center italic tracking-tighter">{GAME_CONFIG.ui.quitConfirmTitle}</h2>
            <p className="text-cyan-100/60 text-center mb-10 text-sm font-light leading-relaxed px-4">{GAME_CONFIG.ui.quitConfirmMessage}</p>
            
            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={handleConfirmQuit}
                className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95 uppercase tracking-widest italic"
              >
                Terminate
              </button>
              <button 
                onClick={handleCloseQuitModal}
                className="w-full py-4 bg-transparent border border-white/10 hover:border-white/30 text-gray-400 font-bold rounded-sm transition-all active:scale-95 uppercase text-xs tracking-[0.3em]"
              >
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Overlay */}
      {isLevelUp && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl px-4 overflow-y-auto py-10">
          <div className="mb-12 flex flex-col items-center animate-pulse">
            <span className="text-cyan-400 text-xs font-black tracking-[0.5em] uppercase mb-2">Neural Interface Synced</span>
            <h2 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter">
              {GAME_CONFIG.ui.levelUpTitle}
            </h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl justify-center">
            {offeredAbilities.map((ability) => {
              const Icon = getAbilityIcon(ability.icon);
              const colors = COLOR_CLASSES[ability.colorScheme] ?? COLOR_CLASSES.blue;
              return (
                <button
                  key={ability.key}
                  onClick={() => selectAbility(ability.key)}
                  className={`group relative flex-1 flex flex-col items-start p-8 bg-black border ${colors.border}/30 hover:border-${ability.colorScheme}-400 transition-all duration-300 overflow-hidden active:scale-95`}
                >
                   {/* Bg Glow */}
                  <div className={`absolute -right-10 -bottom-10 w-32 h-32 bg-${ability.colorScheme}-500/10 blur-3xl group-hover:bg-${ability.colorScheme}-500/20 transition-colors`} />
                  
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${colors.bg} to-transparent border border-${ability.colorScheme}-400/20 mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-10 h-10 ${colors.text} drop-shadow-[0_0_8px_currentColor]`} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tight">{ability.name}</h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed mb-8">{ability.description}</p>
                  
                  <div className={`mt-auto w-full py-2 border-t border-white/5 flex justify-between items-center`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>{ability.rarity}</span>
                    <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-white animate-ping" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Title Overlay */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.05)_0%,_transparent_70%)]">
          {/* Total Cores Display */}
          <div className="absolute top-10 flex items-center gap-4 bg-black/80 backdrop-blur-md px-8 py-4 rounded-xl border border-cyan-500/20 shadow-2xl">
            <Wallet className="w-6 h-6 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-cyan-400 tracking-[0.3em] uppercase opacity-60">Balance</span>
              <span className="text-white font-black text-2xl tracking-tighter -mt-1">{assets?.gold || 0} <span className="text-xs text-gray-500 ml-1 font-light tracking-widest uppercase">Cores</span></span>
            </div>
          </div>

          <div className="relative mb-16 flex flex-col items-center">
            <div className="absolute -inset-10 bg-cyan-500/10 blur-[100px] animate-pulse rounded-full" />
            <h1 className="text-6xl sm:text-7xl md:text-9xl font-black italic tracking-tighter text-white text-center leading-[0.85] relative">
              NEON<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-[0_0_30px_rgba(0,240,255,0.5)]">HUNTERS</span>
            </h1>
          </div>

          <div className="flex flex-col items-center gap-5 w-full max-w-sm">
            <button
              onClick={handleStartGame}
              className="group relative w-full py-6 bg-white text-black font-black text-2xl rounded-sm shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Play className="w-8 h-8 fill-black" />
              <span>ENGAGE</span>
            </button>
            
            <button
              onClick={openShop}
              className="group w-full py-5 bg-black border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-black text-sm rounded-sm transition-all hover:bg-cyan-950/20 active:scale-95 flex items-center justify-center gap-3 tracking-[0.4em] uppercase italic"
            >
              <Shield className="w-5 h-5 group-hover:animate-spin" />
              Cross Exchange
            </button>
          </div>
          
          <div className="absolute bottom-10 text-[10px] text-gray-600 font-mono tracking-[0.5em] uppercase">
            Protocol v2.0 // Neural Link Active
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 bg-black/95 backdrop-blur-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent animate-pulse" />
          
          <div className="flex flex-col items-center mb-16">
            <h1 className="text-6xl md:text-9xl font-black text-red-600 tracking-tighter italic drop-shadow-[0_0_30px_rgba(220,38,38,0.5)] mb-2 uppercase">
              {GAME_CONFIG.ui.gameOverTitle}
            </h1>
            <span className="text-red-400/50 text-[10px] font-mono tracking-[0.8em] uppercase">Connectivity Interrupted</span>
          </div>

          <div className="bg-gray-950 border border-yellow-500/20 px-12 py-6 rounded-sm mb-12 flex flex-col items-center">
            <span className="text-[8px] text-yellow-500 font-black tracking-[0.4em] uppercase mb-1 opacity-60">Neural Harvest</span>
            <div className="flex items-center gap-3 text-yellow-400 text-4xl font-black italic tracking-tighter">
              <Cpu className="w-8 h-8" />
              <span>{sessionGold} <span className="text-xs uppercase tracking-widest text-yellow-600 ml-1">Cores</span></span>
            </div>
          </div>

          <button
            onClick={handleRestartGame}
            className="group px-12 py-6 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-black text-2xl rounded-sm transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-4 italic uppercase tracking-tighter"
          >
            <RotateCcw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500" />
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
