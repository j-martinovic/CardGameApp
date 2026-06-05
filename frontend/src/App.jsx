import { useState } from 'react'
import './App.css'
import HomeScreen from './Home'
import LoginScreen from './Login'
// NOTE: A visual asset gallery exists at ./components/AssetPreview.jsx
// To view all card/chip/avatar/table SVGs and animation demos, temporarily
// replace the JSX return below with: <AssetPreview />
// See frontend/README_ASSETS.md for full documentation.


function App() {
  const [state, setState] = useState("home")
  const [signUp, setSignUp] = useState(false)

  const launchLogin = (signUp) => {
    setState("loggingIn")
    setSignUp(signUp)
  }

  const closeLogin = () => {
    setState("home")
  }
 
  const returnHome = () => {
    setState("home")
  }

  return (
    <>
      {state === "loggingIn" ? <LoginScreen returnHome={returnHome} signUp={signUp} /> : <HomeScreen openLogin={launchLogin} />}
    </>
  )
}

export default App
