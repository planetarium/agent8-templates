import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useInventoryStore } from '../../stores/inventoryStore';

const InventoryHUD: React.FC = () => {
  const dataFragments = useInventoryStore((s) => s.dataFragments);
  const setDataFragments = useInventoryStore((s) => s.setDataFragments);
  const prevFragments = useRef(dataFragments);
  const [burst, setBurst] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; value: number }[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [shopLoading, setShopLoading] = useState(false);

  const { connected, server } = useGameServer();

  useEffect(() => {
    if (!connected || !server) return;
    server
      .remoteFunction('getMyAssets', [])
      .then((assets: Record<string, number>) => {
        const serverFragments = assets?.['data_fragment'] ?? 0;
        setDataFragments(serverFragments);
        prevFragments.current = serverFragments;
      })
      .catch(console.error);
  }, [connected, server, setDataFragments]);

  useEffect(() => {
    if (dataFragments > prevFragments.current) {
      const gained = dataFragments - prevFragments.current;
      setBurst(true);
      setTimeout(() => setBurst(false), 400);
      const id = nextId.current++;
      setFloatingTexts((prev) => [...prev, { id, value: gained }]);
      setTimeout(() => setFloatingTexts((prev) => prev.filter((t) => t.id !== id)), 900);
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed; inset: 0; pointer-events: none; z-index: 9999;
        background: radial-gradient(ellipse at center, rgba(255,0,255,0.18) 0%, transparent 70%);
        animation: hud-flash 0.35s ease-out forwards;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 380);
    }
    prevFragments.current = dataFragments;
  }, [dataFragments]);

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
        background: 'rgba(10, 0, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 0, 255, 0.3)',
        padding: '8px 16px 8px 10px',
        boxShadow: '0 0 20px rgba(255, 0, 255, 0.15), inset 0 0 10px rgba(0,255,255,0.05)',
        userSelect: 'none',
        maxWidth: 'calc(100vw - max(28px, env(safe-area-inset-left)) - 70px)',
        flexShrink: 0,
        fontFamily: "'Orbitron', system-ui, sans-serif",
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
      }}
    >
      {/* Data fragment icon */}
      <div
        style={{
          width: 28,
          height: 28,
          position: 'relative',
          flexShrink: 0,
          transitionProperty: 'transform, filter',
          transitionDuration: burst ? '0s' : '0.3s',
          transform: burst ? 'scale(1.45) rotate(-8deg)' : 'scale(1) rotate(0deg)',
          filter: burst ? 'drop-shadow(0 0 10px #ff00ff) brightness(1.5)' : 'drop-shadow(0 0 4px #ff00ff)',
        }}
      >
        <svg viewBox="0 0 28 28" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
          <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" fill="none" stroke="#ff00ff" strokeWidth="1.5" />
          <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" fill="rgba(0,255,255,0.2)" stroke="#00ffff" strokeWidth="0.8" />
          <circle cx="14" cy="14" r="3" fill="#ff00ff" opacity="0.9" />
        </svg>
      </div>

      {/* Count */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div
          ref={counterRef}
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: burst ? '#ff66ff' : '#fff',
            letterSpacing: '2px',
            lineHeight: 1,
            transitionProperty: 'color, text-shadow',
            transitionDuration: '0.25s',
            textShadow: burst ? '0 0 16px #ff00ff, 0 0 30px #ff00ff' : '0 0 8px rgba(255,0,255,0.5)',
            minWidth: '24px',
            textAlign: 'center',
          }}
        >
          {dataFragments}
        </div>
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              color: '#00ffff',
              fontSize: '13px',
              fontWeight: 800,
              pointerEvents: 'none',
              animation: 'hud-float-up 0.9s ease-out forwards',
              textShadow: '0 0 8px #00ffff',
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
          fontSize: '8px',
          fontWeight: 600,
          color: 'rgba(0, 255, 255, 0.6)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginLeft: '2px',
        }}
      >
        DATA
      </div>

      {/* CrossRamp Shop Button */}
      <button
        onClick={openCrossRampShop}
        disabled={!connected || shopLoading}
        style={{
          marginLeft: '6px',
          padding: '5px 11px',
          border: '1px solid rgba(255, 0, 255, 0.4)',
          background: shopLoading
            ? 'rgba(255, 0, 255, 0.3)'
            : 'linear-gradient(135deg, rgba(255, 0, 255, 0.3), rgba(0, 255, 255, 0.2))',
          color: connected ? '#00ffff' : 'rgba(0, 255, 255, 0.3)',
          fontSize: '8px',
          fontWeight: 700,
          fontFamily: "'Orbitron', system-ui, sans-serif",
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: connected && !shopLoading ? 'pointer' : 'default',
          boxShadow: connected ? '0 0 10px rgba(255, 0, 255, 0.2)' : 'none',
          transitionProperty: 'background, color, box-shadow, opacity',
          transitionDuration: '0.2s',
          whiteSpace: 'nowrap',
          opacity: connected ? 1 : 0.4,
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
