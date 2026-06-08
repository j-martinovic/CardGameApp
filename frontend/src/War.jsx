import { useState, useEffect, useCallback, useRef } from 'react'
import CardFace from './assets/cards/CardFace'
import './War.css'

const API    = 'http://127.0.0.1:5000'
const BOT_NAME = 'The House'

// ─── Card back (inline SVG) ───────────────────────────────────────────────

function CardBack({ width = 100, height = 140, className = '' }) {
    const id = `cb-${width}-${height}`
    return (
        <svg
            viewBox="0 0 100 140"
            width={width}
            height={height}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Face-down card"
        >
            <defs>
                <pattern id={id} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <polygon points="5,1 9,5 5,9 1,5"
                        fill="none" stroke="#c8a96e" strokeWidth="0.5" opacity="0.55"/>
                </pattern>
            </defs>
            {/* Card body */}
            <rect x="1" y="1" width="98" height="138" rx="7"
                fill="#1a1a6e" stroke="#c8a96e" strokeWidth="1.5"/>
            {/* Inner border */}
            <rect x="5" y="5" width="90" height="130" rx="4"
                fill="none" stroke="#c8a96e" strokeWidth="0.7" opacity="0.4"/>
            {/* Diamond grid fill */}
            <rect x="5" y="5" width="90" height="130" rx="4"
                fill={`url(#${id})`}/>
            {/* Centre spade ornament */}
            <text x="50" y="78" fontSize="28" textAnchor="middle"
                fill="#c8a96e" opacity="0.7" fontFamily="Georgia,serif">♠</text>
        </svg>
    )
}

// ─── Flippable card wrapper ───────────────────────────────────────────────
// The container holds the 3-D perspective; the inner div rotates on .flipped.
// The deal animation is placed on the container so it doesn't conflict with
// the rotateY transition on the inner element.

