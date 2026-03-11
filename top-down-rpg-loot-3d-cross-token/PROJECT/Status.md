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
- [ ] **Step 4**: `src/assets.json` 업데이트 — **URL을 실제로 교체해야 외형이 바뀜**
  - `objects.crystal.url` → 새 수집품 GLB (에셋 생성 도구 또는 라이브러리에서 URL 획득)
  - `objects.tree.url` → 새 환경 오브젝트1 GLB
  - `objects.rock.url` → 새 환경 오브젝트2 GLB
  - `characters.base-model.url` → **새 플레이어 GLB (반드시 교체 — URL 그대로면 기존 기사 캐릭터 유지됨)**
- [ ] **Step 5**: `GameEnvironment.tsx` → `<Terrain>` 지형 텍스처 교체 — **기본 녹색 잔디 그대로 두는 것 금지**
  - `splatting` prop으로 고도/경사별 텍스처 설정 (`docs/project-3d-rules.md` Step 3-B 참조)
  - 내장 텍스처(`DEFAULT_TEXTURE_PATHS.TERRAIN`) 또는 **vectordb/에셋 라이브러리에서 텍스처 URL 검색**하여 사용
  - `seed` prop: 컨셉명 영어로 교체 (예: `"desert-ruins"`, `"frozen-tundra"`)
- [ ] **Step 6**: `LootManager.tsx` → `VARIANT_COLORS` 3종을 컨셉 색상으로 교체
  - `emissive`와 `glow` 모두 컨셉 색상으로 설정 (이 값이 수집품 실제 표시 색상)
- [ ] **Step 7**: `server/src/server.ts` → `$asset.mint('crystal')` 키를 새 수집품 키로 변경
  - **함수명 `collectCrystal` / `getMyAssets`는 절대 변경 금지**

### Phase 3 — UI 전면 재설계 (Phase 2와 동시 진행 — 절대 나중으로 미루지 말 것)
- [ ] **Step 8**: `TitleScene.tsx` **전면 재작성** — 🚫 텍스트/색상만 바꾸고 넘어가는 것 절대 금지
  - **기존 "별빛 보라/남색 배경 + 크리스탈 SVG + Georgia 폰트" 조합을 그대로 두는 것은 재사용이지 재설계가 아님**
  - 배경 연출, SVG 아이콘, 레이아웃, 파티클, 폰트 모두 컨셉에 맞게 완전히 새로 작성
  - 게임명, 부제, 버튼 텍스트, "Crystals" 라벨 → 새 수집품명으로
- [ ] **Step 9**: `InventoryHUD.tsx` 재설계
  - `assets?.crystal` → 새 에셋 키로 (필수)
  - SVG 아이콘, "Crystals" 라벨, 색상 테마, 교환 버튼 텍스트
- [ ] **Step 10**: `MiningProgressUI.tsx` 재설계
  - "⛏ Mining…" 라벨, 색상, 완료 텍스트

### Phase 4 — 검증
- [ ] **Step 11**: 에셋 키 3-way 동기화 + 외형 변경 최종 확인

| 파일 | 확인 사항 |
|------|----------|
| `server.ts` → `$asset.mint('키')` | `.crossramp` asset_keys와 동일 |
| `InventoryHUD.tsx` → `assets?.키` | 서버 에셋 키와 동일 |
| `TitleScene.tsx`, `InventoryHUD.tsx` | "Crystals" 텍스트 모두 교체됨 |
| `TitleScene.tsx` | 배경/SVG/폰트가 기존 보라 스타일에서 완전히 벗어났는가 |
| `LootManager.tsx` → `VARIANT_COLORS` | 컨셉 색상 적용됨 |
| `GameEnvironment.tsx` → `<Terrain splatting>` | 지형 텍스처가 기본 잔디에서 교체됐는가 |
| `assets.json` → 4개 URL | 기존 placeholder URL에서 교체됐는가 |

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
