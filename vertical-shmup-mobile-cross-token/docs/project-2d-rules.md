# 아케이드 버티컬 슈팅 게임 보일러플레이트 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 실제 상태

이 프로젝트는 **2d-phaser-basic 템플릿을 복사한 것**으로, 게임 로직이 전혀 없는 최소 스캐폴드입니다.

### 실제로 존재하는 파일 (수정 전 확인)

| 파일 | 상태 | 처리 |
|------|------|------|
| `src/game/Game.ts` | 엔진 오버라이드 ✓ / 중력 `y:2000` ✗ / `scene:[MainScene]` only ✗ | 중력 수정 + 씬 목록 추가 후 동결 |
| `src/game/scenes/MainScene.ts` | 하늘 배경 + 초록 사각형 | 완전 대체 |
| `src/App.tsx` | `<div><GameComponent /></div>` | 전면 재설계 |
| `src/assets.json` | `{ "sprites": {} }` | 전부 교체 |
| `src/components/GameComponent.tsx` | Phaser 캔버스 마운트 ✓ | 수정 금지 |
| `src/main.tsx` | React 18 엔트리 ✓ | 수정 금지 |

### 반드시 새로 생성할 파일 (존재하지 않음)

`src/game/events.ts` / `src/game/scenes/TitleScene.ts` / `src/game/scenes/GameOverScene.ts` / `src/game/entities/` (4개) / `src/game/systems/` (3개) / `src/config/` (5개) / `src/components/PowerUpIndicator.tsx` / `server.js`

### 이 템플릿의 목적

아케이드 스타일 버티컬 슈팅(shmup) 2D 모바일 게임. 레이든(Raiden), 1943, 도돈파치 장르를 모바일 터치스크린에 최적화. 같은 템플릿에서 시작해도 **다양한 세계관의 슈팅 게임**이 만들어질 수 있어야 합니다.

---

## 섹션 1 — 컨셉 수령 절차

### 1-A. 블록체인 키워드 처리 (최우선 규칙)

**`CROSS`, `chain`, `token`, `blockchain`, `wallet` = 블록체인 기술 스펙, 게임 세계관 아님.**

유저 프롬프트에 이 키워드만 있고 명시적 세계관이 없으면 → **사이버펑크/SF 선택 금지** → 1-B로 이동.

### 1-B. 컨셉이 제공되지 않은 경우 — 슈팅 게임용 세계관 창작

아래 조합 테이블은 **영감 소스**일 뿐. 목록 외 조합을 자유롭게 창작하는 것을 적극 권장. 예시를 그대로 복사하지 말 것.

**슈팅 게임 컨셉 = "무엇을 타고" + "어디를 날아" + "무엇과 싸우는가"**

| 축 | 예시 (영감 — 직접 창작 권장) |
|----|------------------------------|
| **비행 공간** | 구름 위 하늘, 심해, 화산 화구 위, 빙하 설원, 고대 신전 내부, 마법 차원, 꿈속 하늘, 정글 상공, 사막 폭풍 속, 동양 산수화 하늘, 거인의 몸속, 꽃 정원 위, 요리 세계, 북유럽 신화 허공, 서커스 무대 |
| **플레이어 비행체** | 복엽기, 불사조, 마법 빗자루 위 마녀, 하늘 고래, 무장 독수리, 불꽃 나비, 종이 학, 무장 딱정벌레, 공중 갈레온, 날개 달린 기사, 회오리 정령, 날치 잠수정 |
| **적 (3~4종)** | 하늘 해파리/박쥐 군단, 석상 가고일, 화염 새/바람 원소, 독 모기/꽃잎 탄환, 심해어/발광 아귀, 용암 새/마그마 정령, 얼음 조각/눈 정령, 모래 메뚜기/사막 새, 요리 괴물/뒤집어진 냄비, 북유럽 서리 까마귀, 동양 도깨비/귀신 연 |
| **보스** | 거대 폭풍 신, 해왕, 화산 신룡, 얼음 여왕, 왕 스콜피온, 하늘 요새, 거대 나무 정령, 악몽의 군주, 요리 거인, 서리 거용 |
| **배색** | 노랑-파랑/하늘, 파랑-녹색/심해, 오렌지-빨강/화산, 청백/빙하, 황금-모래/사막, 보라-분홍/마법, 연두-연분홍/정원, 수묵화 흑백, 빨강-금/동양, 파스텔/꿈 |

