const paths = {
  sprout:
    '<path d="M12 21v-9M12 15C4 15 3 10 3 5c7 0 9 3 9 10Zm0-4c0-5 3-8 9-8 0 6-3 9-9 9"/>',
  leaf: '<path d="M20 3C8 2 2 8 5 15s15 5 15-12ZM5 21l10-12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  sunset:
    '<path d="M3 17h18M5 21h14M6 17a6 6 0 0 1 12 0M12 3v3M3 9l2 2m14 0 2-2"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  smile:
    '<circle cx="12" cy="12" r="9"/><path d="M8 14s1 3 4 3 4-3 4-3M8 8h.01M16 8h.01"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v16"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
  wallet:
    '<rect x="3" y="5" width="19" height="16" rx="3"/><path d="M3 7V5a2 2 0 0 1 2-2h13M22 11h-6v5h6m-3-2.5h.01"/>',
  briefcase:
    '<rect x="2" y="7" width="20" height="14" rx="3"/><path d="M8 7V3h8v4M2 12c6 4 14 4 20 0M12 12v4"/>',
  people:
    '<circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 3a4 4 0 0 1 0 8m2 3c3 1 3 4 3 7"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
  palette:
    '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4 2 2 0 0 1 1-4h3a3 3 0 0 0 3-3c0-4-4-7-9-7Z"/><path d="M7 8h.01M12 6h.01M17 8h.01M5 13h.01"/>',
  code: '<path d="m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18"/>',
  moon: '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
  trophy:
    '<path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v7m-4 0h8"/>',
  home: '<path d="m2 11 10-9 10 9M5 9v12h14V9M9 21v-8h6v8"/>',
  graduation: '<path d="m1 8 11-5 11 5-11 5ZM5 10v7c4 4 10 4 14 0v-7m4-2v9"/>',
  tool: '<path d="m14 6 4 4 4-4a6 6 0 0 1-8 8l-7 7a3 3 0 0 1-4-4l7-7a6 6 0 0 1 8-8Z"/>',
  coffee:
    '<path d="M3 8h14v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5ZM17 8h2a3 3 0 0 1 0 6h-2M6 2v2m4-2v2m4-2v2"/>',
  rocket:
    '<path d="M9 15C8 8 13 3 21 3c0 8-5 13-12 12ZM9 9H4l-2 6h7m6 0v5l-6 2v-7M4 20l-1 1"/><circle cx="16" cy="8" r="1"/>',
  clover:
    '<path d="M12 12C1 12 3 2 8 4c4-5 9 0 4 8Zm0 0c0-11 10-9 8-4 5 4 0 9-8 4Zm0 0c11 0 9 10 4 8-4 5-9 0-4-8Zm0 0C12 23 2 21 4 16c-5-4 0-9 8-4Z"/>',
  flame:
    '<path d="M12 2c2 7 7 6 7 13a7 7 0 0 1-14 0c0-4 4-6 7-13Zm0 11c-6 7 6 9 0 0Z"/>',
  chart: '<path d="M3 3v18h18M7 16v-5m5 5V7m5 9v-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  lock: '<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  volume:
    '<path d="M11 3 6 7H2v10h4l5 4Zm4 5a6 6 0 0 1 0 8m3-12a11 11 0 0 1 0 16"/>',
  mute: '<path d="M11 3 6 7H2v10h4l5 4Zm5 6 6 6m0-6-6 6"/>',
  settings:
    '<path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z"/><circle cx="12" cy="12" r="3"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>',
};
export const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
