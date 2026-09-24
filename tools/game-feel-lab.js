// Development-only. Deliberately does not import the app, storage or a game engine.
import { gameScreen } from "../src/ui/card.js";
import { createPresentation } from "../src/ui/presentation/index.js";
import { STATES } from "../src/ui/presentation/presets.js";
import { mountSwipe } from "../src/ui/swipe.js";
import { leaveCard, transitionMoment } from "../src/ui/transitions.js";
const fixture = await (
  await fetch(new URL("tools/feel-fixture.json", document.baseURI))
).json();
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
}
async function commit(side) {
  if (busy) return;
  busy = true;
  presentation.contact("commit");
  try {
    await leaveCard(document.querySelector(".narrative-card"), side);
    cleanup();
    show();
    presentation.emphasize("memory", { gesture: true });
    transitionMoment("Ensayo de una decisión. No cambia ninguna vida.");
  } finally {
    busy = false;
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
  fixture: () => structuredClone(fixture),
  remount() {
    cleanup();
    presentation.destroy();
    location.reload();
  },
};
