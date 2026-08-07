# QTS Backend

This boundary owns server-side application behavior:

- identity platform services and authorization;
- Prisma access, repositories, validation, audit and API helpers;
- database schema/seed and operational scripts;
- infrastructure manifests for PostgreSQL, Redis, Keycloak, Kong and observability.

The Next route handlers under `src/app/api` remain thin transport adapters for
the current single-runtime deployment. They import implementation from this
boundary through the `@backend/*` TypeScript alias. This keeps the public URLs
stable while allowing the backend to become an independently deployable
service behind Kong later.

Do not import browser components from this folder. Backend code may import the
shared domain contracts under `src/lib/domain` and `src/lib/validation`.
