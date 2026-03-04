import React, { useEffect, useRef, useState } from 'react';
import { useGameServer } from '@agent8/gameserver';
import { useGameStore } from '../../stores/gameStore';

/**
 * CrossRampOverlay — embeds the CROSS Mini Hub in a fullscreen iframe.
 * [CHANGE] Update back-button label and logo to match your concept.
 */
const CrossRampOverlay: React.FC = () => {
  const { server } = useGameServer();
  const { setGamePhase } = useGameStore();
  const [shopUrl, setShopUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!server?.getCrossRampShopUrl) { setError('CROSS Mini Hub not available'); setLoading(false); return; }
    server.getCrossRampShopUrl()
      .then((url: string) => { setShopUrl(url); setLoading(false); })
      .catch(() => { setError('Failed to load CROSS Mini Hub'); setLoading(false); });
  }, [server]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: '#0d0a1a' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          background: 'rgba(26,15,46,0.95)',
          borderBottom: '1px solid rgba(176,122,255,0.2)',
          gap: '0.75rem',
        }}
      >
        <button
          onClick={() => setGamePhase('wallet')}
          style={{
            background: 'transparent',
            color: '#b07aff',
            border: '1px solid rgba(176,122,255,0.4)',
            borderRadius: '6px',
            padding: '0.4rem 0.9rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <span style={{ color: '#b07aff', fontWeight: 'bold', fontSize: '1rem' }}>◆ CROSS Mini Hub</span>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: '#0d0a1a', color: '#b07aff' }}
          >
            <div>Loading CROSS Mini Hub...</div>
          </div>
        )}
        {error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{ background: '#0d0a1a', color: '#ff4466' }}
          >
            <p>{error}</p>
            <button
              onClick={() => setGamePhase('wallet')}
              style={{
                background: 'transparent',
                color: '#b07aff',
                border: '1px solid rgba(176,122,255,0.4)',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
              }}
            >
              ← Go Back
            </button>
          </div>
        )}
        {shopUrl && !error && (
          <iframe
            ref={iframeRef}
            src={shopUrl}
            className="w-full h-full"
            style={{ border: 'none' }}
            title="CROSS Mini Hub"
          />
        )}
      </div>
    </div>
  );
};

export default CrossRampOverlay;
