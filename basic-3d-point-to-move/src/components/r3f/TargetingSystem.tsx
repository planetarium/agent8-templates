import { useRef, useState, useCallback, useEffect } from 'react';
import { Mesh, Vector3, Raycaster, Vector2 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useMouseControls, useControllerState } from 'vibe-starter-3d';

// Development mode flag
const isDevelopment = false; // 디버그 시각화를 위해 수동으로 변경

/**
 * TargetingSystem - 지형과 독립적으로 작동하는 타겟팅 시스템
 * 게임에서 클릭 위치를 감지하고 이동 지점을 설정합니다.
 */
export const TargetingSystem: React.FC = () => {
  const { camera, scene, size } = useThree();
  const getMouseInputs = useMouseControls();
  const { setMoveToPoint } = useControllerState();

  // 이동 허용 여부 상태
  const [canMove, setCanMove] = useState(true);

  // 화면 좌표를 월드 위치로 변환하는 레이캐스터
  const raycaster = useRef(new Raycaster());

  // 프레임 간 마우스 버튼 상태 추적
  const rightPressedLastFrame = useRef(false);
  const clickTimeRef = useRef(0);

  // 레이캐스터 업데이트 및 디버깅을 위한 참조
  const effectRingRef = useRef<Mesh>(null);
  const animationRef = useRef<number | null>(null);

  // 이동 지점에 효과 표시를 위한 설정
  const [clickPosition, setClickPosition] = useState<Vector3 | null>(null);
  // 이동 효과 활성화 상태
  const [clickEffect, setClickEffect] = useState(false);
  // 이동 효과 크기 조정
  const [effectScale, setEffectScale] = useState(1);

  // 마우스 좌표에서 월드 위치를 가져오는 함수
  const getWorldPositionFromMouse = useCallback(() => {
    const mouseInputs = getMouseInputs();

    // 화면 좌표 정규화 (-1 ~ 1 범위로)
    const normalizedX = (mouseInputs.x / size.width) * 2 - 1;
    const normalizedY = -(mouseInputs.y / size.height) * 2 + 1;

    const mousePosition = new Vector2(normalizedX, normalizedY);

    if (isDevelopment) {
      console.log('Raw mouse position:', { x: mouseInputs.x, y: mouseInputs.y });
      console.log('Normalized mouse position:', { x: normalizedX, y: normalizedY });
    }

    raycaster.current.setFromCamera(mousePosition, camera);

    // 바닥 레이캐스팅용 전용 레이어 생성
    const targetingFloor = scene.children.find((child) => child.userData && child.userData.isTargetingFloor === true) as Mesh;

    // 타겟팅 바닥이 발견된 경우
    if (targetingFloor) {
      if (isDevelopment) console.log('Using dedicated targeting floor');

      // 가시성 상태 저장
      const wasVisible = targetingFloor.visible;

      // 레이캐스팅 작동을 위해 일시적으로 visible로 설정
      targetingFloor.visible = true;

      // 타겟팅 바닥과의 교차점 확인
      const intersects = raycaster.current.intersectObject(targetingFloor, false);

      // 원래 가시성 복원
      targetingFloor.visible = wasVisible;

      if (isDevelopment) console.log('Intersections with targeting floor:', intersects.length);

      if (intersects.length > 0) {
        if (isDevelopment) console.log('Intersection point with targeting floor:', intersects[0].point);
        return intersects[0].point;
      }
    }

    // 모든 바닥과의 교차점 확인 (백업 방법)
    if (isDevelopment) console.log('Trying intersection with all floor objects');

    const allFloors = scene.children.filter((child) => child.userData && (child.userData.isFloor === true || child.userData.type === 'fixed'));

    for (const floor of allFloors) {
      // 일시적으로 가시성 활성화
      const wasVisible = floor.visible;
      floor.visible = true;

      const intersects = raycaster.current.intersectObject(floor, true);

      // 가시성 복원
      floor.visible = wasVisible;

      if (intersects.length > 0) {
        if (isDevelopment) console.log('Intersection found with floor:', floor.name, intersects[0].point);
        return intersects[0].point;
      }
    }

    // 대체 방법: y=0 평면에 레이 투영
    if (isDevelopment) console.log('Using fallback plane intersection method');

    const planeIntersection = new Vector3();
    const planeNormal = new Vector3(0, 1, 0);
    const planeConstant = 0; // y = 0 평면
    const ray = raycaster.current.ray;

    if (isDevelopment) console.log('Ray direction:', ray.direction);

    const denominator = planeNormal.dot(ray.direction);
    if (Math.abs(denominator) > 0.0001) {
      const t = -(ray.origin.dot(planeNormal) + planeConstant) / denominator;
      if (t >= 0) {
        planeIntersection.copy(ray.origin).add(ray.direction.clone().multiplyScalar(t));
        if (isDevelopment) console.log('Fallback intersection point:', planeIntersection);

        // z 값이 너무 큰 경우 제한 (현실적인 값으로 제한)
        const maxDistance = 100;
        if (Math.abs(planeIntersection.z) > maxDistance) {
          if (isDevelopment) console.log(`Clamping large z value: ${planeIntersection.z} to max distance: ${maxDistance}`);
          planeIntersection.z = Math.sign(planeIntersection.z) * maxDistance;
        }

        return planeIntersection;
      }
    }

    if (isDevelopment) console.log('Failed to find intersection point');

    // 최종 대체 방법 - 카메라로부터 고정 거리에 투영
    const cameraDirection = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const distanceFromCamera = 10; // 카메라로부터 고정 거리
    const fixedPoint = new Vector3().copy(camera.position).add(cameraDirection.multiplyScalar(distanceFromCamera));

    if (isDevelopment) console.log('Emergency fallback: Fixed distance from camera:', fixedPoint);
    return fixedPoint;
  }, [camera, scene, getMouseInputs, size]);

  // 이동 명령 실행 함수
  // 클릭 위치로 캐릭터를 이동시키고 시각적 효과를 표시
  const moveToPosition = useCallback(
    (position: Vector3) => {
      // 이동이 허용되지 않은 경우 이동하지 않음
      if (!canMove) {
        if (isDevelopment) console.log('Movement currently disabled');
        return;
      }

      if (isDevelopment) console.log('Moving to position:', position);

      // 게임 상태에서 이동 지점 설정 (캐릭터 이동 트리거)
      setMoveToPoint(position);

      // 클릭 효과 시각화를 위한 위치 설정 (바닥 약간 위)
      setClickPosition(new Vector3(position.x, position.y + 0.01, position.z));
      // 효과 크기 재설정
      setEffectScale(1);
      // 클릭 효과 활성화
      setClickEffect(true);

      // 연속 클릭 방지를 위한 짧은 시간 동안 이동 차단
      setCanMove(false);
      setTimeout(() => {
        setCanMove(true);
      }, 100);
    },
    [canMove, setMoveToPoint],
  );

  // 프레임 카운터 (로그 빈도 감소용)
  const frameCounter = useRef(0);

  // 클릭 효과 애니메이션 및 마우스 입력 처리
  useFrame(() => {
    frameCounter.current += 1;

    // 콘솔 스팸 방지를 위해 60프레임마다 로그 출력
    const shouldLog = isDevelopment && frameCounter.current % 60 === 0;

    // 클릭 효과 애니메이션 처리
    if (clickEffect && effectRingRef.current) {
      setEffectScale((prev) => {
        const newScale = prev - 0.04; // 천천히 축소
        if (newScale <= 0) {
          setClickEffect(false);
          return 1;
        }
        return newScale;
      });

      // 원 크기 조정
      effectRingRef.current.scale.x = effectScale;
      effectRingRef.current.scale.y = effectScale;
    }

    // 마우스 컨트롤을 사용하여 우클릭 처리
    const mouseInputs = getMouseInputs();
    const right = mouseInputs.right;

    if (shouldLog) {
      console.log('Mouse inputs:', {
        x: mouseInputs.x.toFixed(2),
        y: mouseInputs.y.toFixed(2),
        right: right,
        left: mouseInputs.left,
      });
    }

    const rightJustPressed = right && !rightPressedLastFrame.current;
    const rightJustReleased = !right && rightPressedLastFrame.current;

    // 다음 프레임을 위한 버튼 상태 업데이트
    rightPressedLastFrame.current = right;

    // 우클릭 누름 처리 (시작 시간 추적)
    if (rightJustPressed) {
      clickTimeRef.current = Date.now();
      if (isDevelopment) console.log('Right click pressed');
    }

    // 우클릭 해제 처리 (빠른 클릭인지 확인)
    if (rightJustReleased) {
      const clickDuration = Date.now() - clickTimeRef.current;
      if (isDevelopment) console.log('Right click released, duration:', clickDuration, 'ms');

      if (clickDuration < 200) {
        if (isDevelopment) console.log('Processing quick click');
        // 마우스 좌표에서 월드 위치 가져오기
        const point = getWorldPositionFromMouse();

        if (point) {
          // 이동 함수를 통해 처리
          moveToPosition(point);
        }
      }
    }
  });

  // 컴포넌트가 마운트 해제될 때 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* 최소 클릭 효과 원 */}
      {clickEffect && clickPosition && (
        <mesh ref={effectRingRef} position={[clickPosition.x, clickPosition.y + 0.01, clickPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35]} /> {/* 얇은 링 */}
          <meshBasicMaterial color={'#e0e0e0'} transparent opacity={0.4 * effectScale} />
        </mesh>
      )}

      {/* 레이캐스팅을 위한 전용 충돌 평면 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]} // 바닥보다 약간 위
        visible={isDevelopment} // 개발 모드에서만 표시
        userData={{ isFloor: true, isTargetingFloor: true }}
        name="targeting-floor"
      >
        <planeGeometry args={[1000, 1000]} /> {/* 더 나은 레이캐스팅을 위한 더 큰 평면 */}
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.1} />
      </mesh>
    </>
  );
};
