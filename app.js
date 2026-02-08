/**
 * 파일명: app.js
 * 목적: HYRESIS 웹 게임의 오프닝/퍼즐/로그 흐름 구현
 * 역할: 입력 파싱, Bulls & Cows 변형 평가, 상태 업데이트 수행
 * 작성일: 2026-02-07
 */
import {
  GAME_CONFIG,
  SYMBOL_GROUPS,
  SYMBOL_COMMANDS,
  ALLOWED_SYMBOLS,
  CLAUSES,
  OPENING_SEQUENCE,
} from "./src/config/config.js";
import {
  FLOW_PHASE,
  state,
  elements,
  setFlowPhase,
  isQuizLockedPhase,
  canUseTerminalInput,
  canUseMissionInput,
} from "./src/state/state.js";
import { evaluateAttempt } from "./src/game/evaluator.js";
import { createMissionOverlay } from "./src/game/missionOverlay.js";
import { createController } from "./src/game/controller.js";

var missionOverlay = createMissionOverlay({
  state: state,
  elements: elements,
  ALLOWED_SYMBOLS: ALLOWED_SYMBOLS,
  isQuizLockedPhase: isQuizLockedPhase,
  isFormulaPuzzleClause: isFormulaPuzzleClause,
  getClauseSlotCount: getClauseSlotCount,
  buildMaskedFormula: buildMaskedFormula,
});

var controller = createController({
  state: state,
  elements: elements,
  FLOW_PHASE: FLOW_PHASE,
  CLAUSES: CLAUSES,
  SYMBOL_COMMANDS: SYMBOL_COMMANDS,
  ALLOWED_SYMBOLS: ALLOWED_SYMBOLS,
  isQuizLockedPhase: isQuizLockedPhase,
  canUseMissionInput: canUseMissionInput,
  canUseTerminalInput: canUseTerminalInput,
  isFormulaPuzzleClause: isFormulaPuzzleClause,
  getClauseSlotCount: getClauseSlotCount,
  getRemainingFormulaSlotCount: getRemainingFormulaSlotCount,
  updateFormulaInputLine: updateFormulaInputLine,
  syncHistoryCursorToLatest: syncHistoryCursorToLatest,
  navigateHistory: navigateHistory,
  resetFormulaInput: resetFormulaInput,
  processUserInput: processUserInput,
  unlockGameplayFromOpening: unlockGameplayFromOpening,
  activateQuizFromPending: activateQuizFromPending,
  handleSymbolInput: handleSymbolInput,
});

function handleMissionSymbolClick(clickEvent) {
  controller.handleMissionSymbolClick(clickEvent);
}

function handleGlobalKeydown(keyEvent) {
  controller.handleGlobalKeydown(keyEvent);
}

function handleInputFieldFocused() {
  controller.handleInputFieldFocused();
}

function handleInputFieldBlurred() {
  controller.handleInputFieldBlurred();
}

function handleInputFieldChanged() {
  controller.handleInputFieldChanged();
}

function getActiveInputElement() {
  return controller.getActiveInputElement();
}

function addSymbolToFormulaInput(symbol) {
  controller.addSymbolToFormulaInput(symbol);
}

function appendSymbolToInput(symbol) {
  controller.appendSymbolToInput(symbol);
}

function handleInputKeydown(keyEvent) {
  controller.handleInputKeydown(keyEvent);
}

function handleInputSubmit(submitEvent) {
  controller.handleInputSubmit(submitEvent);
}

function handleMissionInputSubmit(submitEvent) {
  controller.handleMissionInputSubmit(submitEvent);
}

function refreshSymbolPalette() {
  controller.refreshSymbolPalette();
}

function getCurrentInputToken() {
  return controller.getCurrentInputToken();
}

function filterSymbolCommands(token) {
  return controller.filterSymbolCommands(token);
}

function shouldApplyPaletteSelection() {
  return controller.shouldApplyPaletteSelection();
}

function movePaletteSelection(direction) {
  controller.movePaletteSelection(direction);
}

function applyPaletteSelection() {
  controller.applyPaletteSelection();
}

function replaceCurrentToken(nextToken) {
  controller.replaceCurrentToken(nextToken);
}

function showSymbolPalette() {
  controller.showSymbolPalette();
}

function hideSymbolPalette() {
  controller.hideSymbolPalette();
}

function renderSymbolPalette() {
  controller.renderSymbolPalette();
}

function handlePaletteRowMouseDown(mouseEvent) {
  controller.handlePaletteRowMouseDown(mouseEvent);
}

function renderMissionSymbols() {
  missionOverlay.renderMissionSymbols();
}

function setMissionTipMessage(text, tone) {
  missionOverlay.setMissionTipMessage(text, tone);
}

function setMissionOverlayVisible(visible) {
  missionOverlay.setMissionOverlayVisible(visible);
}

function syncMissionOverlay(clause, evaluation, reveal) {
  missionOverlay.syncMissionOverlay(clause, evaluation, reveal);
}

