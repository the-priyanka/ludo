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
  Share,
} from 'react-native';
import Modal from 'react-native-modal';
import { playSound } from '../helpers/SoundUtility';
import chessSocketService from '../helpers/chessSocketService';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../helpers/api';

// Profile Box Component
const PlayerProfileBox = ({ player, isSearching }) => {
  return (
    <View style={ styles.profileBox }>
      { player ? (
        <>
          <View style={ styles.avatarCircle }>
            <Text style={ styles.avatarText }>{ player.userData?.name ? player.userData.name.charAt(0).toUpperCase() : 'P' }</Text>
          </View>
          <Text style={ styles.playerName } numberOfLines={ 1 }>{ player.userData?.name || 'Player' }</Text>
        </>
      ) : isSearching ? (
        <>
          <ActivityIndicator size="small" color="#D4B483" style={ styles.spinner } />
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

const COIN_OPTIONS = [500, 1000, 2000, 5000, 10000];

const ChessRoomModal = ({ visible, onPressHide, onMatchFound }) => {
  const [mode, setMode] = useState('menu'); // 'menu' | 'select_bet' | 'searching' | 'private'
  const [selectedBet, setSelectedBet] = useState(500);
  const entryFeeRef = useRef(0);
  const [matchedPlayers, setMatchedPlayers] = useState([]);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [actionType, setActionType] = useState('create'); // 'create', 'join' or 'quick_match'

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.success ? res.data.user : null;
    },
    enabled: visible,
  });

  const userBalance = user?.coins || 0;

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
      setSelectedBet(500);
      setRoomIdInput('');
      setMatchedPlayers([]);
      entryFeeRef.current = 0;
      chessSocketService.connect();

      chessSocketService.offMatchFound();
      chessSocketService.onMatchFound((roomState) => {
        setIsSearching(false);
        Toast.show({ type: 'success', text1: 'Match Found!', position: 'top' });

        setMatchedPlayers(roomState.players);

        setTimeout(() => {
          onMatchFound({ ...roomState, entryFee: entryFeeRef.current || roomState.entryFee });
        }, 1500);
      });
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      chessSocketService.offMatchFound();
    }
  }, [visible, onMatchFound, slideAnim, fadeAnim]);

  const handleQuickMatch = useCallback(() => {
    playSound('ui');
    setActionType('quick_match');
    setMode('select_bet');
  }, []);

  const handleSelectCreate = () => {
    playSound('ui');
    setActionType('create');
    setMode('select_bet');
  };

  const handleSelectJoin = () => {
    playSound('ui');
    setActionType('join');
    setMode('private');
  };

  const handleStartSearch = useCallback((fee) => {
    playSound('ui');
    entryFeeRef.current = fee;
    setMode('searching');
    setIsSearching(true);

    const userData = {
      name: user?.username || 'Guest',
      avatar: user?.avatar || 'UserCircleIcon',
    };

    setMatchedPlayers([{ id: chessSocketService.socket?.id || 'me', userData }]);

    chessSocketService.joinMatchmaking({ entryFee: fee, userData });
  }, [user]);

  const handleCancelSearch = useCallback(() => {
    playSound('ui');
    chessSocketService.leaveMatchmaking();
    setMode('select_bet');
    setIsSearching(false);
    setMatchedPlayers([]);
  }, []);

  const handleCreateRoom = useCallback((fee) => {
    playSound('ui');
    entryFeeRef.current = fee;
    setIsSearching(true);
    setMode('private');

    const userData = {
      name: user?.username || 'Guest',
      avatar: user?.avatar || 'UserCircleIcon',
    };

    chessSocketService.createPrivateRoom({ entryFee: fee, userData }, (res) => {
      if (res.success) {
        setCreatedRoomId(res.roomId);
        Toast.show({ type: 'success', text1: 'Room Created!', position: 'top' });
      } else {
        setIsSearching(false);
        Toast.show({ type: 'error', text1: 'Failed to create room', position: 'top' });
      }
    });
  }, [user]);

  const handleJoinRoom = useCallback(() => {
    playSound('ui');
    if (!roomIdInput) return;

    setIsSearching(true);
    const userData = {
      name: user?.username || 'Guest',
      avatar: user?.avatar || 'UserCircleIcon',
    };

    chessSocketService.joinPrivateRoom({ roomId: roomIdInput, userData }, (res) => {
      if (!res.success) {
        setIsSearching(false);
        Toast.show({ type: 'error', text1: 'Error', text2: res.message, position: 'top' });
      } else {
        const roomFee = res.roomState?.entryFee || 0;
        if (userBalance < roomFee) {
          setIsSearching(false);
          Toast.show({ type: 'error', text1: 'Insufficient Coins', text2: `Need ${ roomFee } coins to join`, position: 'top' });
          chessSocketService.forfeitGame(roomIdInput);
        }
      }
    });
  }, [roomIdInput, user, userBalance]);

  const handleShareRoomCode = useCallback(async () => {
    playSound('ui');
    try {
      await Share.share({
        message: `Let's play Chess! Join my private room using this code: ${ createdRoomId }`,
      });
    } catch (error) {
      console.log('Error sharing room code:', error);
    }
  }, [createdRoomId]);

  const renderProfileBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 2; i++) {
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
      <View style={ styles.profilesContainer2p }>
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
            { mode === 'searching' ? 'Matchmaking' : 'Play Online' }
          </Text>
        </View>

        { mode === 'menu' && (
          <View style={ styles.menuContainer }>
            <TouchableOpacity style={ styles.menuButton } onPress={ handleQuickMatch }>
              <Text style={ styles.menuButtonText }>Quick Match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ [styles.menuButton, { backgroundColor: '#4CAF50' }] } onPress={ handleSelectCreate }>
              <Text style={ styles.menuButtonText }>Create Private Room</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ [styles.menuButton, { backgroundColor: '#2196F3' }] } onPress={ handleSelectJoin }>
              <Text style={ styles.menuButtonText }>Join Private Room</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ styles.backButton } onPress={ onPressHide }>
              <Text style={ styles.backButtonText }>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) }

        { mode === 'select_bet' && (
          <View style={ styles.betContainer }>
            <View style={ styles.balanceRow }>
              <Text style={ styles.balanceLabel }>💰 Your Balance</Text>
              <Text style={ styles.balanceAmount }>{ userBalance.toLocaleString() }</Text>
            </View>

            <Text style={ styles.sectionDesc }>Choose entry fee for the room</Text>

            <View style={ styles.coinGrid }>
              { COIN_OPTIONS.map((coin) => {
                const isSelected = selectedBet === coin;
                const canAfford = userBalance >= coin;
                return (
                  <TouchableOpacity
                    key={ coin }
                    activeOpacity={ 0.8 }
                    onPress={ () => {
                      playSound('ui');
                      if (canAfford) setSelectedBet(coin);
                    } }
                    style={ [
                      styles.coinOption,
                      isSelected && styles.coinOptionSelected,
                      !canAfford && styles.coinOptionDisabled,
                    ] }
                  >
                    <Text style={ styles.coinOptionIcon }>💰</Text>
                    <Text style={ [styles.coinOptionText, isSelected && styles.coinOptionTextSelected] }>
                      { coin.toLocaleString() }
                    </Text>
                    { !canAfford && <Text style={ styles.insufficientLabel }>Low</Text> }
                  </TouchableOpacity>
                );
              }) }
            </View>

            <View style={ styles.prizePreviewRow }>
              <Text style={ styles.prizePreviewLabel }>🏆 Total Prize Pool</Text>
              <Text style={ styles.prizePreviewAmount }>💰 { (selectedBet * 2).toLocaleString() }</Text>
            </View>

            <TouchableOpacity
              style={ [styles.menuButton, userBalance < selectedBet && styles.menuButtonDisabled] }
              onPress={ () => {
                if (actionType === 'quick_match') {
                  handleStartSearch(selectedBet);
                } else {
                  handleCreateRoom(selectedBet);
                }
              } }
              disabled={ userBalance < selectedBet }
            >
              <Text style={ styles.menuButtonText }>
                { userBalance < selectedBet ? 'Insufficient Coins' : (actionType === 'quick_match' ? 'Find Match' : 'Create Room') }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={ styles.backButton } onPress={ () => setMode('menu') }>
              <Text style={ styles.backButtonText }>Back</Text>
            </TouchableOpacity>
          </View>
        ) }

        { mode === 'searching' && (
          <View style={ styles.searchingContainer }>
            <View style={ styles.searchBetStrip }>
              <Text style={ styles.searchBetStripText }>Entry: 💰 { entryFeeRef.current.toLocaleString() }</Text>
              <View style={ styles.searchBetDivider } />
              <Text style={ styles.searchBetStripPrize }>Prize: 💰 { (entryFeeRef.current * 2).toLocaleString() }</Text>
            </View>

            { renderProfileBoxes() }

            { matchedPlayers.length < 2 ? (
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
                    <TouchableOpacity style={ styles.shareButton } onPress={ handleShareRoomCode }>
                      <Text style={ styles.shareButtonText }>Share Code</Text>
                    </TouchableOpacity>
                    <ActivityIndicator size="large" color="#D4B483" style={ { marginTop: 20 } } />
                    <Text style={ styles.searchingText }>Waiting for friend to join...</Text>
                  </>
                ) : (
                  <>
                    <ActivityIndicator size="large" color="#D4B483" />
                    <Text style={ styles.searchingText }>Joining room...</Text>
                  </>
                ) }
              </View>
            ) : (
              <>
                <TextInput
                  style={ styles.input }
                  placeholder="Enter Room Code"
                  placeholderTextColor="#888"
                  value={ roomIdInput }
                  onChangeText={ setRoomIdInput }
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={ [styles.menuButton, { backgroundColor: '#4CAF50' }] } onPress={ handleJoinRoom }>
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
    backgroundColor: '#0F0A1E',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    width: '100%',
    borderWidth: 2,
    borderColor: '#D4B483',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D4B483',
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
    backgroundColor: '#D4B483',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  menuButtonDisabled: {
    opacity: 0.5,
  },
  menuButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F0A1E',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: 'rgba(212,180,131,0.6)',
    fontWeight: '600',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 16,
  },
  searchingText: {
    color: '#D4B483',
    fontSize: 16,
  },
  privateContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1A1A2E',
    color: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D4B483',
  },
  roomCodeLabel: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.8,
  },
  roomCodeContainer: {
    backgroundColor: '#1A1A2E',
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
  },
  shareButton: {
    backgroundColor: '#D4B483',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareButtonText: {
    color: '#0F0A1E',
    fontSize: 16,
    fontWeight: '700',
  },
  betContainer: {
    gap: 14,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D4B483',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#D4B483',
    fontSize: 16,
    fontWeight: '800',
  },
  coinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  coinOption: {
    width: '28%',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coinOptionSelected: {
    borderColor: '#D4B483',
    backgroundColor: '#2A253C',
  },
  coinOptionDisabled: {
    opacity: 0.35,
  },
  coinOptionIcon: {
    fontSize: 18,
    marginBottom: 3,
  },
  coinOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  coinOptionTextSelected: {
    color: '#FFFFFF',
  },
  insufficientLabel: {
    fontSize: 9,
    color: '#E8524A',
    fontWeight: '700',
    marginTop: 2,
  },
  prizePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A2E1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  prizePreviewLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  prizePreviewAmount: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '800',
  },
  profilesContainer2p: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  profileBox: {
    width: 100,
    height: 120,
    backgroundColor: '#1E190A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D4B483',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4B483',
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
    color: '#0F0A1E',
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
  matchReadyText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2A253C',
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  searchBetStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D4B483',
  },
  searchBetStripText: {
    color: '#D4B483',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBetDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchBetStripPrize: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ChessRoomModal;
