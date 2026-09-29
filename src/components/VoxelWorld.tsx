import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type VoxelWorldProps = {
  fingerX: number;
  fingerY: number;
};

function VoxelWorld({
  fingerX,
  fingerY,
}: VoxelWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const fingerXRef = useRef(fingerX);
  const fingerYRef = useRef(fingerY);

  fingerXRef.current = fingerX;
  fingerYRef.current = fingerY;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181818);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    camera.position.set(8, 8, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(renderer.domElement);

    // Mouse controls
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    // Grid
    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);

    const floorGeometry = new THREE.PlaneGeometry(10, 10);

    const floorMaterial = new THREE.MeshBasicMaterial({
    visible: false,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

    floor.rotation.x = -Math.PI / 2;

    scene.add(floor);

    // Our first voxel
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const material = new THREE.MeshStandardMaterial({
      color: 0x4f8cff,
    });

    const ghostMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
    });

    const ghostCube = new THREE.Mesh(
        geometry,
        ghostMaterial
    );

    ghostCube.visible = false;

    scene.add(ghostCube);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const finger = new THREE.Vector2();
    const occupied = new Set<string>();
    const voxels: THREE.Mesh[] = [];

    function updateFingerTarget() {
      finger.x = (1 - fingerXRef.current) * 2 - 1;
      finger.y = -(fingerYRef.current * 2 - 1);

      raycaster.setFromCamera(finger, camera);
    
    const intersections = raycaster.intersectObjects([
      ...voxels,
      floor,
    ]);

    if (intersections.length === 0) {
      ghostCube.visible = false;
      return;
    }

    const hit = intersections[0];

    if (hit.object === floor) {
      ghostCube.position.set(
        Math.floor(hit.point.x) + 0.5,
        0.5,
        Math.floor(hit.point.z) + 0.5
      );
    } else {
      const clickedVoxel = hit.object as THREE.Mesh;
      const normal = hit.face!.normal;

      ghostCube.position.set(
        clickedVoxel.position.x + normal.x,
        clickedVoxel.position.y + normal.y,
        clickedVoxel.position.z + normal.z
      );
    }

    const key = `${ghostCube.position.x},${ghostCube.position.y},${ghostCube.position.z}`;

    ghostCube.visible = !occupied.has(key);
    }
    function handleMouseMove(event: MouseEvent) {
        const rect = renderer.domElement.getBoundingClientRect();

        mouse.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;

        mouse.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersections = raycaster.intersectObjects([
            ...voxels,
            floor,
        ]);

        if (intersections.length === 0) {
            ghostCube.visible = false;
            return;
        }

        const hit = intersections[0];

        if (hit.object === floor) {
            ghostCube.position.set(
            Math.floor(hit.point.x) + 0.5,
            0.5,
            Math.floor(hit.point.z) + 0.5
            );
        } else {
            const clickedVoxel = hit.object as THREE.Mesh;
            const normal = hit.face!.normal;

            ghostCube.position.set(
            clickedVoxel.position.x + normal.x,
            clickedVoxel.position.y + normal.y,
            clickedVoxel.position.z + normal.z
            );
        }

        const key = `${ghostCube.position.x},${ghostCube.position.y},${ghostCube.position.z}`;

        ghostCube.visible = !occupied.has(key);
    }

    renderer.domElement.addEventListener(
      "mousemove",
      handleMouseMove
    );

    function handleClick(event: MouseEvent) {
        const rect = renderer.domElement.getBoundingClientRect();

        mouse.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;

        mouse.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const intersections = raycaster.intersectObjects([
            ...voxels,
            floor,
        ]);

        if (intersections.length === 0) return;

        const hit = intersections[0];

        let x: number;
        let y: number;
        let z: number;

        if (hit.object === floor) {
            // Clicked the floor
            x = Math.floor(hit.point.x) + 0.5;
            y = 0.5;
            z = Math.floor(hit.point.z) + 0.5;
        } else {
            // Clicked an existing voxel
            const clickedVoxel = hit.object as THREE.Mesh;
            const normal = hit.face!.normal;

            x = clickedVoxel.position.x + normal.x;
            y = clickedVoxel.position.y + normal.y;
            z = clickedVoxel.position.z + normal.z;
        }

        const key = `${x},${y},${z}`;

        if (occupied.has(key)) return;

        occupied.add(key);

        const voxel = new THREE.Mesh(
            geometry,
            material.clone()
        );

        voxel.position.set(x, y, z);

        scene.add(voxel);
        voxels.push(voxel);
        }

    renderer.domElement.addEventListener("click", handleClick);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      3
    );

    directionalLight.position.set(5, 10, 5);

    scene.add(directionalLight);

    // Resize support
    function handleResize() {
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    window.addEventListener("resize", handleResize);

    // Animation loop
    let animationFrameId: number;

    function animate() {
      controls.update();
      updateFingerTarget();

      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);

      window.removeEventListener("resize", handleResize);

      renderer.domElement.removeEventListener(
        "mousemove",
        handleMouseMove
      );
      renderer.domElement.removeEventListener(
        "click",
        handleClick
      );

      controls.dispose();

      geometry.dispose();
      material.dispose();

      renderer.dispose();

      ghostMaterial.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: "800px",
        height: "500px",
        margin: "30px auto",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}

export default VoxelWorld;