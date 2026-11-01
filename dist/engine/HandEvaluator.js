"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandEvaluator = exports.HandRankNames = void 0;
exports.HandRankNames = [
    'Carta Alta',
    'Par',
    'Doble Par',
    'Tercia',
    'Escalera',
    'Color',
    'Full House',
    'Póker (Cuatro de una clase)',
    'Escalera de Color',
];
class HandEvaluator {
    /**
     * Evaluates a list of 7 cards (2 pocket + 5 community) and returns the best 5-card hand.
     */
    static evaluate7CardHand(sevenCards) {
        if (sevenCards.length < 5) {
            throw new Error('Need at least 5 cards to evaluate a hand');
        }
        // If we have exactly 5 cards, evaluate them directly
        if (sevenCards.length === 5) {
            return this.evaluate5CardHand(sevenCards);
        }
        // Get all 5-card combinations out of 7 (or 6 if only 6 cards are dealt yet)
        const combinations = this.getCombinations(sevenCards, 5);
        let bestHand = null;
        for (const combo of combinations) {
            const evaluated = this.evaluate5CardHand(combo);
            if (!bestHand || this.compareHands(evaluated, bestHand) > 0) {
                bestHand = evaluated;
            }
        }
        return bestHand;
    }
    /**
     * Compares handA and handB.
     * Returns positive if handA is better, negative if handB is better, 0 if they are tied.
     */
    static compareHands(handA, handB) {
        if (handA.rank !== handB.rank) {
            return handA.rank - handB.rank;
        }
        const len = Math.min(handA.tieBreakers.length, handB.tieBreakers.length);
        for (let i = 0; i < len; i++) {
            if (handA.tieBreakers[i] !== handB.tieBreakers[i]) {
                return handA.tieBreakers[i] - handB.tieBreakers[i];
            }
        }
        return 0;
    }
    /**
     * Evaluates exactly 5 cards.
     */
    static evaluate5CardHand(cards) {
        if (cards.length !== 5) {
            throw new Error('Must evaluate exactly 5 cards');
        }
        // Sort cards by value descending
        const sorted = [...cards].sort((a, b) => b.value - a.value);
        const values = sorted.map(c => c.value);
        const suits = sorted.map(c => c.suit);
        const isFlush = suits.every(s => s === suits[0]);
        // Check straight
        let isStraight = false;
        let straightHighCard = 0;
        // Normal straight (e.g. 10, 9, 8, 7, 6 or A, K, Q, J, 10)
        const uniqueValues = Array.from(new Set(values));
        if (uniqueValues.length === 5) {
            if (values[0] - values[4] === 4) {
                isStraight = true;
                straightHighCard = values[0];
            }
            else if (values[0] === 14 && // Ace
                values[1] === 5 &&
                values[2] === 4 &&
                values[3] === 3 &&
                values[4] === 2) {
                // Ace-low straight (5, 4, 3, 2, A)
                isStraight = true;
                straightHighCard = 5;
            }
        }
        // Count occurrences of each rank
        const counts = {};
        for (const v of values) {
            counts[v] = (counts[v] || 0) + 1;
        }
        const countPairs = Object.entries(counts).map(([valStr, count]) => ({
            val: parseInt(valStr),
            count,
        }));
        // Sort by count desc, then by value desc
        countPairs.sort((a, b) => {
            if (a.count !== b.count) {
                return b.count - a.count;
            }
            return b.val - a.val;
        });
        const highestCount = countPairs[0].count;
        const secondHighestCount = countPairs[1]?.count || 0;
        // Determine hand type
        if (isFlush && isStraight) {
            return {
                rank: 8,
                tieBreakers: [straightHighCard],
                name: straightHighCard === 14 ? 'Escalera Real' : 'Escalera de Color',
                cards: sorted,
            };
        }
        if (highestCount === 4) {
            // Four of a kind
            const quadVal = countPairs[0].val;
            const kickerVal = countPairs[1].val;
            return {
                rank: 7,
                tieBreakers: [quadVal, kickerVal],
                name: `Póker de ${this.getCardNamePlural(quadVal)}`,
                cards: sorted,
            };
        }
        if (highestCount === 3 && secondHighestCount === 2) {
            // Full house
            const tripleVal = countPairs[0].val;
            const pairVal = countPairs[1].val;
            return {
                rank: 6,
                tieBreakers: [tripleVal, pairVal],
                name: `Full House de ${this.getCardNamePlural(tripleVal)} con ${this.getCardNamePlural(pairVal)}`,
                cards: sorted,
            };
        }
        if (isFlush) {
            return {
                rank: 5,
                tieBreakers: values,
                name: `Color al ${this.getCardNameSingular(values[0])}`,
                cards: sorted,
            };
        }
        if (isStraight) {
            return {
                rank: 4,
                tieBreakers: [straightHighCard],
                name: `Escalera al ${this.getCardNameSingular(straightHighCard)}`,
                cards: sorted,
            };
        }
        if (highestCount === 3) {
            // Three of a kind
            const tripleVal = countPairs[0].val;
            const kickers = countPairs.slice(1).map(p => p.val);
            return {
                rank: 3,
                tieBreakers: [tripleVal, ...kickers],
                name: `Tercia de ${this.getCardNamePlural(tripleVal)}`,
                cards: sorted,
            };
        }
        if (highestCount === 2 && secondHighestCount === 2) {
            // Two pair
            const highPair = countPairs[0].val;
            const lowPair = countPairs[1].val;
            const kicker = countPairs[2].val;
            return {
                rank: 2,
                tieBreakers: [highPair, lowPair, kicker],
                name: `Doble Par de ${this.getCardNamePlural(highPair)} y ${this.getCardNamePlural(lowPair)}`,
                cards: sorted,
            };
        }
        if (highestCount === 2) {
            // One pair
            const pairVal = countPairs[0].val;
            const kickers = countPairs.slice(1).map(p => p.val);
            return {
                rank: 1,
                tieBreakers: [pairVal, ...kickers],
                name: `Par de ${this.getCardNamePlural(pairVal)}`,
                cards: sorted,
            };
        }
        // High card
        return {
            rank: 0,
            tieBreakers: values,
            name: `Carta Alta ${this.getCardNameSingular(values[0])}`,
            cards: sorted,
        };
    }
    static getCardNameSingular(value) {
        const names = {
            2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete',
            8: 'Ocho', 9: 'Nueve', 10: 'Diez', 11: 'Jota', 12: 'Reina', 13: 'Rey', 14: 'As'
        };
        return names[value] || value.toString();
    }
    static getCardNamePlural(value) {
        const names = {
            2: 'Doses', 3: 'Treses', 4: 'Cuatros', 5: 'Cincos', 6: 'Seises', 7: 'Sietes',
            8: 'Ochos', 9: 'Nueves', 10: 'Dieces', 11: 'Jotas', 12: 'Reinas', 13: 'Reyes', 14: 'Ases'
        };
        return names[value] || value.toString() + 's';
    }
    static getCombinations(array, k) {
        const result = [];
        function helper(start, combo) {
            if (combo.length === k) {
                result.push([...combo]);
                return;
            }
            for (let i = start; i < array.length; i++) {
                combo.push(array[i]);
                helper(i + 1, combo);
                combo.pop();
            }
        }
        helper(0, []);
        return result;
    }
}
exports.HandEvaluator = HandEvaluator;
