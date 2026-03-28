---
trigger: always_on
---

Stack: Bun, Cloudflare, Monorepo.
Database: Neon (Project: `shimokitan` only).
UI: `shadcn/ui`. Use high-contrast colors and readable fonts.
Architecture: Shared-first; move logic to be shared in monorepo immediately.
i18n: Use translation keys for all user-facing strings. (en as default,id and ja).
Tone: Balance "Vibey" (shimokitan lore) with "Professional" (robust/standard).
Maintenance: Audit existing packages before adding new ones.
Auth: Neon Auth.
Project Type: Enterprise-grade, Scaling Ready.
Responsiveness: Always make a design with mobile, tablet, and desktop in mind.
Project Existing: `main` as our main public facing face and `signal` as dev2residents communication platform (bulletin board/magazines).