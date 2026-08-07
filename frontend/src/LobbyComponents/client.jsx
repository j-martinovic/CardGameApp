import { Client } from 'boardgame.io/react';
import LoadingPage from './loading_page.jsx'
import { SocketIO } from 'boardgame.io/multiplayer'
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