# Crazy Eights - Multiplayer Card Game

A fun 2-4 player online card game built with React, Node.js, and Socket.io.

## Features

- **Real-time multiplayer**: Play with 2-4 friends simultaneously
- **Crazy Eights gameplay**: Match cards by suit or number, use 8s as wild cards
- **Modern UI**: Beautiful interface built with React and TailwindCSS
- **Responsive design**: Works on desktop and mobile devices

## Game Rules

1. Each player starts with 7 cards
2. Match the top card of the discard pile by suit or number
3. Play an 8 as a wild card and choose the next suit
4. Draw a card if you can't play
5. First player to empty their hand wins!

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Backend**: Node.js, Express, Socket.io
- **Deployment**: Render (free tier)

## Local Development

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on port 3001

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on port 3000

## Deployment

### Deploy Backend to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Select the `backend` folder as root directory
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variable: `PORT=3001`
7. Deploy and copy the backend URL

### Deploy Frontend to Render

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Select the `frontend` folder as root directory
4. Build command: `npm install && npm run build`
5. Publish directory: `dist`
6. Add environment variable: `VITE_SOCKET_URL=https://your-backend-url.onrender.com`
7. Deploy

### Alternative: Deploy to Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
cd frontend
npm install
npm run build
vercel --prod
```

**Backend on Railway:**
```bash
cd backend
railway up
```

## How to Play

1. Open the game in your browser
2. Enter your name
3. Create or join a game room (share the Game ID with friends)
4. Wait for 2-4 players to join
5. Take turns playing cards
6. First to empty their hand wins!

## License

MIT
