import { SafeSpots, StarSpots, startingPoints, turningPoints, victoryStart } from "../../helpers/PlotData";
import { selectCurrentPositions, selectDiceNo } from "./gameSelectors";
import { announceWinner, disableTouch, enableCellSelection, enablePileSelection, unfreezeDice, updateDiceNo, updateFireworks, updatePlayerChance, updatePlayerPieceValue } from "./gameSlice";
import { playSound } from '../../helpers/SoundUtility';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function checkWinningCriteria(pieces) {
  for (let piece of pieces) {
    if (piece.travelCount < 57) {
      return false; // If any piece has travelCount less than 57, return false
    }

  }
  return true; // if all piece have travelCount >= 57, return true
}

export const handleDiceRollThunk = (newDiceNo, player) => async (dispatch, getState) => {
  const state = getState();
  const playerPieces = state.game[`player${ player }`];
  const activePlayersList = state.game.activePlayersList || [1,2,3,4];
  const localPlayerNo = state.game.localPlayerNo;
  const isLocalPlayer = player === localPlayerNo;

  dispatch(updateDiceNo({ diceNo: newDiceNo }));

  const isAnyPieceAlive = playerPieces?.findIndex(i => i.pos !== 0 && i.pos !== 57);
  const isAnyPieceLocked = playerPieces?.findIndex(i => i.pos === 0);

  const getNextChance = (current) => {
    const idx = activePlayersList.indexOf(current);
    if (idx === -1) return activePlayersList[0];
    return activePlayersList[(idx + 1) % activePlayersList.length];
  };

  if (isAnyPieceAlive === -1) {
    if (newDiceNo === 6) {
      // Only enable pile selection for the local player — opponent selects on their own device
      if (isLocalPlayer) {
        dispatch(enablePileSelection({ playerNo: player }));
      }
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

    if (isLocalPlayer) {
      // Enable selection only for the local player — opponent will do this on their device
      if (newDiceNo === 6) {
        dispatch(enablePileSelection({ playerNo: player }));
      }
      dispatch(enableCellSelection({ playerNo: player }));
    }
    // For opponent's turn: do nothing here — they will select & emit move_piece
  }
}

export const handleMoveFromPocketThunk = (value) => async (dispatch) => {
  let playerNo = value?.id?.slice(0, 1);
  switch (playerNo) {
    case 'A': playerNo = 'player1'; break;
    case 'B': playerNo = 'player2'; break;
    case 'C': playerNo = 'player3'; break;
    default: playerNo = 'player4'; break;
  }
  dispatch(
    updatePlayerPieceValue({
      playerNo: playerNo,
      pieceId: value.id,
      pos: startingPoints[parseInt(playerNo.match(/\d+/)[0], 10) - 1],
      travelCount: 1,
    }),
  );
  dispatch(unfreezeDice());
};


// Get next player from the active players list (supports non-contiguous players like [1,3])
function getNextPlayer(currentPlayer, activePlayersList) {
  const idx = activePlayersList.indexOf(currentPlayer);
  if (idx === -1) return activePlayersList[0]; // fallback
  return activePlayersList[(idx + 1) % activePlayersList.length];
}

export const handleForwardThunk = (playerNo, id, pos) => async (dispatch, getState) => {
  const state = getState();
  const plottedPieces = selectCurrentPositions(state);
  const diceNo = selectDiceNo(state);
  const activePlayersList = state.game.activePlayersList || [1,2,3,4];

  const piecesAtPosition = plottedPieces?.filter((item) => item.pos === pos);

  let alpha = playerNo === 1 ? "A" : playerNo === 2 ? "B" : playerNo === 3 ? "C" : "D";

  const piece = piecesAtPosition[piecesAtPosition.findIndex(item => item.id.slice(0, 1) === alpha)]

  // Safety guard — piece not found in currentPositions (e.g. still at home pos=0)
  if (!piece) {
    dispatch(unfreezeDice());
    return;
  }

  dispatch(disableTouch())
  let finalPath = piece.pos;
  const beforePlayerPiece = state.game[`player${ playerNo }`].find(
    item => item.id === id
  )

  let travelCount = beforePlayerPiece.travelCount

  for (let i = 0; i < diceNo; i++) {
    const updatedPosition = getState();
    const playerPiece = updatedPosition.game[`player${ playerNo }`].find(
      item => item.id === id
    )

    let path = playerPiece.pos + 1;

    if (turningPoints.includes(path) && turningPoints[playerNo - 1] === path) {
      path = victoryStart[playerNo - 1]
    }
    if (path === 53) {
      path = 1
    }

    finalPath = path;
    travelCount += 1

    dispatch(
      updatePlayerPieceValue({
        playerNo: `player${ playerNo }`,
        pieceId: playerPiece.id,
        pos: path,
        travelCount: travelCount
      })
    )
    playSound('pile_move')
    await delay(200);
  }

  // Ensure state is updated after movement
  const updatedState = getState()
  const updatedPlottedPieces = selectCurrentPositions(updatedState)

  // CheckColliding
  const finalPlot = updatedPlottedPieces?.filter((item) => item.pos === finalPath);

  const ids = finalPlot?.map(item => item.id[0])
  const uniqueIds = new Set(ids);
  const areDifferentIds = uniqueIds.size > 1

  if (SafeSpots.includes(finalPath) || StarSpots.includes(finalPath)) {
    playSound("safe_spot")

  }

  if (areDifferentIds && !SafeSpots.includes(finalPlot[0].pos) && !StarSpots.includes(finalPlot[0].pos)) {
    const enemyPiece = finalPlot.find(pieceItem => pieceItem.id[0] !== id[0])
    const enemyId = enemyPiece.id[0]

    let no = enemyId === "A" ? 1 : enemyId === "B" ? 2 : enemyId === "C" ? 3 : 4;

    let backwardPath = startingPoints[no - 1]
    let i = enemyPiece.pos;
    playSound("collide")

    while (i !== backwardPath) {
      dispatch(
        updatePlayerPieceValue({
          playerNo: `player${ no }`,
          pieceId: enemyPiece.id,
          pos: i,
          travelCount: 0
        })
      )
      await delay(0.4); // consider reducing delay if possible

      i--;

      if (i === 0) {
        i = 52; // Reset i to 52 if it reaches 0
      }
    }
    dispatch(
      updatePlayerPieceValue({
        playerNo: `player${ no }`,
        pieceId: enemyPiece.id,
        pos: 0,
        travelCount: 0
      })
    )

    dispatch(unfreezeDice())
    return
  }

  // Check Six Dice
  if (diceNo === 6 || travelCount === 57) {
    dispatch(updatePlayerChance({ chancePlayer: playerNo }));
    if (travelCount === 57) {
      playSound("home_win")
      const finalPlayerState = getState()
      const playerAllPieces = finalPlayerState.game[`player${ playerNo }`];

      if (checkWinningCriteria(playerAllPieces)) {
        dispatch(announceWinner(playerNo))
        playSound("cheer", true)
        return;
      }
      dispatch(updateFireworks(true));
      dispatch(unfreezeDice())
      return

    }
  } else {
    const chancePlayer = getNextPlayer(playerNo, activePlayersList);
    dispatch(updatePlayerChance({ chancePlayer }))
  }
}