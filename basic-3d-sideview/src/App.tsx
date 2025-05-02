import React from 'react';
import './App.css';

import { GameScene } from './components/r3f/GameScene.tsx';

const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameScene />
    </div>
  );
};

export default App;
