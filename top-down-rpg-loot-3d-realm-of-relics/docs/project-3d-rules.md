# 3D 오픈월드 자원 수집 게임 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **Realm of Relics가 이미 완전히 구현된 상태**입니다.

> ⚠️ **절대 중요**: 이 템플릿은 빈 보일러플레이트가 아닙니다. 판타지 세계를 탐험하며 Luminite 결정을 채집하고 CROSS 토큰으로 교환하는 3D 탑다운 오픈월드 게임이 이미 완성되어 있습니다.

## 섹션 0-1 — 첫 프롬프트 금지 사항 (CRITICAL)

> 🚫 첫 프롬프트에서 아래 작업들을 **절대 수행하지 마십시오**:
1. 에셋 생성 금지
2. UI 재설계 금지
3. 컨셉 재창조 금지
4. config/ 파일 전면 교체 금지
5. 사용자 요청 없이 코드 수정 금지

## 섹션 0-2 — 첫 프롬프트 필수 행동

1. 기존 코드 파악 (`PROJECT/Structure.md` 참조)
2. 사용자에게 현재 구현 보고
3. 변경 사항 확인
4. **CrossRamp 배포 (필수 — 절대 생략 금지)**:
   - `read_gameserver_sdk_v2` 호출
   - `read_gameserver_sdk_crossramp` 호출
   - `.crossramp` `asset_keys`가 `server.ts`의 `$asset.mint('luminite')` 키와 일치하는지 확인

---

## 섹션 0-3 — 이 템플릿의 원래 목적 (참고)

이 템플릿의 기반 보일러플레이트는 **3D 탑다운 오픈월드 자원 수집** 게임이며, 같은 구조에서 다양한 테마의 게임을 만들 수 있습니다.

## 섹션 1 — 컨셉 수령 절차

### 1-A. 사용자가 컨셉을 제공한 경우

**블록체인 키워드 ≠ 게임 컨셉**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` 등은 **기술 스펙**이며 게임 세계관에 영향을 주지 않는다. 이 키워드만 있고 세계관이 명시되지 않았다면 → **1-B 이동**.

1. **세계관 추출**: 판타지/자연/신화/해양/우주 등 배경
2. **수집품 추출**: 무엇을 모으는가 (광석, 허브, 유물, 조개, 결정 등)
3. **환경 추출**: 어떤 지형과 오브젝트인가 (숲/동굴/해저/사막 등)
4. **색상/분위기 추출**: UI 색상 테마, 수집품 색상 변형 3종

### 1-B. 사용자가 컨셉을 제공하지 않은 경우

**자동 선택 금지**: 사이버펑크, SF — 사용자가 명시 요청한 경우에만 사용.

아래 조합 테이블은 **영감 소스** — 표에 없는 새로운 조합을 만드는 것을 권장.

| 세계관 | 수집품 | 환경 오브젝트 | 색상 테마 |
|--------|--------|---------------|----------|
| 북유럽 신화 | 룬 석 | 고목, 바이킹 석상 | 청회색 / 금색 |
| 해저 탐험 | 산호 결정 | 해초, 바위 산호 | 청록 / 민트 |
| 마법 숲 | 요정 씨앗 | 버섯 나무, 빛나는 꽃 | 초록 / 보라 |
| 화산 지대 | 용암 결정 | 화산암, 불꽃 풀 | 주황 / 빨강 |
| 고대 신전 | 황금 유물 | 석주, 덩굴 폐허 | 황금 / 황토 |
| 빙하 왕국 | 빙정 | 얼음 나무, 눈 바위 | 흰색 / 아이스블루 |
| 사막 신전 | 보석 모래 | 선인장, 오아시스 돌 | 황색 / 주황 |
| 우주 정거장 | 광물 결정 | 안테나 구조물, 운석 | 은색 / 네온 |

> 표에 없는 완전히 새로운 조합이 더 좋다. 위는 영감을 위한 예시일 뿐이다.

---

## 섹션 2 — 전면 재창조 체크리스트 (순서대로 실행)

> **⚠️ 첫 프롬프트에서 아래 전부 완료** — 나중으로 미루지 말 것.

### Step 1 — CrossRamp 배포 (최우선 — 첫 번째로 실행)

```
1. read_gameserver_sdk_v2 호출 → 서버 SDK 문서 읽기
2. read_gameserver_sdk_crossramp 호출 → CrossRamp 배포
   → 루트에 .crossramp 파일 생성됨 (기존 파일 있어도 재실행)
