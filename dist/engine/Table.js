"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const Deck_1 = require("./Deck");
const HandEvaluator_1 = require("./HandEvaluator");
class Table {
    id;
    players = [];
    deck;
    communityCards = [];
    stage = 'WAITING';
    dealerIndex = 0;
    sbIndex = -1;
    bbIndex = -1;
    currentTurn = -1;
    currentHighestBet = 0;
    minRaise = 0;
    lastRaiseAmount = 0;
    smallBlindAmount;
    bigBlindAmount;
    hasActedMap = new Map();
    // Showdown result details to send to client
    showdownResults = null;
    constructor(id, smallBlind = 10, bigBlind = 20) {
        this.id = id;
        this.deck = new Deck_1.Deck();
        this.smallBlindAmount = smallBlind;
        this.bigBlindAmount = bigBlind;
    }
    addPlayer(player) {
        if (this.players.find(p => p.id === player.id)) {
            return;
        }
        this.players.push(player);
    }
    removePlayer(playerId) {
        const idx = this.players.findIndex(p => p.id === playerId);
        if (idx !== -1) {
            this.players.splice(idx, 1);
            // Adjust turns if game is active
            if (this.stage !== 'WAITING') {
                // If it was their turn, move turn
                if (this.currentTurn === idx) {
                    this.moveToNextTurn();
                }
                else if (this.currentTurn > idx) {
                    this.currentTurn--;
                }
                // Adjust SB / BB / Dealer indices if needed
                if (this.dealerIndex >= this.players.length)
                    this.dealerIndex = 0;
            }
        }
    }
    getPlayer(id) {
        return this.players.find(p => p.id === id);
    }
    getPlayers() {
        return this.players;
    }
    getActivePlayersCount() {
        return this.players.filter(p => p.isActive && !p.isFolded).length;
    }
    getInHandPlayersCount() {
        return this.players.filter(p => !p.isFolded).length;
    }
    startGame() {
        const startingPlayers = this.players.filter(p => p.isActive);
        if (startingPlayers.length < 2) {
            throw new Error('Necesitas al menos 2 jugadores activos para iniciar.');
        }
        this.stage = 'PRE_FLOP';
        this.communityCards = [];
        this.showdownResults = null;
        // Reset players for new hand
        for (const p of this.players) {
            p.resetForNewRound();
        }
        this.deck.reset();
        // Assign Dealer, SB, BB
        this.assignRoles();
        // Deal pocket cards (2 each)
        for (let i = 0; i < 2; i++) {
            for (const p of this.players) {
                if (p.isActive) {
                    p.cards.push(this.deck.draw());
                }
            }
        }
        // Post Blinds
        const sbPlayer = this.players[this.sbIndex];
        const bbPlayer = this.players[this.bbIndex];
        const actualSB = Math.min(sbPlayer.chips, this.smallBlindAmount);
        sbPlayer.bet(actualSB);
        const actualBB = Math.min(bbPlayer.chips, this.bigBlindAmount);
        bbPlayer.bet(actualBB);
        this.currentHighestBet = this.bigBlindAmount;
        this.lastRaiseAmount = this.bigBlindAmount;
        this.minRaise = this.bigBlindAmount * 2; // minimum to raise is to double the BB (2 * BB)
        // Pre-flop action starts left of Big Blind
        this.currentTurn = (this.bbIndex + 1) % this.players.length;
        // Skip folded/all-in/inactive players (though at start they shouldn't be folded)
        while (!this.players[this.currentTurn].isActive || this.players[this.currentTurn].isAllIn) {
            this.currentTurn = (this.currentTurn + 1) % this.players.length;
        }
        // Initialize acting tracker
        this.hasActedMap.clear();
        for (const p of this.players) {
            if (p.isActive && !p.isAllIn) {
                this.hasActedMap.set(p.id, false);
            }
        }
    }
    assignRoles() {
        const active = this.players.filter(p => p.isActive);
        const activeCount = active.length;
        // Move dealer button clockwise
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        while (!this.players[this.dealerIndex].isActive) {
            this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        }
        if (activeCount === 2) {
            // In heads-up: Dealer is SB, other is BB
            this.sbIndex = this.dealerIndex;
            let bbIdx = (this.dealerIndex + 1) % this.players.length;
            while (!this.players[bbIdx].isActive) {
                bbIdx = (bbIdx + 1) % this.players.length;
            }
            this.bbIndex = bbIdx;
        }
        else {
            // 3+ players
            // SB is first active clockwise from Dealer
            let sbIdx = (this.dealerIndex + 1) % this.players.length;
            while (!this.players[sbIdx].isActive) {
                sbIdx = (sbIdx + 1) % this.players.length;
            }
            this.sbIndex = sbIdx;
            // BB is second active clockwise from Dealer
            let bbIdx = (sbIdx + 1) % this.players.length;
            while (!this.players[bbIdx].isActive) {
                bbIdx = (bbIdx + 1) % this.players.length;
            }
            this.bbIndex = bbIdx;
        }
    }
    initBettingRound() {
        this.currentHighestBet = 0;
        this.lastRaiseAmount = this.bigBlindAmount;
        this.minRaise = this.bigBlindAmount;
        for (const p of this.players) {
            p.resetForNewBettingRound();
        }
        this.hasActedMap.clear();
        for (const p of this.players) {
            if (p.isActive && !p.isFolded && !p.isAllIn) {
                this.hasActedMap.set(p.id, false);
            }
        }
        // Post-flop action starts with first active player left of Dealer (SB position)
        this.currentTurn = (this.dealerIndex + 1) % this.players.length;
        this.findNextActiveTurn();
    }
    findNextActiveTurn() {
        let checkedCount = 0;
        while (checkedCount < this.players.length &&
            (!this.players[this.currentTurn].isActive ||
                this.players[this.currentTurn].isFolded ||
                this.players[this.currentTurn].isAllIn)) {
            this.currentTurn = (this.currentTurn + 1) % this.players.length;
            checkedCount++;
        }
        if (checkedCount >= this.players.length) {
            // No active players left who can act
            this.currentTurn = -1;
        }
    }
    moveToNextTurn() {
        if (this.currentTurn === -1)
            return;
        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.findNextActiveTurn();
    }
    /**
     * Action executed by a player
     * @param playerId player executing the action
     * @param action 'fold' | 'check' | 'call' | 'raise'
     * @param amount target bet size (total bet in this betting round)
     */
    executeAction(playerId, action, amount) {
        const player = this.getPlayer(playerId);
        if (!player)
            throw new Error('Jugador no encontrado');
        if (this.stage === 'WAITING' || this.stage === 'SHOWDOWN') {
            throw new Error('El juego no está en ronda de apuestas activa.');
        }
        if (this.currentTurn === -1 || this.players[this.currentTurn].id !== playerId) {
            throw new Error('No es tu turno');
        }
        player.actionTime = Date.now();
        switch (action) {
            case 'fold':
                player.isFolded = true;
                player.lastAction = 'FOLD';
                this.hasActedMap.delete(player.id);
                break;
            case 'check':
                if (player.currentBet !== this.currentHighestBet) {
                    throw new Error('No puedes pasar (check) si hay una apuesta mayor que la tuya.');
                }
                player.lastAction = 'CHECK';
                this.hasActedMap.set(player.id, true);
                break;
            case 'call': {
                const toCall = this.currentHighestBet - player.currentBet;
                const actualCall = Math.min(player.chips, toCall);
                player.bet(actualCall);
                player.lastAction = player.isAllIn ? 'ALL-IN' : 'CALL';
                this.hasActedMap.set(player.id, true);
                break;
            }
            case 'raise': {
                if (!amount || amount <= this.currentHighestBet) {
                    throw new Error(`Monto de subida inválido: debe ser mayor a ${this.currentHighestBet}`);
                }
                // Check minimum raise rule
                // The minimum raise is currentHighestBet + lastRaiseAmount
                if (amount < this.minRaise && amount < player.chips + player.currentBet) {
                    throw new Error(`La subida mínima es a ${this.minRaise}`);
                }
                const toAdd = amount - player.currentBet;
                if (toAdd > player.chips) {
                    throw new Error('No tienes suficientes fichas para subir esa cantidad.');
                }
                const raiseIncrement = amount - this.currentHighestBet;
                player.bet(toAdd);
                this.currentHighestBet = amount;
                this.lastRaiseAmount = raiseIncrement;
                this.minRaise = this.currentHighestBet + this.lastRaiseAmount;
                player.lastAction = player.isAllIn ? 'ALL-IN' : 'RAISE';
                // Reset hasActed for all other active, non-all-in players since the bet has been raised
                for (const p of this.players) {
                    if (p.isActive && !p.isFolded && !p.isAllIn && p.id !== player.id) {
                        this.hasActedMap.set(p.id, false);
                    }
                }
                this.hasActedMap.set(player.id, true);
                break;
            }
            default:
                throw new Error('Acción no soportada');
        }
        // Check if betting round is complete
        if (this.isBettingRoundComplete()) {
            this.advanceStage();
        }
        else {
            this.moveToNextTurn();
        }
    }
    isBettingRoundComplete() {
        // 1. If only 1 player is left (others folded), game is complete
        const foldedCount = this.players.filter(p => p.isFolded).length;
        const activeCount = this.players.filter(p => p.isActive).length;
        if (activeCount - foldedCount <= 1) {
            return true;
        }
        // 2. Everyone who can act must have acted
        for (const [playerId, acted] of this.hasActedMap.entries()) {
            if (!acted)
                return false;
        }
        // 3. Everyone who is active and not all-in must have matched the current highest bet
        for (const p of this.players) {
            if (p.isActive && !p.isFolded && !p.isAllIn) {
                if (p.currentBet !== this.currentHighestBet) {
                    return false;
                }
            }
        }
        return true;
    }
    advanceStage() {
        // Collect all bets into a temporary variable or check if we go to showdown
        const activeInHand = this.players.filter(p => p.isActive && !p.isFolded);
        // If only one player left, they win the pot
        if (activeInHand.length === 1) {
            this.awardPotToSingleWinner(activeInHand[0]);
            return;
        }
        // Check if all players or all-but-one are all-in (meaning no more betting can occur)
        const nonAllInCount = activeInHand.filter(p => !p.isAllIn).length;
        const isRunoutNeeded = nonAllInCount <= 1;
        if (isRunoutNeeded) {
            // Just deal the remaining community cards directly and showdown
            while (this.communityCards.length < 5) {
                this.dealCommunityCard();
            }
            this.stage = 'SHOWDOWN';
            this.evaluateShowdown();
            return;
        }
        // Standard progression
        if (this.stage === 'PRE_FLOP') {
            this.stage = 'FLOP';
            // Flop: deal 3 cards
            this.dealCommunityCard();
            this.dealCommunityCard();
            this.dealCommunityCard();
            this.initBettingRound();
        }
        else if (this.stage === 'FLOP') {
            this.stage = 'TURN';
            // Turn: deal 1 card
            this.dealCommunityCard();
            this.initBettingRound();
        }
        else if (this.stage === 'TURN') {
            this.stage = 'RIVER';
            // River: deal 1 card
            this.dealCommunityCard();
            this.initBettingRound();
        }
        else if (this.stage === 'RIVER') {
            this.stage = 'SHOWDOWN';
            this.evaluateShowdown();
        }
    }
    dealCommunityCard() {
        this.communityCards.push(this.deck.draw());
    }
    awardPotToSingleWinner(winner) {
        const totalPot = this.players.reduce((sum, p) => sum + p.totalRoundBet, 0);
        winner.chips += totalPot;
        this.showdownResults = {
            winners: [
                {
                    playerId: winner.id,
                    username: winner.username,
                    handName: 'Todos se retiraron',
                    cards: [],
                    amountWon: totalPot,
                },
            ],
            allPlayerHands: this.players.map(p => ({
                playerId: p.id,
                username: p.username,
                handName: p.isFolded ? 'Retirado' : 'Ganador por default',
                cards: p.cards.map(c => c.toShortString()),
                isFolded: p.isFolded,
            })),
        };
        this.stage = 'SHOWDOWN';
    }
    evaluateShowdown() {
        const pots = this.calculatePots();
        const winnersList = [];
        // Store all hands evaluated
        const allHands = {};
        for (const p of this.players) {
            if (!p.isFolded) {
                allHands[p.id] = HandEvaluator_1.HandEvaluator.evaluate7CardHand([...p.cards, ...this.communityCards]);
            }
        }
        // Process each side pot (from main pot to highest side pot)
        for (const pot of pots) {
            let bestHand = null;
            let potWinners = [];
            for (const pId of pot.eligiblePlayerIds) {
                const hand = allHands[pId];
                if (!hand)
                    continue;
                if (!bestHand) {
                    bestHand = hand;
                    potWinners = [pId];
                }
                else {
                    const comp = HandEvaluator_1.HandEvaluator.compareHands(hand, bestHand);
                    if (comp > 0) {
                        bestHand = hand;
                        potWinners = [pId];
                    }
                    else if (comp === 0) {
                        potWinners.push(pId);
                    }
                }
            }
            if (potWinners.length > 0 && bestHand) {
                // Divide this pot share among the winners (split pot)
                // Split fractional chips to the first winner (standard or round down)
                const baseShare = Math.floor(pot.amount / potWinners.length);
                const remainder = pot.amount % potWinners.length;
                for (let i = 0; i < potWinners.length; i++) {
                    const winnerId = potWinners[i];
                    const winAmount = baseShare + (i < remainder ? 1 : 0);
                    const winnerPlayer = this.getPlayer(winnerId);
                    winnerPlayer.chips += winAmount;
                    const existingWinner = winnersList.find(w => w.playerId === winnerId);
                    if (existingWinner) {
                        existingWinner.amountWon += winAmount;
                    }
                    else {
                        winnersList.push({
                            playerId: winnerId,
                            username: winnerPlayer.username,
                            handName: bestHand.name,
                            cards: bestHand.cards.map(c => c.toShortString()),
                            amountWon: winAmount,
                        });
                    }
                }
            }
        }
        this.showdownResults = {
            winners: winnersList,
            allPlayerHands: this.players.map(p => {
                const evaluated = allHands[p.id];
                return {
                    playerId: p.id,
                    username: p.username,
                    handName: p.isFolded ? 'Retirado' : (evaluated?.name || ''),
                    cards: p.cards.map(c => c.toShortString()),
                    isFolded: p.isFolded,
                };
            }),
        };
    }
    /**
     * Calculates all main and side pots based on each player's total bet in the hand.
     */
    calculatePots() {
        const activeBettors = this.players.filter(p => p.totalRoundBet > 0);
        if (activeBettors.length === 0)
            return [];
        const uniqueBets = Array.from(new Set(activeBettors.map(p => p.totalRoundBet))).sort((a, b) => a - b);
        const pots = [];
        let cumulativeValue = 0;
        for (const betLevel of uniqueBets) {
            const potSlice = betLevel - cumulativeValue;
            let potAmount = 0;
            const eligiblePlayerIds = [];
            for (const player of this.players) {
                if (player.totalRoundBet >= betLevel) {
                    potAmount += potSlice;
                    if (!player.isFolded) {
                        eligiblePlayerIds.push(player.id);
                    }
                }
                else {
                    if (player.totalRoundBet > cumulativeValue) {
                        potAmount += (player.totalRoundBet - cumulativeValue);
                    }
                }
            }
            if (potAmount > 0 && eligiblePlayerIds.length > 0) {
                pots.push({
                    amount: potAmount,
                    eligiblePlayerIds,
                });
            }
            cumulativeValue = betLevel;
        }
        return pots;
    }
    getTotalPot() {
        return this.players.reduce((sum, p) => sum + p.totalRoundBet, 0);
    }
}
exports.Table = Table;
