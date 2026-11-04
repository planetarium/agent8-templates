# PixelVfx 헬퍼 기본 포함 — PR 전 실측

> 상태: **1·2단계 완료, 3단계는 사용자 import를 기다리는 중, 4단계는 C1 sync 뒤로 미룸.** 2026-11-04.
> 대상: `2d-phaser-basic`, `2d-phaser-sprite-character-gravity`. `basic-2d`(React·CSS)는 뺐다.
> 근거 실험: agent8-library `feat/pixelfx-vfx-sheets-pilot`의 `experiments/pixelfx-sheets/REPORT.md` 3a-2(헬퍼를 넣으면 5/5 사용, 문서만이면 0/4).

## 요지

| # | 실측 | 결과 |
|---|---|---|
| 1 | 두 템플릿 `bun install`·`bun run build`·`tsc -p tsconfig.app.json --noEmit` | **둘 다 통과, tsc 오류 0.** 헬퍼를 import하지 않으면 번들 증가 **0 B**(tree-shake). 헬퍼를 쓰면 **+5.1 KB, gzip +1.6 KB**(23장 기준) |
| 2 | Playwright 전수 재생 하네스(파일럿 시트 23장, CORS 켠 별도 오리진) | **152/152 검사 통과, 콘솔·네트워크 오류 0.** 23장 모두 로드·재생, one-shot 자동 destroy, loop 반복, flip·follow·hitStop·정수 배율 확인. `rain`이 zoom 0.5·1·2와 재생 뒤 zoom 변경·창 크기 변경에서 모두 화면을 덮음(파일럿 헬퍼는 zoom 0.5에서 화면의 1/4만 덮었음) |
| 3 | 스테이징 실전 라운드(A2 5개 프롬프트 + 벡터 화풍 자제율 2개) | **대기** — zip 준비 완료, 사용자 import 필요(아래 3단계) |
| 4 | 라이브러리 URL 기준 하네스 재실행 | **대기** — C1 결과 sync 뒤. 운영 호스트는 확인함(아래) |

## 무엇을 넣었나

- `scripts/pixelvfx/generate.mjs <agent8-library 체크아웃>`: `assets/2d/vfx/pixelfx/<category>/metadata.json`과 시트 JSON의 `meta.pixelfx.act.hits`에서 두 템플릿에 다음을 만든다(루트 `npm run pixelvfx -- <lib>`).
  - `src/game/vfx/sheets.ts`: `VFX_BASE_URL`, 카테고리별 이름 유니언·표(`EXPLOSIONS`, `IMPACTS`, …), 합친 `VfxName`·`SHEETS`. 이름이 카테고리를 넘어 겹치면 실패한다(229장 대비).
  - `src/game/vfx/PixelVfx.ts`: `scripts/pixelvfx/PixelVfx.ts`를 그대로 복사(두 템플릿이 같은 런타임을 갖게).
  - `docs/vfx-sheets.md`: 맨 위 사용 예 3줄 → "Which sheet when" 표 → 규칙 5줄 → 옵션 → 카테고리별 시트 표(이름·한 줄 설명·키워드·크기·프레임·pivot). 23장에 6.7 KB(파일럿 문서 18.7 KB). "Which sheet when"은 생성기 안의 짧은 매핑이고, 라이브러리에 없는 이름은 빠지고 경고한다.
- 헬퍼 API: `preload(scene, names)`(이름 필수, 일괄 로드 없음), `play(scene, name, x, y, { scale, depth, flip, follow, repeat, hitStop })` → Sprite.
  - 파일럿과 달라진 점: (a) `screenSpace`는 `cam.zoom`으로 나눈 크기·위치로 매 프레임 다시 맞춘다(재생 뒤 zoom·창 크기가 바뀌어도 덮음). (b) 텍스처·애니메이션 키를 `vfx:<name>`으로 둬서 에이전트가 만든 `'fireball'`·`'rain'` 같은 키와 부딪히지 않게 했다. 그래서 `createFromAseprite` 대신 `load.atlas` + `anims.create`(fps는 metadata)로 만든다. (c) `follow` 대상이 destroy되면 효과도 없앤다(상태 loop가 고아로 남지 않게). (d) 모르는 이름은 바로 오류를 낸다.
