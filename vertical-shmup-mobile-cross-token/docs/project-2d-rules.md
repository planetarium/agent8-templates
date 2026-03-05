# 수직 슈팅 보일러플레이트 템플릿 — AI 에이전트 지침

<userRequest>
YOU MUST follow these rules when working with this template.

## 섹션 0 — 이 템플릿의 목적

이 프로젝트는 **수직 스크롤 슈팅(shmup)** 모바일 게임의 보일러플레이트입니다. 같은 템플릿에서 시작해도 **다양한 형태의 게임**이 만들어질 수 있어야 합니다.

### 변경 가능한 것 (반드시 새 컨셉에 맞게 수정)

| 대상 | 파일 | 설명 |
|------|------|------|
| 게임 이름/부제 | `src/assets.json`, overlays | name, subtitle |
| 플레이어 기체/스프라이트 | `src/assets.json` | characters.player |
| 적 타입 (3종 이상) | `src/assets.json`, GameScene | characters.enemy, 스폰 로직 |
| 보스 | `src/assets.json`, GameScene | characters.boss |
| 투사체 (플레이어/적) | `src/assets.json` | items.playerBullet, enemyBullet |
| 수집 아이템 | `src/assets.json` | items.stardust (토큰명 변경 가능) |
| 배경 | `src/assets.json` | backgrounds |
| UI 레이아웃/스타일/위치 | `src/components/overlays/*` | TitleOverlay, HUDOverlay, GameOverOverlay, **WalletOverlay** — 전체 CSS·레이아웃·색상 전면 재설계 |
| 파워업/스킬 | GameScene | spread shot, shield 등 |

### 절대 변경 금지

- `src/game/Game.ts` 전체 (Phaser 엔진 오버라이드)
- `EventBus` 이벤트 키 이름 (SCENE_CHANGE, HUD_UPDATE, GAME_OVER, BOOT_PROGRESS, OPEN_CROSS_RAMP, STARDUST_BALANCE)
- 씬 키: `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`
- Phaser 물리 엔진 설정 (gravity: { x: 0, y: 0 })

---

## 섹션 1 — 컨셉 수령 절차

### 1-A. 사용자가 주요 컨셉을 제공한 경우

**블록체인 키워드 ≠ 게임 컨셉**: `CROSS`, `chain`, `token`, `blockchain`, `wallet` 등은 **블록체인 기술 스펙**이며 게임 세계관 결정에 사용하지 않는다. 유저 프롬프트에 이 키워드만 있고 세계관이 명시되지 않았다면 → **사이버펑크/SF를 선택하는 것을 금지**하며 **1-B로 이동**하여 조합 테이블에서 선택.

1. **세계관 추출**: 판타지/SF/해양/스팀펑크/동양신화 등 배경
2. **기체(주인공) 추출**: 이동 방식, 공격 스타일
3. **적군 추출**: 테마에 맞는 3~4종 (일반/빠름/탱커/원거리)
4. **배색/분위기 추출**: 컬러팔레트, UI 무드
5. 위 항목을 바탕으로 assets.json + overlays + GameScene 전면 수정

### 1-B. 사용자가 컨셉을 제공하지 않은 경우

**자동 선택 금지**: 사이버펑크, SF — 사용자가 명시적으로 요청한 경우에만 사용 가능.

아래 조합 테이블은 **영감 소스**일 뿐이다. 목록에 없는 세계관·기체·적을 **자유롭게 창작** 가능. 예시를 그대로 복사하지 말고, **반드시 자기만의 새로운 조합**을 만들 것. 매번 다르고 새로운 게임이 나오도록 창의적으로 조합.

