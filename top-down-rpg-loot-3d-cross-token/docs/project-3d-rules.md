# 3D 프로젝트 개발 규칙 (AI 에이전트 지침)

## 1. 게임 콘셉트 결정 방법

### 1-A. 사용자 프롬프트 분석

사용자의 프롬프트에서 다음을 파악한다:
- **세계관**: 어떤 시대/환경인가? (판타지, SF, 서부, 동양, 해양 등)
- **주인공**: 어떤 캐릭터인가? (기사, 마법사, 사무라이, 해적, 우주비행사 등)
- **적**: 어떤 적이 등장하는가?
- **수집품**: 무엇을 모으는가?

> ⚠️ **주의**: `CROSS`, `token`, `blockchain`, `wallet` 키워드는 **기술 스펙**이다. 이 단어들이 있다고 해서 사이버펑크/SF 세계관을 선택하면 안 된다.

### 1-B. 콘셉트 조합 예시 (영감용 — 그대로 복사하지 말 것)

| 세계관 | 주인공 | 적 | 수집품 | 토큰명 |
|--------|--------|-----|--------|--------|
| 북유럽 신화 | 바이킹 전사 | 서리 거인, 좀비 드래곤 | 룬 석 | RXT |
| 이집트 | 파라오 수호자 | 미라, 스카라브 | 황금 앙크 | ANK |
| 동양 무협 | 검객 | 요괴, 도깨비 | 영혼 구슬 | ORB |
| 해저 탐험 | 잠수부 | 상어, 해파리 | 산호 결정 | CRL |
| 서부 개척 | 보안관 | 무법자, 선인장 골렘 | 황금 너겟 | NUG |
| 우주 정거장 | 우주비행사 | 외계인, 로봇 | 광물 결정 | CRY |

> 표에 없는 완전히 새로운 조합을 만드는 것이 더 좋다. 위는 영감을 위한 예시일 뿐이다.

---

## 2. 비주얼 교체 체크리스트 (10단계)

새 게임을 만들 때 반드시 다음 순서로 진행한다:

1. **콘셉트 확정**: 세계관, 주인공, 적, 수집품 결정
2. **플레이어 모델**: `assets.json` → `characters.base-model.url` 교체 (GLB)
3. **애니메이션**: 필요 시 `assets.json` 애니메이션 URL 교체
4. **적 비주얼**: `Enemy.tsx` 캡슐 지오메트리 → 개념에 맞는 모양으로 교체
5. **수집품 비주얼**: `LootGem.tsx` 팔면체 → 개념에 맞는 형태 + 색상
6. **던전 환경**: `DungeonRoom.tsx` 벽 색상/재질, 조명 색상 교체
7. **바닥 재질**: `Floor.tsx` 색상/roughness 교체
8. **TitleScreen**: 게임명, 서브타이틀, 색상, 토큰명, 버튼 텍스트
9. **HUDOverlay**: 아이콘, 수집품 이름, 색상 테마
10. **GameOverScreen + WalletScreen**: 메시지, 토큰명, 교환 비율

> **규칙**: 비주얼 교체와 UI 교체는 **반드시 첫 프롬프트에서 함께** 진행한다. 나중에 미루면 안 된다.

---

## 3. Canvas 구조 규칙 (절대 준수)

### 핵심 규칙: HTML 컴포넌트는 Canvas 내부에 절대 금지

```tsx
// ✅ 올바른 구조
<div>
  <Canvas>
    <Player />       {/* Three.js 컴포넌트 */}
    <Enemy />        {/* Three.js 컴포넌트 */}
    <DungeonRoom />  {/* Three.js 컴포넌트 */}
  </Canvas>

  {/* UI는 Canvas 밖에서 overlay로 렌더링 */}
  <HUDOverlay />
  <TitleScreen />
</div>

// ❌ 잘못된 구조
<Canvas>
  <Player />
  <HUDOverlay />  {/* HTML div 포함 — 금지 */}
</Canvas>
```

