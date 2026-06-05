import { useState } from 'react'


const LoginScreen = ({returnHome, signUp}) => {
    const [userName, setUserName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const data = {
        userName,
        email,
        password
    }


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    const handleLoginRequest = async ({e, signUp}) => {
        e.preventDefault()

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
            }
            
        const validation = await fetch("http://127.0.0.1:5000/" + (signUp ? "signup" : "login"), options)
        
        if (validation.status !== 201 && validation.status !== 200) {
            const message = await validation.json()
            alert(message.message)
        } else {
            alert("Login successful!")
            returnHome()
        }
    }

    return (
        <div className="login-screen">
            <h1>Login</h1>
            <form onSubmit={handleLoginRequest}>
                <label htmlFor="username">User Name:</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                />
                <br />

                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <br />
                <div className="password-container">
                    <label htmlFor="password">Password:</label>
                    <input
                        className="password-input"
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        placeholder="Enter your password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="password-toggle"
                    >
                        {showPassword ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        ) : (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        )}
                    </button>
                </div>
                <br />

                <button type="submit">
                    {signUp ? "Create Account" : "Login"}
                </button>
            </form>
        </div>
    )
}

export default LoginScreen