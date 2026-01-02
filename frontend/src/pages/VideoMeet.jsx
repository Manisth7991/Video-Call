import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';


import server from '../environment';

const server_url = server; // Use server.dev for local development

// Use Map for better tracking of peer connections
const peerConnections = new Map();
const remoteStreamsMap = new Map();

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

// Memoized remote video component to prevent unnecessary re-renders
const RemoteVideo = React.memo(({ socketId, stream }) => {
    const videoRef = useRef();

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div key={socketId}>
            <video
                ref={videoRef}
                data-socket={socketId}
                autoPlay
                playsInline
            />
        </div>
    );
});

function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    // Only store REMOTE peer videos, never local
    let [remoteVideos, setRemoteVideos] = useState([])

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();

    }, []);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            let videoAvailableCheck = false;
            let audioAvailableCheck = false;

            // Check video permission
            try {
                const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoPermission) {
                    videoAvailableCheck = true;
                    setVideoAvailable(true);
                    console.log('Video permission granted');
                    // Stop the test stream
                    videoPermission.getTracks().forEach(track => track.stop());
                }
            } catch (e) {
                setVideoAvailable(false);
                console.log('Video permission denied:', e);
            }

            // Check audio permission
            try {
                const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (audioPermission) {
                    audioAvailableCheck = true;
                    setAudioAvailable(true);
                    console.log('Audio permission granted');
                    // Stop the test stream
                    audioPermission.getTracks().forEach(track => track.stop());
                }
            } catch (e) {
                setAudioAvailable(false);
                console.log('Audio permission denied:', e);
            }

            // Check screen share capability
            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            // Now get the actual stream to show preview
            if (videoAvailableCheck || audioAvailableCheck) {
                try {
                    const previewStream = await navigator.mediaDevices.getUserMedia({
                        video: videoAvailableCheck,
                        audio: audioAvailableCheck
                    });

                    if (previewStream) {
                        window.localStream = previewStream;
                        console.log('Preview stream obtained:', previewStream);

                        // Show preview in lobby video element
                        if (localVideoref.current) {
                            localVideoref.current.srcObject = previewStream;
                            localVideoref.current.play().catch(err => {
                                console.log('Preview play error:', err);
                            });
                        }
                    }
                } catch (streamError) {
                    console.error('Error getting preview stream:', streamError);
                }
            }
        } catch (error) {
            console.log('Error getting permissions:', error);
        }
    };

    // Use existing stream when joining the call
    let getMedia = async () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);

        // Stream already exists from getPermissions()
        // Just ensure it's assigned to the video element
        if (window.localStream && localVideoref.current) {
            localVideoref.current.srcObject = window.localStream;
            try {
                await localVideoref.current.play();
                console.log('Local video playing in meeting');
            } catch (playError) {
                console.error('Error playing local video:', playError);
            }
        } else if (!window.localStream) {
            // Fallback: if stream doesn't exist, get it now
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio: audioAvailable
                });

                if (stream) {
                    window.localStream = stream;
                    console.log('Local stream obtained in getMedia:', stream);

                    if (localVideoref.current) {
                        localVideoref.current.srcObject = stream;
                        await localVideoref.current.play();
                        console.log('Local video playing');
                    }
                }
            } catch (error) {
                console.error('Error getting media:', error);
            }
        }

        connectToSocketServer();
    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        // Update all existing peer connections with new stream
        peerConnections.forEach((pc, remoteSocketId) => {
            // Never create connection to self
            if (remoteSocketId === socketIdRef.current) return;

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.createOffer().then((description) => {
                console.log(description)
                pc.setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', remoteSocketId, JSON.stringify({ 'sdp': pc.localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        })

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            peerConnections.forEach((pc, remoteSocketId) => {
                if (remoteSocketId === socketIdRef.current) return;

                window.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, window.localStream);
                });

                pc.createOffer().then((description) => {
                    pc.setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', remoteSocketId, JSON.stringify({ 'sdp': pc.localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            })
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }



    let getDislayMediaSuccess = (stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        peerConnections.forEach((pc, remoteSocketId) => {
            if (remoteSocketId === socketIdRef.current) return;

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.createOffer().then((description) => {
                pc.setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', remoteSocketId, JSON.stringify({ 'sdp': pc.localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        })

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }

    let gotMessageFromServer = (fromId, message) => {
        // Never process signals from self
        if (fromId === socketIdRef.current) return;

        var signal = JSON.parse(message)
        const pc = peerConnections.get(fromId);

        if (!pc) {
            console.warn(`No peer connection found for ${fromId}`);
            return;
        }

        if (signal.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                if (signal.sdp.type === 'offer') {
                    pc.createAnswer().then((description) => {
                        pc.setLocalDescription(description).then(() => {
                            socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': pc.localDescription }))
                        }).catch(e => console.log(e))
                    }).catch(e => console.log(e))
                }
            }).catch(e => console.log(e))
        }

        if (signal.ice) {
            pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
        }
    }



    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            console.log("My socket ID:", socketIdRef.current);

            socketRef.current.on('chat-message', addMessage)

            // Clean up when a user leaves
            socketRef.current.on('user-left', (remoteSocketId) => {
                console.log("User left:", remoteSocketId);

                // Close and remove peer connection
                const pc = peerConnections.get(remoteSocketId);
                if (pc) {
                    pc.close();
                    peerConnections.delete(remoteSocketId);
                }

                // Remove from remote streams map
                remoteStreamsMap.delete(remoteSocketId);

                // Remove video from UI
                setRemoteVideos((videos) => videos.filter((video) => video.socketId !== remoteSocketId));
            });


            socketRef.current.on('user-joined', (id, clients) => {
                console.log("User-joined event. ID:", id, "Clients:", clients);

                clients.forEach((remoteSocketId) => {
                    // CRITICAL: Never create connection to self
                    if (remoteSocketId === socketIdRef.current) {
                        console.log("Skipping self:", remoteSocketId);
                        return;
                    }

                    // Skip if connection already exists to prevent duplicates
                    if (peerConnections.has(remoteSocketId)) {
                        console.log("Connection already exists for:", remoteSocketId);
                        return;
                    }

                    console.log("Creating new peer connection for:", remoteSocketId);

                    const pc = new RTCPeerConnection(peerConfigConnections);
                    peerConnections.set(remoteSocketId, pc);

                    // Handle ICE candidates
                    pc.onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', remoteSocketId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Handle incoming remote stream
                    pc.ontrack = (event) => {
                        console.log("ONTRACK from:", remoteSocketId);

                        // CRITICAL: Never add local stream in ontrack
                        if (remoteSocketId === socketIdRef.current) {
                            console.warn("Prevented adding local stream as remote!");
                            return;
                        }

                        const remoteStream = event.streams[0];
                        remoteStreamsMap.set(remoteSocketId, remoteStream);

                        // Check if video already exists in state
                        setRemoteVideos(videos => {
                            const exists = videos.find(v => v.socketId === remoteSocketId);

                            if (exists) {
                                // Update existing stream
                                return videos.map(v =>
                                    v.socketId === remoteSocketId ? { ...v, stream: remoteStream } : v
                                );
                            } else {
                                // Add new remote video
                                return [...videos, {
                                    socketId: remoteSocketId,
                                    stream: remoteStream,
                                    autoplay: true,
                                    playsinline: true
                                }];
                            }
                        });
                    };

                    // Add local stream tracks to peer connection
                    if (window.localStream !== undefined && window.localStream !== null) {
                        window.localStream.getTracks().forEach(track => {
                            pc.addTrack(track, window.localStream);
                        });
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        window.localStream.getTracks().forEach(track => {
                            pc.addTrack(track, window.localStream);
                        });
                    }
                })

                // Only existing users should create offers to the newly joined user
                if (id !== socketIdRef.current) {
                    // I'm an existing user, someone else just joined
                    console.log("I'm existing user, creating offer to:", id);
                    const pc = peerConnections.get(id);
                    if (pc) {
                        pc.createOffer().then((description) => {
                            pc.setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    const handleVideo = useCallback(() => {
        if (!videoAvailable) return;

        if (window.localStream) {
            const videoTracks = window.localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks[0].enabled = !videoTracks[0].enabled;
                setVideo(videoTracks[0].enabled);
            }
        }
    }, [videoAvailable]);

    const handleAudio = useCallback(() => {
        if (!audioAvailable) return;

        if (window.localStream) {
            const audioTracks = window.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !audioTracks[0].enabled;
                setAudio(audioTracks[0].enabled);
            }
        }
    }, [audioAvailable]);

    const handleScreen = useCallback(() => {
        setScreen((prev) => !prev);
    }, []);

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])

    // Reset unread messages when chat is opened
    useEffect(() => {
        if (showModal) {
            setNewMessages(0);
        }
    }, [showModal]);


    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }

        // Close all peer connections
        peerConnections.forEach((pc) => {
            pc.close();
        });
        peerConnections.clear();
        remoteStreamsMap.clear();

        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }

    const handleMessage = useCallback((e) => {
        setMessage(e.target.value);
    }, []);

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    const sendMessage = useCallback(() => {
        if (message.trim() === "") return;
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    }, [message, username]);


    // Ensure video displays properly in both lobby and meeting
    useEffect(() => {
        const assignStreamToVideo = async () => {
            if (window.localStream && localVideoref.current) {
                try {
                    localVideoref.current.srcObject = window.localStream;
                    await localVideoref.current.play();
                    console.log('Local video assigned and playing via useEffect');
                } catch (error) {
                    console.error('Error assigning/playing local video:', error);
                }
            }
        };

        assignStreamToVideo();
    }, [askForUsername]); // Run when user joins or stays in lobby

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }


    return (
        <div>

            {askForUsername === true ?

                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyContent}>
                        <div className={styles.lobbyCard}>
                            <h1 className={styles.lobbyTitle}>Welcome to Video Call</h1>
                            <p className={styles.lobbySubtitle}>Enter your name to join the meeting</p>

                            <div className={styles.previewVideo}>
                                <video ref={localVideoref} autoPlay muted playsInline className={styles.localPreview}></video>
                            </div>

                            <TextField
                                id="outlined-basic"
                                label="Your Name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                variant="outlined"
                                fullWidth
                                className={styles.usernameInput}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#2196f3',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255, 255, 255, 0.7)',
                                    },
                                }}
                            />

                            <Button
                                variant="contained"
                                onClick={connect}
                                fullWidth
                                disabled={!username.trim()}
                                className={styles.joinButton}
                                sx={{
                                    fontSize: '1.1rem',
                                    padding: '12px 24px',
                                    marginTop: '20px',
                                    borderRadius: '8px',
                                    textTransform: 'capitalize',
                                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                                    },
                                    '&:disabled': {
                                        background: 'rgba(255, 255, 255, 0.12)',
                                    },
                                }}
                            >
                                Join Meeting
                            </Button>
                        </div>
                    </div>
                </div> :
                <div className={styles.meetVideoContainer}>

                    {showModal ? (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1 className={styles.chatTitle}>Chat</h1>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div key={index} className={styles.chatMessage}>
                                            <p className={styles.senderName}>{item.sender}</p>
                                            <p className={styles.messageText}>{item.data}</p>
                                        </div>
                                    )) : <p>No Messages Yet</p>}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        label="Enter your chat"
                                        variant="outlined"
                                        className={styles.chatInput}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={sendMessage}
                                        sx={{
                                            fontSize: '1rem',
                                            padding: '8px 24px',
                                            borderRadius: '8px',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={() => {
                                if (!showModal) {
                                    setNewMessages(0);
                                }
                                setModal(!showModal);
                            }} style={{ color: "white" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                    </div>


                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted playsInline></video>

                    <div className={styles.conferenceView}>
                        {remoteVideos.map((video) => (
                            <RemoteVideo
                                key={video.socketId}
                                socketId={video.socketId}
                                stream={video.stream}
                            />
                        ))}
                    </div>
                </div>
            }
        </div>
    )
}
export default React.memo(VideoMeetComponent);