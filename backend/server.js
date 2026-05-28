const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game state
const games = {};
const waitingPlayers = {};
const gameHosts = {};

// Card deck creation
function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value, id: `${value}-${suit}` });
    }
  }
  
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

// Initialize a new game
function initGame(gameId) {
  const deck = createDeck();
  const players = Object.values(waitingPlayers).filter(p => p.gameId === gameId);
  
  games[gameId] = {
    id: gameId,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      hand: [],
      score: 0
    })),
    deck: deck,
    discardPile: [deck.pop()],
    currentPlayerIndex: 0,
    direction: 1,
    status: 'playing',
    winner: null
  };
  
  // Deal 7 cards to each player
  games[gameId].players.forEach(player => {
    for (let i = 0; i < 7; i++) {
      player.hand.push(games[gameId].deck.pop());
    }
  });
  
  // Remove players from waiting
  players.forEach(p => delete waitingPlayers[p.id]);
  
  return games[gameId];
}

// Check if a card can be played
function canPlay(card, topCard) {
  return card.suit === topCard.suit || card.value === topCard.value || card.value === '8';
}

// Calculate score
function calculateScore(hand) {
  const scoreMap = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 50,
    '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 1
  };
  return hand.reduce((sum, card) => sum + (scoreMap[card.value] || 0), 0);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  // Host game
  socket.on('hostGame', ({ name, gameId }) => {
    waitingPlayers[socket.id] = {
      id: socket.id,
      name,
      gameId,
      socket
    };
    gameHosts[gameId] = socket.id;

    const gamePlayers = Object.values(waitingPlayers).filter(p => p.gameId === gameId);
    socket.join(gameId);

    io.to(gameId).emit('waitingUpdate', {
      count: gamePlayers.length,
      players: gamePlayers.map(p => p.name),
      isHost: true
    });
  });

  // Join game
  socket.on('joinGame', ({ name, gameId }) => {
    waitingPlayers[socket.id] = {
      id: socket.id,
      name,
      gameId,
      socket
    };

    const gamePlayers = Object.values(waitingPlayers).filter(p => p.gameId === gameId);
    socket.join(gameId);

    const isHost = gameHosts[gameId] === socket.id;

    io.to(gameId).emit('waitingUpdate', {
      count: gamePlayers.length,
      players: gamePlayers.map(p => p.name),
      isHost: isHost
    });
  });

  // Start game (host only)
  socket.on('startGame', ({ gameId }) => {
    if (gameHosts[gameId] !== socket.id) return;

    const gamePlayers = Object.values(waitingPlayers).filter(p => p.gameId === gameId);
    
    if (gamePlayers.length >= 2 && gamePlayers.length <= 4) {
      const game = initGame(gameId);
      gamePlayers.forEach(p => {
        p.socket.emit('gameStarted', {
          game: {
            ...game,
            players: game.players.map(pl => ({
              ...pl,
              hand: pl.id === p.id ? pl.hand : pl.hand.map(() => ({ hidden: true }))
            }))
          }
        });
      });
      io.to(gameId).emit('gameUpdate', game);
    }
  });
  
  // Play a card
  socket.on('playCard', ({ gameId, cardId, newSuit }) => {
    const game = games[gameId];
    if (!game || game.status !== 'playing') return;
    
    const player = game.players.find(p => p.id === socket.id);
    if (!player || game.players[game.currentPlayerIndex].id !== socket.id) return;
    
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    
    const card = player.hand[cardIndex];
    const topCard = game.discardPile[game.discardPile.length - 1];
    
    if (!canPlay(card, topCard)) return;
    
    // Remove card from hand and add to discard pile
    player.hand.splice(cardIndex, 1);
    game.discardPile.push(card);
    
    // Handle 8 (wild card)
    if (card.value === '8' && newSuit) {
      game.discardPile[game.discardPile.length - 1].suit = newSuit;
    }
    
    // Check for winner
    if (player.hand.length === 0) {
      game.status = 'finished';
      game.winner = player.id;
      player.score = calculateScore(game.players.reduce((acc, p) => acc.concat(p.hand), []));
      io.to(gameId).emit('gameEnded', { game, winner: player.name });
      return;
    }
    
    // Next player
    game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length;
    
    io.to(gameId).emit('gameUpdate', game);
  });
  
  // Draw a card
  socket.on('drawCard', ({ gameId }) => {
    const game = games[gameId];
    if (!game || game.status !== 'playing') return;
    
    const player = game.players.find(p => p.id === socket.id);
    if (!player || game.players[game.currentPlayerIndex].id !== socket.id) return;
    
    if (game.deck.length === 0) {
      // Reshuffle discard pile
      const topCard = game.discardPile.pop();
      game.deck = game.discardPile;
      game.discardPile = [topCard];
      
      for (let i = game.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
      }
    }
    
    if (game.deck.length > 0) {
      player.hand.push(game.deck.pop());
      game.currentPlayerIndex = (game.currentPlayerIndex + game.direction + game.players.length) % game.players.length;
    }
    
    io.to(gameId).emit('gameUpdate', game);
  });
  
  // Leave game
  socket.on('leaveGame', ({ gameId }) => {
    delete waitingPlayers[socket.id];
    
    // If host leaves, remove host record
    if (gameHosts[gameId] === socket.id) {
      delete gameHosts[gameId];
    }
    
    const gamePlayers = Object.values(waitingPlayers).filter(p => p.gameId === gameId);
    io.to(gameId).emit('waitingUpdate', {
      count: gamePlayers.length,
      players: gamePlayers.map(p => p.name),
      isHost: gameHosts[gameId] === socket.id
    });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const playerGameId = waitingPlayers[socket.id]?.gameId;
    delete waitingPlayers[socket.id];
    
    // If host disconnects, remove host record
    if (playerGameId && gameHosts[playerGameId] === socket.id) {
      delete gameHosts[playerGameId];
    }
    
    // Handle game disconnection
    Object.keys(games).forEach(gameId => {
      const game = games[gameId];
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        game.status = 'abandoned';
        io.to(gameId).emit('playerDisconnected', { playerId: socket.id });
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
