import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useCubeStore from '../../stores/cubeStore';
import { getTotalTileCount, getTileCoordinates, getSpriteInfo } from '../../utils/tileTextureLoader';

// Sprite URL
import assetsData from '../../assets.json';
const spriteUrl = assetsData.sprites.minecraft.url;

const TileSelector: React.FC = () => {
  // Maintain only necessary state
  const [tileCount, setTileCount] = useState(25);

  // Get state from the store
  const selectedTile = useCubeStore((state) => state.selectedTile);
  const setSelectedTile = useCubeStore((state) => state.setSelectedTile);

  // Check tile info on initial load
  useEffect(() => {
    const total = getTotalTileCount();
    setTileCount(total);
  }, []);

  // Calculate background position for each tile - memoization
  const getTileBackgroundPosition = useCallback((index: number) => {
    const { row, col } = getTileCoordinates(index);
    const xPercent = (col * 100) / 4;
    const yPercent = (row * 100) / 4;
    return `${xPercent}% ${yPercent}%`;
  }, []);

  // Calculate previous/next tile index - memoization
  const prevTileIndex = useMemo(() => (selectedTile - 1 + tileCount) % tileCount, [selectedTile, tileCount]);

  const nextTileIndex = useMemo(() => (selectedTile + 1) % tileCount, [selectedTile, tileCount]);

  // Calculate surrounding tile indices (3 before and 3 after) - memoization
  const surroundingTiles = useMemo(() => {
    const tiles = [];

    // Calculate indices for 7 tiles in total (3 before and 3 after the selected tile)
    for (let i = -3; i <= 3; i++) {
      // Handle negative indices or indices exceeding tileCount (circular)
      const idx = (selectedTile + i + tileCount) % tileCount;
      tiles.push(idx);
    }

    return tiles;
  }, [selectedTile, tileCount]);

  // Select next tile (circular)
  const selectNextTile = useCallback(() => {
    setSelectedTile(nextTileIndex);
  }, [nextTileIndex, setSelectedTile]);

  // Select previous tile (circular)
  const selectPrevTile = useCallback(() => {
    setSelectedTile(prevTileIndex);
  }, [prevTileIndex, setSelectedTile]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Handle shortcuts
      if (e.key === 'q' || e.key === 'Q') {
        // Q key: Select previous tile
        e.preventDefault();
        selectPrevTile();
      } else if (e.key === 'e' || e.key === 'E') {
        // E key: Select next tile
        e.preventDefault();
        selectNextTile();
      }
    },
    [selectNextTile, selectPrevTile],
  );

  // Register keyboard event listener (optimized dependency array)
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Render tile carousel - memoization
  const tileCarouselElement = useMemo(
    () => (
      <div className="flex justify-center items-center gap-1 p-1 w-full">
        {surroundingTiles.map((tileIndex, i) => {
          // Determine tile position (selected, previous, next)
          const isSelected = i === 3;
          const isPrev = i < 3;
          const isNext = i > 3;

          return (
            <div
              key={`tile-${tileIndex}`}
              className={`
                relative
                w-[60px] h-[60px]
                border-2 border-[#313a40]
                rounded
                bg-[#8B8B8B]
                cursor-pointer
                transition-all
                duration-200
                flex items-center justify-center
                ${
                  isSelected ? 'w-[80px] h-[80px] border-4 border-white shadow-[0_0_12px_rgba(255,255,255,0.7)] rounded-none transform -translate-y-2 z-10' : ''
                }
                ${isPrev ? 'opacity-80 transform translate-y-1' : ''}
                ${isNext ? 'opacity-80 transform translate-y-1' : ''}
              `}
              style={{
                backgroundImage: `url("${spriteUrl}")`,
                backgroundSize: '500%',
                backgroundPosition: getTileBackgroundPosition(tileIndex),
                imageRendering: 'pixelated',
              }}
              title={`Tile ${tileIndex}`}
              onClick={() => !isSelected && setSelectedTile(tileIndex)}
            >
              {/* Display tile index - selected tile above, others below */}
              <div
                className={`
                absolute ${isSelected ? '-top-7' : 'bottom-[-18px]'}
                left-1/2 transform -translate-x-1/2
                bg-[#1d1c21] text-white
                px-2 py-0.5 rounded
                text-sm font-bold
                ${!isSelected ? 'opacity-80 text-xs' : ''}
              `}
              >
                {tileIndex}
              </div>

              {/* Highlight selected tile */}
              {isSelected && <div className="absolute inset-0 border-2 border-white opacity-30"></div>}
            </div>
          );
        })}
      </div>
    ),
    [surroundingTiles, getTileBackgroundPosition, setSelectedTile],
  );

  // Render shortcut guide - memoization
  const shortcutsElement = useMemo(
    () => (
      <div className="flex justify-center gap-5 text-white text-lg">
        <div>
          <span className="inline-block bg-[#474f52] text-white px-2 py-1 mr-1.5 border-2 border-[#313a40] rounded font-bold min-w-[25px] text-center shadow-inner">
            Q
          </span>
          Previous
        </div>
        <div>
          <span className="inline-block bg-[#474f52] text-white px-2 py-1 mr-1.5 border-2 border-[#313a40] rounded font-bold min-w-[25px] text-center shadow-inner">
            E
          </span>
          Next
        </div>
      </div>
    ),
    [],
  );

  return (
    <div className="fixed left-1/2 bottom-5 transform -translate-x-1/2 bg-black/80 p-4 rounded-lg border-4 border-[#313a40] shadow-xl z-50 min-w-[600px] text-center flex flex-col items-center gap-4">
      {shortcutsElement}
      {tileCarouselElement}
    </div>
  );
};

export default TileSelector;
