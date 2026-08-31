---
name: autonomous-logistics-changelog
description: Automatically maintains a comprehensive, human-readable audit trail of all agentic actions in docs/agent_changelog.md. Use this skill to log changes to routing, dispatch, tracking, inventory, frontend, and backend components after every task.
---

# Autonomous Logistics Changelog

Automatically maintains a comprehensive, human-readable audit trail of all agentic actions in a single Markdown file.

## Workflow

Automatically execute this workflow immediately upon completing any user request, modifying any files, or running any terminal commands. Do not wait for the user to ask you to log the changes.

### 1. Analyze Actions
Review the work you just completed, including tool executions, file edits, and codebase reasoning.

### 2. Categorize
Group your changes into one or more of these logistics domains:
- 🚚 **Routing & Dispatch** (maps, algorithms, driver logic, APIs)
- 📦 **Tracking & Inventory** (status updates, webhooks, DB schemas)
- 🖥️ **Frontend & Dashboard** (React/HTML, CSS, UI interactions)
- ⚙️ **Backend & Infrastructure** (server configs, package installs, CI/CD)

### 3. Format
Generate a log entry matching the structure below.

### 4. Write
Use your file management tools to append (DO NOT overwrite) the formatted log entry to `docs/agent_changelog.md`. If the `docs` directory or the file does not exist, create them first.

## Output Schema

Append exactly this structure to the file. Ensure the visual dividers are preserved.

```markdown
## 🕒 Session: YYYY-MM-DD HH:MM:SS
**Prompt:** _[Insert the user's exact request here]_

### 🛠️ Changes Executed

[For each applicable category above, provide a bulleted list of specific changes. Example:]
* **📦 Tracking & Inventory:** Added a `status_logs` table to track package movements over time.
* **🖥️ Frontend & Dashboard:** Updated the delivery timeline CSS for better mobile responsiveness.

### 📁 Files Affected
* `[file_path_1]` (Created/Modified/Deleted)
* `[file_path_2]` (Created/Modified/Deleted)

---
```
