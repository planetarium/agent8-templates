#!/usr/bin/env node

import { accessSync, statSync, readdirSync, unlinkSync, rmdirSync, renameSync } from 'fs';
import { join } from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Color helper function
const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`;

// Parse command line arguments
const args = process.argv.slice(2);
const targetArg = args.find((arg) => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'basic-3d';

// The seven 3D templates (React Three Fiber): docs:copy never writes docs/ there, so
// docs:remove never deletes a docs/ folder there either (it would be the game's own).
const R3F_TEMPLATES = [
  'basic-3d',
  'basic-3d-freeview',
  'basic-3d-sideview',
  'basic-3d-quarterview',
  'basic-3d-firstpersonview',
  'basic-3d-flightview',
  'basic-3d-minecraft',
];

console.log(colorize('blue', '🗑️  Starting docs removal script...\n'));

// Check if path exists
function pathExists(filePath) {
  try {
    accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

// Check if path is directory
function isDirectory(filePath) {
  try {
    return statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

// Remove directory recursively
function removeDirectory(dirPath) {
  if (pathExists(dirPath)) {
    const items = readdirSync(dirPath);

    for (const item of items) {
      const itemPath = join(dirPath, item);
      if (isDirectory(itemPath)) {
        removeDirectory(itemPath);
      } else {
        unlinkSync(itemPath);
      }
    }

    rmdirSync(dirPath);
  }
}

async function removeDocs() {
  try {
    // Set target directory pattern
    let pattern;
    switch (target) {
      case 'basic-3d':
        pattern = 'basic-3d*';
        break;
      case 'all':
        pattern = '*';
        break;
      default:
        pattern = target + '*';
    }

    console.log(colorize('cyan', `📁 Target pattern: ${pattern}\n`));

    // Get directory list
    const allItems = readdirSync(process.cwd());
    const targetDirs = [];

    for (const item of allItems) {
      const itemPath = join(process.cwd(), item);

      if (isDirectory(itemPath) && item !== 'docs' && item !== 'scripts' && item !== '.git' && item !== 'node_modules') {
        if (target === 'all' || item.startsWith(target)) {
          if (R3F_TEMPLATES.includes(item)) {
            continue;
          }
          const docsPath = join(itemPath, 'docs');
          if (pathExists(docsPath)) {
            targetDirs.push(item);
          }
        }
      }
    }

    if (targetDirs.length === 0) {
      console.log(colorize('yellow', `⚠️  No docs folders found in directories matching pattern '${pattern}'.`));
      return;
    }

    console.log(colorize('green', `Found ${targetDirs.length} directories with docs folders\n`));

    let successCount = 0;
    let failCount = 0;

    // Remove docs from each directory
    for (const dir of targetDirs) {
      const targetPath = join(process.cwd(), dir);
      const targetDocsPath = join(targetPath, 'docs');

      console.log(colorize('blue', `📁 Removing docs from ${dir}...`));

      try {
        // Check if backup exists and restore it
        const backupPath = join(targetPath, 'docs.backup');

        // Remove docs folder
        removeDirectory(targetDocsPath);
        console.log(colorize('green', `   ✅ Successfully removed docs folder`));

        // Restore backup if exists
        if (pathExists(backupPath)) {
          renameSync(backupPath, targetDocsPath);
          console.log(colorize('cyan', `   📦 Restored docs.backup to docs`));
        }

        successCount++;
      } catch (error) {
        console.log(colorize('red', `   ❌ Removal failed: ${error.message}`));
        failCount++;
      }

      console.log('');
    }

    // Summary
    console.log(colorize('green', `🎉 Complete!`));
    console.log(colorize('green', `✅ Success: ${successCount}`));
    if (failCount > 0) {
      console.log(colorize('red', `❌ Failed: ${failCount}`));
    }

    console.log(colorize('cyan', '\nProcessed project list:'));
    for (const dir of targetDirs) {
      const targetDocsPath = join(process.cwd(), dir, 'docs');
      const backupPath = join(process.cwd(), dir, 'docs.backup');

      if (!pathExists(targetDocsPath) && !pathExists(backupPath)) {
        console.log(colorize('green', `  ✓ ${dir} - docs removed`));
      } else if (pathExists(targetDocsPath) && !pathExists(backupPath)) {
        console.log(colorize('cyan', `  📦 ${dir} - docs restored from backup`));
      } else {
        console.log(colorize('red', `  ✗ ${dir} - operation incomplete`));
      }
    }
  } catch (error) {
    console.error(colorize('red', `❌ Error occurred: ${error.message}`));
    process.exit(1);
  }
}

// Show usage
if (args.includes('--help') || args.includes('-h')) {
  console.log(colorize('blue', '📖 Usage:'));
  console.log('');
  console.log(colorize('cyan', 'npm run remove-docs') + colorize('gray', '       # Remove docs from basic-3d projects (default)'));
  console.log(colorize('cyan', 'npm run docs:remove') + colorize('gray', '       # Remove docs from basic-3d projects'));
  console.log('');
  console.log(colorize('yellow', 'With pnpm:'));
  console.log(colorize('cyan', 'pnpm remove-docs') + colorize('gray', '          # Remove docs from basic-3d projects (default)'));
  console.log(colorize('cyan', 'pnpm docs:remove') + colorize('gray', '          # Remove docs from basic-3d projects'));
  console.log('');
  console.log(colorize('yellow', 'Or run directly:'));
  console.log(colorize('cyan', 'node scripts/remove-docs.js --target=basic-3d'));
  console.log(colorize('cyan', 'node scripts/remove-docs.js --target=all'));
  console.log(colorize('cyan', 'node scripts/remove-docs.js --target=2d-phaser'));
  console.log('');
  console.log(colorize('yellow', 'Examples:'));
  console.log(colorize('gray', '  Remove from basic-3d projects: ') + colorize('cyan', 'npm run remove-docs'));
  console.log(colorize('gray', '  Remove from 2d-phaser projects: ') + colorize('cyan', 'node scripts/remove-docs.js --target=2d-phaser'));
  console.log('');
  console.log(colorize('green', '💡 Note: If docs.backup exists, it will be restored to docs after removal.'));
  console.log(colorize('red', '⚠️  Important: Run these commands from the root directory of the workspace!'));
  process.exit(0);
}

removeDocs();
