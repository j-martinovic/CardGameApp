import { useState } from 'react'
import './App.css'
import HomeScreen from './Home'
import LoginScreen from './Login'


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
