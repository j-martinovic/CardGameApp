import { Client } from 'boardgame.io/react';
import { game1 } from '../../../backend/card_server/games.js'
import TestBoard from './TestBoard.jsx'
import LoadingPage from './loading_page.jsx'
import { SocketIO } from 'boardgame.io/multiplayer'
import GenericBoard from '../../../game-client/src/components/GenericBoard.jsx'
import WarBoard from '../../../game-client/src/games/war/WarBoard.jsx'
// import { WarGame } from '../../../game-client/src/games/war/War.js'

const MightyClient = Client({
    game: game1,
    numPlayers: 2,
    board: GenericBoard,
    loading: LoadingPage,
    multiplayer: SocketIO({ server: 'localhost:8000' }),
    debug: true,
    // matchID: "",
})

export default MightyClient