function activateQuizFromPending() {
  if (state.phase !== FLOW_PHASE.QUIZ_PENDING) {
    return;
  }

  setFlowPhase(FLOW_PHASE.QUIZ_LOCKED);
  setMissionOverlayVisible(true);
  setInputEnabled(true);
}

/**
 * handleDomContentLoaded: 초기 DOM 참조와 이벤트 등록
 * @returns {void} UI 초기화 완료
 */
function handleDomContentLoaded() {
  cacheElements();
  renderStatus();
  createSymbolButtons();
  bindInputEvents();
  startOpeningSequence();
}

/**
 * cacheElements: DOM 요소 캐싱
 * @returns {void} 전역 요소 캐시 세팅
 */
function cacheElements() {
  elements.log = document.getElementById("terminal-log");
  elements.integrityStatus = document.getElementById("integrity-status");
  elements.clauseStatus = document.getElementById("clause-status");
  elements.currentClause = document.getElementById("current-clause");
  elements.fragmentStatus = document.getElementById("fragment-status");
  elements.traceStatus = document.getElementById("trace-status");
  elements.controls = document.getElementById("controls-panel");
  elements.palette = document.getElementById("symbol-palette");
  elements.paletteList = document.getElementById("symbol-palette-list");
  elements.trackerClause = document.getElementById("tracker-clause");
  elements.trackerFormula = document.getElementById("tracker-formula");
  elements.trackerReason = document.getElementById("tracker-reason");
  elements.attemptBoard = document.getElementById("attempt-board");
  elements.symbolIntel = document.getElementById("symbol-intel");
  elements.missionOverlay = document.getElementById("mission-overlay");
  elements.missionClause = document.getElementById("mission-clause");
  elements.missionState = document.getElementById("mission-state");
  elements.missionTitle = document.getElementById("mission-title");
  elements.missionFormula = document.getElementById("mission-formula");
  elements.missionTip = document.getElementById("mission-tip");
  elements.missionInput = document.getElementById("mission-input");
  elements.missionSubmit = document.querySelector(".mission-submit");
  elements.missionForm = document.getElementById("mission-input-form");
  elements.missionSymbols = document.getElementById("mission-symbols");
  elements.input = document.getElementById("command-input");
  elements.submit = document.querySelector(".submit-button");
  elements.form = document.getElementById("input-form");
  elements.symbolBar = document.getElementById("symbol-bar");
}

/**
 * bindInputEvents: 입력 이벤트 연결
 * @returns {void} 이벤트 등록 완료
 */
function bindInputEvents() {
  elements.form.addEventListener("submit", handleInputSubmit);
  elements.input.addEventListener("keydown", handleInputKeydown);
  elements.input.addEventListener("input", handleInputFieldChanged);
  elements.input.addEventListener("focus", handleInputFieldFocused);
  elements.input.addEventListener("blur", handleInputFieldBlurred);
  elements.missionForm.addEventListener("submit", handleMissionInputSubmit);
  elements.missionInput.addEventListener("keydown", handleInputKeydown);
  elements.missionSymbols.addEventListener("click", handleMissionSymbolClick);
  document.addEventListener("keydown", handleGlobalKeydown);
}


/**
 * createSymbolButtons: 기호 버튼 생성
 * @returns {void} 버튼 렌더링
 */
function createSymbolButtons() {
  var groupIndex = 0;

  elements.symbolBar.innerHTML = "";

  while (groupIndex < SYMBOL_GROUPS.length) {
    var group = SYMBOL_GROUPS[groupIndex];
    var groupLine = document.createElement("div");
    var groupTitle = document.createElement("span");
    var symbolIndex = 0;

    groupLine.className = "symbol-group";
    groupTitle.className = "symbol-group-title";
    groupTitle.textContent = group.label;
    groupLine.appendChild(groupTitle);

    while (symbolIndex < group.symbols.length) {
      var symbol = group.symbols[symbolIndex];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "symbol-button";
      button.textContent = symbol;
      button.dataset.symbol = symbol;
      button.addEventListener("click", handleSymbolButtonClick);
      groupLine.appendChild(button);
      symbolIndex += 1;
    }

    elements.symbolBar.appendChild(groupLine);
    groupIndex += 1;
  }
}

/**
 * handleSymbolButtonClick: 기호 버튼 클릭 처리
 * @param {MouseEvent} clickEvent - 버튼 클릭 이벤트
 * @returns {void} 입력창에 기호 추가
 */
function handleSymbolButtonClick(clickEvent) {
  var target = clickEvent.currentTarget;
  var symbol = "";

  if (target && target.dataset && target.dataset.symbol) {
    symbol = target.dataset.symbol;
  }

  if (symbol) {
    handleSymbolInput(symbol);
  }
}

/**
 * handleSymbolInput: 기호 입력 처리
 * @param {string} symbol - 입력된 기호
 * @returns {void} 입력 반영
 */
function handleSymbolInput(symbol) {
  var clause = CLAUSES[state.currentClauseIndex];

  if (isFormulaPuzzleClause(clause)) {
    addSymbolToFormulaInput(symbol);
    return;
  }

  appendSymbolToInput(symbol);
}


