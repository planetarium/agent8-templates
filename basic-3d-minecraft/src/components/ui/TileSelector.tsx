import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useCubeStore from '../../stores/cubeStore';
import SingleCube from '../r3f/SingleCube';
import { THEMES, THEME_NAMES, THEME_ICONS, THEME_DESCRIPTIONS } from '../../constants/themes';
import { getTileTypeFromIndex } from '../../utils/colorUtils';

/**
 * Single tile rendering component
 */
const TileItem = ({ tileIndex, isSelected, onClick }: { tileIndex: number; isSelected: boolean; onClick: () => void }) => {
  const actualTileType = getTileTypeFromIndex(tileIndex);

  const scale = isSelected ? 0.8 : 0.6;
  const size = isSelected ? 'w-[100px] h-[100px]' : 'w-[70px] h-[70px]';
  const border = isSelected ? 'border-4 border-white shadow-lg' : 'border-2 border-[#313a40]';
  const transform = isSelected ? '-translate-y-2' : '';

  return (
    <div
      className={`
        relative ${size} ${border} ${transform}
        bg-[#222222] rounded
        cursor-pointer
        transition-all duration-200
        flex items-center justify-center
        mx-1
        z-10
      `}
      title={`Tile ${tileIndex} (Type: ${actualTileType})`}
      onClick={onClick}
    >
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 3], fov: 40 }} dpr={[1, 2]}>
          <color attach="background" args={['#222222']} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, 3, 3]} intensity={0.8} />
          <SingleCube tileIndex={tileIndex} scale={scale} rotation={[0.5, 0.8, 0]} />
          {isSelected && <OrbitControls enableZoom={false} enablePan={false} />}
        </Canvas>
      </div>

      {/* Display tile index */}
      <div
        className={`
        absolute ${isSelected ? '-top-6' : 'bottom-[-18px]'}
        left-1/2 transform -translate-x-1/2
        bg-[#1d1c21] text-white
        px-2 py-0.5 rounded
        text-sm font-bold
      `}
      >
        {tileIndex}
      </div>
    </div>
  );
};

/**
 * Theme item component
 */
const ThemeItem = ({ theme, isSelected, onClick }: { theme: THEMES; isSelected: boolean; onClick: () => void }) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        p-4 rounded-lg cursor-pointer
        transition-all duration-200
        ${isSelected ? 'bg-white text-black shadow-lg' : 'bg-[#313a40] text-white hover:bg-[#474f52]'}
      `}
      onClick={onClick}
    >
      <div className="text-2xl mb-1">{THEME_ICONS[theme]}</div>
      <div className="text-sm font-bold">{THEME_NAMES[theme]}</div>
    </div>
  );
};

/**
 * Tile selector component
 */
const TileSelector: React.FC = () => {
  const tileStore = useCubeStore();
  const { selectedTile, setSelectedTile, availableTiles, regenerateTerrain, selectedTheme, setSelectedTheme } = tileStore;

  // Theme selection mode (false: tile selection mode, true: theme selection mode)
  const [showThemes, setShowThemes] = useState(false);

  // State for seed input and terrain generation
  const [customSeed, setCustomSeed] = useState(tileStore.seed);

  // List of available tiles
  const tileOptions = availableTiles || [];

  // Tile index related
  const currentTileIndex = useMemo(() => {
    if (availableTiles.length === 0) return 0;
    const index = availableTiles.indexOf(selectedTile);
    return index >= 0 ? index : 0;
  }, [selectedTile, availableTiles]);

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (showThemes) {
        // In theme selection mode, press ESC or T to switch to tile selection mode
        if (e.key === 'Escape' || e.key === 't' || e.key === 'T') {
          e.preventDefault();
          setShowThemes(false);
        }
      } else {
        // Tile selection mode
        if (e.key === 'q' || e.key === 'Q') {
          // Previous tile
          e.preventDefault();
          if (availableTiles.length > 0) {
            const newIndex = (currentTileIndex - 1 + availableTiles.length) % availableTiles.length;
            setSelectedTile(availableTiles[newIndex]);
          }
        } else if (e.key === 'e' || e.key === 'E') {
          // Next tile
          e.preventDefault();
          if (availableTiles.length > 0) {
            const newIndex = (currentTileIndex + 1) % availableTiles.length;
            setSelectedTile(availableTiles[newIndex]);
          }
        } else if (e.key === 't' || e.key === 'T') {
          // Switch to theme selection mode
          e.preventDefault();
          setShowThemes(true);
        }
      }
    },
    [showThemes, currentTileIndex, availableTiles, setSelectedTile],
  );

  // Register keyboard event
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Theme selection handler
  const handleThemeSelect = useCallback(
    (theme: THEMES) => {
      setSelectedTheme(theme);
      setShowThemes(false);
    },
    [setSelectedTheme],
  );

  // Tiles to display (current selected tile and two on each side, total 5)
  const displayTiles = useMemo(() => {
    if (availableTiles.length === 0) return [];

    // If there are 5 or fewer tiles, display all of them
    if (availableTiles.length <= 5) {
      return availableTiles;
    }

    const tiles = [];
    // Display current selected tile and two on each side (total 5)
    for (let i = -2; i <= 2; i++) {
      const idx = (currentTileIndex + i + availableTiles.length) % availableTiles.length;
      tiles.push(availableTiles[idx]);
    }
    return tiles;
  }, [availableTiles, currentTileIndex]);

  // Terrain regeneration function
  const handleRegenerateTerrain = () => {
    regenerateTerrain(customSeed);
  };

  // Theme selection mode rendering
  if (showThemes) {
    return (
      <div className="fixed left-1/2 bottom-5 transform -translate-x-1/2 bg-black/90 p-3 rounded-lg border-2 border-[#313a40] shadow-lg z-50 min-w-[450px] max-w-[550px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-bold text-white">Select Theme</h3>
          <button className="px-2 py-1 text-sm bg-[#313a40] hover:bg-[#474f52] text-white rounded" onClick={() => setShowThemes(false)}>
            Close (T)
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {Object.values(THEMES).map((theme) => (
            <ThemeItem key={theme} theme={theme} isSelected={selectedTheme === theme} onClick={() => handleThemeSelect(theme)} />
          ))}
        </div>

        <div className="text-xs text-white text-left px-2 py-2 bg-[#313a40] rounded">{THEME_DESCRIPTIONS[selectedTheme]}</div>
      </div>
    );
  }

  // Tile selection mode rendering
  return (
    <div className="fixed left-1/2 bottom-5 transform -translate-x-1/2 bg-black/90 p-3 rounded-lg border-2 border-[#313a40] shadow-lg z-50">
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Theme selection button */}
        <button className="flex items-center gap-1 px-3 py-1 bg-[#313a40] hover:bg-[#474f52] text-white rounded text-sm" onClick={() => setShowThemes(true)}>
          <span>{THEME_ICONS[selectedTheme]}</span>
          <span>Change Theme</span>
        </button>
      </div>

      {availableTiles.length === 0 ? (
        <div className="text-white text-center py-2">No available tiles in this theme.</div>
      ) : (
        <div className="flex items-center justify-center">
          {displayTiles.map((tileIndex, idx) => (
            <TileItem
              key={`tile-${idx}-${tileIndex}`}
              tileIndex={tileIndex}
              isSelected={availableTiles.length <= 5 ? tileIndex === selectedTile : idx === 2} // If 5 or fewer tiles, highlight the selected one; otherwise, highlight the middle one (index 2)
              onClick={() => (availableTiles.length <= 5 ? tileIndex !== selectedTile && setSelectedTile(tileIndex) : idx !== 2 && setSelectedTile(tileIndex))}
            />
          ))}
        </div>
      )}

      {/* Keyboard shortcut guide */}
      <div className="flex justify-center gap-4 text-white text-xs mt-2">
        <span>
          Previous tile: <span className="px-2 bg-[#474f52] rounded">Q</span>
        </span>
        <span>
          Next tile: <span className="px-2 bg-[#474f52] rounded">E</span>
        </span>
      </div>
    </div>
  );
};

export default TileSelector;