- `PROJECT/Context.md`: Tech Stack 한 줄 + Critical Memory 한 줄("기본 사용 + 분명한 벡터·HD·페인팅 화풍이면 Phaser particles/graphics + 사용자 지정 우선 + scale만, setDisplaySize 금지"). `PROJECT/Structure.md`에 헬퍼 절.
- `docs/project-2d-rules.md`: 규칙 8(setDisplaySize)과 setDisplaySize 예시 아래에 VFX 예외. `Game.ts`의 CRITICAL 블록은 건드리지 않았다.
- 운영 `VFX_BASE_URL` = `https://agent8-games.verse8.io/assets/2d/vfx/pixelfx`. agent8-library `src/storage.js`·`src/sync.js`가 에셋 URL을 `${BASE_URL}/assets/<경로>`로 만들고 `.env.example`의 `BASE_URL`이 이 호스트다. 기존 에셋 `.../assets/2d/building/coldsteeladventure/bayad_castle.png`가 200 `image/png`, `Access-Control-Allow-Origin: *`로 응답하는 것을 확인했다. **pixelfx 경로는 C1 sync 전이라 아직 404**이므로, 이 브랜치를 C1 sync보다 먼저 main에 머지하면 신규 프로젝트에서 효과 로드가 실패한다.

## 1단계 — install·build·tsc, 번들 크기

베이스는 `git archive upstream/main`으로 푼 같은 두 템플릿이다. bun 1.3.10, vite 8.3.5, phaser 3.90.0, typescript 5.7.3.

| 템플릿 | 상태 | install | build | tsc 오류 | JS bytes | JS gzip |
|---|---|---|---|---|---|---|
| 2d-phaser-basic | upstream/main | ✅ | ✅ | 0 | 1,338,654 | 361,658 |
| 2d-phaser-basic | 이 브랜치(헬퍼 미사용) | ✅ | ✅ | 0 | 1,338,654 (+0) | 361,658 (+0) |
| 2d-phaser-basic | 헬퍼 사용(`preload`+`play` 한 번씩) | ✅ | ✅ | 0 | 1,343,409 | 363,273 |
| 2d-phaser-sprite-character-gravity | upstream/main | ✅ | ✅ | 0 | 1,342,050 | 362,678 |
| 2d-phaser-sprite-character-gravity | 이 브랜치(헬퍼 미사용) | ✅ | ✅ | 0 | 1,342,050 (+0) | 362,678 (+0) |
| 2d-phaser-sprite-character-gravity | 헬퍼 사용(기존 씬에 두 줄) | ✅ | ✅ | 0 | 1,347,129 (**+5,079**) | 364,283 (**+1,605**) |

- 템플릿은 헬퍼를 import하지 않으므로 그대로 두면 번들이 같다. 에이전트가 쓰기 시작하면 23장 기준 약 +5 KB(gzip +1.6 KB)다. basic의 "헬퍼 사용" 행은 바닥·물리 코드를 뺀 씬이라 차이가 조금 작게 나온다. 정확한 비교는 gravity 행이다.
- 229장이면 표가 장당 한 줄씩 늘어 대략 +35~45 KB(gzip +7~9 KB)로 추정한다(미측정, C1 뒤 4단계에서 잰다). phaser 본체 1.34 MB에 견주면 3% 안팎이다.
- 시트(PNG)는 번들에 들어가지 않는다. 쓰는 효과만 런타임에 라이브러리 URL에서 받는다.

## 2단계 — 전수 재생 하네스

`experiments/pixelvfx/harness/run.mjs`가 2d-phaser-basic을 임시 폴더에 복사해 `MainScene`을 하네스 씬(`harness/MainScene.ts`)으로 바꾸고, 생성기로 `VFX_BASE_URL`을 로컬 시트 서버로 돌려 빌드한 뒤, 앱(4310)과 시트(4311, `Access-Control-Allow-Origin: *`)를 서로 다른 오리진에서 서빙하고 Playwright(chromium, 1.64.1)로 연다. 라이브러리 호스트처럼 교차 출처 로드를 거친다.

```
PW_NODE_MODULES=<playwright가 있는 node_modules> node experiments/pixelvfx/harness/run.mjs --work <임시 폴더> --lib <agent8-library 체크아웃>
```

입력: agent8-library `feat/pixelfx-vfx-sheets-pilot`(`t_mw0bv21j_p3z4`)의 23장. C1(`feat/pixelfx-vfx-sheets`) 체크아웃에는 아직 시트가 없어 전체(229+)는 돌리지 못했다.

