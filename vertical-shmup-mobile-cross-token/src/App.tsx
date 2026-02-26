import { GameServer, GameServerProvider } from "@agent8/gameserver";
import GameComponent from "./components/GameComponent";
import "./App.css";

const gameServer = new GameServer();

function App() {
  return (
    <GameServerProvider server={gameServer}>
      <div className="app">
        <GameComponent />
      </div>
    </GameServerProvider>
  );
}

export default App;
