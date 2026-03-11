import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useInventoryStore } from '../../stores/inventoryStore';

/**
 * InventoryHUD
 * Displays collected starflower count with frost theme.
 * Positioned top-LEFT.
 */
const InventoryHUD: React.FC = () => {
  const flowers = useInventoryStore((s) => s.flowers);
  const setFlowers = useInventoryStore((s) => s.setFlowers);
  const prevFlowers = useRef(flowers);
  const [burst, setBurst] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; value: number }[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [shopLoading, setShopLoading] = useState(false);

  const { connected, server } = useGameServer();

  // Sync flower count from server on mount
  useEffect(() => {
    if (!connected || !server) return;
    server
      .remoteFunction('getMyAssets', [])
      .then((assets: Record<string, number>) => {
        const serverFlowers = assets?.['starflower'] ?? 0;
        setFlowers(serverFlowers);
        prevFlowers.current = serverFlowers;
      })
      .catch(console.error);
  }, [connected, server, setFlowers]);

  useEffect(() => {
    if (flowers > prevFlowers.current) {
      const gained = flowers - prevFlowers.current;

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
        background: radial-gradient(ellipse at center, rgba(100,180,255,0.2) 0%, transparent 70%);
        animation: hud-flash 0.35s ease-out forwards;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 380);
    }
    prevFlowers.current = flowers;
  }, [flowers]);

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
        top: 'max(14px, env(safe-area-inset-top))',
        left: 'max(14px, env(safe-area-inset-left))',
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(10, 20, 45, 0.78)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(130, 200, 255, 0.3)',
        borderRadius: '40px',
        padding: '8px 16px 8px 10px',
        boxShadow: '0 0 24px rgba(80, 160, 240, 0.15), inset 0 1px 0 rgba(180,220,255,0.08)',
        userSelect: 'none',
        maxWidth: 'calc(100vw - max(28px, env(safe-area-inset-left)) - 70px)',
        flexShrink: 0,
      }}
    >
      {/* Starflower icon */}
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
          filter: burst ? 'drop-shadow(0 0 10px #44aaff) brightness(1.5)' : 'drop-shadow(0 0 4px #4488cc)',
        }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="crystalG1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c8e8ff" />
              <stop offset="50%" stopColor="#44aaff" />
              <stop offset="100%" stopColor="#2266aa" />
            </linearGradient>
          </defs>
          <path d="M12 2L14 8L20 8L15 12L17 18L12 14L7 18L9 12L4 8L10 8Z" fill="url(#crystalG1)" stroke="#66bbee" strokeWidth="0.3"/>
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
            color: burst ? '#aaddff' : '#88ccff',
            letterSpacing: '1px',
            lineHeight: 1,
            transitionProperty: 'color, text-shadow',
            transitionDuration: '0.25s',
            transitionTimingFunction: 'ease',
            textShadow: burst ? '0 0 16px #44aaff, 0 0 30px #2288cc' : '0 0 8px rgba(100,180,255,0.4)',
            minWidth: '24px',
            textAlign: 'center',
          }}
        >
          {flowers}
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
              textShadow: '0 0 8px #44aaff',
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
          color: 'rgba(130, 200, 255, 0.6)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginLeft: '2px',
        }}
      >
        Stars
      </div>

      {/* CrossRamp Shop Button */}
      <button
        onClick={openCrossRampShop}
        disabled={!connected || shopLoading}
        style={{
          marginLeft: '6px',
          padding: '5px 11px',
          borderRadius: '20px',
          border: '1px solid rgba(130, 200, 255, 0.4)',
          background: shopLoading
            ? 'rgba(80, 160, 240, 0.3)'
            : 'linear-gradient(135deg, rgba(60, 140, 220, 0.4), rgba(40, 100, 180, 0.4))',
          color: connected ? '#aaddff' : 'rgba(130, 200, 255, 0.35)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: connected && !shopLoading ? 'pointer' : 'default',
          boxShadow: connected ? '0 0 12px rgba(80, 160, 240, 0.2)' : 'none',
          transitionProperty: 'background, color, box-shadow, opacity',
          transitionDuration: '0.2s',
          transitionTimingFunction: 'ease',
          whiteSpace: 'nowrap',
          opacity: connected ? 1 : 0.5,
          minHeight: 32,
        }}
      >
        {shopLoading ? '...' : 'EXCHANGE'}
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
