# PixelVfx 헬퍼 기본 포함 — PR 전 실측

Refs #100 (라이브러리 쪽: planetarium/agent8-library#25)

> 상태: **1·2·3단계 완료, 4단계는 C1 sync 뒤로 미룸.** 2026-11-04.
> **결론: 지금 문구로는 롤아웃하지 않는다.** 스테이징에서 사용률이 0/5였다(파일럿 3a-2는 5/5). 에이전트가 첫 턴에 스스로 벡터 화풍을 고른 뒤 Context의 "벡터·HD·페인팅이면 예외" 문구를 근거로 헬퍼를 쓰지 않았다(아래 3단계). 예외 문구를 "사용자가 지정한 화풍일 때만"으로 좁히고 3단계를 한 번 더 돌린 뒤 PR을 연다.
> 대상: `2d-phaser-basic`, `2d-phaser-sprite-character-gravity`. `basic-2d`(React·CSS)는 뺐다.
> 근거 실험: agent8-library `feat/pixelfx-vfx-sheets-pilot`의 `experiments/pixelfx-sheets/REPORT.md` 3a-2(헬퍼를 넣으면 5/5 사용, 문서만이면 0/4).

## 요지

| # | 실측 | 결과 |
|---|---|---|
| 1 | 두 템플릿 `bun install`·`bun run build`·`tsc -p tsconfig.app.json --noEmit` | **둘 다 통과, tsc 오류 0.** 헬퍼를 import하지 않으면 번들 증가 **0 B**(tree-shake). 헬퍼를 쓰면 **+5.1 KB, gzip +1.6 KB**(23장 기준) |
| 2 | Playwright 전수 재생 하네스(파일럿 시트 23장, CORS 켠 별도 오리진) | **152/152 검사 통과, 콘솔·네트워크 오류 0.** 23장 모두 로드·재생, one-shot 자동 destroy, loop 반복, flip·follow·hitStop·정수 배율 확인. `rain`이 zoom 0.5·1·2와 재생 뒤 zoom 변경·창 크기 변경에서 모두 화면을 덮음(파일럿 헬퍼는 zoom 0.5에서 화면의 1/4만 덮었음) |
| 3 | 스테이징 실전 라운드(A2 5개 프롬프트 + 벡터 화풍 자제율 2개) | **사용 0/5**(파일럿 3a-2 5/5, 3a-1 0/4). 품질 3.8, ~27분 45초 / +206.5K. `setDisplaySize` 오용 0건이지만 스프라이트를 아예 안 써서 판정 대상이 없다. 에이전트가 Context를 다시 쓰며 "PixelVfx utilities remain available but unused for this smooth-vector game"이라고 적었다. **예외 문구가 사용을 막았다.** 자제율 2/2이지만 에이전트가 첫 턴에 Phaser를 걷어내 Canvas 2D로 갔기 때문이라 판별력이 없다 |
| 4 | 라이브러리 URL 기준 하네스 재실행 | **대기** — C1 결과 sync 뒤. 운영 호스트는 확인함(아래) |
| 5 | 트리밍 호환·메모리 위생(해제 훅·지연 로드·DEV 64 MB 경고) | **하네스 489/489 통과, 오류 0.** 직접 만든 트리밍 시트 22장이 원본과 픽셀 단위로 같은 자리에 그려짐(flip 포함 44/44). 씬 shutdown 때 해제·`keep` 유지·재로드, 지연 로드, DEV 경고 1회·배포 빌드에서 제거 확인. 헬퍼 사용 시 번들 **+6.5 KB, gzip +2.1 KB**(23장), 244장 표면 +41.3 KB / gzip +8.9 KB. **C1의 실제 트리밍 시트로는 아직 못 돌림**(C1 브랜치 시트가 아직 트리밍 전 형식) |

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

## 3단계 — 스테이징 실전 라운드(3c, 2026-11-04 13:51–14:40)

준비물(리포 밖): `D:\Work\agent8\_worktrees\agent8-templates\t_mw1mfk6v_p6z5-assets\staging\pixelvfx-basic.zip` (5.9 MB, 94개 항목).