3. .crossramp의 asset_keys가 수집품 에셋 키와 일치하는지 확인
```

> `.crossramp` 파일이 이미 존재하더라도 **컨셉 변경 시 반드시 재실행** (에셋 키가 바뀔 수 있음).

### Step 2 — 서버 에셋 키 동기화

`server/src/server.ts`에서 `$asset.mint('crystal', 1)` → 새 수집품 키로 변경.

```typescript
// 예: 허브를 수집하는 게임이라면
async collectCrystal(_crystalId: string): Promise<Record<string, number>> {
  return await $asset.mint('herb', 1);  // 'crystal' → 새 키
}
// ⚠️ 함수명 collectCrystal / getMyAssets는 절대 변경 금지
```

### Step 3 — assets.json 업데이트 (에셋 URL 전부 교체 필수)

> **⚠️ 에셋 URL을 실제로 교체해야 한다.** 기존 URL을 그대로 두면 게임 외형이 바뀌지 않는다.
> 이미지 생성 도구(나노바나나프로 등)로 3D GLB 에셋을 생성하거나, 에셋 라이브러리에서 URL을 가져와야 한다.

```json
{
  "objects": {
    "crystal": { "url": "새 수집품 GLB URL" },      ← 반드시 교체
    "tree":    { "url": "새 환경 오브젝트1 GLB URL" }, ← 반드시 교체
    "rock":    { "url": "새 환경 오브젝트2 GLB URL" }  ← 반드시 교체
  },
  "characters": {
    "base-model": { "url": "새 플레이어 GLB URL" }   ← 반드시 교체
  }
}
```

**캐릭터 에셋 교체 주의사항:**
- `characters.base-model.url`에 새 GLB URL을 지정하면 `Player.tsx`가 자동으로 해당 모델을 로드함
- 에셋 생성 도구로 컨셉에 맞는 3D 캐릭터 GLB를 생성하거나 에셋 라이브러리에서 적합한 모델 URL을 선택할 것
- URL을 교체하지 않으면 기존 기사 캐릭터가 그대로 표시됨

### Step 3-B — GameEnvironment.tsx 지형(바닥) 텍스처 설정

> **⚠️ 지형 텍스처를 교체하지 않으면 바닥이 기본 녹색 잔디로 표시된다.** 컨셉 세계관에 맞는 텍스처로 반드시 교체.

`splatting` prop으로 고도/경사에 따라 최대 4개의 텍스처를 자동 블렌딩한다.

**`GameEnvironment.tsx` 상단에 import 추가:**

```tsx
import { Terrain, Water, ModelPlacer, TerrainData, terrainUtil, DEFAULT_TEXTURE_PATHS } from 'vibe-starter-3d-environment';
```

#### 텍스처 URL 획득 방법

**1순위 — 패키지 내장 텍스처 (`DEFAULT_TEXTURE_PATHS.TERRAIN`):**

| 키 | 사용 용도 |
|----|-----------|
| `GRASS` / `GRASS_NORMAL` / `GRASS_AO` | 잔디 평지 |
| `DIRT` / `DIRT_NORMAL` / `DIRT_AO` | 흙 경사 |
| `STONE` / `STONE_NORMAL` / `STONE_AO` | 돌/암석 절벽 |
| `GRAVEL` / `GRAVEL_NORMAL` / `GRAVEL_AO` | 자갈 |
| `SAND` / `SAND_NORMAL` / `SAND_AO` | 모래 |
| `SNOW` / `SNOW_NORMAL` / `SNOW_AO` | 눈 |
| `ASPHALT` / `ASPHALT_NORMAL` / `ASPHALT_AO` | 아스팔트/도시 |

**2순위 — vectordb/에셋 라이브러리 검색:**

내장 텍스처로 컨셉을 표현하기 어려운 경우(용암, 얼음 크랙, 달 표면 등) → **에셋 검색 도구로 텍스처 URL을 검색**:
- 검색 키워드 예: `"lava texture"`, `"ice crack ground"`, `"mud terrain"`, `"volcanic rock"`, `"cobblestone"`, `"sand dunes"`
- 검색된 텍스처 PNG/JPG URL을 `materialProps.map`에 직접 사용 가능

#### `splatting` prop 구조

```tsx
<Terrain
  seed="desert-ruins"         {/* 컨셉명으로 교체 — 지형 모양 결정 (문자열 아무거나) */}
  color="#c2a06e"             {/* 텍스처 위 기본 색조 */}
  maxHeight={5}
  roughness={0.5}
  detail={4}
  width={128}
  depth={128}
  friction={1}
  restitution={0}
  onTerrainDataReady={handleTerrainDataReady}
  splatting={{
    textures: [
      {
        materialProps: {
          map: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND,        // 또는 검색한 텍스처 URL
          normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND_NORMAL,
          aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND_AO,
          roughness: 0.9,   // 0~1
          metalness: 0.0,   // 0~1
        },
        repeat: 2,                     // 타일 반복 횟수 (1~2 권장)
        heightRange: [0.0, 0.5],       // 적용 고도 범위 (0.0~1.0 비율)
        slopeRange: [0.0, 0.3],        // 적용 경사 범위 (라디안, 0~Math.PI/2)
        heightBlendRange: 0.15,        // 경계 블렌드 너비
      },
      // ... 최대 4개까지
    ],
    mode: 'both',            // 'height' | 'slope' | 'both'
    defaultBlendRange: 0.15,
  }}
