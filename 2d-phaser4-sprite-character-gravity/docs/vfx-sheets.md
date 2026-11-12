# Pixel art VFX (PixelVfx)

Read this before writing any effect.

```ts
import { PixelVfx } from '../vfx/PixelVfx';                       // in src/game/scenes/*.ts
PixelVfx.preload(this, ['hit-spark', 'small-explosion']);          // in preload(): only the effects this scene plays
PixelVfx.play(this, 'hit-spark', enemy.x, enemy.y, { scale: 2 });  // anywhere after: plays standing at x, y
```

`src/game/vfx/PixelVfx.ts` plays 244 pre-rendered pixel art effect sheets (pixelfx, MIT) from the Agent8 asset
library: origin at the sheet's pivot, right fps, loop or one-shot, crisp pixels, cleanup. `play()` returns the sprite:
**one-shots destroy themselves**, **loops** run until you call `sprite.destroy()` (keep the returned sprite).

## What is a sheet, what is code

- **World effects → PixelVfx**: hits, explosions, deaths, pickups, heals and buffs, status, projectiles, weather.
- **UI feedback and screen effects → code** (tweens, graphics, camera effects): tap glows, ripples, scale bounces,
  floating number text, vignettes, screen flashes, camera shake. Do not force a sheet onto UI.
- They usually go together: a hit = `hit-spark` sheet + hit stop + camera shake + flash; a pickup = `collect-burst`
  sheet + floating "+1" text + counter bounce. Do not hand-draw the world part either.
- Skip the sheets only if the **user** asked for a smooth vector, realistic/HD or painted look (or gave art in that
  style), or asked you to draw the effects yourself / leave them out. A style you picked yourself is not a reason.

## Which sheet when

| The user asks for | Sheets | Add in code |
|---|---|---|
| “punchy”, “impactful”, “satisfying hit”, a sword or punch lands | `hit-spark`, `crit-hit` | `hitStop` is only for sheets with impact frames (`hit-flash`, `heavy-landing`, `shield-block`, `level-up`); for `hit-spark`/`crit-hit` do a 60–90 ms hit stop in game code + camera shake + white flash |
| A bullet or arrow hits | `bullet-impact` | camera shake |
| Enemy dies, “pop”, “burst”, “vanish” | `cartoon-pow`, `small-explosion`, `poof` | `plasma-explosion` for energy/sci-fi; camera shake |
| Block, parry | `shield-block` |  |
| Pick up, “collect”, “sparkle”, “rewarding” | `collect-burst` | floating “+1” text and a HUD counter bounce |
| Coin, gem or heart lying in the world | `coin-spin`, `gem-spin`, `heart-pickup` | loops; destroy on pickup |
| Coin flies into a HUD counter | `coin-collect` |  |
| Heal, “restore”, “magical” buff | `heal` | `follow` the character; HP bar tween |
| Level up, combo | `level-up`, `combo-counter` | screen flash |
| Stunned, poisoned | `stunned`, `poisoned` | loops; `follow` the character |
| Fireball, projectile in flight | `fireball` | loops; `flip` when moving left |
| Torch, campfire | `torch`, `campfire` | loops |
| Rain, snow, “weather” | `rain`, `snow`, `rain-splash`, `ripples` | rain/snow are full-screen (no x, y); `rain-splash`/`ripples` on the ground |
| Sound effects | — | not a sheet: use the project's audio tools and sfx path |

## Rules

1. Size an effect only with the `scale` option. It is a whole number (1, 2, 3); the pixels stay crisp.
2. Never call `setDisplaySize` / `displayWidth` / `displayHeight` on a PixelVfx sprite. The template's setDisplaySize
   rule does not apply to effects; resizing to a pixel size blurs them and breaks the pivot.
3. `x, y` is where the effect stands: the feet of a character, the bottom of a blast, the contact point of a hit.
4. Glow is baked into alpha, so effects read best over darker backgrounds; over very light ones they look faint.
5. Sheets with impact frames (`hits` in `sheets.ts`) can hit-stop: `{ hitStop: true }` pauses the effect on them,
   `{ hitStop: (ms) => … }` also lets you freeze your game for that long. Sheets with impact frames: `arcane-beam`, `arcane-missiles`, `blink-in`, `fire-ring`, `freeze`, `frost-nova`, `heavy-landing`, `hit-flash`, `shield-block`, `chain-lightning`, `charge-up`, `thunderclap`, `claw-swipe`, `dagger-flurry`, `double-slash`, `hammer-smash`, `heavy-cleave`, `scythe-reap`, `spear-sweep`, `spin-slash`, `sword-slash`, `thrust`, `uppercut`, `whip-crack`, `arrow-shot`, `dash-strike`, `earth-stomp`, `fireball-throw`, `ground-pound`, `holy-smite`, `ice-lance-throw`, `lightning-call`, `meteor-call`, `pistol-shots`, `rocket-launcher`, `sword-combo`, `root-snare`, `force-field`, `curse`, `life-steal`, `shatter-death`, `petrified`, `level-up`.
   On any other sheet `hitStop` does nothing (a development warning says so): do the hit stop in game code.
6. Full-screen effects (weather, transitions, nuke-style blasts) use a lot of mobile GPU memory (GPU MB below): at most
   one per scene, load it when needed (`play()` loads a sheet that was not preloaded), and it is freed when the scene ends.
7. Never tween a PixelVfx sprite's `scale`/`scaleX`/`scaleY` (Game.ts converts scale tweens to displayWidth, so scale 2 →
   tween 3 becomes 6×); for a size pop tween `displayWidth` to `frameWidth * k` and `displayHeight` to `frameHeight * k`.
8. PixelVfx sheets load from `VFX_BASE_URL` in `sheets.ts` and are the platform's own assets — they are the one exception
   to "declare every URL in src/assets.json".

