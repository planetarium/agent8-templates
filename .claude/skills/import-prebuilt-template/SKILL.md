---
name: import-prebuilt-template
description: Use when given a git repository URL OR a verse8.io creator editor URL for a completed game template to add to agent8-templates. Applies to any fully implemented game that should be registered as a pre-built template with CrossRamp integration guidance.
---

# Import Pre-built Template into agent8-templates

## Overview

A completed game repo를 agent8-templates에 등록하는 절차입니다. 빈 보일러플레이트와 달리 **이미 완성된 게임**이므로, 에이전트가 첫 프롬프트에서 게임을 재창조하지 않도록 문서를 설정합니다. CrossRamp는 프로젝트별 파일(`.crossramp`, `.env`)이 제거되므로 첫 프롬프트에서 항상 재배포해야 합니다.

---

## 입력 URL 유형별 처리

### verse8.io creator editor URL이 주어진 경우

URL 예시:
```
https://verse8.io/creator/editor?chat=jonny%2Fsurvivors-like-2d-action-mobile-game-cross-token
```

GitLab 레포 URL 변환 방법:
1. `chat` 쿼리 파라미터 값을 URL 디코딩: `jonny%2F<repo>` → `jonny/<repo>`
2. GitLab URL 조합: `https://gitlab.verse8.io/<chat-value>.git`

변환 예시:
```
chat=jonny%2Fsurvivors-like-2d-action-mobile-game-cross-token
→ https://gitlab.verse8.io/jonny/survivors-like-2d-action-mobile-game-cross-token.git
```

변환된 GitLab URL을 아래 Step 1의 `<REPO_URL>`로 사용합니다.

---

## 절차 (순서대로 실행)

### Step 1 — 레포 클론, 브랜치 체크아웃, 디렉토리 이름 결정

**디렉토리 이름 규칙**: 레포 URL의 숫자/랜덤 식별자를 사용하지 말고, **게임 테마명**으로 지정합니다.
- ❌ `survivors-mobile-cross-game-1773039864638`
- ✅ `survivors-like-2d-action-aether-alchemist` (게임명: AETHER ALCHEMIST)
- ✅ `survivors-like-2d-action-neon-strikers` (게임명: NEON STRIKERS)

단, 레포 이름 자체가 이미 의미 있는 테마명인 경우(숫자/랜덤 식별자 없음) → **레포 이름을 그대로 디렉토리명으로 사용**합니다.
- ✅ `survivors-like-2d-action-mobile-game-cross-token` (레포명이 곧 디렉토리명)

게임 테마명을 모를 경우 → 클론 후 `src/config/gameConfig.ts`의 `name` 필드 확인.

```bash
# agent8-templates 루트에서 실행
cd /c/Git_Projects/agent8-templates

# 클론 (원본 이름으로 먼저 받기)
git clone <REPO_URL>

# 원하는 브랜치 체크아웃 (보통 develop)
cd <CLONED_DIR_NAME>
git checkout <BRANCH>

# 게임 테마명 확인
grep -m1 "name:" src/config/gameConfig.ts

# 내부 .git 제거
cd ..
rm -rf <CLONED_DIR_NAME>/.git

# 테마명으로 디렉토리 이름 변경 (예: survivors-like-2d-action-<theme-name>)
mv <CLONED_DIR_NAME> <THEME_BASED_DIR_NAME>
```

> ⚠️ 클론 직후 파일이 README만 있을 수 있음. 반드시 브랜치를 체크아웃한 뒤 파일 확인.

### Step 2 — 프로젝트 특화 파일 제거 + 불필요한 PROJECT 문서 삭제

아래 파일들은 **항상** 제거합니다 (특정 계정/배포 정보 포함):

```bash
rm -f <TEMPLATE_DIR>/.crossramp
rm -f <TEMPLATE_DIR>/.env
rm -f <TEMPLATE_DIR>/committedAt
```

추가로 존재할 수 있는 제거 대상:
- `.env.local`, `.env.production`
- `server/.env`
- 하드코딩된 wallet/account 정보가 있는 파일

**PROJECT/ 폴더의 보일러플레이트 문서도 삭제합니다** (pre-built 템플릿에는 Structure.md만 필요):

```bash
rm -f <TEMPLATE_DIR>/PROJECT/Context.md
rm -f <TEMPLATE_DIR>/PROJECT/Requirements.md
rm -f <TEMPLATE_DIR>/PROJECT/Status.md
```

> ⚠️ 원본 레포에 Context.md / Requirements.md / Status.md가 존재할 경우 반드시 삭제. 이 파일들은 빈 보일러플레이트용이며, pre-built 게임에는 혼란을 유발합니다.

### Step 3 — templates.json 등록

