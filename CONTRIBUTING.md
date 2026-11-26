# Contributing to Gebeta

Thanks for contributing to **Gebeta**.

## Prerequisites

- **Node.js `>= 22.18`** (`24 LTS` recommended, so `node --test tests/domain.test.ts` runs TypeScript tests natively)
- **pnpm `12.21.0`** (defined in `package.json#packageManager` and `.mise.toml`)

## Getting Started

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

## Branch & Commit Workflow

1. Create a short-lived branch from `main` using a descriptive prefix:
   - `feat/<slug>` — new user-facing capability
   - `fix/<slug>` — bug fix
   - `refactor/<slug>` — internal restructuring without behavior change
   - `docs/<slug>` — documentation or README assets
   - `chore/<slug>` / `ci/<slug>` — tooling, maintenance, or GitHub Actions
2. Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat(domain): ...`, `fix(ui): ...`, `test(domain): ...`, `docs(readme): ...`).
3. Keep each commit focused on a single logical change and avoid committing build artifacts (`dist/`), `.env*` files, or machine-specific paths.

## Required Checks Before Opening a PR

Run all four verification checks locally before pushing:

```bash
pnpm run format:check
pnpm run typecheck
pnpm test
pnpm run build
```

When adding or modifying UI strings in `src/i18n.ts`, update every locale file in `src/locales/` (`am.ts`, `ar.ts`, `fr.ts`, `om.ts`, `ti.ts`). The `tests/domain.test.ts` suite enforces strict key parity across all 6 languages.