Options: `scale`, `depth` (default 1000), `flip` (directional effects face right; flip when facing left),
`follow` (an object; `x, y` become offsets from it, and the effect goes when the object is destroyed), `repeat`
(override loop/one-shot; any finite repeat also removes the effect when it ends), `hitStop`, `keep`. Full-screen sheets (`rain`) ignore x, y and cover the camera at any zoom.
Sheets are freed when the scene that loaded them shuts down; pass `{ keep: true }` to `preload`/`play` to keep them.
In development a console warning appears when the loaded sheets pass 64 MB of GPU memory.

## Sheets by category (244)

Size is one frame in px; pivot is the anchor point inside it; GPU MB is the memory the loaded sheet takes.

### arcane

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `arcane-beam` | sustained magic laser beam a mage channels from the hand toward enemies, looping while the spell is held. | 264x100 | 36, loop | 26, 84 | 2.7 |
| `arcane-missiles` | mage spell attack firing a volley of homing magic projectiles from the hand that hit one target. | 240x116 | 54, one-shot | 26, 88 | 2.7 |
| `arcane-orb` | floating magic orb prop or collectible, a looping glowing sphere for a shrine, puzzle or boss weapon. | 136x112 | 72, loop | 68, 104 | 3.2 |
| `blink-in` | player or mage teleport arrival, the moment a character reappears after a blink or short-range teleport. | 136x96 | 43, one-shot | 68, 80 | 0.7 |
| `blink-out` | player or mage teleport departure, the moment a character vanishes when starting a blink or short-range teleport. | 136x96 | 49, one-shot | 68, 80 | 1.0 |
| `magic-circle-cast` | big summoning or ritual spell cast on the ground, a magic circle that fires a column of light. | 200x220 | 118, one-shot | 100, 192 | 7.3 |
| `mana-burst` | magic nova burst exploding outward from a point, a one-shot arcane area blast or spell release. | 208x150 | 55, one-shot | 104, 124 | 2.7 |
| `portal` | looping standing portal or rift prop for a level exit, warp gate or enemy spawn point. | 152x116 | 72, loop | 76, 106 | 4.7 |
| `rune-circle` | looping glowing rune circle on the floor for a save point, altar, trap zone or spell area. | 136x100 | 120, loop | 68, 80 | 4.9 |
| `spell-charge` | looping charge-up glow in the caster's hand while a spell is being held before firing. | 120x86 | 48, loop | 44, 80 | 1.3 |
| `star-fall` | area-of-effect spell raining falling stars onto a zone of enemies, a one-shot ultimate attack. | 232x172 | 76, one-shot | 124, 150 | 5.2 |
| `time-stop` | time stop or freeze-time ability activation, a clock that freezes then shatters, one-shot spell moment. | 196x136 | 109, one-shot | 98, 118 | 4.8 |

### critters

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `bat` | flying bat enemy or ambient night critter for caves, castles and haunted levels, looping flight. | 112x80 | 72, loop | 56, 40 | 1.2 |
| `bird` | flying bird ambient critter or simple enemy hovering in the sky, looping wing-flap animation. | 112x80 | 72, loop | 56, 40 | 0.3 |
| `butterfly` | ambient glowing butterfly fluttering in gardens, forests and fairy levels, looping decorative critter. | 128x88 | 96, loop | 64, 44 | 2.1 |
| `eyeball` | floating eyeball monster enemy for horror or dungeon levels, looping idle hover with blinking. | 96x108 | 96, loop | 48, 100 | 2.9 |
| `fish-school` | ambient school of fish swimming underwater for ocean, aquarium or sea levels, looping background life. | 136x80 | 144, loop | 68, 40 | 5.3 |
| `flying-skull` | flaming flying skull enemy for undead dungeons or hell levels, looping hover animation. | 96x132 | 72, loop | 48, 120 | 3.3 |
| `frog` | ambient frog critter hopping and catching flies in swamp or pond levels, looping idle animation. | 112x88 | 78, loop | 56, 80 | 0.5 |
| `ghost` | cute floating ghost enemy or haunted-house critter, looping bobbing idle animation. | 96x100 | 72, loop | 48, 90 | 2.1 |
| `jellyfish` | glowing jellyfish enemy or ambient sea creature for underwater levels, looping swim animation. | 96x120 | 96, loop | 48, 38 | 2.9 |
| `slime` | slime monster enemy hopping in place, the classic RPG or platformer blob enemy idle loop. | 112x88 | 54, loop | 56, 72 | 1.8 |
| `snake` | snake enemy or ambient reptile slithering on the ground in desert, jungle or dungeon levels, looping. | 136x56 | 72, loop | 68, 48 | 0.4 |
| `wisp` | will-o'-the-wisp spirit enemy or guide fairy floating in a loop over the ground. | 128x104 | 96, loop | 64, 96 | 2.7 |

