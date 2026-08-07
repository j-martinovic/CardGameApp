import { useState } from 'react'
import './Login.css'

const LoginScreen = ({ returnHome, signUp }) => {
    const [userName,     setUserName]     = useState('')
    const [email,        setEmail]        = useState('')
    const [password,     setPassword]     = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errorMsg,     setErrorMsg]     = useState('')
    const [isLoading,    setIsLoading]    = useState(false)

    const togglePasswordVisibility = () => setShowPassword(v => !v)

    // ── Client-side validation ────────────────────────────────────────────
    const validate = () => {
        if (!userName.trim())
            return 'Please enter a username.'
        if (signUp && !email.trim())
            return 'Please enter your email address.'
        if (signUp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return 'Please enter a valid email address.'
        if (!password)
            return 'Please enter a password.'
        if (signUp && password.length < 6)
            return 'Password must be at least 6 characters.'
        return null
    }

    // ── Submit ────────────────────────────────────────────────────────────
    const handleLoginRequest = async (e) => {
        e.preventDefault()
        setErrorMsg('')

        const clientError = validate()
        if (clientError) {
            setErrorMsg(clientError)
            return
        }

        setIsLoading(true)
        try {
            const resp = await fetch(
                `http://127.0.0.1:8000/${signUp ? 'signup' : 'login'}`,
                {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ userName, email, password }),
                }
            )
            const info = await resp.json()

            if (resp.status !== 200 && resp.status !== 201) {
                setErrorMsg(info.message || 'Something went wrong. Please try again.')
            } else {
                returnHome(info.user)
            }
        } catch {
            setErrorMsg('Could not connect to the server. Is it running?')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-screen">
            <div className="login-box">

                {/* Back button */}
                <button
                    type="button"
                    className="back-button"
                    onClick={() => returnHome({})}
                    aria-label="Go back to home"
                >
                    ←
                </button>

                {/* Title */}
                <div className="login-title-wrap">
                    <span className="login-suit" aria-hidden="true">♠</span>
                    <h1 className="login-title">
                        {signUp ? 'Join the Table' : 'Welcome Back'}
                    </h1>
                    <span className="login-suit" aria-hidden="true">♠</span>
                </div>

                {/* Inline error — themed, replaces browser alert() */}
                {errorMsg && (
                    <div className="login-error" role="alert">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLoginRequest} noValidate>

                    <div className="form-row">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            autoComplete="username"
                            placeholder="Your table name"
                        />
                    </div>

                    {/* Email is only needed when signing up */}
                    {signUp && (
                        <div className="form-row">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder="your@email.com"
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <label htmlFor="password">Password</label>
                        <div className="password-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                className="password-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={signUp ? 'new-password' : 'current-password'}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                        stroke="currentColor" strokeWidth="2"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                        stroke="currentColor" strokeWidth="2"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? 'One moment…'
                            : signUp ? 'Take a Seat' : 'Enter the Table'}
                    </button>
                </form>

            </div>
        </div>
    )
}

export default LoginScreen
