# 뱀파이어 서바이버류 2D 게임 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **뱀파이어 서바이버류 2D 모바일 게임이 이미 완전히 구현된 상태**입니다 ("Neon Strikers" — 사이버펑크 테마).

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
- 게임: "Neon Strikers" (사이버펑크 테마)
- 플레이어: 사이버 우주 해병
- 적: Alien Bug, Cyber Drone, Mech Brute (3종)
- 능력: 8개 SF 테마 스킬
- UI: 청록/보라 사이버펑크 글로우 스타일
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

**원칙: 기존 타입을 섞는 것이 아니라 새 타입을 직접 발명할 것**

스킬은 컨셉에서 역으로 설계:
1. 세계관에서 "이런 게 있으면 재밌겠다"는 행동을 먼저 상상
2. 그 행동을 effect 타입 이름으로 정의
3. MainScene에 해당 로직을 직접 구현

### 신규 effect 타입 추가 완전 체크리스트 (4단계)

```
Step 1. abilities.ts — AbilityEffect 유니온에 새 타입 추가
  예) | { type: 'orbit'; count: number; damage: number }

Step 2. abilities.ts — ABILITIES 배열에 해당 스킬 데이터 추가

Step 3. MainScene.ts — 상태 필드 추가
  예) private orbitCount = 0;

Step 4. MainScene.ts — handleSelectAbility에 분기 추가 + 실제 게임 로직 구현
  예) 플레이어 주위를 회전하는 투사체 생성 (update에서 Tween 또는 velocity 조정)
```

### 컨셉별 독창적 신규 effect 타입 예시 (영감 소스 — 다양한 세계관 골고루 참고)

| 컨셉 | 신규 타입 이름 | 게임 로직 아이디어 |
|------|--------------|------------------|
| 정글 원시림 | `vine` | 적을 묶어 이동 불가 (setData로 root 상태) |
| 화산 지대 | `lava_trail` | 플레이어 이동 경로에 지속 데미지 존 생성 |
| 사막 유목 | `sandstorm` | 주변 적 시야/이동 방해 (랜덤 방향으로 밀어냄) |
| 공중 왕국 | `wind_gust` | 특정 방향으로 적 밀어내기 (velocity 일시 적용) |
| 곤충 세계 | `web` | 투사체 명중 시 적 이동속도 감소 (setData로 slow) |
| 음식 세계 | `spice` | 적 사망 시 주변 적에게 연쇄 독 데미지 |
| 장난감 세계 | `spring` | 피격 시 적을 반대 방향으로 튕겨냄 |
| 악몽 세계 | `nightmare` | 적을 일시적으로 아군으로 전환 (tint 변경) |
| 던전 | `orbit` | 플레이어 주위를 회전하는 투사체 n개 (Tween 원형 궤도) |
| 동양신화 | `summon` | 분신 소환 (플레이어 복사본이 자동 사격) |
| 북유럽 신화 | `barrier` | 일정 시간 피격 무효 (invulnerability 시간 연장) |
| 우주 방어 | `gravity_well` | 특정 지점에 중력장 생성 (주변 적 지속 끌어당김) |

### 기존 타입 (참고 / 변형 가능)

- `stat` — 단순 수치 조정 (speed, fireRate, maxHealth, projectileDamage, projectileSpeed)
- `multishot` — 동시 발사 수
- `pierce` — 관통 (hitEnemy에서 projectile.destroy() 조건부 처리)
- `aoe` — 적 사망 시 범위 폭발 (hitEnemy에서 aoeRadius 내 적에게 aoeDamage 적용)

---

## 섹션 3 — UI 재설계 가이드 (사용자 요청 시에만)

> 🚫 사용자가 명시적으로 UI 변경을 요청한 경우에만 실행하십시오.

UI는 **이름/색상만 바꾸는 것이 아님**. 컨셉에 맞게 **위치, CSS, 스타일**을 전면 재설계.

### 타이틀 화면
- 배경 연출 (그라데이션, 오버레이)
- 제목 폰트 스타일 (italic, tracking, stroke)
- 버튼 스타일 (모서리, 그림자, 호버 효과)
- 통화/골드 표시 위치

