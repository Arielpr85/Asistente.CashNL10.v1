// js/coaching/ip_pareado_neutro.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";
import { toIntent } from "./intent-adapter.js";

const COACHING = {
  title: "Plan (IP PAREADO NEUTRO)",
  base: "C-BET 50% todo el rango.",

  lineByIntent: {
    MANO_MUY_FUERTE: "BET 50%",
    MANO_FUERTE: "BET 50%",
    MANO_MEDIA: "BET 50%",
    SD_VALUE: "BET 50%",
    MANO_SEMIFAROL: "BET 50%",
    MANO_AIRE: "BET 50%",
  },

  vsRaiseByIntent: {
    MANO_MUY_FUERTE: "VS RAISE: 3BET (por valor).",
    MANO_FUERTE: "VS RAISE: CALL si es chico; FOLD si es grande (MVP).",
    MANO_MEDIA: "VS RAISE: FOLD.",
    SD_VALUE: "VS RAISE: FOLD.",
    MANO_SEMIFAROL: "VS RAISE: FOLD (MVP).",
    MANO_AIRE: "VS RAISE: FOLD SIEMPRE.",
  },

  reminders: [
    "PAREADO_NEUTRO: sizing medio con rango completo.",
    "Si te raiséan fuerte, evitá hero-calls (MVP).",
  ],
};

export const coachingIPPareadoNeutro = {
  id: "IP_PAREADO_NEUTRO",

  match(rec) {
    return rec?.spot === "IP_NEUTRO_PAREADO";
  },

  decideAction({ ipState, ini }) {
    if (!ini) return "CHECK";
    if (ipState !== "IP") return "CHECK";
    return "BET 50%";
  },

  build({ rec, heroCards, boardCards }) {
    const handCat =
      heroCards?.length === 2 && boardCards?.length === 3
        ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards))
        : null;

    const intent = handCat ? toIntent(handCat) : null;
    const suggestedLine = intent ? COACHING.lineByIntent[intent] || "" : "";

    const actionUpper = (rec?.action || "").toUpperCase();
    const isBet50 =
      actionUpper.includes("BET 50") ||
      actionUpper.includes("BET50") ||
      actionUpper.includes("50%");

    return {
      title: COACHING.title,
      base: COACHING.base,
      handCat,
      intent,
      line: suggestedLine,
      isBet50,
      vsRaise: intent ? COACHING.vsRaiseByIntent[intent] || "" : "",
      reminders: COACHING.reminders,
      strictTrigger: {
        requiresHandCat: "AIR",
        requiresBet33: false,
      },
    };
  },
};
