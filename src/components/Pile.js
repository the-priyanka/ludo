import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  View,
  Easing,
  Image,
} from 'react-native';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  selectCellSelection,
  selectDiceNo,
  selectPocketPileSelection,
} from '../redux/reducers/gameSelectors';
import { Colors } from '../constants/Colors';
import PileGreen from '../assets/images/piles/green.png';
import PileRed from '../assets/images/piles/red.png';
import PileYellow from '../assets/images/piles/yellow.png';
import PileBlue from '../assets/images/piles/blue.png';
import { Svg, Circle } from 'react-native-svg';

const Pile = ({ cell, pieceId, player, color, onPress }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const currentPlayerPileSelection = useSelector(selectPocketPileSelection);
  const currentPlayerCellSelection = useSelector(selectCellSelection);
  const diceNo = useSelector(selectDiceNo);
  const localPlayerNo = useSelector(state => state.game.localPlayerNo) || 1;

  const playerPieces = useSelector(state => state.game[`player${ player }`]);

  const isPileEnabled = useMemo(
    () => player === currentPlayerPileSelection,
    [currentPlayerPileSelection, player],
  );

  const isCellEnabled = useMemo(
    () => player === currentPlayerCellSelection,
    [currentPlayerCellSelection, player],
  );

  const isForwardable = useCallback(() => {
    const piece = playerPieces?.find(item => item.id === pieceId);
    return piece && piece.travelCount + diceNo <= 57;
  }, [playerPieces, pieceId, diceNo]);

  const getPileImage = useMemo(() => {
    switch (color) {
      case Colors.green:
        return PileGreen;
      case Colors.red:
        return PileRed;
      case Colors.yellow:
        return PileYellow;
      case Colors.blue:
        return PileBlue;

      default:
        return PileGreen;
    }
  }, [color]);

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, [rotation]);

  const rotateInterpolate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [rotation],
  );

  const boardRotation = localPlayerNo === 1 ? 0 
    : localPlayerNo === 2 ? -90
    : localPlayerNo === 3 ? 180
    : localPlayerNo === 4 ? 90
    : 0;

  return (
    <TouchableOpacity
      style={ [styles.container, { transform: [{ rotate: `${-boardRotation}deg` }] }] }
      activeOpacity={ 0.5 }
      disabled={ !(cell ? isCellEnabled && isForwardable() : isPileEnabled) }
      onPress={ onPress }
    >
      <View style={ styles.hollowCircle }>
        { (cell ? isCellEnabled && isForwardable() : isPileEnabled) && (
          <View style={ styles.dashedCircleContainer }>
            <Animated.View
              style={ [
                styles.dashCircle,
                { transform: [{ rotate: rotateInterpolate }] },
              ] }
            >
              <Svg height="18" width="18">
                <Circle
                  cx="9"
                  cy="9"
                  r="8"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeDashoffset="0"
                  fill="transparent"
                />
              </Svg>
            </Animated.View>
          </View>
        ) }
      </View>

      <Image
        source={ getPileImage }
        style={ { width: 32, height: 32, position: 'absolute', top: -16 } }
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    alignSelf: 'center',
  },
  hollowCircle: {
    width: 15,
    height: 15,
    position: 'absolute',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashedCircleContainer: {
    position: 'absolute',
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    top: -8,
  },
  dashCircle: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashCircleImage: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
});

export default memo(Pile);
