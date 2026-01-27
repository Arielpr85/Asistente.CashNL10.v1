// js/coaching/ofensivo-seco.js

function noteUpper(rec) {
  return (rec?.note || "").toUpperCase();
}

function isOfensivoSeco(rec) {
  return noteUpper(rec).includes("OFENSIVO_SECO");
}

// Hand categories (MVP) para coaching
// MONSTER | TOP_PAIR_GOOD | TOP_PAIR_WEAK | MID_PAIR | DRAW | BACKDOOR | AIR
function getHandCatMVP(heroCards, boardCards) {
  const ranks = (cards) => cards.map((c) => (c.rank || c[0]).toUpperCase());
  const suits = (cards) => cards.map((c) => (c.suit || c[1]).toLowerCase());

  const hr = ranks(heroCards);
  const br = ranks(boardCards);
  const hs = suits(heroCards);
  const bs = suits(boardCards);

  const boardSet = new Set(br);
  const heroPairs = hr.filter((r) => boardSet.has(r)).length;

  const isPocketPair = hr.length === 2 && hr[0] === hr[1];

  if (isPocketPair && br.includes(hr[0])) return "MONSTER";
  if (heroPairs === 2) return "MONSTER";

  const rankOrder = "23456789TJQKA";
  const maxBoardRank = br.reduce((a, b) =>
    rankOrder.indexOf(a) > rankOrder.indexOf(b) ? a : b
  );

  const hasTopPair = hr.includes(maxBoardRank);
  if (hasTopPair) {
    const kicker = hr[0] === maxBoardRank ? hr[1] : hr[0];
    const good = "AKQJT".includes(kicker);
    return good ? "TOP_PAIR_GOOD" : "TOP_PAIR_WEAK";
  }

  const suitCounts = {};
  [...hs, ...bs].forEach((s) => (suitCounts[s] = (suitCounts[s] || 0) + 1));
  const hasFD = Object.values(suitCounts).some((n) => n >= 4);
  if (hasFD) return "DRAW";

  const hasBDFD = Object.values(suitCounts).some((n) => n === 3);
  if (hasBDFD) return "BACKDOOR";

  if (heroPairs === 1) return "MID_PAIR";

  return "AIR";
}

export const coachingOfensivoSeco = {
  id: "OFENSIVO_SECO",
  match(rec) {
    return isOfensivoSeco(rec);
  },
  build({ rec, heroCards, boardCards }) {
    const actionUpper = (rec.action || "").toUpperCase();
    const isBet33 = actionUpper.includes("BET 33") || actionUpper.includes("BET33");

    const handCat =
      heroCards?.length === 2 && boardCards?.length === 3
        ? getHandCatMVP(heroCards, boardCards)
        : null;

    const vsRaiseMap = {
      MONSTER: "VS RAISE: 3BET (por valor).",
      TOP_PAIR_GOOD: "VS RAISE: CALL si es chico, FOLD si es grande.",
      TOP_PAIR_WEAK: "VS RAISE: FOLD (disciplina).",
      MID_PAIR: "VS RAISE: FOLD.",
      DRAW: "VS RAISE: FOLD (no pagar raises con equity dudosa).",
      BACKDOOR: "VS RAISE: FOLD.",
      AIR: "VS RAISE: FOLD SIEMPRE (modo estricto).",
    };

    return {
      title: "Plan (OFENSIVO SECO)",
      base: "C-BET 33% todo el rango.",
      handCat,
      isBet33,
      vsRaise: handCat ? (vsRaiseMap[handCat] || "") : "",
      reminders: [
        "En OFENSIVO_SECO el objetivo es imprimir EV con cbet chico, no hero-calls.",
        "Raise grande = fuerza. No inventes calls con aire.",
        "Si la app dice FOLD: es FOLD.",
      ],
      strictTrigger: {
        requiresBet33: true,
        requiresHandCat: "AIR",
      },
    };
  },
};

