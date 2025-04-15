import { useRef, useState } from 'react';
import { useGame } from 'vibe-starter-3d-ctrl';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * TargetingSystem - 지형과 독립적으로 작동하는 타겟팅 시스템
 * 게임 내에서 클릭 위치를 감지하고 이동 포인트를 설정합니다.
 */
export const TargetingSystem = () => {
  const date = useRef(Date.now());
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);

  // 클릭 효과에 대한 상태 변수
  const [clickEffect, setClickEffect] = useState(false);
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  const [effectScale, setEffectScale] = useState(1);
  const effectRingRef = useRef<Mesh>(null);

  // 클릭 효과 애니메이션
  useFrame(() => {
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // 느린 축소 속도
        if (newScale <= 0) {
          setClickEffect(false);
          return 1;
        }
        return newScale;
      });

      // 원의 크기 조절
      effectRingRef.current.scale.x = effectScale;
      effectRingRef.current.scale.y = effectScale;
    }
  });

  const handlePointerDown = () => {
    date.current = Date.now();
  };

  const handlePointerUp = ({ point }: { point: Vector3 }) => {
    if (Date.now() - date.current < 200) {
      // 빠른 클릭
      setMoveToPoint(point);

      // 클릭 효과 표시
      setClickPosition(new Vector3(point.x, point.y, point.z));
      setEffectScale(1);
      setClickEffect(true);
    }
  };

  return (
    <>
      {/* 최소 클릭 효과 원 */}
      {clickEffect && clickPosition && (
        <mesh ref={effectRingRef} position={[clickPosition.x, clickPosition.y + 0.01, clickPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35]} /> {/* 얇은 원 */}
          <meshBasicMaterial color="#e0e0e0" transparent opacity={0.4 * effectScale} />
        </mesh>
      )}

      {/* 투명한 상호작용 레이어 */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]} // Floor보다 약간 위에 위치
        visible={false} // 보이지 않게 설정
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
};