### HUD (플레이 중)
- 체력 표시: `healthStyle`에 따라 `hearts` | `bar` | `orbs` | `shields` 중 선택
- 통화 표시 위치 (상단 중앙 / 좌하단 등)
- XP 바 스타일 (그라데이션, 테두리)
- 퇴장 버튼 위치/스타일

### 레벨업 모달
- 카드 레이아웃 (가로/세로, 그리드)
- 색상 분위기 (`COLOR_CLASSES`에 새 색상 추가 가능)
- 희귀도 시각화 (common/rare/epic)

### 게임오버 화면
- 배경 색상 (`gameOverBgClass`)
- 메시지 텍스트 (`gameOverTitle`)
- 통계 표시 (Session Gold 등)
- 재시도 버튼 스타일

---

## 섹션 4 — 적 행동 패턴 구현 가이드

`enemyTypes.ts`의 `behavior` 값에 따른 구현 방향:

| behavior | 설명 | 구현 방향 |
|----------|------|-----------|
| `chase` | 플레이어를 계속 추적 | `physics.moveToObject` 기본 사용 |
| `swarm` | 빠르게 몰려듦 | chase와 동일, speed 높게 |
| `tank` | 느리지만 체력 높음 | chase와 동일, speed 낮게, hp 높게 |
| `charge` | 일정 거리에서 돌진 | 거리 감지 후 일시적 가속 |
| `ranged` | 원거리 공격 | 플레이어 근처에서 멈추고 투사체 발사 |

현재 `Enemy.ts`의 `updateEnemyBehavior`는 chase/swarm/tank를 동일하게 처리. charge/ranged는 MainScene 또는 Enemy 모듈 확장 필요.

---

## 섹션 5 — 절대 변경 금지 (재강조)

- **`src/game/Game.ts`** — Phaser setDisplaySize/setScale/Tween 오버라이드 포함, 수정 시 게임 전체 깨짐
- **`gameEvents` 이벤트 키** — React ↔ Phaser 통신에 사용, 변경 시 연동 오류
- **씬 키** — `'TitleScene'`, `'MainScene'`, `'GameOverScene'`
- **물리 엔진** — `gravity: { x: 0, y: 0 }`

---

## 섹션 6 — 기술 규칙 (기존 유지)

1. **이미지 생성 도구 사용**: 에셋 생성 시 나노바나나프로(NanoBanana Pro) 사용, 상세 프롬프트에 style, colors, details, background 반드시 포함
   - **Pixel Art 스타일 품질 주의**: "pixel art"를 선택하면 도구가 저해상도·저품질 이미지를 생성하는 경우가 많음. 품질 유지를 위해:
     - `style` 필드에 **반드시** `high-quality`, `high-resolution`, `detailed`, `HD` 중 하나 이상 포함
     - `details` 필드에 `clean edges`, `vibrant colors`, `professional sprite quality` 등 품질 관련 묘사 추가
     - **금지**: `style: "pixel art"` 단독 사용, `low-res`, `retro low quality`, `simple`, `minimal` 등 품질 저하 키워드
     - **권장 예시**: `style: "high-quality pixel art, clean edges, vibrant palette, professional game sprite, HD rendering"`
2. **displayWidth/displayHeight만 사용**: Tween에서 `scaleX`/`scaleY` 금지
3. **setDisplaySize() 필수**: 이미지/스프라이트 추가 시 즉시 크기 지정
4. **Tween 애니메이션**: 부드러운 애니메이션, 페이드, 바운스 적용
5. **멀티라인 문자열**: 백틱(`) 사용
6. **프로덕션 품질**: 모든 기능을 완성도 있게 구

### Tween 규칙 예시

```
❌ scaleX, scaleY 사용 금지
✅ displayWidth, displayHeight 사용
```

### setDisplaySize 규칙 예시

```
❌ sprite = this.add.image(x, y, 'tex');  // 크기 미지정
✅ sprite = this.add.image(x, y, 'tex');
   sprite.setDisplaySize(200, 150);
</userRequest>
