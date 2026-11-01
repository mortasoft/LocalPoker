"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table_1 = require("./Table");
const Player_1 = require("./Player");
const Card_1 = require("./Card");
const HandEvaluator_1 = require("./HandEvaluator");
console.log('--- Probando Evaluador de Manos ---');
// Test high card vs pair
const hand1 = [
    new Card_1.Card('H', 14), // As
    new Card_1.Card('D', 10),
    new Card_1.Card('C', 8),
    new Card_1.Card('S', 6),
    new Card_1.Card('H', 4),
];
const ev1 = HandEvaluator_1.HandEvaluator.evaluate5CardHand(hand1);
console.log(`Mano 1: ${ev1.name} (Rank: ${ev1.rank})`);
// Test pair
const hand2 = [
    new Card_1.Card('H', 14), // As
    new Card_1.Card('D', 14), // As
    new Card_1.Card('C', 8),
    new Card_1.Card('S', 6),
    new Card_1.Card('H', 4),
];
const ev2 = HandEvaluator_1.HandEvaluator.evaluate5CardHand(hand2);
console.log(`Mano 2: ${ev2.name} (Rank: ${ev2.rank})`);
// Test Full House
const hand3 = [
    new Card_1.Card('H', 14), // As
    new Card_1.Card('D', 14),
    new Card_1.Card('S', 14),
    new Card_1.Card('C', 8),
    new Card_1.Card('H', 8),
];
const ev3 = HandEvaluator_1.HandEvaluator.evaluate5CardHand(hand3);
console.log(`Mano 3: ${ev3.name} (Rank: ${ev3.rank})`);
// Test compare
const comp = HandEvaluator_1.HandEvaluator.compareHands(ev3, ev2);
console.log(`Comparación Mano 3 vs Mano 2: ${comp > 0 ? 'Mano 3 gana' : 'Mano 2 gana'}`);
console.log('\n--- Probando Simulación de Mesa ---');
const table = new Table_1.Table('mesa-1', 10, 20);
const alice = new Player_1.Player('1', 'Alice', 1000);
const bob = new Player_1.Player('2', 'Bob', 1000);
const charlie = new Player_1.Player('3', 'Charlie', 500);
table.addPlayer(alice);
table.addPlayer(bob);
table.addPlayer(charlie);
console.log('Jugadores en la mesa:', table.players.map(p => p.username));
table.startGame();
console.log(`Mesa iniciada. Etapa: ${table.stage}`);
console.log(`Dealer: ${table.players[table.dealerIndex].username}`);
console.log(`Small Blind: ${table.players[table.sbIndex].username} (Apostó ${table.players[table.sbIndex].currentBet})`);
console.log(`Big Blind: ${table.players[table.bbIndex].username} (Apostó ${table.players[table.bbIndex].currentBet})`);
console.log(`Turno actual: ${table.players[table.currentTurn].username}`);
// Let's print out the player's cards
for (const p of table.players) {
    console.log(`${p.username} tiene: ${p.cards.map(c => c.toString()).join(' ')}`);
}
// Simulate actions
// Let's say current turn acts
const act1 = table.players[table.currentTurn];
console.log(`\nJugador ${act1.username} decide hacer CALL...`);
table.executeAction(act1.id, 'call');
console.log(`Nuevo turno: ${table.players[table.currentTurn].username}`);
const act2 = table.players[table.currentTurn];
console.log(`\nJugador ${act2.username} decide hacer CALL...`);
table.executeAction(act2.id, 'call');
console.log(`Nuevo turno: ${table.players[table.currentTurn].username}`);
const act3 = table.players[table.currentTurn];
console.log(`\nJugador ${act3.username} decide hacer CHECK...`);
table.executeAction(act3.id, 'check');
console.log(`\nNueva etapa: ${table.stage}`);
console.log(`Cartas comunitarias: ${table.communityCards.map(c => c.toString()).join(' ')}`);
console.log(`Bote total: ${table.getTotalPot()}`);
// Let's run a complete fold run out to verify single winner
console.log('\n--- Simulando fold general en FLOP ---');
console.log(`Turno actual: ${table.players[table.currentTurn].username}`);
const pF1 = table.players[table.currentTurn];
console.log(`Jugador ${pF1.username} pasa (CHECK)...`);
table.executeAction(pF1.id, 'check');
console.log(`Turno actual: ${table.players[table.currentTurn].username}`);
const pF2 = table.players[table.currentTurn];
console.log(`Jugador ${pF2.username} apuesta (RAISE) a 40...`);
table.executeAction(pF2.id, 'raise', 40);
console.log(`Turno actual: ${table.players[table.currentTurn].username}`);
const pF3 = table.players[table.currentTurn];
console.log(`Jugador ${pF3.username} se retira (FOLD)...`);
table.executeAction(pF3.id, 'fold');
console.log(`Turno actual: ${table.players[table.currentTurn].username}`);
console.log(`Jugador ${pF1.username} se retira (FOLD)...`);
table.executeAction(pF1.id, 'fold');
console.log(`\nEtapa final de la mesa: ${table.stage}`);
if (table.showdownResults) {
    console.log('Ganadores del Showdown:', JSON.stringify(table.showdownResults.winners, null, 2));
}
console.log(`Fichas de Alice: ${alice.chips}`);
console.log(`Fichas de Bob: ${bob.chips}`);
console.log(`Fichas de Charlie: ${charlie.chips}`);
