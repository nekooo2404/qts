# QTS Frontend Admin

This boundary owns governance and platform administration:

- `/admin` governance screens;
- Identity Platform tenant, membership, application, IdP, policy and audit
  consoles;
- admin-only navigation and UI state.

The root `src/app` directory keeps the Next App Router route shell for the
current single-runtime deployment. Admin route modules import implementation
from this boundary through `@admin/*`, while authorization remains enforced
by backend services and route guards.

Never rely on hiding an admin control in this folder as an authorization
boundary; every mutation must still be checked by the backend.