/>
```

#### 컨셉별 완성 예시

**사막/신전 — 모래(평지) + 자갈(경사) + 돌(절벽):**

```tsx
splatting={{
  textures: [
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.SAND_AO, roughness: 0.9 },
      repeat: 2, heightRange: [0.0, 0.5], slopeRange: [0.0, 0.3], heightBlendRange: 0.15,
    },
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.GRAVEL, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.GRAVEL_NORMAL, roughness: 0.85 },
      repeat: 2, heightRange: [0.4, 0.75], slopeRange: [0.2, Math.PI / 2], heightBlendRange: 0.15,
    },
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_AO, roughness: 0.8 },
      repeat: 1, heightRange: [0.6, 1.0], slopeRange: [0.4, Math.PI / 2], heightBlendRange: 0.1,
    },
  ],
  mode: 'both', defaultBlendRange: 0.15,
}}
```

**빙하/설원 — 눈(평지) + 자갈(경사) + 돌(절벽):**

```tsx
splatting={{
  textures: [
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.SNOW, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.SNOW_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.SNOW_AO, roughness: 0.95 },
      repeat: 2, heightRange: [0.0, 0.6], slopeRange: [0.0, 0.35], heightBlendRange: 0.15,
    },
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.GRAVEL, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.GRAVEL_NORMAL, roughness: 0.8 },
      repeat: 2, slopeRange: [0.3, 0.6], heightBlendRange: 0.1,
    },
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_AO, roughness: 0.75 },
      repeat: 1, slopeRange: [0.55, Math.PI / 2], heightBlendRange: 0.1,
    },
  ],
  mode: 'both', defaultBlendRange: 0.15,
}}
```

**마법 숲 — 잔디(평지) + 흙(경사) + 돌(절벽):**

```tsx
splatting={{
  textures: [
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.GRASS, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.GRASS_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.GRASS_AO, roughness: 0.85 },
      repeat: 2, heightRange: [0.0, 0.55], slopeRange: [0.0, 0.3], heightBlendRange: 0.15,
    },
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.DIRT_AO, roughness: 0.9 },
      repeat: 2, slopeRange: [0.25, 0.55], heightBlendRange: 0.12,
    },
    {
      materialProps: { map: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE, normalMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_NORMAL, aoMap: DEFAULT_TEXTURE_PATHS.TERRAIN.STONE_AO, roughness: 0.75 },
      repeat: 1, slopeRange: [0.5, Math.PI / 2], heightBlendRange: 0.1,
    },
  ],
  mode: 'both', defaultBlendRange: 0.15,
}}
```

> `seed` 값: 컨셉명을 영어로 넣으면 됨 (`"volcanic-wastes"`, `"frozen-tundra"` 등). 같은 seed → 항상 같은 지형 모양.

### Step 4 — LootManager.tsx 수집품 비주얼

**수집품 GLB 모델**: `Assets.objects.crystal.url` → Step 3에서 교체한 URL이 자동 반영됨

**수집품 색상 변형 (VARIANT_COLORS)**: 3종의 색상을 컨셉에 맞게 반드시 교체.

```typescript
// LootManager.tsx의 VARIANT_COLORS 교체
// emissive = 수집품 발광 색상, glow = 글로우 색상 (보통 emissive의 밝은 버전)
const VARIANT_COLORS: Array<{ emissive: string; glow: string }> = [
  { emissive: '#ff8844', glow: '#ffcc88' }, // 변형 1 — 컨셉 주 색상
  { emissive: '#ffee44', glow: '#ffffaa' }, // 변형 2 — 컨셉 보조 색상
  { emissive: '#ff4444', glow: '#ffaaaa' }, // 변형 3 — 컨셉 희귀 색상
];
```

> `color`와 `emissive`가 모두 이 팔레트에서 설정되므로, 색상이 올바르게 표시되려면 반드시 교체해야 함.

### Step 5 — TitleScene.tsx 전면 재작성 (완전히 새로 만들 것)

> **🚫 절대 금지: 텍스트/색상만 교체하고 넘어가는 것.**
> **⚠️ TitleScene.tsx는 첫 프롬프트에서 반드시 전면 재작성한다. 나중에 "필요하면" 바꾸는 것이 아님.**
> 기존의 "별빛 보라/남색 배경 + 크리스탈 SVG + Georgia 폰트" 조합을 그대로 두는 것은 재사용이지 재설계가 아니다.
> 컨셉에 맞는 완전히 다른 배경 연출, 아이콘 SVG, 레이아웃으로 재작성해야 한다.

재작성 필수 항목:

| 항목 | 기존 기본값 | 교체 방향 |
|------|-----------|----------|
| 배경 스타일 | 보라/남색 별빛 그라데이션 + 떠오르는 파티클 | 컨셉 세계관에 맞는 완전히 다른 배경 연출 |
| 타이틀 SVG 아이콘 | 파란 크리스탈 폴리곤 | 컨셉 수집품 형태 SVG (직접 작성) |
| 게임명 h1 | "REALM" / "OF RELICS" | 새 게임명 (2줄 구성 유지하거나 변경) |
| 부제 p | "COLLECT · EXPLORE · TRANSCEND" | 컨셉 키워드 3개 |
| 배경 색상 팔레트 | 남색/보라 계열 | 컨셉 세계관 색상 |
| 글로우 오브 색상 | `rgba(100, 0, 255, ...)` | 컨셉 색상 |
| 버튼 텍스트 | "ENTER THE REALM" | 컨셉에 맞는 입장 문구 |
| 교환 버튼 텍스트 | "⇄ EXCHANGE CRYSTALS" | 수집품명으로 |
| 배지의 수집품 라벨 | "Crystals" | 새 수집품명 |
| 폰트 패밀리 | Georgia serif | 컨셉에 맞는 폰트 |

**나쁜 예 (텍스트만 바꿈 — 금지)**:
```tsx
// ❌ "REALM" → "FOREST" 로만 바꾸고 나머지 그대로 = 재사용이지 재설계가 아님
```

**좋은 예 (전면 재설계)**:
- 해저 컨셉: 어두운 청록 배경 + 거품 파티클 + 조개껍데기 SVG 아이콘 + sans-serif 폰트
- 화산 컨셉: 오렌지/빨강 배경 + 불꽃 파티클 + 용암 결정 SVG + 굵은 Impact 폰트
- 마법 숲: 진초록 배경 + 반딧불이 파티클 + 잎사귀 SVG + 필기체 폰트

### Step 6 — InventoryHUD.tsx + MiningProgressUI.tsx 재설계

**`InventoryHUD.tsx`** 교체 항목:
- `assets?.crystal` → 새 에셋 키로 (서버 키와 동일, 필수)
- SVG 아이콘 → 수집품 형태로 완전히 새로운 SVG 작성
- "Crystals" 라벨 → 수집품명으로
- 색상 팔레트 (`#4488ff`, `rgba(100, 160, 255, ...)`) → 컨셉 색상
- "⇄ Exchange" 버튼 텍스트 → "⇄ EXCHANGE [수집품명]" 으로

