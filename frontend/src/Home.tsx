import { useState } from "react";
import { useSocket } from "./SocketContext";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const { socket, isConnected } = useSocket();
  const [email, setEmail] = useState<string>('');
  const [roomID, setRoomID] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (!email || !roomID) {
      setError('Please enter both email and room ID');
      return;
    }

    if (!isConnected || !socket) {
      setError('Not connected to server. Please try again.');
      return;
    }

    try {
      const roomId = roomID.trim();
socket.send(JSON.stringify({ 
        type: 'join-room', 
        email: email.trim(), 
        room: roomId 
      }));
      
      navigate(`/room/${roomId}`, { 
        state: { email: email.trim() } 
      });
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room. Please try again.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Join a Video Call</h2>
        
        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#555'
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#555'
          }}>
            Room ID
          </label>
          <input
            type="text"
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
            placeholder="Enter room ID"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              marginBottom: '1rem'
            }}
          />
        </div>

        {error && (
          <div style={{
            color: '#e53e3e',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleJoinRoom}
          disabled={!isConnected}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: isConnected ? '#4CAF50' : '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            marginBottom: '1rem'
          }}
          onMouseOver={(e) => {
            if (isConnected) {
              e.currentTarget.style.backgroundColor = '#45a049';
            }
          }}
          onMouseOut={(e) => {
            if (isConnected) {
              e.currentTarget.style.backgroundColor = '#4CAF50';
            }
          }}
        >
          {isConnected ? 'Join Room' : 'Connecting...'}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '1rem',
          color: isConnected ? '#4CAF50' : '#E53E3E',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#4CAF50' : '#E53E3E',
            marginRight: '0.5rem'
          }} />
          {isConnected ? 'Connected to server' : 'Disconnected from server'}
        </div>
      </div>
    </div>
  );
};

