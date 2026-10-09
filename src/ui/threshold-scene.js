// The Threshold scene as inline SVG layers: monoliths, floating shards, an ornate
// portal and prismatic fissures. Geometry is fixed authoring data generated from
// a constant seed at module load: no game state, save field or PRNG is involved.

// Square viewBox. Portrait screens "slice" (crop the sides); landscape screens
// "meet" and show the extra monoliths drawn beyond the square. CSS mirrors
// these coordinates to anchor HTML layers (opening, hold target) to the art.
export const PORTAL = Object.freeze({
  opening: { x: 440, y: 252, w: 120, h: 346 },
  frame: { x: 384, y: 152, w: 232, h: 478 },
  floor: 598,
  feet: 708,
});

function sequence(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A wandering fracture with occasional branches; "flat" lays it on the floor plane.
function fracture(next, x, y, angle, length, steps, wander, flat = 1) {
  const x0 = x,
    y0 = y;
  const points = [[x, y]];
  const branches = [];
  for (let i = 0; i < steps; i++) {
    angle += (next() - 0.5) * wander;
    const step = (length / steps) * (0.55 + next() * 0.9);
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    points.push([x, y]);
    if (next() < 0.24 && i < steps - 2)
      branches.push([
        x,
        y0 + (y - y0) * flat,
        angle + (next() < 0.5 ? -1 : 1) * (0.5 + next() * 0.6),
      ]);
  }
  const d = points
    .map(
      ([px, py], i) =>
        `${i ? "L" : "M"}${px.toFixed(1)} ${(y0 + (py - y0) * flat).toFixed(1)}`,
    )
    .join(" ");
  return { d, branches, x0 };
}
const crack = (d, from, to) =>
  `<g class="fx-crack ${from === undefined ? "fx-world" : "fx-seal"}"${from === undefined ? "" : ` style="--a:${from.toFixed(2)};--b:${to.toFixed(2)}"`}><path class="fx-glow" d="${d}" pathLength="1"/><path class="fx-fringe" d="${d}" pathLength="1"/><path class="fx-core" d="${d}" pathLength="1"/></g>`;

const next = sequence(9721);
const world = [],
  seal = [],
  shardCracks = [];
// Light already living inside the monoliths.
for (const [x, y, a, l] of [
  [196, 300, 0.7, 150],
  [300, 470, -0.5, 120],
  [250, 640, -0.2, 110],
  [800, 280, 2.5, 150],
  [700, 500, 2.9, 120],
  [760, 650, 3.3, 100],
  [70, 470, 0.2, 110],
  [930, 420, 3.0, 110],
  [-160, 420, 0.4, 130],
  [1150, 380, 2.8, 130],
]) {
  const c = fracture(next, x, y, a, l, 7, 0.95);
  world.push(crack(c.d));
  for (const [bx, by, ba] of c.branches)
    world.push(crack(fracture(next, bx, by, ba, l * 0.35, 3, 0.8).d));
}
// The seal: fractures fanning across the floor plane and up the frame. Each
// owns a slice of the held charge, nearest first.
for (let i = 0; i < 11; i++) {
  const x = 424 + i * 15.2,
    a = Math.PI / 2 + (i - 5) * 0.27;
  const c = fracture(next, x, 630, a, 120 + next() * 150, 7, 0.7, 0.42);
  const from = 0.04 + (Math.abs(i - 5) / 5) * 0.36;
  seal.push(crack(c.d, from, 0.72 + next() * 0.22));
  for (const [bx, by, ba] of c.branches)
    seal.push(crack(fracture(next, bx, by, ba, 60, 3, 0.8, 0.42).d, 0.5, 0.96));
}
for (const [x, y, a] of [
  [404, 390, Math.PI + 0.3],
  [404, 510, Math.PI - 0.2],
  [596, 370, -0.25],
  [596, 490, 0.3],
  [432, 196, -2.3],
  [568, 196, -0.85],
  [500, 150, -1.6],
]) {
  const c = fracture(next, x, y, a, 150, 6, 0.8);
  seal.push(crack(c.d, 0.12 + next() * 0.3, 0.84 + next() * 0.14));
}
// Each floating shard carries one fissure of its own.
const SHARDS = [
  ["M566 30 L640 10 L764 262 L700 284 Z", [600, 36, 1.2, 230]],
  ["M300 96 L356 58 L422 196 L382 218 Z", [330, 80, 1.1, 130]],
  ["M420 168 L432 142 L445 168 L432 208 Z", [432, 148, 1.6, 50]],
  ["M574 150 L586 126 L598 152 L586 184 Z", [586, 132, 1.5, 44]],
  ["M496 104 L504 90 L511 106 L504 124 Z", [504, 94, 1.6, 26]],
  ["M640 150 L658 128 L670 156 L654 186 Z", [656, 134, 1.7, 46]],
  ["M226 250 L250 222 L262 270 L240 300 Z", [244, 230, 1.5, 60]],
];
for (const [, [x, y, a, l]] of SHARDS)
  shardCracks.push(crack(fracture(next, x, y, a, l, 5, 0.7).d));

const MOTES = [
  [470, 190],
  [538, 160],
  [452, 380],
  [550, 330],
  [428, 500],
  [576, 540],
  [514, 230],
  [486, 120],
  [612, 420],
  [394, 330],
];

// The arch band: seven sockets (one per remembered life) between six glyphs.
const band = (angle, r = 86) => [
  500 + Math.cos(angle) * r,
  314 + Math.sin(angle) * r * 0.97,
];
const socket = (i, count, colors) => {
  const [cx, cy] = band(Math.PI * (1.1 + i * 0.1333)).map((n) => n.toFixed(1));
  return i < count
    ? `<circle class="fx-socket-halo" cx="${cx}" cy="${cy}" r="11" fill="${colors[i]}"/><circle class="fx-socket lit" cx="${cx}" cy="${cy}" r="5" fill="${colors[i]}"/>`
    : `<circle class="fx-socket" cx="${cx}" cy="${cy}" r="5"/>`;
};
const GLYPHS = [
  "m-3 -4 l3 8 l3 -8",
  "m0 -5 v10 m-3 -3 h6",
  "m-3 3 a3 3 0 1 1 6 0",
  "m-3 -3 l6 6 m0 -6 l-6 6",
  "m0 -5 l4 5 l-4 5 l-4 -5 z",
  "m-3 4 v-8 h6",
];
const glyph = (i) => {
  const [x, y] = band(Math.PI * (1.1 + (i + 0.5) * 0.1333));
  return `<path class="fx-glyph" d="M${x.toFixed(1)} ${y.toFixed(1)} ${GLYPHS[i]}"/>`;
};
const svg = (cls, body) =>
  `<svg class="${cls}" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;
const ARCH =
  "M404 598 V302 C404 236 448 206 500 206 C552 206 596 236 596 302 V598";

// Static art: repaints only while the held charge changes.
export function environmentMarkup(sockets = []) {
  return svg(
    "threshold-environment",
    `<defs>
<linearGradient id="fx-spec" gradientUnits="userSpaceOnUse" x1="200" y1="40" x2="820" y2="880"><stop offset="0" class="fx-l3"/><stop offset=".3" class="fx-l1"/><stop offset=".55" class="fx-l2"/><stop offset=".8" class="fx-l4"/><stop offset="1" class="fx-l3"/></linearGradient>
<linearGradient id="fx-spec2" gradientUnits="userSpaceOnUse" x1="900" y1="0" x2="100" y2="1000"><stop offset="0" class="fx-l2"/><stop offset=".35" class="fx-l3"/><stop offset=".7" class="fx-l4"/><stop offset="1" class="fx-l2"/></linearGradient>
<linearGradient id="fx-stone" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#0e0f18"/><stop offset=".55" stop-color="#06070b"/><stop offset="1" stop-color="#020203"/></linearGradient>
<linearGradient id="fx-frame" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#04050a"/><stop offset=".22" stop-color="#171a28"/><stop offset=".5" stop-color="#0b0c14"/><stop offset=".78" stop-color="#171a28"/><stop offset="1" stop-color="#04050a"/></linearGradient>
<radialGradient id="fx-pool" cx=".5" cy=".5" r=".5"><stop offset="0" class="fx-l1" stop-opacity=".55"/><stop offset=".45" class="fx-l3" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="fx-eye" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".5" class="fx-l1"/><stop offset="1" class="fx-l3" stop-opacity="0"/></radialGradient>
</defs>
<g class="fx-far"><path d="M-420 1000 V560 L-330 470 L-250 520 L-170 380 L-90 430 L-60 1000 Z"/><path d="M0 1000 V470 L70 380 L120 420 L190 310 L215 370 L200 1000 Z"/><path d="M1000 1000 V430 L930 350 L880 390 L820 250 L800 330 L812 1000 Z"/><path d="M1420 1000 V520 L1350 430 L1270 480 L1200 330 L1120 400 L1070 1000 Z"/></g>
<g class="fx-near"><path class="fx-stone" d="M-250 1000 L-230 300 L-150 210 L-60 280 L-40 1000 Z"/><path class="fx-stone" d="M150 1000 L178 280 L262 126 L330 178 L362 420 L330 560 L372 690 L360 1000 Z"/><path class="fx-rim" d="M262 126 L330 178 L362 420 L330 560 L372 690"/><path class="fx-stone" d="M850 1000 L836 370 L770 200 L704 78 L672 280 L690 460 L640 620 L652 1000 Z"/><path class="fx-rim" d="M704 78 L672 280 L690 460 L640 620"/><path class="fx-stone" d="M1040 1000 L1060 260 L1150 180 L1230 250 L1250 1000 Z"/></g>
<ellipse class="fx-pool" cx="500" cy="662" rx="320" ry="96" fill="url(#fx-pool)"/>
<path class="fx-ground" d="M-500 1000 V720 C0 700 300 640 420 628 L580 628 C700 640 1000 700 1500 720 V1000 Z"/><ellipse class="fx-pool fx-pool-near" cx="500" cy="676" rx="200" ry="44" fill="url(#fx-pool)"/>
<g class="fx-cracks">${world.join("")}${seal.join("")}</g>
<g class="fx-portal">
<path class="fx-stone" d="M360 612 H640 V630 H360 Z"/><path class="fx-stone" d="M378 598 H622 V613 H378 Z"/>
<path class="fx-frame-body" d="M390 598 V312 C390 226 444 190 500 190 C556 190 610 226 610 312 V598 Z"/>
<path class="fx-stone" d="M384 598 V560 H430 V598 Z M570 598 V560 H616 V598 Z"/>
<path class="fx-stone" d="M380 300 H428 V318 H380 Z M572 300 H620 V318 H572 Z"/>
<path class="fx-rim fx-frame-rim" d="M390 598 V312 C390 226 444 190 500 190 C556 190 610 226 610 312 V598"/>
<path class="fx-rim fx-mid-rim" d="${ARCH}"/>
<path class="fx-inner-rim" d="M440 598 V322 C440 278 466 252 500 252 C534 252 560 278 560 322 V598"/>
<path class="fx-stone" d="M488 188 L512 188 L506 218 L494 218 Z"/>
<path class="fx-stone" d="M372 196 H628 L612 168 H388 Z"/><path class="fx-stone" d="M452 168 C452 124 548 124 548 168 Z"/>
<path class="fx-rune" d="M468 160 C468 134 532 134 532 160"/><circle class="fx-eye-ring" cx="500" cy="150" r="14"/><circle class="fx-eye" cx="500" cy="150" r="8" fill="url(#fx-eye)"/>
<path class="fx-stone" d="M380 168 L392 132 L404 168 Z M596 168 L608 132 L620 168 Z M436 168 L444 148 L452 168 Z M548 168 L556 148 L564 168 Z"/>
<circle class="fx-dot" cx="420" cy="182" r="2.4"/><circle class="fx-dot" cx="460" cy="182" r="2.4"/><circle class="fx-dot" cx="540" cy="182" r="2.4"/><circle class="fx-dot" cx="580" cy="182" r="2.4"/>
<g class="fx-sockets">${Array.from({ length: 7 }, (_, i) => socket(i, sockets.length, sockets)).join("")}${GLYPHS.map((_, i) => glyph(i)).join("")}</g>
<path class="fx-groove" d="M398 330 V556 M432 330 V556 M568 330 V556 M602 330 V556"/>
<path class="fx-rune" d="M415 380 v18 m-5 -12 h10 m-10 6 h10"/><path class="fx-rune" d="M410 456 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 m5 0 h0.1"/><path class="fx-rune" d="M410 528 l5 -8 l5 8 l-5 8 z"/><path class="fx-rune" d="M585 380 v18 m-5 -12 h10 m-10 6 h10"/><path class="fx-rune" d="M580 456 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 m5 0 h0.1"/><path class="fx-rune" d="M580 528 l5 -8 l5 8 l-5 8 z"/>
<path class="fx-ghost-rim" d="${ARCH}" transform="translate(12 -9) rotate(1.4 500 420)"/>
</g>`,
  );
}
// Separate layers so ambient drift and the walk into light stay compositor-only.
export const dustMarkup = () =>
  svg(
    "threshold-dust",
    `${SHARDS.map(([d], i) => `<path class="fx-stone fx-shard" style="--i:${i}" d="${d}"/>`).join("")}<g class="fx-shard-cracks">${shardCracks.join("")}</g><g class="fx-motes">${MOTES.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 2.4 : 1.4}"/>`).join("")}</g>`,
  );
export const figureMarkup = () =>
  svg(
    "threshold-figure",
    `<path class="fx-figure-reflection" d="M489 709 h22 l-3 16 c-1 6 -4 10 -8 12 c-4 -2 -7 -6 -8 -12 Z"/><path class="fx-figure-body" d="M500 664 c-3 0 -5.2 2.5 -5.2 5.6 c0 2.4 1.3 4.3 3.1 5.1 c-4.4 1.7 -6.6 5.4 -7.2 10.8 l-2.9 19.4 c-0.4 2.4 0.3 3.6 2.4 3.8 h19.6 c2.1 -0.2 2.8 -1.4 2.4 -3.8 l-2.9 -19.4 c-0.6 -5.4 -2.8 -9.1 -7.2 -10.8 c1.8 -0.8 3.1 -2.7 3.1 -5.1 c0 -3.1 -2.2 -5.6 -5.2 -5.6 Z"/>`,
  );
