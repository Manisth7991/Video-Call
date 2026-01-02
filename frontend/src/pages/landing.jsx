import React, { useState } from 'react'
import "../App.css";
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

export default function Landing() {

  const router = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className='landingPageContainer' style={{ backgroundImage: "url('/background.png')" }}>
      <nav>
        <div className='navHeader'><h2>Video Call</h2></div>

        {/* Hamburger Icon - Only visible on mobile */}
        <div className='hamburgerIcon'>
          <IconButton
            onClick={() => setShowMenu(!showMenu)}
            sx={{ color: 'white' }}
          >
            {showMenu ? <CloseIcon fontSize="large" /> : <MenuIcon fontSize="large" />}
          </IconButton>
        </div>

        {/* Desktop Nav - Always visible on desktop, controlled by state on mobile */}
        <div className={`navlist ${showMenu ? 'show' : ''}`}>
          <p onClick={() => { router("/wejguow"); setShowMenu(false); }}>Join as Guest</p>
          <p onClick={() => { router("/auth?mode=signup"); setShowMenu(false); }}>Register</p>
          <div onClick={() => { router("/auth?mode=login"); setShowMenu(false); }} role='button'>
            <p>Login</p>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      {showMenu && <div className='menuOverlay' onClick={() => setShowMenu(false)}></div>}

      <div className="landingMainContainer">
        <div>
          <h1><span style={{ color: "#FF9839" }}>Connect</span> with your Loved ones</h1>
          <p>Cover a distance by Video Call</p>
          <div role='button'>
            <Link to={"/auth"}> Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="" />
        </div>
      </div>
    </div>
  )
}
