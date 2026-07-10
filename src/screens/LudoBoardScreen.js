import {
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import Wrapper from '../components/Wrapper';
import MenuIcons from '../assets/images/menu.png';
import { playSound } from '../helpers/SoundUtility';
import MenuModel from '../components/MenuModel.js';
import StartGame from '../assets/images/start.png';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectDiceTouch,
  selectPlayer1,
  selectPlayer2,
  selectPlayer3,
  selectPlayer4,
  selectCurrentPlayerChance,
  selectCpuPlayers,
  selectActivePlayers,
  selectTurnKey,
  selectDiceRolled,
} from '../redux/reducers/gameSelectors';
import WinModal from '../components/WinModal';
import Dice from '../components/Dice';
import { Colors } from '../constants/Colors';
import Pocket from '../components/Pocket';
import VerticalPath from '../components/path/VerticalPath';
import {
  Plot1Data,
  Plot2Data,
  Plot3Data,
  Plot4Data,
} from '../helpers/PlotData';
import FourTriangles from '../components/FourTriangles';
import HorizontalPath from '../components/path/HorizontalPath.js';
import { handleCpuTurn } from '../helpers/cpuPlayer';

const LudoBoardScreen = () => {
  const dispatch = useDispatch();
  const player1 = useSelector(selectPlayer1);
  const player2 = useSelector(selectPlayer2);
  const player3 = useSelector(selectPlayer3);
  const player4 = useSelector(selectPlayer4);
  const isDiceTouch = useSelector(selectDiceTouch);
  const winner = useSelector(state => state.game.winner);
  const chancePlayer = useSelector(selectCurrentPlayerChance);
  const cpuPlayers = useSelector(selectCpuPlayers);
  const activePlayers = useSelector(selectActivePlayers);
  const turnKey = useSelector(selectTurnKey);
  const isDiceRolled = useSelector(selectDiceRolled);

  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(1)).current;

  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);

  const handleMenuPress = useCallback(() => {
    playSound('ui');
    setMenuVisible(true);
  }, []);

  // ── VS CPU: auto-trigger CPU turns ──────────────────────────────────────────
  useEffect(() => {
    if (
      cpuPlayers.length > 0 &&
      cpuPlayers.includes(chancePlayer) &&
      winner === null &&
      isFocused &&
      !isDiceRolled &&   // don't fire while dice is already rolled this turn
      !isDiceTouch       // don't fire while pieces are animating
    ) {
      dispatch(handleCpuTurn(chancePlayer));
    }
    // turnKey changes every updatePlayerChance — even when same player rolls 6 again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey, chancePlayer, cpuPlayers, winner, isFocused]);
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    setShowStartImage(true);
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );

    blinkAnimation.start();

    const timeout = setTimeout(() => {
      blinkAnimation.stop();
      setShowStartImage(false);
    }, 2500);

    return () => {
      blinkAnimation.stop();
      clearTimeout(timeout);
    };
  }, [isFocused, opacity]);


  return (
    <Wrapper>
      <TouchableOpacity style={ styles.menuIcons } onPress={ handleMenuPress }>
        <Image source={ MenuIcons } style={ styles.menuIconImage } />
      </TouchableOpacity>

      <View style={ styles.container }>
        <View
          style={ styles.flexRow }
          pointerEvents={ isDiceTouch ? 'none' : 'auto' }
        >
          <Dice color={ Colors.green } player={ 2 } data={ player2 } />
          <Dice color={ Colors.yellow } player={ 3 } rotate data={ player3 } />
        </View>
        <View style={ styles.ludoBoard }>
          <View style={ styles.plotContainer }>
            <Pocket color={ Colors.green } player={ 2 } data={ player2 }
              isPileEnable={ cpuPlayers.length > 0 ? (cpuPlayers.includes(2) ? true : false) : true }
            />
            <VerticalPath cells={ Plot2Data } color={ Colors.yellow } />
            <Pocket color={ Colors.yellow } player={ 3 } data={ player3 }
              isPileEnable={ cpuPlayers.length > 0 ? (cpuPlayers.includes(3) ? true : false) : true }
            />
          </View>
          <View style={ styles.pathContainer }>
            <HorizontalPath cells={ Plot1Data } color={ Colors.green } />
            <FourTriangles
              player1={ player1 }
              player2={ player2 }
              player3={ player3 }
              player4={ player4 }
            />
            <HorizontalPath cells={ Plot3Data } color={ Colors.blue } />
          </View>
          <View style={ styles.plotContainer }>
            <Pocket color={ Colors.red } player={ 1 } data={ player1 }
            />
            <VerticalPath cells={ Plot4Data } color={ Colors.red } />
            <Pocket color={ Colors.blue } player={ 4 } data={ player4 }
              isPileEnable={ cpuPlayers.length > 0 ? (cpuPlayers.includes(4) ? true : false) : true }
            />
          </View>
        </View>
        <View
          style={ styles.flexRow }
          pointerEvents={ isDiceTouch ? 'none' : 'auto' }
        >
          <Dice color={ Colors.red } player={ 1 } data={ player1 } />
          <Dice color={ Colors.blue } rotate player={ 4 } data={ player4 } />
        </View>
      </View>

      { showStartImage && (
        <Animated.Image
          source={ StartGame }
          style={ {
            width: deviceWidth * 0.5,
            height: deviceWidth * 0.2,
            position: 'absolute',
            opacity,
          } }
        />
      ) }

      { menuVisible && (
        <MenuModel
          onPressHide={ () => setMenuVisible(false) }
          visible={ menuVisible }
        />
      ) }

      { winner !== null && <WinModal winner={ winner } /> }

    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    height: deviceHeight * 0.5,
    width: deviceWidth,
  },
  ludoBoard: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    padding: 10,
  },
  menuIcons: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  menuIconImage: {
    width: 30,
    height: 30,
  },
  flexRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 30,
  },
  plotContainer: {
    width: '100%',
    height: '40%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    backgroundColor: '#ccc',
  },
  pathContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '20%',
    justifyContent: 'space-between',
    backgroundColor: '#1E5162',
  },
});

export default LudoBoardScreen;
