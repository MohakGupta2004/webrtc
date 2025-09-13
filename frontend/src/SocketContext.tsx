import React, { useEffect, useState, useCallback } from "react";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  send: (data: any) => void;
  addEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
  removeEventListener: (type: string, listener: (event: MessageEvent) => void) => void;
}

const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  send: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
});

export const useSocket = () => {
  return React.useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messageListeners, setMessageListeners] = useState<((event: MessageEvent) => void)[]>([]);

  const handleMessage = useCallback((event: MessageEvent) => {
    messageListeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in message listener:', err);
      }
    });
  }, [messageListeners]);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setSocket(null);
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.close();
    };

    ws.onmessage = handleMessage;

    return ws;
  }, [handleMessage]);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  const send = useCallback((data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socket.send(message);
    } else {
      console.error('Cannot send message - WebSocket is not connected');
    }
  }, [socket]);

  const addMessageListener = useCallback((listener: (event: MessageEvent) => void) => {
    setMessageListeners(prev => [...prev, listener]);
    return () => {
      setMessageListeners(prev => prev.filter(l => l !== listener));
    };
  }, []);

  const contextValue = {
    socket,
    isConnected,
    send,
    addEventListener: (type: string, listener: (event: MessageEvent) => void) => {
      if (type !== 'message') {
        console.warn('Only "message" event type is supported');
        return;
      }
      return addMessageListener(listener);
    },
    removeEventListener: (type: string, listener: (event: MessageEvent) => void) => {
      if (type !== 'message') return;
      setMessageListeners(prev => prev.filter(l => l !== listener));
    },
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
