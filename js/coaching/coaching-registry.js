// js/coaching/coaching-registry.js
import { coachingOfensivoSeco } from "./ofensivo-seco.js";
import { coachingOfensivoCoordinado } from "./ofensivo-coordinado.js";

const ALL = [
  coachingOfensivoSeco,
  coachingOfensivoCoordinado,
];

export function pickCoaching(rec) {
  for (const m of ALL) {
    if (m.match(rec)) return m;
  }
  return null;
}



