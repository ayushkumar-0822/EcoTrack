# AGENTS.md

This file provides guidance to AI coding agents and human contributors working in the **EcoTrack** repository.

## Project Overview

**EcoTrack** is a smart, community-driven waste management and local cleanliness tracking web platform. It enables residents to track waste collection schedules, report illegal dumping or overflowing bins in real time, view live neighborhood impact metrics, and engage in local environmental initiatives.

## Tech Stack & Architecture

- **Frontend Core**: Semantic HTML5, CSS3 Custom Properties (Design System), Vanilla JavaScript (ES6+ Modules/Classes).
- **Tooling & Integrations**:
  - **CodeRabbit Antigravity Plugin** (`.agents/plugins/coderabbit`): Automated code reviews, severity preservation, quality gates, and autofix pipelines.
  - **Git Worktree Runner** (`tools/git-worktree-runner` & `gtr.ps1`): Isolated parallel feature development, automated environment isolation, and multi-agent branches.
  - **Configuration**: `.coderabbit.yaml` for repository-wide CodeRabbit review instructions.

## Development & Worktree Workflows

### 1. Using Git Worktree Runner (`gtr`)
To work on isolated features without polluting the working tree:
```powershell
# Create an isolated worktree for a feature branch:
.\gtr.ps1 new feature/report-issue

# List active worktrees:
.\gtr.ps1 list

# Run command inside a worktree:
.\gtr.ps1 run feature/report-issue git status

# Remove worktree when merged:
.\gtr.ps1 rm feature/report-issue
```
*(On Linux/macOS/Git Bash, use `tools/git-worktree-runner/bin/git-gtr <command>`)*

### 2. CodeRabbit Review & Analysis
Code reviews run via CodeRabbit with native severity tracking (`critical`, `major`, `minor`, `trivial`, `info`):
```bash
# Review uncommitted changes
coderabbit review --agent

# Review against main
coderabbit review --agent --base main
```
Or trigger Antigravity slash commands:
- `/coderabbit-review`: Triggers comprehensive code review of changes.
- `/coderabbit-autofix`: Guides safe fixes of flagged issues.

## Senior Engineering Standards

All contributions must follow these non-negotiable principles:
1. **Accessibility (WCAG 2.1 AA)**:
   - All interactive elements (`<button>`, `<a>`, `<input>`) must have descriptive text or `aria-label`.
   - Modals and dropdowns must trap focus, handle Escape key, and toggle `aria-expanded`/`aria-hidden`.
   - Respect `prefers-reduced-motion: reduce`.
2. **Security & Input Sanitization**:
   - Never inject raw user inputs into DOM using `innerHTML`. Use `textContent` or sanitized DOM node creation.
   - Prevent XSS, CSRF, and prototype pollution in client storage.
3. **Performance & Core Web Vitals**:
   - Images must have explicit aspect ratios and `loading="lazy"`.
   - Debounce scroll/resize listeners; leverage `IntersectionObserver` for animations and unobserve after trigger.
4. **Resilience**:
   - Fail gracefully if `localStorage`, `IntersectionObserver`, or external CDN assets are blocked or fail to load.
