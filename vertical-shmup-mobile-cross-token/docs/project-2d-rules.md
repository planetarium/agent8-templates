# 아케이드 버티컬 슈팅 게임 보일러플레이트 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **아케이드 스타일 버티컬 슈팅(슈팅 게임, shmup) 2D 모바일 게임**의 보일러플레이트입니다. 레이든(Raiden), 1943, 도돈파치 같은 클래식 아케이드 슈팅 장르를 모바일 터치 인터페이스에 최적화한 형태입니다. 같은 템플릿에서 시작해도 **다양한 세계관과 컨셉의 슈팅 게임**이 만들어질 수 있어야 합니다.

### 변경 가능한 것 (반드시 새 컨셉에 맞게 구현/수정)

| 대상 | 파일 | 설명 |
|------|------|------|
| 게임 이름/부제 | `src/config/gameConfig.ts` | name, subtitle |
| 플레이어 스탯/스프라이트 | `src/config/gameConfig.ts` | player.* |
| 스크롤 속도 설정 | `src/config/gameConfig.ts` | scroll.* |
| 폭탄 설정 | `src/config/gameConfig.ts` | bomb.* |
| UI 테마 (색상, 레이아웃 토큰) | `src/config/gameConfig.ts` | ui.* |
| 적 타입 (3종 이상) | `src/config/enemyTypes.ts` | 행동 패턴, 발사 패턴, 스탯 포함 |
| 적 탄막 패턴 | `src/config/bulletPatterns.ts` | aimed/spread/circle/spiral/curtain 등 |
| 파워업 타입 (4종 이상) | `src/config/powerUpTypes.ts` | effect 타입 포함 |
| 스테이지 구성 (3스테이지 이상) | `src/config/stageConfig.ts` | 웨이브, 보스, 스크롤 속도 |
| 에셋 URL | `src/assets.json` | images, spritesheets |
| UI 레이아웃/스타일 | `src/App.tsx` | 전체 UI 구조 (터치 레이어 포함) |
| 파워업 아이콘 | `src/components/PowerUpIndicator.tsx` | 새 파워업 등록 시 |

### 절대 변경 금지 (초기 중력 수정 이후)

- `src/game/Game.ts` 전체 (중력을 `{ x: 0, y: 0 }`으로 수정한 뒤 동결)
- `gameEvents` 이벤트 키 이름 (addCoin, updateScore, updateLives, updateBossHealth, showBossWarning, hideBossHealth, showPowerUpPickup, stageComplete, showTitle, gameStart, showGameOver, gameOver, startGameFromUI, restartGameFromUI, nextStageFromUI, touchMove, touchEnd, useBomb, pauseGame, resumeGame)
- 씬 키: `TitleScene`, `MainScene`, `GameOverScene`
- 물리 엔진 설정 (중력: 0으로 설정 후 변경 금지)

---

## 섹션 1 — 컨셉 수령 절차

### 1-A. 사용자가 주요 컨셉을 제공한 경우

