# QTS Technology Design System

## Direction And Provenance

QTS is a Vietnamese B2B technology company with a public ecosystem website and a client operations portal. The public experience uses the information architecture and decision rhythm studied from [AMIS MISA](https://amis.misa.vn/): a centered ecosystem promise, grouped product discovery, problem-led solutions, product proof, implementation process, resources, FAQ, consultation, and a dense footer. Only this structural DNA is retained. QTS does not copy AMIS/MISA words, product names, visual assets, brand marks, claims, or source code.

The QTS expression is exact, calm, and service-oriented: a cool light canvas, dark ink, cobalt for decisions, and cyan only for operational data. It is not neon, illustrative cyberpunk, or a collection of decorative cards.

## Atmosphere

- Density: 5/10. Long-form and information-rich, but each section has one clear job.
- Variance: 3/10. The centered hero is intentional and suited to the ecosystem overview.
- Motion: 4/10. Functional feedback only; no perpetual loops or decorative parallax.
- Voice: direct Vietnamese, specific about process and careful about unverified proof.

## Typography

- Display: Space Grotesk, weights 500-700, for page titles, section titles, numbers, and the QTS wordmark.
- Body: Be Vietnam Pro, weights 400-700, for navigation, paragraphs, forms, tables, and controls.
- Hero title uses discrete responsive sizes: 40.8px mobile, 60px tablet, 72px desktop, and 76px wide desktop.
- Compact portal surfaces use 12-24px text. Hero-scale type never appears inside cards, sidebars, dialogs, or tools.
- Letter spacing is always `0`. Vietnamese words may wrap with `overflow-wrap: anywhere`.

## Color And Tokens

- All colors use semantic OKLCH tokens in `tokens.css`.
- `--color-canvas` and `--color-surface` establish quiet full-width bands.
- `--color-ink` carries primary text and the dark portal rail.
- `--color-brand` is limited to primary actions, selected states, small signals, and focus rings.
- `--color-data` is reserved for charts and operational highlights.
- Success, warning, and danger always pair color with text or an icon.
- Components do not introduce raw colors or local font stacks.

## Public Macrostructure

1. N10 morphing header with N11 grouped mega panels and a modal mobile drawer.
2. H9 centered product hub with factual promise, benefits, two decisions, and a live QTS Portal surface.
3. Compact capability rule followed by a five-group Ecosystem Index.
4. Problem-led solution tabs, QTS Portal story, and six-stage implementation flow.
5. Engineering principles, illustrative case studies, factual demo scope, and articles.
6. FAQ, consultation form, then an Ft5 statement footer with a genuine sitemap.

The Portal keeps the Workbench macrostructure: desktop rail, utility header, and dense role-aware stage.

## Layout And Components

- Marketing max-width is 1216px with 20px mobile and 32px desktop gutters.
- Page sections are unframed full-width bands. Cards are for repeated entities, dialogs, and genuine tools; cards are never nested.
- Product groups use borders and varied grid spans, not floating containers. Product rows expose an icon, name, description, and destination.
- Radius is 4-8px for controls and records; only major product surfaces may use 12px.
- Buttons are 40-44px minimum. Use icon plus text for commands and labelled icon-only controls for familiar utilities.
- Form fields have visible labels, 44px targets, help or error text, and disabled loading states.
- Tables retain header context and provide compact mobile records instead of page-level horizontal scrolling.
- Empty, loading, error, and success states explain what happened and expose one relevant next action.

## Interaction And Motion

- Mega menus open by click and switch by hover only after a group is already open; Escape restores focus to the trigger.
- Tabs support arrows, Home, and End. Dialogs trap focus. Native FAQ disclosure remains keyboard-operable.
- Transitions use transform, opacity, background, border, or color with 140-360ms semantic timing tokens.
- No `transition: all`, autoplay carousel, infinite decoration, or motion required to understand content.
- `prefers-reduced-motion` reduces all nonessential transitions and animations.

## Content Integrity

- Use concise Vietnamese action labels and honest scope language.
- Unknown company facts remain bracketed placeholders such as `[Điền địa chỉ]`.
- Demo metrics describe inspectable software scope, never business achievement.
- Case studies are explicitly marked as illustrative until approved customer evidence exists.
- Demo credentials live only in README and never appear in production UI.
- Never invent clients, testimonials, awards, addresses, adoption metrics, or outcomes.

## Responsive And Accessibility

- Verify 320, 360, 375, 414, 768, 1024, 1440, and 1920px.
- No page-level horizontal scroll. Grids use `minmax(0, 1fr)`; compact labels wrap only when necessary.
- Preserve visible focus, skip link, landmarks, semantic headings, labels, keyboard menus/dialogs, and WCAG AA contrast.
- Hover is supplementary. Every workflow works with touch and keyboard, and practical targets are at least 44px.
