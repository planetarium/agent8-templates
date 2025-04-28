import { useState } from "react";
import "./App.css";
function App() {
  const [count, setCount] = useState(1);

  return (
    <>
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-500 text-white p-2 rounded-md"
        >
          Count is {count}
        </button>
      </div>
    </>
  );
}

export default App;
