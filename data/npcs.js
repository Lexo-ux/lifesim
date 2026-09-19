// Stable identities recur within a life. Relationships use these same IDs.
export const NPCS = {
  elena: { name: 'Elena', role: 'Mamá', portrait: 'elena', background: 'home', type: 'family', offset: 28, lifespan: 86 },
  tomas: { name: 'Tomás', role: 'Papá', portrait: 'tomas', background: 'home', type: 'family', offset: 31, lifespan: 84 },
  ines: { name: 'Inés', role: 'Abuela', portrait: 'ines', background: 'home', type: 'family', offset: 64, lifespan: 86 },
  vera: { name: 'Vera', role: 'Tu amiga', portrait: 'vera', background: 'park', type: 'friend', offset: 0, lifespan: 94 },
  noa: { name: 'Noa', role: 'Una cara conocida', portrait: 'noa', background: 'street', type: 'friend', offset: 1, lifespan: 93 },
  rafael: { name: 'Rafael', role: 'Tu jefe', portrait: 'rafael', background: 'office', offset: 12, lifespan: 90 },
  celia: { name: 'Celia', role: 'Tu médica', portrait: 'celia', background: 'hospital', offset: 8, lifespan: 105 },
  salma: { name: 'Salma', role: 'Tu profesora', portrait: 'salma', background: 'school', offset: 22, lifespan: 96 },
  ada: { name: 'Ada', role: 'Tu mentora', portrait: 'ada', background: 'office', offset: 19, lifespan: 104 },
  luz: { name: 'Luz', role: 'Tu hija', portrait: 'luz', background: 'home', type: 'child', offset: -28, lifespan: 98 },
  omar: { name: 'Omar', role: 'Tu vecino', portrait: 'omar', background: 'street', offset: 16, lifespan: 108 },
  iria: { name: 'Iria', role: 'La archivista', portrait: 'iria', background: 'archive', offset: 0, lifespan: 1000 },
};
export const BACKGROUNDS = ['home','school','office','hospital','park','archive','street'];
