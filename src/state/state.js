import { GAME_CONFIG } from "../config/config.js";

export const FLOW_PHASE = {
  OPENING: "OPENING",
  WAIT_CONTINUE: "WAIT_CONTINUE",
  STREAMING: "STREAMING",
  QUIZ_LOCKED: "QUIZ_LOCKED",
  ENDED: "ENDED",
};

export const state = {
  currentClauseIndex: 0,
  recoveredCount: 0,
  openingIndex: 0,
  inputEnabled: false,
  currentSymbols: [],
  logQueue: [],
  typingActive: false,
  typingEnabled: GAME_CONFIG.typingEnabled,
  fragmentProgress: 0,
  traceLevel: 2,
  inputHistory: [],
  inputHistoryCursor: -1,
  phase: FLOW_PHASE.OPENING,
  paletteVisible: false,
  paletteItems: [],
  paletteActiveIndex: 0,
  trackerAttempts: [],
  symbolIntel: {},
  missionVisible: false,
};

export const elements = {
  log: null,
  integrityStatus: null,
  clauseStatus: null,
  currentClause: null,
  fragmentStatus: null,
  traceStatus: null,
  controls: null,
  palette: null,
  paletteList: null,
  trackerClause: null,
  trackerFormula: null,
  trackerReason: null,
  attemptBoard: null,
  symbolIntel: null,
  missionOverlay: null,
  missionClause: null,
  missionState: null,
  missionTitle: null,
  missionFormula: null,
  missionCopy: null,
  missionTip: null,
  missionInput: null,
  missionSubmit: null,
  missionForm: null,
  missionSymbols: null,
  missionLog: null,
  input: null,
  submit: null,
  form: null,
  symbolBar: null,
  formulaInputLine: null,
};

export function setFlowPhase(phase) {
  state.phase = phase;
}

export function isQuizLockedPhase() {
  return state.phase === FLOW_PHASE.QUIZ_LOCKED;
}

export function canUseTerminalInput() {
  return state.inputEnabled && state.phase === FLOW_PHASE.STREAMING;
}

export function canUseMissionInput() {
  return state.inputEnabled && isQuizLockedPhase();
}
