# 뱀파이어 서바이버류 2D 게임 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **뱀파이어 서바이버류 2D 모바일 게임이 이미 완전히 구현된 상태**입니다 ("AETHER ALCHEMIST" — 판타지 연금술사 테마).

> ⚠️ **절대 중요**: 이 템플릿은 빈 보일러플레이트가 아닙니다. 게임이 이미 완성되어 있습니다.

---

## 섹션 0-1 — 첫 프롬프트 금지 사항 (CRITICAL)

> 🚫 첫 프롬프트에서 아래 작업들을 **절대 수행하지 마십시오**:

1. **에셋 생성 금지** — 새 이미지/스프라이트를 생성하지 마십시오. 기존 에셋이 이미 존재합니다.
2. **UI 재설계 금지** — `App.tsx`를 전면 재작성하지 마십시오.
3. **컨셉 재창조 금지** — 세계관, 적, 능력치를 처음부터 설계하지 마십시오.
4. **파일 전면 교체 금지** — `config/` 파일들을 완전히 새로 작성하지 마십시오.
5. **자동으로 작업 시작 금지** — 사용자가 명시적으로 요청하기 전까지 코드를 수정하지 마십시오.

## 섹션 0-2 — 첫 프롬프트 필수 행동

첫 프롬프트에서 **반드시 다음을 수행**하십시오:

1. **프로젝트 파악**: 기존 코드를 읽고 현재 구현된 게임 컨셉, 에셋, UI를 파악합니다.
2. **사용자에게 보고**: 현재 구현된 내용을 간략히 설명합니다.
3. **변경 사항 확인**: 사용자가 원하는 수정 사항이 무엇인지 확인합니다.
4. **CrossRamp 배포 (필수 — 절대 생략 금지)**:
   - `read_gameserver_sdk_v2` 호출 → server SDK 문서 확인
   - `read_gameserver_sdk_crossramp` 호출 → CrossRamp 배포, 루트에 `.crossramp` 파일 생성
   - `.crossramp`의 `asset_keys`가 `server.js`의 `$asset.mint()` 키(`'gold'`)와 일치하는지 확인

> ✅ CrossRamp 배포는 사용자가 별도 요청하지 않아도 첫 프롬프트에서 반드시 완료합니다.

---

## 섹션 0-3 — 현재 구현된 게임 요약

현재 이 프로젝트에는 다음이 완전히 구현되어 있습니다:
- 게임: "AETHER ALCHEMIST" (판타지 연금술사 테마)
- 플레이어: Alchemist (연금술사)
- 적: Abyssal Slime, Phantom Wisp, Stone Golem (3종)
- 능력: 8개 판타지 테마 스킬
- UI: 보라/퍼플 아케인 스타일, orbs 체력 표시
- CrossRamp: 미배포 상태 (첫 프롬프트에서 반드시 배포)

---

## 섹션 1 — 사용자 요청 시에만 변경 가능한 것

### 변경 가능한 것 (사용자 요청 시에만)

| 대상 | 파일 | 설명 |
|------|------|------|
| 게임 이름/부제 | `src/config/gameConfig.ts` | name, subtitle |
| 플레이어 스탯/스프라이트 | `src/config/gameConfig.ts` | player.* |
| UI 테마 (색상, 레이아웃 토큰) | `src/config/gameConfig.ts` | ui.* |
| 적 타입 (3종 이상) | `src/config/enemyTypes.ts` | ENEMY_TYPES |
| 레벨업 능력 (6개 이상) | `src/config/abilities.ts` | ABILITIES |
| 웨이브 진행 설계 | `src/config/waves.ts` | WAVES |
| 에셋 URL | `src/assets.json` | images, spritesheets |
| UI 레이아웃/스타일/위치 | `src/App.tsx` | 전체 UI 구조 |
| 아이콘 매핑 | `src/components/AbilityIcon.tsx` | 새 아이콘 추가 시 |

### 절대 변경 금지

