# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Easy Dataset is a web application for creating LLM fine-tuning datasets. Users upload documents, the system splits them into chunks, generates questions via LLM APIs, generates answers, and exports structured datasets. It also supports model evaluation with eval datasets and blind testing (Arena).

## Tech Stack

- **Framework**: Next.js 14 (App Router) — JavaScript (not TypeScript)
- **UI**: Material-UI v5, Emotion, Framer Motion
- **Database**: SQLite via Prisma ORM
- **State Management**: Jotai (atoms in `lib/store.js`)
- **AI SDK**: Vercel AI SDK (`ai` package) with multiple providers
- **i18n**: i18next (locales in `locales/` — en, zh-CN, tr, pt-BR, it)
- **Desktop**: Electron (entry: `electron/main.js`)
- **Package Manager**: pnpm (npm also works)

## Common Commands

```bash
pnpm dev              # Start dev server on :1717 (auto-runs prisma db push)
pnpm build            # Production build (auto-runs prisma db push)
pnpm start            # Start production server on :1717
pnpm lint             # Run Next.js linter
pnpm prettier         # Format all files with Prettier
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:push          # Push Prisma schema to SQLite
pnpm db:template      # Generate template DB for Electron packaging
```

There are no automated tests in this project.

## Architecture

### Data Flow

```
Document Upload → Text Splitting → Question Generation → Answer Generation → Dataset Export
      ↓                ↓                    ↓                    ↓                ↓
  lib/file/       lib/db/chunks      lib/services/questions   lib/services/datasets   components/export/
                  lib/file/split-markdown
```

### Key Directories

- **`app/`** — Next.js App Router pages and API routes. Project-scoped routes live under `app/projects/[projectId]/`.
- **`app/api/projects/[projectId]/`** — All API routes for a project (chunks, datasets, questions, files, tasks, tags, images, eval-datasets, etc.). Each subdirectory has a `route.js`.
- **`components/`** — React components organized by feature (text-split, questions, datasets, export, settings, etc.).
- **`lib/db/`** — Prisma database access layer. `lib/db/index.js` exports the singleton `db` Prisma client. Individual modules (chunks, questions, datasets, tags, etc.) wrap Prisma queries.
- **`lib/llm/`** — LLM integration. `core/index.js` has the `LLMClient` class that dispatches to provider-specific clients in `core/providers/` (openai, ollama, zhipu, openrouter, alibailian, minimax). Prompts are in `lib/llm/prompts/`.
- **`lib/services/`** — Business logic. `tasks/` contains task processors for async batch operations (question generation, answer generation, file processing, data cleaning, etc.). `questions/`, `datasets/`, `multi-turn/`, `images/`, `eval/`, `evaluation/` contain service logic.
- **`lib/file/`** — Document processing. `file-process/` handles PDF, DOCX, EPUB, TXT, Markdown. `split-markdown/` is the intelligent text splitter.
- **`lib/api/`** — Client-side API helpers (file, chunk, task).
- **`hooks/`** — Shared React hooks (useDebounce, useSnackbar, useTaskSettings, etc.).
- **`prisma/schema.prisma`** — Database schema. All models belong to a `Projects` parent with cascade delete.
- **`constant/`** — Global constants (model providers, task statuses, file limits).

### LLM Provider System

`LLMClient` (`lib/llm/core/index.js`) maps provider IDs to client classes. Unknown/custom providers fall back to `OpenAIClient` (OpenAI-compatible API). Adding a new provider means creating a class in `lib/llm/core/providers/` and registering it in the `clientMap` inside `_createClient()`.

### Task System

Background batch operations (file processing, question generation, answer generation, etc.) use a task model in the DB. Tasks are created with status `PROCESSING(0)` and progress through `COMPLETED(1)` or `FAILED(2)`. `lib/services/tasks/index.js` dispatches by `taskType` string. Task recovery runs on startup (`recovery.js`).

### Dual Storage (Legacy + Prisma)

The app migrated from filesystem-based JSON storage to Prisma/SQLite. `lib/db/base.js` still has file-based helpers (`readJsonFile`, `writeJsonFile`) used by some modules. `lib/db/fileToDb.js` handles migration. The `local-db/` directory is the legacy filesystem store location.

### Path Alias

`@/*` maps to project root (configured in `jsconfig.json`).

### Conventions

- Conventional commits enforced via commitlint + husky pre-commit hook (lint-staged runs Prettier).
- Prettier config: single quotes, no trailing commas, 120 char print width, no semicolons wait — actually `semi: true`.
- i18n keys use dot notation; all user-facing strings should use `t()` from `react-i18next`.
- Pages co-locate hooks in a `hooks/` subfolder and sub-components in a `components/` subfolder within their route directory.

### Environment

- `DATABASE_URL` in `.env` defaults to `file:./db.sqlite` (relative to `prisma/`).
- `LOCAL_DB_PATH` defaults to `./local-db`.
- App runs on port 1717.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at `specs/002-feishu-wiki-integration/plan.md`.
Key docs: `specs/002-feishu-wiki-integration/spec.md` (feature spec),
`specs/002-feishu-wiki-integration/data-model.md` (Prisma schema additions),
`specs/002-feishu-wiki-integration/contracts/feishu-api-contract.md` (API contracts).
<!-- SPECKIT END -->
