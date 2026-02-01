// js/coaching/coaching-registry.js
import { coachingOfensivoSeco } from "./ofensivo-seco.js";
import { coachingOfensivoCoordinado } from "./ofensivo-coordinado.js";

import { coachingIPDefensivoSeco } from "./ip_defensivo_seco.js";
import { coachingIPDefensivoCoordinado } from "./ip_defensivo_coordinado.js";
import { coachingIPNeutroSeco } from "./ip_neutro_seco.js";
import { coachingIPNeutroCoordinado } from "./ip_neutro_coordinado.js";
import { coachingIPPareadoOfensivo } from "./ip_pareado_ofensivo.js";
import { coachingIPPareadoDefensivo } from "./ip_pareado_defensivo.js";
import { coachingIPPareadoNeutro } from "./ip_pareado_neutro.js";
import { coachingIPMonocolor } from "./ip_monocolor.js";

const ALL = [
  coachingOfensivoSeco,
  coachingOfensivoCoordinado,
  coachingIPDefensivoSeco,
  coachingIPDefensivoCoordinado,
  coachingIPNeutroSeco,
  coachingIPNeutroCoordinado,
  coachingIPPareadoOfensivo,
  coachingIPPareadoDefensivo,
  coachingIPPareadoNeutro,
  coachingIPMonocolor,
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




