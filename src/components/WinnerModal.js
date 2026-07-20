import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const WinnerModal = ({ visible, title, message, prize, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.5);
      pulseAnim.setValue(1);
    }
  }, [visible, scaleAnim, pulseAnim]);

  return (
    <Modal
      isVisible={ visible }
      backdropColor="#000"
      backdropOpacity={ 0.8 }
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackdropPress={ onClose }
      style={ styles.modalWrapper }
    >
      <Animated.View style={ [styles.container, { transform: [{ scale: scaleAnim }] }] }>
        <Animated.View style={ { transform: [{ scale: pulseAnim }] } }>
          <MaterialCommunityIcons name="trophy" size={ 80 } color="#FFD700" style={ styles.icon } />
        </Animated.View>

        <Text style={ styles.title }>{ title }</Text>
        <Text style={ styles.message }>{ message }</Text>

        { prize > 0 && (
          <View style={ styles.prizeContainer }>
            <Text style={ styles.prizeLabel }>You Won</Text>
            <View style={ styles.coinRow }>
              <Text style={ styles.coinIcon }>💰</Text>
              <Text style={ styles.prizeAmount }>{ prize.toLocaleString() }</Text>
            </View>
          </View>
        ) }

        <TouchableOpacity style={ styles.button } onPress={ onClose }>
          <Text style={ styles.buttonText }>Awesome!</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    marginBottom: 10,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
  },
  prizeContainer: {
    backgroundColor: '#0F0A1E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  prizeLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  prizeAmount: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default WinnerModal;
