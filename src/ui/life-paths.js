import { DOMAINS, CAPABILITIES } from "../../content/life-paths/catalog.js";
import { capabilities, lifeMonth } from "../systems/life-paths.js";
import { esc } from "./helpers.js";
export function lifeProfile(s) {
  if (!s.life?.direction) return "";
  const learned = Object.keys(capabilities(s))
    .slice(0, 4)
    .map((id) => CAPABILITIES[id]);
  return `<div class="life-direction"><p>Has orientado tus días hacia <strong>${esc(DOMAINS[s.life.direction])}</strong>.</p>${learned.length ? `<p class="small muted">Lo que llevas contigo: ${learned.map(esc).join(", ")}.</p>` : ""}</div>`;
}
export function lifeMemory(s) {
  if (!s.life?.chapters.length) return "";
  const chapters = s.life.chapters.slice(-3).map((c) => {
    const years = Math.max(
      0,
      Math.floor(((c.to ?? lifeMonth(s)) - c.from) / 12),
    );
    return `${DOMAINS[c.domain]}${years >= 2 ? ` durante ${years} años` : ""}`;
  });
  return `<p class="life-trajectory">Sus decisiones le llevaron por ${chapters.map(esc).join("; después, ")}. Lo aprendido siguió formando parte de su vida.</p>`;
}
