import { Client } from 'boardgame.io/react';
import { game1 } from '../../../backend/card_server/games.js'
import TestBoard from './TestBoard.jsx'
import LoadingPage from './loading_page.jsx'
import { SocketIO } from 'boardgame.io/multiplayer'
import GenericBoard from '../../../game-client/src/components/GenericBoard.jsx'
import WarBoard from '../../../game-client/src/games/war/WarBoard.jsx'
import WarGame from '../../../game-client/src/games/war/War.js'
import { Mighty } from '../../../backend/card_server/GameObjects/Mighty.js';
import MightyBoard from '../board/MightyBoard.jsx'

const MightyClient = Client({
    game: Mighty,
    numPlayers: 5,
    board: MightyBoard,
    loading: LoadingPage,
    multiplayer: SocketIO({ server: 'localhost:8000' }),
    debug: true,
})

export default MightyClient