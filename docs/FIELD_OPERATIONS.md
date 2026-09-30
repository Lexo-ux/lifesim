# Field operations — Task 10

Technical source of truth. Base `main` at `039b2974b268aea5f0738b7a4e0b489049e3a48b`, branch `codex/hunters-field-operations`. No main merge or Task 11 work. Canon remains in `/lore`; seven operational situations, timing and outcome rules are explicitly **IMPLEMENTATION TARGET**, not new historical canon.

## Owners and boundaries

- Task 07 retains opportunity eligibility, the only deck, ordinary-life spacing and `story.queue`. There is no mission board or second scheduler.
- `src/systems/field.js` owns the optional `state.field.version = 1` extension, operation lifecycle and objective-specific resolution. It imports no DOM, UI or persistence.
- Task 08 retains NPC identities, relationship dimensions, obligations and institutional association. Teams reference its IDs; no SquadNPC, guild manager or friendship score exists.
- Task 09 retains all world time, private circumstances, bounded dimensions/regions, historical events, delayed world processing and knowledge reports. Field contributions use that owner's validated contracts.
- Existing career, studies, income, health and death retain their owners. Field involvement does not grant a profession, salary, rank or license. There is no combat health pool.
- The existing Mystic Card and presentation owner render the content. Profile/Memorial are read-only projections. No new renderer, animation loop, asset, framework or runtime dependency.

An Awakened person is a Hunter only through actual combat/exploration participation. The profile describes those with a resolved protector/observer role as Hunters; civilian and medical/support participation is described as support. Refused offers and aborted deployments never establish that biography. An SSS healer may work in care or refuse field life entirely. E, non-Awakened and unrelated professions remain viable.

## Data and state

`content/field/catalog.js` supplies seven definitions: reconnaissance, evacuation, containment, medical support, survey, repair and logistics. Each owns a stable ID, validated `afterEvent`/`regionCondition`/`minimumWorldMonth` prerequisites, authored briefing/preparation/decision/result/callback text, region, institution, preferred role, objective, semantic risk, allowed persistent teammates and contribution contract.

`content/moments/field.js` adapts these definitions into 42 binary Moments, plus four affiliation/exit/return decisions. No existing Moment is rewritten. Two additional public reports accompany independent world history. Scene/background assets and protagonist/known-NPC art remain unchanged.

`state.field` contains:

| Field        | Contract                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `version`    | Explicit extension version, currently 1.                                                       |
| `status`     | `open`, `active`, `withdrawn`; not an occupation or supernatural identity.                     |
| `active`     | At most one operation ID, including a currently offered encargo.                               |
| `operations` | At most one instance per definition, retained through death.                                   |
| `experience` | Role-keyed `exposed`, `experienced`, `seasoned`, gained through participation, not XP or rank. |

An instance stores lifecycle phase; offer/acceptance/resolution dates; assigned role and preparation; Task 08 team IDs; domain-separated seed and committed complication; accepted world-condition snapshot; decision; outcome and bounded private factors; directly witnessed losses; attributable contribution ID; aftermath and delayed callback choices; whether operational injury ended the life. It does not store full prose, copies of people, a second inventory or arbitrary state paths.

## Selection, lifecycle and choices

`field-offer` is a registered leaf inside the existing ALL/ANY/NOT evaluator. It checks age, historical timing, current operation, voluntary withdrawal, one-time history, world institution availability, personal access and definition context. Bastion requires an actually occurred foundation; repair requires a strained corridor; survey requires the historical research question. Missing world ownership is unknown/fail-closed. Other leaves expose involvement, idle status, role experience and prior outcome.

Definitions are possible work domains, not class restrictions. A qualified person can select the relevant role; an unqualified person can support the team without being presented as a doctor/engineer. The other response selects evacuation coordination, or direct team support when the qualified role already is coordination; the two choices always assign distinct roles. Eligibility queries never instantiate people or consume RNG.

Flow:

1. **Offer selected:** prepare and persist a minimal instance, no random draw.
2. **Accept / decline:** acceptance freezes complication, team references and commitment context; refusal closes only that definition. It neither enrolls the player in a guild nor makes them a Hunter.
3. **Role:** use existing capabilities/class tags or choose coordination. Existing education/career stays intact.
4. **Preparation:** contrast evidence or prepare rest/withdrawal. These affect different objectives and risk protection.
5. **Critical decision:** commit to the stated limited objective or retreat. Changed sponsor/region/team conditions matter at execution; a now-damaged sponsor cancels deployment. One month represents this incident, not frame time or a tactical battle.
6. **Aftermath:** share the report or disengage. Release the active slot while retaining the instance, experience and memories.
7. **Callback:** the ordinary queue schedules a reflection 30 months later. It reports bounded subsequent use or interruption of the contribution, not unseen world history.

Required continuations are unconditional `reflection` closures under the existing queue. They cannot be made unreachable by changing jobs, losing an NPC, a changed region or withdrawing. Two ordinary decisions still separate opportunities; accepting an operation does not turn every subsequent turn into field content. Six-month preparation/coordination beats span life and organizational delays. Death can interrupt any chain, without protection or posthumous simulation.

