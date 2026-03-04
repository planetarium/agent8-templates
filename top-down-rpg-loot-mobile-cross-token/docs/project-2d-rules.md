# 탑다운 RPG 던전 루트 보일러플레이트 템플릿 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **탑다운 모바일 RPG 던전 크롤러 루트 게임**의 보일러플레이트입니다. 같은 템플릿에서 시작해도 **다양한 형태의 게임**이 만들어질 수 있어야 합니다.

### 변경 가능한 것 (반드시 새 컨셉에 맞게 수정)

| 대상 | 파일 | 설명 |
|------|------|------|
| 게임 이름/부제 | `src/assets.json`, overlays | name, subtitle |
| 플레이어 캐릭터/스프라이트 | `src/assets.json` | characters.player (탑다운 뷰) |
| 적 타입 (2종 이상) | `src/assets.json`, GameScene | characters.enemy, 스폰 로직 |
| 보스 | `src/assets.json`, GameScene | characters.boss |
| 투사체 (플레이어) | `src/assets.json` | items.playerBullet |
| 수집 아이템 (3등급) | `src/assets.json` | items.gem, rareGem, epicGem (변경 가능) |
| 배경 (던전 바닥 타일) | `src/assets.json` | backgrounds.dungeon |
| UI 레이아웃/스타일/위치 | `src/components/overlays/*` | 전체 UI 구조 |
| 드롭 비율/수치 | GameScene | spawnDrop() 함수 |
| 층 난이도/웨이브 설계 | GameScene | spawnFloor() 함수 |

### 절대 변경 금지

- `src/game/Game.ts` 전체 (Phaser 엔진 오버라이드)
- `EventBus` 이벤트 키 이름 (SCENE_CHANGE, HUD_UPDATE, GAME_OVER, BOOT_PROGRESS, OPEN_CROSS_RAMP, GEM_BALANCE)
- 씬 키: `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`
- Phaser 물리 엔진 설정 (gravity: { x: 0, y: 0 })
- `GameComponent.tsx` 전체 (claimGems, openCrossRamp 로직)
- server.ts 함수명: `claimGems`, `getGemBalance`

---

## 섹션 1 — 컨셉 수령 절차

### 1-A. 사용자가 주요 컨셉을 제공한 경우