**슈팅 게임 조합 예시 (참고용 — 그대로 복사 금지, 반드시 새 조합 창작)**
- 구름 하늘 × 마법 빗자루 마녀 × 가고일/타락 천사 × 보라
- 심해 × 날치 잠수정 × 발광 심해어/해파리 × 파랑-녹색
- 화산 화구 × 불사조 × 마그마 새/용암 정령 × 오렌지
- 정원 상공 × 불꽃 나비 × 독 모기/꽃잎 탄환 × 연두-분홍
- 동양 산수화 × 종이 학 × 도깨비/귀신 연 × 수묵화 흑백

### 1-C. 컨셉 추출 항목 (사용자 컨셉 제공 시)

1. **비행 공간/배경**: 어디를 날아다니는가
2. **플레이어 기체**: 어떤 비행체, 어떤 공격 방식
3. **적 타입 3~4종**: 일반/돌격/탱커/원거리
4. **보스**: 세계관 최종 강적, 2~3 페이즈 공격 패턴
5. **배색/분위기**: 컬러팔레트, UI 무드

---

## 섹션 2 — 전체 구현 체크리스트 (순서대로 실행)

1. **`src/game/events.ts` 생성** — `export const gameEvents = new EventTarget();`
2. **`src/game/Game.ts` 수정** — `gravity: { x: 0, y: 0 }` 및 `scene: [TitleScene, MainScene, GameOverScene]` 로 변경, 씬 import 추가 → 이후 동결
3. **게임 이름 & 세계관 확정** — `GAME_CONFIG.name`, `subtitle`, `currency.displayName`
4. **에셋 생성** (NanoBanana Pro): 플레이어 기체, 보스, 적 타입 3종 이상, 플레이어 탄환, 적 탄환, 파워업 아이콘 4종 이상, 배경 레이어 2장(타일링 가능), 폭발 스프라이트시트(8+ 프레임), 코인 아이콘
   → **에셋 생성 직후 같은 프롬프트에서 Step 10 App.tsx 재설계를 반드시 완료. 미루지 말 것.**
5. **`src/assets.json` 업데이트** — 생성한 모든 에셋 URL로 교체
6. **`src/config/gameConfig.ts` 작성** — 게임 이름, 플레이어 스탯, 스크롤 속도, 폭탄 설정, 점수 배율 설정, UI 테마 토큰
7. **`src/config/enemyTypes.ts` 작성** — 최소 3종, 각각 behavior/bulletPattern/dropProbability 포함
8. **`src/config/bulletPatterns.ts` 작성** — aimed, spread_3, circle_8, spiral + 세계관 맞춤 1개 이상
9. **`src/config/powerUpTypes.ts` 작성** — weapon, shield, bomb, score_multiplier + 세계관 독창 1개 이상
10. **`src/App.tsx` 전면 재설계** — HUD(점수/배율/라이브/폭탄/스테이지), 보스 체력바, 전화면 터치 오버레이, 파워업 알림 배너, 폭탄 버튼, 타이틀/스테이지클리어/게임오버 화면 — **4번 에셋 생성과 같은 프롬프트에서 완료**
11. **`src/config/stageConfig.ts` 작성** — 3스테이지 이상, 각 스테이지에 웨이브 시퀀스 + 보스 설정 포함
12. **엔티티 구현**: `PlayerShip.ts`, `EnemyShip.ts`, `Bullet.ts`(풀링), `PowerUp.ts`
13. **시스템 구현**: `ScrollSystem.ts`, `StageSystem.ts`, `BossSystem.ts`
14. **씬 구현**: `TitleScene.ts`, `GameOverScene.ts`
15. **`MainScene.ts` 완전 구현** — 모든 시스템/엔티티 연결, 충돌 처리, gameEvents 송수신
16. **`PowerUpIndicator.tsx` 작성** — 모든 파워업 아이콘/레이블 등록
17. **`server.js` 작성** — Agent8 `addCoin` 블록체인 함수