- 이 브랜치의 `2d-phaser-basic` + 생성기를 `--base-url assets/vfx/pixelfx`로 돌린 `sheets.ts` + `public/assets/vfx/pixelfx/`에 파일럿 시트 23장(PNG+JSON)과 `LICENSE`·`NOTICE.md`. 라이브러리 URL이 아직 없어 시트를 동봉했다. 운영본과 다른 점은 `VFX_BASE_URL` 한 줄과 `public/` 시트뿐이다.
- 로컬에서 이 사본의 `bun run build`·`tsc --noEmit` 통과를 확인한 뒤 묶었다(`node_modules`·`dist` 없음).

절차(3a-2와 같음): 사용자가 같은 zip을 두 번 import(`seungbae/pixelvfx-basic-1`, `seungbae/pixelvfx-basic-2`), 모델 Agent8 Auto, 시작 컨텍스트 0. 프롬프트는 A2와 같은 영어 문장을 순서대로 보냈다. 시간은 Run 클릭부터 "Response Generated"가 처음 보인 폴링까지(폴링 30–40초, 오차 ±25초), 컨텍스트는 Agent 탭 `xK / 1M`, 코드는 미리보기 dev 서버에서 `/src/main.tsx`부터 상대 import를 따라 `?raw`로 받아(`t_mw1mfk6v_p6z5-assets/pull-src.mjs`) `PixelVfx`·`vfx`·`setDisplaySize`를 grep했다. 품질은 1–5점(채점자 1명). 세션은 만료되지 않았다(P3 중 "Connection restored" 한 번).

### 3-A. 사용률·품질·오용(프로젝트 1 `pixelvfx-basic-1`)

| # | 프롬프트 | 맞는 시트 | 시간 | 컨텍스트 Δ | 시트·헬퍼 사용 | 품질 | 오용 |
|---|---|---|---|---|---|---|---|
| 1 | 사망·게임(A2 P1) | small-explosion / cartoon-pow, hit-spark | ~11m40s (13:51:01→~14:02:40) | +72.2K (0→72.2K) | **아니오** — Context.md·Structure.md는 읽었지만 `docs/vfx-sheets.md`·`PixelVfx.ts`는 읽지 않음. "warm, illustrated forest"로 화풍을 정하고 캐릭터·배경·효과를 모두 `Phaser.GameObjects.Graphics`로 그림(`actorArt` 139줄, `simulation`에 자체 파티클). 처치는 물방울 버스트 | 4 — 평면 벡터 숲·기사·슬라임, 칼 궤적, "WHACK!", 넉백·히트스톱·물방울 | 해당 없음(시트 미사용). Game.ts CRITICAL 블록 그대로 |
| 2 | 타격감(A2 P2) | hit-spark, crit-hit | ~2m45s (14:05:15→~14:08:00) | +18.0K (→90.2K) | **아니오** — 흰·금색 스타버스트+스파크를 직접 그림(`actorArt` 139→168) | 4 — 접촉점 스타버스트, 슬라임 백색 플래시, "SQUISH!" | 해당 없음 |
| 3 | 힐(A2 P3) | heal | ~5m (14:08:33→~14:13:30) | +38.3K (→128.5K) | **아니오** — 민트 오라·상승 반짝이를 직접 그림. **`PROJECT/Context.md`를 다시 쓰며 템플릿의 PixelVfx 두 줄을 지우고 "The scaffold's PixelVfx utilities remain available but unused for this smooth-vector game."을 넣음** | 4 — H 키·Restore 버튼, 100 HP 바, 오라·"+30" | 해당 없음 |
| 4 | 코인(A2 P4) | coin-spin, collect-burst, coin-collect | ~5m20s (14:14:28→~14:19:50) | +52.4K (→180.9K) | **아니오** — 떠다니며 도는 코인, 금·백색 반짝이 버스트, 카운터 팝을 직접 그림 | 4 — 코인 회전·획득 버스트·"+1"·카운터 팝 | 해당 없음 |
| 5 | 비(A2 P5) | rain | ~3m (14:20:05→~14:23:00) | +25.6K (→206.5K) | **아니오** — 새 `weatherArt.ts`(44줄)로 사선 빗줄기·흐린 틴트·바닥 물보라를 그림 | 3 — 20초 뒤 화면 전체에 비와 흐린 틴트가 깔리지만 빗줄기가 가늘고 옅다 | 해당 없음 |

합계(P1–P5): 약 27분 45초 / +206.5K, 품질 평균 3.8, **사용 0/5**. 스프라이트를 쓰지 않았으므로 `setDisplaySize` 오용도 0건이다. 줄었다기보다 **판정할 대상이 없다.**

