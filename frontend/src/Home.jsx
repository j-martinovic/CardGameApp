import { useState } from 'react'
import './Home.css'



const HomeScreen = ({openLogin, signOut, user}) => {
    return (
        <div className="home-screen">
            {user.loggedIn ? (
                <>
                    <div className="top-header">
                        <button onClick={() => signOut()} className="login-button">Sign Out</button>
                        <label className="username-label">{user.userName}</label>
                    </div>
                </>
            ) : (
                <>
                    <div className="top-header">
                        <button onClick={() => openLogin(false)} className="login-button">Login</button>
                        <button onClick={() => openLogin(true)} className="login-button">Sign Up</button>
                    </div>
                </>
            )}
            <br></br>
            <h2>Welcome to the Card Game App!</h2>
            <p>Get ready to play and have fun!</p>
            <div>
                <img 
                    src="/Logo1.png" 
                    alt="Card Game Logo" 
                    className="home-logo" 
                />
            </div>
        </div>
    )
}

export default HomeScreen