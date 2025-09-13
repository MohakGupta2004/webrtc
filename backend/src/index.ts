// backend/src/index.ts
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface BaseMessage {
  type: string;
}

interface JoinRoomMessage extends BaseMessage {
  type: 'join-room';
  email: string;
  room: string;
}

interface UserJoinedMessage extends BaseMessage {
  type: 'user:joined';
  email: string;
  socketId: string;
}

interface UserCallMessage extends BaseMessage {
  type: 'user:call';
  to: string;
  offer: any;
}

interface CallAcceptedMessage extends BaseMessage {
  type: 'call:accepted';
  to: string;
  ans: any;
}

type ClientMessage = JoinRoomMessage | UserCallMessage | CallAcceptedMessage;

// Store active connections
const rooms = new Map<string, Map<string, WebSocket>>();
const socketToRoom = new Map<WebSocket, { roomId: string; socketId: string; email: string }>();
const socketToId = new Map<WebSocket, string>();

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  const socketId = uuidv4();
  socketToId.set(ws, socketId);

  ws.on('message', (raw) => {
    try {
      const data: ClientMessage = JSON.parse(raw.toString());
      console.log('Received message:', data);

      switch (data.type) {
        case 'join-room': {
          const { email, room } = data;
          
          // Remove from any existing rooms
          const existingRoom = socketToRoom.get(ws);
          if (existingRoom) {
            const roomUsers = rooms.get(existingRoom.roomId);
            roomUsers?.delete(existingRoom.socketId);
            if (roomUsers?.size === 0) {
              rooms.delete(existingRoom.roomId);
            }
          }

          // Add to new room
          if (!rooms.has(room)) {
            rooms.set(room, new Map());
          }
          
          rooms.get(room)?.set(socketId, ws);
          socketToRoom.set(ws, { roomId: room, socketId, email });

          // Notify everyone in the room
          const usersInRoom = Array.from(rooms.get(room)?.entries() || []);
          usersInRoom.forEach(([id, client]) => {
            if (client.readyState === WebSocket.OPEN) {
              const userInfo = socketToRoom.get(client);
              if (userInfo) {
                // Notify existing users about the new user
                client.send(JSON.stringify({
                  type: 'user:joined',
                  email: userInfo.email,
                  socketId: userInfo.socketId
                }));
              }
            }
          });

          // Send room info to the new user
          const otherUsers = usersInRoom
            .filter(([id]) => id !== socketId)
            .map(([id, client]) => {
              const userInfo = socketToRoom.get(client);
              return userInfo ? { email: userInfo.email, socketId: userInfo.socketId } : null;
            })
            .filter(Boolean);

          ws.send(JSON.stringify({
            type: 'room:join',
            room,
            users: otherUsers
          }));

          break;
        }

        case 'user:call': {
          const { to, offer } = data;
          const senderInfo = socketToRoom.get(ws);
          if (!senderInfo) return;

          const roomUsers = rooms.get(senderInfo.roomId);
          if (!roomUsers) return;

          const targetSocket = Array.from(roomUsers.entries())
            .find(([id]) => id === to)?.[1];

          if (targetSocket?.readyState === WebSocket.OPEN) {
            targetSocket.send(JSON.stringify({
              type: 'incoming:call',
              from: senderInfo.socketId,
              offer
            }));
          }
          break;
        }

        case 'call:accepted': {
          const { to, ans } = data;
          const senderInfo = socketToRoom.get(ws);
          if (!senderInfo) return;

          const roomUsers = rooms.get(senderInfo.roomId);
          if (!roomUsers) return;

          const targetSocket = Array.from(roomUsers.entries())
            .find(([id]) => id === to)?.[1];

          if (targetSocket?.readyState === WebSocket.OPEN) {
            targetSocket.send(JSON.stringify({
              type: 'call:accepted',
              from: senderInfo.socketId,
              ans
            }));
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    const socketInfo = socketToRoom.get(ws);
    if (socketInfo) {
      const { roomId, socketId } = socketInfo;
      const roomUsers = rooms.get(roomId);
      if (roomUsers) {
        roomUsers.delete(socketId);
        if (roomUsers.size === 0) {
          rooms.delete(roomId);
        } else {
          // Notify remaining users about the disconnection
          roomUsers.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'user:left',
                socketId
              }));
            }
          });
        }
      }
      socketToRoom.delete(ws);
    }
    socketToId.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server running on ws://localhost:8080');