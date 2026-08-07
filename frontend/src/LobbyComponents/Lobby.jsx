import './Home.css'
import React, { useEffect, useState } from 'react';
import HeaderBanner from '../StaticVisuals.jsx';
import { GAME_NUM_PLAYERS } from './client.jsx';


export default function LobbyDashboard({ 
        userInfo,
        openLogin,
        signOut,
        returnHome,
        server = "http://localhost:8000",
        currentUserName = "Player", //CONVERT TO PLAYER METADATA FROM HOME DATABASE
        onJoinMatch = (matchId) => console.log(`Placeholder: Joining match ${matchId}`),
        handleFindAllGameTypes = () => {},
        handleLoadAllGames = () => {},
        handleCreateLobby = () => {},
    }) {

    const [activeMatches, setActiveMatches] = useState([])
    const [gameTypes, setGameTypes] = useState(["Mighty", "War"])
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [createType, setCreateType] = useState(gameTypes[0])


    useEffect(() => {
        onLoadAllGames(selectedFilter)

        const intervalId = setInterval(() => {
            onLoadAllGames(selectedFilter);
        }, 50000);

        return () => {
            clearInterval(intervalId);
            console.log(`Stopped background loop for filter: ${selectedFilter}`);
        };
    }, [selectedFilter]);


    
    const findAllGames = async () => {
        const gameTypes_ = await handleFindAllGameTypes()
        setGameTypes(gameTypes_)
    }
  
    const onLoadAllGames = async (type) => {
        setSelectedFilter(type);
        const activeMatches_ = await handleLoadAllGames(type)
        setActiveMatches(activeMatches_)
    };

    const onCreateLobby = async (privateRoom=false) => {
        const numPlayers = GAME_NUM_PLAYERS[createType] ?? 5
        console.log({createType, numPlayers})
        handleCreateLobby(createType, numPlayers, privateRoom)
        // onLoadAllGames(selectedFilter)
    }



    // Format display names cleanly
    const formatGameName = (slug) => {
        return slug.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };



    return (
    <div className="home-screen">
        
        {/* ── Header Bar ── */}
        <HeaderBanner user={userInfo} openLogin={openLogin} signOut={signOut}/>


        {/* ── Main Content Container ── */}
        <main className="home-main">
        
        {/* Hero Banner Section
        <section className="home-hero">
            <h1 className="home-hero-title">The Cardroom Lobby</h1>
            <p className="home-hero-sub">Select an open table or open a new deck below</p>
            <div className="home-divider">
            <div className="home-divider-line"></div>
            <span>♠</span>
            <div className="home-divider-line"></div>
            </div>
        </section> */}

        {/* Hero Banner Section */}
        <section className="home-hero" style={{ position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            
            {/* ── Main Body Back Arrow Button ── */}
            <button 
                onClick={() => {returnHome(userInfo)}}
                style={{
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    background: 'transparent',
                    border: '1px solid rgba(201, 168, 76, 0.3)',
                    borderRadius: '6px',
                    color: '#c9a84c',
                    fontSize: '16px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Cinzel, Georgia, serif',
                    letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#f0c040';
                    e.currentTarget.style.background = 'rgba(201, 168, 76, 0.1)';
                    e.currentTarget.style.color = '#f0c040';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.3)';
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#c9a84c';
                }}
            >
                ← Return
            </button>

            <h1 className="home-hero-title" style={{ marginTop: '40px' }}>The Cardroom Lobby</h1>
            <p className="home-hero-sub">Select an open table or open a new deck below</p>
            <div className="home-divider">
                <div className="home-divider-line"></div>
                <span>♠</span>
                <div className="home-divider-line"></div>
            </div>
        </section>



        {/* ── Top Panel: Filtering and Creation Layout Controls ── */}
        <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '8px',
            padding: '16px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '900px',
            boxSizing: 'border-box'
        }}>
            {/* Dropdown Selector Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="game-filter" style={{ fontFamily: 'Cinzel, serif', fontSize: '13px', color: '#c9a84c', letterSpacing: '0.5px' }}>
                Filter Table:
            </label>
            <select 
                id="game-filter"
                value={selectedFilter}
                onChange={(e) => onLoadAllGames(e.target.value)}
                style={{
                background: '#2a1505',
                color: '#f5f0e8',
                border: '1px solid #c9a84c',
                borderRadius: '4px',
                padding: '6px 12px',
                fontFamily: 'sans-serif',
                cursor: 'pointer',
                outline: 'none'
                }}
            >
                <option value="all">All Card Games</option>
                {gameTypes.map(type => (
                <option key={type} value={type}>{formatGameName(type)}</option>
                ))}
            </select>
            </div>



            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="game-filter" style={{ fontFamily: 'Cinzel, serif', fontSize: '13px', color: '#c9a84c', letterSpacing: '0.5px' }}>
                Available Games:
            </label>
            <select 
                id="game-filter"
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                style={{
                background: '#2a1505',
                color: '#f5f0e8',
                border: '1px solid #c9a84c',
                borderRadius: '4px',
                padding: '6px 12px',
                fontFamily: 'sans-serif',
                cursor: 'pointer',
                outline: 'none'
                }}
            >
                {/* <option value="Mighty">Mighty</option> */}
                {gameTypes.map(type => (
                    <option key={type} value={type}>{formatGameName(type)}</option>
                ))}
            </select>
            </div>


            {/* Action Trigger Button */}
            <button 
            className="header-btn header-btn--gold"
            onClick={() => onCreateLobby()}
            >
            Create Lobby
            </button>
        </div>

        {/* ── Central Display Grid Area ── */}
        <section className="game-grid">
            {activeMatches.length === 0 ? (
            <div style={{ 
                fontFamily: 'Cinzel, Georgia, serif', 
                color: '#9a7a35', 
                padding: '60px 20px', 
                textAlign: 'center',
                fontStyle: 'italic'
            }}>
                No active tables found matching this filter criteria.
            </div>
            ) : (
            activeMatches.map((match) => {
                const vacancyCount = match.players.length - match.players.filter(p => p.name).length;
                const isFull = vacancyCount === 0;

                // Generate array containing registered players padded out with empty placeholders
                const structuralSeats = match.players.map((p) => {
                    if (p.name === undefined) {
                        return "---"
                    } else {
                        return p.name
                    }
                })
                console.log(structuralSeats)

                return (
                <div key={match.matchID} className={`game-panel ${isFull ? 'game-panel--dim' : ''}`}>
                    
                    {/* Decorative Token Suite Icon */}
                    <div className="game-panel-icon">
                    <span style={{ fontSize: '28px', color: isFull ? '#5a4525' : '#c9a84c', userSelect: 'none' }}>
                        {match.gameName === 'War' ? '⚔️' : '🃏'}
                    </span>
                    </div>

                    <div className="game-panel-body">
                    <h3 className={`game-panel-title ${isFull ? 'game-panel-title--dim' : ''}`}>
                        {formatGameName(match.gameName)}
                    </h3>
                    
                    <div className="game-panel-tags">
                        <span className="game-tag">ID: {match.matchID.substring(0, 7)}</span>
                        <span className="game-tag">{match.players.length - vacancyCount}/{match.players.length} Seats Full</span>
                    </div>

                    {/* Render Registered Players and Empty Blanks */}
                    <div style={{ 
                        marginTop: '12px', 
                        background: 'rgba(0,0,0,0.2)', 
                        borderRadius: '6px', 
                        padding: '10px',
                        textAlign: 'left',
                        fontSize: '13px'
                    }}>
                        <div style={{ color: '#9a7a35', fontFamily: 'Cinzel, serif', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.5px' }}>
                        Seating Arrangement:
                        </div>
                        <ol style={{ margin: 0, paddingLeft: '18px', color: '#c8bfad' }}>
                        {structuralSeats.map((player, index) => (
                            <li key={index} style={{ 
                            color: player === "—" ? 'rgba(201, 168, 76, 0.25)' : '#f5f0e8',
                            fontStyle: player === "—" ? 'italic' : 'normal',
                            marginBottom: '2px'
                            }}>
                            {player}
                            </li>
                        ))}
                        </ol>
                    </div>
                    </div>

                    {/* Dynamic Action Trigger Mapping */}
                    <button 
                    className={`game-play-btn ${isFull ? 'game-play-btn--disabled' : ''}`}
                    disabled={isFull}
                    onClick={() => onJoinMatch({
                        gameName: match.gameName,
                        matchID: match.matchID,
                        playerName: currentUserName,
                    })}
                    >
                    {isFull ? "Table Full" : "Take Seat"}
                    </button>

                </div>
                );
            })
            )}
        </section>

        </main>

        {/* ── Footer ── */}
        <footer className="home-footer">
        <span>AUTHORITATIVE MATCHMAKING MATRIX</span>
        <span>STATUS: SECURE PIPELINE ESTABLISHED</span>
        </footer>
    </div>
    );
}