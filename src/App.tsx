import HandTracker from "./components/HandTracker";
import VoxelWorld from "./components/VoxelWorld";

function App() {
  return (
    <main>
      <h1>Hand Tracked Voxel Builder</h1>
      <p>MediaPipe hand tracking test</p>

      <HandTracker />
      
      <VoxelWorld />
    </main>
  );
}

export default App;