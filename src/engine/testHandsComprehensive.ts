import { HandEvaluator } from './HandEvaluator';
import { Card } from './Card';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error('FAIL: ' + message);
  }
}

// Test case 1: Two pair (AA and 66) beats One pair (KK)
const handTwoPair = [
  new Card('H', 14), new Card('S', 14), // AA
  new Card('D', 6), new Card('C', 6),   // 66
  new Card('S', 2), new Card('H', 3), new Card('D', 9)
];
const handOnePair = [
  new Card('H', 13), new Card('S', 13), // KK
  new Card('D', 2), new Card('C', 3), new Card('S', 4), new Card('H', 7), new Card('D', 9)
];
const evalTP = HandEvaluator.evaluate7CardHand(handTwoPair);
const evalOP = HandEvaluator.evaluate7CardHand(handOnePair);
assert(evalTP.rank === 2, 'Should be Two Pair (rank 2)');
assert(evalOP.rank === 1, 'Should be One Pair (rank 1)');
assert(HandEvaluator.compareHands(evalTP, evalOP) > 0, 'Two pair must beat One pair');

// Test case 2: Three pair in 7 cards - should pick the highest two pairs
const handThreePair = [
  new Card('H', 14), new Card('S', 14), // AA
  new Card('D', 13), new Card('C', 13), // KK
  new Card('S', 6), new Card('H', 6),   // 66
  new Card('D', 2)
];
const evalThreeP = HandEvaluator.evaluate7CardHand(handThreePair);
assert(evalThreeP.rank === 2, 'Should be Two Pair');
assert(evalThreeP.tieBreakers[0] === 14, 'High pair must be Aces (14)');
assert(evalThreeP.tieBreakers[1] === 13, 'Low pair must be Kings (13)');
assert(evalThreeP.tieBreakers[2] === 6, 'Kicker must be 6');

// Test case 3: Full House beats Flush
const handFullHouse = [
  new Card('H', 10), new Card('S', 10), new Card('D', 10), // Three Tens
  new Card('C', 4), new Card('S', 4),                      // Two Fours
  new Card('D', 2), new Card('H', 3)
];
const handFlush = [
  new Card('H', 14), new Card('H', 10), new Card('H', 8), new Card('H', 7), new Card('H', 2),
  new Card('D', 3), new Card('C', 5)
];
const evalFH = HandEvaluator.evaluate7CardHand(handFullHouse);
const evalFl = HandEvaluator.evaluate7CardHand(handFlush);
assert(evalFH.rank === 6, 'Should be Full House (rank 6)');
assert(evalFl.rank === 5, 'Should be Flush (rank 5)');
assert(HandEvaluator.compareHands(evalFH, evalFl) > 0, 'Full House beats Flush');

// Test case 4: Straight A-5 (Ace-low straight)
const handAceLowStraight = [
  new Card('H', 14), // A
  new Card('D', 2),
  new Card('C', 3),
  new Card('S', 4),
  new Card('H', 5),
  new Card('D', 8),
  new Card('C', 9)
];
const evalALS = HandEvaluator.evaluate7CardHand(handAceLowStraight);
assert(evalALS.rank === 4, 'Should be Straight (rank 4)');
assert(evalALS.tieBreakers[0] === 5, 'High card of A-5 straight is 5');

// Test case 5: Comparing identical rank with kickers
// Player A has Pair of 10s with Ace, King, 9
const handPairA = [
  new Card('H', 10), new Card('S', 10),
  new Card('D', 14), new Card('C', 13), new Card('S', 9),
  new Card('H', 2), new Card('D', 3)
];
// Player B has Pair of 10s with Ace, Queen, 9
const handPairB = [
  new Card('H', 10), new Card('S', 10),
  new Card('D', 14), new Card('C', 12), new Card('S', 9),
  new Card('H', 2), new Card('D', 3)
];
const evalPA = HandEvaluator.evaluate7CardHand(handPairA);
const evalPB = HandEvaluator.evaluate7CardHand(handPairB);
assert(evalPA.rank === 1 && evalPB.rank === 1, 'Both should be One Pair');
assert(HandEvaluator.compareHands(evalPA, evalPB) > 0, 'Pair A beats Pair B because of King kicker');

console.log('✅ ¡Todas las pruebas exhaustivas de manos de poker pasaron exitosamente!');
