import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useInventoryStore } from '../../stores/inventoryStore';

/**
 * InventoryHUD
 * Displays collected orb count.
 */
const InventoryHUD: React.FC = () => {
  const crystals = useInventoryStore((s) => s.crystals); // keep using state name but represent orbs
  const setCrystals = useInventoryStore((s) => s.setCrystals);
  const prevCrystals = useRef(crystals);
  const [burst, setBurst] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; value: number }[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [shopLoading, setShopLoading] = useState(false);

  const { connected, server } = useGameServer();

  // Sync orb count from server on mount
  useEffect(() => {
    if (!connected || !server) return;
    server
      .remoteFunction('getMyAssets', [])
      .then((assets: Record<string, number>) => {
        const serverOrbs = assets?.orb ?? 0;
        setCrystals(serverOrbs);
        prevCrystals.current = serverOrbs;
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
        background: radial-gradient(ellipse at center, rgba(150,255,150,0.15) 0%, transparent 70%);
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
        top: 'max(14px, env(safe-area-inset-top))',
        left: 'max(14px, env(safe-area-inset-left))',
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(10, 30, 15, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(100, 255, 100, 0.4)',
        borderRadius: '30px',
        padding: '8px 16px 8px 10px',
        boxShadow: '0 0 20px rgba(50, 200, 50, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
        userSelect: 'none',
        maxWidth: 'calc(100vw - max(28px, env(safe-area-inset-left)) - 70px)',
        flexShrink: 0,
      }}
    >
      {/* Orb icon */}
      <div
        style={{
          width: 28,
          height: 28,
          position: 'relative',
          flexShrink: 0,
          transitionProperty: 'transform, filter',
          transitionDuration: burst ? '0s' : '0.3s',
          transitionTimingFunction: 'ease',
          transform: burst ? 'scale(1.4) rotate(-5deg)' : 'scale(1) rotate(0deg)',
          filter: burst ? 'drop-shadow(0 0 15px #ffb3ff) brightness(1.3)' : 'drop-shadow(0 0 8px #d24dff)',
        }}
      >
        <svg viewBox="0 0 40 40" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="iconGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffccff" />
              <stop offset="60%" stopColor="#d24dff" />
              <stop offset="100%" stopColor="#8600b3" />
            </radialGradient>
          </defs>
          <circle cx="20" cy="20" r="16" fill="url(#iconGrad)" />
          <circle cx="15" cy="15" r="5" fill="white" opacity="0.6" filter="blur(1px)" />
        </svg>
      </div>

      {/* Count */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div
          ref={counterRef}
          style={{
            fontSize: '20px',
            fontWeight: 800,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            color: burst ? '#ffffff' : '#e6ffe6',
            letterSpacing: '1px',
            lineHeight: 1,
            transitionProperty: 'color, text-shadow',
            transitionDuration: '0.2s',
            transitionTimingFunction: 'ease',
            textShadow: burst ? '0 0 15px #ffb3ff, 0 0 25px #d24dff' : '0 0 8px rgba(100,255,100,0.4)',
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
              color: '#ffb3ff',
              fontSize: '15px',
              fontWeight: 800,
              pointerEvents: 'none',
              animation: 'hud-float-up 0.9s ease-out forwards',
              textShadow: '0 0 10px #d24dff',
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
          fontSize: '11px',
          fontWeight: 700,
          color: 'rgba(150, 255, 150, 0.8)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginLeft: '4px',
        }}
      >
        Orbs
      </div>

      {/* CrossRamp Shop Button */}
      <button
        onClick={openCrossRampShop}
        disabled={!connected || shopLoading}
        style={{
          marginLeft: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid rgba(210, 77, 255, 0.6)',
          background: shopLoading
            ? 'rgba(60, 20, 60, 0.5)'
            : 'linear-gradient(135deg, rgba(217, 70, 239, 0.8), rgba(168, 85, 247, 0.8))',
          color: connected ? '#ffffff' : 'rgba(255,200,255,0.5)',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: connected && !shopLoading ? 'pointer' : 'default',
          boxShadow: connected ? '0 0 15px rgba(217, 70, 239, 0.4)' : 'none',
          transitionProperty: 'background, color, box-shadow, opacity',
          transitionDuration: '0.2s',
          transitionTimingFunction: 'ease',
          whiteSpace: 'nowrap',
          opacity: connected ? 1 : 0.6,
          minHeight: 34,
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
          60%  { opacity: 1;   transform: translateX(-50%) translateY(-24px) scale(1); }
          100% { opacity: 0;   transform: translateX(-50%) translateY(-40px) scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export default InventoryHUD;