### explosions

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `barrel-explosion` | exploding barrel destroyed by the player, a one-shot fiery blast with flying barrel debris. | 300x240 | 79, one-shot | 150, 204 | 8.1 |
| `big-explosion` | huge one-shot explosion for a boss death, bomb or building blowing up, with a mushroom smoke column. | 360x300 | 73, one-shot | 180, 262 | 13.7 |
| `cartoon-pow` | short comic hit or enemy death burst with POW text: cartoon punch, big impact or enemy killed in a brawler. | 184x144 | 33, one-shot | 92, 72 | 1.5 |
| `dirt-explosion` | landmine or buried bomb explosion throwing dirt and dust, an earth blast leaving a crater. | 260x240 | 109, one-shot | 130, 206 | 10.8 |
| `firework-burst` | firework celebration burst in the sky for a win screen, level clear or festival scene. | 240x248 | 109, one-shot | 120, 100 | 9.2 |
| `firework-rocket` | firework rocket launching from the ground and bursting into gold for a victory or celebration. | 300x300 | 115, one-shot | 150, 288 | 11.5 |
| `grenade` | thrown grenade that bounces, fizzes and explodes, a one-shot shooter weapon blast with shrapnel. | 300x200 | 127, one-shot | 160, 170 | 5.3 |
| `implosion` | implosion collapsing inward then popping, for a vortex bomb, magic enemy death or energy collapse. | 208x184 | 51, one-shot | 104, 92 | 3.4 |
| `nuke` | nuclear bomb mushroom cloud, the biggest one-shot explosion for a superweapon or game-over ending. | 400x320 | 91, one-shot | 200, 284 | 20.7 |
| `plasma-explosion` | sci-fi energy explosion with no smoke, plasma bomb, robot or drone death blast. | 224x200 | 52, one-shot | 112, 100 | 3.2 |
| `small-explosion` | enemy death burst, the standard explosion when an enemy or monster is killed, defeated or destroyed, bomb or barrel blast. | 300x240 | 163, one-shot | 150, 196 | 9.3 |
| `smoke-bomb` | ninja smoke bomb to vanish or escape, a thick smoke cloud that hides a character. | 260x176 | 151, one-shot | 130, 156 | 5.7 |

### fire

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `brazier` | looping fire brazier prop lighting a dungeon, temple or castle hall. | 112x148 | 90, loop | 56, 136 | 4.8 |
| `campfire` | looping campfire prop for a rest point, camp or save spot in an adventure or survival game. | 128x128 | 90, loop | 64, 112 | 3.8 |
| `candle` | looping small candle flame prop for interiors, altars, haunted rooms or cozy scenes. | 56x76 | 120, loop | 28, 64 | 1.4 |
| `fire-breath` | looping dragon or monster fire breath cone streaming from the mouth while the attack is held. | 160x116 | 45, loop | 12, 72 | 3.0 |
| `fire-ring` | fire nova spell: a ring of flame spreading outward along the ground from the caster's feet. | 224x128 | 118, one-shot | 112, 92 | 7.3 |
| `fire-tornado` | looping fire tornado spell or hazard, a spinning flame vortex that moves across an area. | 120x152 | 60, loop | 60, 136 | 3.7 |
| `fireball` | fireball projectile in flight, looping while a fire spell moves toward its target. | 136x56 | 36, loop | 112, 28 | 0.9 |
| `flame-pillar` | fire pillar erupting from the ground, a one-shot fire spell or floor trap eruption. | 184x256 | 151, one-shot | 92, 232 | 11.1 |
| `flamethrower` | looping flamethrower weapon stream while the player holds fire, also fire traps or jets. | 184x104 | 48, loop | 30, 60 | 3.1 |
| `meteor` | meteor strike crashing into the ground, a one-shot fire spell or falling-rock impact explosion. | 272x232 | 151, one-shot | 150, 208 | 15.6 |
| `spirit-flame` | looping blue ghost fire prop for haunted, undead or spirit levels, floating will-o-wisp flame. | 80x124 | 90, loop | 40, 94 | 2.6 |
| `torch` | looping wall torch prop lighting a dungeon corridor or castle wall. | 72x120 | 60, loop | 36, 94 | 1.7 |

### holy

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `blessing` | looping holy buff on a character, a beam of light from above while blessed or protected. | 80x128 | 90, loop | 40, 108 | 2.2 |
| `divine-shield` | looping holy shield bubble around a character while invincible or protected by a barrier buff. | 88x84 | 72, loop | 44, 68 | 1.4 |
| `feather-burst` | burst of white feathers for an angel vanish, bird hit, pillow fight or holy poof. | 160x160 | 91, one-shot | 80, 60 | 4.1 |
| `halo` | looping halo over a character's head for saint, angel, invincible or ghost status. | 56x80 | 60, loop | 28, 70 | 0.3 |
| `heal-aoe` | group healing spell on the ground, a green ring that heals all allies in an area. | 256x136 | 88, one-shot | 128, 104 | 4.4 |
| `heal` | the moment a single character is healed or drinks a potion, healing glow rising up the body. | 80x104 | 58, one-shot | 40, 92 | 0.7 |
| `holy-pillar` | holy light pillar spell striking a marked area from the sky, one-shot area attack or sanctuary. | 192x232 | 106, one-shot | 96, 204 | 10.2 |
| `resurrection` | character revive or resurrection after death, wings of light lifting the fallen ally back up. | 192x160 | 145, one-shot | 96, 140 | 8.6 |
| `smite` | holy smite spell, a bolt of light hammering down on one enemy with a ground shockwave. | 224x176 | 85, one-shot | 112, 148 | 3.1 |
| `sunburst` | looping radiant sun glow for a holy relic, light source, power core or radiant boss aura. | 128x128 | 120, loop | 64, 64 | 5.5 |

### ice

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `blizzard-vortex` | looping snow tornado spell or winter hazard, a blizzard vortex moving across the arena. | 128x116 | 60, loop | 64, 102 | 2.1 |
| `freeze` | freeze crowd-control spell encasing a character in an ice block that then breaks. | 176x128 | 121, one-shot | 88, 108 | 3.2 |
| `frost-breath` | looping ice breath cone from a dragon or frost mage while the cold attack is held. | 184x104 | 36, loop | 12, 50 | 1.7 |
| `frost-nova` | frost nova around the caster, an ice ring area spell that freezes nearby enemies. | 288x192 | 103, one-shot | 144, 150 | 6.9 |
| `ice-crystal` | looping floating ice crystal pickup, gem or collectible for winter levels. | 96x100 | 90, loop | 48, 92 | 1.4 |
| `ice-lance` | ice spear projectile in flight, looping while an ice spell flies toward its target. | 176x64 | 24, loop | 146, 32 | 0.6 |
| `ice-shatter` | breaking an ice block or frozen object, destructible ice wall shattering on hit. | 224x112 | 85, one-shot | 68, 90 | 2.2 |
| `ice-spikes` | ice spikes erupting along the ground in a line, a directional ice spell or floor trap. | 264x112 | 91, one-shot | 24, 96 | 5.7 |
| `icicle-fall` | falling icicle trap dropping from a cave ceiling and shattering on the floor. | 152x120 | 79, one-shot | 76, 100 | 2.3 |
| `snowflake-burst` | small cold burst of snowflakes for an ice hit, frost pickup or winter-themed pop. | 140x120 | 97, one-shot | 70, 106 | 2.4 |

