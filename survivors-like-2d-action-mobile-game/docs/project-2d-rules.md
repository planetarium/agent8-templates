# 뱀파이어 서바이버류 보일러플레이트 템플릿 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **뱀파이어 서바이버류 2D 모바일 게임**의 보일러플레이트입니다. 같은 템플릿에서 시작해도 **다양한 형태의 게임**이 만들어질 수 있어야 합니다.

### 변경 가능한 것 (반드시 새 컨셉에 맞게 수정)

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

## 섹션 1 — 컨셉 수령 절차

### 1-A. 사용자가 주요 컨셉을 제공한 경우

1. **세계관 추출**: 판타지/SF/해양/스팀펑크/동양신화 등 배경
2. **주인공 추출**: 직업, 이동 방식, 공격 스타일
3. **적군 추출**: 테마에 맞는 3~4종 (일반/빠름/탱커/원거리)
4. **배색/분위기 추출**: 컬러팔레트, UI 무드
5. 위 항목을 바탕으로 config 4파일 + assets.json + App.tsx 전면 수정

### 1-B. 사용자가 컨셉을 제공하지 않은 경우

아래 조합 테이블에서 **새롭게 조합**하여 선택. 매번 다르고 새로운 게임이 나오도록 예시를 다양하게 조합.

| 축 | 예시 (조합 가능) |
|----|------------------|
| **세계관** | 판타지, SF, 포스트아포칼립스, 해양 탐험, 스팀펑크, 동양신화, 현대 도시, 고대 이집트, 빙하 시대, 사이버펑크 |
| **주인공** | 기사, 마법사, 해커 드론, 다이버, 우주비행사, 발명가, 샤먼, 요정, 닌자, 로봇 |
| **적 (3~4종)** | 슬라임/늑대/오크, 바이러스 봇/해킹 드론, 심해 생물/해파리, 기계 벌레/스팀 골렘, 요괴/귀신, 좀비/변종, 외계인/침략자 |
| **배색** | 네온 퍼플, 청록/해양, 연두/마법 숲, 코발트블루/우주, 구리/스팀펑크, 아이스블루/빙하, 크림슨/다크 판타지 |

**조합 예시 (참고용)**  
- 사이버펑크 × 해커 드론 × 바이러스 봇 × 네온 퍼플  
- 해양 탐험 × 다이버 × 심해 생물 × 청록  
- 마법 숲 × 요정 × 버섯 몬스터 × 연두  
- 우주 방어 × 우주비행사 × 외계인 × 코발트블루  
- 스팀펑크 × 발명가 × 기계 벌레 × 구리색  

---

## 섹션 2 — 전면 재창조 체크리스트 (순서대로 실행)

1. **게임 이름 & 세계관 확정** — `GAME_CONFIG.name`, `subtitle` 결정
2. **에셋 생성** (이미지 생성 도구 사용): 플레이어, 적 타입별, 배경, XP 젬, 통화 아이콘
3. **`src/assets.json` 업데이트** — 새 URL 반영
4. **`src/config/enemyTypes.ts`** — 최소 3종 적 설계, 각각 다른 `behavior` 지정
5. **`src/config/abilities.ts`** — 최소 6개 스킬 설계, 컨셉에 맞는 이름/효과 (기존 예시는 참고만, 직접 새로 작성)
6. **`src/config/waves.ts`** — 10웨이브 진행 설계 (적 조합 변화, 난이도 곡선)
7. **`src/config/gameConfig.ts`** — 게임 이름, 플레이어 스탯, UI 테마 토큰 업데이트
8. **`src/App.tsx`** — UI 전면 재설계 (레이아웃, 색상, CSS, 아이콘, 폰트, 배경 효과)
9. **`src/components/AbilityIcon.tsx`** — 새 능력 아이콘 추가 시 `ICON_MAP`에 등록
10. **`MainScene`** — 새 ability effect 타입 추가 시 `handleSelectAbility`에 처리 로직 추가

---

## 섹션 2-1 — 스킬 설계: 신규 effect 타입 창작 (필수)

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

### 컨셉별 독창적 신규 effect 타입 예시

| 컨셉 | 신규 타입 이름 | 게임 로직 아이디어 |
|------|--------------|------------------|
| 사이버펑크 해커 | `hack` | 적을 일시적으로 아군으로 전환 (tint 변경 + 다른 적 공격) |
| 사이버펑크 해커 | `emp` | 화면 내 적 전체 일시 정지 (velocity 0, 2초 후 재개) |
| 해양 탐험 | `whirlpool` | 플레이어 중심으로 주변 적을 끌어당기는 인력 필드 |
| 해양 탐험 | `ink` | 발사체 명중 시 적 이동속도 감소 (setData로 slow 상태) |
| 스팀펑크 | `orbit` | 플레이어 주위를 회전하는 투사체 n개 (Tween 원형 궤도) |
| 스팀펑크 | `mine` | 플레이어 이동 경로에 지뢰 설치 (정지 투사체, 접근 시 폭발) |
| 동양신화 | `summon` | 분신 소환 (플레이어 복사본이 자동 사격) |
| 동양신화 | `barrier` | 일정 시간 피격 무효 (invulnerability 시간 연장) |
| 우주 방어 | `gravity_well` | 특정 지점에 중력장 생성 (주변 적 지속 끌어당김) |
| 우주 방어 | `wormhole` | 투사체가 화면 끝에서 반대편으로 재등장 |

### 기존 타입 (참고 / 변형 가능)

- `stat` — 단순 수치 조정 (speed, fireRate, maxHealth, projectileDamage, projectileSpeed)
- `multishot` — 동시 발사 수
- `pierce` — 관통 (hitEnemy에서 projectile.destroy() 조건부 처리)
- `aoe` — 적 사망 시 범위 폭발 (hitEnemy에서 aoeRadius 내 적에게 aoeDamage 적용)

---

## 섹션 3 — UI 재설계 상세 가이드

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