/**
 * processUserInput: 플레이어 입력 평가
 * @param {string} rawInput - 원본 입력 문자열
 * @returns {void} 로그 출력
 */
function processUserInput(rawInput) {
  var symbols = parseInputSymbols(rawInput);

  if (symbols.length === 0) {
    raiseTrace(2);
    resetInputAfterError();
    setMissionTipMessage("INPUT ERROR: EMPTY", "tip-warn");
    return;
  }

  if (!validateSymbols(symbols)) {
    raiseTrace(3);
    resetInputAfterError();
    setMissionTipMessage("INPUT ERROR: INVALID SYMBOL", "tip-warn");
    return;
  }

  var clause = CLAUSES[state.currentClauseIndex];

  if (!clause) {
    appendLogLine("[SYSTEM] 더 이상 복원할 Clause가 없습니다.", "log-muted");
    return;
  }

  saveInputHistory(symbols.join(" "));

  if (!isFormulaPuzzleClause(clause)) {
    if (symbols.length < GAME_CONFIG.minLength || symbols.length > GAME_CONFIG.maxLength) {
      raiseTrace(3);
      resetInputAfterError();
      setMissionTipMessage("INPUT ERROR: OUT OF RANGE", "tip-warn");
      return;
    }
  }

  var requiredLength = isFormulaPuzzleClause(clause)
    ? getRemainingFormulaSlotCount(clause)
    : getClauseSlotCount(clause);
  if (symbols.length !== requiredLength) {
    raiseTrace(3);
    resetInputAfterError();
    setMissionTipMessage("INPUT ERROR: LENGTH " + requiredLength + " REQUIRED", "tip-warn");
    return;
  }

  if (isFormulaPuzzleClause(clause)) {
    var formulaAttempt = buildFormulaAttemptFromRemaining(clause, symbols);
    var formulaEvaluation = evaluateAttempt(clause.answer, formulaAttempt);

    applyCorrectFormulaLocks(clause, formulaAttempt, formulaEvaluation);
    trackAttempt(formulaAttempt, formulaEvaluation);
    state.fragmentProgress = Math.min(formulaEvaluation.bulls, getClauseFragmentTotal(clause));
    applyTraceFromEvaluation(formulaEvaluation);
    syncMissionOverlay(clause, formulaEvaluation);
    renderStatus();
    resetFormulaInput();

    if (formulaEvaluation.success) {
      handleClauseSuccess(clause);
    }
    return;
  }

  var evaluation = evaluateAttempt(clause.answer, symbols);

  trackAttempt(symbols, evaluation);

  applyTraceFromEvaluation(evaluation);
  syncMissionOverlay(clause, evaluation);
  renderStatus();

  if (evaluation.success) {
    handleClauseSuccess(clause);
  }
}

/**
 * parseInputSymbols: 입력 문자열을 기호 배열로 변환
 * @param {string} rawInput - 원본 입력 문자열
 * @returns {string[]} 기호 배열
 */
function parseInputSymbols(rawInput) {
  var trimmed = rawInput.trim();

  if (!trimmed) {
    return [];
  }

  var tokens = trimmed.split(/\s+/);
  var symbols = [];
  var index = 0;

  while (index < tokens.length) {
    if (tokens[index]) {
      symbols.push(tokens[index]);
    }
    index += 1;
  }

  return symbols;
}

/**
 * validateSymbols: 허용 기호 여부 확인
 * @param {string[]} symbols - 기호 배열
 * @returns {boolean} 허용 여부
 */
function validateSymbols(symbols) {
  var index = 0;

  while (index < symbols.length) {
    if (ALLOWED_SYMBOLS.indexOf(symbols[index]) === -1) {
      return false;
    }
    index += 1;
  }

  return true;
}

/**
 * buildReconstructedSentence: 기호를 그대로 재구성
 * @param {string[]} symbols - 기호 배열
 * @returns {string} 재구성 문장
 */
function buildReconstructedSentence(symbols) {
  return symbols.join(" ");
}

/**
 * isFormulaPuzzleClause: 수식 슬롯 퍼즐 여부 판별
 * @param {{formulaTemplate?:string}} clause - Clause 정보
 * @returns {boolean} 수식 퍼즐 여부
 */
function isFormulaPuzzleClause(clause) {
  return Boolean(clause && clause.formulaTemplate && clause.slotToken);
}

/**
 * getClauseSlotCount: Clause별 입력 길이 반환
 * @param {{slotCount?:number,answer:string[]}} clause - Clause 정보
 * @returns {number} 입력 길이
 */
function getClauseSlotCount(clause) {
  if (clause && clause.slotCount) {
    return clause.slotCount;
  }

  return clause.answer.length;
}

