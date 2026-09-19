import { EARLY } from './early.js';
import { ARCS } from './arcs.js';
import { LATER } from './later.js';
import { PATHS } from './paths.js';
import { MYSTERY } from './mystery.js';
export const CARDS=[...EARLY,...ARCS,...LATER,...PATHS,...MYSTERY];
export const CARD_BY_ID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
