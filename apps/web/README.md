# Pathfinder Web

The authenticated Pathfinder Release 1 application. It presents the current
Route, Focus Action, Proposed and Confirmed Facts, structured Reroutes, Route
History, and account privacy controls.

## Local development

From the repository root, install dependencies and prepare a throwaway local
Postgres database:

```sh
pnpm install
createdb pathfinder_review
POSTGRES_URL=postgres://localhost:5432/pathfinder_review pnpm --filter @pathfinder/core db:migrate
```

Then start the web application:

```sh
cd apps/web
POSTGRES_URL=postgres://localhost:5432/pathfinder_review \
  AUTH_SECRET=$(openssl rand -base64 32) \
  pnpm dev
```

The canonical product and architecture requirements live in
[`../../docs`](../../docs/00-governance/documentation-index.md). The web client
renders published Route output; it does not sequence Actions or expose the
Dependency Graph.

## Quality gates

Run these from the repository root before opening a pull request:

```sh
pnpm typecheck
pnpm lint
POSTGRES_URL=postgres://localhost:5432/pathfinder_review \
  AUTH_SECRET=$(openssl rand -base64 32) \
  pnpm test
pnpm build
python3 scripts/validate_documentation.py
```
