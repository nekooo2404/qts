# QTS Frontend Client

This boundary owns the public website and customer Portal experience:

- marketing and landing-page components;
- Portal layouts, workflow screens and browser forms;
- client-facing navigation/configuration.

The root `src/app` directory currently keeps the Next App Router route shell
so `/`, `/portal` and existing SEO routes do not change. Route modules import
the implementation from this boundary through `@client/*`. The shell can be
moved to a standalone Next application when the backend API contract is the
only data dependency.

Do not add admin-only controls or platform identity policy decisions here.
