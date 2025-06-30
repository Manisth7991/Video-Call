import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import withAuth from '../utils/withAuth';
import '../styles/home.css';
import { Icon, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import Button from '@mui/material/Button';
import { AuthContext } from '../contexts/AuthContext';


function HomeComponent() {

    let navigate = useNavigate();
    const [meetingcode, setMeetingCode] = useState("");

    const {addToUserHistory} = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingcode);
        navigate(`/${meetingcode}`); 
    }
  return (
    <>
    <div className='navBar'>
        <div style={{ display: 'flex',alignItems: 'center' }}>
            <h2>Manisth Video Call</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center'}}>
            <IconButton onClick={() => navigate("/history")}>
                <RestoreIcon/>
            </IconButton>
            <p>History</p>
            <Button onClick ={() => {
                localStorage.removeItem("token");
                navigate("/auth");
            }}>
                Logout
            </Button>
        </div>
    </div>

    <div className="meetContainer">
        <div className="leftPanel">
            <div>
                <h2>Providing Quality Video Call Just Like Quality Education</h2>
                <div style={{display: 'flex',gap: '10px'}}>
                    <TextField onChange={(e) => setMeetingCode(e.target.value)} id='outlined-basic' label="Enter Meeting Code" variant="outlined" />
                    <Button variant="contained" onClick={handleJoinVideoCall}>Join</Button>
                </div>
            </div>
        </div>
        <div className="rightPanel">
            <img src="/logo3.png" alt="Manisth Video Call Logo"/>
        </div>
    </div>
    </>
  )
}

export default withAuth(HomeComponent);