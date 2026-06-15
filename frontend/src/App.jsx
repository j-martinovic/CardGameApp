import { useState } from 'react'
import './App.css'
import HomeScreen from './Home'
import LoginScreen from './Login'
import WarGame from './War'
import CardFace from './assets/cards/CardFace'
import LobbyScreen from './LobbyComponents/LobbyScreen.jsx'
// NOTE: A visual asset gallery exists at ./components/AssetPreview.jsx
// To view all card/chip/avatar/table SVGs and animation demos, temporarily
// replace the JSX return below with: <AssetPreview />
// See frontend/README_ASSETS.md for full documentation.

const API = 'http://127.0.0.1:5000'

function App() {
  // App-level routing: 'home' | 'loggingIn' | 'war'
  const [screen, setScreen] = useState('home')
  const [signUp, setSignUp]   = useState(false)
  const [userInfo, setUserInfo] = useState({})
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // ── Auth ──────────────────────────────────────────────────────────────────

  const launchLogin = (isSignUp) => {
    setSignUp(isSignUp)
    setIsLoggingIn(true)
  }

  const returnHome = (user, screen='home') => {
    setUserInfo(user || {})
    setIsLoggingIn(false)
    setScreen(screen)
  }

  const signOut = async () => {
    try {
      const resp = await fetch(`${API}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userInfo.id }),
      })
      const info = await resp.json()
      if (!resp.ok) {
        // Show themed error — surface message via alert for now
        // (Home screen has no persistent error display in its current design)
        console.error('Logout error:', info.message)
      }
    } catch {
      console.error('Could not reach the server during logout.')
    } finally {
      setUserInfo({})
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  const launchLobby = () => setScreen('lobby')
  const launchWar  = () => setScreen('war')
  const quitWar    = () => setScreen('home')

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoggingIn) {
    return <LoginScreen returnHome={(user) => {returnHome(user, screen)}} signUp={signUp} />
  } else if (screen === 'war') {
    return <WarGame user={userInfo} onQuit={quitWar} />
  } else if (screen === "home") {
    return (
      <HomeScreen
        openLogin={launchLogin}
        signOut={signOut}
        user={userInfo}
        onPlay={launchLobby}
      />
    )
  } else if (screen === 'lobby') {
    return (
      <LobbyScreen
        userInfo={userInfo}
        openLogin={launchLogin}
        signOut={signOut}
        returnHome={returnHome}
     />
    )
  }


}

export default App