### impacts

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `blunt-hit` | punch, kick or club hit landing with a soft thud and dust, blunt melee impact. | 128x88 | 28, one-shot | 64, 72 | 0.5 |
| `bullet-impact` | bullet hitting a wall or surface with sparks and debris in a shooter. | 152x100 | 43, one-shot | 116, 84 | 0.3 |
| `crit-hit` | critical hit impact, a big flashy starburst when an attack lands a crit. | 216x136 | 28, one-shot | 84, 106 | 1.1 |
| `ground-slam` | heavy ground slam or boss landing with shockwaves, rocks and a dust cloud. | 288x208 | 97, one-shot | 144, 164 | 9.7 |
| `heavy-landing` | character landing hard after a jump or fall, dust rings and cracks at the feet. | 176x80 | 49, one-shot | 88, 60 | 0.5 |
| `hit-flash` | character takes damage, red and white hurt flash with hit lines. | 80x64 | 16, one-shot | 40, 54 | 0.1 |
| `hit-spark` | everyday melee hit spark at the contact point when a sword or punch lands. | 136x80 | 16, one-shot | 44, 64 | 0.2 |
| `impact-frame` | anime full-screen impact frame flash with speed lines for a finishing blow or super move hit. | 320x180 | 10, one-shot, full-screen | 160, 90 | 1.8 |
| `parry` | parry or sword clash when two blades meet, block with gold sparks. | 200x112 | 31, one-shot | 100, 96 | 0.9 |
| `ricochet` | bullet ricochet glancing off the ground with sparks, near-miss gunfire. | 232x84 | 34, one-shot | 64, 60 | 0.4 |
| `shield-block` | character blocking an attack with an energy shield in front, successful block or guard. | 148x104 | 34, one-shot | 40, 88 | 0.6 |

### lightning

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `ball-lightning` | looping ball lightning enemy, wandering electric orb hazard or ambient plasma wisp. | 136x104 | 120, loop | 68, 92 | 2.4 |
| `chain-lightning` | chain lightning spell bouncing from the caster through several enemies. | 248x104 | 55, one-shot | 40, 82 | 1.8 |
| `charge-up` | electric charge-up then burst, a power-up or spell wind-up released from the caster's hand. | 272x184 | 82, one-shot | 124, 148 | 3.4 |
| `electrified` | looping shocked or stunned status, electricity running through a character. | 108x92 | 60, loop | 54, 76 | 0.7 |
| `lightning-strike` | targeted lightning bolt striking an enemy or spot on the ground, one-shot thunder spell. | 240x264 | 91, one-shot | 120, 228 | 9.5 |
| `plasma-ball` | looping plasma lamp prop for a lab, sci-fi room or mad scientist level. | 112x104 | 90, loop | 56, 96 | 2.9 |
| `spark-arc` | looping electric arc between two rods, machine prop or electric trap in a lab. | 124x120 | 60, loop | 62, 108 | 1.9 |
| `storm-cloud` | looping local storm cloud raining and striking lightning, weather hazard or storm spell over an area. | 168x176 | 90, loop | 84, 164 | 8.4 |
| `tesla-coil` | looping tesla coil prop or electric tower trap shooting arcs. | 224x136 | 72, loop | 112, 120 | 4.3 |
| `thunderclap` | thunder nova around the caster, an electric shockwave area spell hitting nearby enemies. | 288x156 | 58, one-shot | 144, 124 | 3.3 |
| `zap-hit` | electric hit at the contact point when a shock attack, taser or lightning bolt lands. | 144x112 | 28, one-shot | 76, 56 | 0.5 |

### melee

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `claw-swipe` | beast or monster claw scratch attack, three claw marks for a wolf, cat or werewolf. | 128x96 | 28, one-shot | 36, 84 | 0.2 |
| `dagger-flurry` | fast dagger combo flurry of quick slashes for a rogue or assassin. | 148x104 | 30, one-shot | 36, 86 | 0.5 |
| `double-slash` | two-hit cross slash sword combo forming an X. | 164x108 | 25, one-shot | 44, 92 | 0.5 |
| `hammer-smash` | heavy hammer smash into the ground in front of the fighter with rocks and dust. | 208x112 | 61, one-shot | 80, 92 | 1.8 |
| `heavy-cleave` | heavy axe or greatsword overhead cleave into the ground with embers and cracks. | 208x116 | 58, one-shot | 68, 96 | 2.1 |
| `scythe-reap` | dark scythe reap slash for a reaper, necromancer or death boss attack. | 184x116 | 64, one-shot | 84, 98 | 1.1 |
| `spear-sweep` | low spear or polearm sweep attack hitting enemies around the legs. | 216x84 | 46, one-shot | 104, 70 | 0.8 |
| `spin-slash` | spinning sword slash hitting all enemies around the character, whirlwind attack. | 208x104 | 25, one-shot | 104, 84 | 0.8 |
| `sword-slash` | basic sword slash arc for a melee attack swing. | 136x104 | 24, one-shot | 44, 92 | 0.5 |
| `thrust` | spear, rapier or sword stab, piercing thrust attack straight forward. | 196x76 | 24, one-shot | 34, 62 | 0.3 |
| `uppercut` | uppercut punch or launcher attack rising upward with a comic impact star. | 132x128 | 27, one-shot | 48, 110 | 0.5 |
| `whip-crack` | whip attack lashing forward and cracking at the tip. | 192x80 | 27, one-shot | 30, 68 | 0.3 |

