// js/coaching/ip_monocolor.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";
import { toIntent } from "./intent-adapter.js";

const COACHING = {
  title: "Plan (IP MONOCOLOR)",
  base: "BET 33% todo el rango.",

  lineByIntent: {
    MANO_MUY_FUERTE: "BET 33%",
    MANO_FUERTE: "BET 33%",
    MANO_MEDIA: "BET 33%",
    SD_VALUE: "BET 33%",
    MANO_SEMIFAROL: "BET 33%",
    MANO_AIRE: "BET 33%",
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
    "MONOCOLOR: tamaño chico con rango completo.",
    "Si te raiséan, evitá pagar por curiosidad.",
  ],
};

export const coachingIPMonocolor = {
  id: "IP_MONOCOLOR",

  match(rec) {
    return rec?.spot?.startsWith("IP_") && rec?.spot?.endsWith("_MONOCOLOR");
  },

  decideAction({ ipState, ini }) {
    if (!ini) return "CHECK";
    if (ipState !== "IP") return "CHECK";
    return "BET 33%";
  },

  build({ rec, heroCards, boardCards }) {
    const handCat =
      heroCards?.length === 2 && boardCards?.length === 3
        ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards))
        : null;

    const intent = handCat ? toIntent(handCat) : null;
    const suggestedLine = intent ? COACHING.lineByIntent[intent] || "" : "";

    const actionUpper = (rec?.action || "").toUpperCase();
    const isBet33 =
      actionUpper.includes("BET 33") ||
      actionUpper.includes("BET33") ||
      actionUpper.includes("33%");

    return {
      title: COACHING.title,
      base: COACHING.base,
      handCat,
      intent,
      line: suggestedLine,
      isBet33,
      vsRaise: intent ? COACHING.vsRaiseByIntent[intent] || "" : "",
      reminders: COACHING.reminders,
      strictTrigger: {
        requiresHandCat: "AIR",
        requiresBet33: true,
      },
    };
  },
};