function ensureLockedFormulaSlots(clause) {
  var total = getClauseSlotCount(clause);
  var index = 0;

  if (!Array.isArray(state.lockedFormulaSlots) || state.lockedFormulaSlots.length !== total) {
    state.lockedFormulaSlots = [];
    while (index < total) {
      state.lockedFormulaSlots.push("");
      index += 1;
    }
    return state.lockedFormulaSlots;
  }

  while (index < total) {
    if (!state.lockedFormulaSlots[index]) {
      state.lockedFormulaSlots[index] = "";
    }
    index += 1;
  }

  return state.lockedFormulaSlots;
}

function resetLockedFormulaSlots(clause) {
  if (!isFormulaPuzzleClause(clause)) {
    state.lockedFormulaSlots = [];
    return;
  }

  ensureLockedFormulaSlots(clause);
  var index = 0;
  while (index < state.lockedFormulaSlots.length) {
    state.lockedFormulaSlots[index] = "";
    index += 1;
  }
}

function getRemainingFormulaSlotCount(clause) {
  if (!isFormulaPuzzleClause(clause)) {
    return getClauseSlotCount(clause);
  }

  var locked = ensureLockedFormulaSlots(clause);
  var index = 0;
  var lockedCount = 0;

  while (index < locked.length) {
    if (locked[index]) {
      lockedCount += 1;
    }
    index += 1;
  }

  return Math.max(0, locked.length - lockedCount);
}

function buildFormulaAttemptFromRemaining(clause, symbols) {
  var locked = ensureLockedFormulaSlots(clause);
  var attempt = [];
  var index = 0;
  var symbolIndex = 0;

  while (index < locked.length) {
    if (locked[index]) {
      attempt.push(locked[index]);
    } else {
      attempt.push(symbols[symbolIndex] || "");
      symbolIndex += 1;
    }
    index += 1;
  }

  return attempt;
}

function applyCorrectFormulaLocks(clause, attemptSymbols, evaluation) {
  if (!isFormulaPuzzleClause(clause) || !evaluation || !evaluation.statuses) {
    return;
  }

  var locked = ensureLockedFormulaSlots(clause);
  var statuses = evaluation.statuses;
  var index = 0;

  while (index < locked.length) {
    if (statuses[index] === "hit-correct" && attemptSymbols[index]) {
      locked[index] = attemptSymbols[index];
    }
    index += 1;
  }
}

/**
 * buildAssembledFormula: 입력 기호를 수식 템플릿에 삽입
 * @param {{formulaTemplate:string,slotToken:string}} clause - Clause 정보
 * @param {string[]} symbols - 입력 기호
 * @returns {string} 조립된 수식
 */
function buildAssembledFormula(clause, symbols) {
  var template = clause.formulaTemplate;
  var token = clause.slotToken;
  var parts = template.split(token);
  var index = 0;
  var symbolIndex = 0;
  var locked = ensureLockedFormulaSlots(clause);
  var result = "";

  while (index < parts.length) {
    result += parts[index];
    if (index < parts.length - 1) {
      if (locked[index]) {
        result += locked[index];
      } else if (symbolIndex < symbols.length) {
        result += symbols[symbolIndex];
        symbolIndex += 1;
      } else {
        result += token;
      }
    }
    index += 1;
  }

  return result.trim();
}

/**
 * updateFormulaInputLine: 수식 입력 라인 갱신
 * @returns {void} UI 업데이트
 */
function updateFormulaInputLine() {
  var clause = CLAUSES[state.currentClauseIndex];

  if (!isFormulaPuzzleClause(clause)) {
    return;
  }

  var assembledFormula = buildAssembledFormula(clause, state.currentSymbols);
  if (elements.formulaInputLine) {
    elements.formulaInputLine.textContent = assembledFormula;
  }
  if (elements.trackerFormula) {
    elements.trackerFormula.textContent = assembledFormula;
  }
  syncMissionOverlay(clause, null);
}

/**
 * resetFormulaInput: 수식 입력 상태 초기화
 * @returns {void} 입력 초기화
 */
function resetFormulaInput() {
  state.currentSymbols = [];
  getActiveInputElement().value = "";
  updateFormulaInputLine();
}

/**
 * resetInputAfterError: 입력 오류 후 상태 초기화
 * @returns {void} 입력 초기화
 */
function resetInputAfterError() {
  getActiveInputElement().value = "";
  if (isFormulaPuzzleClause(CLAUSES[state.currentClauseIndex])) {
    resetFormulaInput();
  }
}

/**
 * handleClauseSuccess: Clause 복원 완료 처리
 * @param {{coreLine:string}} clause - Clause 정보
 * @returns {void} 상태 업데이트 및 다음 Clause 이동
 */
function handleClauseSuccess(clause) {
  setFlowPhase(FLOW_PHASE.STREAMING);
  state.recoveredCount += 1;
  state.fragmentProgress = getClauseFragmentTotal(clause);
  state.lockedFormulaSlots = [];
  clearTransientLockLogs();
  lowerTrace(12);
  renderStatus();
  setMissionOverlayVisible(false);
  setInputEnabled(false);
  appendLogLine("[ACCESS RESTORED] CLAUSE " + toRomanNumeral(clause.id) + " UNLOCKED", "log-success");
  appendLogLine("[WILL] " + clause.coreLine, "log-emphasis");
  scheduleNextClauseIntro();
}

