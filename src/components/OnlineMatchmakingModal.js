import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Modal from 'react-native-modal';
import { playSound } from '../helpers/SoundUtility';
import socketService from '../helpers/socketService';
import Toast from 'react-native-toast-message';

const OnlineMatchmakingModal = ({ visible, onPressHide, onMatchFound }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [mode, setMode] = useState('menu'); // 'menu' | 'quick' | 'private'

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
      setMode('menu');
      setIsSearching(false);
      setCreatedRoomId('');
      socketService.connect();

      socketService.onMatchFound((roomState) => {
        setIsSearching(false);
        Toast.show({ type: 'success', text1: 'Match Found!', position: 'top' });
        onMatchFound(roomState);
      });

    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible, onMatchFound, fadeAnim, slideAnim]);

  const handleQuickMatch = useCallback(() => {
    playSound('ui');
    setMode('quick');
    setIsSearching(true);
    socketService.joinMatchmaking({ name: 'Player' });
  }, []);

  const handleCreatePrivate = useCallback(() => {
    playSound('ui');
    setIsSearching(true);
    socketService.createPrivateRoom({ name: 'Player' }, (res) => {
      if (res.success) {
        setCreatedRoomId(res.roomId);
        Toast.show({ type: 'success', text1: 'Room Created!', position: 'top' });
      } else {
        setIsSearching(false);
        Toast.show({ type: 'error', text1: 'Failed to create room', position: 'top' });
      }
    });
  }, []);

  const handleJoinPrivate = useCallback(() => {
    playSound('ui');
    if (!roomIdInput) return;
    setIsSearching(true);
    socketService.joinPrivateRoom(roomIdInput, (res) => {
      setIsSearching(false);
      if (!res.success) {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message, position: 'top' });
      }
    });
  }, [roomIdInput]);

  return (
    <Modal
      style={styles.modalWrapper}
      isVisible={visible}
      backdropColor="#000"
      backdropOpacity={0.75}
      onBackdropPress={onPressHide}
      animationIn="fadeIn"
      animationOut="fadeOut"
      onBackButtonPress={onPressHide}
    >
      <Animated.View style={[styles.modalContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Online Multiplayer</Text>
        </View>

        {mode === 'menu' && (
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuButton} onPress={handleQuickMatch}>
              <Text style={styles.menuButtonText}>Quick Match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuButton, { backgroundColor: '#4CAF50' }]} onPress={() => setMode('private')}>
              <Text style={styles.menuButtonText}>Play with Friends</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'quick' && (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color="#E8524A" />
            <Text style={styles.searchingText}>Searching for opponent...</Text>
          </View>
        )}

        {mode === 'private' && (
          <View style={styles.privateContainer}>
            {isSearching ? (
                <View style={styles.searchingContainer}>
                  {createdRoomId ? (
                    <>
                      <Text style={styles.roomCodeLabel}>Your Room Code:</Text>
                      <View style={styles.roomCodeContainer}>
                        <Text style={styles.roomCodeText}>{createdRoomId}</Text>
                      </View>
                      <ActivityIndicator size="large" color="#E8524A" style={{ marginTop: 20 }} />
                      <Text style={styles.searchingText}>Waiting for friend to join...</Text>
                    </>
                  ) : (
                    <>
                      <ActivityIndicator size="large" color="#E8524A" />
                      <Text style={styles.searchingText}>Creating room...</Text>
                    </>
                  )}
                </View>
            ) : (
                <>
                  <TouchableOpacity style={styles.menuButton} onPress={handleCreatePrivate}>
                    <Text style={styles.menuButtonText}>Create Room</Text>
                  </TouchableOpacity>
                  <Text style={styles.orText}>- OR -</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Room Code"
                    placeholderTextColor="#888"
                    value={roomIdInput}
                    onChangeText={setRoomIdInput}
                  />
                  <TouchableOpacity style={[styles.menuButton, { backgroundColor: '#4CAF50' }]} onPress={handleJoinPrivate}>
                    <Text style={styles.menuButtonText}>Join Room</Text>
                  </TouchableOpacity>
                </>
            )}
          </View>
        )}

      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    alignSelf: 'center',
    width: '92%',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  menuContainer: {
    gap: 16,
  },
  menuButton: {
    backgroundColor: '#E8524A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  searchingText: {
    color: '#FFF',
    fontSize: 16,
  },
  privateContainer: {
    gap: 16,
  },
  orText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginVertical: 8,
  },
  input: {
    backgroundColor: '#242438',
    color: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3E3E5A',
  },
  roomCodeLabel: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.8,
  },
  roomCodeContainer: {
    backgroundColor: '#242438',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginVertical: 10,
  },
  roomCodeText: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  }
});

export default OnlineMatchmakingModal;