**블록체인 키워드 ≠ 게임 컨셉**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` 등은 **블록체인 기술 스펙**이며 게임 세계관 결정에 사용하지 않는다. 유저 프롬프트에 이 키워드만 있고 세계관이 명시되지 않았다면 → **사이버펑크/SF를 선택하는 것을 금지**하며 **1-B로 이동**.

슈팅 게임 컨셉 추출 항목:
1. **세계관/배경 추출**: 하늘/우주/바다/정글/사막/초자연 등 — 플레이어가 날아다니는 공간
2. **비행체 추출**: 전투기/드래곤/마법 빗자루/거대 새/잠수함/곤충/꽃잎 등 — 플레이어 기체 컨셉
3. **적군 추출**: 동일 세계관의 적 비행체 3~4종 (잡몹/돌격형/탱커/원거리)
4. **보스 추출**: 거대 적 보스 — 같은 세계관의 강력한 존재, 다상(페이즈) 공격 패턴
5. **배색/분위기 추출**: 컬러팔레트, UI 무드

### 1-B. 사용자가 컨셉을 제공하지 않은 경우

**자동 선택 금지**: 사이버펑크, SF — 사용자가 명시적으로 요청한 경우에만 사용 가능.

아래 조합 테이블은 **영감 소스**일 뿐이다. **반드시 자기만의 새로운 조합**을 만들 것. 목록에 없는 조합을 창작하는 것을 적극 권장.

| 축 | 예시 (영감 소스 — 목록 외 창작 권장) |
|----|-------------------------------------|
| **비행 공간** | 구름 위 하늘, 심해, 정글 상공, 화산 화구 위, 사막 폭풍 속, 빙하 설원 위, 고대 신전 내부, 마법 차원, 꿈속 하늘, 우주 (SF 명시 시만), 북유럽 신화 세계, 동양 산수화 하늘, 지하 동굴 공중, 마법 서커스 무대, 거인 몸속, 꽃과 나비 정원 상공, 요리 세계 |
| **플레이어 비행체** | 복엽기, 드래곤, 불사조, 마법 빗자루 위 마녀, 하늘 고래, 무장 독수리, 불꽃 나비, 종이 학, 거대 딱정벌레, 공중 갈레온 선박, 날개 달린 기사, 회오리 정령, 날치, 무장 연, 빛의 천사 |
| **잡 적 (3~4종)** | 하늘 해파리/박쥐 군단, 석상 가고일/타락 천사, 화염 새/바람 원소, 독 모기/거미 비행체, 심해어/빛나는 아귀, 화산 새/마그마 괴물, 얼음 조각/눈 정령, 모래 메뚜기/사막 새, 꽃잎 탄환/덩굴 정령, 요리 괴물/뒤집어진 냄비, 북유럽 까마귀/서리 용, 동양 도깨비/귀신 연 |
| **보스** | 거대 폭풍 신, 해왕, 화산의 신룡, 얼음 여왕, 사막의 왕 스콜피온, 하늘 요새, 거대 어머니 나무, 악몽의 군주, 요리 거인, 천지를 가르는 검 |
| **배색** | 노랑-파랑/하늘, 파랑-녹색/심해, 오렌지-빨강/화산, 청백/빙하, 황금-모래/사막, 보라-분홍/마법, 연두-연분홍/정원, 수묵화 흑백, 빨강-금/동양, 파스텔/꿈, 테라코타/신화, 네이비-파랑/해적 |

**슈팅 게임 조합 예시 (참고용 — 절대 그대로 복사 금지)**
- 구름 위 하늘 × 마법 빗자루 마녀 × 가고일/타락 천사 × 보라
- 심해 × 날치 잠수정 × 발광 심해어/해파리 × 파랑-녹색
- 화산 화구 × 불사조 × 마그마 새/용암 정령 × 오렌지-빨강
- 정원 상공 × 불꽃 나비 × 독 모기/꽃잎 탄환 × 연두-분홍
- 동양 산수화 하늘 × 종이 학 × 도깨비/귀신 연 × 수묵화 흑백
- 요리 세계 × 무장 냄비 뚜껑 비행 × 요리 괴물/뒤집어진 냄비 × 파스텔
- 북유럽 신화 × 서리 드래곤 라이더 × 까마귀/서리 트롤 × 청백
- 고대 신전 내부 × 날개 달린 기사 × 석상 가고일/함정 화살 × 황금-돌색

---

## 섹션 2 — 전체 구현 체크리스트 (순서대로 실행)

1. **중력 수정** — `src/game/Game.ts`에서 `gravity: { x: 0, y: 2000 }` → `{ x: 0, y: 0 }`
2. **게임 이름 & 세계관 확정** — `GAME_CONFIG.name`, `subtitle`, `currency.displayName` 결정
3. **에셋 생성** (NanoBanana Pro): 플레이어 기체, 보스, 적 타입별(3+), 탄환(플레이어/적), 모든 파워업 아이콘, 배경 레이어(2+), 폭발 스프라이트시트(8+프레임), 코인 아이콘, 방어막 이펙트
   → **에셋 생성 직후 Step 9 App.tsx UI 재설계를 반드시 이어서 실행 (세트 작업). 첫 프롬프트에서 완료 — UI를 나중 프롬프트로 미루지 말 것.**
4. **`src/assets.json` 업데이트** — 새 URL 반영, 모든 스프라이트 키가 gameConfig 참조와 일치하는지 확인
5. **`src/config/enemyTypes.ts`** — 최소 3종 적 설계, 각각 behavior/bulletPattern/dropProbability 지정
6. **`src/config/bulletPatterns.ts`** — aimed, spread_3/5, circle_8, spiral 등 최소 4가지 패턴 정의
7. **`src/config/powerUpTypes.ts`** — 최소 4종 파워업 설계 (weapon_upgrade, shield, bomb_add, score_multiplier 기본 포함)
8. **`src/config/stageConfig.ts`** — 3스테이지 이상 설계, 각 스테이지에 웨이브 시퀀스 + 보스 설정 포함
9. **`src/App.tsx`** — UI 전면 재설계 (HUD: 점수/라이브/폭탄/스테이지 표시, 터치 오버레이, 보스 체력바, 파워업 알림, 타이틀/스테이지클리어/게임오버 모달) — **첫 프롬프트에서 Step 3와 함께 완료.**
10. **엔티티 구현**: PlayerShip, EnemyShip, Bullet(풀링), PowerUp
11. **시스템 구현**: ScrollSystem, StageSystem, BossSystem
12. **`src/game/scenes/MainScene.ts`** — 모든 시스템/엔티티 연결, 충돌 처리, gameEvents 디스패치
13. **`src/components/PowerUpIndicator.tsx`** — 모든 파워업 아이콘/레이블 등록

---

## 섹션 2-1 — 파워업 effect 타입 창작 (필수)

**원칙**: 기본 4종(weapon_upgrade, shield, bomb_add, score_multiplier) 외에 세계관에 맞는 독창적 파워업을 최소 1개 이상 추가할 것.

세계관에서 역으로 파워업 설계:
1. "이 세계관에서 플레이어가 갖고 싶은 특별한 능력"을 먼저 상상
2. 그 능력을 `effect.type` 이름으로 정의
3. `powerUpTypes.ts`에 추가 + `MainScene.ts`에 `handlePowerUpPickup()` 분기 구현

### 세계관별 독창적 파워업 예시 (영감 소스)

| 세계관 | 파워업 타입 | 효과 |
|--------|------------|------|
| 마법 하늘 | `mirror_shot` | 플레이어 탄환이 화면 끝에서 반사 |
| 심해 | `ink_cloud` | 일정 시간 적 탄환 무효화 (잉크 구름 소환) |
| 화산 | `magma_trail` | 비행 경로에 지속 데미지 존 생성 |
| 동양 신화 | `dragon_call` | 미니 드래곤 호위 (좌우에서 자동 사격) |
| 정원 | `petal_storm` | 화면 전체에 꽃잎 소용돌이 → 적 탄환 흡수 |
| 요리 세계 | `spice_burst` | 적 처치 시 주변 적에 연쇄 도트 데미지 |
| 빙하 | `ice_nova` | 주기적으로 주변 적 이동속도 감소 |
| 서커스 | `decoy` | 적 탄환을 끌어당기는 가짜 기체 생성 |

### 신규 파워업 타입 추가 체크리스트 (3단계)

```
Step 1. powerUpTypes.ts — PowerUpEffect 유니온에 새 타입 추가
  예) | { type: 'mirror_shot'; duration: number }

