import {
  View,
  Animated,
  Easing,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentPlayerChance,
  selectDiceNo,
  selectDiceRolled,
  selectActivePlayers,
  selectActivePlayersList,
  selectCpuPlayers,
} from '../redux/reducers/gameSelectors';
import socketService from '../helpers/socketService';
import { BackgroundImage } from '../helpers/GetIcons';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import Arrow from '../assets/images/arrow.png';
import DiceRoll from '../assets/animation/diceroll.json';
import { playSound } from '../helpers/SoundUtility';
import {
  enableCellSelection,
  enablePileSelection,
  updateDiceNo,
  updatePlayerChance,
} from '../redux/reducers/gameSlice';

const Dice = React.memo(({ color, rotate, player, data }) => {
  const dispatch = useDispatch();
  const currentPlayerChance = useSelector(selectCurrentPlayerChance);
  const isDiceRolled = useSelector(selectDiceRolled);
  const diceNo = useSelector(selectDiceNo);
  const activePlayers = useSelector(selectActivePlayers);
  const activePlayersList = useSelector(selectActivePlayersList);
  const cpuPlayers = useSelector(selectCpuPlayers);

  // True when it's this Dice component's player's turn AND that player is a CPU
  const isCpuTurn = currentPlayerChance === player && cpuPlayers.includes(player);

  const playerPieces = useSelector(
    state => state.game[`player${ currentPlayerChance }`],
  );
  
  const gameMode = useSelector(state => state.game.gameMode);
  const localPlayerNo = useSelector(state => state.game.localPlayerNo);
  const roomId = useSelector(state => state.game.roomId);

  const isOnlineTurn = gameMode === 'ONLINE_MULTIPLAYER' && currentPlayerChance === player;
  const isOpponentTurnOnline = isOnlineTurn && localPlayerNo !== player;

  console.log("cpuPlayers---->", cpuPlayers)

  const pileIcon = BackgroundImage.GetImage(color);
  const diceIcon = BackgroundImage.GetImage(diceNo);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const arrowAnim = useRef(new Animated.Value(0)).current;
  const [diceRolling, setDiceRolling] = useState(false);

  useEffect(() => {
    const animateArrow = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 10,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: -10,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    animateArrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerChance, isDiceRolled]);

  const handleDicePress = async () => {
    const newDiceNo = Math.floor(Math.random() * 6) + 1;
    // const newDiceNo = 2
    playSound('dice_roll');
    setDiceRolling(true);
    
    if (gameMode === 'ONLINE_MULTIPLAYER') {
      socketService.emitGameAction('roll_dice', { newDiceNo, player }, roomId);
    }
    
    await delay(800);
    dispatch(updateDiceNo({ diceNo: newDiceNo }));
    setDiceRolling(false);

    const isAnyPieceAlive = data?.findIndex(i => i.pos !== 0 && i.pos !== 57);
    const isAnyPieceLocked = data?.findIndex(i => i.pos === 0);

    const getNextChance = (current) => {
      const idx = activePlayersList.indexOf(current);
      if (idx === -1) return activePlayersList[0];
      return activePlayersList[(idx + 1) % activePlayersList.length];
    };

    if (isAnyPieceAlive === -1) {
      if (newDiceNo === 6) {
        dispatch(enablePileSelection({ playerNo: player }));
      } else {
        await delay(600);
        dispatch(updatePlayerChance({ chancePlayer: getNextChance(player) }));
      }
    } else {
      const canMove = playerPieces.some(
        pile => pile.travelCount + newDiceNo <= 57 && pile.pos !== 0,
      );

      if (
        (!canMove && newDiceNo === 6 && isAnyPieceLocked === -1) ||
        (!canMove && newDiceNo !== 6 && isAnyPieceLocked !== -1) ||
        (!canMove && newDiceNo !== 6 && isAnyPieceLocked === -1)
      ) {
        await delay(600);
        dispatch(updatePlayerChance({ chancePlayer: getNextChance(player) }));
        return;
      }

      if (newDiceNo === 6) {
        dispatch(enablePileSelection({ playerNo: player }));
      }
      dispatch(enableCellSelection({ playerNo: player }));
    }
  };

  return (
    <View
      style={ [styles.flexRow, { transform: [{ scaleX: rotate ? -1 : 1 }] }] }
    >
      {
        activePlayersList.includes(player) && (
          <>
            <View style={ styles.border1 }>
              <LinearGradient
                style={ styles.linearGradient }
                colors={ ['#0052be', '#5f9fcb', '#97c6c9'] }
                start={ { x: 0, y: 0.5 } }
                end={ { x: 1, y: 0.5 } }
              >
                <View style={ styles.pileContainer }>
                  <Image
                    source={ pileIcon }
                    style={ [
                      styles.pileIcon,
                    ] }
                  />
                </View>
              </LinearGradient>
            </View>

            <View style={ styles.border2 }>
              <View style={ styles.diceGradient }>
                <View style={ styles.diceContainer }>
                  { currentPlayerChance === player ? (
                    <>
                      { diceRolling ? null : (
                        <TouchableOpacity
                          disabled={ isDiceRolled || isCpuTurn || isOpponentTurnOnline }
                          activeOpacity={ (isCpuTurn || isOpponentTurnOnline) ? 1 : 0.4 }
                          onPress={ handleDicePress }
                        >
                          <Image source={ diceIcon } style={ styles.dice } />
                        </TouchableOpacity>
                      ) }
                    </>
                  ) : null }
                </View>
              </View>
            </View>

          </>
        )
      }


      { currentPlayerChance === player && !isDiceRolled ? (
        <Animated.View
          style={ {
            transform: [{ translateX: arrowAnim }],
          } }
        >
          <Image source={ Arrow } style={ { width: 50, height: 30 } } />
        </Animated.View>
      ) : null }

      { currentPlayerChance === player && diceRolling ? (
        <LottieView
          source={ DiceRoll }
          style={ styles.rollingDice }
          loop={ true }
          autoPlay
          // cacheComposition={true}
          hardwareAccelerationAndroid
        />
      ) : null }
    </View>
  );
});

const styles = StyleSheet.create({
  flexRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  pileIcon: {
    width: 35,
    height: 35,
  },

  diceContainer: {
    backgroundColor: '#e8c0c1',
    borderWidth: 1,
    borderRadius: 5,
    width: 60,
    height: 70,
    paddingHorizontal: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pileContainer: {
    paddingHorizontal: 3,
    paddingVertical: 10,
  },

  linearGradient: {
    padding: 1,
    borderWidth: 3,
    borderRightWidth: 0,
    borderColor: '#f0ce2c',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dice: {
    height: 45,
    width: 45,
  },

  rollingDice: {
    height: 80,
    width: 80,
    zIndex: 99,
    top: -20,
    right: 35,
    position: 'absolute',
  },

  diceGradient: {
    borderWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#f0ce2c',
    justifyContent: 'center',
    alignItems: 'center',
  },

  border1: {
    borderWidth: 3,
    borderRightWidth: 0,
    borderColor: '#f0ce2c',
  },

  border2: {
    borderWidth: 3,
    padding: 1,
    backgroundColor: '#aac8ab',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderColor: '#aac8ab',
  },
});

export default Dice;
