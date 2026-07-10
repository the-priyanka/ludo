import { startingPoints, SafeSpots, StarSpots } from './PlotData';
import {
  updateDiceNo,
  updatePlayerChance,
  unfreezeDice,
  updatePlayerPieceValue,
} from '../redux/reducers/gameSlice';
import { handleForwardThunk } from '../redux/reducers/gameAction';
import { selectCurrentPositions } from '../redux/reducers/gameSelectors';
import { playSound } from './SoundUtility';

const cpuDelay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulate where a piece lands after moving `diceNo` steps from `pos`.
 */
function simulatePath(pos, diceNo, playerNo, turningPoints, victoryStart) {
  let path = pos;
  for (let i = 0; i < diceNo; i++) {
    path += 1;
    if (turningPoints.includes(path) && turningPoints[playerNo - 1] === path) {
      path = victoryStart[playerNo - 1];
    }
    if (path === 53) path = 1;
  }
  return path;
}

/**
 * CPU AI — picks the best piece to move.
 * Priority: win > capture enemy > advance farthest > open new piece on 6
 */
function pickBestPiece(playerNo, diceNo, playerPieces, currentPositions, turningPoints, victoryStart) {
  const alpha = playerNo === 1 ? 'A' : playerNo === 2 ? 'B' : playerNo === 3 ? 'C' : 'D';

  const activePieces = playerPieces.filter(p => p.pos > 0 && p.travelCount < 57);
  const homePieces   = playerPieces.filter(p => p.pos === 0);

  // 1. Win a piece
  for (const piece of activePieces) {
    if (piece.travelCount + diceNo === 57) return { piece, isOpeningMove: false };
  }

  // 2. Capture enemy
  for (const piece of activePieces) {
    const land = simulatePath(piece.pos, diceNo, playerNo, turningPoints, victoryStart);
    if (land > 0) {
      const piecesAt = currentPositions.filter(p => p.pos === land);
      const hasEnemy = piecesAt.some(p => p.id[0] !== alpha);
      const isSafe   = SafeSpots.includes(land) || StarSpots.includes(land);
      if (hasEnemy && !isSafe) return { piece, isOpeningMove: false };
    }
  }

  // 3. Advance the farthest valid piece on board
  if (activePieces.length > 0) {
    const valid = [...activePieces]
      .filter(p => p.travelCount + diceNo <= 57)
      .sort((a, b) => b.travelCount - a.travelCount);
    if (valid.length > 0) return { piece: valid[0], isOpeningMove: false };
  }

  // 4. Open a home piece on 6
  if (diceNo === 6 && homePieces.length > 0) return { piece: homePieces[0], isOpeningMove: true };

  return null; // no valid move
}

/**
 * Main CPU turn thunk — fired by LudoBoardScreen when chancePlayer is a CPU.
 */
export const handleCpuTurn = playerNo => async (dispatch, getState) => {
  // thinking delay
  await cpuDelay(900);

  // Roll dice
  const diceNo = Math.floor(Math.random() * 6) + 1;
  playSound('dice_roll');
  dispatch(updateDiceNo({ diceNo }));

  // wait for dice animation
  await cpuDelay(700);

  const state         = getState();
  const playerPieces  = state.game[`player${playerNo}`];
  const currentPos    = selectCurrentPositions(state);
  const activePlayers = state.game.activePlayers || 4;

  const { turningPoints, victoryStart } = require('./PlotData');

  const result = pickBestPiece(playerNo, diceNo, playerPieces, currentPos, turningPoints, victoryStart);

  if (!result) {
    // No move — pass turn
    await cpuDelay(300);
    let next = playerNo + 1;
    if (next > activePlayers) next = 1;
    dispatch(unfreezeDice());
    dispatch(updatePlayerChance({ chancePlayer: next }));
    return;
  }

  const { piece, isOpeningMove } = result;

  if (isOpeningMove) {
    // ── Opening move: bring piece out of home ────────────────────────────────
    // Mirrors Pocket.js handlePress exactly:
    //   1. updatePlayerPieceValue → moves piece to startingPoint
    //   2. unfreezeDice           → resets isDiceRolled / touchDiceBlock
    // Then dispatch updatePlayerChance (same player) so turnKey increments
    // and LudoBoardScreen's useEffect fires again for the CPU's next roll.
    const startPos = startingPoints[playerNo - 1];
    dispatch(updatePlayerPieceValue({
      playerNo: `player${playerNo}`,
      pieceId:  piece.id,
      pos:      startPos,
      travelCount: 1,
    }));
    playSound('pile_move');
    dispatch(unfreezeDice());

    await cpuDelay(400);
    // dice=6: same CPU player rolls again
    dispatch(updatePlayerChance({ chancePlayer: playerNo }));

  } else {
    // ── Normal move: piece already on board ─────────────────────────────────
    // handleForwardThunk handles movement, collision, and next-turn dispatch.
    dispatch(handleForwardThunk(playerNo, piece.id, piece.pos));
  }
};