### moves

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `arrow-shot` | archer's bow attack effects, arrow flight and hit on a target ahead; no character drawn, play at the archer's feet. | 300x74 | 58, one-shot | 38, 66 | 0.2 |
| `dash-strike` | dash attack effects, after-image streak and critical slash on a target ahead; no character drawn, play at the attacker's feet. | 372x156 | 70, one-shot | 66, 136 | 1.2 |
| `earth-stomp` | earth spell effects, stomp dust and a stone spike erupting under a target ahead; no character drawn, play at the caster's feet. | 290x142 | 105, one-shot | 50, 128 | 5.6 |
| `fireball-throw` | fire mage attack effects, fireball thrown from the hand and exploding on a target ahead; no character drawn, play at the caster's feet. | 356x244 | 205, one-shot | 64, 198 | 11.0 |
| `ground-pound` | ground pound or heavy landing attack effects, cracks and shockwaves racing out; no character drawn, play at the attacker's feet. | 304x204 | 116, one-shot | 152, 168 | 9.5 |
| `holy-smite` | holy spell attack effects, target glint then a bolt of light striking it; no character drawn, play at the caster's feet. | 252x182 | 85, one-shot | 42, 151 | 3.2 |
| `ice-lance-throw` | ice mage attack effects, ice spear thrown and freezing a target ahead; no character drawn, play at the caster's feet. | 310x136 | 131, one-shot | 86, 134 | 3.2 |
| `lightning-call` | lightning spell attack effects, sigil under a target ahead and a thunder bolt striking it; no character drawn, play at the caster's feet. | 290x266 | 91, one-shot | 42, 231 | 9.2 |
| `meteor-call` | ultimate spell or boss attack effects, summoning circle and a meteor crashing on a target ahead; no character drawn, play at the caster's feet. | 380x240 | 97, one-shot | 92, 212 | 11.7 |
| `pistol-shots` | gunslinger attack effects, three pistol muzzle flashes, tracers and hits on a target ahead; no character drawn, play at the shooter's feet. | 378x76 | 79, one-shot | 111, 72 | 2.4 |
| `rocket-launcher` | heavy weapon attack effects, rocket launch backblast and explosion on a target ahead; no character drawn, play at the shooter's feet. | 480x244 | 99, one-shot | 178, 198 | 8.4 |
| `sword-combo` | three-hit sword combo effects, slash trails and impacts on a target ahead; no character drawn, play at the swordsman's feet. | 264x150 | 90, one-shot | 72, 130 | 3.1 |

### nature

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `acid-splash` | acid or poison splash hitting the ground and melting a smoking pit, toxic spit impact. | 184x116 | 85, one-shot | 92, 100 | 1.9 |
| `boulder` | thrown or rolling boulder projectile smashing into the ground, rock attack or trap. | 264x120 | 70, one-shot | 40, 104 | 2.6 |
| `earth-spike` | earth spike erupting from the ground under an enemy, stone spell or floor trap. | 272x150 | 103, one-shot | 136, 132 | 5.4 |
| `healing-bloom` | healing flower blooming on the ground, nature heal spell or health pickup spot. | 124x120 | 100, one-shot | 62, 108 | 2.0 |
| `leaf-storm` | looping wind and leaves swirling around a character, nature aura or wind buff. | 112x104 | 72, loop | 56, 92 | 1.9 |
| `poison-cloud` | looping toxic gas cloud on the ground, poison area hazard or poison spell zone. | 256x100 | 120, loop | 128, 86 | 8.4 |
| `quake` | earthquake area attack, a rift tearing along the ground with heaving slabs. | 288x104 | 94, one-shot | 144, 88 | 4.2 |
| `root-snare` | root snare or entangle status, roots binding a character's legs to immobilize them. | 128x96 | 82, one-shot | 64, 78 | 0.9 |
| `spore-burst` | poison mushroom bursting a spore cloud, toxic trap or fungus enemy attack. | 212x132 | 97, one-shot | 106, 118 | 2.6 |
| `thorns` | line of thorns punching up from the ground, nature spell or spike trap. | 232x92 | 73, one-shot | 48, 78 | 2.3 |
| `tornado` | looping wind tornado hazard or storm spell moving across the level. | 196x168 | 60, loop | 98, 152 | 3.3 |
| `toxic-puddle` | looping toxic sludge puddle floor hazard that damages players standing in it. | 176x100 | 120, loop | 88, 86 | 2.8 |
| `vine-whip` | vine whip attack lashing out from the ground, plant enemy or nature spell. | 216x128 | 43, one-shot | 60, 114 | 0.8 |

### pickups

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `chest-open` | treasure chest opening and spilling coins and gems, loot reward moment. | 176x112 | 139, one-shot | 88, 96 | 3.6 |
| `coin-spin` | looping spinning gold coin collectible waiting to be picked up in a platformer. | 56x56 | 48, loop | 28, 48 | 0.3 |
| `collect-burst` | the moment any item, coin or power-up is picked up or collected by the player (pickup burst sparkle). | 112x108 | 42, one-shot | 56, 94 | 0.6 |
| `crystal-shard` | looping floating crystal shard collectible, relic fragment or quest item. | 64x76 | 96, loop | 32, 68 | 1.0 |
| `gem-spin` | looping spinning ruby gem collectible, treasure or currency pickup. | 64x64 | 72, loop | 32, 56 | 0.5 |
| `heart-pickup` | looping beating heart pickup that restores health or gives an extra life. | 56x60 | 36, loop | 28, 52 | 0.2 |
| `key-glint` | looping key pickup that unlocks a door or chest. | 72x60 | 60, loop | 36, 54 | 0.4 |
| `loot-beam` | looping rarity loot beam marking a dropped item or weapon on the ground. | 96x176 | 72, loop | 48, 162 | 2.8 |
| `potion` | looping potion flask pickup for health, mana or magic items. | 56x72 | 72, loop | 28, 64 | 0.7 |
| `power-star` | looping power-up star pickup for invincibility or bonus. | 88x84 | 48, loop | 44, 76 | 0.8 |
| `xp-orb` | looping experience orb pickup dropped by enemies, XP or energy collectible. | 72x56 | 54, loop | 36, 48 | 0.3 |

