import { useState } from 'react';
import './App.css';
function App() {
  const [count, setCount] = useState(1);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)} className="bg-blue-500 text-white p-2 rounded-md">
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
