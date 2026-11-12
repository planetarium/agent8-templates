#!/usr/bin/env node

// Checks templates.json, the list agent8 picks new-project templates from:
// - valid JSON, an array of entries with the six fields
//   (name, label, description, githubRepo, path, tags)
// - every name is unique and names a folder in this repo: name === path and
//   the folder exists with a package.json
// Folders that are not listed are fine (kept for existing projects).
// `npm run templates:check` exits 1 on any problem.

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const colors = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', blue: '\x1b[34m' };
const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`;

const root = process.cwd();
const FILE = 'templates.json';
const STRING_FIELDS = ['name', 'label', 'description', 'githubRepo', 'path'];

const problems = [];

let entries;
try {
  entries = JSON.parse(readFileSync(join(root, FILE), 'utf8'));
} catch (e) {
  console.log(colorize('red', `❌ ${FILE}: ${e.message}`));
  process.exit(1);
}

if (!Array.isArray(entries)) {
  console.log(colorize('red', `❌ ${FILE} must be an array`));
  process.exit(1);
}

console.log(colorize('blue', `🔍 Checking ${entries.length} entries in ${FILE}...\n`));

const seen = new Set();
entries.forEach((t, i) => {
  const where = `#${i} ${t?.name ?? '(no name)'}`;
  for (const f of STRING_FIELDS) {
    if (typeof t?.[f] !== 'string' || t[f].trim() === '') problems.push(`${where}: "${f}" must be a non-empty string`);
  }
  if (!Array.isArray(t?.tags) || t.tags.length === 0 || t.tags.some((tag) => typeof tag !== 'string' || tag === '')) {
    problems.push(`${where}: "tags" must be a non-empty array of strings`);
  }
  if (typeof t?.name !== 'string') return;
  if (seen.has(t.name)) problems.push(`${where}: duplicate name`);
  seen.add(t.name);
  if (t.path !== t.name) problems.push(`${where}: path "${t.path}" differs from name`);
  if (!existsSync(join(root, t.name, 'package.json'))) problems.push(`${where}: no folder ${t.name}/ with a package.json`);
});

if (problems.length > 0) {
  for (const p of problems) console.log(colorize('red', `  ✗ ${p}`));
  console.log('');
  console.log(colorize('red', `❌ ${problems.length} problem(s) in ${FILE}.`));
  process.exit(1);
}

for (const t of entries) console.log(colorize('green', `  ✓ ${t.name}`));
console.log('');
console.log(colorize('green', '🎉 templates.json is valid and every name matches a folder.'));
