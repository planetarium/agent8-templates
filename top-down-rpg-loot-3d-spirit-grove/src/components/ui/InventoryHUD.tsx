import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useInventoryStore } from '../../stores/inventoryStore';

/**
 * InventoryHUD - Spirit Grove style
 * Displays collected Spirit Rune count with fantasy forest aesthetics.
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

  useEffect(() => {
    if (!connected || !server) return;
    server
      .remoteFunction('getMyAssets', [])
      .then((assets: Record<string, number>) => {
        const serverCores = assets?.['star_shard'] ?? 0;
        setCrystals(serverCores);
        prevCrystals.current = serverCores;
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
        background: radial-gradient(ellipse at center, rgba(196,162,101,0.15) 0%, transparent 70%);
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
        background: 'rgba(13, 26, 13, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(196, 162, 101, 0.25)',
        borderRadius: '10px',
        padding: '8px 16px 8px 10px',
        boxShadow: '0 0 20px rgba(107, 143, 78, 0.1), inset 0 0 15px rgba(196, 162, 101, 0.03)',
        userSelect: 'none',
        maxWidth: 'calc(100vw - max(28px, env(safe-area-inset-left)) - 70px)',
        flexShrink: 0,
        fontFamily: "'Philosopher', serif",
      }}
    >
      {/* Rune icon - leaf/crystal shape */}
      <div
        style={{
          width: 28,
          height: 28,
          position: 'relative',
          flexShrink: 0,
          transitionProperty: 'transform, filter',
          transitionDuration: burst ? '0s' : '0.3s',
          transitionTimingFunction: 'ease',
          transform: burst ? 'scale(1.45) rotate(30deg)' : 'scale(1) rotate(0deg)',
          filter: burst ? 'drop-shadow(0 0 12px #c4a265) brightness(1.5)' : 'drop-shadow(0 0 6px rgba(196,162,101,0.5))',
        }}
      >
        <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="runeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4a265" />
              <stop offset="50%" stopColor="#6b8f4e" />
              <stop offset="100%" stopColor="#c4a265" />
            </linearGradient>
          </defs>
          <path d="M12 2 L20 8 L20 16 L12 22 L4 16 L4 8 Z" fill="url(#runeGrad)" stroke="#c4a265" strokeWidth="0.5" opacity="0.9"/>
          <path d="M12 6 L17 10 L17 14 L12 18 L7 14 L7 10 Z" fill="none" stroke="#e8d5a3" strokeWidth="0.5" opacity="0.5"/>
          <line x1="12" y1="2" x2="12" y2="22" stroke="#e8d5a3" strokeWidth="0.3" opacity="0.3"/>
          <line x1="4" y1="12" x2="20" y2="12" stroke="#e8d5a3" strokeWidth="0.3" opacity="0.3"/>
        </svg>
      </div>

      {/* Count */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div
          ref={counterRef}
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: burst ? '#e8d5a3' : '#c4a265',
            letterSpacing: '2px',
            lineHeight: 1,
            transitionProperty: 'color, text-shadow',
            transitionDuration: '0.25s',
            transitionTimingFunction: 'ease',
            textShadow: burst ? '0 0 16px #c4a265, 0 0 30px #c4a265' : '0 0 8px rgba(196,162,101,0.4)',
            minWidth: '24px',
            textAlign: 'center',
            fontFamily: "'Cinzel', serif",
          }}
        >
          {crystals}
        </div>

        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '100%',
              transform: 'translateX(-50%)',
              color: '#6b8f4e',
              fontSize: '14px',
              fontWeight: 800,
              pointerEvents: 'none',
              animation: 'hud-float-up 0.9s ease-out forwards',
              textShadow: '0 0 8px rgba(107,143,78,0.6)',
              whiteSpace: 'nowrap',
              fontFamily: "'Cinzel', serif",
            }}
          >
            +{ft.value}
          </div>
        ))}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: '9px',
          fontWeight: 600,
          color: 'rgba(107, 143, 78, 0.7)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginLeft: '2px',
          fontFamily: "'Cinzel', serif",
        }}
      >
        RUNES
      </div>

      {/* Spirit Exchange Button */}
      <button
        onClick={openCrossRampShop}
        disabled={!connected || shopLoading}
        style={{
          marginLeft: '6px',
          padding: '5px 11px',
          borderRadius: '6px',
          border: '1px solid rgba(196, 162, 101, 0.3)',
          background: shopLoading
            ? 'rgba(196, 162, 101, 0.2)'
            : 'rgba(196, 162, 101, 0.08)',
          color: connected ? '#c4a265' : 'rgba(196, 162, 101, 0.3)',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          cursor: connected && !shopLoading ? 'pointer' : 'default',
          boxShadow: connected ? '0 0 10px rgba(196, 162, 101, 0.1)' : 'none',
          transitionProperty: 'background, color, box-shadow, opacity',
          transitionDuration: '0.2s',
          transitionTimingFunction: 'ease',
          whiteSpace: 'nowrap',
          opacity: connected ? 1 : 0.5,
          minHeight: 32,
          fontFamily: "'Cinzel', serif",
        }}
      >
        {shopLoading ? '...' : 'TRADE'}
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
