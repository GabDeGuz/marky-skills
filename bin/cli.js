#!/usr/bin/env node

const readline = require('readline');
const path = require('path');
const { CATEGORIES, resolveTargetDir, installSkills } = require('../lib/installer');

const args = process.argv.slice(2);

function printBanner() {
  console.log('\x1b[36m%s\x1b[0m', '==================================================');
  console.log('\x1b[1m\x1b[33m%s\x1b[0m', '          🚀 MARKY SKILLS INSTALLER              ');
  console.log('\x1b[36m%s\x1b[0m', '==================================================\n');
}

function printHelp() {
  printBanner();
  console.log(`Usage:
  npx marky-skills <command> [options]

Commands:
  all                        Install ALL 172 skills across all categories
  must-have (or must-haves)  Install 18 essential full-stack web, backend & DevOps skills
  frontend                   Install Frontend UI/UX, React, Next.js & Styling skills (11)
  backend                    Install Backend, APIs, Database & Security skills (4)
  mobile (or tauri, expo)    Install Mobile (Expo) & Desktop (Tauri) skills (76)
  devops (or git)            Install DevOps, Git safety & CI/CD skills (6)
  architecture (or quality)  Install Architecture, Code Quality & TDD skills (16)
  agentic (or ai)            Install AI Agentic Workflows & Grilling skills (34)
  design                     Install Design, Branding, Slides & Systems skills (5)
  logistics                  Install Logistics FMS & RBAC patterns (6)
  writing (or obsidian)      Install Writing, Obsidian & Productivity skills (14)

Options:
  -g, --global               Install into global AI IDE config (~/.gemini/config/skills)
  --cursor                   Install into .cursor/skills
  --claude                   Install into .claude/skills
  --target <dir>             Install into a custom target directory
  -l, --list                 List all available categories and skill counts
  -h, --help                 Show this help message

Quick Examples:
  npx marky-skills must-have
  npx marky-skills all
  npx marky-skills frontend
  npx marky-skills backend --global
`);
}

function printList() {
  printBanner();
  console.log('Available Categories:\n');
  console.log('  * \x1b[32mmust-have\x1b[0m            ⭐ 18 Essential Full-Stack & Deployment Skills');
  console.log('  * \x1b[32mall\x1b[0m                  🚀 All 172 Skills');
  for (const [key, val] of Object.entries(CATEGORIES)) {
    if (key === 'must-have') continue;
    console.log(`  * \x1b[32m${key.padEnd(20)}\x1b[0m ${val.title}`);
  }
  console.log('\nRun `npx marky-skills <category>` to install.');
}

async function promptInteractive() {
  printBanner();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('What would you like to install?\n');
  console.log('  [1] ⭐ \x1b[1mMust-Haves Only\x1b[0m (18 essential full-stack web, backend & git skills)');
  console.log('  [2] 🚀 \x1b[1mAll Skills\x1b[0m (172 skills across all categories)');
  console.log('  [3] 🎨 \x1b[1mFrontend & UI/UX\x1b[0m (React, Next.js, Styling, Impeccable)');
  console.log('  [4] ⚙️  \x1b[1mBackend & Database\x1b[0m (APIs, SQL tuning, Security)');
  console.log('  [5] 📱 \x1b[1mMobile & Desktop\x1b[0m (Expo Mobile & Tauri Desktop suite)');
  console.log('  [6] 🛠️  \x1b[1mDevOps & Git\x1b[0m (Git safety guardrails, Pre-commit)');
  console.log('  [7] 🏛️  \x1b[1mArchitecture & Quality\x1b[0m (Karpathy, Reviews, TDD)');
  console.log('  [8] 🤖 \x1b[1mAI & Agentic Workflows\x1b[0m (Grilling, Handoffs, Subagents)');
  console.log('  [9] 📦 \x1b[1mOther Categories\x1b[0m (Design, Logistics, Writing)\n');

  const choice = (await question('Select an option (1-9) [Default: 1]: ')).trim() || '1';

  let selectedCategory = 'must-have';
  if (choice === '2') selectedCategory = 'all';
  else if (choice === '3') selectedCategory = 'frontend';
  else if (choice === '4') selectedCategory = 'backend';
  else if (choice === '5') selectedCategory = 'mobile-and-desktop';
  else if (choice === '6') selectedCategory = 'devops-and-git';
  else if (choice === '7') selectedCategory = 'architecture-and-code-quality';
  else if (choice === '8') selectedCategory = 'ai-and-agentic-workflows';
  else if (choice === '9') {
    console.log('\nSub-options: [a] Design & Creative, [b] Logistics FMS, [c] Writing & Obsidian');
    const sub = (await question('Select (a-c): ')).trim().toLowerCase();
    if (sub === 'a') selectedCategory = 'design-and-creative';
    else if (sub === 'b') selectedCategory = 'project-domain-logistics';
    else if (sub === 'c') selectedCategory = 'productivity-and-writing';
  }

  console.log('\nWhere should skills be installed?');
  console.log('  [1] 📁 Current Project Workspace (.agents/skills)');
  console.log('  [2] 🌐 Global Antigravity Config (~/.gemini/config/skills)');
  console.log('  [3] ⚡ Cursor IDE (.cursor/skills)');
  console.log('  [4] 📝 Custom Path\n');

  const destChoice = (await question('Select target destination (1-4) [Default: 1]: ')).trim() || '1';
  let targetOptions = {};

  if (destChoice === '2') targetOptions.global = true;
  else if (destChoice === '3') targetOptions.cursor = true;
  else if (destChoice === '4') {
    const custom = (await question('Enter target path: ')).trim();
    if (custom) targetOptions.target = custom;
  }

  rl.close();

  executeInstall(selectedCategory, targetOptions);
}

function executeInstall(categoryKey, options = {}) {
  try {
    const targetDir = resolveTargetDir(options);
    console.log(`\n⏳ Installing \x1b[33m${categoryKey}\x1b[0m to: \x1b[32m${targetDir}\x1b[0m...\n`);

    const result = installSkills(categoryKey, targetDir);

    console.log('\x1b[32m%s\x1b[0m', `✔ Successfully installed ${result.count} skills!`);
    console.log(`📁 Destination: ${targetDir}\n`);

    console.log('Installed skills:');
    result.skills.forEach(s => console.log(`  + ${s}`));

    console.log('\n\x1b[36m%s\x1b[0m', '✨ Skills are now active and ready in your workspace!\n');
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `\n✖ Error: ${err.message}\n`);
    process.exit(1);
  }
}

// Main execution parser
async function main() {
  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    return;
  }

  if (args.includes('-l') || args.includes('--list')) {
    printList();
    return;
  }

  const options = {};
  if (args.includes('-g') || args.includes('--global')) options.global = true;
  if (args.includes('--cursor')) options.cursor = true;
  if (args.includes('--claude')) options.claude = true;

  const targetIdx = args.indexOf('--target');
  if (targetIdx !== -1 && args[targetIdx + 1]) {
    options.target = args[targetIdx + 1];
  }

  // Filter out flag options to find positional category command
  const positional = args.filter(a => !a.startsWith('-') && args[args.indexOf(a) - 1] !== '--target');

  if (positional.length === 0) {
    // If running with just options like --global or --must-have flags
    if (args.includes('--all')) {
      executeInstall('all', options);
    } else if (args.includes('--must-have') || args.includes('--must-haves')) {
      executeInstall('must-have', options);
    } else {
      await promptInteractive();
    }
  } else {
    const command = positional[0].toLowerCase();
    executeInstall(command, options);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
