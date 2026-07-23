import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetGame, setEntryFee, setActivePlayers, setGameMode, setRoomId, setLocalPlayerNo } from '../redux/reducers/gameSlice';
import { playSound } from '../helpers/SoundUtility';
import { goBack, navigate, resetAndNavigate } from '../helpers/NavigationUtil';
import LinearGradient from 'react-native-linear-gradient';
import GradientButton from './GradientButton';
import socketService from '../helpers/socketService';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../helpers/api';

const MenuModel = ({ visible, onPressHide, gameMode, roomId, entryFee = 0, activePlayersList = [1, 2, 3, 4], localPlayerNo = 1 }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isOnline = gameMode === 'ONLINE_MULTIPLAYER';

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.success ? res.data.user : null;
    },
    enabled: isOnline && entryFee > 0,
  });

  const updateCoinsMutation = useMutation({
    mutationFn: async (newCoins) => {
      const res = await api.put('/auth/me', { coins: newCoins });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
    },
  });

  // Forfeit the online game — opponent wins, coins returned/lost
  const forfeitOnlineGame = useCallback(async () => {
    if (isOnline && roomId) {
      socketService.forfeitGame(roomId);

      // Deduct coins if the user hasn't already lost them at game start
      // (coins were already deducted at match start, so nothing extra to do here)
      Toast.show({
        type: 'info',
        text1: 'You Forfeited',
        text2: 'Opponent wins!',
        position: 'top',
      });
    }
    dispatch(resetGame());
  }, [isOnline, roomId, dispatch]);

  // NEW GAME in online mode: forfeit + rematch with same bet & player count
  const handleOnlineNewGame = useCallback(async () => {
    playSound('ui');

    if (!user) {
      Toast.show({ type: 'error', text1: 'Not logged in', position: 'top' });
      return;
    }

    const balance = user.coins || 0;
    if (entryFee > 0 && balance < entryFee) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient Coins',
        text2: `You need 💰${ entryFee.toLocaleString() } to rematch.`,
        position: 'top',
      });
      return;
    }

    // Forfeit current game
    if (roomId) socketService.forfeitGame(roomId);

    try {
      // Deduct entry fee for new game
      if (entryFee > 0) {
        await updateCoinsMutation.mutateAsync(balance - entryFee);
      }

      // Reset game state and keep same entry fee & player config
      dispatch(resetGame());
      dispatch(setEntryFee({
        entryFee,
        prizeMoney: entryFee * activePlayersList.length,
      }));
      dispatch(setGameMode('ONLINE_MULTIPLAYER'));

      onPressHide();

      // Start matchmaking again with same settings
      const userData = {
        name: user.username || 'Guest',
        avatar: user.avatar || 'UserCircleIcon',
      };
      socketService.joinMatchmaking({
        playerCount: activePlayersList.length,
        entryFee,
        userData,
      });

      // Navigate back to HomeScreen matchmaking modal
      Toast.show({
        type: 'info',
        text1: 'Finding a new match...',
        text2: `Entry fee: 💰${ entryFee.toLocaleString() }`,
        position: 'top',
      });

      // Dispatch to listen for new match on LudoBoardScreen still — or navigate home to show modal
      // Here we go back to home so user sees the matching UI
      resetAndNavigate('HomeScreen');

    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to start rematch', position: 'top' });
    }
  }, [user, entryFee, roomId, activePlayersList, dispatch, onPressHide, updateCoinsMutation]);

  // HOME in online mode: forfeit + go home
  const handleOnlineHome = useCallback(async () => {
    playSound('ui');
    if (roomId) socketService.forfeitGame(roomId);
    dispatch(resetGame());
    resetAndNavigate('HomeScreen');
  }, [roomId, dispatch]);

  // Offline NEW GAME
  const handleNewGame = useCallback(() => {
    dispatch(resetGame());
    playSound('game_start');
    onPressHide();
  }, [dispatch, onPressHide]);

  // Offline HOME
  const handleHome = useCallback(() => {
    dispatch(resetGame());
    resetAndNavigate('HomeScreen');
  }, [dispatch]);

  const playerCount = activePlayersList.length;
  const prize = entryFee * playerCount;

  return (
    <Modal
      style={ styles.bottomModalView }
      isVisible={ visible }
      backdropColor="black"
      backdropOpacity={ 0.85 }
      onBackdropPress={ onPressHide }
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackButtonPress={ onPressHide }
    >
      <View style={ styles.modalContainer }>
        <LinearGradient
          colors={ ['#0f0c29', '#302b63', '#24243e'] }
          style={ styles.gradientContainer }
        >
          { isOnline && (
            <View style={ styles.onlineBadge }>
              <Text style={ styles.onlineBadgeText }>🌐 Online Game</Text>
              { entryFee > 0 && (
                <Text style={ styles.onlineBetText }>
                  Entry: 💰{ entryFee.toLocaleString() }  ·  Prize: 💰{ prize.toLocaleString() }
                </Text>
              ) }
            </View>
          ) }

          <View style={ styles.subView }>
            <GradientButton title={ 'RESUME' } onPress={ onPressHide } />

            { isOnline ? (
              <>
                {/* NEW GAME for online: forfeit + rematch with same fee */ }
                {/* <GradientButton
                  title={ entryFee > 0 ? `REMATCH (💰${entryFee.toLocaleString()})` : 'REMATCH' }
                  onPress={ handleOnlineNewGame }
                /> */}
                {/* HOME for online: forfeit + go home */ }
                <GradientButton title={ 'FORFEIT & HOME' } onPress={ handleOnlineHome } />
              </>
            ) : (
              <>
                <GradientButton title={ 'NEW GAME' } onPress={ handleNewGame } />
                <GradientButton title={ 'HOME' } onPress={ handleHome } />
              </>
            ) }
          </View>

          { isOnline && (
            <Text style={ styles.forfeitWarning }>
              ⚠️ Leaving gives your opponent the win
            </Text>
          ) }
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomModalView: {
    justifyContent: 'center',
    width: '95%',
    alignSelf: 'center',
  },
  gradientContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '96%',
    borderWidth: 2,
    borderColor: 'gold',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingBottom: 16,
  },
  subView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    alignSelf: 'center',
  },
  modalContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '90%',
  },
  onlineBadgeText: {
    color: '#7EC8E3',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  onlineBetText: {
    color: '#FFC107',
    fontSize: 13,
    fontWeight: '600',
  },
  forfeitWarning: {
    color: 'rgba(255,100,100,0.85)',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default MenuModel;
