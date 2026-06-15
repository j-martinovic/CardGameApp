import { Server, Origins } from 'boardgame.io/dist/cjs/server.js';
import { game1, game2 } from './games.js'
import fs from 'fs'

const server = Server({
  // Provide the definitions for your game(s).
  games: [game1],

  // Provide the database storage class to use.
//   db: new DbConnector(),

//   https: {
//     cert: fs.readFileSync('/path/to/cert'),
//     key: fs.readFileSync('/path/to/key'),
//   },

  origins: [
    // Allow your game site to connect.
    'https://www.mygame.domain',
    // Allow localhost to connect, except when NODE_ENV is 'production'.
    Origins.LOCALHOST_IN_DEVELOPMENT
  ],
});


const lobbyConfig = {
  apiPort: 8080,
  apiCallback: () => console.log('Running Lobby API on port 8080...'),
};

server.run({ port: 8000, lobbyConfig });