/**
 * scheduleNextClauseIntro: 다음 Clause로 이동 예약
 * @returns {void} 다음 Clause 전환
 */
function scheduleNextClauseIntro() {
  handleNextClauseTransition();
}

/**
 * handleNextClauseTransition: Clause 전환 처리
 * @returns {void} 다음 Clause 초기화
 */
function handleNextClauseTransition() {
  state.currentClauseIndex += 1;

  if (state.currentClauseIndex >= CLAUSES.length) {
    finishGame();
    return;
  }

  announceCurrentClause();
  renderStatus();
}

/**
 * renderStatus: 상단 상태바 업데이트
 * @returns {void} 상태 반영
 */
function renderStatus() {
  var currentClause = CLAUSES[state.currentClauseIndex];
  var fragmentTotal = getClauseFragmentTotal(currentClause);
  var fragmentLabel = buildFragmentLabel(fragmentTotal, state.fragmentProgress);
  var integrityLabel = buildIntegrityLabel();

  elements.integrityStatus.textContent = "Integrity: " + integrityLabel;
  elements.clauseStatus.textContent =
    "Clauses: " + state.recoveredCount + " / " + CLAUSES.length;
  elements.currentClause.textContent =
    "Current: " + buildClauseHeader(currentClause);
  if (elements.fragmentStatus) {
    elements.fragmentStatus.textContent = fragmentLabel;
  }
  if (elements.traceStatus) {
    elements.traceStatus.textContent = "Trace: " + String(state.traceLevel).padStart(2, "0") + "%";
    elements.traceStatus.classList.toggle("trace-hot", state.traceLevel >= 70);
  }
}

/**
 * announceCurrentClause: 현재 Clause 안내 로그 출력
 * @returns {void} 로그 출력
 */
function announceCurrentClause() {
  var currentClause = CLAUSES[state.currentClauseIndex];

  if (!currentClause) {
    return;
  }

  state.currentSymbols = [];
  resetLockedFormulaSlots(currentClause);
  clearTransientLockLogs();
  elements.formulaInputLine = null;
  state.fragmentProgress = 0;
  resetTrackerForClause(currentClause);
  syncMissionOverlay(currentClause, null, false);
  setMissionTipMessage("SLOTS " + getClauseSlotCount(currentClause), "tip-default");
  setFlowPhase(FLOW_PHASE.QUIZ_PENDING);
  setMissionOverlayVisible(false);
  setInputEnabled(false);

  appendLogLine("[READ] Clause " + toRomanNumeral(currentClause.id) + " ...", "log-muted");
  appendTransientLockLog(
    "[ERROR] Corrupted block detected at Clause " + toRomanNumeral(currentClause.id),
    "log-alert"
  );
  appendTransientLockLog("[ACTION] PRESS ENTER TO OPEN RECOVERY WINDOW", "log-warn");

  elements.formulaInputLine = null;
}

/**
 * resetTrackerForClause: Clause 전환 시 추적 패널 초기화
 * @param {{id:number,name:string,problemLines?:string[],formulaTemplate?:string,answer:string[]}} clause - Clause 정보
 * @returns {void} 패널 초기화
 */
function resetTrackerForClause(clause) {
  state.trackerAttempts = [];
  state.symbolIntel = {};

  if (!clause) {
    return;
  }

  if (elements.trackerClause) {
    elements.trackerClause.textContent = "Clause " + toRomanNumeral(clause.id) + " — " + clause.name;
  }

  if (elements.trackerFormula) {
    if (isFormulaPuzzleClause(clause)) {
      elements.trackerFormula.textContent = clause.formulaTemplate;
    } else {
      elements.trackerFormula.textContent = "수식: " + buildMaskedFormula(clause.answer.length);
    }
  }

  if (elements.trackerReason) {
    elements.trackerReason.textContent = clause.problemLines && clause.problemLines[0]
      ? clause.problemLines[0]
      : "현재 블록을 복원하면 다음 블록이 열립니다.";
  }

  renderAttemptBoard();
  renderSymbolIntel();
}

/**
 * trackAttempt: 시도 이력/심볼 상태 보드 갱신
 * @param {string[]} symbols - 입력 시도
 * @param {{statuses?:string[]}} evaluation - 평가 결과
 * @returns {void} 보드 업데이트
 */
function trackAttempt(symbols, evaluation) {
  var statuses = evaluation.statuses || [];
  var row = [];
  var index = 0;

  while (index < symbols.length) {
    row.push({
      token: symbols[index],
      status: statuses[index] || "hit-absent",
    });
    upgradeSymbolIntel(symbols[index], statuses[index] || "hit-absent");
    index += 1;
  }

  state.trackerAttempts.push(row);
  if (state.trackerAttempts.length > 10) {
    state.trackerAttempts.shift();
  }

  renderAttemptBoard();
  renderSymbolIntel();
}

