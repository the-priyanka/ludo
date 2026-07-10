import { createSlice } from '@reduxjs/toolkit';
import { initialState } from './initialState';

export const gameSlice = createSlice({
  name: 'game',
  initialState: initialState,
  reducers: {
    resetGame: () => initialState,
    announceWinner: (state, action) => {
      state.winner = action.payload;
    },
    updateFireworks: (state, action) => {
      state.fireworks = action.payload;
    },
    updateDiceNo: (state, action) => {
      state.diceNo = action.payload.diceNo;
      state.isDiceRolled = true;
    },
    enablePileSelection: (state, action) => {
      state.touchDiceBlock = true;
      state.pileSelectionPlayer = action.payload.playerNo;
    },
    updatePlayerChance: (state, action) => {
      state.chancePlayer = action.payload.chancePlayer;
      state.touchDiceBlock = false;
      state.isDiceRolled = false;
      state.turnKey = (state.turnKey || 0) + 1; // always increments, even for same player
    },
    enableCellSelection: (state, action) => {
      state.touchDiceBlock = true;
      state.cellSelectionPlayer = action.payload.playerNo;
    },

    disableTouch: state => {
      state.touchDiceBlock = true;
      state.cellSelectionPlayer = -1;
      state.pileSelectionPlayer = -1;
    },

    unfreezeDice: state => {
      state.touchDiceBlock = false;
      state.isDiceRolled = false;
    },

    updatePlayerPieceValue: (state, action) => {
      const { travelCount, pos, pieceId, playerNo } = action.payload;
      const playerPiece = state[playerNo];
      const piece = playerPiece.find(p => p.id === pieceId);
      state.pileSelectionPlayer = -1;

      if (piece) {
        piece.pos = pos;
        piece.travelCount = travelCount;
        const currentPositionIndex = state.currentPositions.findIndex(
          p => p.id === pieceId,
        );

        if (pos === 0) {
          if (currentPositionIndex !== -1) {
            state.currentPositions.splice(currentPositionIndex, 1);
          }
        } else {
          if (currentPositionIndex !== -1) {
            state.currentPositions[currentPositionIndex] = {
              id: pieceId,
              pos,
            };
          } else {
            state.currentPositions.push({ id: pieceId, pos });
          }
        }
      }
    },

    // VS CPU mode reducers
    setCpuPlayers: (state, action) => {
      state.cpuPlayers = action.payload.cpuPlayers;
      state.activePlayers = action.payload.activePlayers;
      state.activePlayersList = action.payload.activePlayersList || [1,2,3,4];
    },
    setGameMode: (state, action) => {
      state.gameMode = action.payload;
    },
  },
});

export const {
  resetGame,
  announceWinner,
  updateFireworks,
  updateDiceNo,
  enablePileSelection,
  updatePlayerChance,
  enableCellSelection,
  updatePlayerPieceValue,
  unfreezeDice,
  disableTouch,
  setCpuPlayers,
  setGameMode,
} = gameSlice.actions;

export default gameSlice.reducer;
