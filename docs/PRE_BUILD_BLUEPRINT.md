# Kadjelo Notes — Six Foundational Pre-Build Architecture & Product Documents

This directory stores the six pre-build architectural documents finalized prior to building **Kadjelo Notes**:

1. **Product Requirement Document (PRD)** — 4 personas and 16 core/advanced features (`F-01` through `F-16`) with concrete Acceptance Criteria.
2. **Technical Requirements Document (TRD)** — React 18 + Vite 5, Express Serverless API (`api/index.js`), Neon Serverless PostgreSQL (`@neondatabase/serverless`), Vercel deployment, WebAuthn Biometrics, Service Worker PWA, and security compliance.
3. **App Flow** — State navigation diagram, Fitts's Law mobile thumb-zone ergonomics, Progressive Disclosure, 5-second Undo toast, and dead-end mitigations.
4. **Design Brief** — **Kadjelo Notes** brand identity, squircle monogram, 4 signature themes (*Obsidian Indigo, Emerald Studio, Amber Titanium, Cyber Rose* in Dark & Light modes), 8 card tints, optical typography scale, and strict 100% Vector SVG Iconography (zero emojis).
5. **Database Schema & RBAC** — Neon PostgreSQL `users` & `notes` schema, JSONB field structures, LocalStorage-to-Cloud persistence mapping, and Role-Based Access Control matrix.
6. **Phased Implementation Plan** — 6 sequential build phases and verification checkpoints.

*(See the full specification in the project artifact `implementation_plan.md`.)*