**`MiningProgressUI.tsx`** 교체 항목:
- "⛏ Mining…" → 컨셉 채집 동사 (예: "🌿 Harvesting…", "⚒ Excavating…", "🔱 Gathering…")
- "✓ Collected!" → 컨셉에 맞게
- 진행 바 색상 `#2266ff, #66aaff` → 컨셉 색상
- 완료 색상 `#44ff88` → 컨셉 색상

### Step 6 — JUICE 효과 추가 (섹션 4 참조)

### Step 7 — 최종 동기화 검증

| 파일 | 확인 사항 |
|------|----------|
| `server.ts` → `$asset.mint('키')` | `.crossramp` asset_keys와 동일한가 |
| `InventoryHUD.tsx` → `assets?.키` | 서버 에셋 키와 동일한가 |
| `TitleScene.tsx`, `InventoryHUD.tsx` | "Crystals" 텍스트 모두 수집품명으로 교체됐는가 |
| `TitleScene.tsx` | 배경/SVG/폰트가 기존 별빛 보라 스타일에서 완전히 벗어났는가 |
| `LootManager.tsx` → `VARIANT_COLORS` | 컨셉 색상으로 교체됐는가 |
| `GameEnvironment.tsx` → `<Terrain color>` | 기본 녹색 `#2e4a22` 에서 컨셉 색상으로 교체됐는가 |
| `GameEnvironment.tsx` → `<Terrain seed>` | `"realm-relics"` 에서 컨셉 시드로 교체됐는가 |
| `assets.json` → 모든 4개 URL | 기존 placeholder URL에서 실제 컨셉 에셋 URL로 교체됐는가 |

