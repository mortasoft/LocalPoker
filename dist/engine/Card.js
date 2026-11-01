"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
class Card {
    suit;
    value;
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }
    toString() {
        const valueMap = {
            11: 'J',
            12: 'Q',
            13: 'K',
            14: 'A',
        };
        const valStr = valueMap[this.value] || this.value.toString();
        const suitMap = {
            H: '♥',
            D: '♦',
            C: '♣',
            S: '♠',
        };
        return `${valStr}${suitMap[this.suit]}`;
    }
    toShortString() {
        const valueMap = {
            11: 'J',
            12: 'Q',
            13: 'K',
            14: 'A',
        };
        const valStr = valueMap[this.value] || this.value.toString();
        return `${valStr}${this.suit.toLowerCase()}`;
    }
}
exports.Card = Card;