| 축 | 예시 (영감 소스 — 목록 외 창작 권장) |
|----|-------------------------------------|
| **세계관** | 심해 탐험, 마법 왕국, 스팀펑크 하늘, 고대 신화, 정글 생태계, 요리 세계, 악몽 세계, 해적 시대, 사막 신전, 빙하 시대, 동양 판타지, 미니어처 곤충, 우주 정거장, 포스트아포칼립스, 해양 탐험, 스팀펑크, 북유럽 신화, 메소아메리카 문명, 수묵화 세계 |
| **기체(주인공)** | 잠수함, 마법 빗자루, 비공정, 독수리 기사, 연(凧), 꽃잎 바람, 나비, 로봇, 해적선, 용선, 정글 탐험가 비행기, 화산 용사, 사막 상인, 공중 기사, 곤충 기사, 요리사, 장난감 병사, 꿈의 수호자, 던전 탐험가, 서커스 마법사, 바이킹, 아즈텍 전사, 수묵화 검객 |
| **적 (3~4종)** | 해파리/심해 어류, 마족 군단, 기계 새, 신전 수호자, 독충 떼, 바이러스 봇, 심해 생물, 스팀 골렘, 요괴/귀신, 좀비/변종, 외계인/침략자, 정글 식물/독개구리, 용암 골렘, 지하 돌연변이, 스콜피온/모래괴물, 폭풍 정령, 거대 개미/거미, 음식 괴물, 장난감 로봇, 악몽 그림자, 던전 스켈레톤, 해적 유령, 북유럽 트롤 |
| **배경 스타일** | 심해 산호초, 마법 숲, 구름 위 성, 사막 피라미드, 빙하 동굴, 우주 네뷸라, 정글 폭포, 화산 지대, 지하 도시, 사막 유목, 구름 위 공중 왕국, 곤충 세계(미니어처), 요리/음식 세계, 장난감 세계, 악몽/꿈속 세계 |
| **배색/UI 테마** | 청록/해양, 보라/마법, 구리/스팀펑크, 밀짚색/정글, 오렌지/화산, 암갈/지하, 황금/사막, 하늘색/공중, 초록/곤충, 파스텔/음식, 빨강/장난감, 보라/악몽, 회색/던전, 네이비/해적, 파란회색/북유럽, 테라코타/메소아메리카, 수묵화 흑백 |

**조합 예시 (참고용 — 절대 그대로 복사 금지, 자기만의 새 조합 생성)**  
- 심해 탐험 × 잠수함 × 해파리/심해 어류 × 청록  
- 마법 왕국 × 마법 빗자루 × 마족 군단 × 보라  
- 정글 생태계 × 나비 기체 × 독충 떼 × 밀짚색  
- 스팀펑크 하늘 × 비공정 × 기계 새 × 구리  
- 사막 신전 × 독수리 기사 × 신전 수호자 × 황금  
- 빙하 시대 × 용선 × 빙하 괴물 × 아이스블루  

---

## 섹션 2 — 전면 재창조 체크리스트 (순서대로 실행)

1. **게임 이름 & 세계관 확정** — `docs/project-2d-rules.md` 섹션 1-B 참조
2. **에셋 생성** (이미지 생성 도구 사용): 플레이어 기체, 적 타입별, 보스, 배경, 수집 아이템, 플레이어 투사체, 적 투사체  
   → **에셋 생성 직후 Step 7 Overlay UI 재설계를 반드시 이어서 실행 (세트 작업). 첫 프롬프트에서 완료 — UI를 나중 프롬프트로 미루지 것. 에셋만 교체하고 UI를 그대로 두는 것은 허용되지 않는다.**
3. **`src/assets.json` 업데이트** — 새 URL 반영
4. **`GameScene.ts`** — 적 스폰 파라미터, 웨이브 설계 재설계
5. **`GameScene.ts`** — 보스 패턴 재설계
6. **`GameScene.ts`** — 파워업 시스템 (spread shot, shield, speed boost 등) 재설계
7. **`src/components/overlays/*`** — UI 전면 재설계 (레이아웃, 색상, CSS, 아이콘, 폰트) — **첫 프롬프트에서 Step 2와 함께 완료. 미루지 말 것.**
   - `TitleOverlay.tsx` + `TitleOverlay.module.css` — 배경, 제목, 버튼 전면 재설계 (필수)
   - `HUDOverlay.tsx` + `HUDOverlay.module.css` — 체력·스코어·웨이브 레이아웃·색상 재설계 (필수)
   - `GameOverOverlay.tsx` + `GameOverOverlay.module.css` — 배경·메시지·버튼 재설계 (필수)
   - **`WalletOverlay.tsx` + `WalletOverlay.module.css` — 컨셉 테마에 맞게 TitleOverlay와 동일한 수준으로 전면 재설계 필수. 기본 사이버블루 스타일을 그대로 두는 것은 허용되지 않는다.** (교환비·토큰명은 서버 props로 자동 반영되므로 TSX 로직은 수정하지 말고 스타일만 재설계)
