// js/coaching/ip_defensivo_seco.js
import { evaluateHeroHandFlop } from "../hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./handcat-adapter.js";
import { toIntent } from "./intent-adapter.js";

const COACHING = {
  title: "Plan (IP DEFENSIVO SECO)",
  base: "Base: CHECK. Apostás grande por valor y presión cuando corresponde.",

  // Línea base por intención (MVP, simple)
  lineByIntent: {
    MANO_MUY_FUERTE: "BET 75%",
    MANO_FUERTE: "BET 75%",
    MANO_MEDIA: "CHECK",
    SD_VALUE: "CHECK",
    MANO_SEMIFAROL: "BET 75% (selectivo)",
    MANO_AIRE: "CHECK",
  },

  // VS RAISE por intención (MVP)
  vsRaiseByIntent: {
    MANO_MUY_FUERTE: "VS RAISE: 3BET (por valor).",
    MANO_FUERTE: "VS RAISE: CALL si es chico; FOLD si es grande (MVP).",
    MANO_MEDIA: "VS RAISE: FOLD.",
    SD_VALUE: "VS RAISE: FOLD.",
    MANO_SEMIFAROL: "VS RAISE: FOLD (MVP).",
    MANO_AIRE: "VS RAISE: FOLD SIEMPRE.",
  },

  reminders: [
    "DEFENSIVO_SECO: el board favorece más al caller → priorizá control de pozo.",
    "Tu línea default es CHECK: apostás grande cuando tenés ventaja clara (valor / presión).",
    "Si te raiséan fuerte: no pagues por curiosidad (MVP: disciplina).",
  ],
};

export const coachingIPDefensivoSeco = {
  id: "IP_DEFENSIVO_SECO",

  match(rec) {
    return rec?.spot === "IP_DEFENSIVO_SECO";
  },

  decideAction({ ipState, ini, intent, handCat, heroCards, boardCards }) {
    if (!ini) return "CHECK";
    if (ipState !== "IP") return "CHECK"; // por ahora OOP MVP

    // tu tabla base (MVP)
    if (intent === "MANO_MUY_FUERTE") return "BET 75%";
    if (intent === "MANO_FUERTE") return "BET 75%";

    if (intent === "MANO_SEMIFAROL") {
      // Regla real: BET 75% solo con 5+ outs
      // En tu evaluator: FLUSH_DRAW / NUT_FLUSH_DRAW (~9 outs) y OESD (~8 outs) ✅
      // GUTSHOT (~4 outs) ❌
      const ev =
        heroCards?.length === 2 && boardCards?.length === 3
          ? evaluateHeroHandFlop(heroCards, boardCards)
          : null;

      const isStrongDraw =
        ev &&
        (ev.category === "NUT_FLUSH_DRAW" ||
          ev.category === "FLUSH_DRAW" ||
          ev.category === "OESD");

      return isStrongDraw ? "BET 75%" : "CHECK";
    }

    // MANO_MEDIA / SD_VALUE / MANO_AIRE
    return "CHECK";
  },

  build({ rec, heroCards, boardCards }) {
    const handCat =
      heroCards?.length === 2 && boardCards?.length === 3
        ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards))
        : null;

    const intent = handCat ? toIntent(handCat) : null;

    // Sugerencia teórica (independiente de lo que el engine haya devuelto)
    const suggestedLine = intent ? COACHING.lineByIntent[intent] || "" : "";

    // Detectamos si el engine devolvió bet grande (para UI/flags)
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

      // Lo que sugiere el coaching como "línea base"
      line: suggestedLine,

      // Flags útiles para debug / UI
      isBet75,

      // Respuesta vs raise basada en intención
      vsRaise: intent ? COACHING.vsRaiseByIntent[intent] || "" : "",

      reminders: COACHING.reminders,

      // Anti-tilt MVP: solo exige disciplina con aire cuando el engine te manda bet
      strictTrigger: {
        requiresHandCat: "AIR",
        requiresBet33: false,
      },
    };
  },
};
