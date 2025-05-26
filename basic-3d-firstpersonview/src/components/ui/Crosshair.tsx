/**
 * Crosshair component for FPS-style targeting
 *
 * Renders a centered crosshair overlay with white lines and black outline
 * for better visibility across different backgrounds.
 */
const Crosshair = () => {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="crosshair-container relative flex items-center justify-center w-6 h-6">
        {/* Horizontal line with black outline */}
        <div className="w-3 h-[1px] bg-white opacity-100 absolute shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"></div>
        {/* Vertical line with black outline */}
        <div className="h-3 w-[1px] bg-white opacity-100 absolute shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"></div>
      </div>
    </div>
  );
};

export default Crosshair;
