// js/coaching/ip_neutro_coordinado.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";
import { toIntent } from "./intent-adapter.js";

const COACHING = {
  title: "Plan (IP NEUTRO COORDINADO)",
  base: "C-BET 75% con manos fuertes y semibluffs con 8+ outs. Check con el resto.",

  lineByIntent: {
    MANO_MUY_FUERTE: "BET 75%",
    MANO_FUERTE: "BET 75%",
    MANO_SEMIFAROL: "BET 75% (solo 8+ outs)",
    MANO_MEDIA: "CHECK",
    SD_VALUE: "CHECK",
    MANO_AIRE: "CHECK",
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
    "NEUTRO_COORDINADO: board conectado pero no extremo → agresión selectiva.",
    "Apostás grande con fuerte y semibluffs reales (8+ outs).",
    "Con manos medias/SD value priorizás check.",
  ],
};

export const coachingIPNeutroCoordinado = {
  id: "IP_NEUTRO_COORDINADO",

  match(rec) {
    return rec?.spot === "IP_NEUTRO_COORDINADO";
  },

  decideAction({ ipState, ini, intent, heroCards, boardCards }) {
    if (!ini) return "CHECK";
    if (ipState !== "IP") return "CHECK";

    if (intent === "MANO_MUY_FUERTE") return "BET 75%";
    if (intent === "MANO_FUERTE") return "BET 75%";

    if (intent === "MANO_SEMIFAROL") {
      const ev =
        heroCards?.length === 2 && boardCards?.length === 3
          ? evaluateHeroHandFlop(heroCards, boardCards)
          : null;
      const is8PlusOutsDraw =
        ev &&
        (ev.category === "OESD" ||
          ev.category === "FLUSH_DRAW" ||
          ev.category === "NUT_FLUSH_DRAW");

      return is8PlusOutsDraw ? "BET 75%" : "CHECK";
    }

    return "CHECK";
  },

  build({ rec, heroCards, boardCards }) {
    const handCat =
      heroCards?.length === 2 && boardCards?.length === 3
        ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards))
        : null;

    const intent = handCat ? toIntent(handCat) : null;
    const suggestedLine = intent ? COACHING.lineByIntent[intent] || "" : "";

    const actionUpper = (rec?.action || "").toUpperCase();
    const isBet75 =
      actionUpper.includes("BET 75") ||
      actionUpper.includes("BET75") ||
      actionUpper.includes("75%");

    return {
      title: COACHING.title,
      base: COACHING.base,
      handCat,
      intent,
      line: suggestedLine,
      isBet75,
      vsRaise: intent ? COACHING.vsRaiseByIntent[intent] || "" : "",
      reminders: COACHING.reminders,
      strictTrigger: {
        requiresHandCat: "AIR",
        requiresBet33: false,
      },
    };
  },
};
