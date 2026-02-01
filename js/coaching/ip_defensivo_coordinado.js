// js/coaching/ip_defensivo_coordinado.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";
import { toIntent } from "./intent-adapter.js";

const COACHING = {
  title: "Plan (IP DEFENSIVO COORDINADO)",
  base: "Base: CHECK. Board conectado / draws → evitá inflar el pozo sin ventaja clara.",

  // Misma base que definiste (MVP)
  lineByIntent: {
    MANO_MUY_FUERTE: "BET 75%",
    MANO_FUERTE: "BET 75%",
    MANO_MEDIA: "CHECK",
    SD_VALUE: "CHECK",
    MANO_SEMIFAROL: "BET 75% (selectivo)",
    MANO_AIRE: "CHECK",
  },

  vsRaiseByIntent: {
    MANO_MUY_FUERTE: "VS RAISE: 3BET (por valor).",
    MANO_FUERTE: "VS RAISE: FOLD a raises grandes (MVP).",
    MANO_MEDIA: "VS RAISE: FOLD.",
    SD_VALUE: "VS RAISE: FOLD.",
    MANO_SEMIFAROL: "VS RAISE: FOLD (MVP).",
    MANO_AIRE: "VS RAISE: FOLD SIEMPRE.",
  },

  reminders: [
    "DEFENSIVO_COORDINADO: hay mucha equity en juego → no te cases con manos medias.",
    "La línea base es CHECK. Apostás grande con muy fuerte/fuerte y algunos semibluffs.",
    "Si te raiséan: por defecto FOLD (MVP), salvo muy fuerte.",
  ],
};

export const coachingIPDefensivoCoordinado = {
  id: "IP_DEFENSIVO_COORDINADO",

  match(rec) {
    return rec?.spot === "IP_DEFENSIVO_COORDINADO";
  },

  decideAction({ ipState, ini, intent, heroCards, boardCards }) {

    if (!ini) return "CHECK";
    if (ipState !== "IP") return "CHECK"; // OOP MVP

    if (intent === "MANO_MUY_FUERTE") return "BET 75%";
    if (intent === "MANO_FUERTE") return "BET 75%";

    if (intent === "MANO_SEMIFAROL") {
      // Regla real: BET 75% solo con 8+ outs
      // => OESD (~8) y Flush Draw (~9) ✅
      // => GUTSHOT (~4) ❌ (y backdoors ❌)
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
