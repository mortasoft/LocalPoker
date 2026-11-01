"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    id;
    username;
    chips;
    cards = [];
    currentBet = 0;
    totalRoundBet = 0;
    isFolded = false;
    isAllIn = false;
    isReady = false;
    isActive = true; // Set to false if player disconnects or sits out
    lastAction = null;
    actionTime = null; // timestamp of last action
    constructor(id, // socket ID or user ID
    username, chips // initial stack size
    ) {
        this.id = id;
        this.username = username;
        this.chips = chips;
    }
    resetForNewRound() {
        this.cards = [];
        this.currentBet = 0;
        this.totalRoundBet = 0;
        this.isFolded = false;
        this.isAllIn = false;
        this.lastAction = null;
        this.actionTime = null;
        // Keep isReady and isActive as they are managed by lobby/connection state
    }
    resetForNewBettingRound() {
        this.currentBet = 0;
        this.lastAction = null;
    }
    bet(amount) {
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
exports.Player = Player;