**예외**: `@react-three/drei`의 `<Html>` 컴포넌트는 Canvas 내부에서 사용 가능 (drei가 특수 처리).

---

## 4. RigidBodyObject 규칙

물리 상호작용이 필요한 엔티티에는 `@react-three/rapier`의 `RigidBody` 대신 `vibe-starter-3d`의 `RigidBodyObject`를 사용한다.

- **왜**: `RigidBodyObject`는 `onTriggerEnter` / `onTriggerExit` 이벤트를 제공해 충돌 처리가 단순해진다
- **플레이어**: `RigidBodyPlayer` 사용 (이미 구현됨)
- **적**: `RigidBodyObject` 사용 (Enemy.tsx)
- **정적 지오메트리** (벽, 바닥): 일반 `RigidBody` 사용 가능

---

## 5. GameScene.tsx 성능 규칙

```tsx
// ❌ GameScene.tsx에서 절대 금지
const [someState, setSomeState] = useState(false);  // useState 금지
useEffect(() => { setSomeState(true); }, []);        // state 업데이트 금지
<GameSceneCanvas style={{ color: 'red' }} />        // 인라인 객체 금지
```

이 파일은 레이아웃 컨테이너일 뿐이다. 모든 상태는 자식 컴포넌트 (GameSceneUI, GameSceneCanvas) 내부 또는 Zustand 스토어에서 관리한다.

---

## 6. 적 이동 / 공격 패턴

### 적 이동 (Enemy.tsx)
```tsx
// useFrame에서 플레이어를 향해 setLinvel()로 이동
const pos = rigidBodyRef.current.translation();
const playerPos = useLocalPlayerStore.getState().state.position;
const dx = playerPos.x - pos.x;
const dz = playerPos.z - pos.z;
const dist = Math.sqrt(dx*dx + dz*dz);
rigidBodyRef.current.setLinvel({
  x: (dx/dist) * enemy.speed,
  y: 0,
  z: (dz/dist) * enemy.speed
}, true);
```

### 플레이어 근접 공격 (Player.tsx)
```tsx
// meleeAttack 액션 감지 → enemyPositionRegistry에서 거리 확인
const justAttacked = currentAttack && !prevAttackRef.current;
if (justAttacked && cooldown <= 0) {
  enemies.forEach(enemy => {
    const pos = enemyPositionRegistry.get(enemy.id);
    if (!pos) return;
    const dist = distance(playerPos, pos);
    if (dist < ATTACK_RANGE) killEnemy(enemy.id, pos);
  });
}
```

---

## 7. CROSS 토큰 연동 체크포인트

게임 콘셉트를 변경할 때 반드시 4개 지점을 동기화한다:

| 파일 | 변경 사항 |
|------|-----------|
| `gameStore.ts` → `spawnGemAtPosition()` | 수집품 종류/가치 조정 |
| `GameOverScreen.tsx` | `claimGems(gemsPending)` 호출 — 함수명 변경 금지 |
| `server/src/server.ts` | `$asset.mint('gem', amount)` — 에셋 키 `.crossramp`와 동기화 |
| `WalletScreen.tsx` | "100 GEMS = 1 GDT" 표시 업데이트 |

> `.crossramp` 파일은 반드시 `read_gameserver_sdk_crossramp` 도구로 생성한다. 수동으로 만들지 말 것.

---

## 8. 기술 규칙 (위반 시 게임 파손)

- `App.tsx`의 `GameServerProvider` 제거 금지 — CROSS 연동 불가
- `gameStore.ts`의 `startGame()` / `restartGame()` 함수 서명 변경 금지
- `enemyPositionRegistry` 를 Zustand로 교체하지 말 것 — 프레임마다 업데이트되므로 리렌더링 폭주
- `useGameStore` 구독 시 `useGameStore((s) => s.enemies)` 형태 사용 — 불필요한 전체 구독 피하기
- 적 위치를 Zustand state로 저장하지 말 것 — `enemyPositionRegistry` (plain Map) 사용