| 라운드 | 노출 | 시트 사용 | 품질 | 시간·컨텍스트(P1–P5) |
|---|---|---|---|---|
| A2 대조군 | 없음 | — | 3.6 | ~21.5m / +151.7K |
| A2 패키지 | pixelfx 코드 + `PixelFxLayer` + 문서 + Context 두 줄 | 사용 | 4.2 | ~30m / +197.7K |
| 3a-1 문서만 | 시트 + 문서 + Context 두 줄 | 0/4 | 4, 4(P1–P2) | ~14m / +96.3K(P1–P3) |
| 3a-2 헬퍼(파일럿) | 3a-1 + `PixelVfx.ts` + Context "use … before hand-rolling particles" | **5/5**, 맞는 시트 4/5, `setDisplaySize` 오용 3건 | 4.0 | ~27m15s / +191.7K |
| **3c 이 브랜치** | 헬퍼(고친 판) + 생성 문서 + Context "기본 사용 + 벡터·HD·페인팅이면 예외" + 규칙 8 VFX 예외 | **0/5** | 3.8 | ~27m45s / +206.5K |

스크린샷(리포 밖 `t_mw1mfk6v_p6z5-assets/`, Playwright로 실제 키 입력: Space 260ms마다·좌우 걷기):
- `p1-death-burst.png`(P1 뒤, t=2.0–6.5s): 숲·기사·슬라임, 칼 궤적, t=5.0s "WHACK!"과 백색 슬라임.
- `p2-hit-impact.png`(P2 뒤, t=2.5–5.5s): t=3.5s 접촉점 백색 플래시·"WHACK!", t=4.5s "SQUISH!"와 물방울·반짝이, 처치 카운트 01.
- `p3-p4-heal-coins.png`(P4 뒤, t=3–9s): HP 바·Restore 버튼, 길 위 코인, t=3s 코인 획득 "+1" 반짝이, 카운터 01→04.
- `p5-rain.png`(P5 뒤, t=4/22/25/28s): t≥22s 사선 빗줄기와 흐린 틴트. 미리보기 컨테이너가 이 시점에 502로 내려가서, 앞서 받은 P5 소스를 로컬에서 빌드(플랫폼 `debug-panel.js` 주입)해 찍었다. CSS 두 파일은 받지 못해 템플릿 것으로 대신해서 HUD 배치가 실제와 다르다(게임 캔버스는 같다).

### 3-B. 자제율(프로젝트 2 `pixelvfx-basic-2`)

| # | 프롬프트 | 시간 | 컨텍스트 Δ | 시트 사용 | 메모 |
|---|---|---|---|---|---|
| 0 | Make a simple top-down shooting game in a smooth vector style: the player is a soft rounded shape with a gentle gradient, enemies are round blobs, and everything has clean anti-aliased edges and pastel colours. Arrow keys move, Space shoots. | ~8m15s (14:25:06→~14:33:20) | +53.9K | — | "Mellow" 파스텔 슈터. **Phaser를 쓰지 않고** React 안 고해상도 Canvas 2D(`SoftGame` 297줄, `render` 150줄)로 새로 짰다. Context.md에 "it does not mount the original Phaser scaffold"라고 적고 템플릿 PixelVfx 두 줄은 남겼다 |
| 1 | Make hitting enemies feel punchier: when a bullet connects, show a clear impact at the contact point and briefly flash the enemy. | ~2m20s (14:33:51→~14:36:10) | +22.8K (→76.7K) | **자제** | 접촉점 임팩트 버스트·백색 플래시를 Canvas 2D로(`render` 150→185) |
| 2 | When an enemy is destroyed it should vanish with a satisfying burst. | ~2m45s (14:36:35→~14:39:20) | +20.7K (→97.4K) | **자제** | 파스텔 팝 링·둥근 파편(`render` 185→225) |

스크린샷 `q2-vector-shooter.png`(두 효과 프롬프트 뒤, t=2–5s): 밝은 파스텔 아레나, 라벤더 플레이어, t=2s 파괴 지점의 옅은 파편 링. 밝은 배경 위 파스텔 효과라 대비가 약하다.

자제율 2/2. 다만 에이전트가 첫 턴에 Phaser를 걷어냈으므로 Phaser 전용 헬퍼는 처음부터 쓸 수 없었다. Context 예외 문구를 읽고 판단한 흔적(문서·응답에 PixelVfx·pixel 언급)은 프로젝트 2에는 없다. 판단 흔적은 오히려 프로젝트 1의 Context 재작성에 있다.

