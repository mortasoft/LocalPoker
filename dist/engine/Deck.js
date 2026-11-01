"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
const Card_1 = require("./Card");
class Deck {
    cards = [];
    constructor() {
        this.reset();
    }
    reset() {
        this.cards = [];
        const suits = ['H', 'D', 'C', 'S'];
        // Values 2 to 14 (Ace)
        for (const suit of suits) {
            for (let value = 2; value <= 14; value++) {
                this.cards.push(new Card_1.Card(suit, value));
            }
        }
        this.shuffle();
    }
    shuffle() {
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    draw() {
        const card = this.cards.pop();
        if (!card) {
            throw new Error('No cards left in the deck');
        }
        return card;
    }
    getRemainingCount() {
        return this.cards.length;
    }
}
exports.Deck = Deck;
