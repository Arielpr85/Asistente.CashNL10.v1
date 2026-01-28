// js/coaching/ofensivo-coordinado.js

// Hand categories (MVP)
// MONSTER | TOP_PAIR_GOOD | TOP_PAIR_WEAK | MID_PAIR | DRAW | BACKDOOR | AIR
function getHandCatMVP(heroCards, boardCards) {
  const rankOrder = "23456789TJQKA";
  const ranks = (cards) => cards.map((c) => (c.rank || c[0]).toUpperCase());
  const suits = (cards) => cards.map((c) => (c.suit || c[1]).toLowerCase());

  const hr = ranks(heroCards);
  const br = ranks(boardCards);
  const hs = suits(heroCards);
  const bs = suits(boardCards);

  const boardSet = new Set(br);
  const heroPairs = hr.filter((r) => boardSet.has(r)).length;
  const isPocketPair = hr.length === 2 && hr[0] === hr[1];

  // Monster (MVP)
  if (isPocketPair && br.includes(hr[0])) return "MONSTER";
  if (heroPairs === 2) return "MONSTER";

  // Top pair
  const maxBoardRank = br.reduce((a, b) =>
    rankOrder.indexOf(a) > rankOrder.indexOf(b) ? a : b
  );
  const hasTopPair = hr.includes(maxBoardRank);

  if (hasTopPair) {
    const kicker = hr[0] === maxBoardRank ? hr[1] : hr[0];
    const good = "AKQJT".includes(kicker);
    return good ? "TOP_PAIR_GOOD" : "TOP_PAIR_WEAK";
  }

  // Flush draw simple
  const suitCounts = {};
  [...hs, ...bs].forEach((s) => (suitCounts[s] = (suitCounts[s] || 0) + 1));
  const hasFD = Object.values(suitCounts).some((n) => n >= 4);
  if (hasFD) return "DRAW";

  // Backdoor FD
  const hasBDFD = Object.values(suitCounts).some((n) => n === 3);
  if (hasBDFD) return "BACKDOOR";

  if (heroPairs === 1) return "MID_PAIR";
  return "AIR";
}

const COACHING = {
  title: "Plan (OFENSIVO COORDINADO)",
  base: "BET 75% (valor + presión). Check: manos medias / SD value / aire.",
  vsRaise: {
    MONSTER: "VS RAISE: 3BET (por valor).",
    TOP_PAIR_GOOD: "VS RAISE: CALL si es chico; FOLD si es grande (disciplina).",
    TOP_PAIR_WEAK: "VS RAISE: FOLD.",
    MID_PAIR: "VS RAISE: FOLD (no te cases en boards coordinados).",
    DRAW: "VS RAISE: FOLD (MVP). Más adelante: definir cuáles draws se bancan raise.",
    BACKDOOR: "VS RAISE: FOLD.",
    AIR: "VS RAISE: FOLD SIEMPRE (anti-tilt).",
  },
  reminders: [
    "En OFENSIVO_COORDINADO apostás grande para castigar floats y cobrar equity.",
    "Si te raiséan fuerte: no inventes hero-calls.",
    "La disciplina acá vale oro: si dice FOLD, es FOLD.",
  ],
};

function build({ rec, heroCards, boardCards }) {
  const handCat =
    heroCards?.length === 2 && boardCards?.length === 3
      ? getHandCatMVP(heroCards, boardCards)
      : null;

  return {
    title: COACHING.title,
    base: COACHING.base,
    handCat,
    vsRaise: handCat ? (COACHING.vsRaise[handCat] || "") : "",
    reminders: COACHING.reminders,
    strictTrigger: { requiresHandCat: "AIR", requiresBet33: false },
  };
}

export const coachingOfensivoCoordinado = {
  match(rec) {
    const note = (rec?.note || "").toUpperCase();
    return note.includes("OFENSIVO_COORDINADO");
  },
  build, // usa tu export function build({rec, heroCards, boardCards})
};



