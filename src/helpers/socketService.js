import { io } from 'socket.io-client';
import { Platform } from 'react-native';

// Use the local backend URL for testing
const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinMatchmaking(data) {
    if (this.socket) {
      this.socket.emit('join_matchmaking', data);
    }
  }

  leaveMatchmaking() {
    if (this.socket) {
      this.socket.emit('leave_matchmaking');
    }
  }

  createPrivateRoom(data, callback) {
    if (this.socket) {
      this.socket.emit('create_room', data, callback);
    }
  }

  joinPrivateRoom(roomId, callback) {
    if (this.socket) {
      this.socket.emit('join_room', roomId, callback);
    }
  }

  emitGameAction(actionType, payload, roomId) {
    if (this.socket) {
      this.socket.emit('game_action', { actionType, payload, roomId });
    }
  }

  onMatchFound(callback) {
    if (this.socket) {
      this.socket.on('match_found', callback);
    }
  }

  onGameAction(callback) {
    if (this.socket) {
      this.socket.on('game_action', callback);
    }
  }

  onPlayerDisconnected(callback) {
    if (this.socket) {
      this.socket.on('player_disconnected', callback);
    }
  }

  offGameAction() {
    if (this.socket) {
      this.socket.off('game_action');
    }
  }
}

export default new SocketService();
