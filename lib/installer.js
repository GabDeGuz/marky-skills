const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');

const CATEGORIES = {
  'must-have': {
    title: '⭐ Must-Have Core Stack (18 skills)',
    folder: 'must-have',
    aliases: ['must-have', 'musthave', 'must-haves', 'musthaves', 'core', 'essential']
  },
  'frontend': {
    title: 'Frontend & UI/UX Development (11 skills)',
    folder: 'frontend',
    aliases: ['frontend', 'front-end', 'ui', 'ux', 'react', 'web']
  },
  'backend': {
    title: 'Backend, Database & MCP (4 skills)',
    folder: 'backend',
    aliases: ['backend', 'back-end', 'api', 'db', 'database', 'sql']
  },
  'mobile-and-desktop': {
    title: 'Mobile (Expo) & Desktop (Tauri) (76 skills)',
    folder: 'mobile-and-desktop',
    aliases: ['mobile', 'mobile-and-desktop', 'expo', 'tauri', 'desktop', 'react-native']
  },
  'devops-and-git': {
    title: 'DevOps, Git Safety & CI/CD (6 skills)',
    folder: 'devops-and-git',
    aliases: ['devops', 'devops-and-git', 'git', 'cicd', 'ci-cd', 'github']
  },
  'architecture-and-code-quality': {
    title: 'Architecture & Code Quality (16 skills)',
    folder: 'architecture-and-code-quality',
    aliases: ['architecture', 'architecture-and-code-quality', 'arch', 'quality', 'testing', 'tdd']
  },
  'ai-and-agentic-workflows': {
    title: 'AI & Agentic Workflows (34 skills)',
    folder: 'ai-and-agentic-workflows',
    aliases: ['ai', 'agent', 'agentic', 'ai-and-agentic-workflows', 'workflows']
  },
  'design-and-creative': {
    title: 'Design & Creative (5 skills)',
    folder: 'design-and-creative',
    aliases: ['design', 'design-and-creative', 'creative', 'brand', 'slides']
  },
  'project-domain-logistics': {
    title: 'Project Domain & Logistics Patterns (6 skills)',
    folder: 'project-domain-logistics',
    aliases: ['logistics', 'fms', 'project-domain-logistics', 'domain']
  },
  'productivity-and-writing': {
    title: 'Productivity & Writing (14 skills)',
    folder: 'productivity-and-writing',
    aliases: ['productivity', 'writing', 'productivity-and-writing', 'obsidian', 'docs']
  }
};

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return 0;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function resolveTargetDir(options = {}) {
  if (options.target) {
    return path.resolve(process.cwd(), options.target);
  }

  if (options.global) {
    // Determine global Antigravity/Gemini skills directory
    const homeDir = os.homedir();
    return path.join(homeDir, '.gemini', 'config', 'skills');
  }

  if (options.cursor) {
    return path.resolve(process.cwd(), '.cursor', 'skills');
  }

  if (options.claude) {
    return path.resolve(process.cwd(), '.claude', 'skills');
  }

  // Default: Project workspace standard (.agents/skills)
  return path.resolve(process.cwd(), '.agents', 'skills');
}

function installSkills(categoryKey, targetDir) {
  if (categoryKey === 'all') {
    let totalInstalled = 0;
    const installedNames = new Set();

    for (const key of Object.keys(CATEGORIES)) {
      if (key === 'must-have') continue; // Avoid duplicate since must-have is subset of categories
      const catFolder = path.join(REPO_ROOT, CATEGORIES[key].folder);
      if (fs.existsSync(catFolder)) {
        const skills = fs.readdirSync(catFolder, { withFileTypes: true })
          .filter(d => d.isDirectory() && fs.existsSync(path.join(catFolder, d.name, 'SKILL.md')));

        for (const s of skills) {
          const srcSkill = path.join(catFolder, s.name);
          const destSkill = path.join(targetDir, s.name);
          copyDirRecursive(srcSkill, destSkill);
          installedNames.add(s.name);
        }
      }
    }
    return { count: installedNames.size, skills: Array.from(installedNames) };
  }

  // Specific category match
  const matchedKey = Object.keys(CATEGORIES).find(k => {
    if (k.toLowerCase() === categoryKey.toLowerCase()) return true;
    return CATEGORIES[k].aliases.includes(categoryKey.toLowerCase());
  });

  if (!matchedKey) {
    throw new Error(`Unknown category: "${categoryKey}". Run with --list to see all categories.`);
  }

  const catFolder = path.join(REPO_ROOT, CATEGORIES[matchedKey].folder);
  const installedNames = [];

  if (fs.existsSync(catFolder)) {
    const skills = fs.readdirSync(catFolder, { withFileTypes: true })
      .filter(d => d.isDirectory() && fs.existsSync(path.join(catFolder, d.name, 'SKILL.md')));

    for (const s of skills) {
      const srcSkill = path.join(catFolder, s.name);
      const destSkill = path.join(targetDir, s.name);
      copyDirRecursive(srcSkill, destSkill);
      installedNames.push(s.name);
    }
  }

  return {
    category: CATEGORIES[matchedKey].title,
    count: installedNames.length,
    skills: installedNames
  };
}

module.exports = {
  CATEGORIES,
  resolveTargetDir,
  installSkills,
  copyDirRecursive
};
