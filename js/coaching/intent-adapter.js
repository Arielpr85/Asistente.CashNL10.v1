// js/coaching/intent-adapter.js
// Traduce categorías técnicas (MVP) a intención estratégica

export function toIntent(handCat) {
  switch (handCat) {
    case "MONSTER":
      return "MANO_MUY_FUERTE";

    case "TOP_PAIR_GOOD":
      return "MANO_FUERTE";

    case "TOP_PAIR_WEAK":
    case "MID_PAIR":
      return "MANO_MEDIA";

    case "DRAW":
      return "MANO_SEMIFAROL";

    case "BACKDOOR":
      return "SD_VALUE";

    case "AIR":
    default:
      return "MANO_AIRE";
  }
}
