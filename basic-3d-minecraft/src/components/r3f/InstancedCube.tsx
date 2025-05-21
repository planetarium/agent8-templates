import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import useCubeStore from '../../stores/cubeStore';
import { getColorByFace, getTileTypeFromIndex } from '../../utils/colorUtils';

// Maximum number of cube instances
const MAX_INSTANCES = 1000000;

// Chunk size definition
const CHUNK_SIZE = 10;
// Active chunk radius
const ACTIVE_CHUNKS_RADIUS = 3;
// Maximum active chunks limit
const MAX_ACTIVE_CHUNKS = 27; // 3x3x3 area

// Shader that supports different colors for each face
const vertexShader = `
  attribute vec3 colorTop;
  attribute vec3 colorBottom;
  attribute vec3 colorFront;
  attribute vec3 colorBack;
  attribute vec3 colorLeft;
  attribute vec3 colorRight;
  
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec2 vUv; // UV coordinates
  
  void main() {
    // Pass normal
    vNormal = normalize(normalMatrix * normal);
    
    // Calculate appropriate UV coordinates based on face direction
    if (abs(normal.y) > 0.9) {
      // Top/bottom face - use xz plane
      vUv = vec2(position.x + 0.5, position.z + 0.5);
    } else if (abs(normal.x) > 0.9) {
      // Left/right face - use zy plane
      vUv = vec2(position.z + 0.5, position.y + 0.5);
    } else {
      // Front/back face - use xy plane
      vUv = vec2(position.x + 0.5, position.y + 0.5);
    }
    
    // Select color based on face
    if (abs(normal.y) > 0.9) {
      // Top/bottom face
      vColor = normal.y > 0.0 ? colorTop : colorBottom;
    } else if (abs(normal.x) > 0.9) {
      // Left/right face
      vColor = normal.x > 0.0 ? colorRight : colorLeft;
    } else if (abs(normal.z) > 0.9) {
      // Front/back face
      vColor = normal.z > 0.0 ? colorBack : colorFront;
    }
    
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  void main() {
    // Draw border: add border to all cube faces
    float border = 0.025; // Border width
    
    // Check if current fragment is at edge
    bool isEdge = vUv.x < border || vUv.x > 1.0 - border || 
                 vUv.y < border || vUv.y > 1.0 - border;
    
    // Simple directional lighting
    float light = max(dot(vNormal, normalize(vec3(1.0, 3.0, 2.0))), 0.0) * 0.3 + 0.7;
    
    // Apply lighting to base color
    vec3 litColor = vColor * light;
    
    // Apply border effect with subtle darkening
    vec3 finalColor = isEdge ? litColor * 0.75 : litColor;
    
    // Output color
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Function to calculate chunk coordinates from cube position
const getChunkCoords = (position: [number, number, number]): [number, number, number] => {
  return [Math.floor(position[0] / CHUNK_SIZE), Math.floor(position[1] / CHUNK_SIZE), Math.floor(position[2] / CHUNK_SIZE)];
};

// Function to generate chunk key (unique identifier)
const getChunkKey = (chunkCoords: [number, number, number]): string => {
  return `${chunkCoords[0]},${chunkCoords[1]},${chunkCoords[2]}`;
};

// Type for cube data
type Cube = {
  position: [number, number, number];
  colorIndex: number;
  chunkKey: string;
};

// Type for chunk data
type Chunk = {
  key: string;
  coords: [number, number, number];
  cubes: Cube[];
  isActive: boolean;
  distance: number; // Distance from camera
  // Collision mesh data
  vertices?: Float32Array;
  indices?: Uint32Array;
};

const InstancedCube = () => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const prevCameraChunkRef = useRef<string | null>(null);
  const frameCountRef = useRef(0);
  // Previous active chunks ref
  const prevActiveChunksRef = useRef<Set<string>>(new Set());

  // Camera chunk change detection state
  const [cameraChunkTrigger, setCameraChunkTrigger] = useState<string | null>(null);

  // RigidBody pooling state
  const [rigidBodiesPool] = useState(() => new Map<string, boolean>());

  // Get necessary data from the cube store
  const cubes = useCubeStore((state) => state.cubes);
  const addCube = useCubeStore((state) => state.addCube);
  const selectedTile = useCubeStore((state) => state.selectedTile);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
    });
  }, []);

  // Get current camera chunk (used in useFrame)
  const getCurrentCameraChunk = useCallback(() => {
    if (!camera) return null;
    const cameraPosition = camera.position;
    const chunkCoords = getChunkCoords([cameraPosition.x, cameraPosition.y, cameraPosition.z]);
    return getChunkKey(chunkCoords);
  }, [camera]);

  // Distance-based chunk sorting function
  const sortChunksByDistance = useCallback((chunks: Chunk[], cameraPosition: THREE.Vector3): Chunk[] => {
    return [...chunks].sort((a, b) => {
      const centerA = new THREE.Vector3(
        a.coords[0] * CHUNK_SIZE + CHUNK_SIZE / 2,
        a.coords[1] * CHUNK_SIZE + CHUNK_SIZE / 2,
        a.coords[2] * CHUNK_SIZE + CHUNK_SIZE / 2,
      );

      const centerB = new THREE.Vector3(
        b.coords[0] * CHUNK_SIZE + CHUNK_SIZE / 2,
        b.coords[1] * CHUNK_SIZE + CHUNK_SIZE / 2,
        b.coords[2] * CHUNK_SIZE + CHUNK_SIZE / 2,
      );

      const distA = centerA.distanceTo(cameraPosition);
      const distB = centerB.distanceTo(cameraPosition);

      return distA - distB;
    });
  }, []);

  // Monitor camera position and trigger only when crossing chunk boundaries
  useFrame(() => {
    const currentChunk = getCurrentCameraChunk();

    // Update trigger only when chunk changes
    if (currentChunk !== prevCameraChunkRef.current) {
      prevCameraChunkRef.current = currentChunk;
      setCameraChunkTrigger(currentChunk);
    }

    // Update only every 3 frames (reduce unnecessary calculations)
    frameCountRef.current = (frameCountRef.current + 1) % 3;
  });

  // Calculate active chunks based on camera position - optimized version
  const activeChunks = useMemo(() => {
    if (!camera || !cameraChunkTrigger) return new Set<string>();

    const cameraPosition = camera.position;
    const centerChunk = getChunkCoords([cameraPosition.x, cameraPosition.y, cameraPosition.z]);
    const activeChunkSet = new Set<string>();

    // Distance calculation for spherical activation area (using squared distance to avoid sqrt)
    const radius = ACTIVE_CHUNKS_RADIUS;
    const maxDistSq = radius * CHUNK_SIZE * (radius * CHUNK_SIZE);

    // Activate base area
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const chunkCoords: [number, number, number] = [centerChunk[0] + x, centerChunk[1] + y, centerChunk[2] + z];

          // Distance-based activation: exclude corner chunks too far from center
          const chunkCenter = new THREE.Vector3(
            chunkCoords[0] * CHUNK_SIZE + CHUNK_SIZE / 2,
            chunkCoords[1] * CHUNK_SIZE + CHUNK_SIZE / 2,
            chunkCoords[2] * CHUNK_SIZE + CHUNK_SIZE / 2,
          );

          const distSq = chunkCenter.distanceToSquared(cameraPosition);
          if (distSq <= maxDistSq) {
            activeChunkSet.add(getChunkKey(chunkCoords));
          }
        }
      }
    }

    // Store calculated result
    prevActiveChunksRef.current = activeChunkSet;
    return activeChunkSet;
  }, [camera, cameraChunkTrigger]); // Recalculate only when camera chunk changes

  // Organize cubes into chunks - optimized version
  const chunks = useMemo(() => {
    const chunkMap = new Map<string, Chunk>();
    const cameraPosition = camera?.position || new THREE.Vector3();

    // Construct chunk data
    cubes.forEach((cube) => {
      const chunkCoords = getChunkCoords(cube.position);
      const chunkKey = getChunkKey(chunkCoords);
      const isActive = activeChunks.has(chunkKey);

      if (!chunkMap.has(chunkKey)) {
        // Calculate chunk center
        const chunkCenter = new THREE.Vector3(
          chunkCoords[0] * CHUNK_SIZE + CHUNK_SIZE / 2,
          chunkCoords[1] * CHUNK_SIZE + CHUNK_SIZE / 2,
          chunkCoords[2] * CHUNK_SIZE + CHUNK_SIZE / 2,
        );

        // Calculate distance from camera
        const distance = chunkCenter.distanceTo(cameraPosition);

        chunkMap.set(chunkKey, {
          key: chunkKey,
          coords: chunkCoords,
          cubes: [],
          isActive,
          distance,
        });
      }

      chunkMap.get(chunkKey)!.cubes.push({
        ...cube,
        colorIndex: cube.tileIndex,
        chunkKey,
      });
    });

    // Return distance-sorted chunk array
    const allChunks = Array.from(chunkMap.values());
    const sortedChunks = sortChunksByDistance(allChunks, cameraPosition);

    // Activate only nearby chunks and generate mesh data to limit RigidBody count
    const finalChunks = sortedChunks.map((chunk, index) => {
      const isActiveChunk = index < MAX_ACTIVE_CHUNKS ? activeChunks.has(chunk.key) : false;

      // Generate collision mesh data only for active chunks
      let vertices: Float32Array | undefined;
      let indices: Uint32Array | undefined;

      if (isActiveChunk && chunk.cubes.length > 0) {
        // Optimization: Create cube position map for fast lookups
        const cubePositionMap = new Map<string, boolean>();
        chunk.cubes.forEach((cube) => {
          const key = `${Math.floor(cube.position[0])},${Math.floor(cube.position[1])},${Math.floor(cube.position[2])}`;
          cubePositionMap.set(key, true);
        });

        // Single cube vertex data (cube center at origin)
        const cubeVertices = new Float32Array([
          -0.5,
          -0.5,
          -0.5, // 0
          0.5,
          -0.5,
          -0.5, // 1
          0.5,
          0.5,
          -0.5, // 2
          -0.5,
          0.5,
          -0.5, // 3
          -0.5,
          -0.5,
          0.5, // 4
          0.5,
          -0.5,
          0.5, // 5
          0.5,
          0.5,
          0.5, // 6
          -0.5,
          0.5,
          0.5, // 7
        ]);

        // Face-based index data - defined by face to add only necessary faces
        const faceIndices = [
          [0, 1, 2, 0, 2, 3], // Front face (z-)
          [1, 5, 6, 1, 6, 2], // Right face (x+)
          [5, 4, 7, 5, 7, 6], // Back face (z+)
          [4, 0, 3, 4, 3, 7], // Left face (x-)
          [3, 2, 6, 3, 6, 7], // Top face (y+)
          [4, 5, 1, 4, 1, 0], // Bottom face (y-)
        ];

        // Temporary arrays (add only actually used data here)
        const tempVertices: number[] = [];
        const tempIndices: number[] = [];

        let vertexOffset = 0; // Current vertex index offset

        chunk.cubes.forEach((cube) => {
          const [x, y, z] = [Math.floor(cube.position[0]), Math.floor(cube.position[1]), Math.floor(cube.position[2])];

          // Check which faces are hidden by other cubes
          const hiddenFaces = [
            cubePositionMap.has(`${x},${y},${z - 1}`), // Front face
            cubePositionMap.has(`${x + 1},${y},${z}`), // Right face
            cubePositionMap.has(`${x},${y},${z + 1}`), // Back face
            cubePositionMap.has(`${x - 1},${y},${z}`), // Left face
            cubePositionMap.has(`${x},${y + 1},${z}`), // Top face
            cubePositionMap.has(`${x},${y - 1},${z}`), // Bottom face
          ];

          // Add all vertices for this cube
          for (let j = 0; j < cubeVertices.length; j += 3) {
            tempVertices.push(cubeVertices[j] + cube.position[0], cubeVertices[j + 1] + cube.position[1], cubeVertices[j + 2] + cube.position[2]);
          }

          // Add indices only for visible faces
          for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
            if (!hiddenFaces[faceIdx]) {
              // This face is visible, add indices
              for (const idx of faceIndices[faceIdx]) {
                tempIndices.push(idx + vertexOffset);
              }
            }
          }

          vertexOffset += 8; // 8 vertices per cube
        });

        // Convert optimized data to Float32Array and Uint32Array
        vertices = new Float32Array(tempVertices);
        indices = new Uint32Array(tempIndices);
      }

      return {
        ...chunk,
        isActive: isActiveChunk,
        vertices,
        indices,
      };
    });

    return finalChunks;
  }, [cubes, activeChunks, camera, sortChunksByDistance, cameraChunkTrigger]); // Recalculate only when camera chunk changes

  // Calculate number of active and inactive chunks (for logging)
  useEffect(() => {
    const activeChunksCount = chunks.filter((chunk) => chunk.isActive).length;
    const activeCount = chunks.filter((chunk) => chunk.isActive).reduce((acc, chunk) => acc + chunk.cubes.length, 0);
    const inactiveCount = cubes.length - activeCount;

    // Current camera chunk info
    const cameraChunkInfo = camera
      ? `Camera chunk: ${getChunkKey(getChunkCoords([camera.position.x, camera.position.y, camera.position.z]))}`
      : 'No camera info';

    // Calculate average cubes per chunk
    const avgCubesPerChunk = chunks.length > 0 ? (cubes.length / chunks.length).toFixed(1) : 0;

    // Limit log frequency
    if (frameCountRef.current === 0) {
      console.log(
        `📊 Terrain stats:\n` +
          `- Active chunks: ${activeChunksCount}/${chunks.length} (${((activeChunksCount / chunks.length) * 100).toFixed(1)}%)\n` +
          `- Active cubes: ${activeCount}/${cubes.length} (${((activeCount / cubes.length) * 100).toFixed(1)}%)\n` +
          `- Avg cubes per chunk: ${avgCubesPerChunk}\n` +
          `- ${cameraChunkInfo}`,
      );
    }

    // RigidBody pooling logic
    chunks.forEach((chunk) => {
      const key = chunk.key;
      const isActive = chunk.isActive;

      // Track newly activated chunks
      if (isActive && !rigidBodiesPool.has(key)) {
        rigidBodiesPool.set(key, true);
      }
      // Track deactivated chunks
      else if (!isActive && rigidBodiesPool.has(key)) {
        rigidBodiesPool.delete(key);
      }
    });
  }, [chunks, cubes.length, rigidBodiesPool, camera, frameCountRef.current]);

  // Update buffer attributes
  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const mesh = instancedMeshRef.current;
    const count = Math.min(cubes.length, MAX_INSTANCES);

    if (count % 100 === 0 || count < 100) {
      console.log(`Updating color attributes for ${count} cubes`);
    }

    // Create color data arrays for each face
    const colorTopArray = new Float32Array(MAX_INSTANCES * 3);
    const colorBottomArray = new Float32Array(MAX_INSTANCES * 3);
    const colorFrontArray = new Float32Array(MAX_INSTANCES * 3);
    const colorBackArray = new Float32Array(MAX_INSTANCES * 3);
    const colorLeftArray = new Float32Array(MAX_INSTANCES * 3);
    const colorRightArray = new Float32Array(MAX_INSTANCES * 3);

    // Set position matrix
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    // Set colors for each face of every cube
    for (let i = 0; i < count; i++) {
      const cube = cubes[i];
      if (!cube) continue;

      // Set color for each face - using cube's tileIndex directly
      const colorTop = getColorByFace(cube.tileIndex, 4); // Top
      const colorBottom = getColorByFace(cube.tileIndex, 5); // Bottom
      const colorFront = getColorByFace(cube.tileIndex, 0); // Front
      const colorBack = getColorByFace(cube.tileIndex, 2); // Back
      const colorLeft = getColorByFace(cube.tileIndex, 3); // Left
      const colorRight = getColorByFace(cube.tileIndex, 1); // Right

      // Top face color
      colorTopArray[i * 3] = colorTop.r;
      colorTopArray[i * 3 + 1] = colorTop.g;
      colorTopArray[i * 3 + 2] = colorTop.b;

      // Bottom face color
      colorBottomArray[i * 3] = colorBottom.r;
      colorBottomArray[i * 3 + 1] = colorBottom.g;
      colorBottomArray[i * 3 + 2] = colorBottom.b;

      // Front face color
      colorFrontArray[i * 3] = colorFront.r;
      colorFrontArray[i * 3 + 1] = colorFront.g;
      colorFrontArray[i * 3 + 2] = colorFront.b;

      // Back face color
      colorBackArray[i * 3] = colorBack.r;
      colorBackArray[i * 3 + 1] = colorBack.g;
      colorBackArray[i * 3 + 2] = colorBack.b;

      // Left face color
      colorLeftArray[i * 3] = colorLeft.r;
      colorLeftArray[i * 3 + 1] = colorLeft.g;
      colorLeftArray[i * 3 + 2] = colorLeft.b;

      // Right face color
      colorRightArray[i * 3] = colorRight.r;
      colorRightArray[i * 3 + 1] = colorRight.g;
      colorRightArray[i * 3 + 2] = colorRight.b;

      // Set position matrix
      const position = new THREE.Vector3().fromArray(cube.position);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    // Update or create buffer attributes
    updateInstancedAttribute(mesh, 'colorTop', colorTopArray, 3);
    updateInstancedAttribute(mesh, 'colorBottom', colorBottomArray, 3);
    updateInstancedAttribute(mesh, 'colorFront', colorFrontArray, 3);
    updateInstancedAttribute(mesh, 'colorBack', colorBackArray, 3);
    updateInstancedAttribute(mesh, 'colorLeft', colorLeftArray, 3);
    updateInstancedAttribute(mesh, 'colorRight', colorRightArray, 3);

    // Update instance matrix
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  }, [cubes]);

  // Helper function to update instanced attributes
  const updateInstancedAttribute = (mesh: THREE.InstancedMesh, name: string, array: Float32Array, itemSize: number) => {
    if (mesh.geometry.getAttribute(name)) {
      (mesh.geometry.getAttribute(name) as THREE.BufferAttribute).set(array);
      (mesh.geometry.getAttribute(name) as THREE.BufferAttribute).needsUpdate = true;
    } else {
      mesh.geometry.setAttribute(name, new THREE.InstancedBufferAttribute(array, itemSize));
    }
  };

  // Cube click handler
  const handleCubeClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (typeof e.instanceId !== 'number') return;

    const clickedCube = cubes[e.instanceId];
    if (!clickedCube) return;

    const { position } = clickedCube;
    const faceIndex = Math.floor(e.faceIndex! / 2);

    // Add new cube in the direction of the clicked face
    const [x, y, z] = position;
    const directions: [number, number, number][] = [
      [x, y, z - 1], // Front
      [x + 1, y, z], // Right
      [x, y, z + 1], // Back
      [x - 1, y, z], // Left
      [x, y + 1, z], // Top
      [x, y - 1, z], // Bottom
    ];

    addCube(...directions[faceIndex], selectedTile);
  };

  // Active chunks memoization
  const activeChunksArray = useMemo(() => {
    return chunks.filter((chunk) => chunk.isActive);
  }, [chunks]);

  // Don't render if there are no cubes
  if (cubes.length === 0) {
    return null;
  }

  return (
    <>
      {/* InstancedMesh for rendering all cubes */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, cubes.length]}
        castShadow
        receiveShadow
        frustumCulled={true}
        onClick={handleCubeClick}
        userData={{ isCube: true }}
      >
        <boxGeometry args={[1, 1, 1]} />
        {material && <primitive object={material} />}
      </instancedMesh>

      {/* Create one TrimeshCollider per active chunk */}
      {activeChunksArray
        .filter((chunk) => chunk.vertices && chunk.indices)
        .map((chunk) => (
          <RigidBody key={chunk.key} type="fixed" colliders={false} userData={{ type: 'cubeChunk', chunkKey: chunk.key }}>
            <TrimeshCollider args={[chunk.vertices!, chunk.indices!]} />
          </RigidBody>
        ))}
    </>
  );
};

export default InstancedCube;
