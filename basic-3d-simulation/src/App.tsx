import React, { useState } from 'react';
import './App.css';
import GameScene from './components/scene/GameScene';
import PreloadScene from './components/scene/PreloadScene';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return <div style={{ width: '100vw', height: '100vh' }}>{isLoading ? <PreloadScene onComplete={handleLoadingComplete} /> : <GameScene />}</div>;
};

export default App;