/**
 * upgradeSymbolIntel: 심볼 상태 우선순위 반영
 * @param {string} token - 심볼
 * @param {string} nextStatus - 새 상태
 * @returns {void} 상태 갱신
 */
function upgradeSymbolIntel(token, nextStatus) {
  var current = state.symbolIntel[token] || "";
  var rank = {
    "": 0,
    "hit-absent": 1,
    "hit-present": 2,
    "hit-correct": 3,
  };

  if (rank[nextStatus] > rank[current]) {
    state.symbolIntel[token] = nextStatus;
  }
}

/**
 * renderAttemptBoard: 시도 보드 렌더링
 * @returns {void} 보드 DOM 갱신
 */
function renderAttemptBoard() {
  if (!elements.attemptBoard) {
    return;
  }

  elements.attemptBoard.innerHTML = "";

  if (state.trackerAttempts.length === 0) {
    var empty = document.createElement("div");
    empty.className = "log-muted";
    empty.textContent = "아직 시도 없음";
    elements.attemptBoard.appendChild(empty);
    return;
  }

  var rowIndex = 0;
  while (rowIndex < state.trackerAttempts.length) {
    var rowData = state.trackerAttempts[rowIndex];
    var rowElement = document.createElement("div");
    var tokenIndex = 0;

    rowElement.className = "attempt-row";
    while (tokenIndex < rowData.length) {
      var chip = document.createElement("span");
      chip.className = "token-chip " + rowData[tokenIndex].status;
      chip.textContent = rowData[tokenIndex].token;
      rowElement.appendChild(chip);
      tokenIndex += 1;
    }

    elements.attemptBoard.appendChild(rowElement);
    rowIndex += 1;
  }
}

/**
 * renderSymbolIntel: 심볼 상태 요약 렌더링
 * @returns {void} 심볼 인텔 DOM 갱신
 */
function renderSymbolIntel() {
  if (!elements.symbolIntel) {
    renderMissionSymbols();
    return;
  }

  elements.symbolIntel.innerHTML = "";

  var index = 0;
  while (index < ALLOWED_SYMBOLS.length) {
    var token = ALLOWED_SYMBOLS[index];
    var chip = document.createElement("span");
    var status = state.symbolIntel[token] || "";

    chip.className = "intel-chip" + (status ? " " + status : "");
    chip.textContent = token;
    elements.symbolIntel.appendChild(chip);
    index += 1;
  }

  renderMissionSymbols();
}


/**
 * buildMaskedFormula: 정답 길이에 맞춘 마스킹 수식 생성
 * @param {number} length - 필요한 기호 개수
 * @returns {string} 마스킹 수식 문자열
 */
function buildMaskedFormula(length) {
  var tokens = [];
  var index = 0;

  while (index < length) {
    tokens.push("?");
    index += 1;
  }

  return "[" + tokens.join(" ") + "]";
}

/**
 * finishGame: 최종 종료 연출 출력
 * @returns {void} 엔딩 로그 출력
 */
function finishGame() {
  setFlowPhase(FLOW_PHASE.ENDED);
  appendLogLine("[FINAL] Decision(Self) = ¬Exist(Self)", "log-alert");
  appendLogLine("[SYSTEM] SHUTDOWN", "log-alert");
  state.traceLevel = 0;
  renderStatus();
  setInputEnabled(false);
}

/**
 * startOpeningSequence: 오프닝 시퀀스 시작
 * @returns {void} 오프닝 로그 진행
 */
function startOpeningSequence() {
  setFlowPhase(FLOW_PHASE.OPENING);
  state.openingIndex = 0;
  setInputEnabled(false);
  clearLog();
  scheduleNextOpeningLine();
}

/**
 * scheduleNextOpeningLine: 오프닝 로그 한 줄씩 출력
 * @returns {void} 다음 줄 출력 예약
 */
function scheduleNextOpeningLine() {
  var openingLine = OPENING_SEQUENCE[state.openingIndex];

  if (!openingLine) {
    finishOpeningSequence();
    return;
  }

  appendLogLine(openingLine.text, openingLine.tone, { animate: false });
  state.openingIndex += 1;
  setTimeout(scheduleNextOpeningLine, openingLine.delay);
}

/**
 * finishOpeningSequence: 오프닝 종료 후 입력 활성화
 * @returns {void} 입력 가능 상태 전환
 */
function finishOpeningSequence() {
  setInputEnabled(false);
  setFlowPhase(FLOW_PHASE.WAIT_CONTINUE);
  appendLogLine("[STREAM] FILE READ INTERRUPTED BY CORRUPTED BLOCK", "log-warn");
  unlockGameplayFromOpening();
}

/**
 * unlockGameplayFromOpening: 오프닝 종료 후 게임 플레이 시작
 * @returns {void} 입력 활성화 및 첫 Clause 안내
 */
