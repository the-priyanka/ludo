import { StyleSheet, Animated, Text, View } from 'react-native';
import React, { useEffect, useRef } from 'react';
import Wrapper from '../components/Wrapper';
import { prepareNavigation, resetAndNavigate } from '../helpers/NavigationUtil';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = () => {
  const scale = useRef(new Animated.Value(0.5)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    prepareNavigation();
    
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        resetAndNavigate('LandingScreen');
      } else {
        resetAndNavigate('LoginScreen');
      }
    }, 2500);
  }, [scale, fade]);

  return (
    <Wrapper>
      <View style={styles.container}>
        <Animated.View style={[styles.textContainer, { opacity: fade, transform: [{ scale }] }]}>
          <Text style={styles.title}>GAME</Text>
          <Text style={styles.titleHighlight}>ZONE</Text>
          <Text style={styles.subtitle}>Play, Win, Connect</Text>
        </Animated.View>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 55,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 8,
  },
  titleHighlight: {
    fontSize: 70,
    fontWeight: '900',
    color: '#FFD700', // Gold color
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 10,
    marginTop: -15,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E0E0',
    marginTop: 20,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
});

export default SplashScreen;
