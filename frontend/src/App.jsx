import { useState } from 'react'
import './App.css'
import HomeScreen from './Home'
import LoginScreen from './Login'


function App() {
  const [state, setState] = useState("home")

  const launchLogin = () => {
    if (state !== "loggingIn") {
      setState("loggingIn")
    }
  }

  const closeLogin = () => {
    setState("home")
  }
 

  return (
    <>
      {state === "loggingIn" ? <LoginScreen /> : <HomeScreen />}
    </>
  )
}

export default App
