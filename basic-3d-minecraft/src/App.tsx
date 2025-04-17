import React from 'react';
import { GameScene } from './components/r3f/GameScene';
import './App.css';

const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameScene />
    </div>
  );
};

export default App;
