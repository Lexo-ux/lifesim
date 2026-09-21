# LifeSim — rules for every development agent

All future agents working on LifeSim must follow these rules within the scope of the user's task. Inspect the relevant implementation and documentation before changing a system. Finish the requested task; do not advance to the next roadmap stage automatically.

## Sources of truth

- Existing behavior: repository code and tests. Earlier prompts are not evidence of implementation.
- Narrative canon: `/lore`. Task 02 establishes the future world; read `lore/CANON_RULES.md` and the relevant specialized documents. Respect CANON, PROVISIONAL CANON, TBD, RESERVED and NON-CANON EXAMPLE labels.
- Technical architecture and current limitations: `/docs`.
- Runtime content definitions: `/content`.
- Read `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md`, and `docs/DEVELOPMENT.md` before restructuring.

## Canon

Never invent or silently modify major canon. If implementation conflicts with canon, identify the conflict, preserve established canon, and document a proposed change for the relevant narrative task. Do not silently turn existing V3 runtime details into the future world bible; consult `docs/CANON_MIGRATION.md` before adapting them. Keep approved changes traceable; unresolved proposals are not canon. Do not fill the reserved cause, repeated-life explanation or True Resolution with invented answers.

## Architecture and engine

Keep engine rules, game systems, narrative content, presentation, assets and canon separate. Do not put large amounts of story text into UI or engine modules. Prefer structured, data-driven Moments. Adding a normal Moment should not require changing the engine.

Engine rules must not depend on named characters or specific story events unless technically unavoidable. Use roles, flags, traits, tags or declarative conditions instead of `npc.name === "Adrian Voss"`. Existing V3 exceptions are recorded as debt; do not propagate them to new content or rewrite their behavior during unrelated tasks.

`content/` must not import `src/`, UI, tools or tests. Runtime modules must not import development tools. State and PRNG remain outside the DOM. Inspect the documented legacy dependencies between engine and systems before attempting to remove them.

## Content and NPCs

**Moment** is the technical term for one narrative gameplay unit. Current V3 supports binary Moments only; `card`, `CARDS`, `event` and saved property names remain compatibility names. Do not rename saved identifiers cosmetically.

Historical NPCs and generated/personal NPCs are different concepts. Historical identities remain stable across lives unless canon explicitly changes; generated/personal identities may vary. Current V3 recurring NPCs have not been classified as future historical canon. Do not infer that classification from their stable IDs.

## Randomness

Never adjust probabilities or randomness to make rare results easier unless explicitly instructed. Future rank rarity must not receive hidden pity mechanics. Preserve PRNG call order during mechanical refactors; never add random calls merely for logging or presentation.

## Saves and configuration

Never intentionally invalidate saves without migration or explicit version handling. Preserve storage keys and Moment/NPC IDs; test legacy data. A package version is not a save schema version. See `docs/SAVES.md` and `src/config/persistence.js`.

## Deployment and security

Preserve static-host and GitHub Pages compatibility unless a future task explicitly changes infrastructure. Protect relative paths, `CNAME`, the custom domain, metadata, favicon, SEO, ads and verification files. Preserve any future service worker/manifest; neither exists today. Do not add a backend, tracking or accounts as incidental infrastructure.

Never commit API secrets, private keys, tokens or credentials. `.gitignore` is not a secrecy boundary. Everything in this public repository and shipped runtime content is discoverable. Keep future private narrative source material outside the public repository; do not create another repository without an explicit task.

## Quality and scope

Before finishing, run `npm run check`, `npm test`, and `npm run test:browser`; inspect browser/console errors and generated mobile/desktop captures. Check imports, assets, save/load and primary gameplay. There is currently no compile/build step: verify the production static files at `/` and `/lifesim/`. If a future build is introduced, validate it too.

Use meaningful tests for changed contracts; do not add fake tests. Update technical documentation to match actual code. Do not implement unrelated roadmap features. Avoid empty placeholder trees and unnecessary asset renaming. See `docs/ASSETS.md` for production/source conventions.

## Git

Inspect status and recent history first; preserve other work. Use the branch explicitly requested by the task (Task 02: `codex/world-bible`), otherwise a `codex/` feature branch. Make descriptive commits. Never merge into `main` unless the user explicitly authorizes that action. Stop at the task boundary: Task 02 does not start Task 03 or implement future gameplay.
