import { View, StyleSheet } from 'react-native';
import React, { memo } from 'react';
import { useDispatch } from 'react-redux';
import { Colors } from '../constants/Colors';
import Pile from './Pile';
import { startingPoints } from '../helpers/PlotData';
import {
  unfreezeDice,
  updatePlayerPieceValue,
} from '../redux/reducers/gameSlice';
import socketService from '../helpers/socketService';
import { useSelector } from 'react-redux';

const Pocket = ({ color, player, data, isPileEnable }) => {
  const dispatch = useDispatch();
  
  const gameMode = useSelector(state => state.game.gameMode);
  const localPlayerNo = useSelector(state => state.game.localPlayerNo);
  const roomId = useSelector(state => state.game.roomId);
  const currentPlayerChance = useSelector(state => state.game.chancePlayer);

  const isOnlineTurn = gameMode === 'ONLINE_MULTIPLAYER' && currentPlayerChance === player;
  const isOpponentTurnOnline = gameMode === 'ONLINE_MULTIPLAYER' && localPlayerNo !== player;

  const handlePress = async value => {
    let playerNo = value?.id?.slice(0, 1);
    switch (playerNo) {
      case 'A':
        playerNo = 'player1';
        break;

      case 'B':
        playerNo = 'player2';
        break;

      case 'C':
        playerNo = 'player3';
        break;

      default:
        playerNo = 'player4';
        break;
    }
    dispatch(
      updatePlayerPieceValue({
        playerNo: playerNo,
        pieceId: value.id,
        pos: startingPoints[parseInt(playerNo.match(/\d+/)[0], 10) - 1],
        travelCount: 1,
      }),
    );

    if (gameMode === 'ONLINE_MULTIPLAYER') {
      socketService.emitGameAction('move_from_pocket', { value }, roomId);
    }

    dispatch(unfreezeDice());
  };
  return (
    <View style={ [styles.container, { backgroundColor: color }] }>
      <View style={ styles.childFrame }>
        <View style={ styles.flexRow }>
          <Plot
            pieceNo={ 0 }
            player={ player }
            color={ color }
            data={ data }
            handlePress={ handlePress }
            isPileEnable={ isPileEnable }
            isOpponentTurnOnline={isOpponentTurnOnline}
          />
          <Plot
            pieceNo={ 1 }
            player={ player }
            color={ color }
            data={ data }
            handlePress={ handlePress }
            isPileEnable={ isPileEnable }
            isOpponentTurnOnline={isOpponentTurnOnline}
          />
        </View>
        <View style={ [styles.flexRow, { marginTop: 20 }] }>
          <Plot
            pieceNo={ 2 }
            player={ player }
            color={ color }
            data={ data }
            handlePress={ handlePress }
            isPileEnable={ isPileEnable }
            isOpponentTurnOnline={isOpponentTurnOnline}
          />
          <Plot
            pieceNo={ 3 }
            player={ player }
            color={ color }
            data={ data }
            handlePress={ handlePress }
            isPileEnable={ isPileEnable }
            isOpponentTurnOnline={isOpponentTurnOnline}
          />
        </View>
      </View>
    </View>
  );
};

const Plot = ({ pieceNo, player, data, handlePress, color, isPileEnable = true, isOpponentTurnOnline }) => {
  return (
    <View style={ [styles.plot, { backgroundColor: color }] }>
      { isPileEnable && data && data[pieceNo]?.pos === 0 && (
        <Pile
          pieceId={ data[pieceNo]?.id }
          player={ player }
          color={ color }
          disabled={isOpponentTurnOnline}
          onPress={ () => handlePress(data[pieceNo]) }
        />
      ) }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    width: '40%',
    height: '100%',
    borderColor: Colors.borderColor,
  },
  childFrame: {
    backgroundColor: 'white',
    borderWidth: 0.4,
    padding: 15,
    width: '70%',
    height: '70%',
    borderColor: Colors.borderColor,
  },
  flexRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '40%',
    flexDirection: 'row',
  },
  plot: {
    backgroundColor: Colors.green,
    height: '80%',
    width: '36%',
    borderRadius: 50,
  },
});

export default memo(Pocket);
