# 뱀파이어 서바이버류 보일러플레이트 템플릿 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **SURVIVOR QUEST가 이미 완전히 구현된 상태**입니다.

> ⚠️ **절대 중요**: 이 템플릿은 빈 보일러플레이트가 아닙니다. 뱀파이어 서바이버류 2D 모바일 액션 게임 SURVIVOR QUEST가 이미 완성되어 있습니다.

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
   - `.crossramp` `asset_keys`가 `server.js`의 `$asset.mint('gold')` 키와 일치하는지 확인

---

## 섹션 0-3 — 이 템플릿의 원래 목적 (참고)

이 템플릿의 기반 보일러플레이트는 **뱀파이어 서바이버류 2D 모바일 게임**이며, 같은 구조에서 다양한 테마의 게임을 만들 수 있습니다.

---

## 섹션 0-4 — 첫 프롬프트 필수 완료 항목 (절대 누락 금지)

> ⚠️ 아래 항목은 첫 프롬프트에서 반드시 완료해야 합니다. 나중으로 미루지 마십시오.

1. **CrossRamp 배포**: `read_gameserver_sdk_v2` → `read_gameserver_sdk_crossramp` 순서로 호출
2. **에셋 생성 + UI 재설계**: 섹션 2의 Step 2·8·9 는 세트 — 에셋만 교체하고 UI를 그대로 두는 것 금지
3. **통화명 변경 시 3-way 동기화**: `server.js` → `App.tsx` → `.crossramp` 동시 반영

---

## 섹션 1 — 컨셉 수령 절차

### 1-A. 사용자가 주요 컨셉을 제공한 경우

