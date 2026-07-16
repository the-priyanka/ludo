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

// Profile Box Component
const PlayerProfileBox = ({ player, isSearching }) => {
  return (
    <View style={ styles.profileBox }>
      { player ? (
        <>
          <View style={ styles.avatarCircle }>
            {/* Use initials or avatar here, for now placeholder */ }
            <Text style={ styles.avatarText }>{ player.userData?.name ? player.userData.name.charAt(0).toUpperCase() : 'P' }</Text>
          </View>
          <Text style={ styles.playerName } numberOfLines={ 1 }>{ player.userData?.name || 'Player' }</Text>
        </>
      ) : isSearching ? (
        <>
          <ActivityIndicator size="small" color="#E8524A" style={ styles.spinner } />
          <Text style={ styles.searchingTextSmall }>Searching...</Text>
        </>
      ) : (
        <>
          <View style={ styles.emptyAvatarCircle } />
          <Text style={ styles.emptyText }>Waiting...</Text>
        </>
      ) }
    </View>
  );
};

const OnlineMatchmakingModal = ({ visible, user, onPressHide, onMatchFound }) => {
  const [mode, setMode] = useState('menu'); // 'menu' | 'select_players' | 'searching' | 'private'
  const [playerCount, setPlayerCount] = useState(2); // 2 or 4
  const [matchedPlayers, setMatchedPlayers] = useState([]); // players in room
  const [roomIdInput, setRoomIdInput] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
      setMatchedPlayers([]);
      socketService.connect();

      // Clean up any old listener before registering a new one
      socketService.offMatchFound();
      socketService.onMatchFound((roomState) => {
        setIsSearching(false);
        Toast.show({ type: 'success', text1: 'Match Found!', position: 'top' });

        // Update UI with matched players
        setMatchedPlayers(roomState.players);

        // Wait 2 seconds before starting the game
        setTimeout(() => {
          onMatchFound(roomState);
        }, 2000);
      });

    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      // Remove listener when modal closes
      socketService.offMatchFound();
    }
  }, [visible, onMatchFound, fadeAnim, slideAnim]);

  const handleQuickMatch = useCallback(() => {
    playSound('ui');
    setMode('select_players');
  }, []);

  const handleStartSearch = useCallback((selectedCount) => {
    playSound('ui');
    setPlayerCount(selectedCount);
    setMode('searching');
    setIsSearching(true);

    const userData = {
      name: user?.username || 'Guest',
      avatar: user?.avatar || 'UserCircleIcon',
    };

    // Set our own player immediately in the UI
    setMatchedPlayers([{ id: socketService.socket?.id || 'me', userData }]);

    socketService.joinMatchmaking({ playerCount: selectedCount, userData });
  }, [user]);

  const handleCancelSearch = useCallback(() => {
    playSound('ui');
    socketService.leaveMatchmaking();
    setMode('select_players');
    setIsSearching(false);
    setMatchedPlayers([]);
  }, []);

  const handleCreatePrivate = useCallback(() => {
    playSound('ui');
    setIsSearching(true);
    socketService.createPrivateRoom({ name: user?.username || 'Player' }, (res) => {
      if (res.success) {
        setCreatedRoomId(res.roomId);
        Toast.show({ type: 'success', text1: 'Room Created!', position: 'top' });
      } else {
        setIsSearching(false);
        Toast.show({ type: 'error', text1: 'Failed to create room', position: 'top' });
      }
    });
  }, [user]);

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

  const renderProfileBoxes = () => {
    const boxes = [];
    for (let i = 0; i < playerCount; i++) {
      const player = matchedPlayers[i];
      boxes.push(
        <PlayerProfileBox
          key={ i }
          player={ player }
          isSearching={ isSearching && !player }
        />
      );
    }

    return (
      <View style={ playerCount === 2 ? styles.profilesContainer2p : styles.profilesContainer4p }>
        { boxes }
      </View>
    );
  };

  return (
    <Modal
      style={ styles.modalWrapper }
      isVisible={ visible }
      backdropColor="#000"
      backdropOpacity={ 0.75 }
      onBackdropPress={ () => {
        if (mode === 'searching') {
          handleCancelSearch();
        }
        onPressHide();
      } }
      animationIn="fadeIn"
      animationOut="fadeOut"
      onBackButtonPress={ onPressHide }
    >
      <Animated.View style={ [styles.modalContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
        <View style={ styles.header }>
          <Text style={ styles.title }>
            { mode === 'select_players' ? 'Select Mode' :
              mode === 'searching' ? 'Matchmaking' :
                'Online Multiplayer' }
          </Text>
        </View>

        { mode === 'menu' && (
          <View style={ styles.menuContainer }>
            <TouchableOpacity style={ styles.menuButton } onPress={ handleQuickMatch }>
              <Text style={ styles.menuButtonText }>Quick Match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ [styles.menuButton, { backgroundColor: '#4CAF50' }] } onPress={ () => setMode('private') }>
              <Text style={ styles.menuButtonText }>Play with Friends</Text>
            </TouchableOpacity>
          </View>
        ) }

        { mode === 'select_players' && (
          <View style={ styles.menuContainer }>
            <Text style={ styles.sectionDesc }>Pick how many players are on the board</Text>
            <TouchableOpacity style={ styles.menuButton } onPress={ () => handleStartSearch(2) }>
              <Text style={ styles.menuButtonText }>2 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ [styles.menuButton, { backgroundColor: '#2196F3' }] } onPress={ () => handleStartSearch(4) }>
              <Text style={ styles.menuButtonText }>4 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ styles.backButton } onPress={ () => setMode('menu') }>
              <Text style={ styles.backButtonText }>Back</Text>
            </TouchableOpacity>
          </View>
        ) }

        { mode === 'searching' && (
          <View style={ styles.searchingContainer }>
            { renderProfileBoxes() }

            { matchedPlayers.length < playerCount ? (
              <TouchableOpacity style={ styles.cancelButton } onPress={ handleCancelSearch }>
                <Text style={ styles.cancelButtonText }>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <Text style={ styles.matchReadyText }>Match Ready! Starting...</Text>
            ) }
          </View>
        ) }

        { mode === 'private' && (
          <View style={ styles.privateContainer }>
            { isSearching ? (
              <View style={ styles.searchingContainer }>
                { createdRoomId ? (
                  <>
                    <Text style={ styles.roomCodeLabel }>Your Room Code:</Text>
                    <View style={ styles.roomCodeContainer }>
                      <Text style={ styles.roomCodeText }>{ createdRoomId }</Text>
                    </View>
                    <ActivityIndicator size="large" color="#E8524A" style={ { marginTop: 20 } } />
                    <Text style={ styles.searchingText }>Waiting for friend to join...</Text>
                  </>
                ) : (
                  <>
                    <ActivityIndicator size="large" color="#E8524A" />
                    <Text style={ styles.searchingText }>Creating room...</Text>
                  </>
                ) }
              </View>
            ) : (
              <>
                <TouchableOpacity style={ styles.menuButton } onPress={ handleCreatePrivate }>
                  <Text style={ styles.menuButtonText }>Create Room</Text>
                </TouchableOpacity>
                <Text style={ styles.orText }>- OR -</Text>
                <TextInput
                  style={ styles.input }
                  placeholder="Enter Room Code"
                  placeholderTextColor="#888"
                  value={ roomIdInput }
                  onChangeText={ setRoomIdInput }
                />
                <TouchableOpacity style={ [styles.menuButton, { backgroundColor: '#4CAF50' }] } onPress={ handleJoinPrivate }>
                  <Text style={ styles.menuButtonText }>Join Room</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ styles.backButton } onPress={ () => setMode('menu') }>
                  <Text style={ styles.backButtonText }>Back</Text>
                </TouchableOpacity>
              </>
            ) }
          </View>
        ) }

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
  sectionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
    textAlign: 'center',
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
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 16,
  },
  profilesContainer2p: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  profilesContainer4p: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    marginBottom: 20,
  },
  profileBox: {
    width: 100,
    height: 120,
    backgroundColor: '#2E2E4A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3E3E5A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8524A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  spinner: {
    marginBottom: 10,
  },
  searchingTextSmall: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  searchingText: {
    color: '#FFF',
    fontSize: 16,
  },
  matchReadyText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3E3E5A',
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
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
