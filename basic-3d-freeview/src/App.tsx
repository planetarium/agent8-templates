import React from 'react';
import './App.css';
import { KeyboardControls } from '@react-three/drei';

import { keyboardMap } from './constants/controls.ts';
import { GameScene } from './components/GameScene.tsx';

const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameScene />
    </div>
  );
};

export default App;
