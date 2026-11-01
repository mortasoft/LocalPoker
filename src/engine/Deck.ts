import { Card, Suit, CardValue } from './Card';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cards = [];
    const suits: Suit[] = ['H', 'D', 'C', 'S'];
    // Values 2 to 14 (Ace)
    for (const suit of suits) {
      for (let value = 2; value <= 14; value++) {
        this.cards.push(new Card(suit, value));
      }
    }
    this.shuffle();
  }

  shuffle(): void {
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(): Card {
    const card = this.cards.pop();
    if (!card) {
      throw new Error('No cards left in the deck');
    }
    return card;
  }

  getRemainingCount(): number {
    return this.cards.length;
  }
}
