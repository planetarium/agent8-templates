import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { InstancedRigidBodies, InstancedRigidBodyProps } from '@react-three/rapier';
import { useCubeStore } from '../../store/cubeStore';
import { getTileCoordinates, getSpriteInfo } from '../../utils/tileTextureLoader';
import { ActiveCollisionTypes } from '@dimforge/rapier3d-compat';

// Maximum number of cube instances
const MAX_INSTANCES = 10000;

// Chunk size definition
const CHUNK_SIZE = 3;
// Active chunk radius
const ACTIVE_CHUNKS_RADIUS = 1;

// Define CubeInfo interface
interface CubeInfo {
  position: [number, number, number];
  tileIndex: number;
}

// Shader code
const vertexShader = `
  attribute vec4 uvOffsetScale;
  varying vec2 vUv;
  varying vec4 vUvOffsetScale;
  
  void main() {
    vUv = uv;
    vUvOffsetScale = uvOffsetScale;
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D spriteTexture;
  varying vec2 vUv;
  varying vec4 vUvOffsetScale;
  
  void main() {
    vec2 uvOffset = vUvOffsetScale.xy;
    vec2 uvScale = vUvOffsetScale.zw;
    vec2 adjustedUV = vec2(vUv.x, 1.0 - vUv.y);
    vec2 finalUV = uvOffset + (adjustedUV * uvScale);
    vec4 texColor = texture2D(spriteTexture, finalUV);
    
    if (texColor.a < 0.1) discard;
    gl_FragColor = texColor;
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

export function InstancedCubes() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const rigidBodiesRef = useRef<any>(null);
  const { camera } = useThree();

  // Get necessary data from the cube store
  const cubes = useCubeStore((state) => state.cubes);
  const addCube = useCubeStore((state) => state.addCube);
  const selectedTile = useCubeStore((state) => state.selectedTile);

  // Sprite information
  const spriteInfo = useMemo(() => getSpriteInfo(), []);
  const { tilesX, tilesY } = spriteInfo;

  // Load texture and create shader material
  const { material, texture } = useMemo(() => {
    const texture = new THREE.TextureLoader().load(spriteInfo.url);
    texture.flipY = false;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        spriteTexture: { value: texture },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    return { material, texture };
  }, [spriteInfo.url]);

  // Calculate active chunks based on camera position
  const activeChunks = useMemo(() => {
    if (!camera) return new Set<string>();

    const cameraPosition = camera.position;
    const centerChunk = getChunkCoords([cameraPosition.x, cameraPosition.y, cameraPosition.z]);

    const activeChunkSet = new Set<string>();

    // Activate chunks around the camera
    for (let x = -ACTIVE_CHUNKS_RADIUS; x <= ACTIVE_CHUNKS_RADIUS; x++) {
      for (let y = -ACTIVE_CHUNKS_RADIUS; y <= ACTIVE_CHUNKS_RADIUS; y++) {
        for (let z = -ACTIVE_CHUNKS_RADIUS; z <= ACTIVE_CHUNKS_RADIUS; z++) {
          const chunkCoords: [number, number, number] = [centerChunk[0] + x, centerChunk[1] + y, centerChunk[2] + z];
          activeChunkSet.add(getChunkKey(chunkCoords));
        }
      }
    }

    return activeChunkSet;
  }, [camera?.position.x, camera?.position.y, camera?.position.z]);

  // Generate instance data for all cubes (previous method)
  const instances = useMemo<InstancedRigidBodyProps[]>(() => {
    console.log(`Generating ${cubes.length} cube instances`);
    return cubes.map((cube, i) => {
      // Determine which chunk each cube belongs to
      const chunkCoords = getChunkCoords(cube.position);
      const chunkKey = getChunkKey(chunkCoords);
      const isActive = activeChunks.has(chunkKey);

      return {
        key: `cube_${i}`,
        position: cube.position,
        rotation: [0, 0, 0] as [number, number, number],
        userData: {
          type: 'cube',
          tileIndex: cube.tileIndex,
          chunkKey,
          isActiveChunk: isActive,
        },
      };
    });
  }, [cubes, activeChunks]);

  // Calculate the number of active and inactive chunks (for logging)
  useEffect(() => {
    const activeCount = instances.filter((i) => i.userData?.isActiveChunk).length;
    const inactiveCount = instances.length - activeCount;
    console.log(`Active cubes: ${activeCount}, Inactive cubes: ${inactiveCount}`);
  }, [instances]);

  // Manage RigidBody sleep state based on camera movement
  useFrame(() => {
    if (!rigidBodiesRef.current) return;

    // Update the sleep state of each RigidBody
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const rigidBody = rigidBodiesRef.current[i];

      if (!rigidBody) continue;

      // Wake up only cubes in active chunks, keep others in sleep state
      if (instance.userData?.isActiveChunk) {
        // Wake up cubes in active chunks
        if (rigidBody.isSleeping()) {
          rigidBody.wakeUp();
        }
      } else {
        // Switch cubes in inactive chunks to sleep state
        if (!rigidBody.isSleeping()) {
          rigidBody.sleep();
        }
      }
    }
  });

  // UV attribute update optimization
  useEffect(() => {
    if (!instancedMeshRef.current || !texture) return;

    const mesh = instancedMeshRef.current;
    const count = Math.min(cubes.length, MAX_INSTANCES);

    console.log(`Updating UV attributes for ${count} cubes`);

    // Performance optimization: Create Float32Array only once
    const uvOffsetScaleArray = new Float32Array(MAX_INSTANCES * 4);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < count; i++) {
      // Calculate tile UV information
      const tileIndex = cubes[i]?.tileIndex ?? 0;
      const { row, col } = getTileCoordinates(tileIndex);

      const uvOffsetX = col / tilesX;
      const uvOffsetY = row / tilesY;
      const uvScaleX = 1 / tilesX;
      const uvScaleY = 1 / tilesY;

      uvOffsetScaleArray[i * 4] = uvOffsetX;
      uvOffsetScaleArray[i * 4 + 1] = uvOffsetY;
      uvOffsetScaleArray[i * 4 + 2] = uvScaleX;
      uvOffsetScaleArray[i * 4 + 3] = uvScaleY;

      // Set position matrix
      const position = new THREE.Vector3().fromArray(cubes[i].position);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    // Optimization: Update instead of deleting/creating attributes
    if (mesh.geometry.getAttribute('uvOffsetScale')) {
      (mesh.geometry.getAttribute('uvOffsetScale') as THREE.BufferAttribute).set(uvOffsetScaleArray);
      (mesh.geometry.getAttribute('uvOffsetScale') as THREE.BufferAttribute).needsUpdate = true;
    } else {
      // Create new attribute only on the first run
      mesh.geometry.setAttribute('uvOffsetScale', new THREE.InstancedBufferAttribute(uvOffsetScaleArray, 4));
    }

    // Update instance matrix
    mesh.instanceMatrix.needsUpdate = true;
  }, [cubes, tilesX, tilesY, texture]);

  // Cube click event handler
  const handleCubeClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (typeof e.instanceId !== 'number' || !rigidBodiesRef.current) return;

    const clickedCube = cubes[e.instanceId];
    if (!clickedCube) return;

    const { position } = clickedCube;
    const faceIndex = Math.floor(e.faceIndex! / 2);

    // Add new cube in the direction of the clicked face
    const [x, y, z] = position;
    const directions: [number, number, number][] = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];

    // Always operate in builder mode - add new cube
    addCube(...directions[faceIndex], selectedTile);
  };

  // Do not render if there are no cubes
  if (cubes.length === 0) {
    return null;
  }

  return (
    <InstancedRigidBodies
      instances={instances}
      ref={rigidBodiesRef}
      type="fixed"
      colliders="cuboid"
      linearDamping={0}
      angularDamping={0}
      activeCollisionTypes={ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.KINEMATIC_FIXED}
    >
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, instances.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
        onClick={handleCubeClick}
        userData={{ isCube: true }}
      >
        <boxGeometry args={[1, 1, 1]} />
        {material && <primitive object={material} />}
      </instancedMesh>
    </InstancedRigidBodies>
  );
}
