import { StyleSheet, Animated, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { deviceWidth, deviceHeight } from '../constants/Scaling';
import Wrapper from '../components/Wrapper';
import Logo from '../assets/images/logo.png';
import { prepareNavigation, resetAndNavigate } from '../helpers/NavigationUtil';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = () => {
  const [isStop] = useState(false);
  const scale = new Animated.Value(1);

  useEffect(() => {
    prepareNavigation();
    setTimeout(async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        resetAndNavigate('LandingScreen');
      } else {
        resetAndNavigate('LoginScreen');
      }
    }, 1500);
  }, []);

  useEffect(() => {
    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    if (!isStop) {
      breathingAnimation.start();
    }

    return () => {
      breathingAnimation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStop]);

  return (
    <Wrapper>
      <Animated.View style={ [styles.imgContainer, { transform: [{ scale }] }] }>
        <Image source={ Logo } style={ styles.img } />
      </Animated.View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  imgContainer: {
    width: deviceWidth * 0.7,
    height: deviceHeight * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default SplashScreen;
