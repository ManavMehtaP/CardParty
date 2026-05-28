import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import Lobby from './components/Lobby'
import GameBoard from './components/GameBoard'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

interface Player {
  id: string
  name: string
  hand: any[]
  score: number
}

interface Game {
  id: string
  players: Player[]
  deck: any[]
  discardPile: any[]
  currentPlayerIndex: number
  direction: number
  status: string
  winner: string | null
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameId, setGameId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [waitingCount, setWaitingCount] = useState(0)
  const [waitingPlayers, setWaitingPlayers] = useState<string[]>([])
  const [gameStatus, setGameStatus] = useState<'lobby' | 'waiting' | 'playing' | 'finished'>('lobby')
  const [winner, setWinner] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const newSocket = io(SOCKET_URL)
      setSocket(newSocket)

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err)
        setError('Failed to connect to server')
      })

      newSocket.on('gameStarted', ({ game }) => {
        setGame(game)
        setGameStatus('playing')
      })

      newSocket.on('gameUpdate', (updatedGame) => {
        setGame(updatedGame)
      })

      newSocket.on('waitingUpdate', ({ count, players }) => {
        setWaitingCount(count)
        setWaitingPlayers(players)
      })

      newSocket.on('gameEnded', ({ game, winner }) => {
        setGame(game)
        setWinner(winner)
        setGameStatus('finished')
      })

      newSocket.on('playerDisconnected', ({ playerId }) => {
        setGameStatus('lobby')
        setGame(null)
      })

      return () => {
        newSocket.disconnect()
      }
    } catch (err) {
      console.error('Error in useEffect:', err)
      setError('An error occurred')
    }
  }, [])

  const handleJoinGame = (name: string, gameId: string) => {
    setPlayerName(name)
    setGameId(gameId)
    if (socket) {
      socket.emit('joinGame', { name, gameId })
      setGameStatus('waiting')
    }
  }

  const handlePlayCard = (cardId: string, newSuit?: string) => {
    if (socket && game) {
      socket.emit('playCard', { gameId: game.id, cardId, newSuit })
    }
  }

  const handleDrawCard = () => {
    if (socket && game) {
      socket.emit('drawCard', { gameId: game.id })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      {gameStatus === 'lobby' && (
        <Lobby onJoinGame={handleJoinGame} />
      )}
      
      {gameStatus === 'waiting' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <span className="text-4xl mr-3">👥</span>
              <h1 className="text-3xl font-bold text-gray-800">Waiting for Players</h1>
            </div>
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">Game ID: <span className="font-mono font-bold text-green-600">{gameId}</span></p>
              <p className="text-gray-600">Players joined: <span className="font-bold">{waitingCount}/4</span></p>
            </div>
            {waitingPlayers.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Players:</h3>
                <ul className="space-y-1">
                  {waitingPlayers.map((player, index) => (
                    <li key={index} className="text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {player}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Waiting for more players...</span>
            </div>
            <button
              onClick={() => {
                setGameStatus('lobby')
                setGameId('')
                setPlayerName('')
                setWaitingCount(0)
                setWaitingPlayers([])
                if (socket) {
                  socket.emit('leaveGame', { gameId })
                }
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>
      )}
      
      {gameStatus === 'playing' && game && (
        <GameBoard
          game={game}
          playerName={playerName}
          onPlayCard={handlePlayCard}
          onDrawCard={handleDrawCard}
        />
      )}
      
      {gameStatus === 'finished' && winner && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="flex items-center justify-center mb-6">
              <span className="text-4xl mr-3">🃏</span>
              <h1 className="text-3xl font-bold text-gray-800">Game Over!</h1>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
              <p className="text-2xl font-bold text-yellow-700 mb-2">🎉 Winner!</p>
              <p className="text-xl text-gray-800">{winner}</p>
            </div>
            <button
              onClick={() => {
                setGameStatus('lobby')
                setGame(null)
                setWinner(null)
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
