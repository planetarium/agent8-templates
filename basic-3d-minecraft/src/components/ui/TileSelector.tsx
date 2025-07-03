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

  // Compact configuration - slightly larger tiles
  const size = isSelected
    ? 'w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] md:w-[40px] md:h-[40px]'
    : 'w-[25px] h-[25px] sm:w-[30px] sm:h-[30px] md:w-[35px] md:h-[35px]';

  const border = isSelected ? 'border border-white shadow-sm' : 'border border-[#313a40]';

  const transform = isSelected ? '-translate-y-0.5' : '';

  return (
    <div
      className={`
        relative ${size} ${border} ${transform}
        bg-[#222222] rounded
        cursor-pointer
        transition-all duration-200
        flex items-center justify-center
        mx-0.5
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

      {/* Display tile index - compact */}
      {!isSelected && (
        <div
          className={`
        absolute bottom-[-10px]
        left-1/2 transform -translate-x-1/2
        bg-[#1d1c21] text-white
        px-1 py-0.5 rounded
        text-xs font-bold
      `}
        >
          {tileIndex}
        </div>
      )}
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
        p-1 rounded cursor-pointer
        transition-all duration-200
        ${isSelected ? 'bg-white text-black shadow-sm' : 'bg-[#313a40] text-white hover:bg-[#474f52]'}
      `}
      onClick={onClick}
    >
      <div className="text-sm mb-0.5">{THEME_ICONS[theme]}</div>
      <div className="text-[10px] font-bold text-center">{THEME_NAMES[theme]}</div>
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

  // Adjust number of tiles to display based on screen size
  const maxDisplayTiles = 5;

  // Tiles to display (current selected tile and sides)
  const displayTiles = useMemo(() => {
    if (availableTiles.length === 0) return [];

    // If there are fewer tiles than max display, show all
    if (availableTiles.length <= maxDisplayTiles) {
      return availableTiles;
    }

    const tiles = [];
    const sideCount = Math.floor((maxDisplayTiles - 1) / 2);

    // Display current selected tile and tiles on each side
    for (let i = -sideCount; i <= sideCount; i++) {
      const idx = (currentTileIndex + i + availableTiles.length) % availableTiles.length;
      tiles.push(availableTiles[idx]);
    }
    return tiles;
  }, [availableTiles, currentTileIndex, maxDisplayTiles]);

  // Terrain regeneration function
  const handleRegenerateTerrain = () => {
    regenerateTerrain(customSeed);
  };

  // Theme selection mode rendering
  if (showThemes) {
    return (
      <div className="fixed left-1/2 bottom-2 transform -translate-x-1/2 bg-black/90 p-1 rounded border border-[#313a40] shadow-lg z-50 w-[80vw] max-w-[180px] sm:max-w-[200px] md:max-w-[220px]">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold text-white">Theme</h3>
          <button className="px-1 py-0.5 text-[10px] bg-[#313a40] hover:bg-[#474f52] text-white rounded" onClick={() => setShowThemes(false)}>
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-0.5 mb-1">
          {Object.values(THEMES).map((theme) => (
            <ThemeItem key={theme} theme={theme} isSelected={selectedTheme === theme} onClick={() => handleThemeSelect(theme)} />
          ))}
        </div>

        <div className="text-[10px] text-white text-left px-1 py-1 bg-[#313a40] rounded">{THEME_DESCRIPTIONS[selectedTheme]}</div>
      </div>
    );
  }

  // Tile selection mode rendering
  return (
    <div className="fixed left-1/2 bottom-2 transform -translate-x-1/2 bg-black/90 p-1 rounded border border-[#313a40] shadow-lg z-50 w-[80vw] max-w-[180px] sm:max-w-[200px] md:max-w-[220px]">
      {availableTiles.length === 0 ? (
        <div className="text-white text-center py-1 text-xs">No tiles available.</div>
      ) : (
        <div className="flex items-center justify-center overflow-x-auto">
          {displayTiles.map((tileIndex, idx) => {
            const middleIndex = Math.floor(maxDisplayTiles / 2);
            const isSelectedTile = availableTiles.length <= maxDisplayTiles ? tileIndex === selectedTile : idx === middleIndex;

            return (
              <TileItem
                key={`tile-${idx}-${tileIndex}`}
                tileIndex={tileIndex}
                isSelected={isSelectedTile}
                onClick={() => !isSelectedTile && setSelectedTile(tileIndex)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TileSelector;
