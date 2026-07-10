import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch } from 'react-redux';
import { resetGame, setCpuPlayers, setGameMode } from '../redux/reducers/gameSlice';
import { playSound } from '../helpers/SoundUtility';
import { navigate } from '../helpers/NavigationUtil';

const VsCpuModal = ({ visible, onPressHide }) => {
  const dispatch = useDispatch();
  const [selectedPlayers, setSelectedPlayers] = useState(2);

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
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSelect = useCallback(
    (playerCount) => {
      playSound('ui');
      // 2-player: Player1(Red) vs Player3(Yellow CPU) — diagonal opponents
      // 4-player: Player1(Red) vs Player2,3,4 CPU
      const cpuList = playerCount === 2 ? [3] : [2, 3, 4];
      const activeList = playerCount === 2 ? [1, 3] : [1, 2, 3, 4];
      dispatch(resetGame());
      dispatch(setGameMode('vscpu'));
      dispatch(setCpuPlayers({
        cpuPlayers: cpuList,
        activePlayers: playerCount,
        activePlayersList: activeList,
      }));
      onPressHide();
      navigate('LudoBoardScreen');
      playSound('game_start');
    },
    [dispatch, onPressHide]
  );

  const PlayerDot = ({ color }) => (
    <View style={ [styles.playerDot, { backgroundColor: color }] } />
  );

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
          <View style={ styles.titleRow }>
            <Text style={ styles.diceIcon }>🎲</Text>
            <Text style={ styles.title }>Ludo</Text>
          </View>
          <Text style={ styles.subtitle }>Play against the computer</Text>
        </View>

        {/* Battle Mode Section */ }
        <View style={ styles.section }>
          <Text style={ styles.sectionLabel }>BATTLE MODE</Text>
          <Text style={ styles.sectionDesc }>Pick how many players are on the board</Text>

          {/* 2 Players Card */ }
          <TouchableOpacity
            activeOpacity={ 0.85 }
            onPress={ () => setSelectedPlayers(2) }
            style={ [
              styles.optionCard,
              selectedPlayers === 2 && styles.optionCardSelected,
            ] }
          >
            <View style={ styles.dotRow }>
              <PlayerDot color="#E8524A" />
              <PlayerDot color="#FFC107" />
            </View>
            <View style={ styles.optionTextBlock }>
              <Text style={ styles.optionTitle }>2 players</Text>
              <Text style={ styles.optionDesc }>You (Red) vs 1 CPU (Yellow) · recommended</Text>
            </View>
            { selectedPlayers === 2 && (
              <Text style={ styles.checkmark }>✓</Text>
            ) }
          </TouchableOpacity>

          {/* 4 Players Card */ }
          <TouchableOpacity
            activeOpacity={ 0.85 }
            onPress={ () => setSelectedPlayers(4) }
            style={ [
              styles.optionCard,
              selectedPlayers === 4 && styles.optionCardSelected,
            ] }
          >
            <View style={ styles.dotRow }>
              <PlayerDot color="#E8524A" />
              <PlayerDot color="#4CAF50" />
              <PlayerDot color="#FFC107" />
              <PlayerDot color="#2196F3" />
            </View>
            <View style={ styles.optionTextBlock }>
              <Text style={ styles.optionTitle }>4 players</Text>
              <Text style={ styles.optionDesc }>You vs 3 CPUs</Text>
            </View>
            { selectedPlayers === 4 && (
              <Text style={ styles.checkmark }>✓</Text>
            ) }
          </TouchableOpacity>
        </View>

        {/* Info bar */ }
        <View style={ styles.infoBar }>
          <View style={ styles.infoRedDot } />
          <Text style={ styles.infoText }>
            { selectedPlayers === 2
              ? 'You play Red (bottom-left) vs Yellow CPU (top-right)'
              : 'You play Red (bottom-left) vs 3 CPU opponents'
            }
          </Text>
        </View>

        {/* Start game button */ }
        <TouchableOpacity
          activeOpacity={ 0.85 }
          style={ styles.startButton }
          onPress={ () => handleSelect(selectedPlayers) }
        >
          <Text style={ styles.startButtonText }>Start game</Text>
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  diceIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.2,
  },

  // Section
  section: {
    backgroundColor: '#242438',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 14,
  },

  // Option Cards
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E4A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#E8524A',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 14,
  },
  playerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 16,
  },
  checkmark: {
    fontSize: 18,
    color: '#E8524A',
    fontWeight: '700',
  },

  // Info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242438',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  infoRedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8524A',
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },

  // Start Button
  startButton: {
    backgroundColor: '#E8524A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
});

export default VsCpuModal;
