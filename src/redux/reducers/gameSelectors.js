export const selectCurrentPositions = state => state.game.currentPositions;
export const selectCurrentPlayerChance = state => state.game.chancePlayer;
export const selectDiceRolled = state => state.game.isDiceRolled;
export const selectDiceNo = state => state.game.diceNo;

export const selectPlayer1 = state => state.game.player1;
export const selectPlayer2 = state => state.game.player2;
export const selectPlayer3 = state => state.game.player3;
export const selectPlayer4 = state => state.game.player4;

export const selectPocketPileSelection = state =>
  state.game.pileSelectionPlayer;
export const selectCellSelection = state => state.game.cellSelectionPlayer;
export const selectDiceTouch = state => state.game.touchDiceBlock;
export const selectFireworks = state => state.game.fireworks;

// VS CPU selectors
export const selectCpuPlayers = state => state.game.cpuPlayers;
export const selectGameMode = state => state.game.gameMode;
export const selectActivePlayers = state => state.game.activePlayers;
export const selectActivePlayersList = state => state.game.activePlayersList || [1,2,3,4];
export const selectTurnKey = state => state.game.turnKey;
