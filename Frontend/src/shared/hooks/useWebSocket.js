import { useEffect, useRef, useState } from 'react';

const getDefaultUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname || 'localhost';
  return `${protocol}://${host}:8080/ws`;
};

export const useWebSocket = (url, options = {}) => {
  const {
    onMessage,
    onOpen,
    onClose,
    shouldReconnect = true,
    reconnectDelay = 1000,
    maxReconnectDelay = 10000,
  } = options;

  const [status, setStatus] = useState('connecting');
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const wsUrl = url || getDefaultUrl();

    const connect = () => {
      if (!isMounted) {
        return;
      }

      setStatus('connecting');
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        reconnectRef.current = 0;
        setStatus('open');
        if (onOpen) {
          onOpen();
        }
      };

      socket.onmessage = (event) => {
        let payload = event.data;
        try {
          payload = JSON.parse(event.data);
        } catch {
          // Keep raw payload if JSON parsing fails.
        }
        setLastMessage(payload);
        if (onMessage) {
          onMessage(payload);
        }
      };

      socket.onclose = () => {
        setStatus('closed');
        if (onClose) {
          onClose();
        }

        if (shouldReconnect && isMounted) {
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectRef.current),
            maxReconnectDelay,
          );
          reconnectRef.current += 1;
          timeoutRef.current = setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState <= 1) {
        wsRef.current.close();
      }
    };
  }, [url, onMessage, onOpen, onClose, shouldReconnect, reconnectDelay, maxReconnectDelay]);

  const send = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  };

  return { status, lastMessage, send };
};
