import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import Wrapper from '../components/Wrapper';
import Logo from '../assets/images/logo.png';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import GradientButton from '../components/GradientButton';
import LottieView from 'lottie-react-native';
import Witch from '../assets/animation/witch.json';
import { playSound } from '../helpers/SoundUtility';
import { useIsFocused } from '@react-navigation/native';
import SoundPlayer from 'react-native-sound-player';
import { navigate } from '../helpers/NavigationUtil';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentPositions } from '../redux/reducers/gameSelectors';
import { resetGame, setEntryFee } from '../redux/reducers/gameSlice';
import api from '../helpers/api';
import { Colors } from '../constants/Colors';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon,
  ArrowLeftIcon,
} from 'react-native-heroicons/solid';
import VsCpuModal from '../components/VsCpuModal';
import CoinSelectionModal from '../components/CoinSelectionModal';
import OnlineMatchmakingModal from '../components/OnlineMatchmakingModal';
import Toast from 'react-native-toast-message';
import socketService from '../helpers/socketService';

const AVATARS = {
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon
};

const HomeScreen = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const currentPosition = useSelector(selectCurrentPositions);
  const isFocused = useIsFocused();
  const [vsCpuModalVisible, setVsCpuModalVisible] = useState(false);
  const [coinModalVisible, setCoinModalVisible] = useState(false);
  const [onlineModalVisible, setOnlineModalVisible] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.success ? res.data.user : null;
    },
    enabled: isFocused,
  });


  const updateCoinsMutation = useMutation({
    mutationFn: async (newCoins) => {
      const res = await api.put('/auth/me', { coins: newCoins });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update coins. Please try again.',
      });
    },
  });

  const witchAnim = useRef(new Animated.Value(-deviceWidth)).current;
  const scaleXAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(witchAnim, {
            toValue: deviceWidth * 0.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: -1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(3000),
        Animated.parallel([
          Animated.timing(witchAnim, {
            toValue: deviceWidth * 2,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: -1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(witchAnim, {
            toValue: -deviceWidth * 0.05,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(3000),
        Animated.parallel([
          Animated.timing(witchAnim, {
            toValue: -deviceWidth * 2,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleXAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [witchAnim, scaleXAnim]);

  useEffect(() => {
    if (isFocused) {
      playSound('home');
    }
  }, [isFocused]);

  const renderButton = useCallback(
    (title, onPress) => <GradientButton title={ title } onPress={ onPress } />,
    [],
  );

  const handleStartGameWithCoins = async (entryFee) => {
    // Check if we have user
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Not logged in',
        text2: 'Please login to play.',
      });
      return;
    }

    try {
      // Deduct coins
      await updateCoinsMutation.mutateAsync(user.coins - entryFee);

      setCoinModalVisible(false);
      SoundPlayer.stop();
      dispatch(resetGame());
      dispatch(setEntryFee({ entryFee, prizeMoney: entryFee * 4 })); // 4 players prize logic
      navigate('LudoBoardScreen');
      playSound('game_start');
    } catch (e) {
      // error handled in mutation
    }
  };

  const handleResumePress = useCallback(() => {
    SoundPlayer.stop();
    navigate('LudoBoardScreen');
    playSound('game_start');

  }, []);

  const SelectedIcon = AVATARS[user?.avatar] || UserCircleIcon;

  return (
    <Wrapper style={ styles.mainContainer }>
      {/* Profile and Balance Section */ }
      <View style={ styles.topBar }>
        <View style={ styles.topBarLeft }>
          <TouchableOpacity
            style={ styles.backButton }
            onPress={ () => {
              playSound('ui');
              navigate('LandingScreen');
            } }
            activeOpacity={ 0.7 }
          >
            <ArrowLeftIcon size={ 22 } color="#FBBF24" />
          </TouchableOpacity>
          {/* <Pressable
            style={ styles.profileButton }
            onPress={ () => navigate('ProfileScreen') }
          >
            <SelectedIcon size={ 40 } color={ Colors.yellow || '#FBBF24' } />
          </Pressable> */}
        </View>
        { user && (
          <View style={ styles.balanceBadge }>
            <Text style={ styles.balanceIcon }>💰</Text>
            <Text style={ styles.balanceText }>{ user.coins || 0 }</Text>
          </View>
        ) }
      </View>

      <View style={ styles.imgContainer }>
        <Image source={ Logo } style={ styles.img } />
      </View>

      { currentPosition.length !== 0 &&
        renderButton('RESUME', handleResumePress) }
      { renderButton('NEW GAME', () => {
        playSound('ui');
        setCoinModalVisible(true);
      }) }
      { renderButton('VS CPU', () => {
        playSound('ui');
        setVsCpuModalVisible(true);
      }) }
      { renderButton('PLAY ONLINE', () => {
        playSound('ui');
        setOnlineModalVisible(true);
      }) }

      <VsCpuModal
        visible={ vsCpuModalVisible }
        onPressHide={ () => setVsCpuModalVisible(false) }
      />

      <CoinSelectionModal
        visible={ coinModalVisible }
        onPressHide={ () => setCoinModalVisible(false) }
        onPlay={ handleStartGameWithCoins }
        userBalance={ user?.coins || 0 }
        isLoading={ updateCoinsMutation.isPending }
      />

      <OnlineMatchmakingModal
        visible={ onlineModalVisible }
        user={ user }
        userBalance={ user?.coins || 0 }
        onPressHide={ () => setOnlineModalVisible(false) }
        onMatchFound={ async (roomState) => {
          // Extract entryFee passed from modal
          const fee = roomState.entryFee || 0;
          const playerCount = roomState.players?.length || 2;
          const prize = fee * playerCount;

          // Deduct coins before navigating
          if (fee > 0 && user) {
            try {
              await updateCoinsMutation.mutateAsync(user.coins - fee);
            } catch (e) {
              // Error handled in mutation — don't navigate if deduction failed
              return;
            }
          }

          setOnlineModalVisible(false);
          SoundPlayer.stop();
          dispatch(resetGame());
          dispatch(setEntryFee({ entryFee: fee, prizeMoney: prize }));
          dispatch({ type: 'game/setGameMode', payload: 'ONLINE_MULTIPLAYER' });
          dispatch({ type: 'game/setRoomId', payload: roomState.roomId });

          const activeList = roomState.activePlayersList || [1, 2, 3, 4];
          dispatch({ type: 'game/setActivePlayers', payload: { activePlayers: activeList.length, activePlayersList: activeList } });

          // we need to know which player number we are
          const myPlayerInfo = roomState.players.find(p => p.id === socketService.socket?.id);
          dispatch({ type: 'game/setLocalPlayerNo', payload: myPlayerInfo ? myPlayerInfo.playerNo : 1 });

          navigate('LudoBoardScreen');
          playSound('game_start');
        } }
      />

      <Animated.View
        style={ [
          styles.witchContainer,
          {
            transform: [{ translateX: witchAnim }, { scaleX: scaleXAnim }],
          },
        ] }
      >
        <Pressable
          onPress={ () => {
            const random = Math.floor(Math.random() * 3) + 1;
            playSound(`girl${ random }`);
          } }
        >
          <LottieView
            hardwareAccelerationAndroid
            source={ Witch }
            autoPlay
            speed={ 1 }
            style={ styles.witch }
          />
        </Pressable>
      </Animated.View>
      <Text style={ styles.artist }>Designed by - The Priyanka ™</Text>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    justifyContent: 'flex-start',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  profileButton: {
    padding: 5,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  balanceIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  balanceText: {
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 16,
  },
  imgContainer: {
    width: deviceWidth * 0.6,
    height: deviceHeight * 0.12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
    marginTop: 100, // pushed down to make room for top bar
    alignSelf: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  artist: {
    position: 'absolute',
    bottom: 40,
    fontWeight: '800',
    opacity: 0.5,
    color: '#fff',
    fontStyle: 'italic',
  },
  witchContainer: {
    position: 'absolute',
    top: '80%',
    left: '24%',
  },
  witch: {
    width: 240,
    height: 240,
    transform: [{ rotate: '25deg' }],
  },
});

export default HomeScreen;