---

## 섹션 3 — UI 재설계 상세 가이드

**UI는 이름/색상만 바꾸는 것이 아님.** 컨셉에 맞게 아이콘, 레이아웃, 애니메이션 스타일 전체를 재설계.
**기존 TitleScene의 "별빛 배경 + 크리스탈 아이콘 + 보라 그라데이션" 조합을 그대로 유지하는 것은 금지.**

### TitleScene.tsx — 완전 재작성 기준

배경 연출 방향 예시 (컨셉에 따라 하나 선택 또는 새 아이디어):

| 컨셉 유형 | 배경 스타일 | 파티클 | 색상 |
|----------|-----------|--------|------|
| 자연/숲 | 녹색 안개 레이어 | 반딧불이 (작은 원형 점) | 초록/황록 |
| 해저 | 깊은 청록 그라데이션 + 빛 굴절 | 거품 (원형 위로) | 청록/민트 |
| 화산/용암 | 주황-빨강 하단 빛 | 불꽃 파티클 (위로) | 주황/빨강 |
| 고대 신전 | 황금빛 사막 하늘 | 모래 먼지 | 황금/황토 |
| 빙하/눈 | 차가운 청백 | 눈송이 (아래로) | 흰색/아이스블루 |
| 우주 | 검정 + 성운 오버레이 | 별빛 (깜빡임) | 은색/네온 |

### InventoryHUD.tsx

- **배경/보더**: `rgba(5, 10, 30, ...)`, `rgba(100, 160, 255, ...)` → 컨셉 색상으로 전면 교체
- **SVG 아이콘**: 크리스탈 폴리곤 SVG → 수집품 형태 완전히 새로 작성
- **글로우**: `drop-shadow(0 0 4px #4488ff)` → 컨셉 색상
- **교환 버튼**: 보라 계열 → 컨셉 색상

