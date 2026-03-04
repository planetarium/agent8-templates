import React, { useState } from 'react';
import './App.css';
import GameScene from './components/scene/GameScene';
import PreloadScene from './components/scene/PreloadScene';
import TitleScene from './components/scene/TitleScene';

type AppPhase = 'loading' | 'title' | 'game';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('loading');

  const handleLoadingComplete = () => {
    setPhase('title');
  };

  const handleGameStart = () => {
    setPhase('game');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {phase === 'loading' && <PreloadScene onComplete={handleLoadingComplete} />}
      {phase === 'title' && <TitleScene onStart={handleGameStart} />}
      {phase === 'game' && <GameScene />}
    </div>
  );
};

export default App;
