import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert, StatusBar, Animated, Image, ImageBackground, BackHandler } from 'react-native';
import { Chess } from 'chess.js';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { playSound } from '../helpers/SoundUtility';
import { getBestMove } from '../helpers/chessAI';
import chessSocketService from '../helpers/chessSocketService';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../helpers/api';

import wp from '../assets/images/chess/wp.png';
import wr from '../assets/images/chess/wr.png';
import wn from '../assets/images/chess/wn.png';
import wb from '../assets/images/chess/wb.png';
import wq from '../assets/images/chess/wq.png';
import wk from '../assets/images/chess/wk.png';
import bp from '../assets/images/chess/bp.png';
import br from '../assets/images/chess/br.png';
import bn from '../assets/images/chess/bn.png';
import bb from '../assets/images/chess/bb.png';
import bq from '../assets/images/chess/bq.png';
import bk from '../assets/images/chess/bk.png';
import chessBg from '../assets/images/chess/chessBg.jpeg';
import WinnerModal from '../components/WinnerModal';
import ExitConfirmModal from '../components/ExitConfirmModal';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 24;
const SQUARE_SIZE = BOARD_SIZE / 8;

const CornerBrackets = () => (
  <View style={ StyleSheet.absoluteFill } pointerEvents="none">
    <View style={ [styles.bracket, styles.bracketTL] } />
    <View style={ [styles.bracket, styles.bracketTR] } />
    <View style={ [styles.bracket, styles.bracketBL] } />
    <View style={ [styles.bracket, styles.bracketBR] } />
  </View>
);