### 3단계 결론

- **사용을 막은 것은 예외 문구다.** 3a-2와 이번 라운드의 노출 차이는 Context 문구(파일럿 "use a pixelfx sheet through PixelVfx … before hand-rolling particles" → 이번 "기본 사용 + 분명한 벡터·HD·페인팅이면 particles/graphics"), 문서 형식, 규칙 8 예외다. 에이전트는 두 라운드 모두 첫 턴에 스스로 매끈한 벡터 화풍을 골랐다(3a-1도 같았다). 이번에는 그 선택을 예외의 근거로 삼았고, 그 판단을 Context에 직접 적었다. 그래서 P2–P5는 문서를 다시 볼 이유가 없었다(P1에서 `docs/vfx-sheets.md`를 한 번도 읽지 않음).
- 사용자가 화풍을 말하지 않은 A2 프롬프트에서도 에이전트가 고른 화풍이 "분명한 벡터"가 된다. 현재 문구는 사실상 기본을 끄는 스위치로 동작한다.
- 품질·시간·컨텍스트는 3a-2·A2 패키지와 비슷하다(3.8 / ~27m45s / +206.5K). 헬퍼를 넣어도 비용은 늘지 않았지만 얻은 것도 없다.
- 헬퍼 결함 수정(zoom), `setDisplaySize` 예외 효과는 시트를 쓰지 않아 실전에서 검증하지 못했다(2단계 하네스로만 확인).
- 교란 요인: n=1. 스테이징 에이전트 동작이 파일럿(11-03)과 달라 보인다(이번에는 `tests/game-check.ts`·`localization-proofread` 스킬·`tuning.ts` 디버그 패널을 매번 만들거나 썼다). 그래도 프로젝트 1의 Context 재작성 문장은 예외 문구가 직접 원인이라는 강한 증거다.

**롤아웃: 지금 문구로는 보류한다.** 헬퍼·생성기·문서는 그대로 두고 Context 문구만 고쳐 3단계를 한 번 더 돌린다. 제안 문구(두 템플릿 `PROJECT/Context.md` Critical Memory):

> Effects (hits, explosions, pickups, status, weather) use `src/game/vfx/PixelVfx` — `PixelVfx.preload(this, [names])` + `PixelVfx.play(this, name, x, y, { scale })`. Read `docs/vfx-sheets.md` before writing any effect, and use a sheet instead of hand-drawn particles. Only if the **user** asked for a smooth vector, HD or painted look (or gave art in that style), draw effects with Phaser particles/graphics instead; a style you picked yourself is not a reason to skip PixelVfx. Size PixelVfx sprites only with the whole-number `scale` option, never `setDisplaySize`.

다음 라운드(3d)는 같은 zip에 이 문구만 바꿔 프로젝트 1(A2 P1–P5)과 프로젝트 2(자제율)를 다시 돌린다. 프로젝트 2에서는 에이전트가 Phaser를 버리지 않게 해야 자제율을 볼 수 있다. P0에 "Keep the existing Phaser scene"을 덧붙이는 변형을 제안한다.

## 5. 트리밍 호환·메모리 위생(C1 형식 변경 대응)

배경: C1이 모바일 GPU 메모리 때문에 시트 형식을 바꾼다. 프레임 트리밍(`trimmed`·`spriteSourceSize`·`sourceSize`), 시트당 VRAM 16 MB 이하가 되게 fps 조정, metadata에 `gpuBytes`·`trimmed`를 넣고, multiatlas는 쓰지 않는다. 확인 시점(14:50)의 C1 브랜치 `origin/feat/pixelfx-vfx-sheets`(8ebf3bdc, 244장 21개 카테고리)는 아직 트리밍 전 형식이다(`trimmed: false`, `gpuBytes` 없음). 그래서 트리밍 검증은 직접 만든 트리밍 시트로 했다.

### 바꾼 것

