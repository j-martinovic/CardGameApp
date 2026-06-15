
const HeaderBanner = ({user, openLogin, signOut}) => {

    return (
        <header className="home-header">
            <div className="home-header-brand">
                <span className="home-brand-suit" aria-hidden="true">♠</span>
                <span className="home-brand-name">Royal Table</span>
                <span className="home-brand-suit" aria-hidden="true">♥</span>
            </div>

            <nav className="home-header-nav">
                {user.loggedIn ? (
                    <>
                        <span className="home-username">
                            <span className="home-username-chip" aria-hidden="true">♦</span>
                            {user.userName}
                            <span className="home-username-chip" aria-hidden="true">♣</span>
                        </span>
                        <button
                            onClick={signOut}
                            className="header-btn header-btn--outline"
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => openLogin(false)}
                            className="header-btn header-btn--outline"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => openLogin(true)}
                            className="header-btn header-btn--gold"
                        >
                            Sign Up
                        </button>
                    </>
                )}
            </nav>
        </header>
    )
}

export default HeaderBanner