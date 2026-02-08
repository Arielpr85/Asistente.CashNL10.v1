// js/hand-evaluator-flop.js
// Evaluador de mano HERO vs FLOP (solo flop, sin turn/river)

const RANK_ORDER = "23456789TJQKA";

function rankVal(r) {
  return RANK_ORDER.indexOf(r);
}

function normalize(card) {
  if (typeof card === "object") return card;
  return { rank: card[0].toUpperCase(), suit: card[1].toLowerCase() };
}

function countBy(arr) {
  const m = {};
  arr.forEach((x) => (m[x] = (m[x] || 0) + 1));
  return m;
}

export function evaluateHeroHandFlop(heroCards, boardCards) {
  const hero = heroCards.map(normalize);
  const board = boardCards.map(normalize);
  const all = [...hero, ...board];

  const hr = hero.map((c) => c.rank);
  const br = board.map((c) => c.rank);
  const hs = hero.map((c) => c.suit);
  const bs = board.map((c) => c.suit);

  const rankCounts = countBy(all.map((c) => c.rank));
  const suitCounts = countBy(all.map((c) => c.suit));

  const boardMax = br.reduce((a, b) => (rankVal(a) > rankVal(b) ? a : b));

  const heroPairRanks = hr.filter((r) => br.includes(r));
  const isPocketPair = hr[0] === hr[1];
  const pocketRank = hr[0];

  // ======================
  // MADE HANDS
  // ======================

  // Set / Trips
  if (isPocketPair && br.includes(pocketRank)) {
    return baseResult("SET", { made: true, strength: "VERY_STRONG" });
  }

  // Two pair (hero hits two board cards)
  if (heroPairRanks.length === 2) {
    return baseResult("TWO_PAIR", { made: true, strength: "VERY_STRONG" });
  }

  // Overpair
  if (isPocketPair && rankVal(pocketRank) > rankVal(boardMax)) {
    return baseResult("OVERPAIR", { made: true, strength: "STRONG" });
  }

  // Demonstración: ranks del board ordenados (alto -> bajo)
  const boardSorted = [...br].sort((a, b) => rankVal(b) - rankVal(a));
  const boardHigh = boardSorted[0];
  const boardMid = boardSorted[1];
  const boardLow = boardSorted[2];

  // Pocket pair que NO toca el board (ej: QQ en K92, KK en A83, 22 en A83)
  if (isPocketPair && !br.includes(pocketRank)) {
    const pv = rankVal(pocketRank);

    // (Overpair ya lo cubriste arriba, pero por seguridad)
    if (pv > rankVal(boardHigh)) {
      return baseResult("OVERPAIR", { made: true, strength: "STRONG" });
    }

    // Pocket pair "alto" = por arriba de la segunda carta del board (ej: KK en A83, QQ en K92)
    if (pv > rankVal(boardMid)) {
      return baseResult("POCKET_PAIR_HIGH", { made: true, strength: "MEDIUM" });
    }

    // Pocket pair "medio" = entre 2da y 3ra del board
    if (pv > rankVal(boardLow)) {
      return baseResult("POCKET_PAIR_MID", { made: true, strength: "WEAK" });
    }

    // Pocket pair "bajo" = por debajo de la 3ra carta del board (ej: 22 en A83)
    return baseResult("POCKET_PAIR_LOW", { made: true, strength: "WEAK" });
  }

  // Top pair
  if (heroPairRanks.includes(boardMax)) {
    const kicker = hr.find((r) => r !== boardMax);
    const goodKicker = "AKQJT".includes(kicker);
    return baseResult(goodKicker ? "TOP_PAIR_GOOD" : "TOP_PAIR_WEAK", {
      made: true,
      strength: goodKicker ? "STRONG" : "MEDIUM",
      pairLevel: "TOP",
    });
  }

  // Second / under pair
  if (heroPairRanks.length === 1) {
    const pairRank = heroPairRanks[0];
    const level =
      rankVal(pairRank) === rankVal(boardMax)
        ? "TOP"
        : rankVal(pairRank) >=
            rankVal(br.sort((a, b) => rankVal(b) - rankVal(a))[1])
          ? "SECOND"
          : "UNDER";

    return baseResult(level === "SECOND" ? "SECOND_PAIR" : "UNDERPAIR", {
      made: true,
      strength: "WEAK",
      pairLevel: level,
    });
  }

  // ======================
  // DRAWS
  // ======================

  // Flush draws
  const heroSuits = countBy(hs);
  for (const suit in heroSuits) {
    if ((suitCounts[suit] || 0) === 4) {
      const isNut = hr.includes("A");
      return baseResult(isNut ? "NUT_FLUSH_DRAW" : "FLUSH_DRAW", {
        draws: { flush: true, nutFlush: isNut },
      });
    }
  }

  // Backdoor flush
  for (const suit in heroSuits) {
    if ((suitCounts[suit] || 0) === 3) {
      return baseResult("BACKDOOR_FLUSH", { draws: { backdoorFlush: true } });
    }
  }

  // Straight draws (simple MVP)
  const vals = [...new Set(all.map((c) => rankVal(c.rank)))].sort(
    (a, b) => a - b,
  );
  let consec = 0;
  let maxConsec = 0;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] === vals[i - 1] + 1) {
      consec++;
      maxConsec = Math.max(maxConsec, consec);
    } else {
      consec = 0;
    }
  }

  if (maxConsec >= 3) {
    return baseResult("OESD", { draws: { straight: true, oesd: true } });
  }
  if (maxConsec === 2) {
    return baseResult("GUTSHOT", { draws: { straight: true, gutshot: true } });
  }

  // ======================
  // AIR
  // ======================
  return baseResult("AIR", {});
}

function baseResult(category, extra = {}) {
  return {
    category,
    made: false,
    strength: "NONE",
    pairLevel: null,
    draws: {
      flush: false,
      nutFlush: false,
      backdoorFlush: false,
      straight: false,
      oesd: false,
      gutshot: false,
    },
    ...extra,
  };
}
