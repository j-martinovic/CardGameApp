import './Home.css'

// ── Sub-components ────────────────────────────────────────────────────────

// Spade SVG used as the War game panel icon
const SpadeSVG = () => (
    <svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true">
        <path
            d="M40 6 C40 6, 12 28, 12 47 C12 60 23 65 32 59
               C28 66 25 72 23 76 L57 76
               C55 72 52 66 48 59
               C57 65 68 60 68 47
               C68 28 40 6 40 6 Z"
            fill="#1a1a1a"
            opacity="0.88"
        />
    </svg>
)


// ── Grid of Games ────────────────────────────────────────────────────────

const GamePanel = ({name, description, players, cards, difficulty, onPlayGame}) => {

    return (
        <article className="game-panel">
            <div className="game-panel-icon">
                <SpadeSVG />
            </div>
            <div className="game-panel-body">
                <h2 className="game-panel-title">{name}</h2>
                <p className="game-panel-desc">
                    {description}
                </p>
                <div className="game-panel-tags">
                    <span className="game-tag">{players + " Players"}</span>
                    <span className="game-tag">{cards + " Cards"}</span>
                    <span className="game-tag">{difficulty}</span>
                </div>
            </div>
            <button
                onClick={onPlayGame}
                className="game-play-btn"
            >
                {"Play " + name}
            </button>
        </article>
    )

}




// ── Main component ────────────────────────────────────────────────────────

const HomeScreen = ({ openLogin, signOut, user, onPlayWar }) => {
    return (
        <div className="home-screen">

            {/* ── Header bar ─────────────────────────────────────────── */}
            <header className="home-header">
                <div className="home-header-brand">
                    <span className="home-brand-suit" aria-hidden="true">♠</span>
                    <span className="home-brand-name">Royal Table</span>
                    <span className="home-brand-suit" aria-hidden="true">♥</span>
                </div>

                <nav className="home-header-nav">
                    {user.loggedIn ? (
                        <>
                            <span className="home-username">
                                <span className="home-username-chip" aria-hidden="true">♦</span>
                                {user.userName}
                                <span className="home-username-chip" aria-hidden="true">♣</span>
                            </span>
                            <button
                                onClick={signOut}
                                className="header-btn header-btn--outline"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => openLogin(false)}
                                className="header-btn header-btn--outline"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => openLogin(true)}
                                className="header-btn header-btn--gold"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </nav>
            </header>

            {/* ── Hero welcome ───────────────────────────────────────── */}
            <main className="home-main">
                <section className="home-hero">
                    <h1 className="home-hero-title">
                        {user.loggedIn
                            ? `Welcome back, ${user.userName}`
                            : 'Step Up to the Table'}
                    </h1>
                    <p className="home-hero-sub">
                        Choose your game and ante up
                    </p>
                    <div className="home-divider" aria-hidden="true">
                        <span>♠</span>
                        <span className="home-divider-line" />
                        <span>♥</span>
                        <span className="home-divider-line" />
                        <span>♦</span>
                        <span className="home-divider-line" />
                        <span>♣</span>
                    </div>
                </section>

                {/* ── Game grid ────────────────────────────────────────── */}
                <section className="game-grid" aria-label="Available games">

                    {/* War game panel */}
                    <article className="game-panel">
                        <div className="game-panel-icon">
                            <SpadeSVG />
                        </div>
                        <div className="game-panel-body">
                            <h2 className="game-panel-title">War</h2>
                            <p className="game-panel-desc">
                                The classic battle of the deck. You vs. The House — highest card takes all.
                                Call War on a tie.
                            </p>
                            <div className="game-panel-tags">
                                <span className="game-tag">2 Players</span>
                                <span className="game-tag">52 Cards</span>
                                <span className="game-tag">Easy</span>
                            </div>
                        </div>
                        <button
                            onClick={onPlayWar}
                            className="game-play-btn"
                        >
                            Play War
                        </button>
                    </article>

                    <GamePanel 
                        name="Mighty" 
                        description={"A tantalizing combination of Hearts and Euchre, leverage magical cards and unknown alliances to collect points and vanquish your opponents!"}
                        players="5"
                        cards="53"
                        difficulty={"Hard"}
                        onPlayGame={onPlayWar}
                    />                    
                    
                    <GamePanel 
                        name="Hearts" 
                        description={"Strike a careful balance between taking tricks while avoiding hearts and the pesky Queen of Spades... or take them all."}
                        players="4"
                        cards="52"
                        difficulty={"Medium"}
                        onPlayGame={onPlayWar}
                    />                    
                    
                    <GamePanel 
                        name="Bridge" 
                        description={"This classic bidding game has a simple goal; take as many tricks as you can."}
                        players="4"
                        cards="52"
                        difficulty={"Easy"}
                        onPlayGame={onPlayWar}
                    />                     
                    <GamePanel 
                        name="Billy's Game" 
                        description={"This unique, combat-style card game leverages suit-based power-ups alongside strategy and chance to determine the strongest combatant!"}
                        players="4-6"
                        cards="54"
                        difficulty={"Medium"}
                        onPlayGame={onPlayWar}
                    />                    
                    <GamePanel 
                        name="Spades" 
                        description={"With spades as trump, bid your hand and make your bid without taking too many bags. First to 500 wins."}
                        players="4"
                        cards="52"
                        difficulty={"Medium"}
                        onPlayGame={onPlayWar}
                    />                    
                    <GamePanel 
                        name="Bura" 
                        description={"This chaotic game comes from Russian prisons. Hold three cards at a time, no need to follow suit, just take points and win."}
                        players="2"
                        cards="40"
                        difficulty={"Easy"}
                        onPlayGame={onPlayWar}
                    />

                    <GamePanel 
                        name="99" 
                        description={"Bid wisely using cards from your hand and make your bid exactly for maximum points."}
                        players="3"
                        cards="37"
                        difficulty={"Hard"}
                        onPlayGame={onPlayWar}
                    />

                    {/* More games — coming soon placeholder */}
                    <article className="game-panel game-panel--dim">
                        <div className="game-panel-icon">
                            <svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true">
                                <circle cx="40" cy="40" r="28" fill="none"
                                    stroke="#c9a84c" strokeWidth="1.5"
                                    strokeDasharray="5 4" opacity="0.35"/>
                                <text x="40" y="48" fontSize="22" textAnchor="middle"
                                    fill="#c9a84c" opacity="0.35"
                                    fontFamily="Georgia,serif">?</text>
                            </svg>
                        </div>
                        <div className="game-panel-body">
                            <h2 className="game-panel-title game-panel-title--dim">More Tables</h2>
                            <p className="game-panel-desc game-panel-desc--dim">
                                New tables opening soon. Check back for Mighty, Blackjack, Poker, and more.
                            </p>
                        </div>
                        <button className="game-play-btn game-play-btn--disabled" disabled>
                            Coming Soon
                        </button>
                    </article>

                </section>
            </main>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <footer className="home-footer">
                <span aria-hidden="true">♠ Royal Table ♥</span>
                <span aria-hidden="true">♦ Play Responsibly ♣</span>
            </footer>

        </div>
    )
}

export default HomeScreen