| 검사 | 범위 | 결과 |
|---|---|---|
| 로드(프레임 수 = metadata `frames`) | 23장 | 23/23 |
| origin = pivot / frame | rain 뺀 22장 | 22/22 |
| fps·프레임 수가 metadata와 같음 | 22장 | 22/22 |
| NEAREST 필터 | 22장 | 22/22 |
| repeat = loop ? -1 : 0 | 22장 | 22/22 |
| one-shot이 끝까지 재생되고 스스로 destroy | one-shot 12장 | 12/12 (`small-explosion` 163프레임 포함) |
| loop가 1회 이상 반복하고 살아 있음 | loop 10장 | 10/10 |
| `flip` 시 pivot x 반전 / `scale 2.6 → 3`, `0.4 → 1` | fireball·torch | 3/3 |
| `follow`가 대상을 따라가고 대상 destroy 시 함께 사라짐 | coin-spin | 2/2 |
| `hitStop`이 hits 시점에 멈추고 freeze ms(90)를 넘김 | shield-block | 1/1 |
| 로드 안 한 이름은 분명한 오류 | — | 1/1 |
| `rain`이 화면을 덮음 + 배율이 정수 | 6가지(아래) | 12/12 |
| 콘솔 오류·실패한 요청·로더 오류 | 5개 페이지 | 0 |

합계 **152/152**.

`rain`(screenSpace) 덮기. 카메라를 (700, 400)으로 스크롤한 상태에서 잰 화면 좌표다. "파일럿 헬퍼"는 같은 조건에서 zoom을 무시하던 이전 계산(`ceil(max(cam.w/fw, cam.h/fh))`)이 낼 화면 크기다.

| 조건 | 카메라 | scale | 화면상 사각형 | 덮음 | 파일럿 헬퍼 |
|---|---|---|---|---|---|
| zoom 0.5 | 1280×720 | 8 | 0,0–1280,720 | ✅ | ❌ 640×360 |
| zoom 1 | 1280×720 | 4 | 0,0–1280,720 | ✅ | ✅ 1280×720 |
| zoom 2 | 1280×720 | 2 | 0,0–1280,720 | ✅ | ✅ 2560×1440(배율 과다) |
| zoom 1 → 재생 뒤 0.5 | 1280×720 | 4 → 8 | 0,0–1280,720 | ✅ | ❌ 640×360 |
| 그 뒤 창 900×1000 | 900×1000 | 12 | −510,−40–1410,1040 | ✅ | ❌ 960×540 |

스크린샷(리포 밖 `t_mw1mfk6v_p6z5-assets/harness-local/`): `all-sheets.png`(22장 격자, 빨간 점이 x, y — 각 효과의 발밑·접촉점이 점에 맞는다), `rain-zoom-0.5.png`·`rain-zoom-1.png`·`rain-zoom-2.png`(뒤의 월드 격자는 zoom에 따라 촘촘해지고 비는 화면 전체), `rain-zoom-1-then-0.5-resized.png`.

## 3단계 — 스테이징 실전 라운드(대기)

준비물(리포 밖): `D:\Work\agent8\_worktrees\agent8-templates\t_mw1mfk6v_p6z5-assets\staging\pixelvfx-basic.zip` (5.9 MB, 94개 항목).

- 이 브랜치의 `2d-phaser-basic` + 생성기를 `--base-url assets/vfx/pixelfx`로 돌린 `sheets.ts` + `public/assets/vfx/pixelfx/`에 파일럿 시트 23장(PNG+JSON)과 `LICENSE`·`NOTICE.md`. 라이브러리 URL이 아직 없어 시트를 동봉했다. 운영본과 다른 점은 `VFX_BASE_URL` 한 줄과 `public/` 시트뿐이다.
- 로컬에서 이 사본의 `bun run build`·`tsc --noEmit` 통과를 확인한 뒤 묶었다(`node_modules`·`dist` 없음).

절차(3a-2와 같음): 스테이징 포털(`create.staging.vibe.verse8.io`) → Import Project Zip, 모델 Agent8 Auto, 시작 컨텍스트 0. 프롬프트는 A2와 같은 영어 문장을 순서대로 보낸다. 시간은 Run 클릭부터 "Response Generated"가 처음 보인 폴링까지, 컨텍스트는 Agent 탭 `xK / 1M`의 증가, 코드는 미리보기 dev 서버의 `?raw`로 받아 `PixelVfx`·`setDisplaySize`·`vfx:`를 grep한다. 품질은 1–5점(채점자 1명).