Step 2. powerUpTypes.ts — POWER_UPS 배열에 해당 파워업 데이터 추가
  (icon, label, color, probability, effect)

Step 3. MainScene.ts — handlePowerUpPickup()에 분기 추가
  case 'mirror_shot': 상태 필드 설정 + update()에 반사 로직 구현
```

---

## 섹션 3 — 보스 설계 가이드

버티컬 슈팅의 보스는 게임의 하이라이트. 각 스테이지 보스는 **2~3 페이즈** 이상 가져야 함.

### 페이즈 전환 구조

```typescript
// HP 임계값에서 페이즈 전환
// Phase 1: 100% → 60% HP — 기본 공격 패턴
// Phase 2: 60% → 30% HP — 강화 패턴 + 이동 추가
// Phase 3 (광란): 30% → 0% HP — 모든 패턴 동시 + 속도 증가

private checkBossPhase() {
  const hpRatio = this.bossCurrentHP / this.bossMaxHP;
  if (hpRatio < 0.3 && this.bossPhase < 3) {
    this.bossPhase = 3;
    this.switchBossAttackPattern('enrage');
    this.cameras.main.shake(500, 0.02);
  } else if (hpRatio < 0.6 && this.bossPhase < 2) {
    this.bossPhase = 2;
    this.switchBossAttackPattern('phase2');
  }
}
```

### 보스 공격 패턴 설계 원칙

- **Phase 1**: 단순하고 예측 가능 — 플레이어가 패턴 학습 가능
- **Phase 2**: 복잡도 증가 — 동시 패턴 2개 or 이동 추가
- **Phase 3 (광란)**: 전 패턴 가속 — 긴장감 극대화

---

## 섹션 4 — UI 재설계 상세 가이드

**첫 프롬프트에서 에셋과 함께 UI 재설계를 반드시 완료.** 나중으로 미루지 말 것.

### 터치 컨트롤 레이어 (핵심)

React의 터치 오버레이는 **전체 화면을 커버**해야 함. Phaser 캔버스 위에 올라가되, Phaser 캔버스는 `pointer-events: none`, React 오버레이는 `pointer-events: auto`.

```tsx
// App.tsx에서 터치 이벤트 → Phaser 전달
const handleTouchMove = (e: React.TouchEvent) => {
  const touch = e.touches[0];
  gameEvents.dispatchEvent(new CustomEvent('touchMove', {
    detail: { x: touch.clientX, y: touch.clientY }
  }));
};

// 전체 화면 투명 터치 레이어
<div
  className="absolute inset-0 z-10"
  style={{ touchAction: 'none' }}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
