# Archived save fixtures

These are synthetic gameplay records, not user saves or private narrative specifications.

- `task13-saves.json`: generated and accepted by the unmodified Task 13 main tree at `1c76b1a`. Active investigation uses its `mysteryFixture`/`stepMystery`; deceased life uses `startLife` with seed 7919 and alternating normal choices until death. No Resolution extension exists.
- `task14-resolution.json`: generated and validated against Task 14 implementation `335349be39864fa62a8011d97c13ab4eea609ce4`, before corrective changes. Includes investigation, active operation cursor, completed operation and fatal completion.
- `task14-boundary-saves.json`: generated with the actual archived runtime/tools at main `7886420d26b118a1670fc6960939746da78b9894`. Its `preparedResolution` builds the earned preparation; `advanceWorld` moves the controlled fixture to month 834 (Harmonic) or 839 (Forced), with matching personal time. The baseline `selectResolution` selects `rs_opening` / `rs_forced_opening`; its real `choose(left)` crosses the boundary to 840 / 845. The unmodified baseline `validStory`, `save` and `load` all accept the frozen serialized envelopes. Operations have no protocol field and remain at the unanswered strategy cursor despite an ordinary World/War freeze. No operation/result/receipt was hand-built or regenerated with Task 14.1 logic.

Corrective tests load these frozen inputs and require save/reload stability. Valid archived lives remain unchanged and continue their operation through the real choice transaction; the boundary fixtures receive only the documented five-field repair and continue ordinary life. Do not regenerate historical fixtures from current runtime to make a regression disappear.