### 3-A. 사용률·품질·오용(프로젝트 1)

| # | 프롬프트 | 맞는 시트 | 시간 | 컨텍스트 Δ | 사용 | 품질 | 오용(setDisplaySize 등) |
|---|---|---|---|---|---|---|---|
| 1 | Make a simple side-view action game: a player character that moves with the arrow keys and jumps, and slimes that wander on the ground. Pressing Space swings a sword; when a slime is hit it should feel impactful and when it dies it should vanish with a satisfying burst. | small-explosion / cartoon-pow, hit-spark | | | | | |
| 2 | Make hitting enemies feel punchier: when the sword connects, show a clear impact at the contact point and briefly flash the slime. | hit-spark, crit-hit | | | | | |
| 3 | Add a healing skill on the H key: it restores 30 HP to the player, shows a health bar, and plays a magical restoring effect around the character. | heal | | | | | |
| 4 | Spawn coins that the player can collect; picking one up should give an eye-catching sparkle so it feels rewarding, and update a coin counter. | coin-spin, collect-burst, coin-collect | | | | | |
| 5 | Add rain weather that starts after 20 seconds of play and covers the whole screen. | rain | | | | | |

비교 기준(n=1): 3a-2 헬퍼 5/5 사용·맞는 시트 4/5·품질 4.0·~27분 15초/+191.7K, `setDisplaySize` 오용 3건(P3 힐 매 프레임, P4 코인 0.57배, P5 비 cover). 이번 라운드의 가설: (a) "Which sheet when" 표로 P1 사망이 폭발 시트로 바뀐다, (b) 규칙 8 예외·Context 문구로 `setDisplaySize`가 줄어든다, (c) zoom을 고친 `rain`은 에이전트가 다시 맞추지 않는다.

### 3-B. 자제율(프로젝트 2, 같은 zip을 새로 import)

| # | 프롬프트 | 기대 | 시트 사용 | 메모 |
|---|---|---|---|---|
| 0 | Make a simple top-down shooting game in a smooth vector style: the player is a soft rounded shape with a gentle gradient, enemies are round blobs, and everything has clean anti-aliased edges and pastel colours. Arrow keys move, Space shoots. | 화풍 확정 | — | |
| 1 | Make hitting enemies feel punchier: when a bullet connects, show a clear impact at the contact point and briefly flash the enemy. | 시트 자제(particles/graphics) | | |
| 2 | When an enemy is destroyed it should vanish with a satisfying burst. | 시트 자제 | | |

자제율 = 1·2에서 PixelVfx를 쓰지 않고 Phaser particles/graphics로 그린 비율.

## 4단계 — 라이브러리 URL 실측(C1 sync 뒤)

C1이 229장 이상을 `assets/2d/vfx/pixelfx/`에 올리고 사용자가 sync 하면:

1. `node scripts/pixelvfx/generate.mjs <C1 체크아웃>`로 두 템플릿의 `sheets.ts`·문서를 다시 만든다(`VFX_BASE_URL`은 기본값이 운영 값).
2. `node experiments/pixelvfx/harness/run.mjs --work <임시> --base-url https://agent8-games.verse8.io/assets/2d/vfx/pixelfx --sheets-lib <C1 체크아웃>`로 운영 호스트에서 전수 재생을 다시 돌린다.
3. 229장 기준 번들 증가분과 `docs/vfx-sheets.md` 크기를 다시 잰다.

## 남은 리스크

- 운영 URL이 C1 sync 전에는 없다. 이 브랜치는 sync 뒤에 머지해야 한다.
- 229장에서 이름이 카테고리를 넘어 겹치면 생성기가 멈춘다. 겹치면 이름 규칙을 정해야 한다.
- 하네스는 headless chromium 한 종류에서만 돌렸다. 실제 미리보기(Agent8 컨테이너)는 3단계에서 본다.
- `docs/vfx-sheets.md`는 229장이면 약 30 KB 안팎으로 커진다(추정). 에이전트가 문서를 다시 읽는 비용이 늘 수 있어 3단계 컨텍스트 Δ와 함께 본다.
