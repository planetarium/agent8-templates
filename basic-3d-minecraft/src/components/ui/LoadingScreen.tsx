/**
 * Loading screen component
 */
const LoadingScreen = () => {
  return (
    <>
      <style>{`
        .loading-container {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: black;
          color: white;
        }
        .loading-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div className="loading-container">
        <h2 className="loading-title">Loading</h2>
        <div className="spinner"></div>
      </div>
    </>
  );
};

export default LoadingScreen;
