// js/coaching/ofensivo-seco.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";

const COACHING = {
  title: "Plan (OFENSIVO SECO)",
  base: "C-BET 33% todo el rango.",
  vsRaise: {
    MONSTER: "VS RAISE: 3BET (por valor).",
    TOP_PAIR_GOOD: "VS RAISE: CALL si es chico; FOLD si es grande.",
    TOP_PAIR_WEAK: "VS RAISE: FOLD (disciplina).",
    MID_PAIR: "VS RAISE: FOLD.",
    DRAW: "VS RAISE: FOLD (no pagar raises con equity dudosa).",
    BACKDOOR: "VS RAISE: FOLD.",
    AIR: "VS RAISE: FOLD SIEMPRE (modo estricto).",
  },
  reminders: [
    "En OFENSIVO_SECO el objetivo es imprimir EV con cbet chico, no hero-calls.",
    "Raise grande = fuerza. No inventes calls con aire.",
    "Si la app dice FOLD: es FOLD.",
  ],
};

export const coachingOfensivoSeco = {
  id: "OFENSIVO_SECO",

  match(rec) {
    return (rec?.note || "").toUpperCase().includes("OFENSIVO_SECO");
  },

  build({ rec, heroCards, boardCards }) {
    const actionUpper = (rec?.action || "").toUpperCase();
    const isBet33 =
      actionUpper.includes("BET 33") ||
      actionUpper.includes("BET33") ||
      actionUpper.includes("33%");

    const handCat =
      heroCards?.length === 2 && boardCards?.length === 3
        ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards))
        : null;

    return {
      title: COACHING.title,
      base: COACHING.base,
      handCat,
      isBet33,
      vsRaise: handCat ? COACHING.vsRaise[handCat] || "" : "",
      reminders: COACHING.reminders,

      // Anti-tilt MVP: solo exige AIR + bet chico
      strictTrigger: {
        requiresHandCat: "AIR",
        requiresBet33: true,
      },
    };
  },
};


