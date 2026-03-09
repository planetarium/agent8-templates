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
        const serverCrystals = assets?.fairy_seed ?? 0;
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
        background: radial-gradient(ellipse at center, rgba(100,255,150,0.22) 0%, transparent 70%);
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
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(10, 30, 15, 0.72)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(100, 255, 150, 0.35)',
        borderRadius: '40px',
        padding: '8px 16px 8px 10px',
        boxShadow: '0 0 24px rgba(80, 255, 120, 0.2), inset 0 1px 0 rgba(255,255,255,0.07)',
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
          filter: burst ? 'drop-shadow(0 0 10px #ff88cc) brightness(1.4)' : 'drop-shadow(0 0 4px #ff44aa)',
        }}
      >
        <svg viewBox="0 0 36 36" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="14" fill="#ff88cc" opacity="0.8" />
          <circle cx="18" cy="18" r="8" fill="#88ccff" opacity="0.9" />
          <circle cx="14" cy="14" r="3" fill="#ffffff" opacity="0.6" />
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
            color: burst ? '#ffccf0' : '#e8fff4',
            letterSpacing: '1px',
            lineHeight: 1,
            transitionProperty: 'color, text-shadow',
            transitionDuration: '0.25s',
            transitionTimingFunction: 'ease',
            textShadow: burst ? '0 0 16px #ff88cc, 0 0 30px #ff44aa' : '0 0 8px rgba(100,255,150,0.5)',
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
              color: '#ffb8e0',
              fontSize: '14px',
              fontWeight: 800,
              pointerEvents: 'none',
              animation: 'hud-float-up 0.9s ease-out forwards',
              textShadow: '0 0 8px #ff44aa',
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
          color: 'rgba(160, 255, 180, 0.7)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginLeft: '2px',
        }}
      >
        Fairy Seeds
      </div>

      {/* CrossRamp Shop Button */}
      <button
        onClick={openCrossRampShop}
        disabled={!connected || shopLoading}
        style={{
          marginLeft: '6px',
          padding: '5px 11px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 150, 200, 0.5)',
          background: shopLoading
            ? 'rgba(140, 40, 80, 0.4)'
            : 'linear-gradient(135deg, rgba(255, 80, 160, 0.6), rgba(200, 60, 120, 0.6))',
          color: connected ? '#ffb8e0' : 'rgba(255,180,220,0.4)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: connected && !shopLoading ? 'pointer' : 'default',
          boxShadow: connected ? '0 0 12px rgba(255, 80, 160, 0.3)' : 'none',
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
