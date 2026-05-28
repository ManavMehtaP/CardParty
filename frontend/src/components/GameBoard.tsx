import { useState } from 'react'

interface Card {
  id: string
  suit: string
  value: string
  hidden?: boolean
}

interface Player {
  id: string
  name: string
  hand: Card[]
  score: number
}

interface Game {
  id: string
  players: Player[]
  deck: Card[]
  discardPile: Card[]
  currentPlayerIndex: number
  direction: number
  status: string
  winner: string | null
}

interface GameBoardProps {
  game: Game
  playerName: string
  onPlayCard: (cardId: string, newSuit?: string) => void
  onDrawCard: () => void
}

function GameBoard({ game, playerName, onPlayCard, onDrawCard }: GameBoardProps) {
  const [showSuitPicker, setShowSuitPicker] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState('')

  const currentPlayer = game.players.find(p => p.name === playerName)
  const isMyTurn = game.players[game.currentPlayerIndex]?.name === playerName

  const getSuitSymbol = (suit: string) => {
    const symbols: { [key: string]: string } = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    }
    return symbols[suit] || suit
  }

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-gray-800'
  }

  const canPlayCard = (card: Card) => {
    if (!isMyTurn) return false
    const topCard = game.discardPile[game.discardPile.length - 1]
    return card.suit === topCard.suit || 
           card.value === topCard.value || 
           card.value === '8'
  }

  const handleCardClick = (card: Card) => {
    if (!isMyTurn || !canPlayCard(card)) return
    
    if (card.value === '8') {
      setSelectedCardId(card.id)
      setShowSuitPicker(true)
    } else {
      onPlayCard(card.id)
    }
  }

  const handleSuitSelect = (suit: string) => {
    onPlayCard(selectedCardId, suit)
    setShowSuitPicker(false)
    setSelectedCardId('')
  }

  const otherPlayers = game.players.filter(p => p.name !== playerName)

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white mb-2">Crazy Eights</h1>
        <p className="text-green-200">Game ID: {game.id}</p>
      </div>

      {/* Other Players */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {otherPlayers.map((player) => {
          const isCurrentTurn = game.players[game.currentPlayerIndex]?.id === player.id
          return (
            <div
              key={player.id}
              className={`bg-white rounded-lg p-3 shadow-lg ${
                isCurrentTurn ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{player.name}</span>
                {isCurrentTurn && <span className="text-2xl">👑</span>}
              </div>
              <div className="flex gap-1">
                {player.hand.map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded border-2 border-white shadow"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">{player.hand.length} cards</p>
            </div>
          )
        })}
      </div>

      {/* Center Area - Discard Pile */}
      <div className="flex justify-center items-center mb-6">
        <div className="bg-white rounded-xl p-6 shadow-2xl">
          <div className="text-center mb-4">
            <p className="text-gray-600 font-medium">Discard Pile</p>
          </div>
          {game.discardPile.length > 0 && (
            <div className="flex justify-center">
              <div className={`w-24 h-36 bg-white rounded-lg shadow-lg border-4 border-gray-300 flex flex-col items-center justify-center ${getSuitColor(game.discardPile[game.discardPile.length - 1].suit)}`}>
                <span className="text-3xl font-bold">{game.discardPile[game.discardPile.length - 1].value}</span>
                <span className="text-4xl">{getSuitSymbol(game.discardPile[game.discardPile.length - 1].suit)}</span>
              </div>
            </div>
          )}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Deck: {game.deck.length} cards
            </p>
          </div>
        </div>
      </div>

      {/* Current Player's Hand */}
      <div className="bg-white rounded-xl p-4 shadow-2xl max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-800">{currentPlayer?.name}</h2>
            {isMyTurn && <span className="text-2xl ml-2">👑</span>}
          </div>
          <span className="text-gray-600">{currentPlayer?.hand.length} cards</span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {currentPlayer?.hand.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`w-20 h-28 bg-white rounded-lg shadow-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                canPlayCard(card) && isMyTurn
                  ? 'border-green-500 hover:bg-green-50'
                  : 'border-gray-300 opacity-70'
              } ${!isMyTurn ? 'cursor-not-allowed' : ''}`}
            >
              <span className={`text-2xl font-bold ${getSuitColor(card.suit)}`}>{card.value}</span>
              <span className={`text-3xl ${getSuitColor(card.suit)}`}>{getSuitSymbol(card.suit)}</span>
            </div>
          ))}
        </div>

        {isMyTurn && (
          <div className="flex justify-center gap-4">
            <button
              onClick={onDrawCard}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              <span className="text-xl">🔄</span>
              Draw Card
            </button>
          </div>
        )}

        {!isMyTurn && (
          <div className="text-center text-gray-600">
            Waiting for {game.players[game.currentPlayerIndex]?.name}'s turn...
          </div>
        )}
      </div>

      {/* Suit Picker Modal */}
      {showSuitPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Choose a Suit
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {['hearts', 'diamonds', 'clubs', 'spades'].map((suit) => (
                <button
                  key={suit}
                  onClick={() => handleSuitSelect(suit)}
                  className={`p-6 rounded-lg text-4xl font-bold transition-all hover:scale-105 ${
                    suit === 'hearts' || suit === 'diamonds'
                      ? 'bg-red-100 hover:bg-red-200 text-red-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {getSuitSymbol(suit)}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowSuitPicker(false)
                setSelectedCardId('')
              }}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameBoard
