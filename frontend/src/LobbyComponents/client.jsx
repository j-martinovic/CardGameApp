import { Client } from 'boardgame.io/react';
import LoadingPage from './loading_page.jsx'
import { SocketIO } from 'boardgame.io/multiplayer'
import { Mighty } from '../../../shared/games/Mighty.js';
import { WarGame } from '../../../shared/games/War.js';
import MightyBoard from '../board/MightyBoard.jsx'
import WarBoard from '../board/war/WarBoard.jsx'

const GAME_SERVER = 'localhost:8000'

// Seats requested when creating a match of each game (must fall inside the
// game definition's minPlayers/maxPlayers).
export const GAME_NUM_PLAYERS = {
    Mighty: 5,
    War: 1,
}

const MightyClient = Client({
    game: Mighty,
    numPlayers: GAME_NUM_PLAYERS.Mighty,
    board: MightyBoard,
    loading: LoadingPage,
    multiplayer: SocketIO({ server: GAME_SERVER }),
    debug: true,
})

export const WarClient = Client({
    game: WarGame,
    numPlayers: GAME_NUM_PLAYERS.War,
    board: WarBoard,
    loading: LoadingPage,
    multiplayer: SocketIO({ server: GAME_SERVER }),
    debug: true,
})

export default MightyClient
