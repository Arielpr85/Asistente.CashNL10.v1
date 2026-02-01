// js/coaching/ofensivo-coordinado.js
import { evaluateHeroHandFlop } from '../hand-evaluator-flop.js';
import { adaptHandCatFromEval } from './handcat-adapter.js';
import { toIntent } from './intent-adapter.js';

const COACHING = {
  title: 'Plan (OFENSIVO COORDINADO)',
  base: 'BET 75% (valor + presión). Check: manos medias / SD value / aire.',

  // AHORA por INTENT
  vsRaiseByIntent: {
    MANO_MUY_FUERTE: 'VS RAISE: 3BET (por valor).',
    MANO_FUERTE: 'VS RAISE: CALL si es chico; FOLD si es grande (disciplina).',
    MANO_MEDIA: 'VS RAISE: FOLD.',
    MANO_SEMIFAROL: 'VS RAISE: FOLD (MVP). Más adelante: qué draws se bancan raise.',
    SD_VALUE: 'VS RAISE: FOLD.',
    MANO_AIRE: 'VS RAISE: FOLD SIEMPRE (anti-tilt).'
  },

  reminders: ['En OFENSIVO_COORDINADO apostás grande para castigar floats y cobrar equity.', 'Si te raiséan fuerte: no inventes hero-calls.', 'La disciplina acá vale oro: si dice FOLD, es FOLD.']
};

export const coachingOfensivoCoordinado = {
  id: 'OFENSIVO_COORDINADO',

  match(rec) {
    return rec?.texture === 'OFENSIVO_COORDINADO' && rec?.ini === true;
  },

  decideAction({ ipState, ini }) {
    if (!ini) return 'CHECK';
    if (ipState === 'IP') return 'BET 75%';
    return 'CHECK'; // OOP MVP
  },

  build({ rec, heroCards, boardCards }) {
    const actionUpper = (rec?.action || '').toUpperCase();
    const isBet75 = actionUpper.includes('BET 75') || actionUpper.includes('BET75') || actionUpper.includes('75%');

    const handCat = heroCards?.length === 2 && boardCards?.length === 3 ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards)) : null;

    const intent = handCat ? toIntent(handCat) : null;

    return {
      title: COACHING.title,
      base: COACHING.base,
      handCat,
      intent,
      isBet75,
      vsRaise: intent ? COACHING.vsRaiseByIntent[intent] || '' : '',
      reminders: COACHING.reminders,

      strictTrigger: { requiresHandCat: 'AIR', requiresBet33: false }
    };
  }
};
