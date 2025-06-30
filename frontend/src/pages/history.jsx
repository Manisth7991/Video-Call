import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Box,
    CardContent,
    IconButton,
    Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <Box
            sx={{
                padding: '2rem',
                backgroundColor: '#f4f6f8',
                minHeight: '100vh',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: '1.5rem',
                }}
            >
                <IconButton
                    onClick={() => routeTo('/home')}
                    sx={{
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: '#115293',
                        },
                    }}
                >
                    <HomeIcon />
                </IconButton>
            </Box>

            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', marginBottom: '2rem' }}>
                Meeting History
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                }}
            >
                {meetings.length !== 0 ? (
                    meetings.map((e, i) => (
                        <Card
                            key={i}
                            variant="outlined"
                            sx={{
                                boxShadow: 3,
                                borderRadius: '12px',
                                padding: '1rem',
                                backgroundColor: '#fff',
                            }}
                        >
                            <CardContent>
                                <Typography sx={{ fontSize: 16, fontWeight: 600 }} gutterBottom>
                                    Meeting Code: <span style={{ color: '#1976d2' }}>{e.meetingCode}</span>
                                </Typography>
                                <Typography sx={{ fontSize: 14 }} color="text.secondary">
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Typography variant="body1" sx={{ color: 'gray' }}>
                        No past meetings found.
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
