import  LobbyDashboard from './Lobby.jsx'
import MightyClient from './client.jsx'
import { useState } from 'react';
import { LobbyClient } from 'boardgame.io/client';
import './LobbyScreen.css'

export default function LobbyScreen({userInfo, openLogin, signOut, returnHome, defaultGame="Mighty"}) {

  // const userInfo = {userName: "Jeff"}
  const server = "http://localhost:8080"
  const [screen, setScreen] = useState('lobby'); // 'lobby' | 'game'
  const [activeGame, setActiveGame] = useState(null); // 'war' | 'go_fish'
  const lobbyClient = new LobbyClient({ server: server })

  // Storage vault for the connection tokens
  const [connectionTokens, setConnectionTokens] = useState({
    matchID: null,
    playerID: null,
    credentials: null,
    playerName: null
  });


  const confirmLogin = () => {
    if (userInfo.userName === undefined) {
      openLogin(false)
      return false
    } else {
      return true
    }
  }


  // Locate and return all games running at the moment
  const handleFindAllGameTypes = async () => {
      const gameTypes_ = await lobbyClient.listGames()
      // console.log(gameTypes_)
      return (
        gameTypes_
      )
  }  


  // Returns all active games named "type"
  const handleLoadAllGames = async (type) => {
    try {
      if (type === 'all') {
        const gameTypes = await handleFindAllGameTypes()
        const matchPromises = gameTypes.map(gameName => 
            lobbyClient.listMatches(gameName)
        );
        
        const resultsArray = await Promise.all(matchPromises);
        const combinedMatches = resultsArray.flatMap(result => result.matches);
        
        console.log("Fetched All Matches:", combinedMatches); // Log local var, not state!
        return (
          combinedMatches
        )
      } else {
        const response = await lobbyClient.listMatches(type);        
        console.log(`Fetched ${type} Matches:`, response.matches);
        return (
          response.matches
        )
      }
    } catch (error) {
        console.error("Failed to aggregate server match lists:", error);
    }
  };



  // This function acts as the anchor tethering the lobby to the client
  const handleGameStart = async ({gameName, matchID, playerID="0"}) => {
    if (!confirmLogin()) {
      return
    }
    
    const { playerCredentials } = await lobbyClient.joinMatch(
      gameName,
      matchID,
      {
          playerName: userInfo.userName,
          playerID: playerID
      }
    )
    
    setConnectionTokens({
      matchID: matchID,
      credentials: playerCredentials,
      playerName: userInfo.userName,
      playerID: playerID,
    });

    setActiveGame(gameName);
    setScreen('game');
  }


  // LEAVING GAME AND RETURNING TO LOBBY
  const handleLeaveGame = async () => {
    await lobbyClient.leaveMatch(connectionTokens.gameName, connectionTokens.matchID, {
      playerID: connectionTokens.playerID,
      credentials: connectionTokens.credentials,
    });
    setConnectionTokens({ matchID: null, playerID: null, credentials: null, playerName: null });
    setActiveGame(null);
    setScreen('lobby');
  }


  // CREATE A LOBBY AND JOIN THE MATCH
  const handleCreateLobby = async (createType, numPlayers, privateRoom=false) => {
      if (!confirmLogin()) {
        return
      }
      const match = await lobbyClient.createMatch(createType, {
          numPlayers: numPlayers,
          unlisted: privateRoom,
      })
      console.log("SUCCESSFULLY CREATED LOBBY... JOINING GAME")
      handleGameStart({
        gameName: createType,
        matchID: match.matchID,
      })
  }


  // --- RENDERING BLOCK ---
  if (screen === 'lobby') {    
    return (
      <LobbyDashboard
        userInfo={userInfo}
        openLogin={openLogin} 
        signOut={signOut}
        returnHome={returnHome}
        currentUserName={userInfo.userName}
        onJoinMatch={handleGameStart} // 👈 Lobby fires this to pass tokens up
        onBack={() => console.log('Main menu')}
        handleFindAllGameTypes={handleFindAllGameTypes}
        handleLoadAllGames={handleLoadAllGames}
        handleCreateLobby={handleCreateLobby}
      />
    );
  }

  if (screen === 'game') {
    // Inject the tokens directly into the chosen game client wrapper
    if (activeGame === 'Mighty') {
      return (
        <>
        {console.log("Connecting to Match:", connectionTokens.matchID, "as Player:", connectionTokens.playerID, " With the following credentials: ", connectionTokens.credentials)}
        <MightyClient 
          matchID={connectionTokens.matchID}
          playerID={connectionTokens.playerID}
          credentials={connectionTokens.credentials}
        />
        </>
      );
    }


  }

  return <div>Screen not found</div>;

}

