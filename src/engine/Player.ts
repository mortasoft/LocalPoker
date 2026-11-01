import { Card } from './Card';

export class Player {
  public cards: Card[] = [];
  public currentBet: number = 0;
  public totalRoundBet: number = 0;
  public isFolded: boolean = false;
  public isAllIn: boolean = false;
  public isReady: boolean = false;
  public isActive: boolean = true; // Set to false if player disconnects or sits out
  public lastAction: string | null = null;
  public actionTime: number | null = null; // timestamp of last action

  constructor(
    public id: string,      // socket ID or user ID
    public username: string,
    public chips: number     // initial stack size
  ) {}

  resetForNewRound(): void {
    this.cards = [];
    this.currentBet = 0;
    this.totalRoundBet = 0;
    this.isFolded = false;
    this.isAllIn = false;
    this.lastAction = null;
    this.actionTime = null;
    // Keep isReady and isActive as they are managed by lobby/connection state
  }

  resetForNewBettingRound(): void {
    this.currentBet = 0;
    this.lastAction = null;
  }

  bet(amount: number): number {
    if (amount > this.chips) {
      throw new Error(`Insufficient chips: requested ${amount}, has ${this.chips}`);
    }
    
    this.chips -= amount;
    this.currentBet += amount;
    this.totalRoundBet += amount;

    if (this.chips === 0) {
      this.isAllIn = true;
    }

    return amount;
  }
}
