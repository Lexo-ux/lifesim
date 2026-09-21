// Stable storage identifiers, independent of the package/release version.
// Changing a key or schema requires an explicit migration and compatibility tests.
export const STORAGE_KEYS = Object.freeze({
  current: "lifesim.v3",
  legacy: "lifesim.v2",
  legacyRecord: "lifesim_mejor_vida",
});
