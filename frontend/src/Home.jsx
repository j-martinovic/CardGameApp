import { useState } from 'react'
import './Home.css'



const HomeScreen = () => {
    return (
        <div className="home-screen">
            <h1>Welcome to the Card Game App!</h1>
            <p>Get ready to play and have fun!</p>
            <div>
                <img src="/Logo1.png" alt="Card Game Logo" className="home-logo" />
            </div>
        </div>
    )
}

export default HomeScreen