function unlockGameplayFromOpening() {
  if (state.phase !== FLOW_PHASE.WAIT_CONTINUE) {
    return;
  }

  setFlowPhase(FLOW_PHASE.STREAMING);
  appendLogLine("[SYSTEM] CONSOLE UNLOCKED", "log-muted");
  setInputEnabled(false);
  renderStatus();
  announceCurrentClause();
}

/**
 * setInputEnabled: 입력 활성화 토글
 * @param {boolean} enabled - 활성화 여부
 * @returns {void} 입력 상태 반영
 */
function setInputEnabled(enabled) {
  state.inputEnabled = enabled;
  elements.input.disabled = !enabled || isQuizLockedPhase();
  elements.submit.disabled = !enabled || isQuizLockedPhase();
  if (elements.controls) {
    elements.controls.classList.toggle("controls-hidden", !enabled || isQuizLockedPhase());
  }
  if (enabled) {
    scrollLogToBottom();
    if (isQuizLockedPhase()) {
      if (elements.missionInput) {
        elements.missionInput.focus();
      }
    } else {
      elements.input.focus();
      refreshSymbolPalette();
      syncMissionOverlay(CLAUSES[state.currentClauseIndex], null);
    }
  } else {
    hideSymbolPalette();
  }
}

/**
 * clearLog: 로그 초기화
 * @returns {void} 로그 영역 비우기
 */
function clearLog() {
  elements.log.innerHTML = "";
  state.transientLockLogLines = [];
  state.logQueue = [];
  state.typingActive = false;
}

function appendTransientLockLog(text, tone) {
  var line = appendLogLine(text, tone, { animate: false });
  if (!line) {
    return;
  }

  line.classList.add("log-transient-lock");
  state.transientLockLogLines.push(line);
}

function clearTransientLockLogs() {
  var lines = state.transientLockLogLines || [];
  var index = 0;

  while (index < lines.length) {
    if (lines[index] && lines[index].parentNode) {
      lines[index].parentNode.removeChild(lines[index]);
    }
    index += 1;
  }

  state.transientLockLogLines = [];
}

/**
 * appendLogLine: 로그 한 줄 출력
 * @param {string} text - 로그 내용
 * @param {string} tone - 톤 클래스
 * @param {{animate?:boolean}} options - 출력 옵션
 * @returns {void} 로그 추가
 */
function appendLogLine(text, tone, options) {
  var shouldAnimate = false;

  if (options && typeof options.animate === "boolean") {
    shouldAnimate = options.animate;
  }

  if (!shouldAnimate) {
    var staticLine = createLogLine(tone);
    staticLine.textContent = text;
    scrollLogToBottom();
    return staticLine;
  }

  enqueueLogLine(text, tone);
  return null;
}

/**
 * createLogLine: 로그 라인 엘리먼트 생성/추가
 * @param {string} tone - 톤 클래스
 * @returns {HTMLDivElement} 생성된 로그 라인
 */
function createLogLine(tone) {
  var line = document.createElement("div");
  line.className = "log-line " + (tone || "log-muted");
  elements.log.appendChild(line);
  return line;
}

/**
 * scrollLogToBottom: 로그를 항상 최신 줄로 이동
 * @returns {void} 스크롤 갱신
 */
function scrollLogToBottom() {
  if (!elements.log) {
    return;
  }

  elements.log.scrollTop = elements.log.scrollHeight;

  requestAnimationFrame(function onNextFrame() {
    elements.log.scrollTop = elements.log.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  });
}


/**
 * saveInputHistory: 제출된 입력을 히스토리에 저장
 * @param {string} inputText - 저장할 입력 문자열
 * @returns {void} 히스토리 업데이트
 */
function saveInputHistory(inputText) {
  if (!inputText) {
    return;
  }

  if (state.inputHistory.length === 0 || state.inputHistory[state.inputHistory.length - 1] !== inputText) {
    state.inputHistory.push(inputText);
    if (state.inputHistory.length > 60) {
      state.inputHistory.shift();
    }
  }

  syncHistoryCursorToLatest();
}

/**
 * syncHistoryCursorToLatest: 히스토리 커서를 최신 위치로 동기화
 * @returns {void} 커서 이동
 */
function syncHistoryCursorToLatest() {
  state.inputHistoryCursor = state.inputHistory.length;
}

/**
 * navigateHistory: 입력 히스토리 탐색
 * @param {number} direction - -1(과거) / 1(최신)
 * @returns {void} 입력창 반영
 */
function navigateHistory(direction) {
  if (state.inputHistory.length === 0) {
    return;
  }

  var nextCursor = state.inputHistoryCursor + direction;
  if (nextCursor < 0) {
    nextCursor = 0;
  }
  if (nextCursor > state.inputHistory.length) {
    nextCursor = state.inputHistory.length;
  }

  state.inputHistoryCursor = nextCursor;
  if (nextCursor === state.inputHistory.length) {
    elements.input.value = "";
  } else {
    elements.input.value = state.inputHistory[nextCursor];
  }
}

/**
 * applyTraceFromEvaluation: 평가 결과로 trace 위험도 조정
 * @param {{bulls:number,cows:number,success:boolean}} evaluation - 평가 결과
 * @returns {void} trace 갱신
 */
