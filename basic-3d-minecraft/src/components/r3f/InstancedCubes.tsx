import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { InstancedRigidBodies, InstancedRigidBodyProps } from '@react-three/rapier';
import { useCubeStore } from '../../store/cubeStore';
import { getTileCoordinates, getSpriteInfo } from '../../utils/tileTextureLoader';

// Maximum number of cube instances
const MAX_INSTANCES = 10000;

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

export function InstancedCubes() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const rigidBodiesRef = useRef<any>(null);

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

  // Generate instance data (for RigidBodies)
  const instances = useMemo<InstancedRigidBodyProps[]>(() => {
    return cubes.map((cube, i) => ({
      key: `cube_${i}`,
      position: cube.position,
      rotation: [0, 0, 0] as [number, number, number],
      userData: {
        type: 'cube',
        tileIndex: cube.tileIndex,
      },
    }));
  }, [cubes]);

  // Update UV attributes and instance matrices
  useEffect(() => {
    if (!instancedMeshRef.current || !texture) return;

    const mesh = instancedMeshRef.current;
    const count = Math.min(cubes.length, MAX_INSTANCES);

    // Calculate UV offset and scale
    const uvOffsetScaleArray = new Float32Array(count * 4);
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

    // Remove existing attribute and create a new one
    if (mesh.geometry.getAttribute('uvOffsetScale')) {
      mesh.geometry.deleteAttribute('uvOffsetScale');
    }

    // Add new attribute
    mesh.geometry.setAttribute('uvOffsetScale', new THREE.InstancedBufferAttribute(uvOffsetScaleArray, 4));

    // Set update flags
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
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

  return (
    <>
      {instances.length > 0 && (
        <InstancedRigidBodies instances={instances} ref={rigidBodiesRef} type="fixed" colliders="cuboid" gravityScale={0}>
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
      )}
    </>
  );
}
