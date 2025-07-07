#!/usr/bin/env node

import { accessSync, statSync, readdirSync, mkdirSync, unlinkSync, rmdirSync, renameSync, copyFileSync } from 'fs';
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

console.log(colorize('blue', '🚀 Starting docs copy script...\n'));

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

// Copy directory recursively
function copyDirectory(src, dest) {
  if (!pathExists(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const items = readdirSync(src);

  for (const item of items) {
    const srcPath = join(src, item);
    const destPath = join(dest, item);

    if (isDirectory(srcPath)) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
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

async function copyDocs() {
  try {
    // Check if docs folder exists
    const docsPath = join(process.cwd(), 'docs');
    if (!pathExists(docsPath)) {
      console.log(colorize('red', '❌ docs folder not found.'));
      process.exit(1);
    }

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
          if (target === 'basic-3d' && item === 'basic-3d') {
            continue;
          }
          targetDirs.push(item);
        }
      }
    }

    if (targetDirs.length === 0) {
      console.log(colorize('yellow', `⚠️  No directories found matching pattern '${pattern}'.`));
      return;
    }

    console.log(colorize('green', `Found ${targetDirs.length} target directories\n`));

    let successCount = 0;
    let failCount = 0;

    // Copy docs to each directory
    for (const dir of targetDirs) {
      const targetPath = join(process.cwd(), dir);
      const targetDocsPath = join(targetPath, 'docs');

      console.log(colorize('blue', `📁 Copying docs to ${dir}...`));

      try {
        // Remove existing docs folder if exists
        if (pathExists(targetDocsPath)) {
          console.log(colorize('yellow', `   ⚠️  Existing docs folder found - removing...`));
          removeDirectory(targetDocsPath);
        }

        // Copy docs folder
        copyDirectory(docsPath, targetDocsPath);
        console.log(colorize('green', `   ✅ Successfully copied`));
        successCount++;
      } catch (error) {
        console.log(colorize('red', `   ❌ Copy failed: ${error.message}`));
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

    console.log(colorize('cyan', '\nCopied project list:'));
    for (const dir of targetDirs) {
      const targetDocsPath = join(process.cwd(), dir, 'docs');
      if (pathExists(targetDocsPath)) {
        console.log(colorize('green', `  ✓ ${dir}`));
      } else {
        console.log(colorize('red', `  ✗ ${dir}`));
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
  console.log(colorize('cyan', 'npm run copy-docs') + colorize('gray', '       # Copy to basic-3d projects (default)'));
  console.log(colorize('cyan', 'npm run docs:copy') + colorize('gray', '       # Copy to basic-3d projects'));
  console.log(colorize('cyan', 'npm run docs:copy-all') + colorize('gray', '   # Copy to all projects'));
  console.log(colorize('cyan', 'npm run docs:help') + colorize('gray', '       # Show this help'));
  console.log('');
  console.log(colorize('yellow', 'With pnpm:'));
  console.log(colorize('cyan', 'pnpm copy-docs') + colorize('gray', '          # Copy to basic-3d projects (default)'));
  console.log(colorize('cyan', 'pnpm docs:copy') + colorize('gray', '          # Copy to basic-3d projects'));
  console.log(colorize('cyan', 'pnpm docs:copy-all') + colorize('gray', '      # Copy to all projects'));
  console.log(colorize('cyan', 'pnpm docs:help') + colorize('gray', '          # Show this help'));
  console.log('');
  console.log(colorize('yellow', 'Or run directly:'));
  console.log(colorize('cyan', 'node scripts/copy-docs.js --target=basic-3d'));
  console.log(colorize('cyan', 'node scripts/copy-docs.js --target=all'));
  console.log(colorize('cyan', 'node scripts/copy-docs.js --target=2d-phaser'));
  console.log('');
  console.log(colorize('yellow', 'Examples:'));
  console.log(colorize('gray', '  Copy to basic-3d projects: ') + colorize('cyan', 'npm run copy-docs'));
  console.log(colorize('gray', '  Copy to 2d-phaser projects: ') + colorize('cyan', 'node scripts/copy-docs.js --target=2d-phaser'));
  console.log(colorize('gray', '  Copy to all projects: ') + colorize('cyan', 'npm run docs:copy-all'));
  console.log('');
  console.log(colorize('red', '⚠️  Important: Run these commands from the root directory of the workspace!'));
  process.exit(0);
}

copyDocs();