function FlipCard({ card, faceUp, width = 100, height = 140,
                    dealClass = '', className = '', roundKey = 0 }) {
    return (
        <div
            className={`flip-wrap ${dealClass} ${className}`}
            style={{ width, height }}
            key={roundKey}
        >
            <div className={`flip-inner ${faceUp ? 'flipped' : ''}`}>
                <div className="flip-back">
                    <CardBack width={width} height={height} />
                </div>
                <div className="flip-front">
                    {card && (
                        <CardFace
                            rank={card.rank}
                            suit={card.suit}
                            width={width}
                            height={height}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Deck pile ────────────────────────────────────────────────────────────

function DeckPile({ count }) {
    return (
        <div className="deck-pile">
            {count > 0
                ? <div className={`deck-top ${count > 4 ? 'deck-deep' : count > 1 ? 'deck-mid' : ''}`}>
                      <CardBack width={72} height={100} />
                  </div>
                : <div className="deck-empty">Empty</div>
            }
            <div className="deck-count">{count}</div>
        </div>
    )
}

// ─── Card placeholder (shown before round starts) ─────────────────────────

function CardSlot() {
    return <div className="card-slot" aria-hidden="true" />
}

// ─── War sequence display ─────────────────────────────────────────────────
// Shows 3 face-down cards on each side animating in with stagger.

function WarSequenceCards({ warData }) {
    if (!warData || warData.length === 0) return null
    return (
        <div className="war-sequence">
            {warData.map((entry, wi) => (
                <div key={wi} className="war-sequence-row">
                    {/* 3 face-down cards — player side */}
                    <div className="war-seq-side">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="war-seq-card"
                                style={{ '--si': i + wi * 3 }}
                            >
                                <CardBack width={46} height={64} />
                            </div>
                        ))}
                    </div>
                    <span className="war-seq-vs">vs</span>
                    {/* 3 face-down cards — bot side */}
                    <div className="war-seq-side">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="war-seq-card"
                                style={{ '--si': i + 3 + wi * 3 }}
                            >
                                <CardBack width={46} height={64} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Confetti (CSS-only, no canvas) ──────────────────────────────────────

function Confetti() {
    // 24 pieces with randomised position and colour
    const pieces = Array.from({ length: 24 }, (_, i) => ({
        key:   i,
        left:  `${Math.round((i / 24) * 100)}%`,
        delay: `${(i * 0.07).toFixed(2)}s`,
        color: i % 4 === 0 ? '#f0c040'
             : i % 4 === 1 ? '#c9a84c'
             : i % 4 === 2 ? '#ffffff'
             :                '#27ae60',
        size:  `${8 + (i % 5) * 2}px`,
        rot:   `${(i * 37) % 360}deg`,
    }))

    return (
        <div className="confetti-wrap" aria-hidden="true">
            {pieces.map(p => (
                <div
                    key={p.key}
                    className="confetti-piece"
                    style={{
                        left:             p.left,
                        animationDelay:   p.delay,
                        background:       p.color,
                        width:            p.size,
                        height:           p.size,
                        '--rot':          p.rot,
                    }}
                />
            ))}
        </div>
    )
}

// ─── Game-over overlay ────────────────────────────────────────────────────

function GameOverOverlay({ winner, roundCount, onPlayAgain, onQuit }) {
    const isWin  = winner === 'player'
    const isDraw = winner === 'draw'

    return (
        <div className={`gameover-overlay ${isWin ? 'gameover-overlay--win' : isDraw ? 'gameover-overlay--draw' : 'gameover-overlay--loss'}`}>
            {isWin && <Confetti />}

            <div className="gameover-panel">
                <div className={`gameover-icon ${!isWin ? 'gameover-icon--dim' : ''}`}>
                    {isWin ? '♛' : isDraw ? '♦' : '♠'}
                </div>

                <h1 className={`gameover-title ${isWin ? 'gameover-title--win' : isDraw ? '' : 'gameover-title--loss'}`}>
                    {isWin ? 'Victory!' : isDraw ? 'A Draw' : 'Defeated'}
                </h1>

                <p className="gameover-sub">
                    {isWin  && `You conquered ${BOT_NAME} in ${roundCount} round${roundCount !== 1 ? 's' : ''}`}
                    {isDraw && `An eternal standoff after ${roundCount} rounds`}
                    {!isWin && !isDraw && `${BOT_NAME} prevails after ${roundCount} round${roundCount !== 1 ? 's' : ''}`}
                </p>

                {isWin && (
                    <p className="gameover-detail">All 52 cards are yours!</p>
                )}
                {!isWin && !isDraw && (
                    <p className="gameover-detail">Better luck next time.</p>
                )}

                <div className="gameover-actions">
                    <button onClick={onPlayAgain} className="war-btn war-btn--gold">
                        Play Again
                    </button>
                    <button onClick={onQuit} className="war-btn war-btn--outline">
                        Back to Lobby
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Loading screen ───────────────────────────────────────────────────────

function LoadingScreen() {
    return (
        <div className="war-loading-screen">
            <div className="war-loading-deck">
                <div className="loading-card lc-1"><CardBack width={70} height={98} /></div>
                <div className="loading-card lc-2"><CardBack width={70} height={98} /></div>
                <div className="loading-card lc-3"><CardBack width={70} height={98} /></div>
            </div>
            <p className="war-loading-text">Shuffling the deck…</p>
        </div>
    )
}

// ─── Main War Game component ──────────────────────────────────────────────

export default function WarGame({ user, onQuit }) {
    const [gameId,      setGameId]      = useState(null)
    const [phase,       setPhase]       = useState('loading')
    // 'loading' | 'idle' | 'dealing' | 'result' | 'war' | 'gameover' | 'error'

    const [playerCard,  setPlayerCard]  = useState(null)
    const [botCard,     setBotCard]     = useState(null)
    const [playerFaceUp, setPlayerFaceUp] = useState(false)
    const [botFaceUp,   setBotFaceUp]   = useState(false)

    const [playerCount, setPlayerCount] = useState(26)
    const [botCount,    setBotCount]    = useState(26)
    const [roundCount,  setRoundCount]  = useState(0)

    const [message,     setMessage]     = useState('')
    const [msgType,     setMsgType]     = useState('') // 'win'|'lose'|'war'|'info'
    const [warData,     setWarData]     = useState([])

    const [gameResult,  setGameResult]  = useState(null) // { winner }
    const [errorMsg,    setErrorMsg]    = useState('')

    // roundKey forces FlipCard to remount (resets CSS animations) each round
    const [roundKey, setRoundKey] = useState(0)

    // Track mounted state to avoid setting state after unmount
    const mountedRef = useRef(true)
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    const safe = (fn) => (...args) => {
        if (mountedRef.current) fn(...args)
    }

    // ── Start a new game ─────────────────────────────────────────────────

    const startNewGame = useCallback(async () => {
        safe(setPhase)('loading')
        safe(setErrorMsg)('')
        safe(setPlayerCard)(null)
        safe(setBotCard)(null)
        safe(setPlayerFaceUp)(false)
        safe(setBotFaceUp)(false)
        safe(setMessage)('')
        safe(setWarData)([])
        safe(setGameResult)(null)
        safe(setRoundCount)(0)
        safe(setRoundKey)(k => k + 1)

        try {
            const resp = await fetch(`${API}/war/new`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await resp.json()
            if (!resp.ok) throw new Error(data.error || 'Failed to start game.')

            if (!mountedRef.current) return
            setGameId(data.game_id)
            setPlayerCount(data.player_count)
            setBotCount(data.bot_count)
            setPhase('idle')
        } catch (err) {
            if (!mountedRef.current) return
            setErrorMsg(err.message)
            setPhase('error')
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { startNewGame() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Spacebar shortcut ─────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e) => {
            if (e.code === 'Space' && phase === 'idle') {
                e.preventDefault()
                handlePlayCard()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, gameId])

    // ── Play one round ────────────────────────────────────────────────────

    const handlePlayCard = useCallback(async () => {
        if (phase !== 'idle' || !gameId) return

        setPhase('dealing')
        setMessage('')
        setWarData([])
        // Clear previous cards and reset flip state
        setPlayerCard(null)
        setBotCard(null)
        setPlayerFaceUp(false)
        setBotFaceUp(false)
        setRoundKey(k => k + 1)

        let data
        try {
            const resp = await fetch(`${API}/war/play`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ game_id: gameId }),
            })
            data = await resp.json()
            if (!resp.ok) throw new Error(data.error || 'Failed to play round.')
        } catch (err) {
            if (!mountedRef.current) return
            setErrorMsg(err.message)
            setPhase('error')
            return
        }

        if (!mountedRef.current) return

        // Immediate game-over (someone ran out before cards were even flipped)
        if (data.outcome === 'game_over' && !data.player_card) {
            setPlayerCount(data.player_count)
            setBotCount(data.bot_count)
            setGameResult({ winner: data.winner })
            setPhase('gameover')
            return
        }

        // ── Animation timeline ────────────────────────────────────────────
        // T+0   : Show player card face-down (deal animation from below)
        // T+80  : Flip player card face-up
        // T+700 : Show bot card face-down (deal animation from above)
        // T+780 : Flip bot card face-up
        // T+1300: Resolve — show result / war sequence / game over

        setPlayerCard(data.player_card)

        setTimeout(() => { if (mountedRef.current) setPlayerFaceUp(true) }, 80)

        setTimeout(() => {
            if (!mountedRef.current) return
            setBotCard(data.bot_card)

            setTimeout(() => { if (mountedRef.current) setBotFaceUp(true) }, 80)

            setTimeout(() => {
                if (!mountedRef.current) return

                setRoundCount(data.round_count ?? (prev => prev + 1))
                setPlayerCount(data.player_count)
                setBotCount(data.bot_count)

                if (data.game_over) {
                    setGameResult({ winner: data.winner })
                    setPhase('gameover')
                    return
                }

                if (data.war_sequence && data.war_sequence.length > 0) {
                    // ── War sequence ──────────────────────────────────────
                    setWarData(data.war_sequence)
                    setMessage('WAR!')
                    setMsgType('war')
                    setPhase('war')

                    // Hold war screen, then show final outcome
                    const warHold = data.war_sequence.length * 900 + 1000
                    setTimeout(() => {
                        if (!mountedRef.current) return
                        setWarData([])
                        if (data.outcome === 'player_wins') {
                            setMessage(`You win the War! (+${data.cards_won} cards)`)
                            setMsgType('win')
                        } else {
                            setMessage(`The House wins the War! (−${data.cards_won} cards)`)
                            setMsgType('lose')
                        }
                        setPhase('result')
                        setTimeout(() => {
                            if (mountedRef.current) {
                                setMessage('')
                                setPhase('idle')
                            }
                        }, 2000)
                    }, warHold)
                } else {
                    // ── Normal round result ───────────────────────────────
                    if (data.outcome === 'player_wins') {
                        setMessage(`You win! (+${data.cards_won} cards)`)
                        setMsgType('win')
                    } else {
                        setMessage(`The House takes it. (−${data.cards_won} cards)`)
                        setMsgType('lose')
                    }
                    setPhase('result')
                    setTimeout(() => {
                        if (mountedRef.current) {
                            setMessage('')
                            setPhase('idle')
                        }
                    }, 1800)
                }
            }, 520) // wait after both cards visible
        }, 700) // bot "think" delay
    }, [phase, gameId]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Quit ──────────────────────────────────────────────────────────────

    const handleQuit = async () => {
        if (gameId) {
            // Best-effort cleanup — don't block navigation on failure
            fetch(`${API}/war/quit`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ game_id: gameId }),
            }).catch(() => {})
        }
        onQuit()
    }

    // ── Derived UI state ──────────────────────────────────────────────────

    const canDeal = phase === 'idle'

    const dealBtnLabel =
        phase === 'dealing' ? 'Playing…'
      : phase === 'war'     ? 'War!'
      : phase === 'result'  ? 'Next Round…'
      : phase === 'gameover'? 'Game Over'
      :                       'Deal Card'

    // ── Render ────────────────────────────────────────────────────────────

    if (phase === 'loading') return <LoadingScreen />

    if (phase === 'error') {
        return (
            <div className="war-screen war-error-page">
                <div className="war-error-panel">
                    <span className="war-error-icon">♠</span>
                    <h2>Connection Error</h2>
                    <p>{errorMsg}</p>
                    <button onClick={startNewGame} className="war-btn war-btn--gold">
                        Try Again
                    </button>
                    <button onClick={handleQuit} className="war-btn war-btn--outline">
                        Back to Lobby
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="war-screen">

            {/* ── Game-over overlay ─────────────────────────────────── */}
            {phase === 'gameover' && gameResult && (
                <GameOverOverlay
                    winner={gameResult.winner}
                    roundCount={roundCount}
                    onPlayAgain={startNewGame}
                    onQuit={handleQuit}
                />
            )}

            {/* ── Header ───────────────────────────────────────────── */}
            <header className="war-header">
                <button
                    onClick={handleQuit}
                    className="war-back-btn"
                    aria-label="Return to lobby"
                >
                    ← Lobby
                </button>

                <div className="war-header-title">
                    <span aria-hidden="true">♠</span>
                    <h1>War</h1>
                    <span aria-hidden="true">♥</span>
                </div>

                <div className="war-round-badge">
                    Round {roundCount}
                </div>
            </header>

            {/* ── Table ────────────────────────────────────────────── */}
            <div className="war-table">

                {/* Bot side */}
                <section className="war-side war-side--bot" aria-label="Bot's side">
                    <div className="war-side-label">
                        <span className="war-bot-icon" aria-hidden="true">♚</span>
                        <span>{BOT_NAME}</span>
                        <span className="war-card-count">{botCount} cards</span>
                    </div>
                    <div className="war-side-cards">
                        <DeckPile count={botCount} />
                        <div className="war-played-zone" aria-live="polite" aria-label="Bot's played card">
                            {botCard
                                ? <FlipCard
                                    key={`bot-${roundKey}`}
                                    card={botCard}
                                    faceUp={botFaceUp}
                                    width={100} height={140}
                                    dealClass="deal-from-top"
                                  />
                                : <CardSlot />
                            }
                        </div>
                    </div>
                </section>

                {/* Centre — message / war sequence */}
                <div className="war-center" aria-live="assertive">
                    {phase === 'war' && warData.length > 0 && (
                        <WarSequenceCards warData={warData} />
                    )}
                    {message && (
                        <div className={`war-message war-message--${msgType}`}>
                            {message}
                        </div>
                    )}
                    {!message && phase === 'idle' && (
                        <p className="war-idle-hint">Press Spacebar or click Deal Card</p>
                    )}
                </div>

                {/* Player side */}
                <section className="war-side war-side--player" aria-label="Your side">
                    <div className="war-side-cards">
                        <div className="war-played-zone" aria-live="polite" aria-label="Your played card">
                            {playerCard
                                ? <FlipCard
                                    key={`player-${roundKey}`}
                                    card={playerCard}
                                    faceUp={playerFaceUp}
                                    width={100} height={140}
                                    dealClass="deal-from-bottom"
                                  />
                                : <CardSlot />
                            }
                        </div>
                        <DeckPile count={playerCount} />
                    </div>
                    <div className="war-side-label war-side-label--player">
                        <span className="war-card-count">{playerCount} cards</span>
                        <span>{user?.loggedIn ? user.userName : 'You'}</span>
                        <span className="war-player-icon" aria-hidden="true">♟</span>
                    </div>
                </section>

            </div>

            {/* ── Deal button ───────────────────────────────────────── */}
            <footer className="war-footer">
                <button
                    className={`war-deal-btn ${canDeal ? 'war-deal-btn--active' : ''}`}
                    onClick={handlePlayCard}
                    disabled={!canDeal}
                    aria-label="Deal a card"
                >
                    {dealBtnLabel}
                </button>
                {canDeal && (
                    <p className="war-hint">or press <kbd>Space</kbd></p>
                )}
            </footer>

        </div>
    )
}
