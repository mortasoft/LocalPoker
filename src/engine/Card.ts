export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type CardValue = number; // 2 to 14 (Jack = 11, Queen = 12, King = 13, Ace = 14)

export class Card {
  constructor(public suit: Suit, public value: CardValue) {}

  toString(): string {
    const valueMap: { [key: number]: string } = {
      11: 'J',
      12: 'Q',
      13: 'K',
      14: 'A',
    };
    const valStr = valueMap[this.value] || this.value.toString();
    const suitMap: { [key in Suit]: string } = {
      H: '♥',
      D: '♦',
      C: '♣',
      S: '♠',
    };
    return `${valStr}${suitMap[this.suit]}`;
  }

  toShortString(): string {
    const valueMap: { [key: number]: string } = {
      11: 'J',
      12: 'Q',
      13: 'K',
      14: 'A',
    };
    const valStr = valueMap[this.value] || this.value.toString();
    return `${valStr}${this.suit.toLowerCase()}`;
  }
}
