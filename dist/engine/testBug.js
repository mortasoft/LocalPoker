"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HandEvaluator_1 = require("./HandEvaluator");
const Card_1 = require("./Card");
// Escenario 1:
// Jugador A tiene Par de Reyes (KK)
// Cartas: Kh, Ks (en mano), 2d, 3c, 4s, 7h, 9d (comunitarias)
const playerA = [
    new Card_1.Card('H', 13), // K
    new Card_1.Card('S', 13), // K
    new Card_1.Card('D', 2),
    new Card_1.Card('C', 3),
    new Card_1.Card('S', 4),
    new Card_1.Card('H', 7),
    new Card_1.Card('D', 9),
];
// Jugador B tiene Doble Par de Ases y Seises (AA y 66)
// Cartas: Ah, 6c (en mano), As, 6d, 2d, 3c, 9h (comunitarias)
// O bien: tiene en sus 7 cartas As, As, 6, 6, y otras cartas bajas
const playerB = [
    new Card_1.Card('H', 14), // A
    new Card_1.Card('C', 6), // 6
    new Card_1.Card('S', 14), // A
    new Card_1.Card('D', 6), // 6
    new Card_1.Card('D', 2),
    new Card_1.Card('C', 3),
    new Card_1.Card('H', 9),
];
const evalA = HandEvaluator_1.HandEvaluator.evaluate7CardHand(playerA);
const evalB = HandEvaluator_1.HandEvaluator.evaluate7CardHand(playerB);
console.log('Evaluación Jugador A (KK):', evalA.name, '(Rank:', evalA.rank, ')');
console.log('Evaluación Jugador B (AA y 66):', evalB.name, '(Rank:', evalB.rank, ')');
const comp = HandEvaluator_1.HandEvaluator.compareHands(evalB, evalA);
console.log('Comparación (B vs A):', comp > 0 ? 'B gana (Correcto)' : 'A gana (ERROR)');
