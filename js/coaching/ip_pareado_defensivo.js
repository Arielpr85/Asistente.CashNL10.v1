// js/coaching/ip_pareado_defensivo.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";
import { toIntent } from "./intent-adapter.js";

const COACHING = {
  title: "Plan (IP PAREADO DEFENSIVO)",
  base: "Vs jugador malo: C-BET 33% rango. Vs jugador bueno: selectivo.",

  lineByIntent: {
    MANO_MUY_FUERTE: "BET 33%",
    MANO_FUERTE: "BET 33%",
    MANO_MEDIA: "CHECK",
    SD_VALUE: "CHECK",
    MANO_SEMIFAROL: "BET 33% (solo 8+ outs)",
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
    "PAREADO_DEFENSIVO: vs malo podés cbetear rango.",
    "Vs bueno: mantené check con manos medias/SD value.",
  ],
};

function isGoodOpponent(preflopCtx) {
  const tag = (preflopCtx?.opponentType || "").toString().toUpperCase();
  if (tag === "GOOD") return true;
  if (tag === "BAD") return false;
  return false;
}

export const coachingIPPareadoDefensivo = {
  id: "IP_PAREADO_DEFENSIVO",

  match(rec) {
    return rec?.spot === "IP_DEFENSIVO_PAREADO";
  },

  decideAction({ ipState, ini, intent, heroCards, boardCards, preflopCtx }) {
    if (!ini) return "CHECK";
    if (ipState !== "IP") return "CHECK";

    if (!isGoodOpponent(preflopCtx)) {
      return "BET 33%";
    }

    if (intent === "MANO_MUY_FUERTE") return "BET 33%";
    if (intent === "MANO_FUERTE") return "BET 33%";
    if (intent === "MANO_AIRE") return "BET 33%";

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

      return is8PlusOutsDraw ? "BET 33%" : "CHECK";
    }

    return "CHECK";
  },

  build({ rec, heroCards, boardCards, preflopCtx }) {
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

    const opponentLabel = isGoodOpponent(preflopCtx) ? "BUENO" : "MALO";

    return {
      title: COACHING.title,
      base: `${COACHING.base} (oponente: ${opponentLabel}).`,
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