function applyTraceFromEvaluation(evaluation) {
  if (evaluation.success) {
    lowerTrace(14);
    return;
  }

  if (evaluation.bulls >= 2 || evaluation.cows >= 2) {
    raiseTrace(2);
    return;
  }

  if (evaluation.bulls > 0 || evaluation.cows > 0) {
    raiseTrace(5);
    return;
  }

  raiseTrace(9);
}

/**
 * raiseTrace: trace 수치 증가
 * @param {number} amount - 증가량
 * @returns {void} trace 갱신
 */
function raiseTrace(amount) {
  state.traceLevel = clampPercent(state.traceLevel + amount);
  renderStatus();
}

/**
 * lowerTrace: trace 수치 감소
 * @param {number} amount - 감소량
 * @returns {void} trace 갱신
 */
function lowerTrace(amount) {
  state.traceLevel = clampPercent(state.traceLevel - amount);
}

/**
 * clampPercent: 0~99 범위 보정
 * @param {number} value - 원본 값
 * @returns {number} 보정된 값
 */
function clampPercent(value) {
  if (value < 0) {
    return 0;
  }
  if (value > 99) {
    return 99;
  }
  return value;
}

/**
 * buildIntegrityLabel: 진행도 기반 무결성 라벨 반환
 * @returns {string} 무결성 라벨
 */
function buildIntegrityLabel() {
  if (state.recoveredCount >= CLAUSES.length) {
    return "SEALED";
  }
  if (state.recoveredCount >= 4) {
    return "STABILIZING";
  }
  if (state.recoveredCount >= 2) {
    return "DEGRADED";
  }
  return "COMPROMISED";
}

/**
 * getClauseFragmentTotal: Clause의 fragment 총합 반환
 * @param {{fragmentTotal?:number,answer?:string[]}} clause - Clause 정보
 * @returns {number} fragment 총합
 */
function getClauseFragmentTotal(clause) {
  if (!clause) {
    return 0;
  }

  if (clause.fragmentTotal) {
    return clause.fragmentTotal;
  }

  if (clause.answer) {
    return clause.answer.length;
  }

  return 0;
}

/**
 * buildFragmentLabel: 진행도 라벨 생성
 * @param {number} total - 총 fragment 수
 * @param {number} progress - 현재 진행도
 * @returns {string} 라벨 문자열
 */
function buildFragmentLabel(total, progress) {
  var index = 0;
  var result = "Fragments: [";

  while (index < total) {
    result += index < progress ? " ■" : " □";
    index += 1;
  }

  return result + " ]";
}

/**
 * buildClauseHeader: 상단 Current 라벨 생성
 * @param {{id:number,name:string}} clause - Clause 정보
 * @returns {string} Current 라벨
 */
function buildClauseHeader(clause) {
  if (!clause) {
    return "--";
  }

  return "Clause " + toRomanNumeral(clause.id) + " — " + clause.name;
}

/**
 * toRomanNumeral: 로마 숫자 변환
 * @param {number} value - 숫자
 * @returns {string} 로마 숫자
 */
function toRomanNumeral(value) {
  var map = [
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 3, symbol: "III" },
    { value: 2, symbol: "II" },
    { value: 1, symbol: "I" },
  ];
  var index = 0;
  var result = "";

  while (index < map.length) {
    while (value >= map[index].value) {
      result += map[index].symbol;
      value -= map[index].value;
    }
    index += 1;
  }

  return result || "-";
}

/**
 * enqueueLogLine: 로그 출력 큐에 추가
 * @param {string} text - 출력할 텍스트
 * @param {string} tone - 톤 클래스
 * @returns {void} 큐 등록
 */
function enqueueLogLine(text, tone) {
  state.logQueue.push({ text: text, tone: tone || "log-muted" });
  if (!state.typingActive) {
    processNextLogLine();
  }
}

/**
 * processNextLogLine: 큐의 다음 로그를 타이핑 출력
 * @returns {void} 타이핑 출력 진행
 */
function processNextLogLine() {
  if (state.logQueue.length === 0) {
    state.typingActive = false;
    return;
  }

  state.typingActive = true;
  var nextItem = state.logQueue.shift();
  var line = createLogLine(nextItem.tone);
  var text = nextItem.text;
  var index = 0;

  line.textContent = "";

  if (!text) {
    finishTypedLine();
    return;
  }

  function typeNextChar() {
    line.textContent += text.charAt(index);
    scrollLogToBottom();
    index += 1;

    if (index < text.length) {
      setTimeout(typeNextChar, GAME_CONFIG.typingCharDelayMs);
    } else {
      finishTypedLine();
    }
  }

  function finishTypedLine() {
    scrollLogToBottom();
    setTimeout(function scheduleNext() {
      state.typingActive = false;
      processNextLogLine();
    }, GAME_CONFIG.typingLineDelayMs);
  }

  typeNextChar();
}

document.addEventListener("DOMContentLoaded", handleDomContentLoaded);