## Resolution and risk

`resolutionFactors` is a private, inspectable snapshot. `resolveOperation` is a pure projection; it draws nothing. Relevant factors include role fit, semantic experience, reliable colleagues, institution support, changed regional pressure, preparation and compatible Core resonance. Current class tags contribute through the existing catalog, including elemental expression and trace sensing; the Task 07 capability projection and Task 06 class definitions are not rewritten.

Objectives use distinct rules:

- **Force:** appropriate manifestation/role and rank magnitude determine whether pressure can be held; a withdrawal plan or coordinated team is also necessary.
- **Information:** observation/research fit, contrasted evidence and a team or compatible resonance.
- **Structure:** technical fit, evidence and operational institutional support.
- **Care:** appropriate support/medical capacity, protected working conditions or relevant resonance, and a team.
- **People:** coordination/experience, planned safety and available people. Evacuation always leaves material or unfinished work behind: no perfect result is authored.
- **Routes:** logistics fit, checked information and support or a practiced working relationship.

S/SS/SSS provide a real force advantage. Rank does not bypass non-force qualifications, blocked deployment, dangerous regional changes or coordination. Rarity is never a resolution factor. There is no universal power score, displayed success percentage, hidden pity, loot or guaranteed high-rank success.

Outcomes: complete, partial, failure, retreat, abort. Failure uses existing health/stress/energy; severe unsuccessful deployments can inflict significant injury. Low health can lead to the existing death transaction, even at high rank. A failed severe operation with a separated team and no safety plan can cause a directly witnessed local loss. Retreat is a legitimate record and can build professional confidence rather than being treated as automatic cowardice.

## People, institutions and knowledge

The current team uses the existing `local_colleague` template. The first accepted operation instantiates it only if available; later operations retain exactly that person's identity. Already-known colleagues are reused without new draws. A team does not fabricate a meeting with Voss, Yuna, Vale or Okafor.

Shared outcomes use Task 08 `field_service` memory, confidence/tension and `field_return` obligation; aftermath can keep or release the obligation. Affection and personal trust are not automatically made positive. A local's absence/death stays in the existing social circumstance contract; directly witnessed death explicitly updates known status and preserves identity/memories. Unrelated private historical NPC fates never appear in operational prose.

`bastion` is the sole new institution entry and the only named guild. Its name/founder come from approved canon. No headquarters, logo, nationality, officers, permanent mentor or formal guild rank is invented. Foundation requires the historical Voss recognition and his availability. A later interruption can strain its world condition. Neither event writes player trust or association. The public report can be read without meeting Voss or joining. Optional collaboration, refusal and departure use existing Task 08 fields. Generic research, evaluation and workshop contexts remain other routes.

Critical prose reveals only the local situation and what the team can observe, not private numeric factors. Delayed correspondence can acknowledge subsequent use of a submitted report; it does not disclose world endings, unrelated NPC deaths, future events, Convergence cause or True Resolution.

## World contracts, RNG and saves

`CONTRIBUTIONS.field_*` is a finite whitelist mapping one resolved definition to a bounded ±1 domain effect, optional local regional condition and a deferred review. The operation must already contain its valid outcome and contribution reference. Ordinary `world-contribute` content cannot request a field contribution. Resolution provenance and world contribution references are checked in saves.

Successful repair can reopen the corridor; evacuation can shelter people there. Later eligibility observes the new regional condition. Failed/retreated operations cannot claim these results. A deferred review, 24 months later, can add a bounded follow-on effect if the corridor has not been displaced. The later personal callback does not force the review to succeed. World scheduling, cancellation and processing all remain Task 09-owned.

Independent history adds Bastion foundation, a relief operation without player involvement and possible institutional strain. Existing historical NPC contributions continue independently. No field activity is necessary for eras to advance or for these events to occur. No ending selector, battlefront, territorial campaign or war resolver is added; `world.outcome` remains null.

Both character and world PRNG algorithms and Awakening/class/rank probabilities are unchanged. Each accepted operation hashes its stable ID into the character seed XOR `0x4649454c`, then uses the existing PRNG on the **instance** once to choose a bounded complication. It never advances character/world RNG for that uncertainty. First local instantiation still uses Task 08's exact three character draws. New adult cards naturally change subsequent deck trajectories. Rendering/FX, queries, inspection and reload draw nothing. New world events add no RNG draws; prior world's historical variant stream order remains intact.

World extension becomes **version 2**, without changing save keys/envelope or knowledge version. Version 1 remains readable and loading is non-mutating. On the next valid living choice, migration adds Bastion as `unconfirmed` after its original historical window (`not-established` beforehand), records `fieldBaseline`, schedules only future new events and marks past new events `unobserved-extension`; it does not fabricate a former guild or participation. A late migrated life may never get Bastion, but retains generic field routes. Completed v1 lives remain unchanged. World v2 accepts legacy unobserved baselines and validates new event provenance.

