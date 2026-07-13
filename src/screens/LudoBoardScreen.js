import {
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  View,
  Text,
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
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon, UserIcon,
} from 'react-native-heroicons/solid';

const AVATARS = {
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon, UserIcon,
};

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
import socketService from '../helpers/socketService';
import { handleDiceRollThunk, handleForwardThunk, handleMoveFromPocketThunk } from '../redux/reducers/gameAction';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';
import api from '../helpers/api.js';

const LudoBoardScreen = () => {
  const dispatch = useDispatch();
  const player1 = useSelector(selectPlayer1);
  const player2 = useSelector(selectPlayer2);
  const player3 = useSelector(selectPlayer3);
  const player4 = useSelector(selectPlayer4);
  const localPlayerNo = useSelector(state => state.game.localPlayerNo) || 1;
  const isDiceTouch = useSelector(selectDiceTouch);
  const winner = useSelector(state => state.game.winner);
  const chancePlayer = useSelector(selectCurrentPlayerChance);
  const cpuPlayers = useSelector(selectCpuPlayers);
  const turnKey = useSelector(selectTurnKey);
  const isDiceRolled = useSelector(selectDiceRolled);
  const gameMode = useSelector(state => state.game.gameMode);

  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(1)).current;

  const [menuVisible, setMenuVisible] = useState(false);
  const [showStartImage, setShowStartImage] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      console.log("res", res)
      return res.data.success ? res.data.user : null;
    },
    enabled: isFocused,
  });


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

  // ── ONLINE MULTIPLAYER: Socket Listeners ────────────────────────────────────
  useEffect(() => {
    if (gameMode === 'ONLINE_MULTIPLAYER') {
      socketService.onGameAction((data) => {
        const { actionType, payload } = data;
        if (actionType === 'roll_dice') {
          dispatch(handleDiceRollThunk(payload.newDiceNo, payload.player));
        } else if (actionType === 'move_piece') {
          dispatch(handleForwardThunk(payload.playerNo, payload.pieceId, payload.id));
        } else if (actionType === 'move_from_pocket') {
          dispatch(handleMoveFromPocketThunk(payload.value));
        }
      });

      socketService.onPlayerDisconnected((data) => {
        Toast.show({
          type: 'info',
          text1: 'Opponent Disconnected',
          text2: 'You win by forfeit!',
        });
        // Simplistic forfeit win for now
        dispatch({ type: 'game/announceWinner', payload: chancePlayer });
      });

      return () => {
        socketService.offGameAction();
      };
    }
  }, [gameMode, dispatch, chancePlayer]);

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

  const AvatarImage = user?.avatar ? AVATARS[user.avatar] || UserIcon : UserIcon;

  const boardRotation = localPlayerNo === 1 ? 0 
    : localPlayerNo === 2 ? -90
    : localPlayerNo === 3 ? 180
    : localPlayerNo === 4 ? 90
    : 0;

  const playersData = { 1: player1, 2: player2, 3: player3, 4: player4 };
  const playerColors = { 1: Colors.red, 2: Colors.green, 3: Colors.yellow, 4: Colors.blue };

  const TL = (localPlayerNo % 4) + 1;
  const TR = ((localPlayerNo + 1) % 4) + 1;
  const BR = ((localPlayerNo + 2) % 4) + 1;
  const BL = localPlayerNo;

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
          <Dice color={ playerColors[TL] } player={ TL } data={ playersData[TL] } />
          <Dice color={ playerColors[TR] } player={ TR } rotate data={ playersData[TR] } />
        </View>
        <View style={ [styles.ludoBoard, { transform: [{ rotate: `${boardRotation}deg` }] }] }>
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
          <Dice color={ playerColors[BL] } player={ BL } data={ playersData[BL] } />
          <Dice color={ playerColors[BR] } player={ BR } rotate data={ playersData[BR] } />
        </View>
      </View>

      <View style={ styles.userProfileContainer }>
        <View style={ styles.avatarContainer }>
          <AvatarImage size={ 30 } color="#fff" />
        </View>
        <View style={ styles.userInfo }>
          <Text style={ styles.usernameText } numberOfLines={ 1 }>{ user?.username }</Text>
          <Text style={ styles.coinsText }>{ user?.coins } Coins</Text>
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
  userProfileContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  avatarContainer: {
    marginRight: 10,
  },
  userInfo: {
    justifyContent: 'center',
  },
  usernameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  coinsText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LudoBoardScreen;
