const playerInitialState = [
  { id: 'A1', pos: 0, travelCount: 0 },
  { id: 'A2', pos: 0, travelCount: 0 },
  { id: 'A3', pos: 0, travelCount: 0 },
  { id: 'A4', pos: 0, travelCount: 0 },
];

const player2InitialState = [
  { id: 'B1', pos: 0, travelCount: 0 },
  { id: 'B2', pos: 0, travelCount: 0 },
  { id: 'B3', pos: 0, travelCount: 0 },
  { id: 'B4', pos: 0, travelCount: 0 },
];

const player3InitialState = [
  { id: 'C1', pos: 0, travelCount: 0 },
  { id: 'C2', pos: 0, travelCount: 0 },
  { id: 'C3', pos: 0, travelCount: 0 },
  { id: 'C4', pos: 0, travelCount: 0 },
];

const player4InitialState = [
  { id: 'D1', pos: 0, travelCount: 0 },
  { id: 'D2', pos: 0, travelCount: 0 },
  { id: 'D3', pos: 0, travelCount: 0 },
  { id: 'D4', pos: 0, travelCount: 0 },
];

export const initialState = {
  player1: playerInitialState,
  player2: player2InitialState,
  player3: player3InitialState,
  player4: player4InitialState,
  chancePlayer: 1,
  diceNo: 1,
  isDiceRolled: false,
  pileSelectionPlayer: -1,
  cellSelectionPlayer: -1,
  touchDiceBlock: false,
  currentPositions: [],
  fireworks: false,
  winner: null,
  // VS CPU mode state
  cpuPlayers: [],              // e.g. [3] for 2-player vs Yellow, [2,3,4] for 4-player
  gameMode: null,              // 'vscpu' | null
  activePlayers: 4,            // 2 or 4 (legacy count, kept for compatibility)
  activePlayersList: [1,2,3,4], // exact list of active player numbers for turn cycling
  turnKey: 0,                  // increments on every turn change (even same player after 6)
  entryFee: 0,
  prizeMoney: 0,
  // Online Multiplayer state
  roomId: null,
  localPlayerNo: 1,            // The player number representing this device
  onlineOpponents: [],         // E.g., [2] for a 2 player online game where we are P1
};