Field state is lazy: no old life is automatically enrolled and no completed historical life gets operations. Current selected cards, teams, preparations, outcomes and both queues persist. Unsupported versions, duplicate/impossible phases, lost active continuations, invalid references and dropped callbacks fail validation while preserving the stored original. No reroll on reload.

## Development and Task 11 seam

- `tools/inspect-field.js`, integrated into the existing opportunity inspector, explicitly separates player-known briefing/team/results from private factors, eligibility context and queue state. It is never imported in production.
- `tools/simulate-field.mjs 8` runs all seven families across eight archetypes with production transactions, isolated fixture seeds and independent choice policies. Input seeds actually produce E support, D explorer, B combat, S healer, common SS, SSS and Mythic E; no production odds are changed. Full-life diagnostics remain in `tools/simulate-opportunities.mjs 300`.
- `tools/validate-field.js`, `field-schema.js` and `field-validation.js` cover IDs, roles/capabilities, institutions, regions, risk, contributions, outcomes, finite lifecycle edges, follow-ups and saved invariants. They reject arbitrary fields/Task 11 mutations. They do not prove every combination's reachability or balance.
- `tests/field.test.js` covers the 31 requested categories plus corrupt state/authoring. `tests/field.cjs` plays real cards, intervening life, reload and biography with mobile/desktop, keyboard/touch and accessibility checks. Evidence is ignored under `output/qa/task10/`.

Future Task 11 can query `lifeContext.field`, existing social associations/personnel availability and Task 09 region/institution conditions, then add authorized opportunity requirements and finite world contribution contracts. It must not make an operation instance a second world clock or directly assign arbitrary world paths. Fronts, campaigns, strategy, armies, territorial war and world resolution require a separately authorized owner. Field experience is not a rank progression system.

## Validation evidence

Final `npm run check` passed for 130 runtime/tool modules and static publication/assets; `npm test` passed **134/134** tests. The 300-life production simulation made 52,482 decisions: 1,113 field offers, 628 acceptances, 485 refusals, 593 resolved operations (54 complete, 336 partial, 160 retreats, 37 failures, 6 aborts), 185 contributions, 5 losses and 125 field exits. Forty-four operations remained unfinished at death, an expected interruption. Invalid saves, dead ends, repeated one-time Moments and opportunity-spacing violations were all zero. Transactions measured p50 3.19 ms, p95 8.35 ms, maximum 193.07 ms on this host; the isolated maximum is not hidden by the percentile.

The focused simulation covered 448 scenarios: 392 acceptances, 56 refusals, 74 complete results, 236 partial results, 26 failures and 56 retreats; 149 contributions, 5 losses and 112 exits. It contained 5,096 unrelated choices and zero invalid states, dead ends or repeated Moments. Each scenario exercises one operation; recurring team continuity is instead checked by explicit second-operation unit/browser tests. Separately, 2,000 world-only simulations produced 91 distinct final states, zero invalid states/chunk mismatches, and both operating (1,211) and strained (789) Bastion conditions while historical NPC availability varied independently of the player.

The complete thirteen-suite browser run passed on 2026-09-28 using installed Edge. Ten field chains played 19–20 real decisions each, including 13–14 intervening ordinary choices, with reloads after acceptance/preparation and state comparisons against the pure engine. All seven operation families, civilian support, retreat, E/Mythic E, common SS and SSS, a second operation with the same colleague, affiliation/refusal, Profile/History/Memorial and new life were exercised. The Pages suite also accepted an operation under `/lifesim/`.

Five viewport captures (360×640, 360×800, 390×844, 430×932, 1440×900), keyboard/touch, 200% text, forced colors and reduced motion were reviewed. Nineteen field axe audits found no violations; console/asset errors were zero. Partial-drag sampling recorded 236 frames, p95 10.1 ms, maximum 89.9 ms and no observed JS long tasks. These are desktop measurements, not guaranteed physical-phone frame rates. The full presentation suite retained its existing lifecycle/resource checks.

Iteration corrected repair support under strained conditions, aborted deployments granting experience, two role choices resolving to the same role, and legacy guild knowledge being erased by migration. Dedicated regression tests cover these contracts. Screenshots now wait for the existing transient notice to settle before readability inspection; production notice timing was not changed.

Limits: seven one-time families, one recurring local team template, abstract regions and compact objective rules. Canonical figures contribute through existing history rather than joining a simulated squad. There is no full guild economy, autonomous team AI, combat engine, equipment, diplomacy, new faction canon or Task 11 system. Browser QA on desktop Edge with phone-sized viewports does not certify physical phones or Safari.

## Task 11 integration

The separately authorized strategic owner now lives under World; see [THRESHOLD_WAR](THRESHOLD_WAR.md). Existing resolved field contributions affect its supply, civilian, research and force context through World dimensions/institutions. Instance uncertainty, roles, lifecycle and team ownership remain unchanged. Completed containment plus SSS/combat capability permits an optional contextual intervention; it changes force/front integrity only, not diplomacy, knowledge or guaranteed victory. The Task 10 scope/validation evidence above remains historical.
