#!/usr/bin/env node

// Keeps the code shared by the basic-3d-r3f-* templates identical.
// Each template folder is a complete project (agent8 copies it as-is into a
// user's project), so the shared files live in every folder. The source of
// truth is basic-3d-r3f-freeview: edit there, then run `npm run 3d:sync`.
// `npm run 3d:check` exits 1 if any copy differs from the source.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Color helper function
const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`;

const SOURCE = 'basic-3d-r3f-freeview';

// Build setup, page shell and the lazy rapier chunk: every R3F template.
const BUILD = [
  '.gitignore',
  'index.html',
  'postcss.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'vite.config.ts',
  'src/main.tsx',
  'src/index.css',
  'src/physics/LazyPhysics.tsx',
  'src/physics/PhysicsDemo.tsx',
];

// Kinematic character controller: controller + its tests, the collision
// types it needs (world.ts), the 3rd-person camera rules (camera.ts:
// presets, collision, follow yaw), movement input, animation and the
// character model. Every template with a walking character.
const CONTROLLER = [
  'src/game/anim.ts',
  'src/game/camera.ts',
  'src/game/camera.test.ts',
  'src/game/input.ts',
  'src/game/player.ts',
  'src/game/player.test.ts',
  'src/game/world.ts',
  'src/components/Character.tsx',
];

// Putting models in: fitModel (metre size, feet on y = 0), static props and
// rigged enemies / NPCs. Every template, but no scene imports them (agents
// add them per game; unused, they stay out of the bundle). AnimatedModel
// borrows clips through anim.ts retarget and the src/assets.json
// `animations` idle / walk / run, so those come along.
const MODELS = [
  'src/game/anim.ts',
  'src/game/fitModel.ts',
  'src/components/models/Props.tsx',
  'src/components/models/AnimatedModel.tsx',
];

// Character views on the box / ramp / height-field stage: the controller plus
// the level, asset list and touch controls. View-specific files (config.ts,
// App.tsx, game/state.ts, components/Player.tsx, components/CameraRig.tsx and
// the docs) stay per folder.
const CHARACTER = [...CONTROLLER, 'src/assets.json', 'src/components/Level.tsx', 'src/components/MobileControls.tsx'];

// package.json fields copied from the source (name, scripts etc. stay per folder).
const PACKAGE_FIELDS = ['dependencies', 'devDependencies'];

const bundle = (...lists) => [...new Set(lists.flat())];

const TARGETS = {
  'basic-3d-r3f-sideview': bundle(BUILD, CHARACTER, MODELS),
  'basic-3d-r3f-quarterview': bundle(BUILD, CHARACTER, MODELS),
  'basic-3d-r3f-firstpersonview': bundle(BUILD, CHARACTER, MODELS),
  'basic-3d-r3f-empty': bundle(BUILD, MODELS),
  // No character: its own flight loop, input and touch controls.
  'basic-3d-r3f-flightview': bundle(BUILD, MODELS),
  // Voxel world instead of the box stage: own terrain, assets (block textures) and touch buttons.
  'basic-3d-r3f-minecraft': bundle(BUILD, CONTROLLER, MODELS),
};

const args = process.argv.slice(2);
const check = args.includes('--check');

if (args.includes('--help') || args.includes('-h')) {
  console.log(colorize('blue', '📖 Usage:'));
  console.log('');
  console.log(colorize('cyan', 'npm run 3d:sync') + colorize('gray', '    # Copy shared files from ' + SOURCE + ' to the other basic-3d-r3f-* folders'));
  console.log(colorize('cyan', 'npm run 3d:check') + colorize('gray', '   # Exit 1 if any copy differs from ' + SOURCE));
  console.log('');
  console.log(colorize('yellow', 'Shared files:'));
  console.log(colorize('gray', '  all targets:      ') + BUILD.join(', '));
  console.log(colorize('gray', '  controller:       ') + CONTROLLER.join(', '));
  console.log(colorize('gray', '  character views:  ') + CHARACTER.join(', '));
  console.log(colorize('gray', '  models:           ') + MODELS.join(', '));
  console.log(colorize('gray', '  package.json:     ') + PACKAGE_FIELDS.join(', '));
  console.log('');
  console.log(colorize('red', '⚠️  Important: Run these commands from the root directory of the workspace!'));
  process.exit(0);
}

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const lf = (text) => text.replace(/\r\n/g, '\n');

/** Target package.json text with the shared fields taken from the source. */
function syncedPackage(dir) {
  const source = JSON.parse(read(join(SOURCE, 'package.json')));
  const target = JSON.parse(read(join(dir, 'package.json')));
  for (const field of PACKAGE_FIELDS) target[field] = source[field];
  return JSON.stringify(target, null, 2) + '\n';
}

if (!existsSync(join(root, SOURCE))) {
  console.log(colorize('red', `❌ ${SOURCE} not found. Run from the repository root.`));
  process.exit(1);
}

console.log(colorize('blue', check ? `🔍 Checking copies against ${SOURCE}...\n` : `🚀 Syncing shared files from ${SOURCE}...\n`));

let differ = 0;
let written = 0;

for (const [dir, files] of Object.entries(TARGETS)) {
  if (!existsSync(join(root, dir))) {
    console.log(colorize('red', `❌ ${dir} not found`));
    differ++;
    continue;
  }
  const changed = [];
  const entries = files.map((file) => [file, read(join(SOURCE, file))]);
  entries.push(['package.json', syncedPackage(dir)]);

  for (const [file, want] of entries) {
    const dest = join(root, dir, file);
    const have = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
    // Line endings may differ per checkout (core.autocrlf); compare content only.
    if (have !== null && lf(have) === lf(want)) continue;
    changed.push(file);
    if (!check) {
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, want);
    }
  }

  if (changed.length === 0) {
    console.log(colorize('green', `  ✓ ${dir}`));
    continue;
  }
  if (check) {
    differ += changed.length;
    console.log(colorize('red', `  ✗ ${dir}`));
  } else {
    written += changed.length;
    console.log(colorize('yellow', `  ↻ ${dir}`));
  }
  for (const file of changed) console.log(colorize('gray', `      ${file}`));
}

console.log('');
if (check) {
  if (differ > 0) {
    console.log(colorize('red', `❌ ${differ} file(s) differ from ${SOURCE}. Edit the source, then run npm run 3d:sync.`));
    process.exit(1);
  }
  console.log(colorize('green', '🎉 All copies match.'));
} else {
  console.log(colorize('green', `🎉 Complete! ${written} file(s) updated.`));
}
