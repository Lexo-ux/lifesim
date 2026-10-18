// Atlas de vidas: an editorial map of possibilities, not a cosmological model.
// Geometry is authored and bounded. No random stream, game state or saved clock.
export const PORTAL = Object.freeze({
  opening: { x: 440, y: 252, w: 120, h: 346 },
  frame: { x: 384, y: 152, w: 232, h: 478 },
  floor: 598,
  feet: 708,
});
const svg = (cls, body) =>
  `<svg class="${cls}" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;
const ticks = Array.from({ length: 60 }, (_, i) => {
  const a = (i * Math.PI) / 30,
    r = i % 5 === 0 ? 272 : 279;
  return `<path d="M${500 + Math.sin(a) * r} ${432 + Math.cos(a) * r} L${500 + Math.sin(a) * 286} ${432 + Math.cos(a) * 286}"/>`;
}).join("");
export function environmentMarkup(sockets = []) {
  return svg(
    "threshold-environment",
    `<defs><radialGradient id="atlas-wash"><stop stop-color="#64897d" stop-opacity=".35"/><stop offset="1" stop-color="#102e32" stop-opacity="0"/></radialGradient><linearGradient id="atlas-leaf" x2="1" y2="1"><stop stop-color="#dbcaaa"/><stop offset="1" stop-color="#837b62"/></linearGradient></defs>
 <ellipse cx="500" cy="450" rx="350" ry="380" fill="url(#atlas-wash)"/>
 <g class="atlas-contours"><path d="M-100 570 Q160 240 280 430 T610 590 T1100 250"/><path d="M-100 598 Q160 268 280 458 T610 618 T1100 278"/><path d="M-100 626 Q160 296 280 486 T610 646 T1100 306"/><path d="M-100 654 Q160 324 280 514 T610 674 T1100 334"/><path d="M-100 682 Q160 352 280 542 T610 702 T1100 362"/></g>
 <g class="atlas-orbit"><circle cx="500" cy="432" r="286"/><circle cx="500" cy="432" r="257"/><ellipse cx="500" cy="432" rx="190" ry="257"/><path d="M214 432 H786 M500 146 V718"/>${ticks}</g>
 <g class="atlas-rust"><path d="M231 323 A289 289 0 0 1 470 145"/><path d="M770 543 A289 289 0 0 1 530 720"/></g>
 <path class="atlas-paper-shadow" d="M428 249 L566 240 L578 609 L432 614 Z"/>
 <path class="atlas-paper" d="M424 238 L572 248 L572 614 L424 604 Z"/>
 <path class="atlas-spine" d="M431 239 V605"/>
 <path class="atlas-door" d="M440 598 V322 C440 278 466 252 500 252 C534 252 560 278 560 322 V598 Z"/>
 <g class="atlas-register"><path d="M400 220 h16 m-8 -8 v16 M580 628 h16 m-8 -8 v16"/><circle cx="500" cy="191" r="4"/><path d="M484 191 h-30 M516 191 h30"/></g>
 <g class="fx-sockets">${Array.from({ length: 7 }, (_, i) => `<circle class="fx-socket ${i < sockets.length ? "lit" : ""}" cx="${452 + i * 16}" cy="655" r="3"/>`).join("")}</g>`,
  );
}
export const dustMarkup = () =>
  svg(
    "threshold-dust",
    `<g class="atlas-leaves"><path d="M252 250 l30 -12 16 34 -30 12 Z"/><path d="M706 562 l31 8 -10 34 -31 -8 Z"/><path d="M704 277 l18 -5 5 20 -18 5 Z"/></g><g class="fx-motes">${[
      [350, 270],
      [621, 223],
      [312, 540],
      [668, 580],
      [451, 160],
      [568, 694],
      [611, 321],
      [386, 642],
      [737, 400],
      [284, 411],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7"/>`)
      .join("")}</g>`,
  );
export const figureMarkup = () =>
  svg(
    "threshold-figure",
    `<path class="fx-figure-reflection" d="M489 709 h22 l-3 16 c-1 6 -4 10 -8 12 c-4 -2 -7 -6 -8 -12 Z"/><path class="fx-figure-body" d="M500 664 c-3 0 -5.2 2.5 -5.2 5.6 c0 2.4 1.3 4.3 3.1 5.1 c-4.4 1.7 -6.6 5.4 -7.2 10.8 l-2.9 19.4 c-0.4 2.4 0.3 3.6 2.4 3.8 h19.6 c2.1 -0.2 2.8 -1.4 2.4 -3.8 l-2.9 -19.4 c-0.6 -5.4 -2.8 -9.1 -7.2 -10.8 c1.8 -0.8 3.1 -2.7 3.1 -5.1 c0 -3.1 -2.2 -5.6 -5.2 -5.6 Z"/>`,
  );