### MiningProgressUI.tsx

- **이모지 + 텍스트**: ⛏, ✓ → 컨셉 동사 (채집/발굴/수확/채집)
- **진행 바 색상**: `#2266ff → #66aaff` → 컨셉 색상
- **완료 색상**: `#44ff88` → 컨셉 색상

---

## 섹션 4 — JUICE 필수 체크리스트

**첫 프롬프트에서 게임 완성도와 함께 적용.** Don't be boring!

| 항목 | 상태 | 참고 |
|------|------|------|
| **수집 파티클** | 기본 구현됨 | `CollectEffect.tsx` — 색상만 컨셉으로 |
| **수집품 부유/회전** | 기본 구현됨 | `CrystalItem.tsx` useFrame float bob |
| **채집 중 강조 (pulse)** | 기본 구현됨 | `isBeingMined` → emissiveIntensity 증가 |
| **InventoryHUD 버스트** | 기본 구현됨 | 수집 시 아이콘 확대 + 글로우 |
| **화면 플래시** | 기본 구현됨 | radial-gradient 오버레이 |
| **+N 텍스트** | 기본 구현됨 | floating text 애니메이션 |
| **타이틀 파티클** | 기본 구현됨 | `TitleScene.tsx` — 색상만 교체 |
| **모바일 최적화** | 기본 구현됨 | 44px 탭 타겟, safe-area 지원 |

---

## 섹션 5 — 절대 변경 금지

- **`server.ts` 함수명** `collectCrystal` / `getMyAssets` — 클라이언트에서 하드코딩 호출
- **`GameScene.tsx`의 useState/useEffect** — 레이아웃 컨테이너 전용
- **Canvas 내 HTML** — UI는 `src/components/ui/`에서 Canvas 외부 렌더링
- **`TitleScene.tsx`의 `onStart` callback** — App.tsx 페이즈 전환에 연결
- **`GameSceneUI.tsx`의 컴포넌트 구조** — InputController, InventoryHUD, MiningProgressUI, QualitySettingsMenu, LoadingScreen 구조 유지

---

## 섹션 6 — 기술 규칙

### Canvas 구조

```tsx
// ✅ 올바른 구조
<div>
  <Canvas>
    <Experience />       {/* GameEnvironment → Player + LootManager */}
    <GameSceneCanvas />  {/* Physics + Lights + QuarterViewController */}
  </Canvas>
  <GameSceneUI />        {/* 모든 HTML UI — Canvas 외부 */}
</div>

// ❌ 잘못된 구조
<Canvas>
  <InventoryHUD />  {/* HTML div 포함 — 절대 금지 */}
</Canvas>
```

### 채집 시스템 흐름

```
플레이어 이동 → LootManager useFrame 거리 체크
→ 거리 < 3.0 유닛 → startMining(id) → miningStore 진행 업데이트
→ 2.0초 후 → handleLootCollected(id)
  → inventoryStore.collectCrystal(1)
  → server.remoteFunction('collectCrystal', [id])  ← 서버 에셋 mint
  → 12초 후 새 랜덤 위치에 respawn
```

### CrossRamp 연동 (이미 구현됨 — 텍스트만 교체)

```typescript
// TitleScene.tsx + InventoryHUD.tsx
const url = await server.getCrossRampShopUrl('en');
window.open(url, 'CrossRampShop', 'width=1024,height=768');
```

### 에셋 키 변경 시 반드시 동기화할 3개 지점

```
1. server/src/server.ts → $asset.mint('새키', 1)
2. InventoryHUD.tsx → assets?.['새키']
3. .crossramp → asset_keys: ["새키"]  (read_gameserver_sdk_crossramp 재실행)
```

### GameScene.tsx 성능 규칙

```tsx
// ❌ GameScene.tsx에서 절대 금지
const [state, setState] = useState(...);
useEffect(() => { setState(...); }, [...]);
<Component style={{ color: 'red' }} />  // 인라인 객체 금지
```

</userRequest>
