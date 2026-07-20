import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import { SOCKET_URL_ANDROID, SOCKET_URL_IOS } from '@env';

const SOCKET_URL = Platform.OS === 'android' ? SOCKET_URL_ANDROID : SOCKET_URL_IOS;

class ChessSocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(`${SOCKET_URL}/chess`, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Chess Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Chess Socket disconnected');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  createPrivateRoom(data, callback) {
    if (this.socket) {
      this.socket.emit('create_room', data, callback);
    }
  }

  joinPrivateRoom(data, callback) {
    if (this.socket) {
      this.socket.emit('join_room', data, callback);
    }
  }

  emitGameAction(actionType, payload, roomId) {
    if (this.socket) {
      this.socket.emit('game_action', { actionType, payload, roomId });
    }
  }

  forfeitGame(roomId) {
    if (this.socket) {
      this.socket.emit('forfeit_game', { roomId });
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

  onPlayerForfeited(callback) {
    if (this.socket) {
      this.socket.on('player_forfeited', callback);
    }
  }

  offMatchFound() {
    if (this.socket) {
      this.socket.off('match_found');
    }
  }

  offGameAction() {
    if (this.socket) {
      this.socket.off('game_action');
    }
  }

  offPlayerDisconnected() {
    if (this.socket) {
      this.socket.off('player_disconnected');
    }
  }

  offPlayerForfeited() {
    if (this.socket) {
      this.socket.off('player_forfeited');
    }
  }
}

export default new ChessSocketService();
