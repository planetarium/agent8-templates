import { useEffect, useState } from 'react';

/**
 * Crosshair component for FPS-style targeting
 *
 * Renders a centered crosshair overlay with white lines and black outline
 * for better visibility across different backgrounds.
 */
const Crosshair = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = () => {
      // Get canvas element directly
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setPosition({ x: centerX, y: centerY });
      } else {
        // Use viewport center if canvas not found
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        setPosition({ x: centerX, y: centerY });
      }
    };

    // Set initial position
    updatePosition();

    // Handle screen size changes and mobile address bar changes
    window.addEventListener('resize', updatePosition);
    window.addEventListener('orientationchange', updatePosition);

    // Handle mobile address bar changes on scroll
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updatePosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('orientationchange', updatePosition);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        className="absolute w-6 h-6 flex items-center justify-center"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Horizontal line with black outline */}
        <div className="w-3 h-[1px] bg-white opacity-100 absolute shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"></div>
        {/* Vertical line with black outline */}
        <div className="h-3 w-[1px] bg-white opacity-100 absolute shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"></div>
      </div>
    </div>
  );
};

export default Crosshair;
