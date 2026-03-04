import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useInventoryStore } from '../../stores/inventoryStore';

/**
 * InventoryHUD
 * Displays collected crystal count.
 * Positioned top-LEFT to avoid overlapping with the QualitySettingsMenu gear button (top-RIGHT).
 */
const InventoryHUD: React.FC = () => {
  const crystals = useInventoryStore((s) => s.crystals);
  const setCrystals = useInventoryStore((s) => s.setCrystals);
  const prevCrystals = useRef(crystals);
  const [burst, setBurst] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; value: number }[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [shopLoading, setShopLoading] = useState(false);

  const { connected, server } = useGameServer();

  // Sync crystal count from server on mount
  useEffect(() => {
    if (!connected || !server) return;
    server
      .remoteFunction('getMyAssets', [])
      .then((assets: Record<string, number>) => {
        const serverCrystals = assets?.crystal ?? 0;
        setCrystals(serverCrystals);
        prevCrystals.current = serverCrystals;
      })
      .catch(console.error);
  }, [connected, server, setCrystals]);

  useEffect(() => {
    if (crystals > prevCrystals.current) {
      const gained = crystals - prevCrystals.current;

      setBurst(true);
      setTimeout(() => setBurst(false), 400);

      const id = nextId.current++;
      setFloatingTexts((prev) => [...prev, { id, value: gained }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
      }, 900);

      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed; inset: 0; pointer-events: none; z-index: 9999;
        background: radial-gradient(ellipse at center, rgba(100,180,255,0.22) 0%, transparent 70%);
        animation: hud-flash 0.35s ease-out forwards;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 380);
    }
    prevCrystals.current = crystals;
  }, [crystals]);

  const openCrossRampShop = useCallback(async () => {
    if (!connected || !server || shopLoading) return;
    setShopLoading(true);
    try {
      const url = await server.getCrossRampShopUrl('en');
      window.open(url, 'CrossRampShop', 'width=1024,height=768');
    } catch (error) {
      console.error('Failed to open CROSS Mini Hub:', error);
    } finally {
      setShopLoading(false);
    }
  }, [connected, server, shopLoading]);

  return (
    <div
      style={{
        position: 'fixed',
        /* Top-left with safe-area support */
        top: 'max(14px, env(safe-area-inset-top))',
        left: 'max(14px, env(safe-area-inset-left))',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(5, 10, 30, 0.72)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(100, 160, 255, 0.35)',
        borderRadius: '40px',
        padding: '8px 16px 8px 10px',
        boxShadow: '0 0 24px rgba(80, 140, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.07)',
        userSelect: 'none',
        /* Prevent overflow on narrow screens */
        maxWidth: 'calc(100vw - max(28px, env(safe-area-inset-left)) - 70px)',
        flexShrink: 0,
      }}
    >
      {/* Crystal icon */}
      <div
        style={{
          width: 30,
          height: 30,
          position: 'relative',
          flexShrink: 0,
          transitionProperty: 'transform, filter',
          transitionDuration: burst ? '0s' : '0.3s',
          transitionTimingFunction: 'ease',
          transform: burst ? 'scale(1.45) rotate(-8deg)' : 'scale(1) rotate(0deg)',
          filter: burst ? 'drop-shadow(0 0 10px #66aaff) brightness(1.4)' : 'drop-shadow(0 0 4px #4488ff)',
        }}
      >
        <svg viewBox="0 0 36 36" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#aaddff" />
              <stop offset="50%" stopColor="#4488ff" />
              <stop offset="100%" stopColor="#8844cc" />
            </linearGradient>
            <linearGradient id="cg2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#4488ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="18,2 28,12 18,34 8,12" fill="url(#cg1)" />
          <polygon points="18,2 28,12 18,18" fill="url(#cg2)" opacity="0.5" />
          <polygon points="18,2 8,12 18,18" fill="white" opacity="0.15" />
          <polygon points="8,12 18,34 18,18" fill="#2244aa" opacity="0.3" />
          <ellipse cx="14" cy="10" rx="3" ry="2" fill="white" opacity="0.4" transform="rotate(-20 14 10)" />
        </svg>
      </div>

      {/* Count */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div
          ref={counterRef}
          style={{
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            color: burst ? '#aaddff' : '#e8f4ff',
            letterSpacing: '1px',
            lineHeight: 1,
            transitionProperty: 'color, text-shadow',
            transitionDuration: '0.25s',
            transitionTimingFunction: 'ease',
            textShadow: burst ? '0 0 16px #66aaff, 0 0 30px #4488ff' : '0 0 8px rgba(100,160,255,0.5)',
            minWidth: '24px',
            textAlign: 'center',
          }}
        >
          {crystals}
        </div>

        {/* Floating +N texts */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              color: '#88ddff',
              fontSize: '14px',
              fontWeight: 800,
              pointerEvents: 'none',
              animation: 'hud-float-up 0.9s ease-out forwards',
              textShadow: '0 0 8px #4488ff',
              whiteSpace: 'nowrap',
            }}
          >
            +{ft.value}
          </div>
        ))}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'rgba(160, 200, 255, 0.7)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginLeft: '2px',
        }}
      >
        Crystals
      </div>

      {/* CrossRamp Shop Button */}
      <button
        onClick={openCrossRampShop}
        disabled={!connected || shopLoading}
        style={{
          marginLeft: '6px',
          padding: '5px 11px',
          borderRadius: '20px',
          border: '1px solid rgba(160, 100, 255, 0.5)',
          background: shopLoading
            ? 'rgba(80, 40, 140, 0.4)'
            : 'linear-gradient(135deg, rgba(120, 60, 220, 0.6), rgba(80, 40, 160, 0.6))',
          color: connected ? '#ddaaff' : 'rgba(180,150,255,0.4)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: connected && !shopLoading ? 'pointer' : 'default',
          boxShadow: connected ? '0 0 12px rgba(140, 80, 255, 0.3)' : 'none',
          transitionProperty: 'background, color, box-shadow, opacity',
          transitionDuration: '0.2s',
          transitionTimingFunction: 'ease',
          whiteSpace: 'nowrap',
          opacity: connected ? 1 : 0.5,
          /* minimum tap target */
          minHeight: 32,
        }}
      >
        {shopLoading ? '...' : '⇄ Exchange'}
      </button>

      <style>{`
        @keyframes hud-flash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes hud-float-up {
          0%   { opacity: 1;   transform: translateX(-50%) translateY(0px) scale(1.1); }
          60%  { opacity: 1;   transform: translateX(-50%) translateY(-22px) scale(1); }
          100% { opacity: 0;   transform: translateX(-50%) translateY(-38px) scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export default InventoryHUD;
