import { useState } from 'react'
import './App.css'
import HomeScreen from './Home'
import LoginScreen from './Login'


function App() {

  // const val = async () => {
  //   const validation = await fetch("http://127.0.0.1:5000/get_users")
  // }
  // val()

  const [state, setState] = useState("home")
  const [signUp, setSignUp] = useState(false)
  const [userInfo, setUserInfo] = useState({})

  const launchLogin = (signUp) => {
    setState("loggingIn")
    setSignUp(signUp)
  }

  // const closeLogin = () => {
  //   setState("home")
  // }
 
  const returnHome = async (user) => {
    setState("home")
    setUserInfo(user)
  }

  const signOut = async () => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({id: userInfo.id})
    }
    const response = await fetch("http://127.0.0.1:5000/logout", options)
    const info = await response.json()
    
    if (response.status !== 200 && response.status !== 201) {
      alert(info.message)
    } else {
      alert("Logout successful!")
      setUserInfo({})
    }
  }

  return (
    <>
      {state === "loggingIn" ? <LoginScreen returnHome={returnHome} signUp={signUp} /> : <HomeScreen openLogin={launchLogin} signOut={signOut} user={userInfo} />}
    </>
  )
}

export default App
