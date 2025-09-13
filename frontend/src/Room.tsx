import { useCallback, useEffect, useState, useRef } from "react";
import { useSocket } from "./SocketContext";
import ReactPlayer from 'react-player';
import peer from "./peer";

export const Room = () => {
  const { socket, send, addEventListener, removeEventListener } = useSocket();
  const peerRef = useRef(peer);
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  // Handle user joined
  const handleUserJoined = useCallback((email: string, socketId: string) => {
    console.log(`Email ${email} joined with socket ID: ${socketId}`);
    setRemoteSocketId(socketId);
  }, []);

  // Handle incoming call
  const handleIncomingCall = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    console.log("Incoming call from:", from);
    setRemoteSocketId(from);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      
      const ans = await peerRef.current.getAnswer(offer);
      if (send) {
        send(JSON.stringify({
          type: 'call:accepted',
          to: from,
          ans
        }));
      }
    } catch (err) {
      console.error("Error handling incoming call:", err);
    }
  }, [send]);

  // Handle call accepted
  const handleCallAccepted = useCallback(async (from: string, ans: RTCSessionDescriptionInit) => {
    console.log("Call accepted by:", from);
    await peerRef.current.setLocalDescription(ans);
  }, []);

  // Handle user call
  const handleUserCall = async () => {
    if (!remoteSocketId || !send) {
      console.error('No remote socket ID or WebSocket connection');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setMyStream(stream);
      
      const offer = await peerRef.current.getOffer();
      if (!offer) {
        throw new Error('Failed to create offer');
      }
      
      if (send) {
        send(JSON.stringify({
          type: 'user:call',
          to: remoteSocketId,
          offer
        }));
      }
    } catch (err) {
      console.error("Error making call:", err);
    }
  };

  // Set up peer connection
  useEffect(() => {
    const currentPeer = peerRef.current;
    if (!currentPeer.peer) return;

    const handleTrack = (event: RTCTrackEvent) => {
      console.log("Received track event:", event);
      setRemoteStream(event.streams[0]);
    };

    const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && remoteSocketId && send) {
        send(JSON.stringify({
          type: 'ice-candidate',
          to: remoteSocketId,
          candidate: event.candidate
        }));
      }
    };

    currentPeer.peer.addEventListener('track', handleTrack);
    currentPeer.peer.addEventListener('icecandidate', handleIceCandidate);

    // Add local stream to peer connection if available
    if (myStream) {
      myStream.getTracks().forEach(track => {
        currentPeer.peer?.addTrack(track, myStream);
      });
    }

    return () => {
      if (currentPeer.peer) {
        currentPeer.peer.removeEventListener('track', handleTrack);
        currentPeer.peer.removeEventListener('icecandidate', handleIceCandidate);
      }
    };
  }, [myStream, send, remoteSocketId]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log("Received message:", data);

        switch (data.type) {
          case 'user:joined':
            handleUserJoined(data.email, data.socketId);
            break;
          case 'incoming:call':
            handleIncomingCall(data.from, data.offer);
            break;
          case 'call:accepted':
            handleCallAccepted(data.from, data.ans);
            break;
          case 'room:join':
            console.log('Room joined successfully:', data);
            break;
          case 'user:left':
            console.log('User left:', data.socketId);
            if (data.socketId === remoteSocketId) {
              setRemoteSocketId(null);
              setRemoteStream(null);
            }
            break;
          case 'ice-candidate':
            if (data.candidate) {
              peerRef.current.peer?.addIceCandidate(new RTCIceCandidate(data.candidate))
                .catch(e => console.error('Error adding ICE candidate:', e));
            }
            break;
          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    };

    // Add the message listener using the context's addEventListener
    addEventListener('message', handleMessage);
    
    // Clean up the event listener when the component unmounts
    return () => {
      removeEventListener('message', handleMessage);
    };
  }, [addEventListener, removeEventListener, remoteSocketId, handleUserJoined, handleIncomingCall, handleCallAccepted]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Video Call</h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {myStream && (
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h3>My Stream</h3>
            <ReactPlayer
              playing
              muted
              height="180px"
              width="320px"
              url={myStream}
            />
          </div>
        )}
        
        {remoteStream && (
          <div style={{ border: '1px solid #4CAF50', padding: '10px', borderRadius: '8px' }}>
            <h3>Remote Stream</h3>
            <ReactPlayer
              playing
              height="180px"
              width="320px"
              url={remoteStream}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {remoteSocketId ? (
          <button 
            onClick={handleUserCall}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Start Call
          </button>
        ) : (
          <p>Waiting for another user to join...</p>
        )}
      </div>

      <div>
        <h3>Connection Status</h3>
        <p>Remote User: {remoteSocketId ? 'Connected' : 'Not connected'}</p>
        {remoteSocketId && <p>Remote Socket ID: {remoteSocketId}</p>}
      </div>
    </div>
  );
};