8. **JUICE 효과 추가** — 파티클, 카메라 쉐이크, 트윈, 사운드 (섹션 4 참조)
9. **Deploy CrossRamp (mandatory, first prompt)** — 반드시 수행:
   - Call `read_gameserver_sdk_v2` → read server SDK docs
   - Call `read_gameserver_sdk_crossramp` → deploy CrossRamp, creates `.crossramp` at root
   - Confirm asset_keys in `.crossramp` matches the collectible key
   - **⚠️ `.crossramp` 생성 후 반드시 파일을 열어 `exchange_rate` 값을 확인할 것** — 이 값이 WalletOverlay에 표시할 실제 교환비이며, 임의로 작성하거나 기본값(100:1)을 그대로 쓰는 것은 금지
10. **CROSS Integration 동기화 (필수)** — 컨셉 변경 시 반드시 수행:
   - A. `server/src/server.ts` — `$asset.mint('stardust')`, `$asset.get('stardust')` 에셋 키를 컨셉 수집품명으로 변경
   - B. `GameScene.ts` — drop type `'stardust'` 문자열을 A와 동일하게 변경
   - C. `server/src/server.ts` → `getGameConfig()` 함수의 `exchangeRate`, `tokenSymbol`, `collectibleName` 세 값을 **반드시 `.crossramp`의 `exchange_rate` 값 및 수집품명과 일치하도록** 수정. WalletOverlay는 서버에서 이 값을 동적으로 읽어 표시하므로, `WalletOverlay.tsx` 직접 수정 불필요.
   - D. **절대 변경 금지**: `server.ts` 함수명 `claimStardust`, `getStardustBalance` — GameComponent가 `remoteFunction('claimStardust')` 로 호출
   - E. **절대 변경 금지**: `GameComponent.tsx` — claimStardust, openCrossRamp 로직 수정 금지

---

## 섹션 3 — UI 재설계 상세 가이드

**첫 프롬프트에서 에셋과 함께 UI 재설계를 반드시 완료.** 나중으로 미루지 말 것.

UI는 **이름/색상만 바꾸는 것이 아님**. 컨셉에 맞게 **위치, CSS, 스타일**을 전면 재설계.

### 타이틀 화면 (TitleOverlay)
- 배경 연출 (그라데이션, 오버레이)
- 제목 폰트 스타일 (italic, tracking, stroke)
- 버튼 스타일 (모서리, 그림자, 호버 효과)
- 베스트 스코어 표시 위치

### HUD (플레이 중, HUDOverlay)
- 체력 표시: 하트/바/오브 중 선택
- 스코어, 웨이브, 수집 아이템 표시 위치
- 퇴장 버튼 위치/스타일

### 게임오버 화면 (GameOverOverlay)
- 배경 색상
- 메시지 텍스트
- 통계 표시 (Session Score, Wave 등)
- 재시도 버튼 스타일

### 지갑/교환 화면 (WalletOverlay) — TitleOverlay와 동일 수준 재설계 필수

**⚠️ 기본 사이버블루 우주 스타일을 그대로 두는 것은 금지.** 게임 컨셉 테마에 맞게 아래 모든 항목을 전면 재설계.

- **배경/패널**: 컨셉에 맞는 색상, 테두리, 글로우, 장식 (사이버블루 기본 패널 사용 금지)
- **헤더/타이틀**: 폰트 스타일, 컬러, 장식 심볼 (✦ 대신 컨셉에 맞는 이모지·문자)
- **교환비 박스**: 배경색, 테두리 색상, 수치 폰트 스타일
- **토큰 뱃지**: 배경, 테두리, 색상 테마
- **버튼 스타일**: 그라데이션, 그림자, 호버 효과 — TitleOverlay 버튼과 통일감 유지
- **교환비·토큰명**: `exchangeRate`, `tokenSymbol`, `collectibleName` props가 서버에서 자동 주입되므로 TSX 로직 수정 금지, CSS·레이아웃만 변경

---

## 섹션 4 — JUICE 필수 체크리스트

**첫 프롬프트에서 게임 완성도와 함께 반드시 적용.** Don't be boring — sound, controls, effects, ESPECIALLY graphics!