### projectiles

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `arrow` | arrow projectile in flight, looping while a bow shot travels to its target. | 112x32 | 18, loop | 92, 16 | 0.1 |
| `bullet-tracer` | bullet projectile in flight with a tracer streak, looping for shooter guns. | 200x40 | 18, loop | 184, 18 | 0.4 |
| `cannonball` | cannon firing a cannonball with muzzle flash and smoke, pirate ship or tower defense shot. | 208x116 | 115, one-shot | 48, 102 | 3.1 |
| `energy-disc` | spinning energy sawblade disc projectile in flight, looping for sci-fi throwing weapons or boss attacks. | 120x52 | 15, loop | 92, 26 | 0.2 |
| `flare` | signal flare fired into the sky, rescue signal or event marker. | 152x232 | 151, one-shot | 76, 226 | 7.5 |
| `homing-missile` | homing missile launching, arcing and exploding on its target, full one-shot attack. | 248x140 | 115, one-shot | 160, 120 | 5.2 |
| `laser-bolt` | red laser bolt projectile in flight for sci-fi blasters and space shooters. | 128x32 | 15, loop | 108, 16 | 0.2 |
| `magic-missile` | magic missile cast from a hand that weaves to its target and bursts, one-shot spell attack. | 208x112 | 58, one-shot | 24, 104 | 0.7 |
| `muzzle-pistol` | pistol muzzle flash for a single gunshot with smoke and an ejected casing. | 96x72 | 55, one-shot | 44, 66 | 0.5 |
| `muzzle-shotgun` | shotgun muzzle blast with pellet spread, smoke and a shell ejected. | 160x88 | 97, one-shot | 44, 82 | 1.9 |
| `muzzle-smg` | looping automatic weapon muzzle flash while firing an SMG or machine gun. | 112x72 | 30, loop | 56, 66 | 0.4 |
| `plasma-shot` | plasma blob projectile in flight for sci-fi energy guns. | 144x60 | 24, loop | 108, 30 | 0.5 |
| `rocket` | rocket projectile in flight with jet flame and smoke trail, looping. | 288x76 | 36, loop | 252, 42 | 2.5 |

### scifi

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `emp-blast` | EMP grenade blast disabling electronics, sci-fi pulse shockwave with glitch. | 152x116 | 97, one-shot | 76, 84 | 2.4 |
| `energy-core` | looping reactor energy core prop for a sci-fi base, power generator or objective. | 112x100 | 72, loop | 56, 88 | 2.1 |
| `force-field` | looping sci-fi force field dome over a character, shield taking blaster hits. | 184x104 | 72, loop | 76, 84 | 3.1 |
| `glitch` | looping digital glitch status on a character, hologram corruption. | 88x64 | 72, loop | 44, 54 | 0.4 |
| `hologram` | looping hologram projector prop on the floor for sci-fi bases and briefing rooms. | 112x104 | 120, loop | 56, 92 | 2.6 |
| `jetpack` | looping jetpack thruster flames under a flying character. | 96x116 | 60, loop | 48, 30 | 1.3 |
| `laser-grid` | looping security laser grid trap or barrier between two posts. | 128x84 | 90, loop | 64, 76 | 2.8 |
| `scanner` | looping scan or target-lock effect sweeping over a character, HUD scan status. | 112x78 | 96, loop | 42, 58 | 1.4 |
| `teleporter-pad` | looping teleporter pad on the floor, spawn point or sci-fi warp station. | 96x104 | 72, loop | 48, 92 | 1.8 |
| `tractor-beam` | looping UFO tractor beam lifting rocks and debris, abduction effect. | 120x132 | 90, loop | 60, 114 | 3.4 |
| `warp-in` | sci-fi character spawn or teleport arrival, the hero painted in by a beam. | 192x168 | 91, one-shot | 96, 128 | 5.9 |
| `warp-out` | sci-fi character despawn or teleport exit, the hero beamed up and away. | 128x168 | 79, one-shot | 64, 128 | 2.2 |

### shadow

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `black-hole` | looping black hole hazard or gravity well, space anomaly or dark spell. | 184x132 | 120, loop | 92, 124 | 8.9 |
| `curse` | curse debuff applied to a character, a skull stamping down and staining them violet. | 112x124 | 103, one-shot | 56, 108 | 1.9 |
| `dark-explosion` | dark magic explosion for a shadow spell impact or demon and boss death. | 280x248 | 115, one-shot | 140, 206 | 15.5 |
| `eclipse` | looping solar eclipse in the sky for a doom event, dark ritual or boss arena backdrop. | 160x144 | 120, loop | 80, 72 | 8.5 |
| `grasping-hands` | shadow hands grabbing from the ground, dark spell trap or grab attack. | 200x116 | 94, one-shot | 100, 100 | 4.5 |
| `hex-sigil` | hex sigil traced in the air, dark curse spell cast or rune trap. | 168x128 | 127, one-shot | 84, 112 | 3.8 |
| `life-steal` | life steal or vampire drain attack draining health from a target to the caster. | 184x100 | 67, one-shot | 36, 92 | 1.1 |
| `necro-skulls` | looping orbiting spectral skulls for a necromancer aura or undead boss. | 136x116 | 90, loop | 68, 108 | 3.1 |
| `shadow-flames` | looping dark purple fire on the ground, shadow fire hazard or dark brazier. | 104x112 | 72, loop | 52, 102 | 2.3 |
| `shadow-tendrils` | dark tentacles lashing up from a pool on the ground, shadow spell or trap. | 208x130 | 97, one-shot | 104, 106 | 5.5 |
| `soul-drain` | looping soul drain pulling souls from a target into a vessel, necromancy channel. | 208x120 | 96, loop | 40, 110 | 4.9 |
| `void-orb` | looping void orb, a dark vortex sphere for a shadow spell, portal or boss weapon. | 168x160 | 96, loop | 84, 150 | 5.5 |

