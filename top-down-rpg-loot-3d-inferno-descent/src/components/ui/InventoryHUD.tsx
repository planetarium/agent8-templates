import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useInventoryStore } from '../../stores/inventoryStore';

/**
 * InventoryHUD
 * Displays collected fire soul count with volcanic theme.
 * Positioned top-LEFT.
 */
const InventoryHUD: React.FC = () => {
  const souls = useInventoryStore((s) => s.souls);
  const setSouls = useInventoryStore((s) => s.setSouls);
  const prevSouls = useRef(souls);
  const [burst, setBurst] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; value: number }[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const [shopLoading, setShopLoading] = useState(false);

  const { connected, server } = useGameServer();

  // Sync soul count from server on mount
  useEffect(() => {
    if (!connected || !server) return;
    server
      .remoteFunction('getMyAssets', [])
      .then((assets: Record<string, number>) => {
        const serverSouls = assets?.['fire_soul'] ?? 0;
        setSouls(serverSouls);
        prevSouls.current = serverSouls;
      })
      .catch(console.error);
  }, [connected, server, setSouls]);

  useEffect(() => {
    if (souls > prevSouls.current) {
      const gained = souls - prevSouls.current;

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
        background: radial-gradient(ellipse at center, rgba(255,100,0,0.25) 0%, transparent 70%);
        animation: hud-flash 0.35s ease-out forwards;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 380);
    }
    prevSouls.current = souls;
  }, [souls]);

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
        background: 'rgba(30, 8, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 100, 0, 0.4)',
        borderRadius: '40px',
        padding: '8px 16px 8px 10px',
        boxShadow: '0 0 24px rgba(255, 80, 0, 0.25), inset 0 1px 0 rgba(255,200,100,0.1)',
        userSelect: 'none',
        maxWidth: 'calc(100vw - max(28px, env(safe-area-inset-left)) - 70px)',
        flexShrink: 0,
      }}
    >
      {/* Fire soul icon */}
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
          filter: burst ? 'drop-shadow(0 0 10px #ff6600) brightness(1.5)' : 'drop-shadow(0 0 4px #ff4400)',
        }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="soulG1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffdd00" />
              <stop offset="50%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#cc2200" />
            </linearGradient>
          </defs>
          <path d="M12 2C12 2 7 7 7 12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12C17 10.5 16.3 9 15.5 7.8C15.5 7.8 15 9 14 9C14 9 16 4 12 2Z" fill="url(#soulG1)" stroke="#ff8800" strokeWidth="0.3"/>
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
            color: burst ? '#ffcc66' : '#ffaa66',
            letterSpacing: '1px',
            lineHeight: 1,
            transitionProperty: 'color, text-shadow',
            transitionDuration: '0.25s',
            transitionTimingFunction: 'ease',
            textShadow: burst ? '0 0 16px #ff6600, 0 0 30px #ff4400' : '0 0 8px rgba(255,100,0,0.5)',
            minWidth: '24px',
            textAlign: 'center',
          }}
        >
          {souls}
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
              color: '#ffaa44',
              fontSize: '14px',
              fontWeight: 800,
              pointerEvents: 'none',
              animation: 'hud-float-up 0.9s ease-out forwards',
              textShadow: '0 0 8px #ff6600',
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
          color: 'rgba(255, 160, 80, 0.7)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginLeft: '2px',
        }}
      >
        Souls
      </div>

      {/* CrossRamp Shop Button */}
      <button
        onClick={openCrossRampShop}
        disabled={!connected || shopLoading}
        style={{
          marginLeft: '6px',
          padding: '5px 11px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 100, 0, 0.5)',
          background: shopLoading
            ? 'rgba(255, 80, 0, 0.4)'
            : 'linear-gradient(135deg, rgba(255, 80, 0, 0.5), rgba(200, 40, 0, 0.5))',
          color: connected ? '#ffcc88' : 'rgba(255, 160, 80, 0.4)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: connected && !shopLoading ? 'pointer' : 'default',
          boxShadow: connected ? '0 0 12px rgba(255, 80, 0, 0.3)' : 'none',
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
