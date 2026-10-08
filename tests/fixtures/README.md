# Archived save fixtures

These are synthetic gameplay records, not user saves or private narrative specifications.

- `task13-saves.json`: generated and accepted by the unmodified Task 13 main tree at `1c76b1a`. Active investigation uses its `mysteryFixture`/`stepMystery`; deceased life uses `startLife` with seed 7919 and alternating normal choices until death. No Resolution extension exists.
- `task14-resolution.json`: generated and validated against Task 14 implementation `335349be39864fa62a8011d97c13ab4eea609ce4`, before corrective changes. Includes investigation, active operation cursor, completed operation and fatal completion.

Corrective tests load these frozen inputs, require unchanged current-life state after save/reload, and continue the archived operation through the real choice transaction. Do not regenerate historical fixtures from current runtime to make a regression disappear.