const ChessMaster = ({ route, navigation }) => {
  const isVsBot = route.params?.mode === 'vsBot';
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [animatingMove, setAnimatingMove] = useState(null);
  const [showLegalMoves, setShowLegalMoves] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);
  const [winnerModalData, setWinnerModalData] = useState({ title: '', message: '', prize: 0 });
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const isOnline = route.params?.mode === 'vsFriendOnline';
  const roomId = route.params?.roomId;
  const roomState = route.params?.roomState;

  const localPlayer = roomState?.players?.find(p => p.id === chessSocketService.socket?.id);
  const localColor = localPlayer ? localPlayer.playerColor : 'w';

  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.success ? res.data.user : null;
    },
    enabled: isOnline,
  });

  const updateCoinsMutation = useMutation({
    mutationFn: async (newCoins) => {
      const res = await api.put('/auth/me', { coins: newCoins });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
    },
  });

  const hasDeducted = useRef(false);
  useEffect(() => {
    if (isOnline && user && roomState?.entryFee > 0 && !hasDeducted.current) {
      hasDeducted.current = true;
      updateCoinsMutation.mutate(user.coins - roomState.entryFee);
    }
  }, [isOnline, user, roomState, updateCoinsMutation]);

  useEffect(() => {
    const backAction = () => {
      setExitModalVisible(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [isOnline, roomId, navigation]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const moveAnim = useRef(new Animated.ValueXY()).current;

  const getIndices = (square) => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(square[1], 10);
    return { i: rank, j: file };
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  useEffect(() => {
    if (selectedSquare) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [selectedSquare, pulseAnim]);

  const updateBoard = useCallback(() => {
    setBoard(game.board());
    if (game.isCheckmate()) {
      playSound('cheer');
      const winner = game.turn() === 'w' ? 'Black' : 'White';

      let prize = 0;
      if (isOnline) {
        const iWon = (game.turn() === 'b' && localColor === 'w') || (game.turn() === 'w' && localColor === 'b');
        if (iWon && user && roomState?.entryFee > 0) {
          prize = roomState.entryFee * 2;
          updateCoinsMutation.mutate(user.coins + prize);
        }
      }
      setWinnerModalData({ title: 'Game Over', message: `Checkmate! ${ winner } wins!`, prize });
      setWinnerModalVisible(true);
    } else if (game.isDraw()) {
      playSound('ui');
      Alert.alert("Game Over", "Draw!");
    } else if (game.isCheck()) {
      playSound('ui');
    }
  }, [game, isOnline, localColor, user, roomState, updateCoinsMutation]);

  const executeMove = useCallback((moveOptions) => {
    try {
      const move = game.move(moveOptions);
      if (move) {
        const fromIndices = getIndices(move.from);
        const toIndices = getIndices(move.to);
        const movedPiece = board[fromIndices.i][fromIndices.j];

        setAnimatingMove({
          piece: movedPiece,
          fromSquare: move.from,
          toSquare: move.to
        });

        const getPhysicalX = (j) => (localColor === 'b' ? 7 - j : j) * SQUARE_SIZE;
        const getPhysicalY = (i) => (localColor === 'b' ? 7 - i : i) * SQUARE_SIZE;

        moveAnim.setValue({ x: getPhysicalX(fromIndices.j), y: getPhysicalY(fromIndices.i) });

        setSelectedSquare(null);
        setValidMoves([]);

        Animated.timing(moveAnim, {
          toValue: { x: getPhysicalX(toIndices.j), y: getPhysicalY(toIndices.i) },
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          if (move.captured) {
            playSound('collide');
          } else {
            playSound('pile_move');
          }
          setAnimatingMove(null);
          updateBoard();
        });
        return true;
      }
    } catch (e) {
      // Invalid move
    }
    return false;
  }, [game, board, moveAnim, updateBoard, localColor]);

  useEffect(() => {
    if (isVsBot && game.turn() === 'b' && !game.isGameOver() && !animatingMove && !isThinking) {
      setIsThinking(true);
      setTimeout(() => {
        const bestMoveStr = getBestMove(game, 2);
        if (bestMoveStr) {
          executeMove(bestMoveStr);
        }
        setIsThinking(false);
      }, 300);
    }
  }, [game, isVsBot, animatingMove, isThinking, executeMove]);

  // Online Socket Listeners
  useEffect(() => {
    if (!isOnline) return;

    chessSocketService.onGameAction((data) => {
      if (data.actionType === 'move') {
        executeMove(data.payload);
      }
    });

    chessSocketService.onPlayerDisconnected(() => {
      let prize = 0;
      if (user && roomState?.entryFee > 0) {
        prize = roomState.entryFee * 2;
        updateCoinsMutation.mutate(user.coins + prize);
      }
      setWinnerModalData({ title: 'Opponent Disconnected', message: 'You won the match by forfeit!', prize });
      setWinnerModalVisible(true);
    });

    chessSocketService.onPlayerForfeited(() => {
      let prize = 0;
      if (user && roomState?.entryFee > 0) {
        prize = roomState.entryFee * 2;
        updateCoinsMutation.mutate(user.coins + prize);
      }
      setWinnerModalData({ title: 'Opponent Forfeited', message: 'You won the match!', prize });
      setWinnerModalVisible(true);
    });

    return () => {
      chessSocketService.offGameAction();
      chessSocketService.offPlayerDisconnected();
      chessSocketService.offPlayerForfeited();
    };
  }, [isOnline, executeMove, user, roomState, navigation, updateCoinsMutation]);

  const onSquarePress = (square) => {
    if (animatingMove) return;
    if (isVsBot && game.turn() === 'b') return;
    if (isOnline && game.turn() !== localColor) {
      Toast.show({ type: 'info', text1: "Not your turn", position: 'top' });
      return;
    }

    if (selectedSquare) {
      const moveOptions = {
        from: selectedSquare,
        to: square,
        promotion: 'q',
      };

      if (executeMove(moveOptions)) {
        if (isOnline) {
          chessSocketService.emitGameAction('move', moveOptions, roomId);
        }
        return;
      }
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const resetGame = () => {
    if (animatingMove) return;
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setValidMoves([]);
    playSound('game_start');
  };

  const handleUndo = () => {
    if (animatingMove) return;
    const undone = game.undo();
    if (undone) {
      setBoard(game.board());
      setSelectedSquare(null);
      setValidMoves([]);
      playSound('pile_move');
    }
  };

  const getPieceImage = (piece) => {
    const isWhite = piece.color === 'w';
    switch (piece.type) {
      case 'p': return isWhite ? wp : bp;
      case 'r': return isWhite ? wr : br;
      case 'n': return isWhite ? wn : bn;
      case 'b': return isWhite ? wb : bb;
      case 'q': return isWhite ? wq : bq;
      case 'k': return isWhite ? wk : bk;
      default: return null;
    }
  };

  const renderPiece = (piece, square) => {
    if (animatingMove && animatingMove.fromSquare === square) {
      return null;
    }
    if (!piece) return null;

    const isSelected = selectedSquare === square;
    const size = SQUARE_SIZE * 0.85;

    return (
      <Animated.View style={ [
        { justifyContent: 'center', alignItems: 'center' },
        isSelected ? { transform: [{ scale: pulseAnim }] } : {},
        { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 5, elevation: 8 }
      ] }>
        <Image
          source={ getPieceImage(piece) }
          style={ { width: size, height: size, resizeMode: 'contain' } }
        />
      </Animated.View>
    );
  };

  const getCapturedPieces = () => {
    const history = game.history({ verbose: true });
    const capturedWhite = [];
    const capturedBlack = [];

    history.forEach(move => {
      if (move.captured) {
        if (move.color === 'w') {
          capturedBlack.push(move.captured);
        } else {
          capturedWhite.push(move.captured);
        }
      }
    });
    return { capturedWhite, capturedBlack };
  };

  const renderCapturedPieces = (pieces, color) => {
    if (pieces.length === 0) return <View style={ styles.capturedContainerEmpty } />;
    return (
      <View style={ styles.capturedContainer }>
        { pieces.map((p, index) => (
          <Image
            key={ `${ index }-${ p }` }
            source={ getPieceImage({ type: p, color }) }
            style={ styles.capturedPiece }
          />
        )) }
      </View>
    );
  };

  const renderSquare = (i, j) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rank = 8 - i;
    const file = files[j];
    const square = `${ file }${ rank }`;

    const isLightSquare = (i + j) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isValidMove = showLegalMoves && validMoves.includes(square);
    const piece = board[i][j];
    const isKingInCheck = game.isCheck() && piece && piece.type === 'k' && piece.color === game.turn();
    const textColor = isLightSquare ? '#B58863' : '#F0D9B5';

    const isLeftmost = j === (localColor === 'b' ? 7 : 0);
    const isBottommost = i === (localColor === 'b' ? 0 : 7);

    return (
      <TouchableOpacity
        key={ square }
        style={ [
          styles.square,
          isLightSquare ? styles.lightSquare : styles.darkSquare,
          isSelected && styles.selectedSquareHighlight,
          isValidMove && styles.validMoveHighlight,
          isKingInCheck && styles.inCheckSquare,
        ] }
        onPress={ () => onSquarePress(square) }
        activeOpacity={ 0.9 }
      >
        { (isSelected || isValidMove) && <CornerBrackets /> }

        { isLeftmost && (
          <Text style={ [styles.coordinateText, styles.rankText, { color: textColor }] }>
            { rank }
          </Text>
        ) }

        { renderPiece(piece, square) }

        { isBottommost && (
          <Text style={ [styles.coordinateText, styles.fileText, { color: textColor }] }>
            { file }
          </Text>
        ) }
      </TouchableOpacity>
    );
  };

  const { capturedWhite, capturedBlack } = getCapturedPieces();
  const currentMoveNum = Math.floor(game.history().length / 2) + 1;
  const isWhiteTurn = game.turn() === 'w';

  return (
    <ImageBackground source={ chessBg } style={ styles.backgroundImage }>
      <SafeAreaView style={ styles.container }>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={ true } />

        {/* Action Buttons Toolbar */ }
        <View style={ styles.toolbar }>
          <TouchableOpacity style={ styles.actionBtn } onPress={ () => {
            setExitModalVisible(true);
          } }>
            <MaterialCommunityIcons name="arrow-u-left-top" size={ 26 } color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={ styles.actionBtn } onPress={ resetGame } disabled={ isOnline }>
            <MaterialCommunityIcons name="refresh" size={ 26 } color={ isOnline ? "#666" : "#FFD700" } />
          </TouchableOpacity>
          <TouchableOpacity style={ styles.actionBtn } onPress={ handleUndo } disabled={ isOnline }>
            <MaterialCommunityIcons name="undo" size={ 26 } color={ isOnline ? "#666" : "#FFD700" } />
          </TouchableOpacity>
          <TouchableOpacity style={ styles.actionBtn } onPress={ () => setShowLegalMoves(!showLegalMoves) }>
            <MaterialCommunityIcons name={ showLegalMoves ? "lightbulb-outline" : "lightbulb-off-outline" } size={ 26 } color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={ styles.actionBtn }>
            <MaterialCommunityIcons name="cog-outline" size={ 26 } color="#FFD700" />
          </TouchableOpacity>
        </View>

        <View style={ styles.gameArea }>
          <Animated.View style={ { opacity: fadeAnim, paddingHorizontal: 12, width: '100%', alignItems: 'flex-start' } }>
            { renderCapturedPieces(localColor === 'b' ? capturedBlack : capturedWhite, localColor === 'b' ? 'b' : 'w') }
          </Animated.View>

          <Animated.View style={ [styles.boardContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }] }>
            <View style={ styles.boardBorder }>
              { (localColor === 'b' ? [...board].reverse() : board).map((row, rowIndex) => {
                const i = localColor === 'b' ? 7 - rowIndex : rowIndex;
                const rowData = localColor === 'b' ? [...row].reverse() : row;
                return (
                  <View key={ `row-${ i }` } style={ styles.row }>
                    { rowData.map((_, colIndex) => {
                      const j = localColor === 'b' ? 7 - colIndex : colIndex;
                      return renderSquare(i, j);
                    }) }
                  </View>
                );
              }) }

              { animatingMove && (
                <Animated.View style={ {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: SQUARE_SIZE,
                  height: SQUARE_SIZE,
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [
                    { translateX: moveAnim.x },
                    { translateY: moveAnim.y },
                    { scale: 1.2 }
                  ],
                  zIndex: 100,
                  elevation: 100,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                } }>
                  <Image
                    source={ getPieceImage(animatingMove.piece) }
                    style={ { width: SQUARE_SIZE * 0.85, height: SQUARE_SIZE * 0.85, resizeMode: 'contain' } }
                  />
                </Animated.View>
              ) }
            </View>
          </Animated.View>

          <Animated.View style={ { opacity: fadeAnim, paddingHorizontal: 12, width: '100%', alignItems: 'flex-end', marginTop: 8 } }>
            { renderCapturedPieces(localColor === 'b' ? capturedWhite : capturedBlack, localColor === 'b' ? 'w' : 'b') }
          </Animated.View>
        </View>

        {/* Bottom Status Bar */ }
        <View style={ styles.statusBar }>
          <Text style={ styles.statusTextLeft }>
            { isOnline ? (localColor === 'w' ? 'You (White)' : 'You (Black)') : (isThinking ? 'AI is thinking...' : 'Amateur') }
          </Text>
          <Text style={ styles.statusTextRight }>
            { game.isGameOver() ? 'Game Over' : `${ currentMoveNum }. ${ isWhiteTurn ? 'White' : 'Black' }'s Move` }
          </Text>
        </View>
        <WinnerModal
          visible={winnerModalVisible}
          title={winnerModalData.title}
          message={winnerModalData.message}
          prize={winnerModalData.prize}
          onClose={() => {
            setWinnerModalVisible(false);
            if (isOnline) {
              navigation.goBack();
            }
          }}
        />
        <ExitConfirmModal
          visible={exitModalVisible}
          isOnline={isOnline}
          onCancel={() => setExitModalVisible(false)}
          onConfirm={() => {
            setExitModalVisible(false);
            if (isOnline) chessSocketService.forfeitGame(roomId);
            navigation.goBack();
          }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)', // Add a slight dark overlay to make elements pop
    justifyContent: 'space-between',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E190A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#3a2f1c',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  boardBorder: {
    borderWidth: 8,
    borderColor: '#D4B483', // Light wood border
    borderRadius: 4,
    backgroundColor: '#D4B483',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 20,
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightSquare: {
    backgroundColor: '#F0D9B5', // Classic light wood
  },
  darkSquare: {
    backgroundColor: '#B58863', // Classic dark wood
  },
  selectedSquareHighlight: {
    backgroundColor: 'rgba(255, 215, 0, 0.6)', // Yellow glow
  },
  validMoveHighlight: {
    backgroundColor: 'rgba(0, 255, 150, 0.45)', // Cyan/Green glow
  },
  inCheckSquare: {
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
  },
  bracket: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  bracketTL: {
    top: 4, left: 4,
    borderTopWidth: 2, borderLeftWidth: 2,
  },
  bracketTR: {
    top: 4, right: 4,
    borderTopWidth: 2, borderRightWidth: 2,
  },
  bracketBL: {
    bottom: 4, left: 4,
    borderBottomWidth: 2, borderLeftWidth: 2,
  },
  bracketBR: {
    bottom: 4, right: 4,
    borderBottomWidth: 2, borderRightWidth: 2,
  },
  coordinateText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.8,
  },
  rankText: {
    top: 2,
    left: 4,
  },
  fileText: {
    bottom: 0,
    right: 4,
  },
  capturedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 32,
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
  },
  capturedContainerEmpty: {
    minHeight: 32,
  },
  capturedPiece: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginHorizontal: 2,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  statusTextLeft: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusTextRight: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ChessMaster;
