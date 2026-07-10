import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import { playSound } from '../helpers/SoundUtility';
import Toast from 'react-native-toast-message';

const COIN_OPTIONS = [500, 1000, 2000, 5000, 10000];

const CoinSelectionModal = ({ visible, onPressHide, onPlay, userBalance, isLoading }) => {
  const [selectedCoin, setSelectedCoin] = useState(500);

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
      setSelectedCoin(500); // reset on open
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSelect = useCallback(() => {
    playSound('ui');
    if (userBalance < selectedCoin) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient Coins',
        text2: 'You do not have enough coins to play this bet.',
        position: 'top',
      });
      return;
    }
    onPlay(selectedCoin);
  }, [selectedCoin, userBalance, onPlay]);

  return (
    <Modal
      style={ styles.modalWrapper }
      isVisible={ visible }
      backdropColor="#000"
      backdropOpacity={ 0.75 }
      onBackdropPress={ onPressHide }
      animationIn="fadeIn"
      animationOut="fadeOut"
      onBackButtonPress={ onPressHide }
    >
      <Animated.View
        style={ [
          styles.modalContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ] }
      >
        {/* Header */ }
        <View style={ styles.header }>
          <Text style={ styles.title }>Select Entry Fee</Text>
          <Text style={ styles.subtitle }>Current Balance: 💰 { userBalance }</Text>
        </View>

        {/* Options Grid */ }
        <View style={ styles.grid }>
          { COIN_OPTIONS.map((coin) => {
            const isSelected = selectedCoin === coin;
            return (
              <TouchableOpacity
                key={ coin }
                activeOpacity={ 0.8 }
                onPress={ () => {
                  playSound('ui');
                  setSelectedCoin(coin);
                } }
                style={ [
                  styles.optionBox,
                  isSelected && styles.optionBoxSelected,
                ] }
              >
                <Text style={ styles.coinIcon }>💰</Text>
                <Text
                  style={ [
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ] }
                >
                  { coin }
                </Text>
              </TouchableOpacity>
            );
          }) }
        </View>

        <View style={ styles.prizeBox }>
          <Text style={ styles.prizeTitle }>Winning Prize</Text>
          <Text style={ styles.prizeAmount }>💰 { selectedCoin * 4 }</Text>
        </View>

        {/* Play button */ }
        <TouchableOpacity
          activeOpacity={ 0.85 }
          style={ [styles.playButton, isLoading && styles.playButtonDisabled] }
          onPress={ handleSelect }
          disabled={ isLoading }
        >
          { isLoading ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={ styles.playButtonText }>Play Now</Text>
          ) }
        </TouchableOpacity>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFC107',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  optionBox: {
    width: '30%',
    backgroundColor: '#242438',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionBoxSelected: {
    borderColor: '#E8524A',
    backgroundColor: '#2E2E4A',
  },
  coinIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  prizeBox: {
    backgroundColor: '#242438',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  prizeTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  prizeAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4CAF50',
  },
  playButton: {
    backgroundColor: '#E8524A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    opacity: 0.7,
  },
  playButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
});

export default CoinSelectionModal;