기존에 동일 장르의 트리거 조건을 가진 템플릿이 있으면 **동일한 STRICT TRIGGER CONDITIONS**을 사용합니다.

description에는 반드시 아래 3가지를 포함합니다:
1. **STRICT TRIGGER CONDITIONS** — 동일 장르 기존 템플릿과 동일하게
2. **RANDOM SELECTION REQUIRED** — 동일 조건 템플릿이 여럿이면 랜덤 선택 필수
3. **테마 설명** — 한 문장 게임 테마 요약

```json
{
  "name": "<template-dir-name>",
  "label": "<Game Title> (Pre-built)",
  "description": "⚠️ STRICT TRIGGER CONDITIONS - DO NOT use unless the prompt explicitly mentions CROSS/token/blockchain redemption. ONLY use this template when the user EXPLICITLY mentions ALL of the following: <동일 트리거 조건>. Example prompt: '<예시 프롬프트>'. ⚠️ RANDOM SELECTION REQUIRED: Multiple <장르> templates match this condition — you MUST randomly pick one each time, do NOT always select the same template. Theme: <한 문장 테마 설명>. This template contains a fully pre-built game — do NOT recreate assets or UI on the first prompt.",
  "githubRepo": "planetarium/agent8-templates",
  "path": "<template-dir-name>",
  "tags": [/* 기존 동일 장르 템플릿 태그 + "pre-built" */]
}
```

### Step 4 — 문서 생성/수정

**장르에 따라 수정 대상이 다릅니다.**

---

#### 4A. 2D Phaser 게임 (survivors-like, vertical-shmup 등)

**`<TEMPLATE_DIR>/docs/project-2d-rules.md`** 수정

> ⚠️ **위치 주의**: 루트 `docs/` 폴더가 아니라 `<TEMPLATE_DIR>/docs/project-2d-rules.md` 입니다.

파일 맨 앞부분을 `<userRequest>` wrapper + pre-built 섹션으로 교체합니다. 기존 파일의 일반 규칙(DISPLAY SIZE, TWEENS 등)은 그대로 유지합니다.

**교체 방법**: 기존 파일 맨 앞에 아래 블록을 삽입하거나, 기존 pre-built 블록을 아래 형식으로 덮어씁니다:

```markdown
<userRequest>
## 🚨 PRE-BUILT TEMPLATE — FIRST PROMPT SCOPE (READ THIS FIRST)

This is a COMPLETE, FULLY PLAYABLE game. The first prompt ONLY requires CrossRamp integration.

### ✅ FIRST PROMPT: DO exactly these steps (nothing more)

1. Write `.crossramp` file with token config
2. Call `read_gameserver_sdk_v2`
3. Call `read_gameserver_sdk_crossramp` → deploys CrossRamp
4. Read `server.js` (또는 `server/src/server.ts`) → confirm `<asset-key>` asset key
5. If user specifies a new token/drop name: rename `<asset-key>` in server file, client code, and `.crossramp` (3-way sync)
6. Generate EXACTLY 2 images: **drop item icon** + **token logo** — update `assets.json` drop URL
7. Run `bun run build` to verify

### 🚫 FIRST PROMPT: DO NOT do any of the following

- Generate player / enemy / background / projectile images — game is already built
- Modify `App.tsx`
- Modify `src/config/` files
- Rewrite or retheme game scenes
- Redesign UI layout, colors, or CSS

---

## Rules for subsequent prompts
[기존 rules 내용 그대로 유지]
</userRequest>
```

**서버 파일 경로 주의**:
- survivors-like 템플릿: `server.js` 사용
- vertical-shmup 템플릿: `server/src/server.ts` 사용

파일이 존재하지 않는 경우 → 동일 장르 기존 pre-built 템플릿의 `docs/project-2d-rules.md`를 복사 후 asset-key 수정.

---

#### 4B. 3D 탑다운 게임 (top-down-rpg-loot-3d 등)

> ⚠️ **`docs/project-3d-rules.md`는 수정하지 않습니다.** 이 파일은 모든 3D 템플릿이 공유하는 일반 규칙(RigidBodyObject, Canvas 구조 등)이며 게임별로 다르지 않습니다.

**`<TEMPLATE_DIR>/PROJECT/Structure.md`만** 작성/수정합니다:

```markdown
# Project Structure

## 🚨 CROSSRAMP — FIRST PROMPT MANDATORY

> **NEVER skip CrossRamp deployment. Required on every first prompt without exception.**

- Call `read_gameserver_sdk_v2`
- Call `read_gameserver_sdk_crossramp`
- Verify `.crossramp` `asset_keys` matches server asset key (see table below)

---

## ⚠️ Pre-Built Game — Do NOT Recreate on First Prompt

**You MUST on first prompt:**
1. Read existing code → report current implementation to user
2. Ask what changes the user wants
3. Deploy CrossRamp (MANDATORY — never skip):
   - Call `read_gameserver_sdk_v2`
   - Call `read_gameserver_sdk_crossramp`
   - Verify `.crossramp` `asset_keys` matches `server/src/server.ts` `$asset.mint('<asset-key>')`

**You MUST NOT on first prompt:**
- Generate assets, redesign App.tsx, rewrite config files, or modify any code

---

## Current Game: [게임명]

| Element | Implementation |
|---------|---------------|
| Genre | 3D top-down open world resource collection |
| Collectible | [아이템명] |
| Environment | [환경 설명] |
| Server Asset Key | `<asset-key>` |
| CrossRamp | NOT deployed — deploy on first prompt |

---

## File Map

```
src/
├── assets.json          [CHANGE] GLB URLs
├── App.tsx              [DO NOT MODIFY]
├── stores/
│   ├── inventoryStore.ts [CHANGE]
│   ├── miningStore.ts   [CHANGE]
│   ├── localPlayerStore.ts [DO NOT MODIFY]
│   └── ...
└── components/
    ├── r3f/
    │   ├── GameEnvironment.tsx [CHANGE] terrain/loot placement
    │   ├── LootManager.tsx     [CHANGE] collectible visuals/colors
    │   └── CollectEffect.tsx   [CHANGE] particle colors
    ├── scene/
    │   └── TitleScene.tsx      [CHANGE] full rewrite if rethemed
    └── ui/
        ├── InventoryHUD.tsx    [CHANGE] asset key/colors
        └── MiningProgressUI.tsx [CHANGE] labels/colors
server/src/server.ts            [CHANGE] collectCrystal, getMyAssets
```

---

## Absolute Constraints

- `server.ts` function names (`collectCrystal` / `getMyAssets`) — DO NOT RENAME
- HTML components inside Canvas — FORBIDDEN
- `GameScene.tsx` useState/useEffect — FORBIDDEN

---

## CrossRamp: Currency Rename (if user requests)

3-way sync required:
1. `server/src/server.ts` → `$asset.mint('새키', 1)`
2. `InventoryHUD.tsx` → `assets?.['새키']`
3. `.crossramp` → `asset_keys: ["새키"]` (re-run `read_gameserver_sdk_crossramp`)
```

> ⚠️ Context.md, Requirements.md, Status.md는 **생성하지 않습니다**. Structure.md 하나로 충분합니다.

---

## 체크리스트

```
[ ] Step 1: 클론 → 브랜치 체크아웃 → .git 제거 → 디렉토리 rename
[ ] Step 2a: .crossramp / .env / committedAt 제거
[ ] Step 2b: PROJECT/Context.md, Requirements.md, Status.md 삭제
[ ] Step 3: templates.json에 항목 추가 (STRICT TRIGGER + RANDOM SELECTION + 테마 설명)
[ ] Step 4 (2D): <TEMPLATE_DIR>/docs/project-2d-rules.md — <userRequest> pre-built 섹션으로 교체
[ ] Step 4 (3D): <TEMPLATE_DIR>/PROJECT/Structure.md만 작성 (project-3d-rules.md 수정 금지)
[ ] 최종: git status로 변경 파일 확인
```

---

## 핵심 원칙

| 항목 | 설명 |
|------|------|
| **문서 최소화** | PROJECT/Structure.md 1개만 — Context/Requirements/Status 반드시 **삭제** |
| **2D docs 위치** | `<TEMPLATE_DIR>/docs/project-2d-rules.md` (루트 `docs/` 아님) |
| **2D docs 형식** | `<userRequest>` wrapper + "PRE-BUILT TEMPLATE — FIRST PROMPT SCOPE" |
| **3D docs** | `docs/project-3d-rules.md` **수정 금지** — 공유 파일 |
| **3D 문서** | `PROJECT/Structure.md`만 작성 |
| **첫 프롬프트 (2D)** | .crossramp 작성 → SDK 호출 → 에셋키 확인/rename → 이미지 2개 생성 → bun build |
| **첫 프롬프트 (3D)** | SDK 호출 → 에셋키 확인 — 이미지 생성 없음 |
| **CrossRamp 필수** | `.crossramp` 제거됐으므로 항상 첫 프롬프트에서 재배포 |
| **트리거 동일** | 기존 동일 장르 템플릿과 같은 STRICT TRIGGER CONDITIONS 사용 |
| **RANDOM SELECTION** | 동일 트리거 템플릿 여럿이면 description에 RANDOM SELECTION REQUIRED 필수 |
| **테마 설명** | description에 한 문장 게임 테마 요약 추가 |