---

## 섹션 2-1 — 파워업 effect 타입 창작 (필수)

기본 4종(weapon, shield, bomb_add, score_multiplier) 외에 **세계관에 맞는 독창 파워업 최소 1개** 추가.

세계관에서 역으로 설계:
1. "이 세계관의 플레이어가 갖고 싶은 특별 능력"을 상상
2. `effect.type` 이름으로 정의
3. `powerUpTypes.ts` 추가 + `MainScene.ts` `handlePowerUpPickup()` 분기 구현

**세계관별 독창 파워업 예시 (영감 소스)**

| 세계관 | 파워업 타입 | 효과 |
|--------|-----------|------|
| 마법 하늘 | `mirror_shot` | 탄환이 화면 끝에서 반사 |
| 심해 | `ink_cloud` | 일정 시간 적 탄환 차단 |
| 화산 | `magma_trail` | 비행 경로에 지속 데미지 존 |
| 동양 신화 | `dragon_call` | 미니 드래곤 호위 (좌우 자동 사격) |
| 정원 | `petal_storm` | 화면 전체 꽃잎 → 적 탄환 흡수 |
| 빙하 | `ice_nova` | 주기적 주변 적 이동속도 감소 |

---

## 섹션 3 — 보스 설계 가이드

각 스테이지 보스는 **2~3 페이즈** 이상. HP 임계값에서 패턴 전환.

```typescript
// 페이즈 전환 예시
// Phase 1: 100%~60% — 기본 패턴
// Phase 2:  60%~30% — 강화 패턴 + 이동 추가
// Phase 3:  30%~ 0% — 광란 (전 패턴 가속 + 이동 복잡화)

checkBossPhase() {
  const ratio = this.bossCurrentHP / this.bossMaxHP;
  if (ratio < 0.3 && this.bossPhase < 3) {
    this.bossPhase = 3;
    this.cameras.main.shake(500, 0.02);
  } else if (ratio < 0.6 && this.bossPhase < 2) {
    this.bossPhase = 2;
  }
}
```

**페이즈별 설계 원칙**
- Phase 1: 예측 가능, 패턴 학습 유도
- Phase 2: 복잡도 증가 (동시 패턴 2개 또는 이동 추가)
- Phase 3 (광란): 전 패턴 가속, 긴장감 극대화

---

## 섹션 4 — UI 재설계 상세 가이드

**첫 프롬프트에서 에셋과 함께 반드시 완료. 미루지 말 것.**

### App.tsx 레이어 구조

```
z-0  <GameComponent />         Phaser 캔버스 (pointer-events: none)
z-10 전화면 터치 오버레이       모든 터치 이벤트 캡처 (pointer-events: auto)
z-20 HUD                       점수/배율, 라이브, 폭탄, 스테이지, 보스 HP바, 파워업 배너
z-30 모달 화면                  타이틀 / 스테이지클리어 / 게임오버 (조건부 렌더)
```

### 터치 오버레이 (핵심)

전화면을 커버하는 투명 div로 터치 이벤트를 캡처해 `touchMove` / `touchEnd` 이벤트로 변환:

```tsx
<div
  className="absolute inset-0 z-10"
  style={{ touchAction: 'none' }}
  onTouchStart={(e) => {
    const t = e.touches[0];
    gameEvents.dispatchEvent(new CustomEvent('touchMove', { detail: { x: t.clientX, y: t.clientY } }));
  }}
  onTouchMove={(e) => {
    const t = e.touches[0];
    gameEvents.dispatchEvent(new CustomEvent('touchMove', { detail: { x: t.clientX, y: t.clientY } }));
  }}
  onTouchEnd={() => gameEvents.dispatchEvent(new CustomEvent('touchEnd'))}
/>
```

### HUD 요소 배치