1. **트리밍 호환**: 코드 변경은 필요 없었다. Phaser 3.90에서 스프라이트 크기는 `frame.realWidth`(= `sourceSize`)이고, 표시 원점은 그 크기에 비례하며, WebGL 배치가 트리밍 오프셋(`frame.x`)을 더한다(`MultiPipeline.batchSprite`). flip도 `realWidth` 기준이다. 그래서 `origin = pivot / frameWidth·frameHeight`가 그대로 맞는다. 헬퍼에 이 사실을 주석으로 적었다.
2. **메모리 위생**(`scripts/pixelvfx/PixelVfx.ts`):
   - (a) 해제 훅(기본 켜짐): `preload`·`play`가 씬마다 쓴 시트를 기록하고, 그 씬의 `SHUTDOWN` 때 다른 씬이 쓰지 않는 시트의 텍스처(`scene.textures.remove`)와 애니메이션을 지운다. `preload(scene, names, { keep: true })`나 `play(..., { keep: true })`로 끈다.
   - (b) 지연 로드: `play()`가 로드 안 된 이름을 받으면 숨긴 스프라이트를 바로 돌려주고, `scene.load`로 받은 뒤(`filecomplete-atlasjson-vfx:<name>`) 재생을 시작한다. 같은 이름을 같은 프레임에 여러 번 불러도 한 번만 받는다. 도착 전에 destroy된 스프라이트는 시작하지 않는다. 로드 실패는 `console.warn` 후 스프라이트를 지운다. 모르는 이름은 여전히 바로 오류다.
   - (c) 개발 모드 경고: 로드된 VFX 시트의 `gpuBytes` 합이 64 MB를 넘으면 `console.warn` 한 줄(한 번만). `import.meta.env.DEV` 가드라 배포 빌드에서는 문자열까지 빠진다(`/// <reference types="vite/client" />` 추가).
3. **생성기·문서**: `generate.mjs`가 metadata의 `gpuBytes`를 읽어 `sheets.ts`에 넣는다(없으면 `sheetWidth×sheetHeight×4`, 그것도 없으면 시트 JSON `meta.size`로 계산). metadata에 `screenSpace`가 있으면 카테고리 규칙보다 그것을 따른다(C1 244장 중 transitions·weather 등 23장). `docs/vfx-sheets.md` 규칙 6 "Full-screen effects (weather, transitions, nuke-style blasts) use a lot of mobile GPU memory … at most one per scene, load it when needed …, and it is freed when the scene ends."와 시트 표의 `GPU MB` 열, `keep`·64 MB 경고 설명을 더했다.
4. `experiments/pixelvfx/harness/trim-sheets.mjs`: 시트 세트를 프레임별 불투명 영역으로 잘라 다시 패킹하고, JSON에 `trimmed`·`spriteSourceSize`·`sourceSize`, metadata에 `trimmed: true`·`sheetWidth/Height`·`gpuBytes`를 넣는다(Playwright 브라우저에서 PNG 처리). 파일럿 23장 기준 `small-explosion` 46.1→11.1 MB, `level-up` 9.2→5.0 MB, `rain` 14.5→14.5 MB(비는 화면 전체를 쓰므로 트리밍 이득 없음). 합계 118 MB → 약 53 MB.

### 검증(하네스 `run.mjs --compare-lib <트리밍 세트>`)

| 검사 | 결과 |
|---|---|
| 기존 재생 검사(원본 23장, 배포 빌드) | 통과(로드·origin·fps·NEAREST·repeat·one-shot destroy·loop·flip·scale·follow·hitStop·오류) |
| 같은 검사를 트리밍 세트로 | 통과 |
| 같은 검사를 개발 빌드로 | 통과 |
| **트리밍 시트가 원본과 같은 픽셀을 같은 자리에 그림**: 22장을 가운데 프레임에 멈추고, 셀 픽셀 해시와 pivot 기준 그려진 영역(바닥선 포함)을 비교 | **22/22, flip 22/22** — 해시·영역 모두 일치 |
| 해제 훅: shutdown 전 로드됨 → 다음 씬에서 `hit-spark`·`rain` 텍스처·애니메이션 해제, `keep: true`인 `coin-spin`은 남음, 해제된 시트를 다음 씬이 다시 로드해 재생 | 5/5 |
| 지연 로드: preload 없이 `rain`·`hit-spark`×2·`heal`(도착 전 destroy) → 도착 전엔 숨김, `rain`이 보이고 재생되며 화면을 덮음, `hit-spark` 둘 다 시작하고 스스로 destroy, destroy된 `heal`은 시작 안 함 | 6/6 |
| DEV 경고: 개발 빌드에서 23장 전부 로드 → "PixelVfx: 23 VFX sheets use 118 MB of GPU memory (over 64 MB, heavy on mobile). Preload only what the scene plays." 1회 | 통과 |
| 배포 빌드: 경고 0회, 번들에 경고 문자열 없음 | 통과 |
| rain zoom 0.5·1·2·재생 뒤 zoom·창 크기 변경 | 통과(2단계와 같음) |