**블록체인 키워드 ≠ 게임 컨셉**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` 등은 **블록체인 기술 스펙**이며 게임 세계관 결정에 사용하지 않는다. 유저 프롬프트에 이 키워드만 있고 세계관이 명시되지 않았다면 → **사이버펑크/SF를 선택하는 것을 금지**하며 **1-B로 이동**하여 조합 테이블에서 선택.

1. **세계관 추출**: 판타지/SF/해양/스팀펑크/동양신화/사막/빙하 등 배경
2. **주인공 추출**: 이동 방식, 공격 스타일, 탑다운 외관
3. **적군 추출**: 테마에 맞는 2~3종 (일반/빠름/탱커)
4. **보스 추출**: 테마에 맞는 강력한 보스
5. **수집품 추출**: 컨셉에 맞는 3등급 수집품 (일반/희귀/에픽)
6. **배색/분위기 추출**: 컬러팔레트, UI 무드
7. 위 항목을 바탕으로 assets.json + overlays + GameScene 전면 수정

### 1-B. 사용자가 컨셉을 제공하지 않은 경우

**자동 선택 금지**: 사이버펑크, SF — 사용자가 명시적으로 요청한 경우에만 사용 가능.

아래 조합 테이블은 **영감 소스**일 뿐이다. 목록에 없는 세계관·주인공·적을 **자유롭게 창작** 가능. 예시를 그대로 복사하지 말고, **반드시 자기만의 새로운 조합**을 만들 것.

| 축 | 예시 (영감 소스 — 목록 외 창작 권장) |
|----|-------------------------------------|
| **세계관** | 심해 던전, 마법 왕국, 고대 신전, 스팀펑크 공장, 화산 지하, 정글 유적, 빙하 동굴, 사막 피라미드, 동양 신화 지하세계, 악몽 세계, 해적 보물섬, 포스트아포칼립스 지하, 우주 정거장, 수묵화 지하, 요리사의 주방 던전 |
| **주인공 (탑다운 뷰)** | 기사, 마법사, 궁수, 로그, 잠수함 탐험가, 고고학자, 닌자, 해적, 우주 탐험가, 바이킹, 아즈텍 전사, 셰프, 연금술사, 사냥꾼, 수묵화 검객 |
| **적 (2~3종)** | 해골/좀비/슬라임/박쥐/석상/가시덫/녹슨 로봇/물고기/꽃/버섯/눈뭉치/모래괴물/기생충/악마/유령 |
| **보스** | 용/악마왕/대형 거미/눈의 신/해골 왕/심해 크라켄/화산 골렘/얼음 마녀/정글 수호자 |
| **수집품 3등급** | (일반) 동전/조각/씨앗/뼈조각 / (희귀) 수정/보석/정수 / (에픽) 유물/고대 주화/전설의 보석 |
| **배경 스타일** | 돌바닥 던전, 산호초 바닥, 마법진 타일, 모래 바닥, 얼음 바닥, 화산암 바닥, 나무 바닥, 우주선 금속 바닥, 수묵화 종이 |
| **배색/UI 테마** | 보라/마법, 파랑/심해, 구리/스팀펑크, 황금/사막, 빨강/화산, 하늘/빙하, 오렌지/정글, 검정/악몽, 수묵/동양, 파스텔/동화 |

**조합 예시 (참고용 — 절대 그대로 복사 금지, 자기만의 새 조합 생성)**
- 심해 던전 × 잠수함 탐험가 × 물고기/해파리 × 크라켄 보스 × 산호/수정/유물 × 청록
- 화산 지하 × 연금술사 × 용암 골렘/박쥐 × 화산 드래곤 × 동전/루비/고대 금괴 × 오렌지/빨강
- 동양 신화 × 수묵화 검객 × 요괴/귀신 × 도깨비왕 × 영혼/여의주/신기 × 먹색/금색

---

## 섹션 2 — 전면 재창조 체크리스트 (순서대로 실행)

1. **게임 이름 & 세계관 확정** — `docs/project-2d-rules.md` 섹션 1-B 참조
2. **에셋 생성** (NanoBanana Pro): 플레이어(탑다운), 적 타입별(탑다운), 보스(탑다운), 배경(바닥 타일), 수집품 3등급, 투사체
   → **에셋 생성 직후 Step 7 Overlay UI 재설계를 반드시 이어서 실행 (세트 작업). 첫 프롬프트에서 완료 — UI를 나중 프롬프트로 미루지 말 것.**
3. **`src/assets.json` 업데이트** — 새 URL 반영. 키 확인: `player`, `enemy`, `boss`, `gem`, `rareGem`, `epicGem`, `playerBullet`, `bg`
4. **`GameScene.ts`** — 적 스폰 파라미터, 층 진행 설계 재설계
5. **`GameScene.ts`** — 보스 패턴 재설계
6. **`GameScene.ts`** — 드롭 시스템 (수집품 키/등급/확률) 재설계
7. **`src/components/overlays/*`** — UI 전면 재설계 (레이아웃, 색상, CSS, 아이콘, 폰트) — **첫 프롬프트에서 Step 2와 함께 완료. 미루지 말 것.**
8. **JUICE 효과 추가** — 파티클, 카메라 쉐이크, 트윈, 배경 패닝 (섹션 4 참조)
9. **Deploy CrossRamp (mandatory, first prompt)** — 반드시 수행:
   - Call `read_gameserver_sdk_v2` → read server SDK docs
   - Call `read_gameserver_sdk_crossramp` → deploy CrossRamp, creates `.crossramp` at root
   - Confirm asset_keys in `.crossramp` matches the collectible key
10. **CROSS Integration 동기화 (필수)** — 컨셉 변경 시 반드시 수행:
    - A. `server/src/server.ts` — `$asset.mint('gem')`, `$asset.get('gem')` 에셋 키를 컨셉 수집품명으로 변경
    - B. `GameScene.ts` — drop type 문자열들을 A와 동일하게 변경
    - C. `WalletOverlay.tsx` — 토큰명("GDT"), 교환 비율("100 GEMS = 1 GDT") 텍스트 업데이트
    - D. **절대 변경 금지**: `server.ts` 함수명 `claimGems`, `getGemBalance`
    - E. **절대 변경 금지**: `GameComponent.tsx` 전체

---

## 섹션 3 — UI 재설계 상세 가이드

**첫 프롬프트에서 에셋과 함께 UI 재설계를 반드시 완료.** 나중으로 미루지 말 것.

UI는 **이름/색상만 바꾸는 것이 아님**. 컨셉에 맞게 **위치, CSS, 스타일**을 전면 재설계.

### 타이틀 화면 (TitleOverlay)
- 배경 연출 (그라데이션, 오버레이)
- 제목 폰트 스타일 (italic, tracking, stroke)
- 버튼 스타일 (모서리, 그림자, 호버 효과)
- 젬 잔액 표시 방식

### HUD (플레이 중, HUDOverlay)
- 체력 표시: 하트/바/오브 중 선택
- 스코어, 층, 수집 아이템 표시 위치/스타일
- (선택) 미니맵 또는 위험 경고 UI

### 게임오버 화면 (GameOverOverlay)
- 배경 색상
- 메시지 텍스트 (컨셉에 맞게)
- 통계 표시 (Score, Floor, Gems)
- 재시도 버튼 스타일

### 지갑/교환 화면 (WalletOverlay)
- CROSS Mini Hub 버튼 스타일
- 수집 아이템 → 토큰 교환 비율 표시
- 토큰 이름/심볼 (GDT → 컨셉에 맞게 변경)

---

## 섹션 4 — JUICE 필수 체크리스트

**첫 프롬프트에서 게임 완성도와 함께 반드시 적용.** Don't be boring — effects ESPECIALLY graphics!

| 항목 | 필수 적용 |
|------|----------|
| **파티클** | 적/보스 피격·폭발 시 파티클, 수집품 획득 시 반짝임 |
| **카메라 쉐이크** | 피격 시, 보스 등장 시, 폭발 시 `this.cameras.main.shake()` |
| **배경 패닝** | tilePositionX/Y 느린 이동 효과 |
| **보스 등장 연출** | 페이드인, 스케일 팝, 층 배너 경고 |
| **트윈** | 모든 UI 전환, 수집품 팝 효과, 플로팅 텍스트 |
| **플레이어 회전** | 자동 공격 시 가장 가까운 적을 향해 회전 |
| **수집품 인력** | 플레이어 근처 80px 이내에서 자동 흡인 |
| **HP 바** | 적 머리 위 HP 바 실시간 업데이트 |
| **이미지 생성 도구** | NanoBanana Pro 사용, style/colors/details/background 포함 |

---

## 섹션 5 — 절대 변경 금지 (재강조)

- **`src/game/Game.ts`** — Phaser setDisplaySize/setScale/Tween 오버라이드 포함, 수정 시 게임 전체 깨짐
- **EventBus 이벤트 키** — React ↔ Phaser 통신에 사용, 변경 시 연동 오류
- **씬 키** — `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`
- **물리 엔진** — `gravity: { x: 0, y: 0 }`
- **GameComponent.tsx** — claimGems, openCrossRamp 로직 수정 금지
- **server.ts 함수명** — `claimGems`, `getGemBalance` 변경 금지

---

## 섹션 6 — 기술 규칙 (기존 유지)

1. **이미지 생성 도구 사용**: NanoBanana Pro, 상세 프롬프트에 style, colors, details, background 반드시 포함
   - 모든 캐릭터 스프라이트는 **탑다운 뷰** (위에서 내려다보는 시점)로 생성
   - **Pixel Art 스타일 품질 주의**: `style` 필드에 `high-quality`, `high-resolution` 중 하나 이상 포함
2. **displayWidth/displayHeight만 사용**: Tween에서 `scaleX`/`scaleY` 금지
3. **setDisplaySize() 필수**: 이미지/스프라이트 추가 시 즉시 크기 지정
4. **Room bounds 준수**: 플레이어·적 모두 `Phaser.Math.Clamp()`로 룸 경계 내 유지
5. **멀티라인 문자열**: 백틱(`) 사용
6. **프로덕션 품질**: 모든 기능을 완성도 있게 구현

### displayWidth/displayHeight 규칙 (CRITICAL)

❌ Wrong (FORBIDDEN):
```javascript
this.tweens.add({ targets: sprite, scaleX: 1.5, scaleY: 1.5, duration: 300 });
```

✅ Correct (REQUIRED):
```javascript
this.tweens.add({
  targets: sprite,
  displayWidth: sprite.displayWidth * 1.5,
  displayHeight: sprite.displayHeight * 1.5,
  duration: 300,
});
```

### setDisplaySize() 규칙 (CRITICAL)

❌ Wrong (FORBIDDEN):
```javascript
const sprite = this.add.image(x, y, 'texture');
// No size control
```

✅ Correct (REQUIRED):
```javascript
const sprite = this.add.image(x, y, 'texture');
sprite.setDisplaySize(64, 64);  // MANDATORY
```
</userRequest>
