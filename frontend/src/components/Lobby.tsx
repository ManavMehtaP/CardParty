import { useState } from 'react'

interface LobbyProps {
  onJoinGame: (name: string, gameId: string) => void
}

function Lobby({ onJoinGame }: LobbyProps) {
  const [name, setName] = useState('')
  const [gameId, setGameId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && gameId.trim()) {
      onJoinGame(name.trim(), gameId.trim())
    }
  }

  const generateGameId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id = ''
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGameId(id)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-8">
          <span className="text-4xl mr-3">🃏</span>
          <h1 className="text-3xl font-bold text-gray-800">Crazy Eights</h1>
        </div>
        
        <p className="text-center text-gray-600 mb-6">
          A fun multiplayer card game for 2-4 players
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono"
                placeholder="Enter or generate ID"
                required
              />
              <button
                type="button"
                onClick={generateGameId}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                🎲
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <span className="mr-2">👥</span>
            Join Game
          </button>
        </form>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">How to Play:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Match cards by suit or number</li>
            <li>• Play 8s as wild cards</li>
            <li>• First to empty hand wins!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Lobby
