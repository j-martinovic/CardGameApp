import { useState } from 'react'
import './App.css'
import HomeScreen from './Home'


function App() {
  const [state, setCount] = useState("")



  return (
    <>
      <HomeScreen />
    </>
  )
}

export default App
