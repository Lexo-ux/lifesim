# Visual QA — reusable checklist

- [ ] Character/scene and Moment dominate; utility panels do not resemble a dashboard.
- [ ] Fissure grammar holds: obsidian matter, alabaster writing, light only through fissures as a white core with dispersion fringes. Color follows context (card state, known era, class, legacy) and never encodes value, rank or probability. No colored UI panels, rarity rainbows or gold everywhere.
- [ ] Card states read without color: silhouette, fracture and the written sign differ (everyday, crisis, mystery, echo, awakening, resolution).
- [ ] Crossing and choosing are events (seal, light handoff, break), each with a one-activation button/keyboard alternative and a still reduced-motion version.
- [ ] Text reads at 360px; no face/hair/decision crop or clipped long labels.
- [ ] Four indicators have distinct icons, accessible values and non-color change cues.
- [ ] Choices/focus states work with keyboard, pointer and touch; touch targets ≥44px.
- [ ] Pickup is immediate; preview progressive; short/vertical/cancelled drag makes no decision.
- [ ] One committed gesture resolves once, saves before exit and shows a controlled next Moment.
- [ ] Motion communicates contact/causality/rarity; idle is limited to the documented compositor groups and stops when hidden.
- [ ] Reduced motion, including preference changes, retains previews/outcomes and removes large motion.
- [ ] Title, creation, both swipes, profile, history, settings and memorial remain usable.
- [ ] Compare 360×800, 390×844, 430×932 and desktop; also compact 360×640 and landscape.
- [ ] Check loaded images, console errors, 404s and `/lifesim/` paths; don't trust empty image boxes.
- [ ] Inspect screenshots visually, then run axe and gesture/regression checks. Automated success is not aesthetic approval.
- [ ] Record CLS, frame samples, layout/paint work, image bytes and hardware limitations; no unbounded callbacks or retained animations.
- [ ] Provenance/version recorded, alpha preserved, legacy status honest, new references local.
- [ ] No future canon/gameplay slipped into visual work. Threshold title/entry belongs to Task 04.

Run `npm run check`, `npm test`, `npm run test:browser`. `tests/visual.cjs` writes `output/qa/task03-after/`; `VISUAL_PHASE=before` captures an unchanged reference checkout. Run each phase against its corresponding checkout, not two labels on the same build. Direction prototypes are in `lab/` (unlinked from the game). Art review is `tools/art-review.html`; it has no production navigation or new gameplay. Evidence and known limitations are recorded in VALIDATION.md.