### spawn

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `coin-drop` | enemy death that drops coins, defeated enemy poofs and spills gold loot. | 160x88 | 91, one-shot | 80, 78 | 1.0 |
| `disintegrate` | enemy or character killed by disintegrating into light particles (sci-fi or magic death). | 176x100 | 103, one-shot | 48, 86 | 1.8 |
| `dissolve-burn` | character death by burning away into ash and embers. | 96x112 | 109, one-shot | 48, 100 | 2.0 |
| `egg-hatch` | egg hatching to spawn a creature or pet, birth or reveal moment. | 120x96 | 94, one-shot | 60, 84 | 0.7 |
| `poof` | cartoon enemy death or despawn poof: small enemy killed or defeated, vanishing in a puff of smoke. | 112x92 | 49, one-shot | 56, 80 | 0.6 |
| `respawn-beam` | player respawn after death, character rebuilt by a beam of light at the checkpoint. | 128x150 | 76, one-shot | 64, 136 | 2.5 |
| `shatter-death` | frozen character death shattering into ice shards. | 172x96 | 100, one-shot | 84, 84 | 1.8 |
| `soul-rise` | enemy or character death with the soul rising out of the defeated body as a ghost. | 96x140 | 97, one-shot | 48, 126 | 1.7 |
| `spawn-portal` | enemy spawn portal tearing open on the ground for a summon or wave start. | 208x150 | 115, one-shot | 104, 122 | 5.0 |
| `summon-rise` | summon a demon or monster rising out of the ground from a rune circle, boss entrance. | 176x116 | 139, one-shot | 88, 94 | 5.7 |

### status

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `bleeding` | looping bleeding status, damage-over-time blood dripping from wounds. | 60x56 | 72, loop | 30, 46 | 0.1 |
| `burning` | looping burning status, on-fire damage-over-time debuff. | 72x80 | 36, loop | 36, 70 | 0.4 |
| `charmed` | looping charmed or love status over a character's head, hearts and blush. | 60x76 | 72, loop | 30, 68 | 0.7 |
| `confused` | looping confused or dizzy status, spiral and question marks over the character's head. | 60x78 | 72, loop | 30, 70 | 0.4 |
| `cursed` | looping cursed or hexed debuff with dark smoke rising. | 64x84 | 72, loop | 32, 76 | 0.9 |
| `frozen` | looping frozen or chilled slow debuff with frost and icicles. | 72x64 | 60, loop | 36, 54 | 0.7 |
| `haste` | looping haste or speed buff with after-images and speed lines behind the running character. | 100x56 | 36, loop | 64, 48 | 0.5 |
| `petrified` | petrify debuff or stone death, character turning to stone then crumbling. | 120x74 | 115, one-shot | 60, 64 | 0.9 |
| `poisoned` | looping poisoned status, toxic damage-over-time debuff. | 72x64 | 48, loop | 36, 54 | 0.4 |
| `rage` | looping rage or berserk buff with anger mark and steam. | 80x80 | 36, loop | 40, 70 | 0.4 |
| `sleep` | looping sleeping status with Zzz floating over the character's head. | 60x82 | 72, loop | 26, 74 | 0.8 |
| `slowed` | looping slowed debuff with a ticking clock behind the character's head. | 64x76 | 72, loop | 32, 68 | 0.8 |
| `stunned` | looping stunned or dazed status, stars and birds circling the character's head. | 60x64 | 60, loop | 30, 56 | 0.4 |

### transitions

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `blinds` | full-screen scene transition closing and opening like window blinds between scenes. | 320x180 | 61, one-shot, full-screen | 0, 0 | 12.8 |
| `burn-away` | full-screen scene transition burning the screen away with fire and embers. | 320x180 | 46, one-shot, full-screen | 0, 0 | 9.9 |
| `crt-off` | full-screen retro CRT TV switch-off scene transition, game over or channel change. | 320x180 | 61, one-shot, full-screen | 0, 0 | 12.3 |
| `diamond-wipe` | full-screen diamond wipe scene transition between levels or menus. | 320x180 | 61, one-shot, full-screen | 0, 0 | 9.3 |
| `glitch-wipe` | full-screen digital glitch wipe scene transition for sci-fi or cyberpunk games. | 320x180 | 55, one-shot, full-screen | 0, 0 | 8.6 |
| `iris` | full-screen iris-out circle scene transition, classic cartoon level end. | 320x180 | 67, one-shot, full-screen | 0, 0 | 10.7 |
| `pixel-dissolve` | full-screen pixel dissolve scene transition between levels or rooms. | 320x180 | 67, one-shot, full-screen | 0, 0 | 13.1 |
| `shatter-wipe` | full-screen glass shatter scene transition for a dramatic cut or battle start. | 320x180 | 85, one-shot, full-screen | 0, 0 | 15.2 |
| `slash-wipe` | full-screen sword slash wipe scene transition for battle start or action games. | 320x180 | 52, one-shot, full-screen | 0, 0 | 9.0 |
| `star-iris` | full-screen star-shaped iris scene transition for a level clear or cute game. | 320x180 | 67, one-shot, full-screen | 0, 0 | 10.7 |

