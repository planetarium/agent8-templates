# Project Status

## 기본 컨셉 (Placeholder — 반드시 교체)

| 항목 | 기본값 |
|------|--------|
| 게임명 | REALM OF RELICS |
| 장르 | 3D 쿼터뷰 오픈월드 자원 수집 |
| 플레이어 | 인간 캐릭터 (base-model.glb) |
| 수집품 | Crystal (공통/희귀/에픽 색상 변형 3종) |
| 환경 오브젝트 | 나무 (tree.glb), 바위 (rock.glb) |
| 서버 에셋 키 | `crystal` |
| CrossRamp 상태 | 배포됨 (project_id: ce7405d220fc5a66a763fc6dbcd6a226) |

> 위 값들은 **placeholder 기본값**. 새 게임 제작 시 전부 교체한다.

---

## ⚠️ 첫 프롬프트 필수 체크리스트

**아래 3개를 첫 프롬프트에서 반드시 완료. 순서 준수.**

### Phase 1 — CrossRamp (최우선)
- [ ] **Step 1**: `read_gameserver_sdk_v2` 호출 → 서버 SDK 문서 읽기
- [ ] **Step 2**: `read_gameserver_sdk_crossramp` 호출 → CrossRamp 배포, `.crossramp` 파일 생성/갱신
  - `.crossramp`의 `asset_keys`가 새 수집품 에셋 키와 일치하는지 확인

### Phase 2 — 오브젝트 컨셉 교체
- [ ] **Step 3**: 세계관/수집품/환경 컨셉 결정 (에이전트가 창의적으로 선정 — `docs/project-3d-rules.md` 섹션 1-B 참조)
- [ ] **Step 4**: `src/assets.json` 업데이트
  - `objects.crystal.url` → 새 수집품 GLB
  - `objects.tree.url` → 새 환경 오브젝트1 GLB
  - `objects.rock.url` → 새 환경 오브젝트2 GLB
  - `characters.base-model.url` → 새 플레이어 GLB (필요 시)
- [ ] **Step 5**: `LootManager.tsx` → `VARIANT_COLORS` 3종을 컨셉 색상으로 교체
- [ ] **Step 6**: `server/src/server.ts` → `$asset.mint('crystal')` 키를 새 수집품 키로 변경
  - **함수명 `collectCrystal` / `getMyAssets`는 절대 변경 금지**

### Phase 3 — UI 전면 재설계 (Phase 2와 동시 진행 — 절대 나중으로 미루지 말 것)
- [ ] **Step 7**: `TitleScene.tsx` 재설계
  - 게임명 (h1), 부제, 크리스탈 SVG 아이콘, 배경 색상, 파티클 색상, 버튼 텍스트
  - "Crystals" 라벨 → 새 수집품명으로
- [ ] **Step 8**: `InventoryHUD.tsx` 재설계
  - `assets?.crystal` → 새 에셋 키로
  - SVG 아이콘, "Crystals" 라벨, 색상 테마, 교환 버튼 텍스트
- [ ] **Step 9**: `MiningProgressUI.tsx` 재설계
  - "⛏ Mining…" 라벨, 색상, 완료 텍스트

### Phase 4 — 검증
- [ ] **Step 10**: 에셋 키 3-way 동기화 최종 확인

| 파일 | 확인 사항 |
|------|----------|
| `server.ts` → `$asset.mint('키')` | `.crossramp` asset_keys와 동일 |
| `InventoryHUD.tsx` → `assets?.키` | 서버 에셋 키와 동일 |
| `TitleScene.tsx`, `InventoryHUD.tsx` | "Crystals" 텍스트 모두 교체됨 |
| `LootManager.tsx` → `VARIANT_COLORS` | 컨셉 색상 적용됨 |

---

## 구현 완료 목록 (변경 없이 사용 가능)

| 기능 | 파일 | 설명 |
|------|------|------|
| 절차적 지형 | `GameEnvironment.tsx` | 128×128 terrain, 수면, 나무/바위 배치 |
| 수집품 스폰/리스폰 | `LootManager.tsx` | 20개 활성, 12초 리스폰, 랜덤 위치 |
| 채집 시스템 | `LootManager.tsx` | 반경 3.0u 접근 → 2.0초 채집 → 수집 |
| CrossRamp 연동 | `TitleScene.tsx`, `InventoryHUD.tsx` | `getCrossRampShopUrl('en')` 팝업 |
| 서버 에셋 민팅 | `server.ts` + `LootManager.tsx` | `collectCrystal()` → `$asset.mint()` |
| 모바일 UI | 전체 UI | safe-area, 44px 탭타겟, 조이스틱 |
| 화질 설정 | `QualitySettingsMenu.tsx` | Low/Medium/High + localStorage 저장 |
| 수집 파티클 | `CollectEffect.tsx` | 수집 시 이펙트 |
| InventoryHUD 버스트 | `InventoryHUD.tsx` | 수집 시 아이콘 확대 + +N 텍스트 |

---

## 후속 개선 (선택)

- [ ] qualityStore의 `maxCrystals` config를 LootManager에 연결
- [ ] 색상 변형별 희귀도 가중치 (보라 > 파랑/초록)
- [ ] 서버 중복 민팅 방지 로직