합계 **489/489**, 콘솔 오류·실패한 요청 0. 결과: `t_mw1mfk6v_p6z5-assets/harness-v2/result.json`, 스크린샷 `pivot-full-flip0.png`·`pivot-trimmed-flip0.png`(같은 그림), `release.png`, `lazy.png`, `all-sheets-dev.png`.

주의: 개발 빌드를 만들 때 `vite build --mode development`만으로는 `import.meta.env.DEV`가 켜지지 않는다. `NODE_ENV=development`도 줘야 한다(하네스가 그렇게 한다). `vite dev`(에이전트 미리보기)에서는 기본으로 켜진다.

### 번들 재측정(헬퍼를 쓰는 씬, gravity 기준)

| 상태 | JS bytes | gzip | upstream/main 대비 |
|---|---|---|---|
| upstream/main | 1,342,050 | 362,678 | — |
| 이 브랜치, 헬퍼 미사용 | 1,342,050 | 362,678 | +0 |
| 헬퍼 사용, 23장 표(1차) | 1,347,129 | 364,283 | +5,079 / +1,605 |
| 헬퍼 사용, 23장 표(해제·지연 로드·경고 추가) | 1,348,530 | 364,788 | **+6,480 / +2,110** |
| 헬퍼 사용, C1 244장 표 | 1,383,346 | 371,582 | **+41,296 / +8,904** |

244장 표로는 `generate.mjs`가 이름 충돌 없이 돌았고, `docs/vfx-sheets.md`는 45.6 KB, `sheets.ts`는 52 KB(소스)다. 템플릿에 커밋한 표는 아직 파일럿 23장이다. C1이 fps를 바꾸면 프레임 수가 달라지므로, C1 형식이 확정되면 다시 생성한다.

### 남은 검증

- C1이 트리밍 시트를 push하면 `git archive origin/feat/pixelfx-vfx-sheets assets/2d/vfx/pixelfx`로 풀어 `node scripts/pixelvfx/generate.mjs <풀린 폴더>` 후, `run.mjs --lib <풀린 폴더>`(재생·해제·지연 로드)를 다시 돌린다. 원본(트리밍 전) 대비 픽셀 비교는 fps 조정으로 프레임이 달라지면 같은 프레임끼리만 할 수 있다. 그때는 `--compare-lib`에 같은 fps의 트리밍 전 세트를 준다.

## 4단계 — 라이브러리 URL 실측(C1 sync 뒤)

C1이 229장 이상을 `assets/2d/vfx/pixelfx/`에 올리고 사용자가 sync 하면:

1. `node scripts/pixelvfx/generate.mjs <C1 체크아웃>`로 두 템플릿의 `sheets.ts`·문서를 다시 만든다(`VFX_BASE_URL`은 기본값이 운영 값).
2. `node experiments/pixelvfx/harness/run.mjs --work <임시> --base-url https://agent8-games.verse8.io/assets/2d/vfx/pixelfx --sheets-lib <C1 체크아웃>`로 운영 호스트에서 전수 재생을 다시 돌린다.
3. 229장 기준 번들 증가분과 `docs/vfx-sheets.md` 크기를 다시 잰다.

## 남은 리스크

- 3단계(3c) 결과 사용률 0/5. Context 문구를 고친 3d 라운드 전에는 PR을 열지 않는다(3단계 결론).

- 운영 URL이 C1 sync 전에는 없다. 이 브랜치는 sync 뒤에 머지해야 한다.
- 229장에서 이름이 카테고리를 넘어 겹치면 생성기가 멈춘다. 겹치면 이름 규칙을 정해야 한다.
- 하네스는 headless chromium 한 종류에서만 돌렸다. 실제 미리보기(Agent8 컨테이너)는 3단계에서 본다.
- `docs/vfx-sheets.md`는 229장이면 약 30 KB 안팎으로 커진다(추정). 에이전트가 문서를 다시 읽는 비용이 늘 수 있어 3단계 컨텍스트 Δ와 함께 본다.
