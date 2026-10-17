import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { roomPeerId } from '../utils/rooms.js';

// PeerJS provides signaling; game data travels through WebRTC data connections.
export function usePeerRoom({ roomCode, playerId, getPlayer, getSnapshot, onMessage }) {
  const latest = useRef({ getPlayer, getSnapshot, onMessage });
  latest.current = { getPlayer, getSnapshot, onMessage };
  const connections = useRef(new Map());
  const isHostRef = useRef(false);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState('Connecting to room…');
  const [attempt, setAttempt] = useState(0);

  const send = useCallback(
    (payload) => {
      const message = { ...payload, roomCode, senderId: playerId };
      connections.current.forEach((connection) => {
        if (connection.open) connection.send(message);
      });
    },
    [roomCode, playerId],
  );

  useEffect(() => {
    let disposed = false;
    let peer;
    let connectionTimeout;
    const roomConnections = connections.current;
    isHostRef.current = false;
    setIsHost(false);
    setStatus('Connecting to room…');

    function sendSnapshot(connection) {
      const state = latest.current.getSnapshot();
      if (state && connection.open) {
        connection.send({ type: 'ROOM_STATE', state, roomCode, senderId: playerId });
      }
    }

    function register(connection) {
      connection.on('open', () => {
        if (disposed) return connection.close();
        clearTimeout(connectionTimeout);
        roomConnections.set(connection.peer, connection);
        connection.send({
          type: 'HELLO',
          player: latest.current.getPlayer(),
          roomCode,
          senderId: playerId,
        });
        if (isHostRef.current) sendSnapshot(connection);
        else setStatus(`Connected to room ${roomCode}`);
      });
      connection.on('data', (message) => {
        if (disposed || !message || message.roomCode !== roomCode || message.senderId === playerId)
          return;
        if (message.type === 'HELLO') connection.playerId = message.player?.id;
        latest.current.onMessage(message);
        if (isHostRef.current) {
          roomConnections.forEach((other) => {
            if (other !== connection && other.open) other.send(message);
          });
          if (message.type === 'HELLO' || message.type === 'REQUEST_STATE')
            sendSnapshot(connection);
        }
      });
      connection.on('close', () => {
        if (disposed) return;
        roomConnections.delete(connection.peer);
        if (isHostRef.current && connection.playerId) {
          const message = {
            type: 'PLAYER_LEFT',
            playerId: connection.playerId,
            roomCode,
            senderId: playerId,
          };
          latest.current.onMessage(message);
          roomConnections.forEach((other) => {
            if (other.open) other.send(message);
          });
        } else if (!isHostRef.current) {
          setStatus('Host disconnected. Ask them to reopen the room, then reconnect.');
        }
      });
      connection.on('error', () => {
        if (!disposed) setStatus('Connection interrupted. Try reconnecting.');
      });
    }

    function connectAsGuest() {
      peer = new Peer();
      peer.on('open', () => {
        if (disposed) return;
        setStatus(`Joining room ${roomCode}…`);
        register(peer.connect(roomPeerId(roomCode), { reliable: true }));
        connectionTimeout = setTimeout(() => {
          if (!disposed && roomConnections.size === 0)
            setStatus('Could not reach the host. Try reconnecting.');
        }, 12000);
      });
      peer.on('error', () => {
        if (!disposed) setStatus('Could not reach the room. Try reconnecting.');
      });
    }

    peer = new Peer(roomPeerId(roomCode));
    peer.on('open', () => {
      if (disposed) return;
      isHostRef.current = true;
      setIsHost(true);
      setStatus(`Room ${roomCode} is ready`);
    });
    peer.on('connection', register);
    peer.on('error', (error) => {
      if (disposed) return;
      if (error.type === 'unavailable-id') {
        peer.destroy();
        connectAsGuest();
      } else {
        isHostRef.current = true;
        setIsHost(true);
        setStatus('Multiplayer unavailable. You can play solo or reconnect.');
      }
    });

    // Keep guests up to date, including bot moves, elapsed time and the final result.
    const snapshotTimer = setInterval(() => {
      if (isHostRef.current && roomConnections.size) roomConnections.forEach(sendSnapshot);
    }, 1000);

    return () => {
      disposed = true;
      clearInterval(snapshotTimer);
      clearTimeout(connectionTimeout);
      roomConnections.forEach((connection) => connection.close());
      roomConnections.clear();
      peer.destroy();
      isHostRef.current = false;
    };
  }, [roomCode, playerId, attempt]);

  return { send, isHost, isHostRef, status, reconnect: () => setAttempt((value) => value + 1) };
}
