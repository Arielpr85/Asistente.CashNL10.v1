// js/coaching/ofensivo-coordinado.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";

const COACHING = {
  title: "Plan (OFENSIVO COORDINADO)",
  base: "BET 75% (valor + presión). Check: manos medias / SD value / aire.",
  vsRaise: {
    MONSTER: "VS RAISE: 3BET (por valor).",
    TOP_PAIR_GOOD:
      "VS RAISE: CALL si es chico; FOLD si es grande (disciplina).",
    TOP_PAIR_WEAK: "VS RAISE: FOLD.",
    MID_PAIR: "VS RAISE: FOLD (no te cases en boards coordinados).",
    DRAW:
      "VS RAISE: FOLD (MVP). Más adelante: definir cuáles draws se bancan raise.",
    BACKDOOR: "VS RAISE: FOLD.",
    AIR: "VS RAISE: FOLD SIEMPRE (anti-tilt).",
  },
  reminders: [
    "En OFENSIVO_COORDINADO apostás grande para castigar floats y cobrar equity.",
    "Si te raiséan fuerte: no inventes hero-calls.",
    "La disciplina acá vale oro: si dice FOLD, es FOLD.",
  ],
};

export const coachingOfensivoCoordinado = {
  id: "OFENSIVO_COORDINADO",
  match(rec) {
    return (rec?.note || "").toUpperCase().includes("OFENSIVO_COORDINADO");
  },
  build({ rec, heroCards, boardCards }) {
    const actionUpper = (rec?.action || "").toUpperCase();
    const isBet75 =
      actionUpper.includes("BET 75") ||
      actionUpper.includes("BET75") ||
      actionUpper.includes("75%");

    const handCat =
      heroCards?.length === 2 && boardCards?.length === 3
        ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards))
        : null;

    return {
      title: COACHING.title,
      base: COACHING.base,
      handCat,
      isBet75,
      vsRaise: handCat ? COACHING.vsRaise[handCat] || "" : "",
      reminders: COACHING.reminders,
      strictTrigger: { requiresHandCat: "AIR", requiresBet33: false },
    };
  },
};



