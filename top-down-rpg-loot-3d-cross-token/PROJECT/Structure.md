# Structure

> **⚠️ 이 문서는 첫 프롬프트에 포함됩니다.**
> 변경 가능/불가 파일 목록: `docs/project-3d-rules.md` 섹션 0 참조.
> 첫 프롬프트 필수 작업 체크리스트: `Status.md` 참조.

## File Organization

### Core Application
- `src/main.tsx`: Entry point
- `src/App.tsx`: App layout container, handles preload
- `src/assets.json`: Asset manifest for models and textures

### 3D Components (`src/components/r3f/`)
- `Experience.tsx`: Main 3D scene setup
- `Player.tsx`: Player character controller with animations
- `MapPhysicsReadyChecker.tsx`: Safety checker for physics
- `GameEnvironment.tsx` (Planned): Contains procedural terrain and placed objects
- `LootManager.tsx` (Planned): Handles collectible interactive items

### UI Components (`src/components/ui/`)
- `GameSceneUI.tsx`: Overlay UI for joystick and actions
- `InputController.tsx`: Manages touch and keyboard inputs

### State Management (`src/stores/`)
- `gameStore.ts`: Tracks game initialization
- `localPlayerStore.ts`: Tracks player position
- `inventoryStore.ts` (Planned): Tracks collected items

### Integration (`server/`)
- Handles server-side validation of collected items and integration with CrossRamp ecosystem.
