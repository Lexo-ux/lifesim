// Development-only. Optional Task 06 cases use an isolated in-memory engine state.
// No app or persistence imports; never reads/writes normal localStorage.
import { gameScreen } from "../src/ui/card.js";
import { createPresentation } from "../src/ui/presentation/index.js";
import { STATES } from "../src/ui/presentation/presets.js";
import { mountSwipe } from "../src/ui/swipe.js";
import { leaveCard, transitionMoment } from "../src/ui/transitions.js";
import { choose } from "../src/narrative/engine.js";
import { currentCard } from "../src/narrative/deck.js";
import { awakeningFixture } from "./awakening-fixtures.js";
import { awakeningCue } from "../src/ui/awakening.js";
const originalFixture = await (
  await fetch(new URL("tools/feel-fixture.json", document.baseURI))
).json();
let fixture = structuredClone(originalFixture),
  lifeMode = false,
  generation = 0;
const presentation = createPresentation(document.body),
  status = document.querySelector("#lab-status");
let cleanup = () => {},
  busy = false,
  sequence = 0,
  timer = null,
  resolveWait = null;
const group = document.querySelector(".lab-states");
for (const [key, value] of Object.entries(STATES)) {
  const b = document.createElement("button");
  b.type = "button";
  b.dataset.state = key;
  b.textContent = key.startsWith("rank-")
    ? key.slice(5).toUpperCase()
    : value.label;
  b.setAttribute("aria-pressed", "false");
  group.append(b);
}
function show() {
  document.querySelector("#main").innerHTML = gameScreen(fixture);
  document.querySelector(".top-tools").innerHTML =
    '<span class="lab-marker">VISTA DE DESARROLLO</span>';
  document.querySelector(".quiet-nav").remove();
  document.querySelector("[data-action=home]").dataset.action = "lab-home";
  cleanup = mountSwipe(
    document.querySelector(".narrative-card"),
    commit,
    presentation,
  );
  presentation.attach(document.querySelector(".narrative-card"));
  if (lifeMode) {
    presentation.setState("normal");
    const cue = awakeningCue(fixture.state, currentCard(fixture.state));
    if (cue) presentation.emphasize(cue);
  }
}
async function commit(side) {
  if (busy) return;
  busy = true;
  const own = generation;
  presentation.contact("commit");
  try {
    const wasIncident =
      lifeMode && currentCard(fixture.state).system === "awakening";
    if (lifeMode) {
      const result = choose(fixture.state, fixture.meta, side);
      if (result.error) throw Error(result.error);
    }
    if (!wasIncident || currentCard(fixture.state).system !== "awakening")
      await leaveCard(document.querySelector(".narrative-card"), side);
    if (own !== generation) return;
    cleanup();
    show();
    if (!lifeMode) {
      presentation.emphasize("memory", { gesture: true });
      transitionMoment("Ensayo de una decisión. No cambia ninguna vida.");
    }
  } finally {
    if (own === generation) busy = false;
  }
}
function cancel() {
  sequence++;
  clearTimeout(timer);
  timer = null;
  resolveWait?.(false);
  resolveWait = null;
}
function select(state) {
  presentation.reset();
  if (state !== "normal") presentation.emphasize(state, { gesture: true });
}
function loadCase(key) {
  generation++;
  busy = false;
  cancel();
  cleanup();
  presentation.reset();
  lifeMode = key !== "visual";
  fixture = lifeMode ? awakeningFixture(key) : structuredClone(originalFixture);
  show();
}
document
  .querySelector("#lab-life")
  .addEventListener("change", (e) => loadCase(e.target.value));
const wait = (ms) =>
  new Promise((r) => {
    resolveWait = r;
    timer = setTimeout(() => {
      timer = null;
      resolveWait = null;
      r(true);
    }, ms);
  });
document.body.addEventListener("lifesim:presentation", (e) => {
  const d = e.detail;
  status.textContent = `${STATES[d.state].label} · intensidad ${d.level}/5 · ${d.tier}`;
  for (const b of group.children)
    b.setAttribute("aria-pressed", b.dataset.state === d.state);
});
group.addEventListener("click", (e) => {
  const state = e.target.closest("[data-state]")?.dataset.state;
  if (state) {
    cancel();
    select(state);
  }
});
document.querySelector("#lab-tier").addEventListener("change", (e) => {
  cancel();
  presentation.setQuality(e.target.value);
});
document.querySelector("#lab-reset").addEventListener("click", () => {
  cancel();
  presentation.reset();
});
document.querySelector("#lab-sequence").addEventListener("click", async () => {
  cancel();
  const own = sequence;
  for (const [state, ms] of [
    ["normal", 1500],
    ["convergence", 2900],
    ["rank-s", 2900],
    ["rank-ss", 3700],
    ["rank-sss", 3700],
    ["normal", 1000],
  ]) {
    if (own !== sequence) return;
    select(state);
    if (!(await wait(ms))) return;
  }
});
document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]");
  if (action?.dataset.action === "choose") commit(action.dataset.value);
  if (action?.dataset.action === "lab-home")
    location.href = new URL("index.html", document.baseURI).href;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cancel();
    presentation.reset();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancel();
    presentation.reset();
  }
});
window.addEventListener("pagehide", () => {
  cancel();
  cleanup();
  presentation.destroy();
});
show();
presentation.reset();
// Narrow QA seam; exists only in this unlinked, noindex development page.
window.feelLab = {
  presentation,
  loadCase,
  busy: () => busy,
  fixture: () => structuredClone(fixture),
  remount() {
    cleanup();
    presentation.destroy();
    location.reload();
  },
};
