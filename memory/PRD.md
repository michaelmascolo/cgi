# Collaborative Democracy Lab — PRD

## Original Problem Statement
Build "Collaborative Democracy Lab," an app that helps users transform polarized political/social positions into underlying human needs and collaborative solutions. Guided flow: Landing → Issue Input → Position Mapping → Needs Identification → Collaborative Solutions → Reflection → Save/Export. Nonpartisan, calm/civic design (warm cream). Never tells users who's right; distinguishes positions from needs; generates integrative (not compromise) solutions; preloaded examples; expandable.

## User Choices
- AI model: Claude Sonnet 4.6 (via Emergent LLM key / emergentintegrations)
- Auth: Email + password (custom JWT, httpOnly cookies)
- Export: copy, download markdown, and PDF
- Examples: pre-fill issue + positions only (no prefilled solutions)
- Design: warm cream civic palette (Spectral + Figtree fonts)

## Architecture
- Backend: FastAPI (`server.py` routes/auth, `llm.py` Claude calls, `examples.py` data), MongoDB (motor). JWT auth with bcrypt, brute-force lockout, admin seed.
- Frontend: React + Tailwind + framer-motion + sonner. AuthContext + LabContext. Wizard (5 steps) + Dashboard. jsPDF for PDF export.
- Endpoints: /api/auth/*, /api/ai/{opposing-position,concerns,needs,solutions}, /api/maps (CRUD), /api/examples.

## User Personas
- Reflective citizens, students, educators, mediators wanting to understand both sides of an issue.

## Core Requirements (static)
- Nonpartisan facilitation; positions→needs translation; integrative solution generation; save/export; preloaded examples; per-user persistence.

## Implemented (2026-06-25)
- Auth (register/login/logout/me/refresh) with JWT cookies + admin seed.
- Full 5-step wizard with AI at each stage (opposing position, concerns, needs, solutions).
- Editable two-column needs; solution cards with needs met A/B, unaddressed, improvements.
- Reflection form; Save/Copy/Markdown/PDF export; Dashboard with saved maps + 6 starter examples.
- Tested: backend 19/19, frontend 21/21 E2E. ObjectId guard added (bad map id → 404).

## Backlog
- P1: Google social login option; share a read-only issue-map link.
- P2: X-Forwarded-For-based rate limiting; expandable admin UI to add new starter examples; streaming AI responses for perceived speed.

## Next Tasks
- Gather user feedback on the wizard tone/output quality; consider sharing links and more example issues (Climate, Education, Healthcare).
