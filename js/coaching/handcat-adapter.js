// js/coaching/handcat-adapter.js
export function adaptHandCatFromEval(ev) {
  if (!ev || !ev.category) return "AIR";

  if (ev.category === "SET" || ev.category === "TWO_PAIR") return "MONSTER";
  if (ev.category === "OVERPAIR") return "TOP_PAIR_GOOD";

  if (ev.category === "TOP_PAIR_GOOD") return "TOP_PAIR_GOOD";
  if (ev.category === "TOP_PAIR_WEAK") return "TOP_PAIR_WEAK";

  if (ev.category === "SECOND_PAIR" || ev.category === "UNDERPAIR") return "MID_PAIR";
  if (ev.category === "POCKET_PAIR_HIGH" || ev.category === "POCKET_PAIR_MID") return "MID_PAIR";
  if (ev.category === "POCKET_PAIR_LOW") return "AIR";

  if (ev.category === "NUT_FLUSH_DRAW" || ev.category === "FLUSH_DRAW") return "DRAW";
  if (ev.category === "OESD" || ev.category === "GUTSHOT") return "DRAW";
  if (ev.category === "BACKDOOR_FLUSH") return "BACKDOOR";

  return "AIR";
}