### ui

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `achievement` | achievement unlocked toast popup with a medal sliding into view. | 220x72 | 73, one-shot | 110, 36 | 1.4 |
| `coin-collect` | HUD coin counter pop when coins fly into the score display after collecting. | 176x116 | 75, one-shot | 60, 102 | 2.1 |
| `combo-counter` | combo counter text popup for hit streaks in action or fighting games. | 208x100 | 45, one-shot | 104, 50 | 2.4 |
| `confetti` | confetti party popper celebration for winning, level complete or reward. | 200x140 | 103, one-shot | 100, 126 | 3.1 |
| `countdown` | 3-2-1-GO countdown before a race, round or match starts. | 152x136 | 94, one-shot | 76, 68 | 3.5 |
| `crit-number` | critical damage number popup with CRIT text over an enemy. | 152x120 | 46, one-shot | 76, 60 | 1.6 |
| `damage-number` | floating damage number popup when an enemy or player takes a hit. | 76x68 | 33, one-shot | 30, 52 | 0.2 |
| `exclamation` | exclamation mark over a character's head when surprised or spotting the player, alert emote. | 84x104 | 43, one-shot | 42, 92 | 0.3 |
| `health-bar-hit` | HUD health bar losing a chunk when the player takes damage. | 160x64 | 61, one-shot | 80, 30 | 1.5 |
| `heart-lost` | HUD heart breaking when the player loses a life or heart of health. | 96x88 | 46, one-shot | 48, 34 | 0.5 |
| `level-up` | level up celebration with a light pillar and LEVEL UP text around the hero. | 176x138 | 97, one-shot | 88, 114 | 4.7 |
| `quest-complete` | quest complete banner popup for finishing a mission or objective. | 204x92 | 79, one-shot | 102, 46 | 3.7 |

### water

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `bubbles` | looping underwater bubbles rising from a vent, ambient for ocean or aquarium levels. | 104x112 | 120, loop | 52, 104 | 4.4 |
| `drip` | looping water drip into a puddle, ambient cave or dungeon detail. | 72x88 | 48, loop | 36, 78 | 0.7 |
| `fountain` | looping water fountain prop for a town square, garden or courtyard. | 120x104 | 60, loop | 60, 96 | 1.7 |
| `geyser` | geyser erupting a water column, one-shot nature hazard or launch spout. | 184x168 | 151, one-shot | 92, 146 | 6.6 |
| `rain-splash` | looping close-up raindrops splashing into a puddle, ambient rainy street detail. | 176x80 | 72, loop | 88, 50 | 2.9 |
| `ripples` | looping water ripples on a pond or lake surface, ambient water detail. | 136x52 | 60, loop | 68, 30 | 1.4 |
| `splash` | something falling into water, one-shot splash when a player or object hits a pool. | 176x100 | 76, one-shot | 88, 78 | 1.5 |
| `water-jet` | looping pressurized water jet or hose stream, water spell or firefighting spray. | 188x80 | 30, loop | 14, 32 | 1.1 |
| `water-orb` | looping floating water orb, water magic sphere prop or collectible. | 100x108 | 90, loop | 50, 100 | 3.5 |
| `waterfall` | looping waterfall prop pouring into a pool, ambient nature scenery. | 144x136 | 60, loop | 72, 118 | 3.6 |
| `wave-crash` | ocean wave crashing into foam, one-shot beach surf or tidal wave attack. | 224x104 | 97, one-shot | 112, 86 | 3.6 |
| `whirlpool` | looping top-down whirlpool hazard or maelstrom in water. | 128x84 | 90, loop | 64, 42 | 3.2 |

### weather

| Name | Use for | Size | Frames | Pivot | GPU MB |
|---|---|---|---|---|---|
| `aurora` | full-screen night sky aurora overlay, northern lights ambient background for snowy or night levels. | 320x180 | 72, loop, full-screen | 160, 180 | 15.4 |
| `blizzard` | full-screen blizzard weather overlay, heavy snowstorm with strong wind for winter levels. | 320x180 | 80, loop, full-screen | 160, 170 | 17.6 |
| `cherry-blossoms` | full-screen falling cherry blossom petals overlay for spring or Japanese-themed scenes. | 320x180 | 70, loop, full-screen | 160, 170 | 15.4 |
| `clouds` | full-screen drifting night clouds over the moon, ambient sky background overlay. | 320x180 | 84, loop, full-screen | 160, 180 | 15.3 |
| `falling-leaves` | full-screen falling autumn leaves overlay for fall-season or forest levels. | 320x180 | 70, loop, full-screen | 160, 170 | 15.4 |
| `fireflies` | full-screen fireflies overlay for a calm night meadow or forest scene. | 320x180 | 72, loop, full-screen | 160, 170 | 15.8 |
| `fog` | full-screen fog or mist overlay for spooky, night or swamp levels. | 320x180 | 96, loop, full-screen | 160, 170 | 10.0 |
| `god-rays` | full-screen sunbeam god rays overlay with floating dust for forests, temples or churches. | 320x180 | 70, loop, full-screen | 160, 170 | 15.4 |
| `rain` | full-screen rain overlay for a rainy level or weather system. | 320x180 | 64, loop, full-screen | 160, 170 | 14.1 |
| `shooting-stars` | full-screen shooting stars overlay for a night sky background or wish scene. | 320x180 | 80, loop, full-screen | 160, 180 | 17.6 |
| `snow` | full-screen gentle snowfall overlay for winter or Christmas levels. | 320x180 | 72, loop, full-screen | 160, 170 | 15.8 |
| `storm` | full-screen thunderstorm overlay with heavy rain and lightning flashes for a stormy level. | 320x180 | 80, loop, full-screen | 160, 170 | 17.6 |
