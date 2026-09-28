// Standalone read-only review. No persistence, app boot, mechanics or forced encounters.
import { socialFixture } from "./social-fixtures.js";
import { meetSocial } from "../src/systems/social.js";
import { SOCIAL_NPCS } from "../content/social/catalog.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { gameScreen } from "../src/ui/card.js";
const id = new URLSearchParams(location.search).get("id") || "world_okafor";
if (!SOCIAL_NPCS[id]) throw Error("Unknown review identity");
const d = socialFixture("okafor");
meetSocial(d.state, id, "so_okafor_question");
const event = {
  ...CARD_BY_ID.so_okafor_question,
  npc: id,
  text: "Estudio visual de identidad. Esta vista de desarrollo no representa un encuentro ni modifica una partida.",
  variants: [],
};
document.querySelector("#app").innerHTML = gameScreen(d, event);
document.querySelectorAll("button").forEach((b) => (b.disabled = true));