- `src/game/Game.ts` 전체 (Phaser 엔진 오버라이드)
- `gameEvents` 이벤트 키 이름 (addGold, showTitle, gameStart, showGameOver, updateHealth, updateXp, showLevelUp, joystickMove, joystickStop, selectAbility, pauseGame, resumeGame, forceGameOver, startGameFromUI, restartGameFromUI, gameOver)
- 씬 키: `TitleScene`, `MainScene`, `GameOverScene`
- Phaser 물리 엔진 설정 (gravity: 0 등)

---

## 섹션 2 — 변경 요청 시 절차 (사용자 요청 후에만 실행)

> ⚠️ 아래 항목들은 사용자가 명시적으로 요청한 경우에만 수행합니다. 자동으로 시작하지 마십시오.

### 에셋 교체 요청 시
1. NanoBanana Pro 사용, style/colors/details/background 필드 모두 포함
2. `src/assets.json` 업데이트 — 새 URL 반영
3. 에셋 교체 시 `src/App.tsx` UI도 함께 업데이트

### 컨셉 전면 교체 요청 시
1. 게임 이름 & 세계관 확정 — `GAME_CONFIG.name`, `subtitle` 결정
2. `src/config/enemyTypes.ts` — 새 적 설계
3. `src/config/abilities.ts` — 새 스킬 설계
4. `src/config/waves.ts` — 웨이브 설계
5. `src/config/gameConfig.ts` — 게임 이름, 플레이어 스탯, UI 테마 업데이트
6. `src/App.tsx` — UI 재설계

### CROSS 토큰 관련 변경 시
- **CrossRamp 재배포**: `read_gameserver_sdk_v2` → `read_gameserver_sdk_crossramp`
- **통화명 변경 시 3-way 동기화**:
  - A. `server.js` — `$asset.mint('새키', amount)` / `$asset.get('새키')`
  - B. `src/App.tsx` — `assets?.['새키'] || 0`
  - C. `.crossramp` — `asset_keys: ["새키"]`
  - **절대 변경 금지**: `server.js` 함수명 `addGold`

---

## 섹션 2-1 — 스킬 설계: 신규 effect 타입 창작 (요청 시에만)

### 신규 effect 타입 추가 완전 체크리스트 (4단계)

```
Step 1. abilities.ts — AbilityEffect 유니온에 새 타입 추가
  예) | { type: 'orbit'; count: number; damage: number }

Step 2. abilities.ts — ABILITIES 배열에 해당 스킬 데이터 추가

Step 3. MainScene.ts — 상태 필드 추가
  예) private orbitCount = 0;

Step 4. MainScene.ts — handleSelectAbility에 분기 추가 + 실제 게임 로직 구현
```

### 기존 타입 (참고 / 변형 가능)

- `stat` — 단순 수치 조정 (speed, fireRate, maxHealth, projectileDamage, projectileSpeed)
- `multishot` — 동시 발사 수
- `pierce` — 관통
- `aoe` — 적 사망 시 범위 폭발
- `orbit` — 플레이어 주위 회전 투사체

---

## 섹션 3 — UI 재설계 가이드 (사용자 요청 시에만)

> 🚫 사용자가 명시적으로 UI 변경을 요청한 경우에만 실행하십시오.

- 타이틀: 배경 연출, 제목 폰트, 버튼 스타일
- HUD: 체력(`healthStyle`: hearts/bar/orbs/shields), XP 바, 통화 표시 위치
- 레벨업 모달: 카드 레이아웃, 색상 분위기
- 게임오버: 배경 색상, 재시도 버튼

---

## 섹션 4 — 기술 규칙

1. **이미지 생성**: NanoBanana Pro 사용, style/colors/details/background 필드 필수
   - Pixel Art: `style`에 `high-quality`, `HD` 등 품질 수식어 필수. `"pixel art"` 단독 사용 금지
2. **displayWidth/displayHeight만 사용**: Tween에서 `scaleX`/`scaleY` 금지
3. **setDisplaySize() 필수**: 이미지/스프라이트 추가 시 즉시 크기 지정
4. **멀티라인 문자열**: 백틱(`) 사용
</userRequest>
