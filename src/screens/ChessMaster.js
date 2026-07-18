import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Alert, StatusBar, Animated, Image } from 'react-native';
import { Chess } from 'chess.js';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { playSound } from '../helpers/SoundUtility';

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

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 32;
const SQUARE_SIZE = BOARD_SIZE / 8;

const ChessMaster = ({ navigation }) => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [animatingMove, setAnimatingMove] = useState(null);
  const [showLegalMoves, setShowLegalMoves] = useState(true);

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

  // Update board state
  const updateBoard = useCallback(() => {
    setBoard(game.board());
    if (game.isCheckmate()) {
      playSound('cheer');
      Alert.alert("Game Over", `Checkmate! ${ game.turn() === 'w' ? 'Black' : 'White' } wins!`);
    } else if (game.isDraw()) {
      playSound('ui');
      Alert.alert("Game Over", "Draw!");
    } else if (game.isCheck()) {
      playSound('ui');
    }
  }, [game]);

  const onSquarePress = (square) => {
    if (animatingMove) return; // Prevent clicks during animation

    // If a square is already selected, try to move
    if (selectedSquare) {
      const moveOptions = {
        from: selectedSquare,
        to: square,
        promotion: 'q', // Always promote to queen for simplicity
      };

      try {
        const move = game.move(moveOptions);
        if (move) {
          // Valid move
          const fromIndices = getIndices(move.from);
          const toIndices = getIndices(move.to);
          const movedPiece = board[fromIndices.i][fromIndices.j];

          setAnimatingMove({
            piece: movedPiece,
            fromSquare: move.from,
            toSquare: move.to
          });

          moveAnim.setValue({ x: fromIndices.j * SQUARE_SIZE, y: fromIndices.i * SQUARE_SIZE });

          setSelectedSquare(null);
          setValidMoves([]);

          Animated.timing(moveAnim, {
            toValue: { x: toIndices.j * SQUARE_SIZE, y: toIndices.i * SQUARE_SIZE },
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
          return;
        }
      } catch (e) {
        // Invalid move, ignore or select new piece
      }
    }

    // Select piece if it belongs to the current turn
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
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
    setSelectedSquare(null);
    setValidMoves([]);
    playSound('game_start');
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

    // Check if the current square contains the king that is in check
    const isKingInCheck = game.isCheck() && piece && piece.type === 'k' && piece.color === game.turn();

    return (
      <TouchableOpacity
        key={ square }
        style={ [
          styles.square,
          isLightSquare ? styles.lightSquare : styles.darkSquare,
          isSelected && styles.selectedSquare,
          isKingInCheck && styles.inCheckSquare,
        ] }
        onPress={ () => onSquarePress(square) }
        activeOpacity={ 0.8 }
      >
        { renderPiece(piece, square) }
        { isValidMove && <View style={ styles.validMoveIndicator } /> }
      </TouchableOpacity>
    );
  };

  const { capturedWhite, capturedBlack } = getCapturedPieces();

  return (
    <SafeAreaView style={ styles.container }>
      <StatusBar barStyle="light-content" backgroundColor="#b18852ff" />

      <View style={ styles.header }>
        <TouchableOpacity style={ styles.backBtn } onPress={ () => navigation.goBack() }>
          <MaterialCommunityIcons name="chevron-left" size={ 32 } color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={ styles.headerTitle }>Chess Master</Text>
        <TouchableOpacity style={ styles.backBtn } onPress={ () => setShowLegalMoves(!showLegalMoves) }>
          <MaterialCommunityIcons name={ showLegalMoves ? "eye-outline" : "eye-off-outline" } size={ 22 } color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Animated.View style={ [styles.gameInfo, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>
        <Text style={ styles.turnText }>
          { game.isGameOver() ? 'Game Over' : `${ game.turn() === 'w' ? 'White' : 'Black' }'s Turn` }
        </Text>
        { game.isCheck() && !game.isCheckmate() && (
          <Text style={ styles.checkText }>Check!</Text>
        ) }
      </Animated.View>

      <Animated.View style={ { opacity: fadeAnim, paddingHorizontal: 20, width: '100%' } }>
        { renderCapturedPieces(capturedWhite, 'w') }
      </Animated.View>

      <Animated.View style={ [styles.boardContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }] }>
        <View style={ styles.boardBorder }>
          { board.map((row, i) => (
            <View key={ `row-${ i }` } style={ styles.row }>
              { row.map((_, j) => renderSquare(i, j)) }
            </View>
          )) }

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

      <Animated.View style={ { opacity: fadeAnim, paddingHorizontal: 20, width: '100%', marginTop: 10 } }>
        { renderCapturedPieces(capturedBlack, 'b') }
      </Animated.View>

      <Animated.View style={ { opacity: fadeAnim, transform: [{ translateY: slideAnim }] } }>
        <TouchableOpacity style={ styles.resetBtn } onPress={ resetGame }>
          <MaterialCommunityIcons name="refresh" size={ 24 } color="#0F0A1E" />
          <Text style={ styles.resetBtnText }>Restart Game</Text>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e190aff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  gameInfo: {
    alignItems: 'center',
    marginVertical: 20,
    minHeight: 60,
  },
  turnText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },
  checkText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  boardBorder: {
    borderWidth: 14,
    borderColor: '#4A2E1B',
    borderRadius: 8,
    backgroundColor: '#4A2E1B',
    borderTopColor: '#5C3A21',
    borderLeftColor: '#5C3A21',
    borderBottomColor: '#2C1A0F',
    borderRightColor: '#2C1A0F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
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
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  lightSquare: {
    backgroundColor: '#E4C18B',
  },
  darkSquare: {
    backgroundColor: '#6B4423',
  },
  selectedSquare: {
    backgroundColor: 'rgba(255, 157, 0, 0.65)',
  },
  inCheckSquare: {
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
  },
  pieceIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
  },
  validMoveIndicator: {
    position: 'absolute',
    width: SQUARE_SIZE * 0.3,
    height: SQUARE_SIZE * 0.3,
    borderRadius: SQUARE_SIZE * 0.15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    marginHorizontal: 40,
    marginTop: 40,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  resetBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F0A1E',
  },
  capturedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 28,
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingVertical: 4,
  },
  capturedContainerEmpty: {
    minHeight: 28,
    marginVertical: 4,
    paddingVertical: 4,
  },
  capturedPiece: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: 4,
  },
});

export default ChessMaster;