- **점수**: 상단 중앙 (큰 폰트, 컨셉 강조색)
- **배율**: 점수 옆 소형 (`×2`, `×4` 등)
- **라이브**: 상단 좌측 (기체/하트 아이콘 × 개수)
- **폭탄**: 상단 우측 (폭탄 아이콘 × 개수)
- **스테이지**: 우측 상단 소형 텍스트
- **보스 HP 바**: 화면 하단 (보스 등장 시만 노출 — `showBossWarning` 이벤트에 반응)
- **파워업 알림 배너**: 중앙 상단 아래 (2초 애니메이션 후 사라짐)
- **폭탄 버튼**: 우측 하단 고정 (엄지 접근 영역, 충분히 큰 탭 타깃)

### 화면별 디자인

**타이틀 화면**: 배경 연출, 제목 폰트 스타일, 시작 버튼, 컨셉 분위기

**스테이지 클리어**: 스테이지 번호 + 클리어 메시지 + 획득 코인 수 + "NEXT STAGE" 버튼

**게임 오버**: 최종 점수 + 도달 스테이지 + 획득 코인 + 재도전 버튼

---

## 섹션 5 — 적 행동 패턴 구현 가이드

| behavior | 설명 | 구현 방향 |
|----------|------|-----------|
| `formation` | 편대 비행 — 위에서 아래로 통과 | 생성 시 `setVelocityY(speed)` 고정 |
| `dive` | 플레이어 쪽으로 급강하 | `physics.moveTo(enemy, player.x, player.y, speed)` |
| `stationary` | 화면 상단 특정 위치 정지 후 사격 | 타깃 위치 이동 후 velocity=0, 타이머로 bulletPattern 발사 |
| `zigzag` | 좌우 지그재그 하강 | `vx = Math.sin(time * freq) * amplitude; vy = downSpeed;` |

---

## 섹션 6 — 절대 변경 금지 (초기 수정 완료 후)

- **`src/game/Game.ts`** — 중력 수정 + 씬 목록 업데이트 후 완전 동결. 엔진 오버라이드 섹션 수정 시 게임 전체 파괴
- **`gameEvents` 이벤트 키** — 한 번 정의하면 절대 이름 변경 금지 (React ↔ Phaser 통신 파괴)
- **씬 키** — `'TitleScene'`, `'MainScene'`, `'GameOverScene'` 정확히 유지
- **물리 엔진** — `gravity: { x: 0, y: 0 }` 수정 후 변경 금지
- **`src/components/GameComponent.tsx`** — 수정 금지
- **`src/main.tsx`** — 수정 금지

---

## 섹션 7 — 기술 규칙 (위반 시 게임 파괴)

1. **중력 0** — 반드시 `{ x: 0, y: 0 }`. 모든 이동은 `setVelocity()` 사용
2. **탄환 풀링 필수** — `Physics.Arcade.Group`으로 오브젝트 풀 운영. `sprite.destroy()` 금지 → `setActive(false).setVisible(false)` 사용
3. **`setDisplaySize()` 필수** — 이미지/스프라이트 생성 직후 즉시 크기 지정
4. **Tween에서 scaleX/scaleY 금지** — `displayWidth` / `displayHeight` 사용
5. **config 분리** — 수치(속도, HP, 데미지, 타이밍)는 모두 `src/config/`에, 씬/시스템/엔티티는 import만
6. **에셋 품질**:
   - `style` 필드에 `high-quality`, `HD`, `detailed` 중 하나 이상 포함
   - `details` 필드에 `clean edges`, `professional sprite quality` 등 품질 묘사 추가
   - 금지: `"pixel art"` 단독, `low-res`, `simple`, `minimal`
7. **멀티라인 문자열** — 백틱(`) 사용

```
❌ Tween에서 scaleX, scaleY 금지
✅ Tween에서 displayWidth, displayHeight 사용

❌ pooled bullet에 sprite.destroy() 금지
✅ bullet.setActive(false).setVisible(false)

❌ const ship = this.add.image(x, y, 'player');  // 크기 미지정
✅ const ship = this.add.image(x, y, 'player');
   ship.setDisplaySize(60, 80);                   // 즉시 크기 지정
```
</userRequest>