/>
```

### HUD 레이아웃

- **점수**: 상단 중앙 (큰 폰트, 컨셉 색상)
- **배율(multiplier)**: 점수 옆 소형 표시 (×2, ×4 등)
- **라이브(목숨)**: 상단 좌측 (기체 아이콘 × 개수 — `livesStyle: 'ships'`)
- **폭탄**: 상단 우측 (폭탄 아이콘 × 개수)
- **스테이지**: 상단 우측 상단 소형
- **보스 HP 바**: 화면 하단 (전투 중에만 노출, `showBossWarning` 이벤트에 반응)
- **파워업 알림**: 화면 중앙 상단 아래 (pickup 시 2초 애니메이션 후 사라짐)
- **폭탄 버튼**: 우측 하단 고정 (엄지 접근 영역)

### 타이틀 화면

- 배경 연출 (그라데이션, 파티클, 오버레이)
- 제목 폰트 스타일 (italic, tracking, neon glow 또는 컨셉 맞춤)
- 시작 버튼 스타일

### 스테이지 클리어 화면

- 스테이지 번호 + 클리어 메시지
- 획득 코인 수 표시
- "NEXT STAGE" 버튼

### 게임 오버 화면

- 배경 색상 (`gameOverBgClass`)
- 최종 점수, 도달 스테이지, 획득 코인 표시
- 재도전 버튼

---

## 섹션 5 — 적 행동 패턴 구현 가이드

| behavior | 설명 | 구현 방향 |
|----------|------|-----------|
| `formation` | 편대 비행 — 화면 위에서 아래로 통과 | 생성 시 속도 y 양수 고정 (y: 150~250px/s) |
| `dive` | 플레이어 쪽으로 급강하 후 복귀 | 플레이어 x 방향으로 가속 후 일정 시간 뒤 화면 밖으로 이탈 |
| `stationary` | 화면 특정 위치에 고정 후 사격 | 타깃 위치까지 이동 후 정지, fireRate마다 bulletPattern 발사 |
| `zigzag` | 좌우로 지그재그 내려옴 | sinusoidal x velocity (Math.sin(time) × amplitude) |
| `boss` | 보스 전용 복잡 AI | BossSystem 참조, 페이즈별 이동 + 공격 패턴 전환 |

---

## 섹션 6 — 절대 변경 금지 (재강조)

- **`src/game/Game.ts`** — 중력 수정 후 완전 동결. Phaser setDisplaySize/setScale/Tween 오버라이드 포함
- **`gameEvents` 이벤트 키** — React ↔ Phaser 통신에 사용, 변경 시 연동 오류
- **씬 키** — `'TitleScene'`, `'MainScene'`, `'GameOverScene'`
- **물리 엔진** — `gravity: { x: 0, y: 0 }` (수정 완료 후 변경 금지)
- **서버** — `server.js`의 `addCoin` 함수 (Agent8 블록체인 연동)

---

## 섹션 7 — 기술 규칙

1. **중력**: 반드시 `{ x: 0, y: 0 }` — 모든 이동은 `setVelocity()` 사용
2. **탄환 풀링 필수**: `Physics.Arcade.Group`으로 오브젝트 풀 운영. `maxSize` 설정. `sprite.destroy()` 직접 호출 금지 — 반드시 `setActive(false).setVisible(false)` 처리
3. **`setDisplaySize()` 필수**: 이미지/스프라이트 추가 시 즉시 크기 지정
4. **Tween에서 scaleX/scaleY 금지**: `displayWidth` / `displayHeight` 사용
5. **NanoBanana Pro 에셋 품질 규칙**:
   - `style` 필드에 `high-quality`, `high-resolution`, `detailed`, `HD` 중 하나 이상 포함
   - `details` 필드에 `clean edges`, `vibrant colors`, `professional sprite quality` 등 품질 묘사 추가
   - 금지: `"pixel art"` 단독, `low-res`, `retro low quality`, `simple`, `minimal`
6. **터치 좌표 변환**: React touch 이벤트의 `clientX/clientY`는 CSS 픽셀 — Phaser 월드 좌표로 변환 필요 (`clientX / window.innerWidth * gameWidth`)
7. **멀티라인 문자열**: 백틱(`) 사용
8. **config 분리**: 수치 데이터(속도, HP, 데미지, 타이밍)는 모두 `src/config/`에 위치, 씬 파일은 import만

### Tween 규칙

```
❌ scaleX, scaleY 사용 금지
✅ displayWidth, displayHeight 사용

❌ sprite.destroy() on pooled bullet
✅ bullet.setActive(false).setVisible(false)
```

### setDisplaySize 규칙

```
❌ const ship = this.add.image(x, y, 'player');    // 크기 미지정
✅ const ship = this.add.image(x, y, 'player');
   ship.setDisplaySize(60, 80);                     // 즉시 크기 지정
```
</userRequest>