| 항목 | 필수 적용 |
|------|----------|
| **파티클** | 적/보스 피격·폭발 시 파티클, 수집 아이템 획득 시 반짝임 |
| **카메라 쉐이크** | 피격 시, 보스 등장 시, 폭발 시 `this.cameras.main.shake()` |
| **배경 스크롤** | 시차 스크롤 (parallax) 효과 |
| **보스 등장 연출** | 페이드인, 스케일 팝, 경고 UI |
| **트윈** | 모든 UI 전환, 버튼 호버, 페이드 인/아웃 |
| **기체 연출** | 엔진 글로우, 좌우 이동 시 뱅킹(틸트) |
| **투사체** | ADD 블렌드모드 (빛 번짐), 플레이어/적 구분 색상 |
| **사운드** | 발사, 폭발, 수집, 보스 등장 (가능 시) |
| **이미지 생성 도구** | 사용 가능 시 에셋 생성 시 상세 프롬프트 (style, colors, details, background) |

---

## 섹션 5 — 절대 변경 금지 (재강조)

- **`src/game/Game.ts`** — Phaser setDisplaySize/setScale/Tween 오버라이드 포함, 수정 시 게임 전체 깨짐
- **EventBus 이벤트 키** — React ↔ Phaser 통신에 사용, 변경 시 연동 오류
- **씬 키** — `BootScene`, `TitleScene`, `GameScene`, `GameOverScene`, `WalletScene`
- **물리 엔진** — `gravity: { x: 0, y: 0 }`

---

## 섹션 6 — 기술 규칙 (기존 유지)

1. **이미지 생성 도구 사용**: 에셋 생성 시 나노바나나프로(NanoBanana Pro) 사용, 상세 프롬프트에 style, colors, details, background 반드시 포함
   - **Pixel Art 스타일 품질 주의**: "pixel art"를 선택하면 도구가 저해상도·저품질 이미지를 생성하는 경우가 많음. 품질 유지를 위해:
     - `style` 필드에 **반드시** `high-quality`, `high-resolution`, `detailed`, `HD` 중 하나 이상 포함
     - `details` 필드에 `clean edges`, `vibrant colors`, `professional sprite quality` 등 품질 관련 묘사 추가
     - **금지**: `style: "pixel art"` 단독 사용, `low-res`, `retro low quality`, `simple`, `minimal` 등 품질 저하 키워드
     - **권장 예시**: `style: "high-quality pixel art, clean edges, vibrant palette, professional game sprite, HD rendering"`
   - **배경 이미지 생성 규칙 (CRITICAL)**: 배경은 위→아래로 무한 반복 스크롤되므로, **상단과 하단이 끊김 없이 자연스럽게 이어지는 seamless loop 이미지**로 생성해야 한다.
     - `details` 필드에 **반드시** `seamlessly tileable vertically, top and bottom edges blend perfectly for infinite loop scrolling, no visible seam` 포함
     - 경계선이 보이는 배경은 플레이 중 루프 지점에서 끊겨 보임 — **반드시 tileable 구조로 생성**
2. **displayWidth/displayHeight만 사용**: Tween에서 `scaleX`/`scaleY` 금지
3. **setDisplaySize() 필수**: 이미지/스프라이트 추가 시 즉시 크기 지정
4. **Tween 애니메이션**: 부드러운 애니메이션, 페이드, 바운스 적용
5. **멀티라인 문자열**: 백틱(`) 사용
6. **프로덕션 품질**: 모든 기능을 완성도 있게 구현

### displayWidth/displayHeight 규칙 (CRITICAL)

❌ Wrong Example (FORBIDDEN - DO NOT WRITE):
```javascript
this.tweens.add({
    targets: sprite,
    scaleX: 1.5,        // ❌ FORBIDDEN!
    scaleY: 1.5,        // ❌ FORBIDDEN!
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});
```

✅ Correct Example (REQUIRED - ALWAYS WRITE):
```javascript
this.tweens.add({
    targets: sprite,
    displayWidth: sprite.displayWidth * 1.5,    // ✅ MANDATORY!
    displayHeight: sprite.displayHeight * 1.5,  // ✅ MANDATORY!
    duration: 300,
    yoyo: true,
    ease: 'Back.easeOut'
});
```

### setDisplaySize() 규칙 (CRITICAL)

❌ Wrong Example (FORBIDDEN - DO NOT WRITE):
```javascript
const sprite = this.add.image(x, y, 'texture');
// ❌ No size control - sprite uses original image dimensions
```

✅ Correct Example (REQUIRED - ALWAYS WRITE):
```javascript
const sprite = this.add.image(x, y, 'texture');
sprite.setDisplaySize(200, 150);  // ✅ MANDATORY! Always control dimensions
```
