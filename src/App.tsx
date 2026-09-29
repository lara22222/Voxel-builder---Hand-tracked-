import HandTracker from "./components/HandTracker";
import VoxelWorld from "./components/VoxelWorld";
import { useState } from "react";

function App() {
  const [fingerPosition, setFingerPosition] = useState({
  x: 0,
  y: 0,
});
  return (
    <main>
      <h1>Hand Tracked Voxel Builder</h1>
      <p>MediaPipe hand tracking test</p>

      <HandTracker
        onFingerMove={(x, y) => {
          setFingerPosition({ x, y });
  }}
/>
<p>
  Finger: {fingerPosition.x.toFixed(2)},{" "}
  {fingerPosition.y.toFixed(2)}
</p>
      
       <VoxelWorld
        fingerX={fingerPosition.x}
        fingerY={fingerPosition.y}
      />
    </main>
  );
}

export default App;