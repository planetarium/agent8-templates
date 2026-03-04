# Boilerplate Context

## ⚠️ 첫 프롬프트 필수 작업 (3가지, 동시 완료)

> **첫 프롬프트에서 아래 3가지를 반드시 함께 완료. 나중으로 미루지 말 것.**
>
> 1. **CrossRamp 배포**: `read_gameserver_sdk_v2` → `read_gameserver_sdk_crossramp` 호출
> 2. **오브젝트 컨셉 교체**: 수집품 모델/색상, 환경 오브젝트, 플레이어 모델 (`assets.json`, `LootManager.tsx`)
> 3. **UI 전면 재설계**: TitleScene, InventoryHUD, MiningProgressUI — 아이콘, 색상, 텍스트 전체 교체
>
> 오브젝트만 교체하고 UI를 기본값으로 두는 것은 허용되지 않는다.

---

## 이 프로젝트란

**3D 탑다운(쿼터뷰) 오픈월드 자원 수집** 모바일 게임 보일러플레이트.

기본 컨셉 "Realm of Relics" (크리스탈 채집 → RLM 토큰 교환)는 **placeholder**. 새 게임마다 전혀 다른 세계관, 수집품, UI로 교체해야 한다.

## 핵심 규칙

> **CONCEPT ≠ BLOCKCHAIN**: `CROSS`, `chain`, `token` 등은 기술 스펙이며 게임 세계관과 무관. 이 키워드가 있다고 사이버펑크/SF를 선택하지 말 것. `docs/project-3d-rules.md` 섹션 1-B의 조합 테이블로 새 세계관 생성.

> **CrossRamp 먼저**: 에셋 생성이나 UI 작업 전에 `read_gameserver_sdk_v2` + `read_gameserver_sdk_crossramp` 호출. `.crossramp` 파일의 asset_keys가 수집품 에셋 키와 일치하는지 확인.

> **에셋 키 3-way 동기화**: 수집품 키를 변경하면 반드시 3곳 동기화:
> - `server.ts` → `$asset.mint('새키')`
> - `InventoryHUD.tsx` → `assets?.['새키']`
> - `.crossramp` → `asset_keys: ["새키"]`

## 아키텍처

```
App.tsx (페이즈 관리: loading → title → game)
├── PreloadScene.tsx    (에셋 preload)
├── TitleScene.tsx      (제목 화면 — 교체 대상)
└── GameScene.tsx       (게임 메인 — 레이아웃 컨테이너)
    ├── GameSceneUI.tsx  (HTML UI — Canvas 외부)
    │   ├── InputController.tsx    (조이스틱 + 키보드)
    │   ├── InventoryHUD.tsx       (수집품 카운터 + 교환 버튼 — 교체 대상)
    │   ├── MiningProgressUI.tsx   (채집 진행 바 — 교체 대상)
    │   ├── QualitySettingsMenu.tsx (화질 설정)
    │   └── LoadingScreen.tsx      (로딩 오버레이)
    └── GameSceneCanvas.tsx (Canvas + Physics + Lights)
        └── Experience.tsx → GameEnvironment.tsx
            ├── Player.tsx        (플레이어 캐릭터)
            └── LootManager.tsx   (수집품 스폰/채집/리스폰 — 교체 대상)
```

**페이즈 흐름**: loading → title → game (게임 오버 없음 — 무한 채집)

## 기술 스택

- React 18 + TypeScript + Vite
- Three.js + React Three Fiber 8 + @react-three/rapier 1.5
- vibe-starter-3d (QuarterViewController, CharacterRenderer)
- vibe-starter-3d-environment (절차적 지형, 수목, 수면)
- Zustand 5 (inventoryStore, miningStore, localPlayerStore, qualityStore)
- nipplejs (모바일 조이스틱 — 항상 활성, IS_MOBILE 게이팅 없음)
- @agent8/gameserver (GameServerProvider, CROSS 연동)

## CrossRamp 연동 현황

- `.crossramp` 파일: 루트에 존재 (`asset_keys: ["crystal"]`)
- 서버 함수: `collectCrystal(id)` → `$asset.mint('crystal', 1)`, `getMyAssets()` → `$asset.getAll()`
- 클라이언트: `server.getCrossRampShopUrl('en')` → 팝업 창

## 절대 변경 금지

- `server.ts` 함수명 `collectCrystal` / `getMyAssets` (클라이언트 하드코딩)
- `GameScene.tsx` 내 useState/useEffect (레이아웃 컨테이너 전용)
- Canvas 내 HTML 컴포넌트 (UI는 src/components/ui/에서만)
- `TitleScene.tsx`의 `onStart` callback (App.tsx 연결)

## 채집 시스템 (LootManager.tsx 핵심 수치)

| 상수 | 값 | 설명 |
|------|----|------|
| `MAX_ACTIVE` | 20 | 동시 활성 수집품 수 |
| `MINING_TRIGGER_RADIUS` | 3.0 유닛 | 채집 시작 반경 |
| `MINING_CANCEL_RADIUS` | 4.5 유닛 | 채집 취소 반경 |
| `MINING_DURATION` | 2.0초 | 채집 소요 시간 |
| `RESPAWN_DELAY` | 12초 | 수집 후 리스폰 대기 |

## UI 레이아웃 (모바일 안전 영역 적용됨)

| 요소 | 위치 | 비고 |
|------|------|------|
| InventoryHUD | 좌상단 | safe-area-inset 적용 |
| QualitySettingsMenu | 우상단 | safe-area-inset 적용 |
| MiningProgressUI | 하단 중앙 | 조이스틱 위 (28%+) |
| InputController | 하단 전체 | 조이스틱(좌) + 액션버튼(우) |