**블록체인 키워드 ≠ 게임 컨셉**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` 등은 **블록체인 기술 스펙**이며 게임 세계관 결정에 사용하지 않는다. 유저 프롬프트에 이 키워드만 있고 세계관이 명시되지 않았다면 → **사이버펑크/SF를 선택하는 것을 금지**하며 **1-B로 이동**하여 조합 테이블에서 선택.

1. **세계관 추출**: 판타지/SF/해양/스팀펑크/동양신화 등 배경
2. **주인공 추출**: 직업, 이동 방식, 공격 스타일
3. **적군 추출**: 테마에 맞는 3~4종 (일반/빠름/탱커/원거리)
4. **배색/분위기 추출**: 컬러팔레트, UI 무드
5. 위 항목을 바탕으로 config 4파일 + assets.json + App.tsx 전면 수정

### 1-B. 사용자가 컨셉을 제공하지 않은 경우

**자동 선택 금지**: 사이버펑크, SF — 사용자가 명시적으로 요청한 경우에만 사용 가능.

아래 조합 테이블은 **영감 소스**일 뿐이다. 목록에 없는 세계관·주인공·적을 **자유롭게 창작** 가능. 예시를 그대로 복사하지 말고, **반드시 자기만의 새로운 조합**을 만들 것. 매번 다르고 새로운 게임이 나오도록 창의적으로 조합.

| 축 | 예시 (영감 소스 — 목록 외 창작 권장) |
|----|-------------------------------------|
| **세계관** | 판타지, 포스트아포칼립스, 해양 탐험, 스팀펑크, 동양신화, 현대 도시, 고대 이집트, 빙하 시대, 정글 원시림, 화산 지대, 지하 도시, 사막 유목, 구름 위 공중 왕국, 곤충 세계(미니어처), 요리/음식 세계, 장난감 세계, 악몽/꿈속 세계, 지하 감옥(던전), 마법 서커스, 해적 시대, 북유럽 신화, 메소아메리카 문명, 수묵화 세계, 우주 정거장 |
| **주인공** | 기사, 마법사, 해커 드론, 다이버, 우주비행사, 발명가, 샤먼, 요정, 닌자, 로봇, 정글 탐험가, 화산 용사, 사막 상인, 공중 기사, 곤충 기사, 요리사, 장난감 병사, 꿈의 수호자, 던전 탐험가, 서커스 마법사, 해적 선장, 바이킹, 아즈텍 전사, 수묵화 검객, 우주 정거장 경비 |
| **적 (3~4종)** | 슬라임/늑대/오크, 바이러스 봇/해킹 드론, 심해 생물/해파리, 기계 벌레/스팀 골렘, 요괴/귀신, 좀비/변종, 외계인/침략자, 정글 식물/독개구리, 용암 골렘/화산 정령, 지하 돌연변이, 사막 스콜피온/모래괴물, 구름 위 폭풍 정령, 거대 개미/거미, 음식 괴물/버섯 몬스터, 장난감 로봇/곰인형, 악몽 그림자/꿈 먹는 몬스터, 던전 스켈레톤/골렘, 서커스 마법 괴물, 해적 유령/바다괴물, 북유럽 트롤/늑대, 아즈텍 저주받은 자, 수묵화 막/귀신, 우주 해적/로봇 |
| **배색** | 네온 퍼플, 청록/해양, 연두/마법 숲, 코발트블루/우주, 구리/스팀펑크, 아이스블루/빙하, 크림슨/다크 판타지, 밀짚색/정글, 오렌지/화산, 암갈/지하, 황금/사막, 하늘색/공중, 초록/곤충, 파스텔/음식, 빨강/장난감, 보라/악몽, 회색/던전, 빨강/서커스, 네이비/해적, 파란회색/북유럽, 테라코타/메소아메리카, 수묵화 흑백, 은색/우주 |

**조합 예시 (참고용 — 절대 그대로 복사 금지, 자기만의 새 조합 생성)**  
- 정글 원시림 × 정글 탐험가 × 독개구리/식물 괴물 × 밀짚색  
- 화산 지대 × 화산 용사 × 용암 골렘/화산 정령 × 오렌지  
- 사막 유목 × 사막 상인 × 스콜피온/모래괴물 × 황금  
- 공중 왕국 × 공중 기사 × 폭풍 정령 × 하늘색  
- 곤충 세계 × 곤충 기사 × 거대 개미/거미 × 초록  
- 음식 세계 × 요리사 × 음식 괴물/버섯 몬스터 × 파스텔  
- 장난감 세계 × 장난감 병사 × 로봇/곰인형 × 빨강  
- 악몽 세계 × 꿈의 수호자 × 악몽 그림자 × 보라  
- 던전 × 던전 탐험가 × 스켈레톤/골렘 × 회색  
- 마법 서커스 × 서커스 마법사 × 마법 괴물 × 빨강  

---

## 섹션 2 — 전면 재창조 체크리스트 (순서대로 실행)

1. **게임 이름 & 세계관 확정** — `GAME_CONFIG.name`, `subtitle` 결정
2. **에셋 생성** (이미지 생성 도구 사용): 플레이어, 적 타입별, 배경, XP 젬, 통화 아이콘, **투사체(projectile)**  
   → **에셋 생성 직후 Step 8 App.tsx UI 재설계를 반드시 이어서 실행 (세트 작업). 첫 프롬프트에서 완료 — UI를 나중 프롬프트로 미루지 것. 에셋만 교체하고 UI를 그대로 두는 것은 허용되지 않는다.**  
   → `gameConfig.projectile.spriteKey`와 `assets.json` images 키를 일치시킬 것. 투사체는 통화 아이콘과 별도 에셋.
3. **`src/assets.json` 업데이트** — 새 URL 반영
4. **`src/config/enemyTypes.ts`** — 최소 3종 적 설계, 각각 다른 `behavior` 지정
5. **`src/config/abilities.ts`** — 최소 6개 스킬 설계, 컨셉에 맞는 이름/효과 (기존 예시는 참고만, 직접 새로 작성)
6. **`src/config/waves.ts`** — 10웨이브 진행 설계 (적 조합 변화, 난이도 곡선)
7. **`src/config/gameConfig.ts`** — 게임 이름, 플레이어 스탯, UI 테마 토큰 업데이트
8. **`src/App.tsx`** — UI 전면 재설계 (레이아웃, 색상, CSS, 아이콘, 폰트, 배경 효과) — **첫 프롬프트에서 Step 2와 함께 완료. 미루지 말 것.**
9. **`src/components/AbilityIcon.tsx`** — 새 능력 아이콘 추가 시 `ICON_MAP`에 등록
10. **`MainScene`** — 새 ability effect 타입 추가 시 `handleSelectAbility`에 처리 로직 추가
11. **Deploy CrossRamp (mandatory, first prompt)** — 반드시 수행:
    - Call `read_gameserver_sdk_v2` → server SDK 문서 확인
    - Call `read_gameserver_sdk_crossramp` → CrossRamp 배포, 루트에 `.crossramp` 파일 생성
    - `.crossramp`의 `asset_keys`가 `server.js`의 `$asset.mint()` 키(`'gold'` 또는 변경한 키)와 일치하는지 확인
12. **CROSS Integration 동기화 (필수)** — 통화명/수집품명 변경 시 3곳 동기화:
    - A. `server.js` — `$asset.mint('새키', amount)` / `$asset.get('새키')`
    - B. `src/App.tsx` — `assets?.['새키'] || 0` (타이틀 화면 총 골드 표시)
    - C. `.crossramp` — `asset_keys: ["새키"]` (CrossRamp 재배포)
    - **절대 변경 금지**: `server.js` 함수명 `addGold` — App.tsx가 `remoteFunction('addGold')` 로 호출

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

## 섹션 3 — UI 재설계 상세 가이드

**첫 프롬프트에서 에셋과 함께 UI 재설계를 반드시 완료.** 나중으로 미루지 말 것.

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
