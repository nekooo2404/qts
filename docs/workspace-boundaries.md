# QTS Workspace Boundaries

QTS currently ships as one Next.js runtime so the public URLs stay stable. The
source is split into three ownership boundaries and can be extracted into
independent deployables later.

```text
backend/
  src/server/       Identity services, authorization, repositories and tests
  src/generated/    Generated Prisma client (never edit by hand)
  prisma/           Schema, migrations and demo seed
  scripts/          Identity smoke and workflow checks
  infra/            PostgreSQL, Redis, Keycloak, Kong and monitoring manifests

frontend-client/
  src/components/public/  Marketing and landing-page UI
  src/components/portal/  Customer Portal UI and workflows
  src/config/              Marketing and Portal content/navigation

frontend-admin/
  src/components/admin/   Platform Admin and Identity Console UI

src/                         Next route shell and shared platform foundation
  app/                       URL adapters for /, /portal, /admin and /api
  components/shared, ui/    Shared primitives used by both frontends
  config/admin-navigation.ts Shared navigation contract used by Portal shell
  lib/                       Shared auth/domain/validation utilities
```

## Import rules

- `@backend/*` is for server-only code. It must never be imported by a browser
  component.
- `@client/*` is for public and Portal components/configuration.
- `@admin/*` is for Admin components/configuration.
- `@/*` is reserved for the route shell and shared foundation under `src/`.
- API route handlers remain under `src/app/api` as thin transport adapters. The
  business implementation belongs under `backend/src/server`.

## Database commands

Prisma is configured at the repository root, but its schema and migrations live
under `backend/prisma`:

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

For local SQLite, `DATABASE_URL=file:./dev.db` resolves to
`backend/prisma/dev.db`. Production identity data uses the PostgreSQL services
described in `backend/infra` and `docker-compose.identity.yml`.

## Extraction plan

1. Keep the route shell while contracts are stabilized.
2. Expose `backend/src/server` behind Kong as the Identity Platform API.
3. Move `frontend-client` and `frontend-admin` route shells into independent
   Next applications once all data access goes through the API contract.
4. Keep shared DTOs and permission keys versioned as a separate package during
   the migration to independent deployments.
