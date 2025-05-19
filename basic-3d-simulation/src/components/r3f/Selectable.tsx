import { useRef, useEffect, cloneElement, useState, ReactElement, useMemo } from 'react';
import useSelectStore from '../../stores/selectStore';
import CircularOutline from '../custom/CircularOutline';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';

interface SelectableProps {
  children: ReactElement;
  forceCompound?: boolean; // Add option to treat as compound object
}

/**
 * Selectable component - Wrapper for any 3D object to make it selectable
 *
 * @param {Object} props - Component properties
 * @param {React.ReactElement} props.children - The 3D object to make selectable
 * @param {boolean} props.forceCompound - Force treating as compound object (for complex models)
 * @returns {React.ReactElement} Selectable 3D object with selection effects
 */
const Selectable: React.FC<SelectableProps> = ({ children, forceCompound = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const selectedUuid = useSelectStore((state: { selectedUuid: string }) => state.selectedUuid);
  const selectObject = useSelectStore((state: { selectObject: (uuid: string) => void }) => state.selectObject);

  // Create a memo to store the UUID we'll use for selection
  const selectionUuid = useMemo(() => {
    return forceCompound ? groupRef.current?.uuid : meshRef.current?.uuid;
  }, [forceCompound]);

  // Check initialization
  useEffect(() => {
    if ((forceCompound ? groupRef.current : meshRef.current) && !initialized) {
      console.log('Selectable initialized with UUID:', forceCompound ? groupRef.current?.uuid : meshRef.current?.uuid);
      setInitialized(true);
    }
  }, [initialized, forceCompound]);

  // Check if selected
  const isSelected = initialized && selectedUuid === selectionUuid;

  // Click handler
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (forceCompound && groupRef.current) {
      console.log('Clicking on compound object with UUID:', groupRef.current.uuid);
      selectObject(groupRef.current.uuid);
    } else if (meshRef.current) {
      console.log('Clicking on object with UUID:', meshRef.current.uuid);
      selectObject(meshRef.current.uuid);
    }
  };

  // For compound objects, we wrap in a group
  if (forceCompound) {
    return (
      <group ref={groupRef} onClick={handleClick}>
        {children}
        {isSelected && groupRef.current && (
          <CircularOutline object={groupRef.current} color="#00ffff" thickness={5} opacity={0.9} pulseSpeed={0.8} scale={1.06} />
        )}
      </group>
    );
  }

  // For simple objects, we clone the element and add the ref
  return (
    <>
      {/* Pass ref and click event to child element */}
      {cloneElement(children, {
        ref: meshRef,
        onClick: handleClick,
      })}

      {/* Selection effect using circular outline */}
      {isSelected && meshRef.current && <CircularOutline object={meshRef.current} color="#00ffff" thickness={5} opacity={0.9} pulseSpeed={0.8} scale={1.06} />}
    </>
  );
};

export default Selectable;
