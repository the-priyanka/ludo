import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Animated,
  Pressable,
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
import { resetGame } from '../redux/reducers/gameSlice';
import api from '../helpers/api';
import { Colors } from '../constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { 
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon 
} from 'react-native-heroicons/solid';

const AVATARS = {
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon
};

const HomeScreen = () => {
  const dispatch = useDispatch();
  const currentPosition = useSelector(selectCurrentPositions);
  const isFocused = useIsFocused();
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.success ? res.data.user : null;
    },
    enabled: isFocused,
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
    (title, onPress) => <GradientButton title={title} onPress={onPress} />,
    [],
  );

  const startGame = async (isNew = false) => {
    SoundPlayer.stop();
    if (isNew) {
      dispatch(resetGame());
    }
    navigate('LudoBoardScreen');
    playSound('game_start');
  };

  const handleNewGamePress = useCallback(() => {
    startGame(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResumePress = useCallback(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SelectedIcon = AVATARS[user?.avatar] || UserCircleIcon;

  return (
    <Wrapper style={styles.mainContainer}>
      <Pressable 
        style={styles.profileButton} 
        onPress={() => navigate('ProfileScreen')}
      >
        <SelectedIcon size={40} color={Colors.yellow || '#FBBF24'} />
      </Pressable>

      <View style={styles.imgContainer}>
        <Image source={Logo} style={styles.img} />
      </View>

      {currentPosition.length !== 0 &&
        renderButton('RESUME', handleResumePress)}
      {renderButton('NEW GAME', handleNewGamePress)}
      {renderButton('VS CPU', () => Alert.alert('VS CPU'))}
      {renderButton('2 VS 2', () => Alert.alert('2 VS 2'))}

      <Animated.View
        style={[
          styles.witchContainer,
          {
            transform: [{ translateX: witchAnim }, { scaleX: scaleXAnim }],
          },
        ]}
      >
        <Pressable
          onPress={() => {
            const random = Math.floor(Math.random() * 3) + 1;
            playSound(`girl${random}`);
          }}
        >
          <LottieView
            hardwareAccelerationAndroid
            source={Witch}
            autoPlay
            speed={1}
            style={styles.witch}
          />
        </Pressable>
      </Animated.View>
      <Text style={styles.artist}>Designed by - The Priyanka ™</Text>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    justifyContent: 'flex-start',
  },
  imgContainer: {
    width: deviceWidth * 0.6,
    height: deviceHeight * 0.12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
    alignSelf: 'center',
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 5,
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
