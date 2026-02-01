// js/coaching/coaching-registry.js
import { coachingOfensivoSeco } from "./ofensivo-seco.js";
import { coachingOfensivoCoordinado } from "./ofensivo-coordinado.js";

import { coachingIPDefensivoSeco } from "./ip_defensivo_seco.js";
import { coachingIPDefensivoCoordinado } from "./ip_defensivo_coordinado.js";

const ALL = [
  coachingOfensivoSeco,
  coachingOfensivoCoordinado,
  coachingIPDefensivoSeco,
  coachingIPDefensivoCoordinado,
];

export function pickCoaching(rec) {
  for (const m of ALL) {
    try {
      if (m.match(rec)) return m;
    } catch {
      // ignorar módulos rotos
    }
  }
  return null;
}





